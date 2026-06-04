# Code Review — Login (Supabase Google OAuth)
**Date:** 2026-06-04  
**Reviewer:** reviewer agent  
**Verdict:** APPROVE_WITH_NITS — 7.5 / 10

---

## Scope
- Files: `lib/auth/allowed-domain.ts`, `lib/auth/oauth-actions.ts`, `app/auth/callback/route.ts`, `lib/supabase/proxy-session.ts`, `proxy.ts`, `app/login/page.tsx`, `app/login/_components/*.tsx`
- Tests: 115 tests across 6 test files (no test for `oauth-actions.ts`)
- LOC: ~400 production, ~700 test

---

## Overall Assessment

The core security design is sound: PKCE flow handled by `@supabase/ssr`, server-side domain enforcement in the callback, `getClaims()` (JWT-verified) used throughout instead of `getSession()`. No injection vectors found. The main risks are a missing try/catch creating a potential session-escape window (mitigated by Next.js cookie commit semantics, but fragile), the proxy not re-verifying domain on every request, and one untested test behavior that documents a real auth-bypass edge case.

---

## Critical Issues

### C1 — Unhandled exception in callback after session is established
**File:** `app/auth/callback/route.ts:45-46`  
**Severity:** Critical (conditional)

```ts
const { data } = await supabase.auth.getClaims();  // no try/catch
const email = data?.claims?.email as string | undefined;
```

If `getClaims()` throws (library bug, malformed cookie, unexpected runtime error), the Route Handler propagates the exception. Next.js returns 500. **The question is whether the session cookies from `exchangeCodeForSession` are committed to the browser before the exception.**

In Next.js App Router Route Handlers, `next/headers` `cookies()` mutations are buffered and flushed only on a successful response. If the handler throws, the cookies are NOT sent — so in practice the session is NOT persisted and the bypass doesn't occur.

However, this relies on an internal Next.js implementation detail that is not guaranteed by any public API contract. A defensive `try/catch` is cheap insurance:

```ts
let claimsData: Awaited<ReturnType<typeof supabase.auth.getClaims>>["data"];
try {
  const result = await supabase.auth.getClaims();
  claimsData = result.data;
} catch {
  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
const email = claimsData?.claims?.email as string | undefined;
```

**Fix:** Wrap the `getClaims()` call in a try/catch. If it throws, call `signOut()` and redirect to `/login?error=oauth`.

---

## High Priority

### H1 — Proxy does not re-verify email domain on every request
**File:** `lib/supabase/proxy-session.ts:57-58`  
**Severity:** High (defense-in-depth gap)

```ts
const { data } = await supabase.auth.getClaims();
const isAuthed = !!data?.claims;  // truthy claims = allowed through
```

