# The Seven Stages

Every discipline shares the same seven stages. What differs is the pace and the pauses.

**Task Tool Fallback:** `TaskCreate`/`TaskUpdate`/`TaskGet`/`TaskList` are CLI-only — unavailable in VSCode extension. If they error, use `TodoWrite` for tracking. All stages remain functional without Task tools.

## Stage 0: Read the Material

1. Parse input with `intent-detection.md` rules
2. Log detected discipline: `⚒ Stage 0: Discipline [X] — [reason]`
3. If discipline=code: detect blueprint path, set active plan
4. Use `TaskCreate` to create stage tasks (with dependencies if complex)

**Output:** `⚒ Stage 0: Discipline [interactive|auto|fast|parallel|no-test|code] — [detection reason]`

## Stage 1: Study the Craft (skip if fast/code)

**Interactive/Auto:**
- Spawn multiple `researcher` agents in parallel
- Use `/tkm:scan-codebase ext` or `scout` agent for codebase reading
- Keep reports ≤150 lines

**Parallel:**
- Optional: max 2 researchers if the work is complex

**Output:** `⚒ Stage 1: Study complete — [N] reports gathered`

### [Rest Point 1] After Study (skip if auto)
- Present study summary to user
- Use `AskUserQuestion` to ask: "Proceed to blueprint?" / "Request further study" / "Abort"
- **Auto discipline:** Skip this rest point

### MoMorph Parallel UI Hook (between Stage 1 and Stage 2)

**Trigger:** User input contains MoMorph URL (`momorph.ai/files/*/screens/*`), explicit `fileKey`/`screenId`, or keyword "momorph"/"figma" referencing a screen to implement.

**When triggered, BEFORE entering Stage 2:**
1. Collect all screen identifiers from user input (may be 1 or N screens)
2. Fetch per screen in parallel: `get_frame(screenId)` + `download_specs(screen_id, "csv")` + `download_test_cases(screen_id, "csv")`
3. **Spawn one background `implementer` subagent PER SCREEN** (via `Agent` with `run_in_background: true`). All UI agents run concurrently:
   - Each subagent uses `momorph-implement-design` skill for its screen
   - Mock data extracted directly from Figma design (text, images, sample values visible in the design) — NO invented data
   - Prompt MUST include: MoMorph URL, fileKey, screenId, project conventions path
   - Each subagent reports back: files created, component tree, data interfaces/props expected
4. **DO NOT wait for UI agents.** Continue immediately to Stage 2 (Blueprint) → Stage 3 (Forge). Blueprint and forge proceed in parallel with UI agents.
5. **Integration is incremental:** As each UI agent completes (background notification), integrate its output with the forged logic. No hard merge point — work flows continuously.

**If NOT triggered:** Proceed to Stage 2 normally.

See `.claude/rules/momorph/momorph-development.md` → "Parallel Execution Strategy" for full protocol.

## Stage 2: Draft the Blueprint

**Interactive/Auto/No-test:**
- Use `planner` agent with study context
- Create `plan.md` + `phase-XX-*.md` files

**Fast:**
- Use `/tkm:create-plan --fast` with scout results only
- Minimal blueprint, focus on action

**Parallel:**
- Use `/tkm:create-plan --parallel` for dependency graph + file ownership matrix

**Code:**
- Skip — blueprint already exists
- Parse existing plan for phases

**Output:** `⚒ Stage 2: Blueprint drafted — [N] phases`

### [Rest Point 2] After Blueprint (skip if auto)
- Present blueprint overview with phases
- Use `AskUserQuestion` to ask: "Validate the blueprint or approve to begin forging?" — "Validate" / "Approve" / "Abort" / "Other" ("Request revisions")
  - "Validate": run `/tkm:create-plan validate` skill invocation
  - "Approve": proceed to forge
  - "Abort": stop the workflow
  - "Other": revise the blueprint based on feedback
- **Auto discipline:** Skip this rest point

## Stage 3: Forge the Piece

