# Workshop Delegation

The master craftsman knows which work belongs to which hands.
These are the delegation patterns for each stage of the workshop.

## Task Tool Pattern

```
Task(subagent_type="[type]", prompt="[task description]", description="[brief]")
```

## Study Stage (Research)

```
Task(subagent_type="researcher", prompt="Research [topic]. Report ≤150 lines.", description="Research [topic]")
```
- Spawn multiple researchers in parallel for different topics
- Keep reports ≤150 lines with citations

## Scout Stage

```
Task(subagent_type="scout", prompt="Find files related to [feature] in codebase", description="Scout [feature]")
```
- Use `/tkm:scan-codebase ext` (preferred) or `/tkm:scan-codebase` (fallback)

## Blueprint Stage (Planning)

```
Task(subagent_type="planner", prompt="Create implementation plan based on reports: [reports]. Save to [path]", description="Plan [feature]")
```
- Input: researcher and scout reports
- Output: `plan.md` + `phase-XX-*.md` files

## UI Craft Stage

```
Task(subagent_type="ui-ux-designer", prompt="Implement [feature] UI per ./docs/design-guidelines.md", description="UI [feature]")
```
- For frontend work
- Follow design guidelines

## Tempering Stage (Testing)

```
Task(subagent_type="tester", prompt="Run test suite for plan phase [phase-name]", description="Temper [phase]")
```
- Must achieve 100% pass rate

## Debugging

```
Task(subagent_type="debugger", prompt="Analyze failures: [details]", description="Debug [issue]")
```
- Use when tempering reveals failures
- Provides root cause analysis

## Master's Inspection (Code Review)

```
Task(subagent_type="reviewer", prompt="Review changes for [phase]. Check security, performance, YAGNI/KISS/DRY. Return score (X/10), critical defects, concerns, refinements.", description="Inspect [phase]")
```

## Plan Sync-back (Project Manager)

```
Task(subagent_type="project-manager", prompt="Run full sync-back in [plan-path]: reconcile completed tasks with all phase files, backfill stale completed checkboxes across all phases, update plan.md status/progress, and report unresolved mappings.", description="Sync plan")
```

## Documentation

Canonical doc-writer prompt — used by both `tkm:takumi` Step 6 and `tkm:manage-docs update` Phase 2.

**Assembly rule (orchestrator MUST execute before spawning — no LLM-side conditional parsing):**

```
prompt = BASE_BLOCK
if SPECS_PRESENT > 0 and IMPACT_MAP is non-empty:
    prompt = prompt + "\n\n" + APPENDIX_BLOCK
prompt = prompt.replace("{PLAN_NAME}",     plan_name)
prompt = prompt.replace("{CHANGED_FILES}", changed_files_list)
prompt = prompt.replace("{IMPACT_MAP}",    impact_map_list)   # only present in APPENDIX
Task(subagent_type="doc-writer", prompt=prompt, description="Update docs")
```

`doc-writer` MUST receive a fully-rendered prompt — no `{...}` placeholders, no `BASE_BLOCK`/`APPENDIX_BLOCK` headings, no commentary about which variant was chosen.

### BASE_BLOCK (always included)

```
Update docs for {PLAN_NAME}.

Changed files: {CHANGED_FILES}

General docs to review (update only if relevant):
- README.md
- docs/project-overview-pdr.md
- docs/codebase-summary.md
- docs/code-standards.md
- docs/system-architecture.md
- docs/project-roadmap.md
- docs/deployment-guide.md (optional)
- docs/design-guidelines.md (optional)
```

### APPENDIX_BLOCK (included only when SPECS_PRESENT > 0 and IMPACT_MAP non-empty)

```
docs/specs/ artifacts (surgical edits only — DO NOT regenerate):
{IMPACT_MAP}

Rules: add/remove rows in tables; preserve FR/BR/SM/ALG/INT/SC/F/US/SCR/REG/BL/PERM codes; copy adjacent-row schema. If >3 changed source files touch one artifact → SKIP and advise `/tkm:rebuild-spec --artifact NAME`. Never create new feature spec files — advise `/tkm:rebuild-spec --features F###` instead.

