# Phase 02 — Filter dropdown: fix the closed trigger

## Context links
- Parent: [plan.md](plan.md) · Analysis: [brainstorm report](../reports/brainstorm-260610-1011-kudos-ui-fidelity-diffs.md) §②
- Design: trigger node `2940:13459` (Hashtag) / `2940:13460` (Phòng ban). Open-panel refs `JWpsISMAaM`, `WXK5AYB_rG` (already correct).

## Overview
- **Date:** 2026-06-10 · **Priority:** P2 · **Effort:** small (~40m)
- **Status:** done · **Review:** done
- The OPEN dropdown panel matches design; the CLOSED trigger pill does not.

## Key Insights
- Design trigger (`2940:13459`): single pill — `border-radius: 4px`, `padding: 16px`, ~136×56px, bg `rgba(255,234,158,0.10)` (gold-glass), border `1px #998C5F`, content = just the category word + chevron (e.g. `Hashtag ▾`). No colon, no separate value chip.
- Current code renders `rounded-full` + an **external** bold `<span>{label}:</span>` + an inner `activeLabel` value → visually "Hashtag: [Tất cả ▾]" with tiny `py-1.5` padding.

## Requirements
- Trigger = one `radius-4px` pill, ~16px padding, gold-glass bg, `#998C5F` border, chevron at right.
- Trigger text = the **selected option label**; when nothing selected, fall back to the **category name** (`Hashtag` / `Phòng ban`).
- Remove the external label span + colon.
- Keep all existing a11y (button `aria-haspopup/expanded/controls`, keyboard handlers) and the open `<ul role=listbox>` panel UNCHANGED.

## Architecture
- `FilterDropdown` is a single self-contained client component. The `label` prop becomes the empty-state placeholder text instead of an always-on prefix. Public props/signature stay backward-compatible (callers in `highlight-carousel.tsx` unchanged).

## Related code files
- Modify: `app/(public)/sun-kudos/_components/ui/filter-dropdown.tsx` (trigger block L136-181; `activeLabel` logic L59-60)
- Read for tokens: `app/globals.css` (`saa-gold-glass`, `saa-gold-border`/`#998C5F`)
- Callers (no change expected): `app/(public)/sun-kudos/_components/highlight/highlight-carousel.tsx`

## Implementation Steps
1. Remove the external `<span>{label}:</span>` (L137-139).
2. Compute trigger display text: `value` selected → its option label; else → `label` (category name). Adjust `activeLabel` accordingly (do not prepend the category when a value is chosen).
3. Trigger `className`: replace `rounded-full` → `rounded-[4px]`; padding → ~`px-4 py-3` (16px) leaving room for chevron (`pr-10`); keep `border-saa-gold-border bg-saa-gold-glass`, focus ring, hover.
4. Confirm chevron position still absolute-right and rotates on open.
5. Verify the open panel anchors correctly under the wider/taller trigger (`top-full mt-2`).
6. `pnpm build`.

## Todo list
- [x] Remove external label span + colon
- [x] Trigger text = selected label / category fallback
- [x] `rounded-[4px]` + 16px padding + chevron room
- [x] Open panel still correct + a11y intact
- [x] build clean

## Success Criteria
- Closed trigger renders as a single `radius-4px` pill matching design for both Hashtag + Phòng ban.
- Selecting an option updates the trigger text; clearing returns to category name.
- Open panel + keyboard nav unchanged.

## Risk Assessment
- Low. Confined to one component. Watch: don't change `onChange` contract (callers map value↔null).

## Security Considerations
- None.

## Next steps
- Independent of other phases.
