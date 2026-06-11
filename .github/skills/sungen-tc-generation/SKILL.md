---
name: sungen-tc-generation
description: 'Test case generation strategy — section-focused, viewpoint-driven, Gherkin + test-data only. Auto-loaded by create-test command.'
user-invocable: false
---

## Goal

Generate **focused test cases per screen section** using a **tier-based approach** for faster results. Output `.feature` + `test-data.yaml` only — selectors are deferred to `/sungen:run-test`.

### Tier System

| Tier | Priority | What to generate | When |
|---|---|---|---|
| **Tier 1** (default) | `@high` | Happy paths, required validation, core business rules, security basics | First run of `create-test` |
| **Tier 2** (expand) | `@normal` + `@low` | UI presence, optional validation, edge cases, cosmetic checks | User runs `create-test` again with "Add viewpoints" mode |
| **Tier 3** (deep) | `@high` + `@normal` + `@low` | Extra BVA combinations, cross-field validation, negative/destructive inputs, concurrent/race conditions, complex state transitions | Recommended after Tier 2 completes |
| **Full** (all-at-once) | All | Tier 1 + 2 + 3 combined in one run | Option at first run, **not recommended** — large output |

**Round 1 (Tier 1)** targets **~10-15 scenarios per section** — enough to cover critical flows and catch real bugs. This is the default behavior. A **Full** option is available but not recommended — it generates all tiers at once, producing very large output (~40-60 scenarios/section).

**Round 2 (Tier 2)** expands coverage when the user explicitly chooses "Add viewpoints" or "Add new sections" update mode. Only then generate `@normal` + `@low` scenarios to fill coverage gaps.

## Update Mode

When `.feature` already has scenarios, detect which tiers exist by scanning section comments, then ask the appropriate update mode.

**Tier detection** — scan for `# --- Section:` comments:
- Only `(Tier 1: @high)` comments → **Tier 1 only**
- Has `(Tier 2: @normal + @low)` comments → **Tier 1 + 2**
- Has `(Tier 3: deep)` comments → **Tier 1 + 2 + 3**

**If Tier 1 only:**
1. **Add new sections** — append new sections with Tier 2 (`@normal` + `@low`) scenarios, continue numbering
2. **Add viewpoints** — expand existing sections with Tier 2 (`@normal` + `@low`) scenarios

**If Tier 1 + 2:**
1. **Deep coverage (Tier 3)** — add advanced scenarios: extra BVA, cross-field validation, negative inputs, race conditions **(Recommended)**
2. **Add new sections** — append new sections with Tier 2 scenarios, continue numbering

**If Tier 1 + 2 + 3** (full coverage):
1. **Add new sections** — append new sections if screen has changed

> **Replace all** (available in all modes) — overwrite with fresh Tier 1 (`@high`) generation. Use when spec has changed significantly.

For append: read highest `VP-<CAT>-<NNN>`, continue from next number. Never modify existing scenarios.

## Requirements-Driven Generation

When `qa/screens/<screen>/requirements/` exists:
- **`spec.md`** — primary: sections, field constraints, validation messages, business rules, states
- **`ui/`** — supplementary: screenshots for layout/visual context
- **`test-viewpoint.md`** — supplementary: edge cases, known issues

Requirements improve every viewpoint: exact error messages for VAL, business rules for LOGIC, role permissions for SEC.

If also exploring live page: verify spec vs actual, flag mismatches, capture exact text.

### Tier 1 — Lightweight Guard

> Tier 1 uses the quick 3-step strategy (Step 1–3) without full section walking. After generation, verify these checks against `spec.md` — if any are missing, add them before finalizing:

| Spec section | Minimum TC requirement | Tag |
|---|---|---|
| Fields row, `Required=yes` | At least 1 required-error TC per required field | `@high` |
| Validation Rules row | At least 1 exact-message TC per validation rule | `@high` |
| Business Rule bullet | At least 1 behavioral TC per business rule | `@high` |
| Security-sensitive actions (auth, permissions) | At least 1 security check (VP-SEC) | `@high` |
| Entity with lifecycle states | At least 1 key state transition (VP-LOGIC) | `@high` |

