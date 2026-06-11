# Phase A4 — All Kudos Feed + Post Card UI

**Track:** A (UI) · **Status:** ✅ done · **Depends on:** A1 (primitives)

## MoMorph refs
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: ../260606-1325-sun-kudos-live-board/clarifications.md

## Goal
Section C: header ("Sun* Annual Awards 2025 / ALL KUDOS") + vertical feed of **KUDO post cards** (C.3).
Card: sender info block (avatar, name, dept/stars), sent icon, receiver info block, time
("HH:mm - MM/DD/YYYY"), content (max 5 lines + "…"), image gallery (≤5 thumbnails → click opens full),
hashtag list, action bar (heart+count, Copy Link). Feed supports infinite scroll (loading sentinel +
skeletons) and empty state ("Hiện tại chưa có Kudos nào.").

## Out of scope
Real data fetch + pagination + like persistence + detail/profile/gallery-lightbox logic → C1
(gallery may open a simple lightbox stub). Use Figma content as mock data.

## Integration contract
Feed takes `pages: KudoCard[]`, `hasNext`, `onLoadMore`, `isLoading`; card emits `onLike`, `onCopyLink`,
`onOpenProfile`, `onOpenImage`, `onViewDetail`. Consumes A1 primitives (card built once, reused C.3/C.5–C.7).
