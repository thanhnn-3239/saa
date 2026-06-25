# Codebase Understanding Phase

## Core Activities

### Parallel Scout Agents
- Use `/tkm:scan-codebase ext` (preferred) or `/tkm:scan-codebase` (fallback) skill invocation to search the codebase for files needed to complete the task
- Each scout locates files needed for specific task aspects
- Wait for all scout agents to report back before analysis
- Efficient for finding relevant code across large codebases

### Project Docs Discovery

> See plan `260513-1134-takumi-load-docs-context` (Phase 01 + Phase 02).
> The Phase 02 hook surfaces a paths-only docs index to subagents at spawn time.
> This section is for the planner phase itself — how the planner navigates `docs/`.

Discovery procedure (no hardcoded filenames — adapt to whatever exists):

1. **Step A — Survey:** `ls docs/` to see what's there. If `docs/` doesn't exist, skip silently and move on; do not block planning.
2. **Step B — Rebuild-spec shape:** if `docs/specs/feature-list.md` exists, that's the canonical entry point for feature work.
   - Read `docs/specs/feature-list.md` first → find the feature relevant to the task.
   - Drill into `docs/specs/features/F###_*/spec.md` for that feature only.
   - Top-level cross-cutting context lives in `docs/specs/system-overview.md`, `data-model.md`, `screen-flow.md`, etc. — read only what the task touches.
3. **Step C — Flat-topic shape:** if `docs/*.md` files exist at the top level (no `specs/` subdir), browse by topic. Read whichever file matches the task domain.
4. **Step D — Workflow rules:** if `claude/rules/development-rules.md` exists, read it for kit-wide workflow rules (always at `claude/rules/`, never under `docs/`).
5. **Rule:** don't read everything. Read what's relevant to the task.

### Environment Analysis
- Review development environment setup
- Analyze dotenv files and configuration
- Identify required dependencies
- Understand build and deployment processes

### Pattern Recognition
- Study existing patterns in codebase
- Identify conventions and architectural decisions
- Note consistency in implementation approaches
- Understand error handling patterns

### Integration Planning
- Identify how new features integrate with existing architecture
- Map dependencies between components
- Understand data flow and state management
- Consider backward compatibility

## Best Practices

- Start with docs discovery before diving into code
- Use scouts for targeted file discovery (complementary to docs review — never a substitute)
- Document patterns found for consistency
- Note any inconsistencies or technical debt
- Consider impact on existing features
