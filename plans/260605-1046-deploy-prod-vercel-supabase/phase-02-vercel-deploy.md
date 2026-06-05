# Phase 02 — Vercel project + first deploy

**Priority:** High · **Status:** pending · **Depends on:** 01

Deploy Next.js 16 to Vercel. Zero config — no `vercel.json`/`vercel.ts`. After this phase we KNOW
the production `*.vercel.app` URL + org slug (needed by Phase 03).

## Pre-flight
- `npm i -g vercel` (CLI not installed locally).
- `pnpm build` locally → confirm clean Turbopack production build before pushing.

## Steps
1. **Link the repo to a Vercel project:**
   ```bash
   vercel login
   vercel link            # or import the Git repo in the Vercel dashboard
   ```
   Framework auto-detects **Next.js**; build `next build`; install auto-detects **pnpm** (lockfile +
   `packageManager`). Node 24 LTS auto-selected (compatible with `engines.node >=20.9.0`).
2. **Set env vars** for **Production** AND **Preview** (dashboard → Settings → Environment Variables,
   or `vercel env add`):
   ```
   NEXT_PUBLIC_SUPABASE_URL       = https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY  = sb_publishable_…
   ```
   **Do NOT set** `SUPABASE_SECRET_KEY` / `GOOGLE_CLIENT_*` here — unused / live in Supabase dashboard.
3. **Deploy:**
   ```bash
   vercel            # preview deploy (smoke test)
   vercel --prod     # production deploy
   ```
   Or connect the Git branch so push → auto-deploy (this is the chosen CI/CD model).
4. **Record outputs (Phase 03 inputs):**
   - Production URL: `https://<app>.vercel.app`
   - Org/team slug (read from a preview URL `https://<branch>-<slug>.vercel.app`).

## Expected non-issues
- Console warning **"middleware missing"** despite correct `proxy.ts` — cosmetic Vercel bug; proxy runs.
- Login will NOT work yet (OAuth not configured until Phase 03) — expected.

## Todo
- [ ] `npm i -g vercel`; `pnpm build` passes locally
- [ ] `vercel link`
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Production + Preview
- [ ] `vercel` (preview) → `vercel --prod`
- [ ] Record prod URL + org slug

## Success criteria
- Prod URL serves the app (home + `/login` render). Static/SSR pages load against Cloud env.

## Risks
- **Turbopack/webpack dep conflict** → build hard-fails. Escape hatch: `NEXT_DISABLE_TURBOPACK=1`
  scoped to Production env. Catch early with local `pnpm build`.
- **Env var name drift** → app reads `undefined`. Names are fixed in `lib/supabase/*` — match exactly.
- **`NEXT_PUBLIC_*` are build-time inlined** → changing a value requires a redeploy, not just a restart.
