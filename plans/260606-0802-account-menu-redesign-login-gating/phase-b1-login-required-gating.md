# Phase B1 — Login-required auth gating

**Track:** B (logic) · **Status:** ✅ done · **Depends on:** — (parallel with A1)

## Overview
Lock the whole app behind login. Internal tool for `@sun-asterisk.com` only. Reverses the homepage
plan's "Public" decision: only `/login` and `/auth/callback` stay public; every other route redirects
unauthenticated users to `/login`.

## Key insight
The enforcement engine already exists in `lib/supabase/proxy-session.ts`:
```ts
if (!isAuthed && !PUBLIC_PATHS.has(pathname)) return redirectTo("/login", request, response);
```
`isAuthed` already checks `getClaims()` **and** `isAllowedEmail()` (domain restriction). The ONLY
change needed is shrinking the `PUBLIC_PATHS` allowlist. No new logic.

## Change
`lib/supabase/proxy-session.ts` — `PUBLIC_PATHS`:
- **Before:** `/`, `/login`, `/auth/callback`, `/awards-information`, `/sun-kudos`, `/tieu-chuan-chung`
- **After:** `/login`, `/auth/callback` only

Remove `/`, `/awards-information`, `/sun-kudos`, `/tieu-chuan-chung` (and confirm `/profile` was never
public). Static assets remain excluded via the `proxy.ts` matcher (no change).

## Implementation steps
1. Read `node_modules/next/dist/docs/` proxy/auth guidance (Next.js 16 invariants).
2. Edit `PUBLIC_PATHS` in `lib/supabase/proxy-session.ts` to the two-entry allowlist above.
3. Verify `signOut` still redirects to `/login` (`lib/auth/sign-out-action.ts`) — keep as-is.
4. Confirm `/login` (`app/login/page.tsx`) is OUTSIDE the `(public)` group (it is) so it stays reachable.
5. `pnpm build` (or `pnpm exec tsc --noEmit`) — compile check, no type errors.

## Related code files
- Edit: `lib/supabase/proxy-session.ts`
- Read-only: `proxy.ts`, `lib/auth/sign-out-action.ts`, `lib/auth/get-session-user.ts`, `app/(public)/layout.tsx`

## Todo
- [x] Shrink `PUBLIC_PATHS` to `/login` + `/auth/callback`
- [x] Verify domain restriction + logout→/login unchanged (domain guard added to `lib/auth/get-session-user.ts` for defense-in-depth)
- [x] Compile check passes (build green, no type errors)

## Success criteria
- Guest hitting `/`, `/awards-information`, `/sun-kudos`, `/tieu-chuan-chung`, `/profile` → redirected `/login`.
- Authenticated `@sun-asterisk.com` user reaches all routes; non-domain account signed out + rejected (existing behavior).
- `/login` + `/auth/callback` reachable while logged out.

## Risk / security
- **Risk:** over-locking breaks OAuth round-trip → mitigated by keeping `/auth/callback` public.
- **Security (positive):** removes public exposure of internal pages; aligns with internal-only intent.
- Watch: the `(public)` route-group NAME no longer reflects access (cosmetic only; do not rename now).
