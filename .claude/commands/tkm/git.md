---
description: Git operations with conventional commits and intelligent staging
argument-hint: [commit message or action]
---

Activate the `git` skill for git operations.

<action>$ARGUMENTS</action>

Behavior:
- Auto-detect commit type and scope from changed files
- Split commits when changes span multiple concerns
- Use conventional commit format (feat/fix/refactor/docs/test/chore/perf)
- Never force-push to main
- Never skip hooks without explicit user approval
- No AI references in commit messages
