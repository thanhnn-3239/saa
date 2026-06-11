# Phase 03 — Dev seeder + EXTRA_SEEDS wiring

**Priority:** High · **Status:** done · **Depends on:** — (independent of route)

Seed existing internal users for auto-login to log in as. Opt-in via the existing
`env(SUPABASE_EXTRA_SEEDS)` hook — `common/` stays untouched.

## Files

- **Create** `supabase/seeds/dev/seed.sql` — admin-test, member-test, member01..08.
- **Modify** `.env.example` — document `SUPABASE_EXTRA_SEEDS` (local opt-in).
- No `config.toml` change: `sql_paths` already has `env(SUPABASE_EXTRA_SEEDS)` at line 63.

## Seed contents

Users (all `@sun-asterisk.com`):
- `admin-test@sun-asterisk.com` → role **admin**
- `member-test@sun-asterisk.com` → role **member**
- `member01@…` … `member08@…` → role **member**, distributed across seeded
  `departments` (Engineering/Design/Product/Operations/HR) for list/pagination/kudos tests.

## auth.users insert (version-sensitive)

For each user insert into `auth.users` with the required columns:
`id` (gen_random_uuid()), `instance_id` ('00000000-0000-0000-0000-000000000000'),
`aud` ('authenticated'), `role` ('authenticated'), `email`, `email_confirmed_at` (now()),
`encrypted_password` (null — magiclink doesn't need it), `raw_app_meta_data`
(`{"provider":"email","providers":["email"]}`), `raw_user_meta_data`
(`{"full_name":"<name>"}` — `handle_new_user` reads `full_name`), `created_at`, `updated_at` (now()).

Add a matching `auth.identities` row per user (`provider='email'`, `provider_id=email`,
`user_id`, `identity_data` jsonb with `sub`+`email`, `id` gen_random_uuid()) — required for
GoTrue lookups / generateLink to resolve the user reliably across versions.

The `on_auth_user_created` trigger auto-creates each `public.profiles` row (role
defaults `member`, `full_name` from meta).

## 🔴 The admin role update (must disable guard trigger)

`trg_guard_profile_role` raises `'only admins can change role'` when `is_admin()` is
false. During `db reset` there is no auth session → `auth.uid()` null → `is_admin()`
false → the update FAILS. Disable the trigger around the update:

```sql
alter table public.profiles disable trigger trg_guard_profile_role;
update public.profiles set role = 'admin' where email = 'admin-test@sun-asterisk.com';
alter table public.profiles enable trigger trg_guard_profile_role;
```

Assign departments similarly:
```sql
update public.profiles p set department_id = d.id
from public.departments d
where p.email = 'member01@sun-asterisk.com' and d.name = 'Engineering';
-- …repeat / or a CASE mapping for member01..08
```

Make the whole seed idempotent (`on conflict (email) do nothing` won't work on
auth.users directly — guard with `where not exists (select 1 from auth.users where email=…)`
or wrap inserts so re-running `db reset` is clean).

## `.env.example` addition

```
# ---- Dev-only extra seeds (test users for auto-login / E2E) ----
# Point at the dev seed to create admin-test/member-test + members on `pnpm db:reset`.
# Leave unset to skip. Loaded via supabase/config.toml sql_paths env() hook.
SUPABASE_EXTRA_SEEDS=./seeds/dev/seed.sql
```

## Todo

- [x] Write `supabase/seeds/dev/seed.sql` (auth.users + identities + role + departments, idempotent)
- [x] Disable/enable `trg_guard_profile_role` around the admin update
- [x] Document `SUPABASE_EXTRA_SEEDS` in `.env.example`
- [x] Verify: `SUPABASE_EXTRA_SEEDS=./seeds/dev/seed.sql pnpm db:reset` → users exist,
      admin-test role=admin, profiles created, no trigger error
- [x] `psql` sanity check: `select email, role from profiles order by email;`
- [x] **Fix realized risk #3:** seed GoTrue token columns to `''` (NULL broke `listUsers`)

## Success criteria

`pnpm db:reset` with the env set creates 10 users; `admin-test` is `admin`, rest
`member`; profiles populated with names + departments; re-running is clean.
A subsequent `GET /auto-login?email=admin-test@…&token=<secret>` logs in successfully.
