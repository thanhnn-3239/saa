# Phase C1 — Integration

**Track:** — · **Priority:** Critical · **Status:** ✅ done · **Depends on:** A2–A5, B2, B3, B4

## MoMorph refs
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: ../260606-1325-sun-kudos-live-board/clarifications.md

## Overview
Replace all mock data in the A-phase UI with real data from the B-phase hooks; wire realtime, filters,
likes, copy-link, search, navigation stubs, and i18n. This is where the screen becomes functional.

## Wiring checklist
1. **Highlight (A2 ↔ B2/B3):** feed `useHighlightKudos(filter)` → carousel; heart button → `useToggleLike`
   (disabled for own kudos); Copy Link → clipboard + toast "Link copied — ready to share!"; Xem chi tiết →
   stub detail route; avatar/name → stub profile route.
2. **All Kudos (A4 ↔ B2/B3):** `useKudosFeed(filter)` infinite scroll via IntersectionObserver; same
   like/copy/profile/detail wiring; image thumb → lightbox stub; empty → "Hiện tại chưa có Kudos nào."
3. **Filters (B2 + A2):** selecting Hashtag/Phòng ban or clicking a hashtag chip updates shared filter →
   refetches BOTH highlight + feed and resets carousel to page 1; clearing restores all.
4. **Spotlight (A3 ↔ B4):** total count + nodes; search submit (≤100, non-empty) highlights/scrolls to a
   match; node click → stub detail; loading/empty states.
5. **Sidebar (A5 ↔ B3):** current-user stats + two leaderboards; "Mở quà" → stub dialog/toast;
   empty → "Chưa có dữ liệu".
6. **Realtime:** subscribe (via `lib/supabase/realtime.ts`) to `kudos` INSERT (prepend to feed, bump
   spotlight total) and `kudo_likes` INSERT/DELETE (patch heart counts in highlight/feed caches via
   QueryClient.setQueryData). Debounce/coalesce updates; clean up on unmount.
7. **Auth:** board is login-gated by `proxy.ts`; ensure current user id flows from server → client for
   self-like disabling and sidebar "you" stats.
8. **i18n:** add `Kudos` namespace to `messages/vi.json` (authoritative) + `messages/en.json` (mirror);
   route ALL visible strings through next-intl (placeholders, toasts, empty states, labels, aria).
9. **Page assembly:** `app/(public)/sun-kudos/page.tsx` server-prefetches + dehydrates; client composes A1 shell with A2–A5 sections inside the QueryClient hydration boundary.

## Todo
- [x] Highlight carousel wired (data + like + copy + nav stubs)
- [x] All Kudos feed wired (infinite scroll + like + copy + gallery/nav stubs + empty)
- [x] Cross-list filters (highlight + feed) + reset to page 1
- [x] Spotlight total/nodes/search wired (+ loading/empty)
- [x] Sidebar stats + leaderboards + Mở quà stub + empty
- [x] Realtime channels (kudos + kudo_likes) patching caches, cleanup on unmount
- [x] Current-user id propagation for self-like + sidebar
- [x] `Kudos` i18n namespace (vi + en), all strings via next-intl
- [x] Page prefetch/dehydrate + composed layout
- [x] `pnpm build` + typecheck green

**Deferred items (documented stubs):**
- Send-kudos dialog logic (design pending)
- Kudos detail page (design pending)
- Profile page (design pending)
- Lightbox/image gallery (design pending)
- Secret-box "Mở quà" flow (design pending)

## Success criteria
- All 41 test cases satisfiable except explicitly deferred special-day +2 (documented).
- Like/unlike updates counts for the actor immediately (optimistic) and for other viewers via realtime.
- Filters affect both lists; copy-link toast works; empty/loading states render.
- No broken links (stubs resolve to coming-soon/no-op).

## Security
- Self-like disabled in UI + rejected server-side; all interactions require the (already-gated) session.

## Next steps
C2 runs the test suite + visual validation.
