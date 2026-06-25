---
description: Initialize, update, and summarize project documentation in ./docs
argument-hint: [init|update|summarize|llms]
---

Activate the `docs` skill.

<mode>$ARGUMENTS</mode>

Standard docs structure:
- docs/project-overview-pdr.md
- docs/code-standards.md
- docs/codebase-summary.md
- docs/system-architecture.md
- docs/deployment-guide.md
- docs/project-roadmap.md

Keep each file under 800 lines (see .sk.json doc.maxLoc). Split large files.
