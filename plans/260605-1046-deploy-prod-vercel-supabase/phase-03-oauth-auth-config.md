# Phase 03 — Google OAuth + Auth URL config (production)

**Priority:** High · **Status:** pending · **Depends on:** 02 (needs the live `*.vercel.app` URL)

Wire Google sign-in for prod. **All credentials live in Supabase, not Vercel.** App code is
env-agnostic (`docs/google-oauth-setup.md`) — only config changes per env.

## The two callbacks (don't confuse them)
| Callback | Where registered | Value |
|----------|------------------|-------|
| `https://<ref>.supabase.co/auth/v1/callback` | **Google Cloud Console** authorized redirect URI | fixed (same for prod + all previews) |
| `https://<app>.vercel.app/auth/callback` | **Supabase** redirect allow-list | per-env; wildcards OK for previews |

→ Because Google only ever redirects to the *fixed* Supabase callback, **one Google OAuth client
covers prod + every preview.** No second client needed.

## Steps
1. **Google Cloud Console** (Credentials → the existing Web OAuth client used locally):
   - Add Authorized redirect URI: `https://<ref>.supabase.co/auth/v1/callback` (the prod ref).
   - Keep the local URI too. Copy Client ID + Secret (same client as local).
2. **Supabase Dashboard → Authentication → Providers → Google:** enable, paste Client ID + Secret.
3. **Supabase Dashboard → Authentication → URL Configuration:**
   - **Site URL** = `https://<app>.vercel.app` (the prod URL from Phase 02).
   - **Redirect URLs** allow-list — add:
     - `https://<app>.vercel.app/**`            (prod)
     - `https://*-<org-slug>.vercel.app/**`      (Vercel previews — wildcard)
     - `http://localhost:3000/**`               (keep local dev working)
4. **No Vercel env change** — `GOOGLE_CLIENT_*` stay out of Vercel (provider is server-side in Supabase).

## How the flow resolves (sanity model)
`signInWithGoogle()` builds `redirectTo = window.location.origin + /auth/callback` → Supabase checks
it against the allow-list → Google → back to Supabase fixed callback → Supabase bounces to
`<origin>/auth/callback` → `app/auth/callback/route.ts` exchanges code, enforces `@sun-asterisk.com`.

## Todo
- [ ] Add prod Supabase callback to Google Cloud client redirect URIs
- [ ] Enable Google provider in Supabase dashboard (Client ID + Secret)
- [ ] Set Site URL = prod vercel.app URL
- [ ] Add allow-list: prod, preview wildcard, localhost
- [ ] Confirm NO `GOOGLE_CLIENT_*` in Vercel env

## Success criteria
- Clicking "Sign in with Google" on prod completes the round-trip and lands an authenticated session.
- (Full allow/deny behavior verified in Phase 05.)

## Security
- Domain restriction is server-side (`app/auth/callback/route.ts` + re-checked in `proxy-session.ts`);
  Google `hd` is a UX hint only — do not rely on it.
- `getClaims()` (JWT-verified) used, never `getSession()`. Keep it.

## Risks
- **Forgot preview wildcard** → preview deploys fail OAuth with `redirect_to not allowed`. Add it.
- **Site URL still localhost** → prod emails/redirect default wrong. Must be the vercel.app URL.
- **Org slug guessed wrong** → preview wildcard silently never matches. Read it from a real preview URL.
