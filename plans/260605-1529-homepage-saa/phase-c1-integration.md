# Phase C1 — Integration (wire UI ↔ logic)

**MoMorph refs:** Homepage SAA — https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM · Clarifications: clarifications.md

## Overview
- **Priority:** Critical · **Status:** todo · **Depends on:** A1, B2, B3, B4
- Connect the presentational UI (A1) to the logic/data (B2–B4): replace design mock data with i18n
  strings + real props, wire navigation/handlers, gate auth controls, and confirm responsive behavior.

## Integration tasks (map to A1 integration contract)
1. **i18n:** replace all mock design text with next-intl keys (`Home` namespace) across header, hero,
   content, awards, kudos, footer. Author real VN copy in `messages/vi.json`; mirror keys in `en.json`.
2. **Countdown:** pass `NEXT_PUBLIC_EVENT_DATETIME` → `CountdownTimer` via `useCountdown`; toggle
   "Coming soon" from `isExpired`.
3. **Auth controls:** server page resolves session; pass `authControls` (bell + account menu) to
   `AppHeader` only when authenticated; guests get nav + language switcher only.
4. **Awards grid:** feed `lib/awards/categories.ts` into `AwardsGrid`; each card links via
   `awardAnchor(slug)` to the awards-information stub.
5. **Navigation:** wire header/footer/CTA links through `lib/navigation/routes.ts`; logo → home + scroll-top.
6. **Widget button:** open placeholder quick-action menu.
7. **Responsive:** verify desktop 3-col / tablet-mobile 2-col awards (ID-15/16), header + sections reflow.

## Related code files
- Modify: `app/(public)/page.tsx`, `AppHeader`, `HeroSection`, `CountdownTimer`, `AwardsGrid`/`AwardCard`,
  `KudosSection`, `AppFooter`, `FloatingWidgetButton`; `messages/{vi,en}.json`.

## Todo
- [x] All strings via next-intl (vi authored, en mirrored) — `Home` namespace keys in `messages/{vi,en}.json`
- [x] Countdown wired to env + Coming-soon toggle — `countdown-live.tsx` wrapper feeds `useCountdown` to presentational `CountdownTimer`
- [x] Auth controls conditional on session — `app/(public)/layout.tsx` resolves session server-side, passes `authControls` to `AppHeader`
- [x] Awards grid from dataset + anchored links — `AwardsSection` maps `AWARD_CATEGORIES`, cards use `awardAnchor(slug)` for hash navigation
- [x] All nav/CTA/logo links wired via `lib/navigation/routes.ts`
- [x] Widget placeholder menu — `FloatingWidgetButton` with placeholder options
- [x] Responsive verified (3/2 col) — `grid-cols-2 lg:grid-cols-3` awards grid; header responsive

## Status
✅ **Completed** (2026-06-05). All UI wired to logic. Mock data replaced with i18n strings and real props. Session controls auth-conditional rendering. Countdown ticks live per minute. Language switch updates copy. All links resolve. No hydration warnings.

**i18n fixes applied:** Header nav labels now use `Home.nav` keys. Language switcher aria-label uses `langSelectAria` key. Widget/notification strings i18n'd.

## Success criteria
- ✅ Guest and authenticated renders both correct (ID-0/1). Countdown live. Language switch updates all
  homepage copy. Every link resolves. No hydration warnings. `pnpm build` + `pnpm lint` clean.

## Next steps
- Hand to C2 for full test + validation against the 62 test cases.
