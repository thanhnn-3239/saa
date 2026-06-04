# Phase 05 — Vercel + Supabase Cloud Deploy

**Priority:** High · **Status:** pending · **Depends on:** 03

Wire production: a managed **Supabase Cloud** project as the backend, the local migrations pushed to
it, and the Next.js app deployed to **Vercel** with environment variables set per environment.

## Key Insights (verified)
- Standard Next.js App Router on Vercel needs **no `vercel.json` / `vercel.ts`** — zero config. Don't add one (YAGNI).
- A Vercel+Supabase integration exists (Marketplace) that auto-injects env vars and syncs preview
  redirect URLs. Optional — manual env entry works and is more transparent for a learning setup.
- Migrations are pushed from **CI / the CLI**, never from the Vercel build. Vercel only builds the front end.
- Upgrade Vercel CLI first: `pnpm add -g vercel@latest` (session reported 51 → 54).

## Related Code Files
**Create:** `.github/workflows/supabase-migrations.yml` (optional but recommended)
**Modify:** `README.md` (deploy runbook)
**No app code changes** — env-driven.

## Implementation Steps
1. **Create the Supabase Cloud project** (dashboard) → note the **project ref**, the **anon/publishable
   key**, **service/secret key**, and the project URL `https://<ref>.supabase.co`.
2. **Link & push schema:**
   ```bash
   supabase link --project-ref <ref>
   supabase db push          # applies local migrations to the cloud DB
   ```
   Do NOT push dev seeds to production (seeds are dev-only).
3. **Vercel project setup:**
   - `vercel link` (or import the repo in the Vercel dashboard).
   - Framework preset auto-detects Next.js. Build command `next build`, install `pnpm install`
     (Vercel auto-detects pnpm from `pnpm-lock.yaml` + `packageManager`).
4. **Vercel env vars** (Project → Settings → Environment Variables), set for **Production** and **Preview**:
   ```
   NEXT_PUBLIC_SUPABASE_URL      = https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = <cloud anon/publishable key>
   SUPABASE_SECRET_KEY           = <cloud service/secret key>   # not exposed to client
   ```
   Use `vercel env add` or the dashboard. Keep Development env pointing at local values if desired.
5. **Deploy:** `vercel` (preview) then `vercel --prod` (production), or push to the connected branch.
6. **CI migrations (recommended)** — `.github/workflows/supabase-migrations.yml`:
   ```yaml
   name: Supabase migrations
   on:
     push:
       branches: [main]
       paths: ["supabase/migrations/**"]
   jobs:
     push:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: supabase/setup-cli@v1
           with: { version: latest }
         - run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
           env: { SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }} }
         - run: supabase db push
           env: { SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }} }
   ```
   Add `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD` to GitHub repo secrets.
7. **Verify:** open the Vercel production URL → `/notes` renders rows from the **cloud** DB (after a
   prod-safe insert, since dev seeds aren't pushed). Confirm no secret key leaked to the client bundle.

## Todo
- [ ] Upgrade Vercel CLI
- [ ] Create Supabase Cloud project; capture ref + keys
- [ ] `supabase link` + `supabase db push`
- [ ] `vercel link`, set Production + Preview env vars
- [ ] Deploy preview + prod
- [ ] (rec.) GitHub Action for migration push + repo secrets
- [ ] Verify prod `/notes` against cloud DB; confirm no secret in client bundle

## Success Criteria
- Production URL live, reading from Supabase Cloud.
- Schema in cloud matches local migrations; preview deployments work.

## Security Considerations
- `SUPABASE_SECRET_KEY` set WITHOUT `NEXT_PUBLIC_` — verify it's absent from the client bundle.
- RLS protects all tables in cloud too. Review the demo public-read policy before real data.
- GitHub secrets for CI; never commit tokens.

## Risks
- **Env name mismatch:** if the Vercel Supabase integration injects `ANON_KEY` but code reads a
  different name, deploys read `undefined` → align names (Phase 01 standardized on `ANON_KEY`).
- **db major_version:** local is v17; ensure the cloud project is also Postgres 17 (or align `config.toml`).
