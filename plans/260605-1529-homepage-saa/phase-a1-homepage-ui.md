# Phase A1 — Homepage UI (Track A · UI)

**MoMorph refs:**
- Homepage SAA: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Clarifications: ../260605-1529-homepage-saa/clarifications.md

**Goal:** Code the Homepage SAA UI pixel-perfect from the Figma design (use `momorph-implement-design`).
Presentational only — mock data from the design; logic/data wired in C1 Integration.

**Track rule:** Parallel to Track B. No `blockedBy`/`blocks` on Track B phases.

## Components to build (server unless noted)
- `AppHeader` (shared) — logo, nav links, slot for auth controls (bell/account) + language switcher
- `HeroSection` — keyvisual bg (3.5), "ROOT FURTHER" title, "Coming soon" (B1.2), countdown slot, EventInfo (B2), CTA buttons ABOUT AWARDS / ABOUT KUDOS (B3.1/B3.2)
- `CountdownTimer` *(client)* — 3 tiles DAYS/HOURS/MINUTES (B1.3); accepts `targetIso` prop
- `RootFurtherContent` — decorative ROOT/FURTHER typography, paragraphs, quote (B4)
- `AwardsSection` — header C1 + `AwardsGrid` of 6 `AwardCard` (C2)
- `AwardCard` — image, title, 2-line-clamp description, "Chi tiết" link (C2.1.x)
- `KudosSection` — label/title/desc/image + "Chi tiết" button (D1/D2)
- `FloatingWidgetButton` *(client)* — fixed pill, opens placeholder menu (item 6)
- `AppFooter` (shared) — logo, nav links + Tiêu chuẩn chung, copyright (7.x)

## Out of scope (this phase)
- Real auth state, navigation targets, env-driven countdown value, i18n strings (use design text as mock), data fetching.

## Integration contract (consumed by C1)
- `AwardCard` props: `{ slug, title, description, imageSrc }`
- `CountdownTimer` props: `{ days: number, hours: number, minutes: number, showComingSoon: boolean, labels?: {...} }` (values pre-computed by `useCountdown` hook upstream)
- `AppHeader` props: `{ authControls?: ReactNode, languageSwitcher?: ReactNode }` (guest = undefined → controls hidden)
- Award category slugs: top-talent, top-project, top-project-leader, best-manager, signature-2025-creator, mvp
- Responsive: desktop 3-col awards, tablet/mobile 2-col; header collapses on small screens.

## Status
✅ **Completed** (2026-06-05). All UI components built pixel-perfect from design. Countdown hook contract implemented. All sections present and props-driven.

## Success criteria
- ✅ Visual match to design (validation loop, Step 7 of `momorph-implement-design`).
- ✅ All sections present, components accept the contract props above, no hardcoded business logic.
- ✅ Tested: 6 AppHeader tests, 6 CountdownTimer tests, 7 AwardCard tests, 8 AwardsSection tests passing (250/250 total).
