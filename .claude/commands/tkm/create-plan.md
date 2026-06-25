---
description: Intelligent plan creation with prompt enhancement
argument-hint: [task description]
---

Activate the `sk-plan` skill to create an implementation plan for the task below.

<task>$ARGUMENTS</task>

Routing:
- Subcommand `fast` → `/tkm:create-plan:fast` (no research)
- Subcommand `hard` → `/tkm:create-plan:hard` (full research)
- Subcommand `parallel` → `/tkm:create-plan:parallel` (parallel-executable phases)
- Subcommand `two` → `/tkm:create-plan:two` (2 approaches)
- Default → analyze complexity and route

Save plans to `plans/{date}-{slug}/` per project naming convention. Do NOT implement.

After the plan file is written, mark the plan milestone (best-effort, safe to run last):
```bash
node "${CLAUDE_PLUGIN_ROOT:-$PWD}/.claude/hooks/lib/milestone-marker.cjs" \
  --kind=plan --session-id="${CLAUDE_SESSION_ID:-${SK_SESSION_ID:-}}"
```
The command exits 0 even on failure — do not retry or surface errors.
