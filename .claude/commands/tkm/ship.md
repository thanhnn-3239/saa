---
description: Ship pipeline — merge main, test, review, commit, push, PR
argument-hint: [target branch, default main]
---

Activate the `ship` skill.

<target-branch>${ARGUMENTS:-main}</target-branch>

Pipeline:
1. Rebase or merge target branch into current
2. Run `bun run validate` (typecheck + lint + test)
3. Delegate to `code-reviewer` subagent
4. Commit with conventional message
5. Push branch
6. Open PR via `gh pr create`

Return PR URL at end.

After the PR is opened, mark the ship milestone (best-effort, safe to run last):
```bash
node "${CLAUDE_PLUGIN_ROOT:-$PWD}/.claude/hooks/lib/milestone-marker.cjs" \
  --kind=ship --session-id="${CLAUDE_SESSION_ID:-${SK_SESSION_ID:-}}"
```
The command exits 0 even on failure — do not retry or surface errors.
