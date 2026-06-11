---
title: Homepage SAA — public marketing landing (ROOT FURTHER)
date: 2026-06-05
status: completed
mode: auto
package_manager: pnpm
blockedBy: []
blocks: []
supersededBy:
  - 260606-0802-account-menu-redesign-login-gating   # reverses "Homepage access = Public" → login-required
momorph:
  fileKey: 9ypp4enmFmdK3YAFJLIu6C
  screens:
    - { name: Homepage SAA, screenId: i87tDx10uM }
    - { name: FAB collapsed, screenId: _hphd32jN2 }
    - { name: FAB expanded, screenId: Sv7DFwBw1h }
    - { name: Thể lệ panel, screenId: b1Filzi9i6 }
---

# Blueprint — Homepage SAA (public marketing landing)

Build the **public** SAA 2025 homepage from the MoMorph design: sticky header nav, ROOT
FURTHER hero with live countdown, "Root Further" content block, awards grid (6 categories),
Sun* Kudos promo, floating widget button, footer. Authenticated users additionally see a
notification bell + account menu. Scope = **UI shell + working basics** (see clarifications).

## Context
- Builds on completed work: [login Google OAuth](../260604-1415-login-google-oauth/plan.md) and
  [i18n next-intl](../260604-1519-i18n-next-intl-setup/plan.md). Reuses Supabase clients
  (`lib/supabase/{client,server}.ts`), `proxy.ts` session handling, next-intl (cookie-based, vi default).
- MoMorph: Homepage SAA `https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM`
- Specs: 46 items · Test cases: 62 · Clarifications: [clarifications.md](clarifications.md)
- Reports: [tester-260605-1655-homepage-saa-correct.md](../reports/tester-260605-1655-homepage-saa-correct.md), [reviewer-260605-1544-homepage-saa.md](../reports/reviewer-260605-1544-homepage-saa.md)
- ⚠️ Next.js 16: read `node_modules/next/dist/docs/` before coding. `proxy.ts` (not middleware),
  `cookies()` is async, no `src/` (files at repo root: `app/`, `lib/`).

## Locked decisions (from clarification)
| Decision | Choice |
|----------|--------|
| Homepage access | ~~**Public** — `proxy.ts` allows `/` for guests~~ → **SUPERSEDED 2026-06-06**: app is now **login-required** (see [account-menu-redesign-login-gating](../260606-0802-account-menu-redesign-login-gating/plan.md)). Auth-only controls still render conditionally. |
| Scope | UI shell + working basics; notifications/roles/target-pages = placeholder/stub |
| Links to unbuilt pages | Minimal **stub route pages** (coming soon) so no broken links (ID-59) |
| i18n | VN authored in `messages/vi.json`, EN keys mirrored in `en.json`; all strings via next-intl |
| Awards data | Static 6-category dataset (slug + i18n keys), no DB |
| Countdown | `NEXT_PUBLIC_EVENT_DATETIME` (ISO-8601), client ticks per minute, zero/invalid handled |
| Header/footer | Shared components in a public route-group layout |

## Execution model (two parallel tracks)
Track A (UI) and Track B (logic) are **parallel-runnable — no cross-track blocking**. Integration
and tests come after both. When executed via `tkm:takumi`, Track A spawns UI work per screen while
Track B implements logic concurrently.

## Phases
| # | Phase | Track | Status | Depends on |
|---|-------|-------|--------|-----------|
| A1 | [Homepage UI](phase-a1-homepage-ui.md) | A (UI) | ✅ done | — |
| B1 | [Foundation & public access](phase-b1-foundation-public-access.md) | B (logic) | ✅ done | — |
| B2 | [Countdown & event data](phase-b2-countdown-event-data.md) | B (logic) | ✅ done | B1 |
| B3 | [Auth controls & awards data](phase-b3-auth-controls-awards-data.md) | B (logic) | ✅ done | B1 |
| B4 | [Stub routes & navigation](phase-b4-stub-routes-navigation.md) | B (logic) | ✅ done | B1 |
| C1 | [Integration](phase-c1-integration.md) | — | ✅ done | A1, B2, B3, B4 |
| C2 | [Tests & validation](phase-c2-tests.md) | — | ✅ done | C1 |
| D1 | [FAB speed-dial + Thể lệ panel](phase-d1-fab-thele.md) | A (UI) | ✅ done | C1 |

## Key dependencies
- next-intl (cookie-based) · Supabase SSR auth · Tailwind v4 · Next.js 16 App Router · Vitest + Testing Library.
- New env var: `NEXT_PUBLIC_EVENT_DATETIME` (add to `.env.example` + Vercel).

## Outcome & Deviations

**Completion:** All phases implemented on branch `feat/homepage-saa`. 250/250 tests pass, `pnpm build` green. Reviewer score 7.5 → all High/Medium/Nit fixes applied.

**Key deviations from blueprint:**
1. **Route conflict resolved:** deleted `app/page.tsx` (causing dual-mapping to `/`). Canonical homepage is now `app/(public)/page.tsx` wrapped by `app/(public)/layout.tsx` (server session resolve + auth controls).
2. **CountdownTimer prop contract:** Countdown values (`days`, `hours`, `minutes`) are **computed upstream** by `useCountdown` hook in `countdown-live.tsx` and passed as props to the presentational `CountdownTimer` (not `targetIso` directly). This enables hydration-safe rendering.
3. **Tests location:** Live in `tests/homepage/` (not co-located under `app/(public)/_components/`) because vitest module resolution fails with Next.js route-group parentheses. `vitest.config.ts` includes `tests/**/*.{test,spec}.{ts,tsx}`. 250 tests pass.
4. **Security clarification:** `/profile` is **authenticated-only** (fixed from reviewer H1 issue). Removed from `PUBLIC_PATHS`; guests redirected to `/login` per auth contract.
5. **i18n alignment:** Fixed hardcoded English in header nav (now uses `Home.nav` keys), widget menu (Vi→i18n), notification bell (Vi→i18n), language switcher aria-label (now `langSelectAria` key). All strings via next-intl.

## Phase D (added 2026-06-05 — new scope)
The floating widget was a placeholder per the original clarification (homepage spec item 6 had no menu
detail). User later supplied 3 separate MoMorph frames (FAB collapsed/expanded + Thể lệ panel) → added as
[Phase D1](phase-d1-fab-thele.md). Reopened plan status to `in-progress` until D1 ships.

## Known limitations (deferred)
- No real notification system, no user roles (ID-5/ID-37 deferred).
- "Viết KUDOS" action is a placeholder (no write-kudos design provided) — see D1.
- Awards Information / Tiêu chuẩn chung are stub pages only. **Sun* Kudos board is now implemented** (see [plan 260606-1325-sun-kudos-live-board](../260606-1325-sun-kudos-live-board/plan.md)).