Other spec sections (Section header, Default, Accessibility, Notes) are deferred to Tier 2.

### Mapping Contract (Tier 2+ — MANDATORY)

> **Full contract applies from Tier 2 onwards.** Walk `spec.md` top-to-bottom. For every section listed below, you **MUST** produce the indicated TCs. If a section is missing or empty, note it explicitly — do **NOT** silently skip.

#### Table 1 — `spec.md` → TC Mapping Contract

| Spec section | TC requirement | Tier | Tag | Viewpoint |
|---|---|---|---|---|
| Section header | 1 presence TC | T2 | `@low` | VP-UI |
| Fields row, `Required=yes` | 1 per-field required-error TC (individual, not bulk) | T2 | `@normal` | VP-VAL |
| Fields `Constraints` cell (non-empty, non-`—`) | 4 BVA for numeric range; 1 EP for format | T2 | `@normal` | VP-VAL |
| Fields `Constraints` cell (numeric) | 2 extra BVA (`min+1`, `max-1`) + mid-range → total 7-point with T2 | T3 | `@normal` | VP-VAL |
| Fields `Default` cell (non-empty, non-`—`) | 1 default-state TC | T2 | `@low` | VP-UI |
| Fields with dependencies (conditional required, cascading) | 1 cross-field TC per dependency | T3 | `@normal` | VP-VAL |
| Fields accepting free text input | 1 negative input TC (XSS/SQL injection/special chars) | T3 | `@high` | VP-SEC |
| Actions row (primary: submit, create, delete) | 1 edge/alternate behavior TC | T2 | `@normal` | VP-LOGIC |
| Actions row (secondary: cancel, reset, export) | 1 behavior TC | T2 | `@normal` | VP-LOGIC |
| Actions with submit/save | 1 race condition TC (double-submit, back after POST) | T3 | `@normal` | VP-LOGIC |
| Validation Rules row | 1 exact-message TC | T2 | `@normal` | VP-VAL |
| States row (Default/Loading/Error/Success) | 1 visual state TC | T2 | `@normal` | VP-UI / VP-LOGIC |
| States row (other states) | 1 visual TC | T2 | `@low` | VP-UI |
| Business Rule bullet | 1 edge-case behavioral TC; `@manual` if unautomatable | T2 | `@normal` | VP-LOGIC |
| Accessibility tab order | 1 tab-walking TC | T2 | `@low` | VP-UI |
| Notes bullet | classify per content (page title→VP-UI, env→`@manual`, edge→relevant section) | T2 | `@low` | varies |

#### Table 2 — `test-viewpoint.md` → TC Mapping Contract

| Section / format | TC requirement |
|---|---|
| `## Edge Cases` (bulleted) | classify per spec Notes |
| `## Known Issues` (bulleted) | `@manual` TCs with bug ID comment |
| `## Design Decisions` | behavioral TCs |
| `## UI Patterns Identified` | confirm `sungen-viewpoint` pattern checklists |
| `## Priority Viewpoints` | adjust Tier-2 emphasis |
| `## Element Overview` (table) | 1 presence/state TC per row (T2, `@low`) |
| `## State Transitions` (table) | 1 TC per valid transition + key blocked |
| Free-form notes | re-read with heading as context |

### Figma supplement (`spec_figma.md`)

When `requirements/spec_figma.md` is present alongside `spec.md`, treat it as a **secondary input** with these rules:

