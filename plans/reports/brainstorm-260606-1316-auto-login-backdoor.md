# Consultation — Auto-login backdoor for test/E2E (issue #7)

- Date: 2026-06-06
- Issue: https://github.com/thanhnn-3239/saa/issues/7
- Worktree: `../ssa-wt-auto-login` on branch `feat/auto-login-backdoor` (off `main` @ 7d7a48a)

## The Commission

Token-gated `GET /auto-login?email=&token=` route that mints a **real** Supabase
session (no `getClaims` bypass) for E2E/test convenience. Default-off; **404** on
every reject branch (no 403 — don't reveal the backdoor exists). Plus a dev seeder
for test users. Issue is near-fully specified; this consultation validated
feasibility and corrected gaps.

## Codebase validation

- `getClaims()` (JWT-verified) used in `proxy-session.ts` + `get-session-user.ts` — confirmed; backdoor must create a genuine session. ✅
- `lib/auth/allowed-domain.ts` `isAllowedEmail()` exists — reuse, do NOT relax. ✅
- `lib/supabase/admin.ts` — MISSING, must create (service-role client w/ `SUPABASE_SECRET_KEY`). ✅
- `supabase/seeds/dev/` empty; `config.toml:63` `sql_paths` already exposes `env(SUPABASE_EXTRA_SEEDS)`. ✅
- magiclink `generateLink` → `verifyOtp` via SSR client → real session passing every gate. Sound. ✅

## 🔴 Critical correction (issue missed this)

`/auto-login` is **unreachable as written**. The proxy (`proxy.ts`) matches it, and
`PUBLIC_PATHS = {"/login", "/auth/callback"}` (`lib/supabase/proxy-session.ts:11`)
excludes it → guest is redirected to `/login` **before** the handler runs.
**MUST add `/auto-login` to `PUBLIC_PATHS`.** Issue file-scope table omitted
`proxy-session.ts` — this is a required addition, not optional.

## Decisions sealed

| Topic | Decision | Notes |
|-------|----------|-------|
| Security gate | **Token-only**, per issue | Craftsman flagged prod-footgun risk; user accepts documented risk for flexibility. Keep DEV-ONLY warning prominent in `.env.example`. No `NODE_ENV`/`VERCEL_ENV` hard-guard. |
| Dev seed wiring | **`SUPABASE_EXTRA_SEEDS` env** (opt-in) | Use existing `env()` hook; no `config.toml` change; `common/` stays clean. Set `SUPABASE_EXTRA_SEEDS=./seeds/dev/seed.sql` locally. |
| Worktree | **New worktree off `main`** | `../ssa-wt-auto-login` @ `feat/auto-login-backdoor`. |
| Next step | **Plan first** | `/tkm:create-plan` before code. |

## Paths examined (security gate)

- A — Token-only (CHOSEN): matches issue, max flexibility, accepts prod risk.
- B — Token + `VERCEL_ENV==='production' → 404`: one line, still works dev/preview/CI, eliminates the misconfig footgun. Rejected by user in favor of A.

## What to watch (implementation risks)

1. **PUBLIC_PATHS** — add `/auto-login` or feature is dead (highest priority).
2. **`auth.users` manual inserts** — version-sensitive: need `id, instance_id, aud,
   role, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at,
   updated_at` (+ `identities` row). Trigger `handle_new_user` creates `profiles`
   (default `member`); `update` to `admin` for admin-test.
3. **Cookie-set in Route Handler** — use `NextResponse.redirect('/')` with cookies
   from the SSR client attached; route handlers CAN write cookies (unlike Server
   Components).
4. **404 on every reject branch**; constant-time token compare (`timingSafeEqual`).
5. **Do NOT** add `next`/`role` params, create users on-demand, or relax `isAllowedEmail`.

## Success criteria

Issue acceptance criteria + corrected: token unset→404; bad/missing token→404
(constant-time); wrong domain→404; user-not-found→404; valid→real session cookie,
redirect `/`, recognized by `proxy-session`/`getSessionUser`; works for both
`admin` and `member`; dev seeder creates `admin-test`/`member-test` + ~5–8 members;
`.env.example` has `AUTO_LOGIN_TOKEN` w/ DEV-ONLY warning; **`/auto-login` in PUBLIC_PATHS**.

## Out of scope

- JWT `user_role` custom claim wiring.
- On-demand user creation (404 is final).

## Next steps

1. `/tkm:create-plan` in the worktree (this report as context).
2. Implement → test (vitest) → review → PR.
