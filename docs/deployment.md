# Production Deployment — SAA Kudos

How the app ships to production and how to deploy a feature branch for testing.

**Model:** **Vercel Git Integration** deploys the Next.js front end; a **GitHub Action** pushes DB
migrations to **Supabase Cloud**. The two halves are independent — Vercel never touches the database.

```
push/merge → main ─┬─> Vercel Git Integration → build + deploy PRODUCTION
                   └─> GitHub Action (if supabase/migrations/** changed) → supabase db push

push feature branch ──> Vercel Git Integration → PREVIEW deploy (+ `vercel` CLI on demand)
```

> OAuth-specific config (Google Cloud + Supabase Auth dashboard) lives in
> [google-oauth-setup.md](google-oauth-setup.md) — not duplicated here.

---

## Environment variable matrix

Where every variable lives. **Only `NEXT_PUBLIC_*` reaches the browser bundle** — everything else is
server-/CI-only and must never get a `NEXT_PUBLIC_` prefix.

| Variable | Vercel Prod | Vercel Preview | Supabase dashboard | GitHub secret | Local `.env.local` | In client bundle? |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | — | — | ✅ | ✅ (safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`sb_publishable_…`) | ✅ | ✅ | — | — | ✅ | ✅ (safe) |
| `NEXT_PUBLIC_EVENT_DATETIME` | ✅ | ✅ | — | — | ✅ | ✅ (safe) |
| `SUPABASE_SECRET_KEY` | ❌ never¹ | ❌ never¹ | — | — | ✅ dev-only¹ | ❌ never |
| `GOOGLE_CLIENT_ID` | ❌ | ❌ | ✅ Providers→Google | — | ✅ (local CLI) | ❌ |
| `GOOGLE_CLIENT_SECRET` | ❌ | ❌ | ✅ Providers→Google | — | ✅ (local CLI) | ❌ |
| `SUPABASE_ACCESS_TOKEN` | — | — | — | ✅ | — | — |
| `SUPABASE_PROJECT_REF` | — | — | — | ✅ | — | — |
| `SUPABASE_DB_PASSWORD` | — | — | — | ✅ | — | — |

¹ `SUPABASE_SECRET_KEY` (the `service_role`/secret key) is used by **one code path only**: the
service-role client (`lib/supabase/admin.ts`) behind the **dev-only auto-login backdoor**
(`app/auto-login/route.ts`, gated by `AUTO_LOGIN_TOKEN`). The normal SSR auth flow needs only the
URL + publishable key. **Never set `SUPABASE_SECRET_KEY` (or `AUTO_LOGIN_TOKEN`) in Vercel** — the
backdoor must stay disabled in production. Set the secret in local `.env.local` only when you also
enable `AUTO_LOGIN_TOKEN` for E2E/manual testing.

**Key naming (2026):** new Supabase projects expose `sb_publishable_…` / `sb_secret_…`. Use the
**publishable** key as `NEXT_PUBLIC_SUPABASE_ANON_KEY`. (Legacy `anon` JWT only exists on pre-Jun-2025 projects.)

### Typed env validation (fail-fast at build)

`next build` validates env vars via `lib/env.ts` (imported by `next.config.ts`). This **changes the
failure mode on Vercel**: a missing/invalid required var now **fails the build** instead of deploying
successfully and breaking at runtime.

- **Required (build fails without them):** `NEXT_PUBLIC_SUPABASE_URL` (must be a valid URL) and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The current Vercel project already sets both (see matrix) — no
  action needed; but a **new project/environment must set them before the first build**.
- **Empty string = missing** (`emptyStringAsUndefined`): setting a var to `""` in Vercel also fails
  the build.
- **Optional:** `NEXT_PUBLIC_EVENT_DATETIME` (countdown degrades gracefully when absent) — but if
  set, it must parse as ISO-8601 or the build fails. `SUPABASE_SECRET_KEY` / `AUTO_LOGIN_TOKEN` are
  optional by design so production builds **without** them succeed (and keep the backdoor disabled).
- **Escape hatch:** `SKIP_ENV_VALIDATION=1` bypasses validation (intended for Docker image builds).
  Don't set it on Vercel — it defeats the fail-fast protection.
- **lefthook is deploy-neutral:** its `postinstall` hook-install is guarded by `!process.env.CI`, and
  Vercel sets `CI=1`, so builds skip it automatically.

---

## 1. Supabase Cloud (backend)

1. Dashboard → **New project**: Postgres **17** (match local), region **Southeast Asia (Singapore)**
   (`ap-southeast-1`, closest to VN — ⚠️ cannot change later). **Save the DB password** (shown once).
