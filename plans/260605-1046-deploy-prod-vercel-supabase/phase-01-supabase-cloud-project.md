# Phase 01 — Supabase Cloud project + schema

**Priority:** High · **Status:** pending · **Depends on:** —

Stand up the managed backend: create the Cloud project, link the local repo, push the 3 migrations.
No app code changes — env-driven.

## Context
- Local: Postgres **17**, project_id `agentic-coding-live-demo`.
- Migrations (apply in order, already authored):
  - `supabase/migrations/20260604070000_schema.sql`
  - `supabase/migrations/20260604070100_rls_policies.sql`
  - `supabase/migrations/20260604070200_functions_triggers_views.sql`
- Seeds: `supabase/seeds/{common,dev}` — **not** pushed by `db push`.

## Steps
1. **Create project** (dashboard → New project):
   - Postgres version **17** (select explicitly — must match local v17).
   - Region **Southeast Asia (Singapore)** = `ap-southeast-1`. ⚠️ Cannot change later.
   - **Set a DB password and save it** (shown once). Needed in Phase 04 as `SUPABASE_DB_PASSWORD`.
2. **Capture credentials** (Settings → API Keys):
   - Project URL: `https://<ref>.supabase.co`
   - **Publishable key** `sb_publishable_…` → this is the `NEXT_PUBLIC_SUPABASE_ANON_KEY` value (Phase 02).
   - (Do NOT capture / use the secret key — unused in this app.)
3. **Link + push schema:**
   ```bash
   supabase login                          # opens browser, stores access token
   supabase link --project-ref <ref>       # may prompt for DB password
   supabase db push                        # applies the 3 migrations to cloud (NO seeds)
   ```
4. **Verify schema in cloud:** dashboard → Table editor (tables exist) and Database → Policies
   (RLS enabled on every table). Or `supabase migration list` shows local = remote.

## Decision needed before push
- **Do `common` seeds belong in prod?** `db push` skips all seeds. If `supabase/seeds/common/`
  holds reference data the app needs at runtime, decide whether to (a) re-author it as a migration,
  or (b) run a one-off prod-safe insert. **Dev seeds (`seeds/dev`) must never reach prod.**
  → Inspect `seeds/common` content; if it's only demo data, do nothing.

## Todo
- [ ] Decide handling of `seeds/common` (migration vs skip)
- [ ] Create Cloud project (PG17, Singapore); save DB password
- [ ] Capture project URL + `sb_publishable_…` key
- [ ] `supabase login` → `link` → `db push`
- [ ] Verify tables + RLS in dashboard; `supabase migration list` local == remote

## Success criteria
- Cloud DB has all 3 migrations applied; RLS on every table; no dev seed data present.

## Risks
- **PG version mismatch** → blocked `db push`. Mitigation: pick v17 at creation.
- **Lost DB password** → can reset in Settings → Database, but blocks Phase 04 until done.
- **Direct SQL edits in dashboard** after migrations exist → breaks migration history. Don't.