The proxy checks authentication but NOT the email domain. If a non-`@sun-asterisk.com` Supabase session were established by any means (direct API call with anon key can't do this, but future OAuth provider additions or a misconfigured Supabase project could), the proxy would admit it without domain verification.

In the current threat model (single OAuth provider, no service accounts) this is low-severity operationally. But defense-in-depth would add:

```ts
const email = data?.claims?.email as string | undefined;
const isAuthed = !!data?.claims && isAllowedEmail(email);
```

**Fix:** Import `isAllowedEmail` into proxy-session.ts and gate `isAuthed` on both claims existence AND domain. If domain fails, redirect to `/login?error=domain` (or simply `/login`).

---

### H2 — `oauth-actions.ts` has zero test coverage
**File:** `lib/auth/oauth-actions.ts`  
**Severity:** High (test gap on security-adjacent code)

`signInWithGoogle()` is the entry point for the entire auth flow. It constructs the `redirectTo` URL (including the `next` param) and calls `supabase.auth.signInWithOAuth`. No test file exists for it.

Critical untested behaviors:
- `redirectTo` URL construction uses `window.location.origin` — any typo would silently break the callback URL
- `hd: ALLOWED_DOMAIN` is passed but is acknowledged as a UX hint only; no test confirms it's not treated as security enforcement
- If `supabase.auth.signInWithOAuth` returns `{ error }`, the error is thrown — no test for that path (though it IS covered in `google-login-control.test.tsx` at the component level via mock)

**Fix:** Add unit tests for `oauth-actions.ts` covering: correct `redirectTo` construction, error propagation when Supabase returns an error, and that `hd` param is set to the correct domain.

---

### H3 — Empty claims object `{}` treated as authenticated
**File:** `lib/supabase/proxy-session.ts:58`, `lib/supabase/proxy-session.test.ts:200-216`  
**Severity:** High (documented edge case; test affirms wrong behavior)

```ts
const isAuthed = !!data?.claims;  // !!{} === true
```

The test explicitly documents this:
> "Note: !!{} is true, so empty claims object is treated as authenticated"

`getClaims()` for `@supabase/auth-js` 2.107.0 will not return `{ claims: {} }` for an unauthenticated or invalid session in normal operation — it returns `{ claims: null }`. But the test documents the behavior as if it's acceptable, which could mislead future maintainers into thinking `claims: {}` is a valid auth state.

If the library ever returns `{ claims: {} }` on a JWT decode failure, an unauthenticated user could access protected routes.

**Fix:** The guard should be stricter:
```ts
const isAuthed = !!(data?.claims && Object.keys(data.claims).length > 0);
```
Or better: check for a specific required claim like `sub`:
```ts
const isAuthed = !!data?.claims?.sub;
```
Update the test to reflect this. Remove the "this is a potential edge case" comment that normalizes the behavior.

---

## Medium Priority

### M1 — Error code from Google forwarded without allowlist
**File:** `app/auth/callback/route.ts:20-24`

```ts
const providerError = searchParams.get("error");
if (providerError) {
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(providerError)}`,
  );
}
```

Any string Google sends as `?error=` is forwarded to `/login?error=<string>`. `LoginErrorBanner` renders it via JSX (safe from XSS), and the fallback message includes the code verbatim: `Đăng nhập thất bại (${code}). Vui lòng thử lại.`

While not an XSS risk, a maliciously crafted redirect to `/auth/callback?error=<very_long_string>` could produce odd-looking UI. More importantly, the `error` URL param is never sanitized or length-limited anywhere in the chain.

**Fix:** Allowlist known provider error codes, map unknowns to `"oauth"`:
```ts
const KNOWN_PROVIDER_ERRORS = new Set(["access_denied", "invalid_request", "server_error"]);
const safeError = KNOWN_PROVIDER_ERRORS.has(providerError) ? providerError : "oauth";
return NextResponse.redirect(`${origin}/login?error=${safeError}`);
```

---

### M2 — Missing env var check at startup
**File:** `lib/supabase/proxy-session.ts:35-36`, `lib/supabase/server.ts:12-13`

Both files use `process.env.NEXT_PUBLIC_SUPABASE_URL!` and `NEXT_PUBLIC_SUPABASE_ANON_KEY!` with non-null assertion. If the env vars are missing, `createServerClient` will be called with `undefined` which causes a runtime crash on first request — not a build error.

There is no startup validation. In production, this fails silently until a request hits the proxy or auth flow.

**Fix:** Add a validation at module load time in `lib/supabase/server.ts` (or a dedicated `lib/supabase/config.ts`):
```ts
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase environment variables");
}
```
This makes misconfiguration fail fast at server startup rather than on first user request.

---

### M3 — Authenticated user hitting `/login/` (trailing slash) is not redirected
**File:** `lib/supabase/proxy-session.ts:61`

```ts
if (isAuthed && pathname === "/login") {  // strict equality
```

`/login/` (with trailing slash) bypasses the authenticated-redirect. The user sees the login page while authenticated. In practice, Next.js likely normalizes trailing slashes by default, but this is not enforced explicitly and is environment-dependent.

**Fix:** Change `pathname === "/login"` to `pathname.replace(/\/$/, '') === "/login"` or ensure Next.js `trailingSlash: false` is set in `next.config`.

---

## Low Priority

### L1 — Loading state never resets on non-throw resolution
**File:** `app/login/_components/google-login-control.tsx:18-22`

If `signInWithGoogle()` resolves without throwing AND without triggering browser navigation (an edge case not possible with current `@supabase/ssr` but possible if the library changes behavior or in test environments), `loading` stays `true` forever and the button is permanently stuck disabled.

The comment says "Success path redirects to Google — keep the button in its loading state" — this is intentional. But there's no timeout or fallback to reset if navigation doesn't happen within N seconds.

**Fix:** Low-risk as-is. Optional: add a `setTimeout` fallback (e.g., 10s) to reset loading state and show a "Something went wrong, please try again" state.

---

### L2 — `error` code in URL is user-controllable without length limit
**File:** `app/login/page.tsx:23`, `app/login/_components/login-error-banner.tsx:26`

The `error` query param from the URL flows directly into the banner fallback message: `Đăng nhập thất bại (${code}). Vui lòng thử lại.`. Anyone can craft a URL like `/login?error=very_long_arbitrary_string` and send it to another user. While this is not XSS (JSX renders as text), it is a minor social engineering surface.

**Fix:** Consistent with M1 fix — allowlist valid codes and map unknowns to `"oauth"`. Apply at the page level too, not just the banner: strip unknown codes before rendering.

---

### L3 — `as string | undefined` type assertion on `claims.email`
**File:** `app/auth/callback/route.ts:46`

```ts
const email = data?.claims?.email as string | undefined;
```

`data?.claims` is typed as the JWT payload. If `getClaims()` returns correct typing, the `as` cast is unnecessary and hides a potential type mismatch if the library's claim shape changes. 

**Fix:** Remove the `as` cast and let TypeScript infer from the actual return type. If the type doesn't include `email`, declare an intersection type rather than asserting.

---

## Test Quality Assessment

**Total:** 115 tests across 6 files (callback: 15, proxy-session: 13, allowed-domain: 16, google-login-control: 19, login-button: 32, login-error-banner: 20). `oauth-actions.ts`: 0 tests.

**Good:**
- `callback.test.ts` thoroughly covers all redirect paths including open-redirect protection with `//evil.com` and `https://evil.com`.
- `allowed-domain.test.ts` covers null, undefined, empty string, just-domain, mixed-case — comprehensive.
- `google-login-control.test.tsx` correctly tests that loading state stays `true` after success (intentional design).
- `login-button.test.tsx` tests both `disabled` and `loading` props independently and in combination.

**Weak tests:**

1. **`proxy-session.test.ts` — "treats non-null claims object as authed (even if empty)"** (line 200): This test passes `{ claims: {} }` and asserts 200. It documents and affirms a security-edge behavior rather than fixing it. The comment "This is a potential edge case but current implementation treats it as authed" is a red flag — it should be a failing test that enforces correct behavior.

2. **`callback.test.ts` — getClaims returning `{ data: null }`** is not tested. Only `claims` without an `email` field is tested. The case where `getClaims()` returns `{ data: null, error: AuthError }` (session cookie missing or corrupted after exchange) has no coverage.

3. **`callback.test.ts` — no test for getClaims() throwing** (see C1 above). The happy-path assumption about `getClaims()` always returning without throwing means the critical path is uncovered.

4. **`google-login-control.test.tsx` line 227** — `button.querySelector("span[class*='animate-spin']")`: This test is tightly coupled to the CSS class name `animate-spin`. If Tailwind class changes, the test breaks silently (querySelector returns null, `expect(null).toBeInTheDocument()` fails with unhelpful message).

5. **Multiple proxy-session tests** test that `response.status` is 200 (not redirect) but don't assert that cookies were actually propagated — the main purpose of the `setAll` callback. The cookie propagation test (line 218) only checks `response.cookies` is defined, not that specific cookies were carried.

---

## Edge Cases Found (Scouting)

1. **Already-authenticated callback replay:** An authenticated `@sun-asterisk.com` user hitting `/auth/callback?code=old_code` is allowed through by the proxy (correct), re-establishes a new session (fine). No issues.

2. **`/login/` trailing slash while authenticated:** Authenticated user served the login page instead of being redirected. (See M3.)

3. **`/auth/callback` with both `code` and `error` params:** Correctly handled — `error` takes precedence over `code` check.

4. **`next` param pointing to `/login`:** `/auth/callback?code=X&next=/login` — for an `@sun-asterisk.com` user, they're redirected to `/login`. The proxy then sees them as authenticated and redirects to `/`. This double-redirect is ugly UX but not a security issue.

5. **`next` param pointing to `/auth/callback`:** `/auth/callback?code=X&next=/auth/callback` — safe, just re-enters the callback flow, which errors on missing code and redirects to `/login?error=oauth`.

6. **Concurrent button clicks:** Correctly blocked by `disabled` HTML attribute + `onClick={isDisabled ? undefined : onClick}` guard in `LoginButton`.

---

## Positive Observations

- `hd` param correctly documented as UX-hint-only; real enforcement is server-side. No false trust.
- `encodeURIComponent` consistently used when building redirect URLs.
- `searchParams.get("next")` auto-decodes before validation — no double-encoding issue.
- Open-redirect guard (`startsWith("/") && !startsWith("//")`) is correct. Protocol-relative URLs and absolute URLs both blocked.
- `isAllowedEmail()` is case-insensitive (`.toLowerCase()`) — prevents `User@SUN-ASTERISK.COM` bypass.
- `isAllowedEmail()` checks `length > domain.length` — prevents `@sun-asterisk.com` (no local part) from passing.
- `getClaims()` used everywhere instead of `getSession()` — correct per Next.js 16 + `@supabase/ssr` guidance.
- `signOut()` called (global scope default) before domain-rejection redirect — refresh token revoked server-side.
- `LoginErrorBanner` renders unknown codes via JSX, not `innerHTML` — XSS-safe.
- `type="button"` on the login button — prevents accidental form submission in future.

---

## Recommended Actions (Priority Order)

1. **[C1]** Wrap `getClaims()` call in route.ts with try/catch — signOut and redirect to `/login?error=oauth` on exception.
2. **[H1]** Add `isAllowedEmail(email)` check to proxy-session.ts `isAuthed` gate — defense in depth.
3. **[H2]** Write tests for `oauth-actions.ts` — `redirectTo` URL construction, error throwing.
4. **[H3]** Tighten `isAuthed` check to require `data?.claims?.sub` rather than any truthy claims object. Update + fix the test that documents the wrong behavior.
5. **[M1 + L2]** Allowlist known error codes in callback route and login page. Unknown codes map to `"oauth"`.
6. **[M2]** Add startup env var validation — throw at module load if missing.
7. **[M3]** Handle `/login/` trailing-slash case in proxy or via `next.config` `trailingSlash: false`.

---

## Unresolved Questions

1. Is `getClaims()` in `@supabase/auth-js` 2.107.0 guaranteed to never throw (always returns `{ data, error }`)? If yes, C1 is low-priority. The library source is blocked from review here.
2. Does Next.js 16 guarantee that `cookies()` writes from `next/headers` are NOT committed when a Route Handler throws? If yes, C1's risk is mitigated but still worth fixing for clarity.
3. Is `trailingSlash` normalization enabled in `next.config`? If yes, M3 is moot.
4. Is there a plan to add additional OAuth providers or service-account sessions? If yes, H1 becomes critical.
