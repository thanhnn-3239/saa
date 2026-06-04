# Google OAuth Setup (Login)

How to configure Google sign-in for the Login screen, on **local** and **production**.

> **The app code is environment-agnostic.** `signInWithGoogle()` builds `redirectTo` from
> `window.location.origin`, and `/auth/callback` uses the request origin — so the same code
> works on localhost, Vercel preview, and production. **Only configuration changes per env.**

## Key concept — two different callbacks

There are **two** callback URLs; don't confuse them:

| Callback | Owner | Used for |
|----------|-------|----------|
| `<SUPABASE_URL>/auth/v1/callback` | **Supabase** | The URL you register in **Google Cloud** as an Authorized redirect URI. Google returns here first. |
| `<APP_URL>/auth/callback` | **Our Next.js app** ([app/auth/callback/route.ts](../app/auth/callback/route.ts)) | Where Supabase bounces the user after exchanging the Google code. Must be in Supabase's **redirect allow-list**. |

## 1. Google Cloud Console (once)

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application**.
2. (First time) configure the **OAuth consent screen**: app name, support email, scopes `openid email profile`. For internal-only, set User Type = Internal if your org is a Google Workspace.
3. Add **Authorized redirect URIs** — the *Supabase* callback(s):
   - Local: `http://127.0.0.1:54321/auth/v1/callback`
   - Prod: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client secret**.

## 2. Local (Supabase CLI)

Provider is wired in [supabase/config.toml](../supabase/config.toml) `[auth.external.google]` via env substitution.

1. Put credentials in `.env.local`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
2. Restart the stack so the auth container picks them up:
   ```
   pnpm db:stop && pnpm db:start
   ```
3. `config.toml` already sets `site_url = http://localhost:3000` and
   `additional_redirect_urls` (includes the app origin). The app's `/auth/callback`
   is reached via the same origin — no extra entry needed.
4. Test at http://localhost:3000/login.

> Until `GOOGLE_CLIENT_ID`/`SECRET` are set, the provider is disabled and the button
> returns to `/login?error=oauth` — expected, not a bug.

## 3. Production (Supabase Cloud + Vercel)

**Credentials live in Supabase, NOT in Vercel env.**

1. **Supabase Dashboard → Authentication → Providers → Google**: enable, paste Client ID + Secret.
2. **Supabase Dashboard → Authentication → URL Configuration**:
   - **Site URL** = production app URL (e.g. `https://your-app.com`).
   - **Redirect URLs** allow-list — add the app callback(s):
     - `https://your-app.com/auth/callback`
     - Vercel previews: `https://*-<your-org>.vercel.app/auth/callback`
3. **Vercel → Project → Environment Variables** (app-side only):
   - `NEXT_PUBLIC_SUPABASE_URL` = Supabase Cloud project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase Cloud anon key
   - (Do **not** set `GOOGLE_CLIENT_ID/SECRET` here — they belong in the Supabase Dashboard.)

## Domain restriction

Sign-in is restricted to `@sun-asterisk.com`, enforced **server-side** in
[app/auth/callback/route.ts](../app/auth/callback/route.ts) (via [isAllowedEmail](../lib/auth/allowed-domain.ts))
and re-checked in [proxy-session.ts](../lib/supabase/proxy-session.ts). The Google `hd` param
is only a UX hint and is not trusted. Non-allowed accounts are signed out and sent to
`/login?error=domain`. This works the same on every environment — no per-env config.

## Quick checklist

- [ ] Google OAuth client created; redirect URI = the **Supabase** `/auth/v1/callback` (local and/or prod ref)
- [ ] Local: `GOOGLE_CLIENT_ID/SECRET` in `.env.local` → `pnpm db:stop && pnpm db:start`
- [ ] Prod: credentials in **Supabase Dashboard** (not Vercel)
- [ ] Prod: Site URL + Redirect allow-list include `<app>/auth/callback` (+ preview wildcard)
- [ ] Prod: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel env
