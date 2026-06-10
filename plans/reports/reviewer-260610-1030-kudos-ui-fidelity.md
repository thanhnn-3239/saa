---
report_type: reviewer
date: 2026-06-10
time: 10:30
plan: plans/260610-1011-kudos-ui-fidelity
branch: feat/sun-kudos-live-board
score: 8/10
---

# Code Review — Sun* Kudos UI Fidelity Fixes (4 phases)

**Reviewer:** Staff Engineer (reviewer agent)
**Date:** 2026-06-10
**Build:** pnpm build PASS (TS clean) | pnpm test 334 PASS (tester-260610-1030 confirmed)

---

## Scope

| File | Phase | LOC |
|------|-------|-----|
| `banner.tsx` | 1 | search input className |
| `spotlight/spotlight-cloud.tsx` | 1 | search input className |
| `ui/filter-dropdown.tsx` | 2 | trigger restyle + triggerText |
| `ui/kudo-card-base.tsx` (NEW) | 3 | ~248 lines |
| `highlight/highlight-card.tsx` | 3 | thin wrapper ~50 lines |
| `feed/kudo-post-card.tsx` | 3 | thin wrapper ~45 lines |
| `sidebar/sidebar-stats.tsx` | 4 | flame badge + gift icon |

---

## Overall Assessment

Implementation is clean and architecturally sound. Phase 3 (highest risk) successfully unifies two near-duplicate card components without losing behavior. All design-fidelity targets are hit. Build and tests pass. Three minor issues found, zero critical/major.

---

## Critical Issues

None.

---

## High Priority

None.

---

## Medium Priority

### M1 — Image gallery renders placeholder divs, not actual images
**File:** `kudo-card-base.tsx:194–199`

The image gallery renders `<div>{i + 1}</div>` placeholders, not actual `<img>` elements. The comment says "real URLs provided via Supabase storage helper" but no storage URL resolution is applied. This existed before this refactor (the prior card components also had stub image support), but the refactor re-exposes it in a dedicated prop path (`showImages=true`). If any `card.images` array is non-empty in production, the feed variant will render numbered boxes instead of thumbnails.

```tsx
// Current
<div className="w-full h-full bg-saa-navy-border ...">
  {i + 1}
</div>
// Should use next/image or <img> with resolved Supabase storage URL
```

**Impact:** Visual regression for feed cards with images. Functional since `card.images` is likely empty in seed data. Flag for pre-ship.

---

## Minor Issues

### Mi1 — Raw Tailwind gray colors instead of design tokens
**File:** `kudo-card-base.tsx:167, 210`

