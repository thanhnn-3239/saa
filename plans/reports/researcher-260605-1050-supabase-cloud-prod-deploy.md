# Supabase Cloud Prod Deploy — Research Report
Date: 2026-06-05 | Sources: 8 (official Supabase docs, GitHub supabase/setup-cli, Vercel community, GitHub discussions)

---

## 1. API Keys — Naming Change (June 2025)

### What changed
Supabase rolled out a new key system in June 2025:

| New key | Format | Replaces | Visibility |
|---|---|---|---|
| Publishable key | `sb_publishable_xxx` | `anon` JWT | Safe to expose (`NEXT_PUBLIC_`) |
| Secret key | `sb_secret_xxx` | `service_role` JWT | Server-only, never client bundle |

### Legacy keys on new projects
- **New projects created after the June 2025 rollout no longer have `anon`/`service_role` as primary keys.** Legacy keys live under **Settings → API Keys → Legacy API Keys** tab (still accessible but on deprecation path).
- Legacy JWTs remain valid through end of 2026. Projects restored from 1 Nov 2025 onward are not restored with legacy keys.
- **Safe assumption:** treat legacy keys as read-only backups; migrate to new formats now.

### What `@supabase/ssr` expects
- **Browser client** (`createBrowserClient`): pass `sb_publishable_xxx` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Legacy `anon` JWT still works if your project has one, but new projects need the publishable key here.
- **Server client** (`createServerClient`): same publishable key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The server client in `@supabase/ssr` reads cookies/session via the publishable key — no secret key needed for standard SSR auth (login, session refresh, logout, user fetching).
- **`SUPABASE_SECRET_KEY` / `sb_secret_xxx`**: only needed for admin operations — bypassing RLS, managing users programmatically (Admin API), server-side user creation/deletion. Not required for cookie-based auth flow.

### Dashboard path
- **Settings → API Keys** — "Publishable Key" section + "Secret Keys" section (create new or view existing)
- **Settings → API Keys → Legacy API Keys tab** — legacy `anon` + `service_role` JWTs if they exist

### Env var mapping for this project
```
NEXT_PUBLIC_SUPABASE_URL       = https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = sb_publishable_xxx   (or legacy anon JWT if old project)
SUPABASE_SECRET_KEY            = sb_secret_xxx         (only if admin API needed)
```

---

## 2. Project Creation — Region & Postgres Version

### Region
- Singapore = **Southeast Asia (Singapore)** in the dashboard UI. Confirmed available.
- AWS region code behind it: `ap-southeast-1`. Best choice for Vietnam users (lowest latency).
- Region is selected at creation time; **cannot be changed after** without creating a new project.

### Postgres version
- **New Supabase Cloud projects default to Postgres 17** as of 2025. Matches local `supabase/config.toml` default (Postgres 17 was the local CLI default aligned to cloud in the same period).
- Options visible at creation: PG 15, PG 17, OrioleDB-17. Select PG 17 explicitly to guarantee match.
- **No version-mismatch risk** with `supabase db push` as long as you pick PG 17 at creation. Mismatch only matters for PG-version-specific syntax/extensions.
- **Caveat:** extensions `timescaledb`, `plv8`, `plcoffee`, `plls` are removed in PG 17 images. This project has no known dependency on them.

---

## 3. Link + Migrate from CLI

### Exact commands
```bash
# 1. Authenticate (opens browser, stores token in ~/.supabase/access-token)
supabase login

# 2. Link local project to cloud (run once per machine/CI)
supabase link --project-ref <ref>
# prompts for DB password; ref = the string in dashboard URL: supabase.com/dashboard/project/<ref>

# 3. Push migrations only (no seeds)
supabase db push

# 4. Push migrations AND seeds (NEVER use for prod)
supabase db push --include-seed
```

### Does `db push` apply seeds?
**No.** `db push` applies ONLY files in `supabase/migrations/`. Seeds are NOT applied unless `--include-seed` flag is passed. Dev seeds in `supabase/seeds/dev/` are safe from accidental prod application as long as `--include-seed` is never used in the prod workflow.

### Gotchas on fresh cloud project
- First `db push` to a new project applies ALL migrations in order — ensure migrations are idempotent / can run on empty schema.
- **Never change the remote DB schema directly** (via SQL editor on cloud) after starting migrations — it bypasses migration history and causes `db push` to fail with a conflict.
- `supabase link` stores the linked project in `.supabase/` — commit `.supabase/config.toml` but NOT `.supabase/` state files if they contain secrets.
- If `supabase link` was run locally and `.supabase/` is gitignored (default), CI must re-link each run using env vars.

---

## 4. GitHub Actions for Migrations

### Recommended workflow (current best practice, 2025/2026)

```yaml
name: Deploy Migrations

on:
  push:
    branches: [main]
    paths: ['supabase/migrations/**']

env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: supabase/setup-cli@v2        # latest: v2.1.1 (May 2026)
        with:
          version: latest
          github-token: ${{ github.token }}

      - run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}

      - run: supabase db push
```

### Required GitHub secrets
| Secret | Value | Where to get |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | Personal access token | supabase.com → Account → Access Tokens |
| `SUPABASE_DB_PASSWORD` | Project DB password | Set at project creation (or reset in Settings → Database) |
| `SUPABASE_PROJECT_REF` | Project ref string | Dashboard URL: `/dashboard/project/<ref>` |

