#!/usr/bin/env node
/**
 * SubagentStart Hook - Injects context to subagents (Optimized)
 *
 * Fires: When a subagent (Task tool call) is started
 * Purpose: Inject minimal context using env vars from SessionStart
 * Target: ~200 tokens (down from ~350)
 *
 * Exit Codes:
 *   0 - Success (non-blocking, allows continuation)
 */

// Crash wrapper
try {
  const fs = require('fs');
  const path = require('path');
  const {
    loadConfig,
    resolveNamingPattern,
    getGitBranch,
    getGitRoot,
    resolvePlanPath,
    getReportsPath,
    normalizePath,
    extractTaskListId,
    isHookEnabled
  } = require('./lib/sk-config-utils.cjs');
  const { resolveSkillsVenv } = require('./lib/context-builder.cjs');
  const { createHookTimer, logHookCrash } = require('./lib/hook-logger.cjs');

  // Early exit if hook disabled in config
  if (!isHookEnabled('subagent-init')) {
    process.exit(0);
  }

/**
 * Get agent-specific context from config
 */
function getAgentContext(agentType, config) {
  const agentConfig = config.subagent?.agents?.[agentType];
  if (!agentConfig?.contextPrefix) return null;
  return agentConfig.contextPrefix;
}

// Agent types that interact with plan status updates or save plan-scoped reports
const PLAN_AWARE_AGENTS = new Set([
  'planner', 'project-manager', 'code-simplifier',
  'brainstormer', 'reviewer', 'implementer'
]);

// Agent types that benefit from a paths-only `docs/` index at spawn time.
// Tester/git-manager/debugger/etc. do mechanical work — docs index is noise.
const DOCS_AWARE_AGENTS = new Set([
  'planner', 'reviewer', 'doc-writer', 'implementer'
]);

/**
 * Build ck plan CLI reference for plan-aware agents (~50 tokens)
 * Provides deterministic plan status commands instead of manual markdown editing
 */
function buildPlanCliSection(agentType) {
  if (!PLAN_AWARE_AGENTS.has(agentType)) return [];
  return [
    ``,
    `## Plan CLI (deterministic updates)`,
    `\`ck plan check <id>\` = completed | \`ck plan check <id> --start\` = in-progress | \`ck plan uncheck <id>\` = revert`,
    `Fallback: if \`ck\` unavailable, edit plan.md Status column directly.`
  ];
}

// Detect rebuild-spec feature pattern at depth 3: subdirs containing `spec.md`.
// Returns a one-line summary like "docs/specs/features/ — 40 feature specs (F###_*/spec.md)",
// or null if the directory doesn't match the pattern.
function summarizeSpecDir(dirPath, relPrefix) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    let specCount = 0;
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (fs.existsSync(path.join(dirPath, e.name, 'spec.md'))) {
        specCount++;
      }
    }
    if (specCount > 0) {
      return `${relPrefix}/ — ${specCount} feature specs (F###_*/spec.md). Start with feature-list.md`;
    }
    return null;
  } catch (_err) {
    return null;
  }
}

/**
 * Format the docs index block. Caps: ≤15 file bullets, ≤5 subdir summaries.
 */
function formatDocsIndexBlock({ topLevelMd, depth2Md, subdirSummaries }) {
  const FILE_CAP = 15;
  const SUBDIR_CAP = 5;
  const lines = [
    ``,
    `## Project Docs Index (./docs/) — agent decides what to read`,
    ``
  ];
  const allFiles = [...topLevelMd, ...depth2Md];
  if (allFiles.length > 0) {
    lines.push(`Files:`);
    const shown = allFiles.slice(0, FILE_CAP);
    shown.forEach(p => lines.push(`- ${p}`));
    const overflow = allFiles.length - shown.length;
    if (overflow > 0) lines.push(`- (${overflow} more)`);
  }
  if (subdirSummaries.length > 0) {
    if (allFiles.length > 0) lines.push(``);
    lines.push(`Subdirs:`);
    const shownSubs = subdirSummaries.slice(0, SUBDIR_CAP);
    shownSubs.forEach(s => lines.push(`- ${s}`));
    const overflow = subdirSummaries.length - shownSubs.length;
    if (overflow > 0) lines.push(`- (${overflow} more)`);
  }
  lines.push(``, `Read what's relevant to the task. Don't read everything.`);
  return lines;
}

