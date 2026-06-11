# Consultation — Sun* Kudos Board UI fidelity feedback (round 2)

Date: 2026-06-09 · Branch: feat/sun-kudos-live-board · Screen: MaZUn5xHXZ (fileKey 9ypp4enmFmdK3YAFJLIu6C)
Verified current state in-browser (authenticated via local QA session) against MoMorph design.

## Commission
10 UI-fidelity defects on `/sun-kudos` vs design. All confirmed reproduced in current build.

## Findings + agreed fix (per item)

| # | Item | Confirmed current | Agreed fix |
|---|------|-------------------|-----------|
| 1 | Banner "Tìm kiếm sunner" pill too small + does nothing | stub, small | Resize to design; wire to drive Spotlight cloud filter (see search decision) |
| 2 | HIGHLIGHT slider overflows frame | cards bleed past right edge | Contain carousel within section; correct embla slide sizing/overflow |
| 3 | Filter dropdowns ≠ design (closed + open) | native `<select>` | Custom dropdown matching refs: **Hashtag** JWpsISMAaM + **Phòng ban** WXK5AYB_rG — dark panel, gold border, active item gold-glow, white items |
| 4 | Pager current/total CSS | "1/5" uniform small | Current number **larger + gold**; total smaller/muted |
| 5 | Spotlight total position | "132 KUDOS" top-left beside search | Total **centered** at top; search box **top-left corner** |
| 6 | Spotlight search not working | submits API, no cloud feedback | Wire search → **filter cloud** (decision) |
| 7 | Spotlight cloud far from design | sparse even grid (~20) | **Real word-cloud**: collision/packing layout, all recipients, organic varied sizes, 1 highlighted name |
| 8 | ALL KUDOS card width + actions | has "Xem chi tiết", narrow | Match design: keep **hearts + Copy Link**, **remove "Xem chi tiết"**, widen card to design proportion |
| 9 | Sidebar shared scrollbar + THĂNG HẠNG block | both leaderboards + shared scroll | **Remove "THĂNG HẠNG"** entirely; secret-box block **separate, no scrollbar** |
| 10 | NHẬN QUÀ scrollbar + item layout | browser-default scrollbar | **CSS-styled** scrollbar; item rows per design |

## Agreed decisions (clarified 2026-06-09)
- Spotlight #7 → **real word-cloud algorithm** (highest fidelity, accepted higher effort).
- Search #1/#6 → **filter the cloud** to matching names; clearing restores all; both search inputs drive it.
- Feed card #8 → **remove "Xem chi tiết"**, keep hearts + Copy Link, widen.
- Sidebar #9/#10 → remove promotions leaderboard; separate secret-box block; CSS scrollbar only on "NHẬN QUÀ".

## What to watch (implementation risks)
- Word-cloud packing: deterministic (no Math.random — SSR/hydration), responsive to container width, perf with ~20–80 nodes, accessibility (still keyboard-focusable buttons).
- Custom dropdowns: keyboard nav + a11y (replace native select semantics with role=listbox/option), close-on-outside-click, i18n.
- Carousel overflow: keep center-active/faded-sides visual while clipping to section bounds.
- Search-filter wiring: banner pill currently a stub → must connect to the same filter state as Spotlight; debounce; empty-state when no match.
- Removing THĂNG HẠNG: drop `getRecentPromotions` usage from sidebar UI (keep fn or remove? — keep data fn, just unmount UI block to avoid churn).

## How success is measured
Re-verify in browser (authenticated) each item vs design; 0 console errors; `pnpm test` + typecheck green; visual match on hero/slider/filters/spotlight/feed/sidebar.

## Next
Single cohesive polish pass (one screen). Recommend grouping into implementer waves:
A) Spotlight (cloud + search + count/search position) — largest.
B) Highlight (slider overflow + pager + custom filter dropdowns).
C) Feed card (width + remove xem-chi-tiet).
D) Sidebar (remove promotions + separate blocks + CSS scrollbar).
E) Banner search pill size + wiring.

## Unresolved questions
- None blocking. Banner search pill: assumed it scrolls focus to Spotlight + applies the same cloud filter (confirm if it should instead be its own thing).