**IMPORTANT:**
1. `TaskList` first — check for existing tasks (hydrated by planning skill in same session)
2. If tasks exist → pick them up, skip re-creation
3. If no tasks → read plan phases, `TaskCreate` for each unchecked `[ ]` item with priority order and metadata (`phase`, `planDir`, `phaseFile`)
4. Tasks can be blocked by other tasks via `addBlockedBy`

**All disciplines:**
- Use `TaskUpdate` to mark tasks as `in_progress` immediately
- Execute phase tasks sequentially (Stage 3.1, 3.2, etc.)
- Use `ui-ux-designer` for frontend (activate `sk:ui-ux-pro-max` first for style selection if no design system exists)
- Use `sk:ai-multimodal` for image assets
- Run type checking after each file

**Parallel discipline:**
- Utilize all tools of Claude Tasks: `TaskCreate`, `TaskUpdate`, `TaskGet` and `TaskList`
- Launch multiple `implementer` agents
- When agents pick up a task, use `TaskUpdate` to assign and mark `in_progress` immediately
- Respect file ownership boundaries
- Wait for parallel group before advancing

**Output:** `⚒ Stage 3: Forged [N] files — [X/Y] tasks complete`

### [Rest Point 3] After Forge (skip if auto)
- Present forge summary (files changed, key changes)
- Use `AskUserQuestion` to ask: "Proceed to tempering?" / "Request forge changes" / "Abort"
- **Auto discipline:** Skip this rest point

## Stage 4: Temper the Edge (skip if no-test)

**All disciplines (except no-test):**
- Write tests: happy path, edge cases, errors
- **MUST** spawn `tester` subagent: `Task(subagent_type="tester", prompt="Run test suite", description="Temper the work")`
- If failures: **MUST** spawn `debugger` subagent → fix → repeat
- **Forbidden:** fake mocks, commented tests, changed assertions, skipping subagent delegation

**Output:** `⚒ Stage 4: Tempering [X/X passed] — tester subagent invoked`

### [Rest Point 4] After Tempering (skip if auto)
- Present tempering results summary
- Use `AskUserQuestion` to ask: "Proceed to inspection?" / "Request tempering fixes" / "Abort"
- **Auto discipline:** Skip this rest point

## Stage 5: Master's Inspection

**All disciplines — MANDATORY subagent:**
- **MUST** spawn `reviewer` subagent: `Task(subagent_type="reviewer", prompt="Inspect changes. Return score, critical defects, concerns, refinements.", description="Inspect work")`
- **DO NOT** inspect code yourself — delegate to the reviewer

**Interactive/Parallel/Code/No-test:**
- Interactive cycle (max 3): see `review-cycle.md`
- Requires user approval

**Auto:**
- Auto-approve if score≥9.5 AND 0 critical defects
- Auto-fix critical defects (max 3 cycles)
- Escalate to user after 3 failed cycles

**Fast:**
- Simplified inspection, no fix loop
- User approves or aborts

**Output:** `⚒ Stage 5: Inspection [score]/10 — [Approved|Auto-approved] — reviewer subagent invoked`

## Stage 6: Deliver the Work

**Hard ordering rule (Stage 6 trap):** Both subagents in step 6.1 (`project-manager` AND `doc-writer`) must be spawned BEFORE any commit-related `AskUserQuestion`. The commit prompt is NOT the seal — the Delivery Manifest is. If you find yourself about to ask "Ready to commit?" and have not yet spawned both, STOP and spawn them first. No exceptions for "tests passed and review approved" — that is precisely when the trap fires. Full anti-rationalization table: SKILL.md → "Delivery Anti-Rationalization".

### Step 6.a — Artifact detection (orchestrator, before doc-writer spawn)

Run this detection BEFORE spawning `doc-writer`. The orchestrator resolves the conditional and renders the prompt with the artifact branch already inlined or omitted — `doc-writer` does NOT see literal `[IF SPECS_PRESENT > 0:]` markers.

