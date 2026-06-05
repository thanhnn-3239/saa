#!/bin/bash
# SessionStart hook for Claude Code on the web.
# Installs everything a session needs to lint, type-check, and run the
# Vitest unit suite and the Playwright E2E suite.
#
# Runs synchronously so dependencies are guaranteed ready before the agent
# starts (no race with the first test/lint command).
set -euo pipefail

# Only run in the remote (web) environment; local machines manage their own deps.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# Use the pnpm version pinned in package.json's "packageManager" field.
corepack enable >/dev/null 2>&1 || true

# Node deps. Plain `install` (not `--frozen-lockfile`) so the cached container
# layer stays reusable across small lockfile drifts.
pnpm install

# Playwright browsers + OS libraries for E2E. `--with-deps` pulls the apt
# packages Chromium needs in a headless container; it falls back to a
# browser-only install if the system libs can't be installed without root.
pnpm exec playwright install --with-deps chromium \
  || pnpm exec playwright install chromium
