# Phase 02 — proxy.ts auth enforcement (Track B)

## Context Links
- [plan.md](plan.md) · [clarifications.md](clarifications.md) · depends on [phase-01](phase-01-supabase-google-oauth.md)
- Files: `proxy.ts`, `lib/supabase/proxy-session.ts`

## Overview
- **Priority:** Critical
- **Status:** completed
- Extend the existing session-refresh proxy to enforce access control:
  authenticated users skip `/login`; unauthenticated users on protected routes go to `/login`.

## Key Insights
- `updateSession()` already creates the server client and calls `getClaims()`. We extend it to branch on the result **without** breaking the cookie-sync contract (must still return the `response` it builds).
- `getClaims()` returns verified claims or null — use presence of `data.claims` as the auth signal.
- Keep the redirect decision inside `proxy-session.ts` (single source of session logic); `proxy.ts` stays a thin wrapper.

## Requirements
- Functional:
  - Authenticated + path `/login` or `/auth/*` (except `/auth/callback`) → redirect `/`.
  - Unauthenticated + protected path (everything except `/login`, `/auth/callback`, static) → redirect `/login`.
  - `/auth/callback` always allowed (it establishes the session).
- Non-functional: preserve existing cookie sync; no `getSession()`; file < 200 lines.

## Architecture
```
proxy.ts (matcher unchanged) -> updateSession(request)
  build response + getClaims()   // existing
  const isAuthed = !!claims
  const path = request.nextUrl.pathname
  const isPublic = path === '/login' || path === '/auth/callback'
  if (isAuthed && path === '/login')      -> redirect '/'   (copy cookies onto redirect)
  if (!isAuthed && !isPublic)             -> redirect '/login'
  else return response
```

## Related Code Files
- **Modify:** `lib/supabase/proxy-session.ts` — add auth-based redirect after `getClaims()`; capture claims; build `NextResponse.redirect` that carries the refreshed cookies.
- **Read for context:** `proxy.ts` (matcher already excludes static/image assets — keep as-is).

## Implementation Steps
1. In `updateSession`, change `await supabase.auth.getClaims()` to capture `const { data } = await supabase.auth.getClaims()`.
2. Compute `isAuthed = !!data?.claims`, `path = request.nextUrl.pathname`.
3. Define `PUBLIC_PATHS = new Set(['/login','/auth/callback'])` (callback must stay reachable).
4. Helper to redirect while preserving cookies: clone request URL, set pathname, `const redirect = NextResponse.redirect(url)`, copy `response.cookies.getAll()` onto it.
5. Branch: authed && path==='/login' → redirect `/`; !authed && !PUBLIC_PATHS.has(path) → redirect `/login`; otherwise `return response`.
6. `pnpm run build` / `tsc --noEmit` — fix errors. Manually verify: unauth `/` → `/login`; (after phase 04) authed `/login` → `/`.

## Todo List
- [x] Capture claims + compute `isAuthed`
- [x] PUBLIC_PATHS allow-list incl. `/auth/callback`
- [x] Cookie-preserving redirect helper
- [x] Both redirect branches wired
- [x] Compile check passes

## Success Criteria
- TC `f62b0c97` / `45278c06`: authenticated user redirected away from `/login`; unauthenticated sees `/login`; logout returns to `/login`.
- Existing session refresh still works (no auth regressions on `/`).

## Risk Assessment
- Redirect loop if `/auth/callback` not whitelisted, or if cookies not copied onto the redirect (session lost) → both explicitly handled (steps 3–4).
- Future protected routes inherit this automatically — note this in docs to avoid surprise.

## Security Considerations
- Enforcement is server-side in Node-runtime proxy; cannot be bypassed by client navigation.
- Auth signal from verified `getClaims()`, not `getSession()`.

## Next Steps
- Phase 04 integration verifies end-to-end with the real button + callback.
