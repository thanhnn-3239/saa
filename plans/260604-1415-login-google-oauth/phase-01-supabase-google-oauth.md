# Phase 01 — Supabase Google OAuth + callback + domain guard (Track B)

## Context Links
- [plan.md](plan.md) · [clarifications.md](clarifications.md)
- Foundation: `lib/supabase/{client,server}.ts`, `proxy.ts`
- MoMorph: Login `https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz`

## Overview
- **Priority:** Critical (blocks integration)
- **Status:** completed
- Configure Supabase Google provider, add OAuth callback route handler, enforce
  `@sun-asterisk.com` domain restriction, expose an `initiateGoogleLogin` action.

## Key Insights
- Supabase OAuth = full-page redirect, NOT popup (TC `60bc5bbb` says "new tab or popup" — design intent; Supabase web flow uses redirect, which satisfies the objective).
- Google `hd` query param is only a UX hint — real domain enforcement MUST happen server-side in the callback after `exchangeCodeForSession`.
- Use existing browser client (`lib/supabase/client.ts`) for `signInWithOAuth`; existing server client (`lib/supabase/server.ts`) for the callback exchange.

## Requirements
- Functional: Start Google OAuth from client; on return, exchange code → session; if email domain ≠ `sun-asterisk.com`, sign out + redirect `/login?error=domain`; else redirect to `next` (default `/`).
- Non-functional: No secrets in client bundle; reuse existing clients (DRY); files < 200 lines.

## Architecture
```
[Login button click] --(browser client)--> supabase.auth.signInWithOAuth({
    provider:'google',
    options:{ redirectTo: `${origin}/auth/callback?next=/`,
              queryParams:{ hd:'sun-asterisk.com', prompt:'select_account' } } })
        --> Google consent --> GET /auth/callback?code=...&next=/
            route handler: exchangeCodeForSession(code)
              -> claims.email endsWith '@sun-asterisk.com' ? redirect(next) : signOut()+redirect('/login?error=domain')
              -> on exchange error: redirect('/login?error=oauth')
```

## Related Code Files
- **Create:** `app/auth/callback/route.ts` (GET route handler — code exchange + domain guard)
- **Create:** `lib/auth/allowed-domain.ts` (small helper: `isAllowedEmail(email)`, constant `ALLOWED_DOMAIN='sun-asterisk.com'`)
- **Create:** `lib/auth/oauth-actions.ts` (client-callable `signInWithGoogle()` wrapping browser client; reads `window.location.origin`)
- **Modify:** `.env.example` — document Google provider env (no secrets committed)
- **Modify:** `supabase/config.toml` — enable `[auth.external.google]` for local dev (env-driven `client_id`/`secret`)
- **Read for context:** `lib/supabase/client.ts`, `lib/supabase/server.ts`

## Implementation Steps
1. Add `lib/auth/allowed-domain.ts`: export `ALLOWED_DOMAIN` and `isAllowedEmail(email?: string): boolean`.
2. Add `app/auth/callback/route.ts`:
   - Read `code` + `next` from `request.nextUrl.searchParams`.
   - `const supabase = await createClient()` (server); `const { error } = await supabase.auth.exchangeCodeForSession(code)`.
   - On error → `redirect('/login?error=oauth')`.
   - `const { data } = await supabase.auth.getClaims()`; if `!isAllowedEmail(data?.claims?.email)` → `await supabase.auth.signOut()` then `redirect('/login?error=domain')`.
   - Else `redirect(next ?? '/')`.
3. Add `lib/auth/oauth-actions.ts` (`'use client'`): `signInWithGoogle()` → `createBrowserClient` (`client.ts`) `.auth.signInWithOAuth({...})` with `redirectTo` to `/auth/callback`, `queryParams.hd`, `prompt:'select_account'`. Returns/throws so caller can show loading/error.
4. Configure Supabase Google provider:
   - Cloud + local: set `SUPABASE_AUTH_GOOGLE_CLIENT_ID`/`SECRET`; add Authorized redirect URI `…/auth/v1/callback` (Supabase) and site `/auth/callback`.
   - `supabase/config.toml` `[auth.external.google] enabled = true`, `client_id = "env(...)"`, `secret = "env(...)"`, `redirect_uri` for local.
   - Document all in `.env.example`.
5. Run `pnpm run build` (or `pnpm exec tsc --noEmit`) — fix type errors.

## Todo List
- [x] `lib/auth/allowed-domain.ts`
- [x] `app/auth/callback/route.ts`
- [x] `lib/auth/oauth-actions.ts`
- [x] Supabase Google provider config (config.toml + cloud) + `.env.example`
- [x] Compile check passes

## Success Criteria
- Visiting `/auth/callback?code=...` exchanges session, redirects `/` for allowed domain, `/login?error=domain` otherwise.
- No client_id/secret in committed files; only `.env.example` placeholders.

## Risk Assessment
- Google OAuth consent screen / redirect URI mismatch → document exact URIs; test on Vercel preview URL too.
- `hd` not enforced by Google for personal accounts → server-side guard is the real gate (covered in step 2).

## Security Considerations
- Domain allow-list enforced server-side after JWT verification (`getClaims`).
- `signOut()` on rejection prevents a lingering session for disallowed users.
- Secrets via env only.

## Next Steps
- Phase 02 (proxy enforcement) depends on this. Phase 04 wires the button to `signInWithGoogle()`.
