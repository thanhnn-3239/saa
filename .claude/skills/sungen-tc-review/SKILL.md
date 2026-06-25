---
name: sungen-tc-review
description: 'Test case review — scoring rubric, quality rules, checklist. Auto-loaded by review command.'
user-invocable: false
---

## Scoring (3 dimensions, 100 points total)

**>= 60%**: PASS | **< 60%**: FAIL — guide improvements

### Syntax (30 pts)

| Check | Pts |
|---|---|
| Steps match `sungen-gherkin-syntax` patterns | 10 |
| Correct `[Ref] type with {{value}}` structure | 5 |
| Given = setup, When = action, Then = assertion | 5 |
| All `{{variables}}` exist in test-data.yaml | 5 |
| Valid tags, no duplicate scenarios | 5 |

### Coverage (40 pts)

| Dimension | Technique | Pts | What to check |
|---|---|---|---|
| Happy paths | — | 8 | Core success flows exist |
| Negative cases | EP | 8 | One scenario per invalid class, no redundant same-class scenarios |
| Edge cases | EP | 6 | Empty, null, whitespace, special chars covered |
| Boundary values | BVA | 8 | `min-1`, `min`, `max`, `max+1` for each spec range |
| State transitions | ST | 5 | Valid transitions + key blocked paths from spec |
| Condition combos | DT | 5 | Dependent conditions covered, distinct outcomes tested |

Score: `(dimensions_covered / 6) * 40`. Validate technique application with `sungen-test-design-techniques`. Per-pattern checklists → `sungen-viewpoint` skill.

### Viewpoint (30 pts)

| Check | Pts |
|---|---|
| All applicable VP present (UI/VAL/LOGIC/SEC) | 10 |
| Correct classification | 8 |
| `VP-<CAT>-<NNN>` naming + section grouping | 4 |
| Priority tag present and correct (`@high`/`@normal`/`@low`) | 4 |
| Assertion quality (see rules below) | 4 |

**Classification**: UI = static/always-same appearance. VAL = input validation/errors. LOGIC = behavior/state changes (includes persisted state without When). SEC = auth/permissions.

**Tier-aware scoring**: If the feature file only contains `@high` scenarios (Tier 1), do NOT penalize for missing VP-UI viewpoint — UI scenarios are intentionally deferred to Tier 2. Score "All applicable VP present" based on Tier 1-relevant viewpoints only (VAL, LOGIC, SEC). Note in the review output: *"VP-UI deferred to Tier 2 — run `/sungen:create-test` with 'Add viewpoints' to expand."*

---

## Quality Rules

### Assertion Quality

1. **No bare `is visible`** — `User see [T] type` already asserts visibility. Only use `is hidden` for negation.
2. **Assert content, not existence** — add `with {{value}}` or `is state`. Every assertion answers: what EXACTLY should the user see?
3. **Group related assertions** — one scenario can have 3-7 Then/And steps. Don't waste a scenario on one element.

### Action-Result Coherence

1. **`When click [X]`** → Then must assert a **new element** (dialog, dropdown, page) or **state change** on X (disabled, checked). Never assert X unchanged.
2. **`When fill [X]`** → Then must assert the **visible result** (search results, validation error). Don't re-assert the field value.
3. **UI-only scenarios** (no action needed) → use Given + Then without When.
4. **Scenario name must match the assertion**, not the action.
5. **Scenario name must use the same element type as the steps** — e.g., "dialog opens" + `[X] dialog`, never "modal opens" + `[X] dialog`.

### @manual Rules

Only use `@manual` when environment can't be set up automatically:
- Real files on disk, network simulation, backend-only state, timing-dependent

Do NOT mark `@manual` when data is visible in snapshot or documented in spec — hardcode it in test-data.yaml.

`@manual` scenarios must still have complete Given/When/Then + comment explaining why manual.

---

## Checklist (auto-fix on detection)

1. **Redundant scenarios (EP violation)** — multiple scenarios testing same equivalence class? Keep one representative, remove rest
2. **Misclassified VP** — UI tests behavior? Move to LOGIC. Logic tests appearance? Move to UI
3. **Dynamic content** — exact match on counters/timestamps? Use `contains` instead
4. **Duplicate across sections** — SEC scenario identical to UI? Remove duplicate
5. **Missing/wrong priority tag** — every non-`@steps` scenario needs exactly one of `@high`/`@normal`/`@low`. SEC/CRUD happy path/auth→`@high`, validation/secondary features→`@normal`, presence/cosmetic→`@low`
6. **Always-enabled elements** — `is enabled` on never-disabled element? Remove
7. **Test-data completeness** — every `{{var}}` must exist in test-data.yaml
8. **Missing BVA boundaries** — spec defines min/max range but scenarios only test midpoint? Add `min-1`, `min`, `max`, `max+1`
9. **Missing state transitions** — spec defines lifecycle states but only happy path tested? Add blocked transitions
10. **Uncovered condition combos** — spec has 2+ dependent conditions but only partial combinations tested? Build decision table

---

## Flow Review Additions

When reviewing a `@flow` feature (`qa/flows/<name>/`), apply standard scoring PLUS these flow-specific checks:

### Syntax — additional checks
- `[Screen:Element]` format used consistently (not mixing bare `[Element]` refs)
- YAML keys quoted with colon: `"login:submit":` not `login:submit:`
- `@flow` tag present at feature level

### Coverage — additional dimensions
| Dimension | Pts (from existing 40) | What to check |
|---|---|---|
| Screen transitions | (part of State transitions) | Each screen-to-screen navigation tested |
| Auth persistence | (part of Happy paths) | Auth state maintained across transitions |
| Error recovery mid-flow | (part of Negative cases) | Invalid input at each phase → fix → continue |
| Cross-screen data | (part of Edge cases) | Data entered on screen A asserted on screen B |

### Viewpoint — flow-specific classification
- **VP-LOGIC** — screen transitions, navigation flow, auth persistence
- **VP-VAL** — cross-screen data consistency, form data carried across pages
- **VP-SEC** — auth state across redirects, permission changes mid-flow
- VP-UI is typically minimal in flows (focus on functionality over layout)

### Checklist — flow-specific items
11. **Missing screen transitions** — flow visits 4 screens but only 2 transitions tested? Add missing
12. **Orphan scenarios** — scenario doesn't connect to previous/next phase? Flag broken flow
13. **Selector namespace consistency** — mixing `[Submit]` and `[Login:Submit]` in same flow? Standardize

---

## Output Format

```markdown
## Review: <screen>

| Dimension | Score | Max |
|---|---|---|
| Syntax | <n> | 30 |
| Coverage | <n> | 40 |
| Viewpoint | <n> | 30 |
| **Total** | **<n>%** | **100** |

### Issues
1. [SYNTAX] ...
2. [COVERAGE] ...
3. [VIEWPOINT] ...

### Recommendations (if < 60%)
- ...
```
