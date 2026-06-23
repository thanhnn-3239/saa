---
name: sungen-viewpoint
description: '10 UI patterns x 4 viewpoints — structured checklist for test case generation and review. Auto-loaded by create-test and review commands.'
user-invocable: false
---

## 4 Viewpoints

| VP | Focus | Keyword |
|---|---|---|
| **UI/UX** | Interface states, layout, feedback | VP-UI |
| **Data & Validate** | Input constraints, data integrity, error messages | VP-VAL |
| **Logic** | Business rules, interactions, state changes | VP-LOGIC |
| **Security** | Auth, injection, permissions | VP-SEC |

## Shared Checks (apply across all patterns)

These appear in multiple patterns — test once per screen, not per pattern:

| Check | ER |
|---|---|
| **Loading State** | Spinner/skeleton shown, UI interaction locked during fetch |
| **Empty State** | Clear message when no data, layout intact |
| **XSS/Injection** | Malicious input sanitized to plain text, never executed |
| **URL Manipulation** | Invalid URL params fallback to defaults, no server crash |

---

## GROUP 1: DATA ENTRY

### 1. Form & Inputs

**UI/UX**
- Field States: disabled/readonly fields dimmed and locked, no interaction allowed
- Button States: Submit disabled when form invalid, auto-enabled when valid
- Keyboard Nav: Tab order correct, Enter submits form

**Data & Validate**
- Required/Optional: blank required field shows error; optional allows blank
- Boundaries & Format: min/max length, format (email, number) with error messages
- Whitespace: auto-trim or reject spaces-only input
- Error Recovery: error at correct field, disappears immediately when user corrects data

**Logic**
- Field Dependencies: Field A value determines Field B status/options
- Double Submit Prevention: button disabled after first click, only 1 request sent
- Success Flow: redirect / success toast / form reset
- Failure Flow: server error retains form data + shows system error

**Security**
- → Shared: XSS/Injection

---

## GROUP 2: DATA MANAGEMENT

### 2. Data Table

**UI/UX**
- → Shared: Empty State, Loading State
- Truncation: long content shows `...` with tooltip on hover, column width stable
- Sticky Elements: fixed header on vertical scroll, fixed action column on horizontal scroll

**Data & Validate**
- Record Count: "Total records" on UI matches server data exactly
- Row Limit: displayed rows never exceed configured page size
- Cell Integrity: cell data matches database, correct format (date, currency, status label)

**Logic**
- Sorting: column sort refreshes table with correct order, updates header icon
- Row Actions: Edit/Delete/View buttons act on correct row ID

**Security**
- RBAC: hide sensitive columns or privileged action buttons without authority
- → Shared: XSS/Injection (data from DB displayed safely)

---

### 3. Create / Add

**UI/UX**
- Blank Slate: all fields empty or BA-specified defaults, NO cache from previous operation
- Required Indicator: required fields marked with visual cue (e.g., red *)
- Unsaved Changes: navigate away with dirty form → browser/system warning popup

**Data & Validate**
- → Inherited: all Form & Inputs validation rules apply
- Unique Constraint: duplicate unique field (e.g., Employee ID) → reject save, inline error
- Data Dependency: selecting parent field loads correct child options

**Logic**
- Save & Close: toast notification, redirect to list, new record visible per sort rule
- Save & Add Another: save to DB, form resets to blank for next entry
- Double Submit Prevention: → same as Form & Inputs
- Cancel: form closes, NO garbage record in DB, next open shows blank form

**Security**
- API Bypass / 403: unauthorized POST → system blocks (403 Forbidden), no record created
- → Shared: XSS/Injection (persisted safely, not executed on display)

---

### 4. Update / Edit

**UI/UX**
- Pre-fill / Data Binding: all fields display exact current DB data (text, dropdown, radio, date...)
- Readonly Fields: identity fields (ID, username, employee code) disabled, no interaction
- Cancel: no data changed in DB; if dirty → unsaved changes warning

**Data & Validate**
- → Inherited: all Form & Inputs validation rules apply
- Unique Self: saving without changing unique field → success, no self-duplicate error
- Unique Conflict: changing unique field to existing value → duplicate error, block save
- Unchanged Submit: Save disabled until dirty, or success without DB UPDATE

**Logic**
- Update Success: toast "Updated successfully", new data reflects on UI immediately without reload
- Concurrent Edit: another user already edited → conflict warning, require reload

**Security**
- Authorization / 403: access edit without permission → 403 page
- Not Found / 404: edit deleted object → 404

---

### 5. Delete

**UI/UX**
- Confirmation: click Delete → MUST show confirmation dialog, delete button in warning color
- Cancel: popup closes, record intact on UI and DB, no API called
- Success Update: toast "Deleted successfully", record disappears immediately without reload
- Pagination Fallback: delete only record on current page → auto-navigate to previous page

