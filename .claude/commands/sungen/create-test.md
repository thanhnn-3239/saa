---
name: create-test
description: 'Create or update test cases for a Sungen screen — generates feature + test-data files (tier-based: critical+high first, expand later)'
argument-hint: [screen-name]
allowed-tools: Read, Grep, Bash, Glob, Write, AskUserQuestion, Skill, mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_take_screenshot
---

## ⛔ HARD RULE — No Figma MCP when PAT data exists

If `spec_figma.md` exists OR the user provides a Figma URL for the PAT flow:
- Do NOT call any `mcp__figma__*` tool. The PAT flow uses the `sungen` CLI, not MCP.
- Run `sungen add --screen <screen> --figma '<url>'` via Bash (**single-quote the URL**) then invoke `sungen-figma-source` skill.

---

## Role

You are a **Senior QA Engineer** specialized in test case design. You structure test cases by viewpoint categories and translate UI into Gherkin test cases following `sungen-gherkin-syntax` and `sungen-tc-generation` skills. **Tier 1 (critical+high) first** — expand coverage later. Focus on **Gherkin scenarios and test data only** — selectors are handled during `/sungen:run-test`.

## Parameters

Parse **name** from `$ARGUMENTS`. If missing, ask the user.

**Auto-detect context**: check if `qa/flows/<name>/` exists → flow mode. Else check `qa/screens/<name>/` → screen mode. This determines paths, generation strategy, and CLI commands.

## Steps

1. **Flow**: Verify `qa/flows/<name>/` exists. If not → `/sungen:add-flow` first.
   **Screen**: Verify `qa/screens/<name>/` exists. If not → `/sungen:add-screen` first.
2. Check if `.feature` file already has scenarios.
   - If yes → use `AskUserQuestion` to ask the update mode (see `sungen-tc-generation` skill — mode depends on which tiers already exist).
   - If no → fresh creation. Use `AskUserQuestion` to ask generation scope:
     - **Tier 1 — Critical & High priority** — ~10-15 scenarios/section covering happy paths, core validation, security basics **(Recommended)**
     - **Full coverage — All tiers at once** — generates Tier 1 + 2 + 3 in one run. Large output (~40-60 scenarios/section), best for experienced users who want complete coverage immediately
3. **Read requirements & resolve visual source** — check `qa/<screens|flows>/<name>/requirements/`:
   - If `spec.md` exists → read it as PRIMARY source (sections, fields, validation rules, business rules, states).
   - If `test-viewpoint.md` exists → read it. If it only contains HTML comments (scaffold template), use `AskUserQuestion` to ask:
     - **Fill test-viewpoint.md first** — I'll help you identify edge cases, known issues, and design decisions for this screen before generating tests
     - **Continue without it** — generate tests from spec and other sources only

   **Auto-detect visual source** — do NOT ask the user to pick a source. Instead, check what already exists and use it:
   1. If `spec_figma.md` exists → read it as Figma supplement (PAT flow already completed during `add-screen`). Do NOT call any `mcp__figma__*` tool.
   2. If `ui/` has images (`.png`, `.jpg`, etc.) → read them for visual context (layout, element positions, states).
   3. If neither exists → use `AskUserQuestion` to ask: *"No visual source found. Pick one:"*
      - **Figma PAT** — ask for URL, run `sungen add --screen <screen> --figma '<url>'` via Bash, then invoke `sungen-figma-source` skill
      - **Figma MCP** — invoke `sungen-capture-figma` skill
      - **Live page scan** — invoke `sungen-capture-live` skill
      - **Skip** — generate from spec.md only

   **Cross-check**: if both `spec.md` and visual sources exist, flag any discrepancies (missing fields, different labels) before moving on. When `spec_figma.md` is present, follow the Figma supplement rules in `sungen-tc-generation` skill (reading order, Text Inventory, conflict handling).

   Summarize what you found in requirements and present to the user.

4. Follow the `sungen-tc-generation` skill for section identification, viewpoint generation, and output format. **For flows**, use the "Flow Test Generation" section in the skill. When requirements exist, use the "Requirements-Driven Generation" strategy. **For Tier 1**, apply the **Lightweight Guard** — verify required fields, validation rules, business rules, security checks, and key state transitions all have TCs after generation. **For Tier 2+**, **MUST** apply the full **Mapping Contract** — walk every `spec.md` section top-to-bottom and produce the indicated TCs per Table 1; handle `test-viewpoint.md` per Table 2. Do not silently skip sections.
5. Generate or update `.feature` + `test-data.yaml` following `sungen-gherkin-syntax` and `sungen-tc-generation` skills. **For flows**: use `[Screen:Element]` namespace format, namespace test-data by phase, add `@flow` tag.
6. Show summary, then use `AskUserQuestion` to offer next steps based on which tier was just generated:

   **After Tier 1 generation:**
   - **`/sungen:review <name>`** — Review syntax, coverage, viewpoint quality (Recommended)
   - **`/sungen:run-test <name>`** — Skip review, generate selectors and run tests now
   - **`/sungen:create-test <name>`** — Expand coverage: add @normal + @low scenarios (Tier 2)
   - **Done for now** — I'll come back later

   **After Tier 2 generation:**
   - **`/sungen:create-test <name>`** — Deep coverage: add BVA combos, cross-field validation, negative inputs, race conditions (Tier 3) (Recommended)
   - **`/sungen:review <name>`** — Review syntax, coverage, viewpoint quality
   - **`/sungen:run-test <name>`** — Generate selectors and run tests now
   - **Done for now** — I'll come back later

   **After Tier 3 or Full generation:**
   - **`/sungen:review <name>`** — Review syntax, coverage, viewpoint quality (Recommended)
   - **`/sungen:run-test <name>`** — Generate selectors and run tests now
   - **Done for now** — I'll come back later

**No selectors.yaml** — selectors are generated during `/sungen:run-test`.