```bash
SPECS_PRESENT=$(ls docs/specs/*.md 2>/dev/null | wc -l | tr -d ' ')
# Step 6 runs BEFORE git-manager commits, so capture uncommitted working tree + index vs HEAD.
# Includes both staged and unstaged changes from this session.
CHANGED_FILES=$(git diff --name-only HEAD 2>/dev/null)

# Advisory: signal absent doc layer when session changed substantial feature surface.
# Source for trigger patterns: claude/skills/takumi/references/subagent-patterns.md
#                              → ## Documentation → Trigger Mapping
TRIGGER_HITS=0
if [ -n "$CHANGED_FILES" ]; then
  TRIGGER_HITS=$(echo "$CHANGED_FILES" \
    | grep -vE '/(tests?|__tests__|spec|mocks?|fixtures?)/|\.(test|spec)\.' \
    | grep -cE '/(routes?|controllers?|api|endpoints?|models?|schema|migrations?|prisma|pages?|screens?|views?|router|navigation|auth|rbac|policy|guard|middleware|jobs?|queues?|workers?|cron|listeners?|webhooks?|observers?)/')
fi

if [ ! -d docs ] && [ "$TRIGGER_HITS" -ge 2 ]; then
  echo "ℹ  ./docs/ not found — ${TRIGGER_HITS} feature-surface files changed this session." 1>&2
  echo "ℹ  Consider /tkm:manage-docs init to scaffold project docs." 1>&2
elif [ -d docs ] && [ "$SPECS_PRESENT" = "0" ] && [ "$TRIGGER_HITS" -ge 2 ]; then
  echo "ℹ  docs/specs/ absent — ${TRIGGER_HITS} feature-surface files changed this session." 1>&2
  echo "ℹ  Consider /tkm:rebuild-spec to generate spec layer for richer planning context." 1>&2
fi
```

- If `SPECS_PRESENT == 0` → omit the artifact branch from the `doc-writer` prompt. No warning, no extra prompt bloat.
- If `SPECS_PRESENT > 0` → build `IMPACT_MAP` from `CHANGED_FILES` using the trigger table in `subagent-patterns.md` → `## Documentation` → Trigger Mapping (single source — do NOT duplicate the table here).
- If `CHANGED_FILES` is empty (e.g. user already committed before invoking finalize) → fall back to the active phase's "Related code files" list, or to `git diff --name-only HEAD~..HEAD` for the last commit. Log which source was used.

Detection is idempotent: `docs/specs/` absence exits cleanly with no error. `tr -d ' '` normalizes BSD-`wc` whitespace padding so `[ "$SPECS_PRESENT" = "0" ]` comparisons work.

