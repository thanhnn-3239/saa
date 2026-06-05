# Phase B4 — Stub routes & navigation (Track B · logic)

**MoMorph refs:** Homepage SAA — https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM · Clarifications: clarifications.md

## Overview
- **Priority:** Medium · **Status:** todo · **Depends on:** B1
- Create minimal "coming soon" stub pages so every homepage link resolves (ID-59 no broken links),
  and define the navigation/anchor map used by header, footer, CTA buttons, and award cards.

## Key insights (tests ID-2/3/4/18–22/44/45/47–53/55/59/62)
- Targets referenced: **Awards Information**, **Sun\* Kudos**, **Tiêu chuẩn chung** (footer only), plus
  `Profile` and `Admin Dashboard` (account menu). None exist.
- Award cards navigate to Awards Information **with hash anchor = category slug** for auto-scroll
  (ID-47–52). Missing hash → page loads without auto-scroll (ID-62).
- Logo (header + footer) → home + scroll to top (ID-2/18/19). Active nav link "About SAA 2025" →
  scroll-to-top / home section (ID-20).
- Nav links use next-intl-friendly client navigation; preserve locale cookie (no locale in URL).

## Requirements
- Stub pages live in the `(public)` route group so they reuse `AppHeader`/`AppFooter`.
- Central route/anchor map (single source) so header/footer/cards/CTA stay consistent (DRY).
- Award-info stub renders anchor targets (`id={slug}`) for the 6 categories so `#slug` resolves.

## Architecture
- `lib/navigation/routes.ts`: `{ home: '/', awardsInfo: '/awards-information', kudos: '/sun-kudos',
  standards: '/tieu-chuan-chung', profile: '/profile' }` + `awardAnchor(slug)` helper.
- Stub page = shared `ComingSoon` component (title + back-home link).

## Related code files
- Create: `app/(public)/awards-information/page.tsx`, `app/(public)/sun-kudos/page.tsx`,
  `app/(public)/tieu-chuan-chung/page.tsx`, `app/(public)/profile/page.tsx`,
  `components/coming-soon.tsx`, `lib/navigation/routes.ts`.
- Modify: proxy public allowlist (B1) to include these paths; messages for stub copy.

## Implementation steps
1. `lib/navigation/routes.ts` with paths + `awardAnchor(slug)`.
2. `ComingSoon` shared component (i18n title + link home).
3. Create the four stub pages in `(public)`; awards-information renders the 6 anchor `id`s.
4. Confirm all are in the proxy public allowlist (coordinate with B1).

## Todo
- [x] Route/anchor map — `lib/navigation/routes.ts` (home, awardsInfo, kudos, standards, profile)
- [x] ComingSoon component — `components/coming-soon.tsx`
- [x] 4 stub pages (awards-info has 6 anchors) — `app/(public)/{awards-information,sun-kudos,tieu-chuan-chung,profile}/page.tsx`
- [x] Public allowlist covers stubs — `proxy.ts` PUBLIC_PATHS includes all stub routes

## Status
✅ **Completed** (2026-06-05). Central routes map created. All stub pages implemented with award anchors. No broken links. Hash navigation working for award categories.

**Security note:** `/profile` removed from `PUBLIC_PATHS` post-review (H1 issue). Guests redirected to `/login`; stub renders for authenticated users only.

## Success criteria
- ✅ Every header/footer/CTA/card link resolves to a real route (ID-59). `#slug` lands on the matching anchor; missing hash → no scroll, no error (ID-62).
- ✅ Route resolution test passes (5 route verification tests). 250/250 tests passing.

## Next steps
- Consumed by C1 (wire homepage links) and C2 (link-check).