- **Never override `spec.md`**: `spec.md` is authoritative for all business rules, field constraints, and behavior. `spec_figma.md` only supplements with visual/text data that `spec.md` may lack.
- **`## Text Inventory` → literal strings**: use text label values from this section verbatim in `test-data.yaml` (button labels, input placeholders, error messages shown in Figma). Do not paraphrase or invent alternatives.
- **`## Interaction States` → state coverage checkpoints**: use the listed variants (e.g., empty, loading, error, success) as a checklist for state-coverage scenarios. Only generate scenarios for states that are either (a) confirmed in both `spec.md` and `spec_figma.md`, or (b) explicitly documented in one source without contradiction from the other.
- **Flag disagreements**: if a field name, label, or behavior in `spec_figma.md` contradicts `spec.md`, insert an HTML comment at the top of the `.feature` file:
  ```gherkin
  <!-- FIGMA-SPEC CONFLICT: <brief description> — using spec.md value -->
  ```
  Then proceed using the `spec.md` value.

## Screen Input Sources

**Auto-detect** — the parent command (`create-test`) resolves visual sources before invoking this skill. By the time generation starts, the available sources are already determined:
- `spec.md` — primary, always read if present
- `spec_figma.md` — Figma supplement, read if present (PAT flow already completed)
- `ui/*.png` — visual context, read if present
- `test-viewpoint.md` — edge cases and known issues, read if present

**IMPORTANT:** If `spec_figma.md` exists, do NOT call any `mcp__figma__*` tool. The PAT flow is complete — just read the file.

**Single screen focus**: one URL = one screen. Don't explore sibling paths. Modals on same page = part of this screen.

### Capture Real Data

When exploring live page or reading Figma designs, actively collect to hardcode in `test-data.yaml`:
- User names, option labels, card content, error messages, counter keywords
- **Hardcode first, @manual last** — stale data that fails fast > @manual that never runs

## Section Identification

Identify sections from page patterns. Use `sungen-viewpoint` skill for the 10 pattern types (Form & Inputs, Data Table, Create/Add, Update/Edit, Delete, Search, Filter, Pagination, Modal/Dialog, List/Card). Present sections and ask user which to focus on.

## Test Generation Strategy

### Step 1 — Spec-first extraction (always do this first)

Before applying any checklist, extract test conditions from `spec.md` (and `test-viewpoint.md` if present):
- **Validation rules**: field constraints, error messages, required/optional
- **Business rules**: eligibility, calculation logic, permission-based behavior
- **State lifecycle**: allowed transitions, blocked transitions
- **Edge cases**: boundary values, empty states, concurrent conditions

These spec-extracted conditions drive **which scenarios exist** — `sungen-viewpoint` only supplements with generic web UI coverage that spec doesn't explicitly state.

### Step 2 — Apply test design techniques

Apply `sungen-test-design-techniques` to spec-extracted conditions:

| Technique | Apply when spec mentions |
|---|---|
| EP | Valid/invalid ranges, categories → **one** scenario per class, not per value |
| BVA | Numeric range, string length → `min-1`, `min`, `max`, `max+1` (compact 4-point default) |
| Decision Table | 2+ dependent conditions → one scenario per combination (cap at distinct outcomes if >3 conditions) |
| State Transition | Entity lifecycle → one scenario per valid transition + key invalid transitions |

### Step 3 — Fill coverage gaps with viewpoint checklists

Use `sungen-viewpoint` skill for per-pattern checklists across 4 viewpoints: UI/UX, Data & Validate, Logic, Security.

**Tier-aware gap filling:**
- **Tier 1 (first run)**: only add `@high` items from the checklists. Skip `@normal`/`@low` items. After generation, apply the **Lightweight Guard** to verify coverage.
- **Tier 2 (expand run)**: add `@normal` + `@low` scenarios — UI presence, optional validation, edge cases, cosmetic checks, keyboard nav, hover effects.
- **Tier 3 (deep run)**: do NOT use viewpoint checklists. Instead, re-apply test design techniques with deeper analysis:
  - **BVA**: expand from 4-point to 6-point (`min-1`, `min`, `min+1`, `max-1`, `max`, `max+1`) + typical mid-range value
  - **Decision Table**: enumerate combinations previously capped — cover remaining outcome rows
  - **Cross-field**: identify field dependencies from spec, generate one scenario per dependency
  - **Negative inputs**: add security-oriented inputs (SQL `' OR 1=1`, XSS `<script>`, special chars `<>&"'`, max+100 length)
  - **Race conditions**: double-click submit, browser back after POST, concurrent edit by two users
