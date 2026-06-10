# Phase 02 — Auto-login route handler

**Priority:** Critical · **Status:** done · **Depends on:** Phase 01

The core: `app/auto-login/route.ts`. Mints a **real** Supabase session via magiclink
OTP. Every reject path returns **404** (not 403). Token compared constant-time.

## File

- **Create** `app/auto-login/route.ts` — Next.js 16 Route Handler (`GET`).

## Reject/accept flow (strict order)

1. `AUTO_LOGIN_TOKEN` empty/unset → **404** (route disabled — don't reveal it exists).
2. Read token from header `x-auto-login-token` **or** query `?token=`. Missing/wrong
   → **404**. Compare with `crypto.timingSafeEqual` over equal-length buffers
   (guard length mismatch first to avoid throw, but still constant-time on match path).
3. `email` query param. `isAllowedEmail(email) === false` → **404** (reuse existing fn).
4. Look up user by email via **service-role admin client** (`createAdminClient()`).
   Use `admin.auth.admin.listUsers()` paginated or the GoTrue admin getUserByEmail
   equivalent; not found → **404** (NO on-demand creation).
5. Mint session without password:
   - `admin.auth.admin.generateLink({ type: 'magiclink', email })` → read
     `data.properties.hashed_token`.
   - Create an **SSR server client** (`@/lib/supabase/server` `createClient()`),
     `verifyOtp({ type: 'magiclink', token_hash: hashed_token })` — this sets the
     session cookies via the cookie adapter.
6. `redirect('/')` — use `NextResponse.redirect(new URL('/', request.url))`. Ensure
   the cookies written by the SSR client are attached to the redirect response
   (the `cookies()` adapter in a Route Handler writes to the response — verify the
   set cookies land on the 302; if not, copy them onto the `NextResponse`).

## Key implementation notes

- **404 helper:** `new NextResponse(null, { status: 404 })` for every reject branch —
  identical response shape so branches are indistinguishable.
- **Constant-time compare:**
  ```ts
  import { timingSafeEqual } from "node:crypto";
  function tokenOk(provided: string | null, expected: string) {
    if (!provided) return false;
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  }
  ```
  (Length check leaks length only — acceptable; the secret is high-entropy.)
- **Node runtime:** `node:crypto` + service-role → ensure the handler runs on Node
  (default in Next 16 / Fluid Compute). Add `export const runtime = "nodejs";` if needed.
- Do NOT accept `next` or `role` params. Always redirect to `/`.
- Wrap generateLink/verifyOtp in try/catch → on any failure return **404** (never leak
  a 500 with a stack that hints at the backdoor).

## Todo

- [x] Create `app/auto-login/route.ts` with the 6-step flow
- [x] Constant-time token compare
- [x] All reject branches return identical 404
- [x] Verify session cookies attach to the redirect (verified live: `sb-…-auth-token` on the 307)
- [x] `pnpm lint` + `pnpm build` clean

## Success criteria

Manual: with `AUTO_LOGIN_TOKEN` set + a seeded user, `GET /auto-login?email=admin-test@sun-asterisk.com&token=<secret>`
sets a session and `/` renders authenticated. All reject branches → 404.
Automated coverage in phase 04.
