# Phase 03 — Profile UI composition (Track A · Figma)

**Status:** done · **blockedBy:** none (parallel with Track B). `momorph-implement-design` handles the rest at runtime.

## MoMorph refs
- Profile bản thân: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/3FoIx6ALVb
- Clarifications: ../clarifications.md

## Goal
Build the `/profile` UI pixel-faithful to Figma, wired with mock data props. Reuse existing components; do not fork them.

## Build (under `app/(public)/profile/_components/`)
- `profile-hero.tsx` — keyvisual bg + `Avatar` (A.1) + name (A.2) + `HeroTitlePill` (A.3) + icon-collection row.
- `icon-collection.tsx` — slots from `IconBadge[]`; owned=color, locked=grayscale (B2–B7).
- stats card — reuse `SidebarStatsBlock` (B.1–B.6); `onOpenGift` = placeholder (display-only).
- `profile-awards-header.tsx` — "Sun* Annual Awards 2025" + "KUDOS" + Sent/Received toggle (reuse `FilterDropdown`), default Sent (C.1–C.3).
- `profile-feed.tsx` — list of `KudoPostCard` (D); infinite scroll.

## Out of scope
Secret-box open flow, profile editing, other-user profiles, "Spam"/category card tags.

## Integration contract (consumed in phase-04)
Components accept props: `ProfileHeader`, `IconBadge[]`, `SidebarStats`, `KudoCard[]` + `direction`/`onDirectionChange`. No data fetching inside Track A (mock props only).