**Absent-layer advisory:** the `if/elif` block above is stderr-only and **never** enters the `doc-writer` prompt — `doc-writer` still sees the same artifact branch (omitted when `SPECS_PRESENT == 0`). The two layers are mutually exclusive by control flow: `docs/` missing suppresses the specs advisory because `docs/specs/` cannot exist without its parent. Threshold is `≥ 2` feature-surface hits **after** stripping test/mock/fixture paths, so single-file or pure-test sessions stay silent. Contract details: [`_shared/docs-canonical-mapping.md` § Absent-Layer Advisory](../../_shared/docs-canonical-mapping.md#absent-layer-advisory).

**All modes - MANDATORY subagents (NON-NEGOTIABLE):**
1. **MUST** spawn these subagents in parallel:
   - `Task(subagent_type="project-manager", prompt="Run full sync-back for [plan-path]: reconcile all completed Claude Tasks with all phase files, backfill stale completed checkboxes across every phase, then update plan.md frontmatter/table progress. Do NOT only mark current phase.", description="Update plan")`
   - `doc-writer` — use the canonical prompt template in `subagent-patterns.md` → `## Documentation`. Substitute `[plan-name]` with the active plan name, inline `CHANGED_FILES`, and (when `SPECS_PRESENT > 0`) inline the resolved `IMPACT_MAP` from 6.a. DO NOT duplicate the template body here (DRY).
2. Project-manager sync-back MUST include:

### Status Sync (Deliver)

Use CLI commands for deterministic status updates:

```bash
# Mark completed phases
ck plan check <phase-id>

# Mark in-progress phases
ck plan check <phase-id> --start

# Revert if needed
ck plan uncheck <phase-id>
```

**Fallback:** If `ck` is not available, edit plan.md directly —
only change the Status column cell, preserve table structure.
   - Sweep all `phase-XX-*.md` files in the plan directory.
   - Mark every completed item `[ ] → [x]` based on completed tasks (including earlier phases finished before current phase).
   - Update `plan.md` status/progress (`pending`/`in-progress`/`completed`) from actual checkbox state.
   - Return unresolved mappings if any completed task cannot be matched to a phase file.
3. Use `TaskUpdate` to mark Claude Tasks complete after sync-back confirmation.
4. Onboarding check (API keys, env vars)
5. **Emit the Delivery Manifest** to the user (see SKILL.md → "Delivery Manifest"). This is a printed emission, not a private check. Boxes 1–3 must read `[x]` from real subagent verdicts. If any reads `[ ]`, complete that subagent NOW. The commit prompt is forbidden until the Manifest passes.
6. **MUST** spawn git subagent (only after the Manifest is emitted with boxes 1–3 checked): `Task(subagent_type="git-manager", prompt="Stage and commit changes", description="Commit work")`
7. Run `/tkm:write-journal` to record the session.

**CRITICAL:** Stage 6 is INCOMPLETE without ALL of the following:
- (a) artifact detection (6.a) run,
- (b) all 3 subagents spawned (`project-manager`, `doc-writer`, `git-manager`) — `doc-writer` is spawned regardless of perceived doc impact; its verdict is what determines whether files change,
- (c) Delivery Manifest emitted verbatim to the user with boxes 1–3 = `[x]`,
- (d) `/tkm:write-journal` run.

A passing inspection (Stage 5) does NOT absolve any of these. DO NOT pass literal `[IF SPECS_PRESENT > 0:]` to `doc-writer` — orchestrator resolves the conditional first.

**Auto discipline:** Continue to next phase automatically, return to **Stage 3**.
**Others:** Ask user before next phase

**Output:** `⚒ Stage 6: Delivered — 3 subagents invoked — Full-plan sync-back complete — Committed`

## Discipline Flow Summary

Legend: `[R]` = Rest Point (human approval required)

```
interactive: 0 → 1 → [R] → 2 → [R] → 3 → [R] → 4 → [R] → 5(user) → 6
auto:        0 → 1 → 2 → 3 → 4 → 5(auto) → 6 → next phase (NO pauses)
fast:        0 → skip → 2(fast) → [R] → 3 → [R] → 4 → [R] → 5(simple) → 6
parallel:    0 → 1? → [R] → 2(parallel) → [R] → 3(multi-agent) → [R] → 4 → [R] → 5(user) → 6
no-test:     0 → 1 → [R] → 2 → [R] → 3 → [R] → skip → 5(user) → 6
code:        0 → skip → skip → 3 → [R] → 4 → [R] → 5(user) → 6
```

**Key distinction:** `auto` is the ONLY discipline that skips all rest points.

## Critical Rules

- Never skip stages without discipline justification
- **MANDATORY DELEGATION:** Stages 4, 5, 6 MUST spawn subagents via Task tool. DO NOT perform directly.
  - Stage 4: `tester` (and `debugger` if failures)
  - Stage 5: `reviewer`
  - Stage 6: `project-manager`, `doc-writer`, `git-manager`
- Use `TaskCreate` for each unchecked item with priority order and dependencies (or `TodoWrite` if Task tools unavailable).
- Use `TaskUpdate` to mark `in_progress` when picking up a task (skip if Task tools unavailable).
- Use `TaskUpdate` to mark `complete` immediately after the task is finished (skip if Task tools unavailable).
- All stage outputs follow format: `⚒ Stage [N]: [status] — [metrics]`
- **VALIDATION:** If Task tool calls = 0 at end of workflow, the work is INCOMPLETE.
