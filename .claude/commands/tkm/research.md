---
description: Research technical solutions, architectures, best practices
argument-hint: [topic]
---

Activate the `research` skill via `researcher` subagent.

<topic>$ARGUMENTS</topic>

For technical docs, use `docs-seeker` skill (context7.com / llms.txt).
For codebase-specific research, use `scout` first to locate files.

Deliverable: report at `plans/reports/researcher-{date}-{slug}.md` with:
- Findings + sources
- Trade-offs comparison
- Recommended approach
- Unresolved questions (list at end)
