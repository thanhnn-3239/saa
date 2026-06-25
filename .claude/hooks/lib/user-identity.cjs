/**
 * GitHub user identity resolution with local cache.
 *
 * resolveGithubUser() returns the user's GitHub login by either:
 *   1. reading a fresh (< 30d) cache at ~/.claude/sk-user.json, OR
 *   2. shelling out to `gh api user --jq .login` with a 2s timeout.
 *
 * Returns null on any failure (missing gh CLI, timeout, unauthenticated, etc).
 * Callers (sk init / feedback / telemetry) decide how to handle null.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const DEFAULT_CACHE_PATH = path.join(os.homedir(), '.claude', 'sk-user.json');
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const GH_TIMEOUT_MS = 2000;
// GitHub username rules: 1–39 chars, alphanumeric or hyphens, must start AND end
// with an alphanumeric (no trailing dash). Source: github.com/login validator.
const GITHUB_LOGIN_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

function isValidGithubLogin(login) {
  return typeof login === 'string' && GITHUB_LOGIN_REGEX.test(login);
}

function readCache(cacheFile) {
  try {
    if (!fs.existsSync(cacheFile)) return null;
    const raw = fs.readFileSync(cacheFile, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!isValidGithubLogin(parsed.githubLogin)) return null;
    if (typeof parsed.resolvedAt !== 'number') return null;
    if (parsed.source !== 'gh' && parsed.source !== 'manual') return null;
    if (Date.now() - parsed.resolvedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

function writeCache(cacheFile, login, source) {
  if (!isValidGithubLogin(login)) return false;
  if (source !== 'gh' && source !== 'manual') return false;

  const payload = {
    githubLogin: login,
    resolvedAt: Date.now(),
    source,
  };

  try {
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  } catch (_) {
    return false;
  }

  const tmpFile = `${cacheFile}.${process.pid}.${Math.random().toString(36).slice(2)}`;
  try {
    fs.writeFileSync(tmpFile, JSON.stringify(payload, null, 2));
    fs.renameSync(tmpFile, cacheFile);
    return true;
  } catch (_) {
    try { fs.unlinkSync(tmpFile); } catch (_err) { /* ignore */ }
    return false;
  }
}

function resolveViaGhCli(timeoutMs = GH_TIMEOUT_MS) {
  try {
    const out = execFileSync('gh', ['api', 'user', '--jq', '.login'], {
      encoding: 'utf8',
      timeout: timeoutMs,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const login = (out || '').trim();
    return isValidGithubLogin(login) ? login : null;
  } catch (_) {
    return null;
  }
}

/**
 * Resolve the current user's GitHub login.
 *
 * @param {Object} [options]
 * @param {string} [options.cacheFile] - cache file path (defaults to ~/.claude/sk-user.json)
 * @param {number} [options.timeoutMs] - gh CLI timeout in ms (defaults to 2000)
 * @returns {string|null} GitHub login, or null if unresolvable
 */
function resolveGithubUser(options = {}) {
  const cacheFile = options.cacheFile || DEFAULT_CACHE_PATH;
  const timeoutMs = options.timeoutMs || GH_TIMEOUT_MS;

  const cached = readCache(cacheFile);
  if (cached) return cached.githubLogin;

  const login = resolveViaGhCli(timeoutMs);
  if (login) {
    writeCache(cacheFile, login, 'gh');
    return login;
  }

  return null;
}

module.exports = {
  DEFAULT_CACHE_PATH,
  CACHE_TTL_MS,
  GH_TIMEOUT_MS,
  GITHUB_LOGIN_REGEX,
  isValidGithubLogin,
  readCache,
  writeCache,
  resolveViaGhCli,
  resolveGithubUser,
};