- **Full (all-at-once)**: apply Tier 1 + 2 + 3 rules in a single pass. Use all viewpoint checklists and all test design technique depths. Mark sections with all three tier comments.

**Validation rule**: capture actual error messages from live page or spec.md. Use `User see {{error_var}}` — never assert just "is visible".

## Priority Tags (auto-assign)

Every scenario **MUST** have exactly one priority tag. Add it before the scenario line (after `@extend:` if present).

**Rule: look at what the WHEN step does and what THEN asserts — that determines the tag.**

| Tag | Scenario type | Examples |
|---|---|---|
| `@high` | Auth actions | login, logout, protected page redirect |
| `@high` | CRUD happy path | create / update / delete → success message or redirect |
| `@high` | Security gate | unauthenticated access → redirected to login |
| `@high` | Primary business flow | core flow step completes successfully |
| `@normal` | Input validation | invalid / empty input → error message shown |
| `@normal` | Boundary / format | email format, length limit, numeric range |
| `@normal` | Secondary features | search, filter, sort, pagination, notification |
| `@normal` | Non-primary state transition | cancel, undo, back |
| `@low` | Element presence | component / section is visible |
| `@low` | Text content | label, placeholder, tooltip, warning text |
| `@low` | Visual / cosmetic | alignment, icon, empty state, hover style |

**`@steps:` scenarios** do NOT get a priority tag (they are setup blocks, not test cases).

### Priority assignment — disambiguation tie-breaker

When in doubt between `@low` and `@normal`, apply this rule:

| Pattern | Tag |
|---|---|
| 0 When steps + Then asserts only `User see [T] type` (presence) | `@low` (always) |
| 0 When steps + Then asserts `User see [T] type with {{value}}` (content) | `@low` (label/text) |
| When steps but no state change (e.g., navigation only) | `@low` |
| When provides invalid input + Then asserts validation error | `@normal` |
| When triggers business logic + Then asserts state change | `@high` or `@normal` per heuristics |

**Example:** `Then User see [Email] field` (no When) → `@low`. `When User fill ... And User click ... Then User see [Error]` → `@normal`.

## SPA Wait-For Steps

```gherkin
Given User is on [Screen] page
And User wait for [Page Title] heading is visible
```

## Cleanup & Hooks

### Auto-assign `@cleanup:*` tags based on screen sections

After identifying screen sections, add appropriate `@cleanup:*` feature-level tags. These activate base.ts fixtures that auto-clean state between tests.

| Screen has | Add tag | Why |
|---|---|---|
| Modal / Dialog / Drawer | `@cleanup:overlay` | Dismiss leftover overlays between tests |
| Form & Inputs / Search / Filter | `@cleanup:forms` | Clear form fields, reset selects |
| Long scrollable content | `@cleanup:scroll` | Scroll to top for consistent assertions |
| Auth tokens / session data in tests | `@cleanup:storage` | Clear sessionStorage |
| CI/CD or debug-heavy screens | `@screenshot:on-failure` | Auto-capture screenshot on test failure |

**Always add `@cleanup:overlay`** if ANY section opens a dialog (Create/Add, Update/Edit, Delete confirmation). Most CRUD screens need it.

**Always add `@cleanup:forms`** if the screen has inline search, filter dropdowns, or editable forms that persist between tests.

### When to add `@afterEach` hook scenario

Only when `@cleanup:*` tags aren't enough — feature-specific cleanup logic:
- Reset a dropdown filter to default value (not just clear)
- Navigate away from a sub-tab back to the main tab
- Close a specific sidebar panel

