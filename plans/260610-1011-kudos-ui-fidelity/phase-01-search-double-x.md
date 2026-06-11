# Phase 01 — Search input: kill the double-✕

## Context links
- Parent: [plan.md](plan.md) · Analysis: [brainstorm report](../reports/brainstorm-260610-1011-kudos-ui-fidelity-diffs.md) §①
- Design: search pill node `2940:13450` (screenId `MaZUn5xHXZ`).

## Overview
- **Date:** 2026-06-10 · **Priority:** P2 · **Effort:** trivial (~20m)
- **Status:** done · **Review:** done
- The "Tìm kiếm sunner" search pill shows **two** clear (✕) buttons and looks off while typing.

## Key Insights
- `type="search"` makes WebKit/Blink auto-render a native `::-webkit-search-cancel-button` (✕) on input. The code ALSO renders a custom clear `<button>`. → two ✕.
- Native search decoration also adds intrinsic padding that disturbs the flex layout.
- **Same bug exists in two places** — banner pill and the Spotlight in-panel search.

## Requirements
- Exactly ONE clear control (the styled custom button) per search input.
- Clean text/placeholder rendering while typing; no native browser decoration.
- Preserve `role="search"` form semantics + existing clear behavior.

## Architecture
- Two controlled `<input>`s lifted to `kudos-board.tsx` via `spotlightSearch` / `searchTerm`. No state change needed — purely presentational.

## Related code files
- Modify: `app/(public)/sun-kudos/_components/banner.tsx` (input ~L188-196)
- Modify: `app/(public)/sun-kudos/_components/spotlight/spotlight-cloud.tsx` (input ~L197)

## Implementation Steps
1. Pick ONE approach (apply consistently to both inputs):
   - **Preferred:** keep `type="search"` and hide the native control with Tailwind arbitrary variants on the input `className`: `[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-cancel-button]:hidden`.
   - **Alt (simpler):** change `type="search"` → `type="text"` (drops native ✕ entirely; keep `role="search"` on the wrapping form for a11y).
2. Apply to `banner.tsx` input.
3. Apply identically to `spotlight-cloud.tsx` input.
4. Verify the custom clear button still appears only when `inputValue` is non-empty and clears correctly.
5. `pnpm build` to confirm no compile error.

## Todo list
- [x] banner.tsx input: remove native ✕
- [x] spotlight-cloud.tsx input: remove native ✕ (same approach)
- [x] Manual: type → see single ✕; clear works; layout stable
- [x] build clean

## Success Criteria
- Only one ✕ visible while typing in both inputs.
- No layout jump from native search decoration.
- Clear button still functions; search still drives the spotlight filter.

## Risk Assessment
- Very low. CSS/attribute-only. Cross-browser: `appearance-none` covers WebKit/Blink; Firefox never renders a native search ✕ (no regression).

## Security Considerations
- None.

## Next steps
- Independent of other phases.
