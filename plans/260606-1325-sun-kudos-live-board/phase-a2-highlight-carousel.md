# Phase A2 — Highlight Kudos Carousel + Filters UI

**Track:** A (UI) · **Status:** ✅ done · **Depends on:** A1 (primitives)

## MoMorph refs
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: ../260606-1325-sun-kudos-live-board/clarifications.md

## Goal
Section B: header ("Sun* Annual Awards 2025" / "HIGHLIGHT KUDOS") + Hashtag & Phòng ban filter
dropdowns (B.1.1/B.1.2); `embla-carousel-react` carousel of 5 highlight cards with center-active /
faded sides, prev/next arrows (disabled at ends), and "2/5" page indicator (B.2/B.5). Highlight card
(B.3): sender/receiver info (avatar, name, dept, stars), arrow icon, time, content (max 3 lines + "…"),
hashtags (max 5 + "…"), action bar (heart+count, Copy Link, Xem chi tiết).

## Out of scope
Real data + filter behavior + like persistence + detail navigation → C1. Use Figma content as mock data.

## Integration contract
Carousel takes `KudoCard[]` + active filter + `onFilterChange`; card emits `onLike`, `onCopyLink`,
`onViewDetail`, `onOpenProfile`. Consumes A1 primitives.
