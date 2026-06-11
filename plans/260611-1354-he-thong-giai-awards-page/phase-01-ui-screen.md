---
phase: 01
track: A
title: "UI — Hệ thống giải screen from Figma"
status: completed
parallel_with: [02, 03, 04]
blockedBy: []
blocks: []
---
# Phase 01 — UI screen (Track A)

## MoMorph refs
- Hệ thống giải: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
- Clarifications: ./clarifications.md

**Goal:** Code the static/presentational UI for `/he-thong-giai` from Figma via `momorph-implement-design`, using Figma content as mock data. Track B owns all wiring.

**Out of scope (Track B / integration own these):** routing, redirect, auth gating, real i18n strings, scroll-spy logic, smooth-scroll handlers, header nav, homepage anchor updates.

**Integration contract (props/interfaces Track B will feed):**
- `AwardInfoCard`: `{ slug, title, description, imageSrc(336×336), quantityLabel, quantityValue, prizeLabel, prizeValue, id }` — `id={slug}` for scroll anchors.
- `SectionNav`: `{ items: {slug,label}[], activeSlug, onSelect(slug) }` — sticky desktop, hidden mobile; active = gold + underline.
- `KudosPromoBanner`: `{ label, title, description, ctaLabel, ctaHref, illustrationSrc }` — `<Link>` same-tab; hover lift.
- `HeroBanner`: decorative artwork (1200×871), `alt="Keyvisual Sun* Annual Award 2025"`.
- `TitleBlock`: `{ eyebrow, title }`.
- Page composition + responsive: desktop two-column (sticky nav | cards), mobile single-column (nav hidden, cards stacked).

## Todo List
- [x] Code static/presentational UI components from Figma
- [x] Implement AwardInfoCard with mock data contract
- [x] Implement SectionNav with interactive contract
- [x] Implement KudosPromoBanner with CTA structure
- [x] Implement HeroBanner + TitleBlock
- [x] Build responsive two-column layout (desktop) + single-column (mobile)

## Deviations & Cleanup Notes
- **award-info-card.tsx** ended ~200 lines after review cleanup: removed unused `slug` prop, dead `prizeValue2`/`prizeNote2` fields, and "Hoặc" branch per review findings M-2/N-1 — single verbatim value string satisfies TC ID-6.
- **SectionNav** added `aria-current="page"` per review M-1 for a11y compliance on active state.
