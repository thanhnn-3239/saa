---
title: Auto-login backdoor for test/E2E (token-gated via .env)
date: 2026-06-06
status: done
mode: fast (design pre-sealed via brainstorm consultation)
issue: https://github.com/thanhnn-3239/saa/issues/7
worktree: ../ssa-wt-auto-login
branch: feat/auto-login-backdoor
package_manager: pnpm
blockedBy: []
blocks: []
---

# Blueprint — Auto-login backdoor (issue #7)

A token-gated `GET /auto-login?email=&token=` route that mints a **real** Supabase
session for an existing internal user — for E2E/test convenience, without going
through Google OAuth. Default-off; returns **404** on every reject branch (never
403 — don't reveal the backdoor). The session is genuine, so `getClaims()`
verifies everywhere and RLS works with the real `auth.uid()`.

**Consultation:** `plans/reports/brainstorm-260606-1316-auto-login-backdoor.md`

## Sealed decisions

- **Security gate: TOKEN-ONLY** per issue. No `NODE_ENV`/`VERCEL_ENV` hard-guard.
  Prominent DEV-ONLY warning in `.env.example`. (Risk accepted by owner.)
- **Dev seed wiring:** existing `env(SUPABASE_EXTRA_SEEDS)` hook — NOT hardcoded in `sql_paths`.
- **🔴 Required correction (issue missed):** add `/auto-login` to `PUBLIC_PATHS`,
  else the proxy redirects guests to `/login` before the handler runs.
- Reuse `isAllowedEmail` — do NOT relax. No `next`/`role` params. No on-demand user creation.

## Phases

| # | Phase | Status | Depends on |
|---|-------|--------|-----------|
| 01 | [Foundation: admin client + PUBLIC_PATHS + env](phase-01-foundation.md) | done | — |
| 02 | [Auto-login route handler](phase-02-route-handler.md) | done | 01 |
| 03 | [Dev seeder + EXTRA_SEEDS wiring](phase-03-dev-seeder.md) | done | — |
| 04 | [Tests (vitest)](phase-04-tests.md) | done | 02 |

## Outcome (2026-06-06)

All phases implemented and verified end-to-end against a live local Supabase.

- **Live verification caught a real bug** the unit tests (mocked) could not: the
  manually-seeded `auth.users` rows left GoTrue's nullable token columns
  (`confirmation_token`, `recovery_token`, `email_change`, `email_change_token_new`)
  as NULL → `listUsers`/`generateLink` failed with "Database error finding user"
  (Go scanner can't read NULL into a string). Fixed by seeding those columns to `''`
  (risk #3 realized & resolved).
- **Verified:** all reject branches → 404; valid admin & member → 307 → `/` with a
  real `sb-…-auth-token` cookie; the minted session is accepted by the proxy (`GET /`
  returns 200, not bounced to `/login`); seeder creates 10 users idempotently with
  correct roles/departments; `pnpm test` 288 green; `pnpm build` + TypeScript clean.

Phases 01→02→04 are the critical chain. Phase 03 (seeder) is independent and can
run in parallel; it produces the users that manual/E2E runs log in as.

## Key risks

1. **PUBLIC_PATHS** — without it the feature is dead (phase 01).
2. **`guard_profile_role` blocks the admin seed** — `is_admin()` is false during
   `db reset`; must disable trigger `trg_guard_profile_role` around the role update (phase 03).
3. **`auth.users` manual insert** is Supabase-version-sensitive — required columns +
   `identities` row (phase 03).
4. **Cookie-set in a Route Handler** — attach SSR-client cookies to the redirect response (phase 02).

## Out of scope

- JWT `user_role` custom claim wiring.
- On-demand user creation (404 is final).

## Success criteria

All issue acceptance criteria + `/auto-login` in `PUBLIC_PATHS`. Token unset→404;
bad/missing token→404 (constant-time); wrong domain→404; user-not-found→404;
valid→real session cookie + redirect `/`, recognized by proxy & `getSessionUser`;
works for both `admin` and `member`; dev seeder creates `admin-test`/`member-test`
+ 8 members; `.env.example` documents `AUTO_LOGIN_TOKEN` (DEV-ONLY). `pnpm test` green.