**Data & Validate — Dependencies**
- Independent: delete succeeds normally
- Referenced (Restrict): delete parent with children → blocked, clear error "in use at [Module]"
- Referenced (Cascade): warning first, then deletes parent AND all related children
- Referenced (Set Null): parent deleted, child reference set to Unassigned/Empty

**Logic — Storage**
- Soft Delete: record hidden from UI, DB retains with status flag (is_deleted, deleted_at)
- Hard Delete: record removed from UI AND permanently deleted from DB

**Security**
- Deleted Access / 404: soft or hard delete → direct URL/API returns 404
- API Bypass: API delete on restricted object → backend rejects with business error, no 500

---

### 6. Search

**UI/UX**
- → Shared: Empty State ("No results found"), Loading State
- Clear Action: search box empties, list reloads default data

**Data & Validate**
- Whitespace: auto-trim, results match cleaned keyword
- Input Limits: prevent beyond max length or show error
- Normalization: case-insensitive, handles accented characters correctly

**Logic**
- Matching: partial/exact match returns correct results, no 500
- Multi-keyword: results based on AND/OR logic per spec
- Debounce: ~300ms delay before API call

**Security**
- → Shared: XSS/Injection
- Wildcards: `%`, `_`, `*` treated as literal text (escaped), not DB commands

---

### 7. Filter

**UI/UX**
- Feedback: selected filters displayed as tags/badges
- Persistence: collapse/expand retains selected values
- Conflicts: conflicting conditions show "No data" message, layout intact

**Data & Validate**
- Range Validation: start > end or min > max → field error, Apply disabled
- Dropdown Integrity: options match 100% of actual data, hide unauthorized values

**Logic**
- AND/OR Logic: results satisfy correct filter logic, total count updated
- Dependent Filters: selecting Filter A updates Filter B options
- Reset & Navigation: reset returns original data or preserves state per spec

**Security**
- → Shared: URL Manipulation

---

### 8. Pagination

**UI/UX**
- Boundary States: Previous/First disabled on page 1, Next/Last disabled on last page
- Active Page: highlighted, loading effect during page transition
- Hidden: pagination bar hidden when data fits one page

**Data & Validate**
- Label Consistency: "Viewing X of Y" matches actual data exactly
- Zero Records: pagination hidden, empty state displayed

**Logic**
- Navigation: loads correct dataset for page (page 2, limit 10 = records 11-20)
- Change Page Size: shows correct quantity, resets to page 1
- Interaction Resets: new search/filter resets to page 1

**Security**
- → Shared: URL Manipulation

---

## GROUP 3: NAVIGATION & CONTAINERS

### 9. Modal / Dialog

**UI/UX**
- Overlay: centered modal, backdrop blur, background scroll locked
- Focus Trapping: Tab key cycles only within modal elements
- Responsive: modal resizes, action buttons always visible or scrollable

**Data & Validate**
- Dismiss Actions: close via X, Cancel, Escape, backdrop click → resets data to default on reopen

**Logic**
- Submit Success: action button shows loading, modal closes, background data updated
- Submit Failure: modal stays open, shows error message, retains entered data
- Stacked Modals: Modal B over A has higher z-index, closing B keeps A intact

**Security**
- DOM Cleanup: remove HTML from DOM on close to protect sensitive data
- Reload: handles deep linking if present

---

## GROUP 4: DISPLAY PATTERNS

### 10. List / Card

**UI/UX**
- → Shared: Empty State, Loading State
- Hover Effect: shadow/scale on card hover
- Content: text truncation without breaking card height, placeholder image on broken image

**Data & Validate**
- Integrity: data fields (price, status, tag) 100% accurate vs system
- Total Count: matches actual database count after filtering

**Logic**
- Navigation: clicking card navigates to correct detail page
- Direct Actions: Like/Add to Cart updates immediately without reloading list
- Infinite Scroll / Load More: appends records, maintains scroll position
- Layout Toggle: Grid/List view switch changes UI but preserves data

**Security**
- RBAC: hide sensitive data or privileged buttons from DOM
- Network Resilience: error message + "Retry" button on connection loss

---

## Security Tag Rules

For VP-SEC scenarios testing **unauthorized access** (no login, wrong role, direct URL):
- Use **`@no-auth`** tag — runs without authentication to verify redirect/block.
- Do NOT use `@manual` for these — they are automatable.

```gherkin
@high @no-auth
Scenario: VP-SEC-001 Unauthenticated user cannot access admin page
  Given User is on [Admin] page
  Then User see [Login] page
```

Use `@manual` only when the environment truly cannot be set up automatically.