2. Settings → **API Keys**: copy the project URL `https://<ref>.supabase.co` and the `sb_publishable_…` key.
3. Link + push schema from your machine:
   ```bash
   supabase login
   supabase link --project-ref <ref>
   supabase db push          # applies migrations only — seeds are NOT pushed
   ```
4. Configure Google OAuth provider + Auth URL config → see [google-oauth-setup.md](google-oauth-setup.md) §3.

> Dev seeds (`supabase/seeds/dev`) never reach prod. If `supabase/seeds/common` holds data prod needs
> at runtime, re-author it as a migration instead of relying on a seed.

---

## 2. Vercel (front end — Git Integration)

1. vercel.com → **Add New Project → Import** the GitHub repo. Framework auto-detects **Next.js**;
   pnpm auto-detected from `pnpm-lock.yaml` + `packageManager`. Node 24 LTS auto-selected. **No `vercel.json` needed.**
2. **Production Branch = `main`.** Pushes/merges to `main` → auto production deploy. Other branches → preview deploys.
3. Settings → **Environment Variables**, set for **Production AND Preview** (see matrix):
   ```
   NEXT_PUBLIC_SUPABASE_URL       = https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY  = sb_publishable_…
   NEXT_PUBLIC_EVENT_DATETIME     = 2025-12-26T18:30:00+07:00   # ISO-8601 with TZ offset; drives homepage countdown
   ```
   `NEXT_PUBLIC_*` are inlined at build time → changing a value requires a redeploy.

   > If `NEXT_PUBLIC_EVENT_DATETIME` is missing or unparseable, the homepage countdown degrades gracefully (shows 00s). Set it before the first production deploy.

> A harmless `"middleware missing"` warning may appear in Vercel logs despite `proxy.ts` being correct — cosmetic, ignore.

---

## 3. Deploy a feature branch for testing (CLI)

Two ways to get a preview URL:

- **Automatic:** push the branch — Vercel Git Integration builds a preview and comments the URL on the PR.
- **On demand (CLI):**
  ```bash
  npm i -g vercel      # one-time (CLI not bundled)
  vercel login
  vercel link          # one-time, link this dir to the project
  vercel               # deploy a PREVIEW of the current state → prints a URL
  vercel --prod        # (rarely from CLI) deploy straight to production
  ```

> Previews use the **same** env vars as Production (both point at the one Supabase Cloud project), so
> preview deploys read/write the prod DB. Acceptable for now; add a separate staging Supabase project
> later if isolation is needed.

---

## 4. CI — Supabase migrations on merge to main

Workflow: [`.github/workflows/supabase-migrations.yml`](../.github/workflows/supabase-migrations.yml).
Runs `supabase db push` only when `supabase/migrations/**` changes on `main`.

GitHub → Settings → **Secrets and variables → Actions**, add:

| Secret | Source |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase → Account → Access Tokens (dedicated CI token) |
| `SUPABASE_PROJECT_REF` | the project ref from step 1 |
| `SUPABASE_DB_PASSWORD` | the DB password saved in step 1 |

> Breaking schema changes can race the front-end deploy. For column renames/drops use expand/contract
> (add new → deploy app → remove old), not a one-shot migration.

---

## 5. Verification checklist (after first deploy)

- [ ] `https://<app>.vercel.app` unauthenticated → redirects to `/login`.
- [ ] Login with `@sun-asterisk.com` account → redirected to `/` (homepage with countdown).
- [ ] Countdown on homepage ticks (confirms `NEXT_PUBLIC_EVENT_DATETIME` is set).
- [ ] `/`, `/he-thong-giai`, `/sun-kudos`, `/tieu-chuan-chung`, `/profile` all redirect unauthenticated visitors to `/login`. (Note: `/awards-information` now 308-redirects to `/he-thong-giai`.)
- [ ] Google login: `@sun-asterisk.com` → in; other domain → `/login?error=domain` (signed out).
- [ ] i18n: vi ↔ en switch persists via `NEXT_LOCALE` cookie.
- [ ] Authenticated read returns rows under RLS.
- [ ] No secret in client bundle: `grep -rn "sb_secret\|service_role" .next/static/` → empty.
- [ ] PR preview URL completes OAuth (proves Supabase wildcard allow-list).

---

## Custom domain (deferred)

Currently on `*.vercel.app`. When adding a custom domain: add it in Vercel, then update Supabase Auth
**Site URL** + redirect allow-list and the Google Cloud authorized redirect URI accordingly.

---

**Related:** blueprint `plans/260605-1046-deploy-prod-vercel-supabase/` · OAuth detail
[google-oauth-setup.md](google-oauth-setup.md) · stack rationale [tech-stack-decision.md](tech-stack-decision.md).
