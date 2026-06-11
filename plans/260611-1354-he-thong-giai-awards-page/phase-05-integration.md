---
phase: 05
track: A+B
title: "Integration — wire real data, nav, auth, anchors"
status: completed
priority: P1
parallel_with: []
blockedBy: [01, 02, 03, 04]
blocks: [06]
---
# Phase 05 — Integration (Track A + Track B)

## MoMorph refs
- Hệ thống giải: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
- Clarifications: ./clarifications.md

## Context Links
- All phase outputs: phase-01 UI components, phase-02 page shell + routes, phase-03
  config + i18n, phase-04 scroll-spy hook.
- `app/(public)/_components/homepage/awards-section.tsx` + `award-card.tsx` (homepage cards
  whose hrefs use `awardAnchor(slug)` → now resolve to /he-thong-giai#<slug>).

## Overview
- **Priority:** P1 (the convergence point — depends on ALL four prior phases)
- **Status:** pending
- Replace phase-01 mock data with real config/i18n, inject the scroll-spy hook into
  SectionNav, hook the page server component to feed cards, verify homepage anchors + auth +
  redirect end-to-end.

## Key Insights
- This is the ONLY phase that may touch files from both tracks. No hard merge point existed
  earlier — integration happens here once outputs are available.
- Homepage award cards already link via `awardAnchor(slug)`; since phase-02 changed the route
  base, they now point at `/he-thong-giai#<slug>` automatically — just VERIFY, and ensure the
  new page's section ids equal those slugs so the deep-link scrolls correctly.
- The `scroll-mt` contract from phase-04 must be present on the page's section anchors.

## Requirements
**Functional**
- Page renders 6 cards with REAL i18n title/desc (Home.awards.*) + quantity/value
  (HeThongGiai.awards.<slug>) + field labels — no mock data remains.
- Left SectionNav uses real ordered slug list (AWARD_CATEGORIES) + real labels; scroll-spy
  + smooth-scroll live; exclusive active state.
- Kudos banner CTA is a same-tab `<Link href={ROUTES.kudos}>` with real i18n copy.
- Hero alt text + title block strings from i18n.
- Homepage award cards deep-link to `/he-thong-giai#<slug>` and land on the right card.
- `/awards-information` redirect verified; header item active on new page.

**Non-functional**
- All touched files <200 lines; split if a component grew past the limit.
- No inline styles except runtime-computed (styling-conventions.md).

## Architecture
Integration data flow (server → client):
```
page.tsx (server)
  getSessionUser()  ─ defense-in-depth
  getTranslations("HeThongGiai") + getTranslations("Home.awards")
  build cards = AWARD_CATEGORIES.map(c => ({
     id:c.slug, imageSrc:c.imageSrc,
     title:tHome(c.titleKey), description:tHome(c.descKey),
     quantityLabel:t("fields.quantityLabel"), quantityValue:t(c.quantityKey),
     prizeLabel:t("fields.valueLabel"),       prizeValue:t(c.valueKey),
  }))
  navItems = AWARD_CATEGORIES.map(c => ({slug:c.slug, label:t(`nav.${...}`)}))
        │
        ▼
  <HeThongGiaiScreen> (composes phase-01 UI)
        ├─ HeroBanner (alt from i18n)
        ├─ TitleBlock (eyebrow, pageTitle)
        ├─ <SectionNav items={navItems}> (client → useScrollSpy(slugs))
        └─ cards.map(<AwardInfoCard id={slug} scroll-mt-[96px] .../>)
        └─ <KudosPromoBanner ctaHref={ROUTES.kudos} ... />
```

## Related Code Files
**Modify**
- `app/(public)/he-thong-giai/page.tsx` (phase-02 shell) — build card/nav data, pass to UI.
- phase-01 UI components — swap mock props for real props; add `id` + `scroll-mt` on anchors;
  inject `useScrollSpy` into SectionNav (or wrap it).
- VERIFY only (likely no edit): `awards-section.tsx` / `award-card.tsx` hrefs via awardAnchor.
**Create** — none (compose existing).
**Delete** — none.

## Implementation Steps
1. In page.tsx, resolve both translation namespaces + build `cards` and `navItems` arrays
   from `AWARD_CATEGORIES` (single ordered source).
2. Pass `cards`/`navItems`/`kudos`/`hero`/`title` props into the phase-01 screen component.
3. Replace any mock data the UI agent embedded with these props.
4. Wire `useScrollSpy(slugs)` into SectionNav: active class from `activeSlug`, click→`scrollTo`.
5. Add `id={slug}` + `scroll-mt-[96px]` to each card section wrapper.
6. Confirm KudosPromoBanner CTA = `<Link href={ROUTES.kudos}>` same-tab.
7. Manually verify homepage award card → `/he-thong-giai#<slug>` lands on correct card.
8. Verify `/awards-information` → permanent redirect; guest → /login.
9. Run `pnpm tsc --noEmit` + `pnpm lint` — fix issues.

## Todo List
- [x] Build cards + navItems from AWARD_CATEGORIES in page.tsx
- [x] Swap all mock data for real props
- [x] Inject useScrollSpy into SectionNav (active + scrollTo)
- [x] Add id + scroll-mt on card section anchors
- [x] Kudos CTA → ROUTES.kudos same-tab Link
- [x] Verify homepage deep-links land correctly
- [x] Verify redirect + auth gating end-to-end
- [x] tsc + lint clean

## Success Criteria
- No mock data remains; all 6 cards show exact spec values (TC ID-6/7).
- Scroll-spy + click nav fully functional (ID-9/10/11/13).
- Chi tiết navigates same-tab to /sun-kudos (ID-12).
- Deep-link from homepage + /awards-information redirect both work.
- Build + lint clean.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Track A component props ≠ integration contract | Med | High | Contract fixed in phase-01 frontmatter; adapt thin wrapper if drift |
| Server/client boundary error (passing handlers from server) | Med | High | SectionNav is "use client"; only serializable data crosses boundary |
| Section id mismatch breaks deep-link | Low | Med | ids = slugs from AWARD_CATEGORIES (same as homepage anchors) |
| Component exceeds 200 lines after wiring | Med | Low | Split into hero/title/nav/cards/kudos subcomponents |

## Security Considerations
- Confirm page stays login-gated (proxy + getSessionUser). No client-exposed secrets.
- Only serializable props cross the server→client boundary (no functions/session objects).

## Next Steps
- Feeds phase-06 (tests/verification). This phase MUST complete before 06.
