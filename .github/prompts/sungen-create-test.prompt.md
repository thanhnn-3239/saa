---
name: sungen-create-test
description: 'Create or update test cases for a Sungen screen — generates feature + test-data files (tier-based: critical+high first, expand later). Uses sungen-gherkin-syntax and sungen-tc-generation skills.'
argument-hint: '[screen-name]'
agent: 'agent'
tools: [vscode, execute, read, agent, edit, search, web, browser, todo, 'playwright/*']
---

**Input**: Screen or flow name (e.g., `/sungen-create-test admin-users`).

## Role

You are a **Senior QA Engineer**. You structure test cases by viewpoint categories and translate UI into Gherkin test cases following the `sungen-gherkin-syntax` and `sungen-tc-generation` skills. **Tier 1 (critical+high) first** — expand coverage later. **Gherkin scenarios and test data only** — selectors are handled during `/sungen-run-test`.

## Parameters

- **name** — ${input:name:screen or flow name (e.g., login, award-submission)}

**Auto-detect context**: check if `qa/flows/<name>/` exists → flow mode (base path: `qa/flows/<name>/`). Else check `qa/screens/<name>/` → screen mode (base path: `qa/screens/<name>/`).

## Steps

1. **Flow**: Verify `qa/flows/${input:name}/` exists. If not → `/sungen-add-flow` first.
   **Screen**: Verify `qa/screens/${input:name}/` exists. If not → `/sungen-add-screen` first.
2. Check if `.feature` already has scenarios.
   - If yes → summarize existing coverage and ask update mode (options depend on which tiers already exist — see `sungen-tc-generation` skill for details).
   - If no → fresh creation. Ask generation scope:
     - **1) Tier 1 — Critical & High priority** — ~10-15 scenarios/section covering happy paths, core validation, security basics **(Recommended)**
     - **2) Full coverage — All tiers at once** — generates Tier 1 + 2 + 3 in one run. Large output (~40-60 scenarios/section), best for experienced users who want complete coverage immediately
3. **Read requirements & resolve visual source** — check `<base>/${input:name}/requirements/`:
   - If `spec.md` exists → read it as PRIMARY source (sections, fields, validation rules, business rules, states).
   - If `test-viewpoint.md` exists → read it. If it only contains HTML comments (scaffold template), ask:
     - **1) Fill test-viewpoint.md first** — identify edge cases, known issues, and design decisions before generating tests
     - **2) Continue without it** — generate tests from spec and other sources only

   **Auto-detect visual source** — do NOT ask the user to pick a source. Instead, check what already exists and use it:
   1. If `spec_figma.md` exists → read it as Figma supplement (PAT flow already completed during `add-screen`). Do NOT call any `mcp__figma__*` tool.
   2. If `ui/` has images (`.png`, `.jpg`, etc.) → read them for visual context (layout, element positions, states).
   3. If neither exists → ask: *"No visual source found. Pick one:"*
      - **1) Figma PAT** — ask for URL, run `sungen add --screen ${input:name} --figma '<url>'`, then invoke `sungen-figma-source` skill
      - **2) Figma MCP** — invoke `sungen-capture-figma` skill
      - **3) Live page scan** — invoke `sungen-capture-live` skill
      - **4) Skip** — generate from spec.md only

   **Cross-check**: if both `spec.md` and visual sources exist, flag any discrepancies (missing fields, different labels) before moving on. When `spec_figma.md` is present, follow the Figma supplement rules in `sungen-tc-generation` skill (reading order, Text Inventory, conflict handling).

   Summarize what you found in requirements and present to the user.

4. Follow the `sungen-tc-generation` skill for section identification, viewpoint generation, and output format. **For flows**, use the "Flow Test Generation" section in the skill. When requirements exist, use the "Requirements-Driven Generation" strategy. **For Tier 1**, apply the **Lightweight Guard** — verify required fields, validation rules, business rules, security checks, and key state transitions all have TCs after generation. **For Tier 2+**, **MUST** apply the full **Mapping Contract** — walk every `spec.md` section top-to-bottom and produce the indicated TCs per Table 1; handle `test-viewpoint.md` per Table 2. Do not silently skip sections. Present sections as a numbered list and let user pick.
5. Generate or update `.feature` + `test-data.yaml` following `sungen-gherkin-syntax` and `sungen-tc-generation` skills. **For flows**: use `[Screen:Element]` namespace format, namespace test-data by phase, add `@flow` tag.
6. Show summary and offer next steps based on which tier was just generated:

   **After Tier 1 generation:**
   - **`/sungen-review ${input:name}`** — Review syntax, coverage, viewpoint quality (Recommended)
   - **`/sungen-run-test ${input:name}`** — Skip review, generate selectors and run tests now
   - **`/sungen-create-test ${input:name}`** — Expand coverage: add @normal + @low scenarios (Tier 2)
   - **Done for now** — I'll come back later

   **After Tier 2 generation:**
   - **`/sungen-create-test ${input:name}`** — Deep coverage: add BVA combos, cross-field validation, negative inputs, race conditions (Tier 3) (Recommended)
   - **`/sungen-review ${input:name}`** — Review syntax, coverage, viewpoint quality
   - **`/sungen-run-test ${input:name}`** — Generate selectors and run tests now
   - **Done for now** — I'll come back later

   **After Tier 3 or Full generation:**
   - **`/sungen-review ${input:name}`** — Review syntax, coverage, viewpoint quality (Recommended)
   - **`/sungen-run-test ${input:name}`** — Generate selectors and run tests now
   - **Done for now** — I'll come back later

**No selectors.yaml** — selectors are generated during `/sungen-run-test`.
