# Phase B3 — Likes + Stats Logic

**Track:** B (data/logic) · **Priority:** High · **Status:** ✅ done · **Depends on:** B1

## MoMorph refs
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: ../260606-1325-sun-kudos-live-board/clarifications.md

## Overview
The **like/unlike** mutation (core interaction) and the **sidebar** data (D): personal stats and the two
leaderboards. Heart credit goes to the kudo **sender**.

## Key insights (business rules — spec C.4.1)
- One like per user per kudos (unique constraint). Toggle = insert / delete own row.
- Sender cannot like their own kudo → heart button **disabled** for own kudos (UI) AND blocked by RLS.
- Each like credits the **sender** +1 heart (via `profile_kudo_stats.hearts_received`). Unlike revokes.
- Special-day +2 = DEFERRED (column exists; always 1 for v1).
- Sidebar stats (D.1): kudos received, kudos sent, hearts received, secret boxes opened, secret boxes unopened.
- Leaderboards (D): "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT" (10 most recent star-tier promotions) and
  "10 SUNNER NHẬN QUÀ MỚI NHẤT" (10 most recent secret-box openings / gift grants).

## Related code files
**Create**
- `app/api/kudos/[id]/like/route.ts` (or a server action `toggleLike`) — POST=like, DELETE=unlike; enforces no-self-like server-side; returns new heart_total + liked state.
- `lib/kudos/use-toggle-like.ts` — `useMutation` with **optimistic update** of `kudo_heart_counts` in the feed/highlight caches; rollback on error.
- `lib/kudos/sidebar-queries.ts` — `getSidebarStats(userId)` (from `profile_kudo_stats` + secret_boxes counts), `getRecentPromotions(limit=10)`, `getRecentGiftReceivers(limit=10)`.
- `lib/kudos/use-sidebar.ts` — query hooks for the three sidebar datasets.
**Notes**
- "Recent promotions": star tier is derived from `kudos_received`. For a recent-promotions feed without a history table, v1 approximates with **most-recently-received-kudos by users currently at a tier boundary**, OR seed a lightweight signal. Document the approximation; a precise `rank_events` table is out of scope.
- Gift receivers: order `secret_boxes` by `opened_at desc` (joined to profile + badge).

## Implementation steps
1. Implement like/unlike endpoint/action: verify auth; reject if `sender_id = auth.uid()` (defense in depth even with RLS); insert/delete; return `{ liked, heartTotal }`.
2. `use-toggle-like`: optimistic patch of cached `KudoCard.heartTotal` + `liked`; invalidate on settle; disable when `kudo.senderId === currentUserId`.
3. `getSidebarStats`: read `profile_kudo_stats` + count secret_boxes by status for current user.
4. `getRecentGiftReceivers`: secret_boxes opened desc → profile brief + gift label.
5. `getRecentPromotions`: implement documented v1 approximation; expose same `LeaderboardItem` shape.
6. Sidebar hooks; empty arrays → empty-state ("Chưa có dữ liệu").
7. Build/typecheck.

## Todo
- [x] like/unlike endpoint/action (auth + no-self-like + toggle + returns counts)
- [x] `use-toggle-like` optimistic mutation + rollback + self-like disable
- [x] `getSidebarStats` (received/sent/hearts/box opened/unopened)
- [x] `getRecentGiftReceivers`
- [x] `getRecentPromotions` (documented v1 approximation)
- [x] sidebar hooks + empty-state handling
- [x] Build/typecheck green

## Success criteria
- Liking own kudo is impossible (button disabled + server rejects). Tested.
- Like → heart_total +1 and sender's hearts_received +1; unlike reverses both. Tested.
- Sidebar shows correct 5 stat values + two ≤10-item lists; empty → "Chưa có dữ liệu".

## Security
- Server re-checks no-self-like and identity; optimistic UI never bypasses RLS.

## Next steps
C1 wires `use-toggle-like` into card heart buttons (A2/A4) and sidebar hooks into A5; realtime updates counts for other viewers.
