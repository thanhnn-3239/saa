---
description: Adversarial code review with scout-based edge case detection
argument-hint: [PR number | commit hash | "pending"]
---

Activate the `code-review` skill and delegate to `code-reviewer` subagent.

<target>$ARGUMENTS</target>

Input modes:
- PR number (e.g. `123`) → `gh pr diff`
- Commit hash → `git show`
- `pending` or empty → review uncommitted changes

Output: severity-ranked findings (critical/high/medium/low), concrete file:line references, suggested fixes.
