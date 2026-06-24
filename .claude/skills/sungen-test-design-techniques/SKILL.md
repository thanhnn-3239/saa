---
name: sungen-test-design-techniques
description: 'Test design techniques (EP, BVA, Decision Table, State Transition) for systematic scenario generation from spec constraints. Auto-loaded by create-test command.'
user-invocable: false
---

## When to Apply

| Technique | Apply when spec mentions |
|---|---|
| EP (Equivalence Partitioning) | Input types, categories, roles, valid/invalid ranges |
| BVA (Boundary Value Analysis) | Numeric range, string length, date range, count limit |
| Decision Table | 2+ mutually dependent conditions with different outcomes |
| State Transition | Entity lifecycle, workflow states, status changes |

**Rule:** These techniques determine **how many** and **which** scenarios to generate. `sungen-viewpoint` determines **which viewpoints** to cover.

---

## 1. Equivalence Partitioning (EP)

**Goal:** One representative per input class. If one value in a partition passes, all values in that partition pass.

**How to apply:**
1. Extract partitions from `spec.md` constraints (e.g., field accepts 1-100)
2. Valid class: 1 <= value <= 100
3. Invalid class (below): value < 1
4. Invalid class (above): value > 100
5. Write **one** scenario per class

**Anti-pattern:**
```gherkin
# BAD — 3 scenarios, same class, same result:
Scenario: VP-VAL-001 Enter value 10
Scenario: VP-VAL-002 Enter value 50
Scenario: VP-VAL-003 Enter value 80
```
```gherkin
# GOOD — one representative per class:
Scenario: VP-VAL-001 Valid range value is accepted       # value = 50
Scenario: VP-VAL-002 Below minimum is rejected           # value = 0
Scenario: VP-VAL-003 Above maximum is rejected           # value = 101
```

---

## 2. Boundary Value Analysis (BVA)

**Goal:** Test exact edges where off-by-one errors occur (`>` vs `>=`, `<` vs `<=`).

### Two modes

| Mode | Values | Use when |
|---|---|---|
| **Compact (default)** | `min-1`, `min`, `max`, `max+1` | Most fields |
| **Full 6-point** | `min-1`, `min`, `min+1`, `max-1`, `max`, `max+1` | Critical fields with `@high` priority |

**How to apply** (example: "quantity must be 1-10"):
- `min-1` = 0 -> invalid
- `min` = 1 -> valid (lower boundary)
- `max` = 10 -> valid (upper boundary)
- `max+1` = 11 -> invalid
- Midpoint (e.g., 5) already covered by EP valid class

**BVA scenarios** (example: quantity 1-10):
- `@high VP-VAL-010 Below minimum (0) is rejected`
- `@high VP-VAL-011 Minimum boundary (1) is accepted`
- `@high VP-VAL-012 Maximum boundary (10) is accepted`
- `@high VP-VAL-013 Above maximum (11) is rejected`

### Expected outcome contract (MANDATORY)

When generating BVA scenarios, the **Then** assertion **MUST** match the scenario name's outcome verb:

| Name verb | Expected `Then` assertion |
|---|---|
| "is accepted" / "passes validation" | NO validation error visible. Form proceeds OR field is in normal state. Use `User see [Field Error] message is hidden` if uncertain. |
| "is rejected" / "fails validation" / "shows error" | Specific validation error visible with exact message text from spec. |

**Anti-pattern (do NOT generate):**

```gherkin
# BAD: name says "passes validation" but asserts auth error
Scenario: VP-VAL-005 Email at maximum boundary (254 chars) passes validation
  When User fill [Email] field with {{email_max_254}}
  And User fill [Password] field with {{valid_password}}
  And User click [Login] button
  Then User see [Auth Error] message with {{auth_error_message}}
```

**Correct pattern:**

```gherkin
# GOOD: name and assertion aligned
@normal
Scenario: VP-VAL-005 Email at maximum boundary (254 chars) passes validation
  When User fill [Email] field with {{email_max_254}}
  And User fill [Password] field with {{valid_password}}
  And User click [Login] button
  Then User see [Email Error] message is hidden

@normal
Scenario: VP-VAL-006 Email at maximum+1 (255 chars) fails validation
  When User fill [Email] field with {{email_over_max_255}}
  And User fill [Password] field with {{valid_password}}
  And User click [Login] button
  Then User see [Email Error] message with {{email_too_long_error}}
```

---

## 3. Decision Table

**Goal:** Cover all condition combinations when 2+ conditions constrain each other.

**How to apply:** List conditions from `spec.md` → build combination→outcome table → one scenario per row.

**Cap:** When >3 boolean conditions (>8 rows), prioritize rows with **distinct outcomes** and add `@manual` for exhaustive combos.

**Example** — Submit requires valid form AND permission → 4 combos, 2 distinct outcomes:
- `@normal` Form invalid + no permission → disabled
- `@normal` Form valid + no permission → disabled
- `@normal` Has permission + form invalid → disabled
- `@high` Form valid + has permission → succeeds

---

## 4. State Transition

**Goal:** Verify every valid transition AND block invalid ones.

**How to apply:** Extract state diagram from `spec.md` → one scenario per valid transition + key invalid transitions.

**Example** — Order lifecycle (Draft→Pending→Approved→Completed):
- `@high` Valid: Draft → Pending, Pending → Approved, Approved → Completed
- `@normal` Invalid: Completed → Draft (blocked), Pending → Completed (skip approval)

**test-data:** Use named state keys (`order_in_draft`, `order_in_pending`).
