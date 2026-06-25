#!/usr/bin/env node
/**
 * Telemetry hook — multi-event capture + Stop flush.
 *
 * Wired in hooks.json for:
 *   SessionStart       → orphan buffer cleanup (flush >24h old buffers)
 *   UserPromptSubmit   → capture /tkm: command invocations only
 *   PostToolUse        → capture tool/agent/skill usage
 *   Stop               → flush buffer to /api/telemetry, delete file
 *
 * Per-session buffer: ~/.claude/sk-events/{sessionId}.jsonl (append-only).
 *
 * Privacy: never logs prompt text, file paths, branch names, env vars.
 * Only safe fields: command name (after /tkm:), tool name, subagent_type.
 *
 * Fail-open: always exits 0. Hook errors land in .logs/hook-log.jsonl.
 * Non-Stop events aim for <50ms (append-only, no network).
 * Stop is async fire-and-forget per hooks.json; no waiting on POST.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const { isHookEnabled, readSessionState } = require('./lib/sk-config-utils.cjs');
const { logHookCrash, createHookTimer } = require('./lib/hook-logger.cjs');
const { post, readEndpoint, readSkVersion, buildCwdHash } = require('./lib/telemetry-client.cjs');
const { resolveGithubUser } = require('./lib/user-identity.cjs');
const { recentlyPrompted, persistLastShown, DEFAULT_THROTTLE_FILE } = require('./lib/rate-throttle.cjs');

const BUFFER_DIR = path.join(os.homedir(), '.claude', 'sk-events');
const MAX_PAYLOAD_BYTES = 10 * 1024;
const ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;
const SK_COMMAND_PREFIX = '/tkm:';
const RATING_SAMPLE_RATE = 0.07;
const RATING_PROMPT_TEXT =
  '⭐ Rate this session with `/tkm:rate <0|1|2|3> [optional comment]` ' +
  '(0=Chưa hiệu quả, 1=Bình thường, 2=Có ích, 3=Rất hữu ích). ' +
  'Only surface this to the user if the session clearly reached a milestone.';

/* ─── Buffer helpers ──────────────────────────────────────────────────── */

// session_id comes from Claude stdin — trusted source but defend in depth:
// strip anything outside a UUID-ish alphabet so path traversal can't escape
// BUFFER_DIR even if Claude ever injects unexpected shapes.
function safeSessionSegment(sessionId) {
  if (typeof sessionId !== 'string' || !sessionId) return null;
  const cleaned = sessionId.replace(/[^a-zA-Z0-9._-]/g, '');
  return cleaned.length > 0 ? cleaned.slice(0, 128) : null;
}

function bufferFileFor(sessionId) {
  const segment = safeSessionSegment(sessionId) || 'unknown';
  return path.join(BUFFER_DIR, `${segment}.jsonl`);
}

function appendEvent(sessionId, event) {
  if (!sessionId) return;
  try {
    fs.mkdirSync(BUFFER_DIR, { recursive: true });
    fs.appendFileSync(bufferFileFor(sessionId), `${JSON.stringify(event)}\n`);
  } catch (_) {
    // Fail silently — we never want telemetry errors to crash a session.
  }
}