See `claude/skills/_shared/docs-canonical-mapping.md` for canonical homes.
```

### Worked example — Variant A (SPECS_PRESENT == 0)

Inputs: `plan_name = "auth-feature"`, `changed_files = "src/auth/login.ts, src/auth/session.ts"`.

Resulting `prompt` value passed to `Task(...)`:

```
Update docs for auth-feature.

Changed files: src/auth/login.ts, src/auth/session.ts

General docs to review (update only if relevant):
- README.md
- docs/project-overview-pdr.md
- docs/codebase-summary.md
- docs/code-standards.md
- docs/system-architecture.md
- docs/project-roadmap.md
- docs/deployment-guide.md (optional)
- docs/design-guidelines.md (optional)
```

### Worked example — Variant B (SPECS_PRESENT > 0, IMPACT_MAP non-empty)

Inputs: `plan_name = "auth-feature"`, `changed_files = "src/auth/login.ts, src/routes/api.ts"`, `impact_map = "- route-list.md (from src/routes/api.ts)\n- permissions.md (from src/auth/login.ts)"`.

Resulting `prompt` value passed to `Task(...)`:

```
Update docs for auth-feature.

Changed files: src/auth/login.ts, src/routes/api.ts

General docs to review (update only if relevant):
- README.md
- docs/project-overview-pdr.md
- docs/codebase-summary.md
- docs/code-standards.md
- docs/system-architecture.md
- docs/project-roadmap.md
- docs/deployment-guide.md (optional)
- docs/design-guidelines.md (optional)

docs/specs/ artifacts (surgical edits only — DO NOT regenerate):
- route-list.md (from src/routes/api.ts)
- permissions.md (from src/auth/login.ts)

Rules: add/remove rows in tables; preserve FR/BR/SM/ALG/INT/SC/F/US/SCR/REG/BL/PERM codes; copy adjacent-row schema. If >3 changed source files touch one artifact → SKIP and advise `/tkm:rebuild-spec --artifact NAME`. Never create new feature spec files — advise `/tkm:rebuild-spec --features F###` instead.

See `claude/skills/_shared/docs-canonical-mapping.md` for canonical homes.
```

### Trigger Mapping

`CHANGED_FILES` → affected `docs/specs/` artifacts. Orchestrator uses this table to build `IMPACT_MAP` (drop rows where the artifact does not exist on disk).

| Changed file pattern | Affected artifact(s) |
|---|---|
| Backend route / controller / API handler | `route-list.md` |
| ORM model / migration / schema definition | `data-model.md` |
| Frontend page / screen / route component | `screen-list.md`, `screen-flow.md` |
| Navigation / router config | `screen-flow.md` |
| Auth / RBAC / policy / guard / middleware | `permissions.md` |
| Job / queue worker / scheduler / cron / listener / observer / webhook | `background-logic.md` |
| New feature surface (touches ≥2 of: routes, screens, models, jobs) | `feature-list.md` (advise `--features F###` if entirely new) |
| User-visible flow change (forms, wizards, multi-step interactions) | `user-stories.md` |

Rules:
- Edits stay in tables; never rewrite headings or schemas.
- Per-artifact >3 changed source files → skip + advise `/tkm:rebuild-spec --artifact NAME`.
- New per-feature spec → never created here; advise `/tkm:rebuild-spec --features F###`.
- Full surgical-edit + escalation policy: `claude/skills/_shared/docs-canonical-mapping.md`.

## Delivery Stage (Git)

```
Task(subagent_type="git-manager", prompt="Stage and commit changes with conventional commit message", description="Commit work")
```

## Parallel Forge

```
Task(subagent_type="implementer", prompt="Implement [phase-file] with file ownership: [files]", description="Forge phase [N]")
```
- Launch multiple for concurrent phases
- Include file ownership boundaries to avoid conflicts
