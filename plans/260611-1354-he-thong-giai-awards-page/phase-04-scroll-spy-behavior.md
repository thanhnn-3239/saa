---
phase: 04
track: B
title: "Scroll-spy + smooth-scroll navigation behavior"
status: completed
priority: P2
parallel_with: [01, 02, 03]
blockedBy: []
blocks: []
---
# Phase 04 — Scroll-spy + smooth-scroll (Track B)

## MoMorph refs
- Hệ thống giải: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
- Clarifications: ./clarifications.md

## Context Links
- `app/(public)/sun-kudos/_components/banner.tsx` (scrollIntoView smooth precedent)
- `app/(public)/awards-information/page.tsx` (anchor sections by slug precedent)
- `lib/awards/categories.ts` (ordered slug list = section ids + nav order)
- `lib/navigation/routes.ts` (awardAnchor helper for hash links)

## Overview
- **Priority:** P2 (interaction layer for left nav)
- **Status:** pending
- A reusable client hook + the SectionNav client component behavior: sticky desktop nav with
  IntersectionObserver scroll-spy, click → smooth scroll, exclusive active state, hidden on
  mobile. Pure behavior — markup/styling from phase-01.

## Key Insights
- **Decision 3:** sticky + scroll-spy via IntersectionObserver; click → smooth scroll;
  exclusive active (gold + underline). **Decision 4:** hide nav on mobile.
- Reuse `scrollIntoView({behavior:"smooth"})` precedent (sun-kudos banner) — DRY, KISS.
- Section ids = award slugs (same as homepage anchors) → ONE source of order/ids.
- TC ID-13: invalid/unknown section id must NOT throw — guard `getElementById` null.
- TC ID-9/11: clicking sets exactly one active; ID-10 hover highlight is CSS only (phase-01).
- Header is fixed (80px top padding in layout) → scroll target needs scroll-margin-top so
  card headings aren't hidden under the fixed header. Apply via Tailwind `scroll-mt-*` on
  section anchors (phase-01 markup) — note this contract for phase-01/integration.

## Requirements
**Functional**
- On manual scroll, the section whose card is most in view updates the active nav item
  (exclusive — only one active).
- Clicking a nav item smooth-scrolls to that card's section; updates active immediately.
- Clicking an unknown/missing slug is a no-op (no JS error) — TC ID-13.
- Nav hidden < md breakpoint (mobile) — behavior hook still safe (no observer crash when
  nav not rendered).

**Non-functional**
- Hook file <200 lines; SectionNav behavior wiring kept lean.
- No layout thrash — observer thresholds tuned (e.g. rootMargin offset for fixed header).
- SSR-safe: guard `window`/`IntersectionObserver` (client-only component, `useEffect`).

## Architecture
Components & data flow:
1. `useScrollSpy(slugs: string[]): { activeSlug, scrollTo(slug) }` — client hook in
   `lib/awards/use-scroll-spy.ts` (or `app/(public)/he-thong-giai/_components/`).
   - On mount: `IntersectionObserver` over `slugs.map(getElementById)` (filter nulls).
   - Updates `activeSlug` to the top-most intersecting section (rootMargin top-offset for
     the 80px fixed header). Cleanup observer on unmount.
   - `scrollTo(slug)`: `getElementById(slug)?.scrollIntoView({behavior:"smooth"})` — null-guard.
2. `SectionNav` (client, phase-01 markup): receives `items`, calls `useScrollSpy`, renders
   active state from `activeSlug`, wires `onClick → scrollTo`. Hidden via `hidden md:block`.
3. Section anchors: each `AwardInfoCard` wrapper carries `id={slug}` + `scroll-mt-[96px]`.

```
manual scroll ─► IntersectionObserver ─► setActiveSlug ─► SectionNav re-render (gold+underline)
nav click ─► scrollTo(slug) ─► scrollIntoView smooth ─► (observer also confirms active)
```

## Related Code Files
**Create**
- `app/(public)/he-thong-giai/_components/use-scroll-spy.ts` — the hook (client).
- (SectionNav component itself is produced by phase-01; this phase supplies the hook +
  wiring contract. If phase-01 ships SectionNav as presentational-only, integration (05)
  injects the hook.)
**Modify** — none in Track B beyond the hook (markup owned by phase-01).
**Delete** — none.

## Implementation Steps
1. Create `use-scroll-spy.ts`: client hook taking ordered `slugs`; sets up
   IntersectionObserver in `useEffect`, computes top-most visible slug, exposes
   `{activeSlug, scrollTo}`. Null-guard all DOM lookups (TC ID-13).
2. Define observer options: `rootMargin: "-96px 0px -60% 0px"` (top offset for fixed header;
   bottom margin so a section activates near top of viewport). Tune in integration.
3. Ensure cleanup (`observer.disconnect()`), and re-init if `slugs` change (deps array).
4. Provide `scrollTo(slug)` using `scrollIntoView({behavior:"smooth", block:"start"})`.
5. Document the `scroll-mt-[96px]` requirement on section anchors for phase-01/integration.

## Todo List
- [x] Create use-scroll-spy hook (IntersectionObserver + scrollTo)
- [x] Null-guard DOM lookups (no error on unknown slug — ID-13)
- [x] rootMargin tuned for 80px fixed header
- [x] Observer cleanup on unmount
- [x] Document scroll-mt anchor contract

## Deviations
- **`setActiveSlug(null)` initialization removed** from `useEffect` due to react-hooks/exhaustive-deps lint error — observer initial callback self-corrects state upon mount, eliminating the need for manual null-reset.

## Success Criteria
- Manual scroll updates active nav exclusively (ID-9/11).
- Nav click smooth-scrolls to correct card, no header overlap (ID-9).
- Unknown slug click → no JS error (ID-13).
- Hook SSR-safe; no console errors on mobile (nav hidden).

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Wrong active section under fixed header | Med | Med | rootMargin top offset = header height; verify in 05 |
| Observer fires during programmatic scroll causing flicker | Med | Low | Active derived from observer; click sets immediately then observer confirms |
| Null element on unknown slug → crash | Low | High | Filter nulls + optional chaining (ID-13) |
| SSR window access | Low | High | Client component + useEffect guards |

## Security Considerations
- Pure client UI behavior. No data access. No untrusted input (slugs from static config).

## Next Steps
- Feeds phase-05 (integration wires hook into SectionNav with real slug list). No blocker on 01.
