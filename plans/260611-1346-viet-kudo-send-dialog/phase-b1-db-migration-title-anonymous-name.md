# Phase B1 — DB migration: kudos.title + anonymous_name

Track B. Status: done. Priority: P1 (blocks B2). Depends on: none.

## Context links
- RPC + views: `supabase/migrations/20260604070200_functions_triggers_views.sql`
- Views (likes): `supabase/migrations/20260606000000_kudo_likes.sql`
- Schema: `supabase/migrations/20260604070000_schema.sql`
- Clarifications #1, #3. DB design: `docs/database-design.md`

## Key insights
- `create_kudo` (20260604070200:5) inserts only `(sender_id, recipient_id, body, is_anonymous)`. Must add title + anonymous_name to insert.
- ⚠️ Board feed selects kudos columns **directly via PostgREST** (`lib/kudos/queries.ts` `buildKudoSelect`), NOT through a view. No board view selects `body`/`title` — so NO view edits needed here. Views `user_statistics`, `kudo_heart_counts`, `profile_kudo_stats` aggregate counts only → unaffected.
- `kudos.title` required by form, but make column NULL-able + default to keep existing rows valid (backwards compat). Enforce "required" in app + RPC, not as a NOT NULL DDL on the existing table.
- `check (sender_id <> recipient_id)` already exists — keep.

## Requirements
- New migration `2026061100xxxx_kudo_title_anonymous_name.sql` (pick concrete timestamp > existing latest `20260606010000`).
- `alter table public.kudos add column title text;`
- `alter table public.kudos add column anonymous_name text;`
- `create or replace function public.create_kudo(...)` adding `p_title text`, `p_anonymous_name text default null` params; validations:
  - title required: `if coalesce(btrim(p_title),'') = '' then raise exception 'kudo requires a title';`
  - title length: `if char_length(p_title) > 100 then raise exception 'title too long (max 100)';`
  - body length (optional defense-in-depth): `if char_length(p_body) > 2000 then raise exception 'body too long (max 2000)';`
  - keep existing hashtag 1..5 + image ≤5 guards.
  - insert: `insert into public.kudos (sender_id, recipient_id, title, body, is_anonymous, anonymous_name) values (auth.uid(), p_recipient_id, p_title, p_body, p_is_anonymous, p_anonymous_name)`.
- Param order: append new params AFTER existing to avoid breaking positional callers; recommended signature: `create_kudo(p_recipient_id, p_title, p_body, p_is_anonymous, p_hashtag_ids, p_image_paths, p_links, p_anonymous_name)`. (B2 calls by named args via supabase-js `rpc()` so order is non-breaking there, but keep title near body for readability.)
- RLS: unaffected (no new tables, column adds inherit table policies). Confirm no policy references column list explicitly.
- `notify_on_kudo` trigger: unaffected.

## Related code files
- Create: `supabase/migrations/2026061100xxxx_kudo_title_anonymous_name.sql`
- Modify: none (it's a forward migration; do not edit prior migration files).
- Check (no edit expected): `supabase/seed.sql` if present — seeded kudos rows may want a `title` for nicer demo board; optional, low priority.

## Implementation steps
1. Determine latest migration timestamp; name new file with a strictly greater timestamp.
2. Add two `alter table ... add column` statements (idempotent guard `if not exists` per PG16 syntax: `add column if not exists`).
3. Re-declare `create_kudo` with new params + validations + extended insert (full `create or replace`).
4. `grant execute on function public.create_kudo(...) to authenticated;` if prior grant was signature-specific (check 20260604070200 / rls migration for existing grant on old signature — old signature grant becomes orphaned; add grant for new signature).
5. Verify locally: `pnpm supabase db reset` (or project's migration apply script) runs clean.

## Todo
- [x] New migration file created with valid timestamp
- [x] `title` + `anonymous_name` columns added (idempotent)
- [x] `create_kudo` re-created with p_title + p_anonymous_name + validations
- [x] execute grant for new signature present
- [x] migrations apply clean locally (db reset)
- [x] confirmed no board view needs column additions (PostgREST direct select)

## Success criteria
- Fresh `db reset` applies all migrations with no error.
- `select create_kudo(...)` with valid args inserts a row carrying title + anonymous_name; empty title raises; >100 title raises; >5 hashtags still raises.
- Existing rows unaffected (title NULL allowed).

## Risk assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Orphaned grant on old RPC signature → 403 on call | Med | High | Add explicit grant for new signature; verify with B2 smoke call |
| Timestamp collision / out-of-order migration | Low | Med | Pick timestamp strictly > latest; CI applies in order |
| Existing rows break NOT NULL | Low | High | Keep columns nullable; enforce required in app/RPC only |

## Rollback
Forward-only DB. Rollback = follow-up migration dropping columns + reverting RPC to prior signature. Document in migration header comment. No data loss for board (columns nullable).