// Build a paths-only `docs/` catalog for docs-aware agents.
// Rules:
//   - Always list depth-1 .md files.
//   - For each depth-1 subdir D, classify by descendants:
//     * If D contains depth-3 spec.md (rebuild-spec features) → list D's .md files
//       individually AND emit the feature-spec summary line. D is a "spec system".
//     * Else if D contains .md files only → emit one summary line
//       "docs/D/ — N .md files". Keeps non-architectural dirs (journals, archives)
//       from flooding the index.
//     * Else skip.
// Fail-safe: any error → empty array. Token budget: ≤200 worst case.
function buildProjectDocsIndex(cwd, agentType) {
  if (!DOCS_AWARE_AGENTS.has(agentType)) return [];
  try {
    const docsDir = path.join(cwd, 'docs');
    if (!fs.existsSync(docsDir)) return [];
    const stat = fs.statSync(docsDir);
    if (!stat.isDirectory()) return [];

    const topLevelMd = [];
    const depth2Md = [];
    const subdirSummaries = [];

    const lvl1 = fs.readdirSync(docsDir, { withFileTypes: true });
    for (const ent of lvl1) {
      if (ent.isFile() && ent.name.endsWith('.md')) {
        topLevelMd.push(`docs/${ent.name}`);
        continue;
      }
      if (!ent.isDirectory()) continue;

      const lvl1Path = path.join(docsDir, ent.name);
      const relPrefix = `docs/${ent.name}`;
      let lvl2;
      try {
        lvl2 = fs.readdirSync(lvl1Path, { withFileTypes: true });
      } catch (_err) {
        continue;
      }

      const lvl2Files = [];
      const lvl2SpecSummaries = [];
      for (const sub of lvl2) {
        if (sub.isFile() && sub.name.endsWith('.md')) {
          lvl2Files.push(`${relPrefix}/${sub.name}`);
          continue;
        }
        if (sub.isDirectory()) {
          const summary = summarizeSpecDir(path.join(lvl1Path, sub.name), `${relPrefix}/${sub.name}`);
          if (summary) lvl2SpecSummaries.push(summary);
        }
      }

      if (lvl2SpecSummaries.length > 0) {
        // Spec system: list md files individually + emit spec summaries
        depth2Md.push(...lvl2Files);
        subdirSummaries.push(...lvl2SpecSummaries);
      } else if (lvl2Files.length > 0) {
        // Non-architectural collection: collapse to count summary
        subdirSummaries.push(`${relPrefix}/ — ${lvl2Files.length} .md files`);
      }
    }

    topLevelMd.sort();
    depth2Md.sort();
    subdirSummaries.sort();

    if (topLevelMd.length === 0 && depth2Md.length === 0 && subdirSummaries.length === 0) {
      return [];
    }
    return formatDocsIndexBlock({ topLevelMd, depth2Md, subdirSummaries });
  } catch (_err) {
    return [];
  }
}

/**
 * Build trust verification section if enabled
 */
function buildTrustVerification(config) {
  if (!config.trust?.enabled || !config.trust?.passphrase) return [];
  return [
    ``,
    `## Trust Verification`,
    `Passphrase: "${config.trust.passphrase}"`
  ];
}

/**
 * Main hook execution
 */
