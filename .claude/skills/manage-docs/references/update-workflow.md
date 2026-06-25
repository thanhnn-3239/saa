# Update Workflow

## Phase 1: Parallel Codebase Scouting

1. Scan the codebase and calculate the number of files with LOC in each directory (skip `.claude`, `.opencode`, `.git`, `tests`, `node_modules`, `__pycache__`, `secrets`, etc.)
2. Target directories **that actually exist** - adapt to project structure
3. Activate `sk:scout` skill to explore the code base and return detailed summary reports
4. Merge scout reports into context summary

## Phase 1.5: Parallel Documentation Reading

**You (main agent) must spawn readers** - subagents cannot spawn subagents.

1. Count docs: `ls docs/*.md 2>/dev/null | wc -l`
2. Get LOC: `wc -l docs/*.md 2>/dev/null | sort -rn`
3. Strategy:
   - 1-3 files: Skip parallel reading, doc-writer reads directly
   - 4-6 files: Spawn 2-3 `Explore` agents
   - 7+ files: Spawn 4-5 `Explore` agents (max 5)
4. Distribute files by LOC (larger files get dedicated agent)
5. Each agent prompt: "Read these docs, extract: purpose, key sections, areas needing update. Files: {list}"
6. Merge results into context for doc-writer

## Phase 2.a: Detect docs/specs/ Artifacts (v2.0.0+)

Run BEFORE spawning `doc-writer`. Mirrors `tkm:takumi` Step 6.a so both invocation paths converge on the same doc-writer prompt.

```bash
SPECS_PRESENT=$(ls docs/specs/*.md 2>/dev/null | wc -l | tr -d ' ')
# manage-docs update is typically invoked AFTER commits, so prefer last-commit diff,
# falling back to working-tree diff if HEAD~ doesn't exist (initial commit / shallow clone).
CHANGED_FILES=$(git diff --name-only HEAD~..HEAD 2>/dev/null)
[ -z "$CHANGED_FILES" ] && CHANGED_FILES=$(git diff --name-only HEAD 2>/dev/null)

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

If `SPECS_PRESENT > 0`, build `IMPACT_MAP` from `CHANGED_FILES` using the trigger table in `claude/skills/takumi/references/subagent-patterns.md` → `## Documentation` → Trigger Mapping. If `SPECS_PRESENT == 0`, omit the artifact branch entirely (no warning). If `CHANGED_FILES` is also empty (clean tree), skip the artifact branch — there is nothing to map.

**Absent-layer advisory:** the `if/elif` block above is stderr-only and **never** enters the `doc-writer` prompt — surgical-edit contract is unchanged. Layers are mutually exclusive: `docs/` missing suppresses the specs advisory because `docs/specs/` cannot exist without its parent. Threshold `≥ 2` is applied **after** stripping test/mock/fixture paths. Contract: [`_shared/docs-canonical-mapping.md` § Absent-Layer Advisory](../../_shared/docs-canonical-mapping.md#absent-layer-advisory).

## Phase 2: Documentation Update (doc-writer Agent)

**CRITICAL:** You MUST spawn `doc-writer` agent via Task tool with merged reports and doc readings.

Use the canonical structured prompt defined in `claude/skills/takumi/references/subagent-patterns.md` → `## Documentation`. Substitute `[plan-name]` with `manage-docs update session (YYYY-MM-DD)`. Inline `CHANGED_FILES`, the general docs list, and (when `SPECS_PRESENT > 0`) the resolved `IMPACT_MAP`. DO NOT duplicate the template body here — link only (DRY).

Quick inline summary (full body in `subagent-patterns.md`):
- General docs: README + 7 docs under `docs/` (project-overview-pdr, codebase-summary, code-standards, system-architecture, project-roadmap, deployment-guide, design-guidelines).
- If `SPECS_PRESENT > 0`: append surgical-edit instructions + `IMPACT_MAP` + escalation rule (>3 changed source files per artifact → advise `/tkm:rebuild-spec --artifact NAME`).
- Never create new feature spec files; advise `/tkm:rebuild-spec --features F###`.

## Additional requests
<additional_requests>
  $ARGUMENTS
</additional_requests>

## Phase 3: Size Check (Post-Update)

After doc-writer completes:
1. Run `wc -l docs/*.md 2>/dev/null | sort -rn` to check LOC
2. Use `docs.maxLoc` from session context (default: 800)
3. For files exceeding limit: report and ask user

## Phase 4: Documentation Validation (Post-Update)

Run validation to detect potential hallucinations:
1. Run: `node .claude/scripts/validate-docs.cjs docs/`
2. Display validation report (warnings only, non-blocking)
3. Checks: code references, internal links, config keys

## Important
- Use `docs/` directory as the source of truth.
- **Do not** start implementing.
