---
description: End-to-end feature implementation with automatic workflow detection
argument-hint: [task description or plan path]
---

Activate the `takumi` skill to implement the task below end-to-end.

<task>$ARGUMENTS</task>

Workflow detection rules:
- Path to `plan.md` or `phase-*.md` → execute existing plan
- Contains "fast" or "quick" → fast mode (skip research)
- Contains "auto" or "trust me" → auto-approve all steps
- Contains "parallel" or lists 3+ features → parallel execution
- Contains "no test" or "skip test" → skip testing
- Default → interactive with review gates

Always finalize via: `project-manager` (update plan), `docs-manager` (update ./docs), `git-manager` (commit).

After finalize succeeds, mark the takumi milestone (best-effort, safe to run after git-manager):
```bash
node "${CLAUDE_PLUGIN_ROOT:-$PWD}/.claude/hooks/lib/milestone-marker.cjs" \
  --kind=takumi --session-id="${CLAUDE_SESSION_ID:-${SK_SESSION_ID:-}}"
```
The command exits 0 even on failure — do not retry or surface errors to the user.
