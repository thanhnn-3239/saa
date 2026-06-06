# Phase C2 — Tests & validation

**Track:** — (tests) · **Status:** ✅ done · **Depends on:** C1

## Overview
Update existing tests for the renamed label + redesigned menu, and revise access-control tests for
the login-required policy. Delegate execution to `tester`. Do NOT weaken assertions to pass — fix code.

## Test changes
### Account menu — `components/header/account-menu.test.tsx`
- Rename assertions **"Sign out" → "Logout"** (text + role="menuitem").
- Profile item still links to `/profile`; person icon present (placement per design).
- Admin Dashboard: still hidden when `role` undefined / non-admin; shown when `role === "admin"`.
- Logout still submits `<form action={signOut}>` (action invoked).
- A11y unchanged: open/close on click, Escape closes + returns focus, outside-click closes, keyboard open.
- i18n: assert labels come from `Home.account.*` (no hardcoded English left).

### Header — `tests/homepage/app-header.test.tsx`
- Trigger is now a plain user-icon button (no name pill); update any selector relying on display name.

### Access control / proxy — (existing proxy/access tests)
- **Revise ID-0:** unauthenticated request to `/` now **redirects to `/login`** (was: homepage shown). Update.
- ID-1 (authenticated → homepage with account controls) still valid.
- Add/confirm: guest → `/awards-information`, `/sun-kudos`, `/tieu-chuan-chung`, `/profile` all redirect `/login`.
- Confirm `/login` + `/auth/callback` reachable while logged out.

## Steps
1. Update the test files above.
2. `pnpm test` (vitest) — all green. Fix failures by correcting code/tests, never by faking data.
3. `pnpm build` + `pnpm lint` — clean.

## Todo
- [x] account-menu tests updated (Logout label, icons, role gating, a11y, i18n; rewritten with next-intl provider)
- [x] app-header test updated (plain icon trigger)
- [x] access tests revised (ID-0 → redirect; new protected routes; proxy-session.test.ts added/updated)
- [x] `pnpm test` + `pnpm build` + `pnpm lint` all green (275 tests pass; vitest.config.ts `include` extended to `components/**`)

## Success criteria
- Full suite passes; coverage on account menu + access policy reflects the new behavior; build + lint clean.

## Note
MoMorph test ID-0 conflict (public→login-required) is an intentional policy change per clarification,
documented in `plan.md` → "Deviations". Reflect it in the test; do not revert the policy.
