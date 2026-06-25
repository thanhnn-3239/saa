---
phase: 02
track: B
title: "Routing, redirect, auth gating, header nav label"
status: completed
priority: P2
parallel_with: [01, 03, 04]
blockedBy: []
blocks: []
---
# Phase 02 — Routing, redirect, auth gating, header nav (Track B)

## MoMorph refs
- Hệ thống giải: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
- Clarifications: ./clarifications.md

## Context Links
- `lib/navigation/routes.ts` (ROUTES + awardAnchor)
- `app/(public)/awards-information/page.tsx` (stub being replaced)
- `app/(public)/_components/header-nav.tsx` (uses ROUTES.awardsInfo for href + label)
- `app/(public)/layout.tsx` (navLabels passed to AppHeader)
- `lib/supabase/proxy-session.ts` (allowlist auth — PUBLIC_PATHS)
- `app/(public)/sun-kudos/page.tsx` (getSessionUser defense-in-depth pattern)
- `next.config.ts` (redirects)

## Overview
- **Priority:** P2 (blocker for integration)
- **Status:** pending
- Wire the new route into navigation/auth: rename route value, add 301 redirect from
  old path, create the page shell server component with auth guard, update header label.

## Key Insights
- **Auth is FREE.** `proxy-session.ts` PUBLIC_PATHS = `{/login,/auth/callback,/auto-login}`;
  every other path redirects guests to `/login`. `/he-thong-giai` is auto-gated. The page
  adds `getSessionUser()` only as defense-in-depth (mirrors sun-kudos), satisfies TC ID-0/1.
- **Route rename auto-propagates.** Changing `ROUTES.awardsInfo` value flips header link,
  homepage award-card hrefs, and `awardAnchor()` base simultaneously (single source of truth).
- The header nav LABEL is separate from the route: `nav.awardInformation` i18n string →
  update to "Hệ thống giải" (vi) / keep English label per decision 7. (string change owned
  by phase-03 i18n; this phase only confirms label key wiring is intact.)

## Requirements
**Functional**
- `ROUTES.awardsInfo` value → `"/he-thong-giai"`.
- `/awards-information` → permanent (308/301) redirect to `/he-thong-giai`.
- New page at `app/(public)/he-thong-giai/page.tsx` (server component) renders the screen.
- Guests hitting `/he-thong-giai` redirect to `/login` (via proxy, verified).
- Header nav item points to the new route (auto via ROUTES).

**Non-functional**
- No catch-all routes added under protected paths (proxy matcher invariant).
- Page server component file <200 lines (delegate UI to phase-01 components).

## Architecture
Data flow:
1. Request `/he-thong-giai` → `proxy.ts` → `updateSession` → guest? redirect `/login`.
2. Authed → `app/(public)/layout.tsx` (resolves user + nav labels) → page.
3. `page.tsx` calls `getSessionUser()` (defense-in-depth; null → render-safe/redirect),
   then renders the assembled screen (TitleBlock, HeroBanner, two-column, KudosBanner).
4. `/awards-information` request → `next.config.ts` redirect → `/he-thong-giai`.

Redirect mechanism choice (pick ONE, document in code comment):
- **Preferred:** `next.config.ts` `redirects()` entry `{ source:"/awards-information",
  destination:"/he-thong-giai", permanent:true }` — runs before render, cheapest.
- Keep the old route dir? NO — delete stub dir (decision 1: replace). Redirect handles it.

## Related Code Files
**Modify**
- `lib/navigation/routes.ts` — `awardsInfo: "/he-thong-giai"`; update doc comments
  referencing "/awards-information" in `awardAnchor()`.
- `lib/navigation/routes.test.ts` — **MUST UPDATE** (hard-asserts old path): expects
  `awardAnchor("top-talent") === "/awards-information#top-talent"` and maps the stub page
  path. Update assertions to `/he-thong-giai#...` and the new page file path.
- `next.config.ts` — add `redirects()` entry (or extend existing).
**Create**
- `app/(public)/he-thong-giai/page.tsx` — server component shell (auth guard + compose UI).
**Delete**
- `app/(public)/awards-information/page.tsx` + its dir (replaced by redirect).

## Implementation Steps
1. Edit `lib/navigation/routes.ts`: change `awardsInfo` value to `"/he-thong-giai"`; fix
   the `awardAnchor` JSDoc + any "/awards-information" mentions.
1b. Update `lib/navigation/routes.test.ts` assertions (awardAnchor expectations + stub path
   map) to the new route — otherwise this test fails on the rename.
1c. (optional, low-pri) fix stale `/awards-information` doc comments in
   `award-card.tsx`, `hero-section.tsx`, `categories.ts` — comments only, no behavior change.
2. Edit `next.config.ts`: add async `redirects()` returning the permanent redirect entry.
3. Create `app/(public)/he-thong-giai/page.tsx`: `async` server component, call
   `getSessionUser()`, resolve `getTranslations("HeThongGiai")` (namespace from phase-03),
   render hero/title/two-column/kudos using phase-01 components. Keep <200 lines —
   compose, don't inline markup.
4. Delete `app/(public)/awards-information/` directory.
5. Run `pnpm tsc --noEmit` (or repo typecheck) — fix type errors from removed stub imports.

## Todo List
- [x] Change `ROUTES.awardsInfo` → `/he-thong-giai`
- [x] Update awardAnchor JSDoc / comments
- [x] Update lib/navigation/routes.test.ts assertions to new path
- [x] Add permanent redirect in next.config.ts
- [x] Create he-thong-giai/page.tsx server shell with getSessionUser guard
- [x] Delete awards-information stub dir
- [x] Typecheck passes

## Deviations & Cascade Updates
- **redirect type:** Implemented as 308 (Next.js permanent redirect) instead of 301 per initial clarification — functionally equivalent; verified curl 308 response.
- **test cascade:** Updated `tests/homepage/routes-verification.test.ts` + `awards-section.test.ts` to reflect route rename from `/awards-information` to `/he-thong-giai`.

## Success Criteria
- Visiting `/he-thong-giai` as guest → 307 to `/login` (proxy).
- Visiting `/awards-information` (any auth) → permanent redirect to `/he-thong-giai`.
- Header "Hệ thống giải" item active on the new page (aria-current="page").
- `pnpm tsc --noEmit` clean.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Stale links referencing literal `/awards-information` | Low | Med | grep repo for the literal string; all known refs use ROUTES |
| Redirect loop (old dir still present) | Low | High | Delete old dir; redirect source ≠ destination |
| Page renders before phase-03 namespace exists | Med | Low | Parallel-safe: page uses keys; integration (05) verifies strings resolve |

## Security Considerations
- Auth gating relies on proxy allowlist + page-level `getSessionUser()`. Do NOT add the
  new route to PUBLIC_PATHS. Confirm no public exposure of card data (data is non-sensitive
  static content, but page itself is login-gated per decision 2).

## Next Steps
- Feeds phase-05 (integration) — page shell must exist for wiring. No blocker on phase-01.