```gherkin
@afterEach
Scenario: Reset filters to default
  When User select [Status Filter] dropdown with {{default_status}}
```

### `@beforeAll` / `@afterAll` — optional, low priority

For one-time setup/teardown. Most screens don't need these.

### `@parallel` — when tests need independent browser state

Add `@parallel` at feature level when:

1. **Multiple auth groups** (required) — e.g., `@auth:user` + `@no-auth` scenarios. Serial mode uses one shared context and cannot mix auth roles. Compiler will error without this tag.
2. **Validation-heavy features** (recommended) — each scenario fills forms with different invalid data and needs a clean form. Serial shared page keeps previous test's input.

Serial (default) is best for: CRUD flows, sequential user journeys, UI checks on the same page.

```gherkin
@parallel @auth:user
@cleanup:forms
Feature: kudos Screen

  @high
  Scenario: Send kudos
    ...

  @high @no-auth
  Scenario: Unauthenticated user is redirected
    ...
```

## Output Format

**Feature file** — `qa/screens/<screen>/features/<screen>.feature`

`Background` is valid for simple shared setup (navigate to page). Use `@steps`/`@extend` for complex flows with scope (dialog, frame).

```gherkin
@auth:role
@cleanup:overlay
@cleanup:forms
Feature: <Screen> Screen

  Background:
    Given User is on [Screen] page

  # Shared setup — NO priority tag on @steps
  @steps:open_form
  Scenario: Open form
    When User click [Create] button
    Then User see [Form] dialog

  # --- Section: Create User Form (Tier 1: @high) ---

  @high @extend:open_form
  Scenario: VP-LOGIC-001 Submit form with valid data creates record
    Given User is on [Form] dialog
    When User fill [Name] field with {{valid_name}}
    And User click [Submit] button
    Then User see {{success_message}} message

  @high @extend:open_form
  Scenario: VP-VAL-001 Submit with all empty fields shows errors
    Given User is on [Form] dialog
    When User click [Submit] button
    Then User see [Name error] message with {{name_required_error}}

  # --- Section: User Table (Tier 1: @high) ---

  @high
  Scenario: VP-VAL-010 Table displays correct data
    Then User see [Users] table match data:
      | Name       | Email        |
      | {{name_1}} | {{email_1}}  |

  @high
  Scenario: VP-SEC-010 Unauthorized user cannot access page
    Given User is not logged in
    When User navigate to [Screen] page
    Then User is on [Login] page
```

**Tier 2 (expand run)** appends sections with `# --- Section: X (Tier 2: @normal + @low) ---` comments. Adds UI field presence, hover states, tooltips, empty states.

**Tier 3 (deep run)** appends sections with `# --- Section: X (Tier 3: deep) ---` comments. Adds extra BVA boundaries, cross-field validation, negative/destructive inputs, concurrent/race conditions.

### When to use DataTable vs Row Scope

| Pattern | Use when |
|---|---|
| `table match data:` + DataTable | Verifying **multiple rows** exist with expected values |
| `row in [Table] table with {{v}}` + `column with {{v}}` | Checking **single row** details or **acting** on a row (click, edit) |

**Naming**: `VP-<CATEGORY>-<NNN>` prefix. Scenario name must use the **same element type** as the steps — e.g., if the step uses `dialog`, write "dialog opens" not "modal opens".

**Test data** — `qa/screens/<screen>/test-data/<screen>.yaml`, grouped by section. Data is loaded **at runtime** — keys become runtime lookups, not hardcoded strings. The same compiled test works across environments.

**Environment-specific data**: create `<screen>.<env>.yaml` alongside the base file with only the keys that change. Users run `SUNGEN_ENV=staging npx playwright test` to merge overrides.

**i18n / multilingual**: use the same `SUNGEN_ENV` overlay for locale variants — e.g., `login.vi.yaml`, `login.staging-ja.yaml`. Include `lbl_*` / `msg_*` keys for selector `{{variable}}` references (see `sungen-selector-keys` § i18n). One feature file + one selector file works across all locales.

