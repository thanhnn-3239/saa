---
description: Simplify and refine code for clarity without changing behavior
argument-hint: [scope: recent|file-path|function]
---

Activate the `simplify` skill via `code-simplifier` subagent.

<scope>${ARGUMENTS:-recent changes}</scope>

Preserve ALL functionality. Focus on:
- Extract repeated blocks
- Rename for clarity
- Remove dead code and unused vars
- Flatten nested conditionals
- Consolidate duplicated logic

Report before/after complexity metrics.