### Action version
- **`supabase/setup-cli@v2`** — current stable. Latest release: v2.1.1 (May 21, 2026). Use `@v2` (semver-pinned) not `@latest` for stability.
- The action installs the Supabase CLI on the runner; the `version: latest` input fetches the newest CLI version (or pin to specific CLI version for reproducibility).

### Path filter
`paths: ['supabase/migrations/**']` — triggers only when migration files change, avoiding unnecessary runs on app code changes. Remove if you want migrations to always run on `main` push.

---

## 5. Google OAuth Config in Cloud Dashboard

### Dashboard path
**Authentication → Providers → Google** (dashboard URL: `/dashboard/project/<ref>/auth/providers?provider=Google`)

Required fields:
- **Client ID**: from Google Cloud Console OAuth 2.0 client
- **Client Secret**: from Google Cloud Console OAuth 2.0 client
- Check "Enabled"

### URL Configuration
Navigate to **Authentication → URL Configuration** (separate from Providers).

| Setting | Value for this project |
|---|---|
| **Site URL** | `https://<your-app>.vercel.app` (primary prod URL) — update to custom domain later |
| **Redirect URLs** (allow-list) | See below |

**Redirect URLs allow-list entries:**
```
https://<your-app>.vercel.app/**
https://*-<vercel-team-slug>.vercel.app/**   ← covers preview deployments
http://localhost:3000/**                      ← local dev
```

- `**` glob matches any path including subdirectories.
- For a `*.vercel.app` prod-first setup, `Site URL` = the fixed prod vercel.app URL; wildcard preview entry handles PR previews.
- **Wildcard limitation:** Supabase docs recommend using exact URLs for `Site URL`; wildcards are for the allow-list only.

### Google Cloud Console — Authorized Redirect URI
The URI Google must send the auth code to is always:
```
https://<ref>.supabase.co/auth/v1/callback
```
Find the exact value on the Supabase dashboard Google provider page (it's shown there). Add this to **Authorized redirect URIs** in your Google OAuth client.

Also add to **Authorized JavaScript origins** (CORS): `https://<your-app>.vercel.app`

### PKCE flow (already implemented)
With `@supabase/ssr`, PKCE is the default for `signInWithOAuth`. The server callback route calls `exchangeCodeForSession(code)`. No extra config needed for PKCE in the dashboard — it's handled client-side by the SDK.

---

## Summary of Action Items

1. **New project**: Singapore region, Postgres 17 explicitly selected.
2. **Env vars on Vercel**: set `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_xxx` (from Settings → API Keys). `SUPABASE_SECRET_KEY` only if admin API needed (not required for current auth-only flow).
3. **Link + push**: `supabase login` → `supabase link --project-ref <ref>` → `supabase db push` (no `--include-seed` in prod).
4. **GitHub Actions**: use `supabase/setup-cli@v2`, secrets: `SUPABASE_ACCESS_TOKEN` + `SUPABASE_DB_PASSWORD` + `SUPABASE_PROJECT_REF`.
5. **Google OAuth**: Dashboard → Auth → Providers → Google (enable, paste GCP creds). Auth → URL Configuration: Site URL = prod vercel.app URL, add wildcard preview URL + localhost to allow-list. GCP Console: authorized redirect URI = `https://<ref>.supabase.co/auth/v1/callback`.

---

## Unresolved Questions

1. **Publishable key on legacy projects:** The project `agentic-coding-live-demo` — if it was created before June 2025, it has legacy `anon` JWT. Confirm whether to migrate to `sb_publishable_xxx` now or keep legacy until end-2026 deprecation. Functionally identical, but the new key won't be an expiring JWT.
2. **`supabase link` in CI with existing `.supabase/` in repo:** If `.supabase/config.toml` is committed (which it should be), verify `supabase link` in CI doesn't conflict with the committed config. May need `--project-ref` only without interactive prompts; test in a dry-run first.
3. **Vercel team slug for wildcard preview URLs:** The exact pattern `https://*-<team-slug>.vercel.app/**` requires knowing the team/account slug used by Vercel for this project. Confirm from a Vercel preview deployment URL before adding to allow-list.
4. **DB password storage:** The DB password is set once at project creation and not visible again. Confirm it was saved securely (needed for `SUPABASE_DB_PASSWORD` secret). Can be reset in Settings → Database → Reset database password.

---

## Sources
- [Supabase API Keys docs](https://supabase.com/docs/guides/api/api-keys)
- [Upcoming changes to Supabase API Keys (GitHub Discussion #29260)](https://github.com/orgs/supabase/discussions/29260)
- [Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase Database Migrations docs](https://supabase.com/docs/guides/deployment/database-migrations)
- [supabase/setup-cli GitHub (v2.1.1)](https://github.com/supabase/setup-cli)
- [Login with Google — Supabase Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Redirect URLs — Supabase Docs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase Available Regions](https://supabase.com/docs/guides/platform/regions)
- [Postgres 17 upgrade notes](https://supabase.com/docs/guides/self-hosting/postgres-upgrade-17)

---

**Status:** DONE
**Summary:** All 5 questions answered from official Supabase docs + GitHub. Key findings: new `sb_publishable_xxx` key replaces `anon` for `NEXT_PUBLIC_SUPABASE_ANON_KEY` on new projects; `supabase db push` never applies seeds without `--include-seed`; GitHub Actions uses `supabase/setup-cli@v2` with 3 secrets; Google OAuth callback URI is always `https://<ref>.supabase.co/auth/v1/callback`; Singapore (ap-southeast-1) + PG17 confirmed available.
