# Phase A1 — Board Shell + Banner + Shared Primitives

**Track:** A (UI) · **Status:** ✅ done · **Depends on:** — (run first within Track A)

## MoMorph refs
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: ../260606-1325-sun-kudos-live-board/clarifications.md

## Goal
Replace the `app/(public)/sun-kudos/page.tsx` coming-soon stub with the board layout scaffold:
section A **Banner KV** (readonly hero, title "Hệ thống ghi nhận lời cảm ơn" + KUDOS logo) and the
**A.1 "ghi nhận" pill input** (pencil icon + placeholder) that opens a stub dialog. Build the shared
UI primitives the other A-phases consume.

## Shared primitives to build (in `app/(public)/sun-kudos/_components/ui/`)
avatar, heart-button (gray↔red, count, disabled state), hashtag-chip, copy-link-button (+ toast),
filter-dropdown, stars (hoa thị) indicator, section-header, empty-state, skeleton/loading.

## Out of scope
Real data, realtime, like persistence, send-kudos dialog logic (open placeholder only) — wired in C1.
Use Figma design content as mock data; do NOT invent data.

## Integration contract
Exports presentational components with typed props matching `lib/kudos/types.ts` (KudoCard, etc.).
Page composes section slots A/B/C/D so A2–A5 drop in.
