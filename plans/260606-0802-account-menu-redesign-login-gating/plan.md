---
title: Account menu redesign + login-required gating (SAA header)
date: 2026-06-06
status: completed
mode: auto
package_manager: pnpm
blockedBy: []
blocks: []
supersedes:
  - 260605-1529-homepage-saa   # reverses its "Homepage access = Public" locked decision
momorph:
  fileKey: 9ypp4enmFmdK3YAFJLIu6C
  screens:
    - { name: Dropdown-profile, screenId: z4sCl3_Qtk }
    - { name: Homepage SAA (header A1.8 account button), screenId: i87tDx10uM }
---

# Blueprint — Account menu redesign + login-required gating

Bring the logged-in header into line with two MoMorph frames and lock the app behind login.
**Functionality already exists** (session-aware header in `app/(public)/layout.tsx`, real
`signOut` server action) — this is a **design/UX refinement + auth-policy change**, not a new build.

Two things change:
1. **Account UI** — restyle the account button (Homepage A1.8 = plain user icon) and its dropdown
   (Dropdown-profile = dark rounded card: **Profile** w/ glow + person icon, **Logout** w/ chevron ›,
   plus role-gated **Admin Dashboard**). Rename "Sign out" → "Logout". All labels via next-intl.
2. **Auth policy** — make the whole app **login-required** (internal, `@sun-asterisk.com` only):
   tighten `PUBLIC_PATHS` so only `/login` + `/auth/callback` are public; guests → `/login`.

## Context
- Builds on (completed): [homepage-saa](../260605-1529-homepage-saa/plan.md) ·
  [login-google-oauth](../260604-1415-login-google-oauth/plan.md) · [i18n](../260604-1519-i18n-next-intl-setup/plan.md)
- MoMorph: Dropdown-profile `https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/z4sCl3_Qtk` ·
  Homepage A1.8 `https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM`
- Specs: Dropdown-profile 3 items · Clarifications: [clarifications.md](clarifications.md)
- ⚠️ Next.js 16: read `node_modules/next/dist/docs/` before coding. Auth lives in `proxy.ts`
  (NOT `middleware.ts`); `cookies()` async; verify with `getClaims()`; no `src/` (root: `app/`, `lib/`, `components/`).

## Locked decisions (from clarification)
| Decision | Choice |
|----------|--------|
| Root cause | Design mismatch → **redesign UI** (header already switches on session; logout action exists) |
| App access | **Login-required** — only `/login` + `/auth/callback` public; everything else → `/login` for guests |
| Account trigger | Plain user-icon button ~40×40 (Homepage A1.8) — drop gold avatar + name pill + chevron |
| Dropdown items | **Profile** (glow, icon right) · **Admin Dashboard** (role-gated, hidden non-admin) · **Logout** (chevron ›) |
| Label | "Sign out" → **"Logout"**; labels become next-intl keys (vi + en, literal "Profile"/"Logout") |
| Logout redirect | `/login` (unchanged — `signOut` already does this) |

## Execution model (two parallel tracks)
Track A (UI) and Track B (auth policy) are **parallel-runnable — no cross-track blocking**.
Integration + tests run after both. When executed via `tkm:takumi`, Track A codes the account menu
UI per the two frames while Track B changes the proxy access policy concurrently.

## Phases
| # | Phase | Track | Status | Depends on |
|---|-------|-------|--------|-----------|
| A1 | [Account menu UI (trigger + dropdown)](phase-a1-account-menu-ui.md) | A (UI) | ✅ done | — |
| B1 | [Login-required auth gating](phase-b1-login-required-gating.md) | B (logic) | ✅ done | — |
| C1 | [Integration & verify login-state header](phase-c1-integration.md) | — | ✅ done | A1, B1 |
| C2 | [Tests & validation](phase-c2-tests.md) | — | ✅ done | C1 |

## Key files
- `components/header/account-menu.tsx` (trigger + dropdown restyle) · `app/(public)/_components/app-header.tsx` (slot)
- `lib/supabase/proxy-session.ts` (`PUBLIC_PATHS` tighten) · `messages/{vi,en}.json` (account keys)
- Tests: `components/header/account-menu.test.tsx`, `tests/homepage/app-header.test.tsx`, proxy/access tests

## Deviations & cross-plan impact
- **Reverses** homepage plan's "Homepage access = Public" — `/` and public info pages now require login.
- **Invalidates MoMorph test ID-0** (Homepage SAA): "unauthenticated → homepage shown" is no longer
  true; guest → redirect `/login`. ID-1 (authenticated) still valid. C2 updates these access tests.
- Route group `app/(public)/` is now a **misnomer** (no longer public) — left as-is (rename = churn/risk; YAGNI).
- `authControls` guest branch (`user ? … : null`) becomes effectively dead under login-required — kept as defensive guard.

## Outcome
- **Tests:** 275 passing (vitest, all suites green — including previously un-run component tests).
- **Build:** `pnpm build` green; all 8 routes + proxy compile cleanly.
- **Runtime:** Login-required gating verified end-to-end (guests redirect `/login`, authenticated `@sun-asterisk.com` access all routes).
- **Review:** Reviewer score 7.5/10; high-priority fixes applied (H1: domain guard in `get-session-user.ts` for defense-in-depth).
- **Design:** Account menu UI matches both MoMorph frames (plain user-icon trigger, dark dropdown, Profile w/ glow, Logout w/ chevron).

## Known limitations (deferred)
- **H2** — No server-side RBAC for future `/admin` route (route doesn't exist; no role system yet). OAuth `next` param sanitized (no open-redirect).
- **M4** — Dropdown uses `role="menu"` without full arrow-key roving focus (pre-existing codebase pattern; items reachable via Tab).
- **Line count** — `account-menu.tsx` ~213 lines (slightly over 200-line guideline); overage is inline design-token styles + local SVG icon components; refactor deferred.
- `/profile` remains a "Coming soon" stub. Notification bell unchanged (stub).
- **Deviation:** `vitest.config.ts` `include` extended to `components/**` (closes pre-existing gap — two component test suites never ran before).
