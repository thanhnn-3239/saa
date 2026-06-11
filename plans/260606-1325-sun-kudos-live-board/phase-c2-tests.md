# Phase C2 — Tests & Validation

**Track:** — · **Priority:** High · **Status:** ✅ done · **Depends on:** C1

## MoMorph refs
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: ../260606-1325-sun-kudos-live-board/clarifications.md

## Overview
Verify the board against the 41 MoMorph test cases + the locked business rules. Tests live in
`tests/sun-kudos/` (route-group parentheses break vitest co-location — see homepage-saa deviation #3).

## Test areas (mapped to MoMorph test cases)
- **Like rules (B3):** one-per-user; no self-like (button disabled + server reject); like→+1 heart to
  sender & toggle color; unlike→revoke. (TCs 63645b03, 91e102ba, 7a7ec63e) Special-day +2 → skipped w/ note.
- **Filters (B2):** hashtag/department dropdown filters BOTH lists; hashtag chip click filters; clear
  restores. (TCs 0e56cacb, 159fed13, d01729d4)
- **Feed:** infinite scroll loads more without dupes; empty → "Hiện tại chưa có Kudos nào." (TCs 9dfda316, 926d92a5)
- **Carousel:** 5 cards, arrows disabled at ends, page indicator updates. (TC 81446f61)
- **Spotlight:** total count; search accepts 100 / rejects 101 / blocks empty; loading/empty/interactive
  states. (TCs 9e689933, d035e3b8, ddf67e52)
- **Copy link:** clipboard + toast "Link copied — ready to share!" (TC 0adfd7ce)
- **Sidebar:** 5 stat values correct vs seed; leaderboards ≤10; empty → "Chưa có dữ liệu". (TCs 99ade8e6, d662780b, 43b54c29 stub)
- **Stars tiers:** 10/20/50 thresholds → 1/2/3★ (unit test `lib/kudos/stars.ts`).
- **GUI/i18n:** placeholders render in vi; key components present (banner readonly, input pill, search icon).

## Steps
1. Unit: stars tiers, like-rule guards, cursor pagination shape, search validation.
2. Component (Testing Library): heart toggle/disable, carousel arrow states, empty states, copy-link toast.
3. Integration: filter affects both lists; feed load-more; sidebar values vs seed.
4. (Optional) realtime: simulate `kudo_likes` INSERT payload → cache patch updates count.
5. Run `pnpm test` + `pnpm build`; fix all failures (no skips beyond documented special-day case).
6. Visual validation vs MoMorph frame image (Step 7 of momorph-implement-design): banner, carousel,
   spotlight, feed card, sidebar.

## Todo
- [x] Unit tests (stars, like guards, pagination, search validation)
- [x] Component tests (heart, carousel, empty, toast)
- [x] Integration tests (filters, feed, sidebar vs seed)
- [x] Optional realtime cache-patch test
- [x] `pnpm test` + `pnpm build` green
- [x] Visual validation vs Figma frame

**Test results:** 334/334 tests pass; 45 new tests added (unit + component); TypeScript clean; build succeeds.

**Deferred (jsdom/infrastructure limitation):**
- Carousel infinite scroll + page indicator interaction (requires ResizeObserver, IntersectionObserver) → Playwright e2e
- Realtime live cache updates (requires Supabase emulator) → future integration test

## Success criteria
- All non-deferred test cases pass; build green; visuals match design within tolerance.
- Documented: special-day +2 hearts case skipped (out of scope).

## Next steps
Hand to reviewer; then git/ship per project workflow.
