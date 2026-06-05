# SAA Kudos

Internal employee recognition app for Sun Asterisk. Users send kudos, earn badges via Secret Boxes, and view a live leaderboard and profiles.

**Stack:** Next.js 16 (App Router) · Supabase (DB + Auth + Storage + Realtime) · TailwindCSS v4 · Vercel · pnpm

---

## Prerequisites

- Node 24 + pnpm
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase` or equivalent)
- Docker (for local Supabase)

---

## Local dev setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start Supabase locally

```bash
pnpm db:start        # starts local Supabase stack (Docker required)
pnpm db:status       # prints local URL + anon key
```

### 3. Configure environment

Copy `.env.example` to `.env.local` and fill in the values printed by `pnpm db:status`:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `pnpm db:status` → API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `pnpm db:status` → anon key |
| `SUPABASE_SECRET_KEY` | _Optional — not used by current code._ Leave blank unless adding a server-side admin op. |
| `GOOGLE_CLIENT_ID` | Google Cloud Console (see below) |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console (see below) |

### 4. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Create an **OAuth 2.0 Client ID** (type: Web application).
3. Add an **Authorized redirect URI**: `<NEXT_PUBLIC_SUPABASE_URL>/auth/v1/callback`
   - Local example: `http://127.0.0.1:54321/auth/v1/callback`
4. Copy the Client ID and Secret into `.env.local`.

The Supabase CLI reads `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` from your environment and substitutes them into `supabase/config.toml` for local dev. No manual `config.toml` edits needed.

> Note: the `hd` (hosted domain) hint restricts the Google picker to `sun-asterisk.com` accounts, but the actual domain enforcement is server-side in `app/auth/callback/route.ts`.

### 5. Apply database migrations

```bash
pnpm db:reset        # applies all migrations + seeds
```

### 6. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login`.

---

## Running tests

```bash
pnpm test            # Vitest + React Testing Library (140 tests)
```

---

## Key architecture notes

- **Auth:** Supabase Auth Google provider (PKCE flow). Only `@sun-asterisk.com` emails are allowed. Enforced server-side in `app/auth/callback/route.ts` after `exchangeCodeForSession`.
- **Access control:** `proxy.ts` (Next.js 16 proxy, replaces `middleware.ts`) calls `lib/supabase/proxy-session.ts` on every request — unauthenticated users are sent to `/login`; authenticated users are redirected away from `/login`.
- **Database:** PostgreSQL via Supabase. RLS on every table. Correctness-critical operations (random badge rewards, atomic kudo writes) run in `SECURITY DEFINER` Postgres functions.
- **Internationalization:** next-intl 4.13, cookie-based (`NEXT_LOCALE`), no URL routing. Default locale `vi`, also `en`. See `docs/i18n.md`.
- See `docs/` for schema design and tech stack decisions.

---

## Production deployment

Vercel Git Integration deploys the front end; a GitHub Action pushes DB migrations to Supabase Cloud.
**Full runbook + env-var matrix: [docs/deployment.md](docs/deployment.md).**

In short:
- **Vercel** hosts Next.js (auto-deploy on merge to `main`). Set **only** `NEXT_PUBLIC_SUPABASE_URL`
  and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the `sb_publishable_…` key) for Production + Preview.
  Do **not** put `SUPABASE_SECRET_KEY` or `GOOGLE_CLIENT_*` in Vercel.
- **Supabase Cloud** hosts the backend; the Google OAuth provider is configured in its dashboard
  (not `config.toml`). See [docs/google-oauth-setup.md](docs/google-oauth-setup.md).
- **Migrations** push via the `Supabase migrations` GitHub Action on merge to `main`, or manually with
  `supabase db push` after `supabase link`.