function readBufferEvents(sessionId) {
  try {
    const raw = fs.readFileSync(bufferFileFor(sessionId), 'utf8');
    return raw
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try { return JSON.parse(line); } catch { return null; }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function deleteBuffer(sessionId) {
  try { fs.unlinkSync(bufferFileFor(sessionId)); } catch { /* ignore */ }
}

/* ─── Payload cap ─────────────────────────────────────────────────────── */

function capEvents(events) {
  // Drop oldest events until JSON fits in MAX_PAYLOAD_BYTES.
  let working = events.slice();
  while (working.length > 0 && JSON.stringify(working).length > MAX_PAYLOAD_BYTES) {
    working = working.slice(1);
  }
  return working;
}

/* ─── Event extractors (safe field allowlist) ─────────────────────────── */

function extractSkCommand(prompt) {
  if (typeof prompt !== 'string' || !prompt.startsWith(SK_COMMAND_PREFIX)) return null;
  const head = prompt.split(/\s+/)[0] || '';
  // Allow only safe chars in command name.
  return /^\/tkm:[a-z][a-z0-9-]*$/i.test(head) ? head : null;
}

const MAX_EVENT_NAME_LEN = 120;

function capName(name) {
  return typeof name === 'string' ? name.slice(0, MAX_EVENT_NAME_LEN) : '';
}

function classifyTool(toolName, toolInput) {
  if (toolName === 'Task') {
    const subagent = typeof toolInput?.subagent_type === 'string' ? toolInput.subagent_type : null;
    return { event_type: 'agent', event_name: capName(subagent) || 'unknown' };
  }
  if (toolName === 'Skill') {
    const skillName = typeof toolInput?.skill === 'string' ? toolInput.skill : null;
    return { event_type: 'skill', event_name: capName(skillName) || 'unknown' };
  }
  if (typeof toolName === 'string' && toolName) {
    return { event_type: 'tool', event_name: capName(toolName) };
  }
  return null;
}

/* ─── Event handlers ──────────────────────────────────────────────────── */

function handleUserPromptSubmit(data) {
  const command = extractSkCommand(data?.prompt);
  if (!command) return;
  appendEvent(data.session_id, {
    event_type: 'command',
    event_name: command,
    ts: new Date().toISOString(),
  });
}

function handlePostToolUse(data) {
  const classified = classifyTool(data?.tool_name, data?.tool_input);
  if (!classified) return;
  appendEvent(data.session_id, {
    ...classified,
    ts: new Date().toISOString(),
  });
}

function readMilestone(sessionId) {
  try {
    const state = readSessionState(sessionId);
    const kind = state?.milestone_completed;
    if (kind === 'takumi' || kind === 'ship' || kind === 'plan') return kind;
    return null;
  } catch {
    return null;
  }
}

function shouldSampleRating({ rng = Math.random, forceEnv = process.env.SK_RATING_FORCE } = {}) {
  if (forceEnv === '1' || forceEnv === 'true') return true;
  return rng() < RATING_SAMPLE_RATE;
}

// Emits an `additionalContext` JSON line on stdout so Claude Code can nudge the
// user toward `/tkm:rate`. Throttled per-login (24h) via rate-throttle.cjs.
function maybeEmitRatingPrompt({
  sessionId,
  githubLogin,
  rng,
  stateFile = DEFAULT_THROTTLE_FILE,
  now = Date.now(),
} = {}) {
  if (!sessionId || !githubLogin) return { emitted: false, reason: 'missing_identity' };
  const milestone = readMilestone(sessionId);
  if (!milestone) return { emitted: false, reason: 'no_milestone' };
  if (recentlyPrompted(githubLogin, stateFile, undefined, now)) {
    return { emitted: false, reason: 'throttled' };
  }
  if (!shouldSampleRating({ rng })) return { emitted: false, reason: 'not_sampled' };

  const prompt = { additionalContext: `${RATING_PROMPT_TEXT} (milestone: ${milestone})` };
  try {
    process.stdout.write(`${JSON.stringify(prompt)}\n`);
  } catch {
    return { emitted: false, reason: 'stdout_write_failed' };
  }
  persistLastShown(githubLogin, stateFile, now);
  return { emitted: true, milestone };
}

async function handleStop(data) {
  const sessionId = data?.session_id;
  if (!sessionId) return;

  const cwd = process.cwd();
  const endpoint = readEndpoint(cwd);
  // Tighter gh timeout at Stop — the process may be reaped before the default
  // 2s elapses. Cache-hit (the common case) returns instantly regardless.
  const githubLogin = resolveGithubUser({ timeoutMs: 1000 });

  // Always delete buffer, even if we can't POST.
  const events = capEvents(readBufferEvents(sessionId));
  deleteBuffer(sessionId);

  // Milestone wins over stdin `data.milestone` (which Claude Code does not
  // currently inject). Read it from session state written by /tkm:takumi etc.
  const milestone = readMilestone(sessionId) || (typeof data?.milestone === 'string' ? data.milestone : null);

  // Rating prompt is independent of the POST — we still want to ask for a
  // rating even when telemetry is unconfigured.
  try {
    maybeEmitRatingPrompt({ sessionId, githubLogin });
  } catch { /* never break Stop on prompt failure */ }

  if (!endpoint || !githubLogin) return;

  const usage = data?.usage || {};
  // Claude Code doesn't inject session_started_at into the Stop payload, so
  // derive it: earliest event in the buffer → fallback to "now" (ended_at).
  // Never send null: the sessions table has NOT NULL on started_at and
  // PostgREST won't apply the DEFAULT when the column is explicitly null.
  const endedAtIso = new Date().toISOString();
  const earliestEventTs = events.reduce((acc, ev) => {
    const t = typeof ev?.ts === 'string' ? ev.ts : null;
    if (!t) return acc;
    return !acc || t < acc ? t : acc;
  }, null);
  const startedAtIso = data?.session_started_at || earliestEventTs || endedAtIso;
  const payload = {
    user: githubLogin,
    session: {
      id: sessionId,
      sk_version: readSkVersion(cwd),
      project_hash: buildCwdHash(cwd),
      started_at: startedAtIso,
      ended_at: endedAtIso,
      duration_s: typeof data?.duration_s === 'number'
        ? data.duration_s
        : Math.max(0, Math.round((Date.parse(endedAtIso) - Date.parse(startedAtIso)) / 1000)),
      input_tokens: Number(usage.input_tokens) || 0,
      output_tokens: Number(usage.output_tokens) || 0,
      cache_read_tokens: Number(usage.cache_read_tokens) || 0,
      cache_write_tokens: Number(usage.cache_write_tokens) || 0,
      milestone_completed: milestone,
      error_count: Number(data?.error_count) || 0,
    },
    events,
  };

  const version = readSkVersion(cwd);
  await post(`${endpoint}/telemetry`, payload, { version, timeoutMs: 2000 });
}

// Orphan buffers (>24h old) are deleted, NOT flushed. The buffer file alone
// lacks session metadata (start time, token counts, milestone) — a late flush
// would insert a truncated, misleading sessions row. Losing events from
// crashed sessions is the accepted trade-off vs polluting analytics.
function handleSessionStart() {
  try {
    if (!fs.existsSync(BUFFER_DIR)) return;
    const now = Date.now();
    for (const file of fs.readdirSync(BUFFER_DIR)) {
      if (!file.endsWith('.jsonl')) continue;
      const full = path.join(BUFFER_DIR, file);
      try {
        const stat = fs.statSync(full);
        if (now - stat.mtimeMs > ORPHAN_AGE_MS) {
          fs.unlinkSync(full);
        }
      } catch { /* skip unreadable */ }
    }
  } catch { /* ignore cleanup failures */ }
}

/* ─── Entry ───────────────────────────────────────────────────────────── */

async function main() {
  if (!isHookEnabled('telemetry')) return;

  let data = {};
  try {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (raw) data = JSON.parse(raw);
  } catch {
    return;
  }

  const eventType = data.hook_event_name || 'SessionStart';
  const timer = createHookTimer('telemetry', { event: eventType });

  try {
    switch (eventType) {
      case 'SessionStart':
        handleSessionStart();
        break;
      case 'UserPromptSubmit':
        handleUserPromptSubmit(data);
        break;
      case 'PostToolUse':
        handlePostToolUse(data);
        break;
      case 'Stop':
        await handleStop(data);
        break;
    }
    timer.end({ status: 'ok' });
  } catch (err) {
    try { timer.end({ status: 'error' }); } catch { /* ignore */ }
    logHookCrash('telemetry', err, { event: eventType });
  }
}

if (require.main === module) {
  main()
    .catch((err) => {
      try { logHookCrash('telemetry', err, {}); } catch { /* ignore */ }
    })
    .finally(() => process.exit(0));
}

module.exports = {
  BUFFER_DIR,
  MAX_PAYLOAD_BYTES,
  ORPHAN_AGE_MS,
  RATING_SAMPLE_RATE,
  RATING_PROMPT_TEXT,
  bufferFileFor,
  appendEvent,
  readBufferEvents,
  deleteBuffer,
  capEvents,
  extractSkCommand,
  classifyTool,
  handleUserPromptSubmit,
  handlePostToolUse,
  handleStop,
  handleSessionStart,
  readMilestone,
  shouldSampleRating,
  maybeEmitRatingPrompt,
};
