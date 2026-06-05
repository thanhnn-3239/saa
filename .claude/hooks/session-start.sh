#!/bin/bash
# SessionStart hook: install everything a session needs to lint, type-check,
# run the Vitest unit suite and the Playwright E2E suite.
#
# Async mode: the session starts immediately while this installs in the
# background, so startup is fast. The agent should wait for installs to finish
# before the first test/lint run (deps are usually cached anyway).
#
# Runs in BOTH the web (Claude Code on the web) and on a personal machine /
# other devices, so E2E is reproducible everywhere. It is idempotent: when
# deps and browsers are already present these commands are near-instant.
set -euo pipefail

# Async: returned on the first stdout line, then work continues in background.
echo '{"async": true, "asyncTimeout": 600000}'

cd "${CLAUDE_PROJECT_DIR:-.}"

# Use the pnpm version pinned in package.json's "packageManager" field.
corepack enable >/dev/null 2>&1 || true

# Node deps. Plain `install` (not `--frozen-lockfile`) keeps the cached
# container layer reusable across small lockfile drifts.
pnpm install

# Playwright browser + OS libraries for E2E. `--with-deps` pulls the apt
# packages Chromium needs (works in the web container and on Linux with sudo);
# it falls back to a browser-only install when the system libs can't be
# installed without root (e.g. a locked-down personal machine or macOS).
pnpm exec playwright install --with-deps chromium \
  || pnpm exec playwright install chromium
