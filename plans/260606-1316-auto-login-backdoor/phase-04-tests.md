# Phase 04 — Tests (vitest)

**Priority:** High · **Status:** done · **Depends on:** Phase 02

Unit-test the route's gate logic by mocking the Supabase clients — same pattern as
`lib/supabase/proxy-session.test.ts` (`vi.mock` the client modules). No live DB.

## Files

- **Create** `tests/auth/auto-login.test.ts` — route reject/accept branches.
- **Modify** `lib/supabase/proxy-session.test.ts` — assert `/auto-login` is public.

## Mocking strategy

- `vi.mock("@/lib/supabase/admin")` → fake `createAdminClient()` returning a stub
  with `auth.admin.generateLink` / `auth.admin.listUsers` (or getUserByEmail).
- `vi.mock("@/lib/supabase/server")` → fake SSR client with `auth.verifyOtp`.
- Set/unset `process.env.AUTO_LOGIN_TOKEN` per test (`vi.stubEnv`).
- Invoke the route's `GET` with a constructed `NextRequest` (mirror proxy test helper).

## Cases (mirror acceptance criteria)

- [ ] `AUTO_LOGIN_TOKEN` unset → 404
- [ ] token missing → 404
- [ ] token wrong (same length) → 404 (constant-time path exercised)
- [ ] token wrong (different length) → 404 (no throw)
- [ ] valid token + disallowed domain (`x@gmail.com`) → 404, admin client NOT called
- [ ] valid token + allowed domain + user-not-found → 404
- [ ] valid token + allowed domain + user exists → generateLink + verifyOtp called,
      302 redirect to `/`, session cookies present on response
- [ ] works for an `admin` email and a `member` email (both 302 → `/`)
- [ ] no `next`/`role` honored — redirect target always `/`

For `proxy-session.test.ts`:
- [ ] unauthenticated request to `/auto-login` is NOT redirected to `/login`
      (passes through, since it's in `PUBLIC_PATHS`)

## Todo

- [x] Write `tests/auth/auto-login.test.ts` covering all branches above
- [x] Add `/auto-login` public-path case to `proxy-session.test.ts`
- [x] `pnpm test` → all green (288 total)
- [x] No real network/DB calls in tests

## Success criteria

`pnpm test` passes; every reject branch and the happy path are covered; the proxy
test proves `/auto-login` is reachable for guests. No flaky/live dependencies.
