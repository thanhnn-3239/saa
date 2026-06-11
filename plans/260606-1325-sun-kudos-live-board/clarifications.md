# Clarifications — Sun* Kudos Live Board

MoMorph: Sun* Kudos - Live board · screenId `MaZUn5xHXZ` · fileKey `9ypp4enmFmdK3YAFJLIu6C`

## Session 2026-06-06

- Q: What should THIS plan cover, given referenced flows (send dialog, detail page, profile, secret box) are not in this frame? → A: Board screen only — referenced flows are safe stubs/no-ops wired in later plans.
- Q: How far should the hearts/likes system go for v1 (rules: 1 like/user/kudos, no self-like, +1 heart credited to kudos sender, +2 special-day, unlike revokes)? → A: Core likes — add kudo_likes table + toggle + heart aggregation + self-like/one-per-user/credit-sender rules; defer admin "special day +2" config.
- Q: What real-time behavior should the "Live board" have for v1? → A: Supabase Realtime — new kudos and heart counts update live without refresh.
- Q: What fidelity for the Spotlight word-cloud (B.7) for v1? → A: Simplified cloud — scattered recipient names sized by kudos received, total count, working search + click-to-detail; defer true pan/zoom physics & force layout.
- Q: How to handle demo/dev data for an empty DB? → A: Include a Supabase seed script (sample profiles, ~30-50 kudos with hashtags/images/likes, departments, secret boxes, leaderboard data); empty-states still implemented & tested.
- Q: Which client data layer for Realtime + infinite scroll + optimistic likes? → A: Add @tanstack/react-query; integrate Supabase realtime as cache update/invalidation source.

## Derived defaults (not asked — apply unless overridden)

- Q: Carousel implementation for Highlight Kudos (B.2)? → A: Use `embla-carousel-react` (lightweight, React 19 compatible) rather than hand-rolling slide math.
- Q: All Kudos feed pagination (C)? → A: Cursor-based (created_at + id) infinite scroll via `useInfiniteQuery` + IntersectionObserver sentinel; realtime INSERT prepends new kudos.
- Q: Guest (unauthenticated) interactions? → A: Board is behind login gate already (app is login-required), so all viewers are authenticated. Test case for "unauthenticated redirect" is satisfied by the existing `proxy.ts` gate; no extra guest-view mode built.
- Q: Secret Box "Mở quà" (D.1.8) and "Xem chi tiết"/profile/detail navigation? → A: Stubs — button opens a placeholder/toast; navigation points to existing coming-soon routes. No new flows built.
- Q: Hashtag/Department filter scope? → A: A selected filter applies to BOTH Highlight and All Kudos lists and resets carousel pagination to page 1 (per spec B / B.1).

## Open questions

- None blocking. "Special day +2 hearts" admin config, send-kudos dialog design, kudos detail page, and profile page are explicitly out of scope and need their own MoMorph frames / plans.
