---
name: tkm:manage-docs
description: "Keep the blueprint in sync with what was built — analyze codebase and manage project documentation. Use for init, update, and summarize workflows."
argument-hint: "init|update|summarize"
metadata:
  author: takumi-agent-kit
  version: "2.0.1"
---

# Keeping the Ledger

A workshop without records is a workshop that cannot teach, cannot be handed over, and cannot recover from loss.
The ledger records what was built, why it was built that way, and what changed — so the next craftsman does not start blind.

Analyze codebase and manage project documentation through scouting, analysis, and structured doc generation.

**IMPORTANT:** Invoke "/tkm:organize-files" skill to organize the outputs.

## Default (No Arguments)

If invoked without arguments, use `AskUserQuestion` to present available documentation operations:

| Operation | Description |
|-----------|-------------|
| `init` | Analyze codebase & create initial docs |
| `update` | Analyze changes & update docs |
| `summarize` | Quick codebase summary |

Present as options via `AskUserQuestion` with header "Documentation Operation", question "What would you like to do?".

## Subcommands

| Subcommand | Reference | Purpose |
|------------|-----------|---------|
| `/tkm:manage-docs init` | `references/init-workflow.md` | Analyze codebase and create initial documentation |
| `/tkm:manage-docs update` | `references/update-workflow.md` | Analyze codebase and update existing documentation |
| `/tkm:manage-docs summarize` | `references/summarize-workflow.md` | Quick analysis and update of codebase summary |

## Routing

Parse `$ARGUMENTS` first word:
- `init` → Load `references/init-workflow.md`
- `update` → Load `references/update-workflow.md`
- `summarize` → Load `references/summarize-workflow.md`
- empty/unclear → AskUserQuestion (do not auto-run `init`)

## Shared Context

Documentation lives in `./docs` directory:
```
./docs
├── project-overview-pdr.md
├── code-standards.md
├── codebase-summary.md
├── design-guidelines.md
├── deployment-guide.md
├── system-architecture.md
└── project-roadmap.md
```

Use `docs/` directory as the source of truth for documentation.

**IMPORTANT**: **Do not** start implementing code.

## References

- `references/init-workflow.md` — Initial documentation creation flow
- `references/update-workflow.md` — Documentation update flow (Phase 2 detects `docs/specs/`)
- `references/summarize-workflow.md` — Quick codebase summary flow
- Canonical docs mapping: `claude/skills/_shared/docs-canonical-mapping.md` — layered model (`docs/` vs `docs/specs/`) and surgical-edit policy
- Shared `doc-writer` prompt template: `claude/skills/takumi/references/subagent-patterns.md` → `## Documentation`