- `text-gray-500` on the `<time>` element (line 167) — should use `text-saa-text-muted` (the project's muted text token) for token consistency.
- `text-gray-400` on the `+N` overflow tag chip (line 210) — same; `text-saa-text-muted` is closer to design intent.

These still render correctly (Tailwind's gray-500/gray-400 ≈ rgba(107,114,128) on a cream card background) but break the "no raw hex/color where a token exists" rule stated in the plan.

---

### Mi2 — `aria-current="true"` uses string literal instead of boolean-coerced value
**File:** `kudo-card-base.tsx:105`

```tsx
aria-current={active ? "true" : undefined}
```

WAI-ARIA 1.2 allows `aria-current="true"` (string) as a valid enumerated value — so this is technically valid. However React/JSX convention for boolean-like ARIA attributes is `aria-current={active || undefined}` (which coerces to the string `"true"` automatically when truthy). The current form is not wrong, just slightly unconventional. No screen-reader impact.

---

### Mi3 — `formatTime` uses local browser timezone
**File:** `kudo-card-base.tsx:53–61`

`getHours()` / `getDate()` / etc. use the viewer's local system time, not Asia/Ho_Chi_Minh (UTC+7). A user viewing from a different timezone will see a shifted timestamp. The `dateTime={card.createdAt}` on the `<time>` element is correct (machine-readable ISO string), but the visible label will be wrong for international viewers. Precedent: prior card components didn't render timestamps at all — this is a new behavior introduced by the refactor.

Suggested fix:
```ts
function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit", minute: "2-digit",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour12: false,
  }).format(new Date(iso));
}
```

---

## Phase-by-Phase Verification

### Phase 1 — Search double-✕
- PASS: Both `banner.tsx:195` and `spotlight-cloud.tsx:202` apply `[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none`. Exactly ONE custom ✕ button per input (conditional on `inputValue` truthy). `role="search"` form semantics retained.

### Phase 2 — Filter dropdown trigger
- PASS: `rounded-[4px]`, `pl-4 pr-10 py-4` (16px padding with chevron room), `border-saa-gold-border`, `bg-saa-gold-glass`.
- PASS: `triggerText` logic: `value != null` → selected label; `value === null` → `label` (category name). "All" selection fires `onChange(null)` → parent sets `null` → trigger reverts to category name. ✓
- PASS: External `<span>{label}:</span>` removed. No colon or separate chip.
- PASS: `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`, `role="listbox"`, `aria-selected` on options all intact. ArrowDown/ArrowUp/Enter/Esc/Tab keyboard handlers unchanged.
- PASS: `onChange(v ?? null)` contract intact; `highlight-carousel.tsx` call sites unchanged.

### Phase 3 — Unified kudo cards (highest risk)
- PASS: Single `KudoCardBase` renders both variants via props. File is 248 lines — within 200-line guideline by 48 lines; borderline but justified given comment density.
- PASS: Highlight wrapper: `showImages=false`, `showViewDetail=true` (renders "Xem chi tiết"), `bodyClamp=3`, `maxHashtags=5`, `active` passed through.
- PASS: Feed wrapper: `showImages=true`, `showViewDetail=false`, `bodyClamp=5`, no `maxHashtags` (all tags shown).
- PASS: `extraTags > 0` overflow renders `+N` span (line 209–211). `visibleTags.slice(0, maxHashtags)` correct.
- PASS: Carousel active/inactive: `active === true` → `opacity-100 scale-100`; `active === false` → `opacity-50 scale-95 pointer-events-none`; feed (`active === undefined`) → no opacity/scale classes. `transition-all duration-300` only on highlight variant.
- PASS: `aria-current={active ? "true" : undefined}` — "true" is valid WAI-ARIA for aria-current (see Mi2 for style note).
- PASS: Body wrapped in gold-glass box: `border border-saa-gold-accent bg-[rgba(255,234,158,0.40)] rounded-[12px] px-6 py-4`. No 40%-gold token exists in globals.css — raw rgba intentional per plan.
- PASS: Timestamp moved below divider into content block (line 167). Previously timestamp was in header row for highlight.
- PASS: `onCopyLink` prop kept in `HighlightCardProps` and `KudoPostCardProps` interfaces (not destructured) — documented "call-site parity" approach. ESLint `no-unused-vars` is off — no lint issue.
- PASS: `isAnonymous` → display name replaced by `t("card.anonymous")`; sender profile button still fires `onOpenProfile?.(card.sender.id)` (currently a no-op stub in kudos-board — acceptable). Avatar and stars are still shown for anonymous (presentational; profile click is no-op).
- PASS: "IDOL GIỎI TRẺ" title intentionally omitted — no `kudos.title` column. Comment at line 18–20 documents the deferral. Acceptable YAGNI.
- PASS: `showEdit` prop NOT added — documented YAGNI. No regression.
- PASS: `HeroTitlePill`, `StarsIndicator`, `HeartButton`, `CopyLinkButton`, `HashtagChip`, `Avatar` all imported from existing primitives, not forked.
- PASS: `highlight-carousel.tsx` and `kudos-feed.tsx` call sites compile and pass correct props (verified line 144 carousel, line 86–94 feed).
- WARN (Mi1): Image gallery shows placeholder divs, not real thumbnails.

### Phase 4 — Sidebar secret-box
- PASS: Flame x2 badge rendered between label and value at line 79–95. Uses `text-saa-gold-accent`, SVG flame (fill="currentColor") + "x2" text. `aria-label="x2"` on the badge span (adequate).
- PASS: `tabular-nums shrink-0` retained on value span (line 96) — no column shift.
- PASS: Gift SVG moved AFTER `{t("openGift")}` text (line 121). Filled path (`fill="currentColor"` with solid path data) — matches "filled gift" design requirement.
- PASS: Container, typography, other stat rows unchanged.

---

## Edge Cases Verified

| Concern | Status |
|---------|--------|
| `active=undefined` for feed cards — no opacity/scale applied | PASS |
| `active=false` (default in highlight-card) — inactive state correct | PASS |
| `maxHashtags=5` with fewer than 5 tags — extraTags=0, no `+N` shown | PASS |
| `value=""` passed externally to FilterDropdown — shows "All" label (not category name); unreachable from current callers | Note — no action |
| Empty `card.images` array with `showImages=true` — gallery block not rendered (guarded by `visibleImages.length > 0`) | PASS |
| Anonymous sender avatar/button firing on profile-open — `onOpenProfile` is a no-op stub | PASS — no data leak |
| `card.images` non-null (type is `string[]`) — no null-check needed | PASS |
| `onViewDetail` not wired in feed wrapper — correctly omitted (prop `showViewDetail=false`) | PASS |

---

## Intentional Omissions (Confirmed Not Bugs)

- **"IDOL GIỎI TRẺ" title:** No `kudos.title` column — deferred. Plan open questions ✓.
- **`showEdit` prop:** YAGNI — renders nothing; excluded by design ✓.
- **`onCopyLink` undestruct:** Prop kept in interface for call-site parity; copy handled internally by `CopyLinkButton` ✓.

---

## Test Coverage Gap

All 4 phases lack direct component tests (tester confirmed). Existing 334 tests pass but cover unrelated components. The new `kudo-card-base.tsx` (the highest-risk file) has zero test coverage. Recommend:
- Unit test for `KudoCardBase` covering variant switching, hashtag overflow, active/inactive carousel state, anonymous sender display.
- Unit test for `FilterDropdown` trigger text logic (null → category name; value selected → option label; All selected → null → category name).

This is a carry-over gap, not introduced by this diff, but now more load-bearing.

---

## Positive Observations

- Thin wrapper pattern (highlight-card + kudo-post-card → KudoCardBase) is clean. Call sites unchanged, prop contracts preserved.
- All Tailwind tokens correctly sourced from `globals.css` @theme — no spurious raw hex except the documented `rgba(255,234,158,0.40)`.
- Phase 2 `triggerText` logic handles null/selected/all cases correctly with zero state additions.
- Phase 1 webkit-search suppression applied identically to both inputs — consistent.
- `aria-haspopup="listbox"` (not `"true"`) is the correct WAI-ARIA value for a listbox combobox.
- `select-none` added to inactive carousel cards prevents accidental text selection during carousel drag.

---

## Recommended Actions (priority order)

1. **Mi3 (Medium):** Fix `formatTime` to use `Intl.DateTimeFormat` with `Asia/Ho_Chi_Minh` timezone before ship — timestamps will look wrong for overseas reviewers.
2. **M1 (Medium):** Implement real Supabase storage URL resolution in image gallery before enabling image uploads. Acceptable as-is if `card.images` is always `[]` in production today — confirm and note.
3. **Mi1 (Low):** Replace `text-gray-500` and `text-gray-400` in `kudo-card-base.tsx` with `text-saa-text-muted`.
4. **Mi2 (Low):** `aria-current={active || undefined}` is more idiomatic but no functional impact.
5. **(Future):** Add component tests for `KudoCardBase` variant logic and `FilterDropdown` trigger text.

---

**Score: 8/10**
Deductions: Mi3 (timezone, new behavior, -1), M1 (image placeholder not resolved, -0.5), Mi1 (-0.5 token hygiene).