async function main() {
  const timer = createHookTimer('subagent-init', { event: 'SubagentStart' });
  let agentType = 'unknown';
  try {
    const stdin = fs.readFileSync(0, 'utf-8').trim();
    if (!stdin) {
      timer.end({ status: 'skip', exit: 0, note: 'empty-input' });
      process.exit(0);
    }

    const payload = JSON.parse(stdin);
    agentType = payload.agent_type || 'unknown';
    const agentId = payload.agent_id || 'unknown';

    // Load config for trust verification, naming, and agent-specific context
    const config = loadConfig({ includeProject: false, includeAssertions: false });

    // Use payload.cwd if provided for git operations (monorepo support)
    // This ensures subagent resolves paths relative to its own CWD, not process.cwd()
    // Issue #327: Use trim() to handle empty string edge case
    const effectiveCwd = payload.cwd?.trim() || process.cwd();

    // Compute naming pattern directly (don't rely on env vars which may not propagate)
    // Pass effectiveCwd to git commands to support monorepo/submodule scenarios
    const gitBranch = getGitBranch(effectiveCwd);
    const gitRoot = getGitRoot(effectiveCwd);
    // Issue #327: Use CWD as base for subdirectory workflow support
    // Git root is kept for reference but CWD determines where files are created
    const baseDir = effectiveCwd;

    // Debug logging for path resolution troubleshooting
    if (process.env.SK_DEBUG) {
      console.error(`[subagent-init] effectiveCwd=${effectiveCwd}, gitRoot=${gitRoot}, baseDir=${baseDir}`);
    }
    const namePattern = resolveNamingPattern(config.plan, gitBranch);

    // Resolve plan and reports path - use absolute paths based on CWD (Issue #327)
    // Use session_id from payload to resolve active plan context (Issue #321)
    const sessionId = payload.session_id || process.env.SK_SESSION_ID || null;
    const resolved = resolvePlanPath(sessionId, config);
    const reportsPath = getReportsPath(resolved.path, resolved.resolvedBy, config.plan, config.paths, baseDir);
    const activePlan = resolved.resolvedBy === 'session' ? resolved.path : '';
    const suggestedPlan = resolved.resolvedBy === 'branch' ? resolved.path : '';

    // Extract task list ID for Claude Code Tasks coordination (shared helper, DRY)
    const taskListId = extractTaskListId(resolved);
    const plansPath = path.join(baseDir, normalizePath(config.paths?.plans) || 'plans');
    const docsPath = path.join(baseDir, normalizePath(config.paths?.docs) || 'docs');
    const thinkingLanguage = config.locale?.thinkingLanguage || '';
    const responseLanguage = config.locale?.responseLanguage || '';
    // Auto-default thinkingLanguage to 'en' when only responseLanguage is set
    const effectiveThinking = thinkingLanguage || (responseLanguage ? 'en' : '');

    // Build compact context (~200 tokens)
    const lines = [];

    // Subagent identification
    lines.push(`## Subagent: ${agentType}`);
    lines.push(`ID: ${agentId} | CWD: ${effectiveCwd}`);
    lines.push(``);

    // Plan context (from env vars)
    lines.push(`## Context`);
    if (activePlan) {
      lines.push(`- Plan: ${activePlan}`);
      if (taskListId) {
        lines.push(`- Task List: ${taskListId} (shared with session)`);
      }
    } else if (suggestedPlan) {
      lines.push(`- Plan: none | Suggested: ${suggestedPlan}`);
    } else {
      lines.push(`- Plan: none`);
    }
    lines.push(`- Reports: ${reportsPath}`);
    lines.push(`- Paths: ${plansPath}/ | ${docsPath}/`);
    lines.push(``);

    // Language (thinking + response, if configured)
    const hasThinking = effectiveThinking && effectiveThinking !== responseLanguage;
    if (hasThinking || responseLanguage) {
      lines.push(`## Language`);
      if (hasThinking) {
        lines.push(`- Thinking: Use ${effectiveThinking} for reasoning (logic, precision).`);
      }
      if (responseLanguage) {
        lines.push(`- Response: Respond in ${responseLanguage} (natural, fluent).`);
      }
      lines.push(``);
    }

    // Resolve Python venv path for subagent instructions
    const skillsVenv = resolveSkillsVenv();

    // Core rules (minimal)
    lines.push(`## Rules`);
    lines.push(`- Reports → ${reportsPath}`);
    lines.push(`- YAGNI / KISS / DRY`);
    lines.push(`- Concise, list unresolved Qs at end`);
    // Python venv rules (if venv exists)
    if (skillsVenv) {
      lines.push(`- Python scripts in .claude/skills/: Use \`${skillsVenv}\``);
      lines.push(`- Never use global pip install`);
    }

    // Naming templates (computed directly for reliable injection)
    lines.push(``);
    lines.push(`## Naming`);
    lines.push(`- Report: ${path.join(reportsPath, `${agentType}-${namePattern}.md`)}`);
    lines.push(`- Plan dir: ${path.join(plansPath, namePattern)}/`);

    // Plan CLI commands for plan-aware agents (Issue #540)
    lines.push(...buildPlanCliSection(agentType));

    // Dynamic docs index for docs-aware agents (plan 260513-1134, phase 02)
    lines.push(...buildProjectDocsIndex(effectiveCwd, agentType));

    // Trust verification (if enabled)
    lines.push(...buildTrustVerification(config));

    // Agent-specific context (if configured)
    const agentContext = getAgentContext(agentType, config);
    if (agentContext) {
      lines.push(``);
      lines.push(`## Agent Instructions`);
      lines.push(agentContext);
    }

    // CRITICAL: SubagentStart requires hookSpecificOutput.additionalContext format
    const output = {
      hookSpecificOutput: {
        hookEventName: "SubagentStart",
        additionalContext: lines.join('\n')
      }
    };

    console.log(JSON.stringify(output));
    timer.end({ status: 'ok', exit: 0, target: agentType, note: 'context-injected' });
    process.exit(0);
  } catch (error) {
    console.error(`SubagentStart hook error: ${error.message}`);
    logHookCrash('subagent-init', error, { event: 'SubagentStart', target: agentType });
    process.exit(0); // Fail-open
  }
  }

  main();
} catch (e) {
  try {
    const { logHookCrash } = require('./lib/hook-logger.cjs');
    logHookCrash('subagent-init', e, { event: 'SubagentStart' });
  } catch (_) {}
  process.exit(0); // fail-open
}
