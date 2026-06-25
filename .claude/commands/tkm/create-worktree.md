---
description: Create isolated git worktree for parallel development
argument-hint: [branch name]
---

Activate the `worktree` skill.

<branch>$ARGUMENTS</branch>

Creates a git worktree in a sibling directory. Useful for:
- Working on multiple features in parallel without context switching
- Running long-running tasks (tests, builds) in isolation
- Reviewing PRs without disturbing current work

After creation, returns the worktree path for `cd` navigation.
