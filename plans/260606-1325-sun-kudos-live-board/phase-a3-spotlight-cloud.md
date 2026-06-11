# Phase A3 — Spotlight Cloud UI (Simplified)

**Track:** A (UI) · **Status:** ✅ done · **Depends on:** A1 (primitives)

## MoMorph refs
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: ../260606-1325-sun-kudos-live-board/clarifications.md

## Goal
Section B.6/B.7: header "Sun* Annual Awards 2025 / SPOTLIGHT BOARD"; the dark Spotlight panel with the
**"388 KUDOS" total** (B.7.1), a **search bar** (B.7.3, placeholder "Tìm kiếm", max 100 chars), and a
**simplified name-cloud** — recipient names scattered in the panel, font size scaled by received count,
hover highlight, click → detail (stub). Include loading + empty states.

## Out of scope (per clarification)
True pan/zoom physics + force-directed layout — render the Pan/Zoom button (B.7.2) as a visible control
but it may be a no-op/simple toggle in v1. Real data + search wiring → C1. Use Figma content as mock data.

## Integration contract
Takes `total:number`, `nodes: SpotlightNode[]`, `onSearch(term)`, `onNodeClick(profileId)`.
Search input enforces ≤100 chars + non-empty before submit. Consumes A1 primitives.