## Flow Test Generation

When generating tests for a **flow** (`qa/flows/<name>/`), adapt the strategy:

### Structure

- **Background** — starting page only: `Given User is on [Login] page`
- **Scenarios** — each phase of the E2E journey as a separate scenario
- **Selector refs** — use `[Screen:Element]` namespace format (see `sungen-gherkin-syntax`)
- **Test data** — namespace by phase: `login.email`, `submission.nominee`
- **Feature tag** — `@flow` required at feature level

### Flow vs Screen Differences

| Aspect | Screen | Flow |
|---|---|---|
| Section focus | UI patterns per section | Journey phases across screens |
| Viewpoints | VP-UI, VP-VAL, VP-LOGIC, VP-SEC per section | VP-LOGIC (flow transitions), VP-SEC (auth persistence), VP-VAL (cross-screen data) |
| Tier 1 focus | Happy path + required validation per section | Happy path through entire flow + auth + key error recovery |
| Background | Navigate to screen | Navigate to starting page |

### Flow-specific scenarios by tier

| Category | Tier | Examples |
|---|---|---|
| **Happy path** | T1 | Complete flow end-to-end with valid data |
| **Auth persistence** | T1 | Auth state maintained across screen transitions |
| **Error recovery** | T1 | Invalid input mid-flow → fix → continue |
| **Incomplete flow** | T2 | User abandons at each phase → state cleanup |
| **Cross-screen data** | T2 | Data entered on screen A visible on screen B |
| **Screen transition edges** | T2 | Back button, refresh, deep link mid-flow |
| **UI state across screens** | T2 | Breadcrumb, progress indicator, nav state |
| **Negative inputs mid-flow** | T3 | XSS/SQL in cross-screen fields, special chars |
| **Concurrent flow** | T3 | Two tabs same flow, session expiry mid-flow |
| **Cross-screen validation** | T3 | Field dependency across screens, cascading errors |

### Flow Lightweight Guard (Tier 1)

> After generating Tier 1 flow scenarios, verify these checks — if any are missing, add them:

| Flow requirement | Minimum TC | Tag |
|---|---|---|
| Complete flow end-to-end with valid data | At least 1 happy path scenario | `@high` |
| Auth state across screen transitions | At least 1 auth persistence check (if flow crosses auth) | `@high` |
| Invalid input mid-flow → fix → continue | At least 1 error recovery scenario | `@high` |

### Flow Section Comments

Flow features use the same `# --- Section:` comment format, with phase names instead of UI sections:

```gherkin
# --- Section: Login Phase (Tier 1: @high) ---
# --- Section: Submission Phase (Tier 2: @normal + @low) ---
```

Update Mode tier detection works identically — scan for tier markers in these comments.

### Output Format (Flow)

```gherkin
@flow @auth:user
Feature: Award Submission Flow

  Background:
    Given User is on [Login] page

  # --- Section: Login Phase (Tier 1: @high) ---

  @high
  Scenario: User login successfully
    When User fill [Login:Email] field with {{login.email}}
    And User fill [Login:Password] field with {{login.password}}
    And User click [Login:Submit] button
    Then User see [Dashboard] page

  # --- Section: Submission Phase (Tier 1: @high) ---

  @high
  Scenario: User navigates to awards and submits
    Given User is on [Awards] page
    When User fill [Awards:Nominee] field with {{submission.nominee}}
    And User fill [Awards:Reason] field with {{submission.reason}}
    And User click [Awards:Submit] button
    Then User see [Awards:Success Message] text with {{submission.success_message}}
```

```yaml
# test-data — namespaced by phase
login:
  email: "user@example.com"
  password: "Password123"

submission:
  nominee: "John Doe"
  reason: "Outstanding contribution to the team"
  success_message: "Award submitted successfully"
```

**Do NOT generate**: `selectors.yaml` (created during run-test), Playwright code (sungen compiles).
