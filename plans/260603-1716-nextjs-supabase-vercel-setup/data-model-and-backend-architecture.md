---
title: SAA Kudos — Data Model & Backend Architecture
date: 2026-06-04
status: design-reference
source_design: momorph fileKey 9ypp4enmFmdK3YAFJLIu6C
source_report: plans/reports/researcher-260604-1059-saa-kudos-design-analysis.md
---

# SAA Kudos — Data Model & Backend Architecture

Authoritative schema + backend-logic placement for the SAA recognition app, derived from the
MoMorph design. Future feature plans build on this. Stack: Next.js 16 + Supabase + Vercel.

## Locked decisions
- **Kudo → 1 recipient** (`kudos.recipient_id`, single FK).
- **Secret Box grant mechanism: undecided** → model `secret_boxes` + `open_secret_box()` RPC now;
  add the granting path (trigger / admin / cron) later. Boxes can be inserted manually for testing.
- **Realtime: yes** (Supabase Realtime on `kudos`, `notifications`).
- **i18n: UI only** (next-intl). No schema impact; user content stored as-entered.
- **Auth: Google OAuth**, restricted to `@sun-asterisk.com` (assumption — adjust domain).
- **One department per user** (`profiles.department_id`, single FK) — assumption; switch to M:N only if needed.

---

## Backend-logic placement (final, design-driven)

| Feature | Layer | Mechanism |
|---------|-------|-----------|
| Open Secret Box 🔴 | **D** Postgres RPC | `open_secret_box()` — server random + atomic |
| Write Kudo 🔴 | **B → D** | Server Action uploads images → calls `create_kudo()` (atomic multi-table) |
| Feed / filters / search | **A** | client + RLS + PostgREST |
| Realtime board + bell | **A** | Supabase Realtime subscriptions |
| Notification on kudo | **D** | trigger `notify_on_kudo` |
| Leaderboard / stats | **D** | view `user_statistics` (read via A) |
| Image upload | **Storage** | buckets + RLS (validate in B) |
| Auth + roles | **Supabase Auth + RLS** | Google OAuth, `profiles.role`, `proxy.ts` session |
| Campaign window / countdown | **B + D** | Server Component reads campaign; RLS/trigger gate writes |
| Admin (moderation, CRUD) | **B** | Server Actions, admin-only RLS |
| Cron (box distribution, digests) | **C (deferred)** | Edge Function + pg_cron / Vercel Cron |

🔴 = correctness-critical, MUST live in Postgres (D). Never client/sequential-query.

---

## Schema (DDL)

> All tables in `public`. RLS enabled on every table. `id` = `bigint generated always as identity`
> except `profiles.id` (uuid = auth.users) and `kudos.id`/`secret_boxes.id` (uuid for unguessable refs).

```sql
-- ===== Identity & org =====
create table public.departments (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  created_at  timestamptz not null default now()
);

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  email         text not null,
  avatar_url    text,
  role          text not null default 'member' check (role in ('member','admin')),
  department_id bigint references public.departments(id),
  created_at    timestamptz not null default now()
);

-- ===== Taxonomy =====
create table public.hashtags (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  created_at  timestamptz not null default now()
);

-- ===== Kudos =====
create table public.campaigns (
  id            bigint generated always as identity primary key,
  name          text not null,
  rules_content text,                       -- "Thể lệ"
  starts_at     timestamptz not null,       -- drives prelaunch countdown
  ends_at       timestamptz not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table public.kudos (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references public.profiles(id),
  recipient_id  uuid not null references public.profiles(id),
  body          text not null,              -- rich text w/ @mentions
  is_anonymous  boolean not null default false,
  status        text not null default 'published'
                  check (status in ('published','hidden','spam')),
  campaign_id   bigint references public.campaigns(id),
  created_at    timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index on public.kudos (recipient_id, created_at desc);
create index on public.kudos (sender_id, created_at desc);
create index on public.kudos (status, created_at desc);

create table public.kudo_hashtags (
  kudo_id     uuid references public.kudos(id) on delete cascade,
  hashtag_id  bigint references public.hashtags(id),
  primary key (kudo_id, hashtag_id)
);

create table public.kudo_images (
  id          bigint generated always as identity primary key,
  kudo_id     uuid not null references public.kudos(id) on delete cascade,
  storage_path text not null               -- Supabase Storage object path
);

create table public.kudo_links (             -- "Addlink Box"
  id          bigint generated always as identity primary key,
  kudo_id     uuid not null references public.kudos(id) on delete cascade,
  url         text not null,
  title       text
);

-- ===== Badges & Secret Box =====
create table public.badges (                  -- secret-box reward catalog
  id          bigint generated always as identity primary key,
  name        text not null unique,
  image_url   text,
  description text,
  weight      integer not null check (weight > 0)   -- drop weight
);
-- seed: Stay Gold 30, Flow to Horizon 25, Touch of Light 20,
--       Beyond Boundary 10, Revival 10, Root Further 5

create table public.user_badges (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  badge_id    bigint not null references public.badges(id),
  source      text not null default 'secret_box',
  created_at  timestamptz not null default now()
);

create table public.secret_boxes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'unopened' check (status in ('unopened','opened')),
  badge_id    bigint references public.badges(id),   -- set on open
  opened_at   timestamptz,
  created_at  timestamptz not null default now()
);
create index on public.secret_boxes (user_id, status);

-- ===== Awards catalog (Hệ thống giải — read-only, 6 categories) =====
create table public.awards (
  id          bigint generated always as identity primary key,
  category    text not null,
  name        text not null,
  description text,
  image_url   text,
  sort_order  integer not null default 0
);

-- ===== Notifications =====
create table public.notifications (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,                -- 'kudo_received', ...
  kudo_id     uuid references public.kudos(id) on delete cascade,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index on public.notifications (user_id, is_read, created_at desc);
```

---

## RPC 1 — `create_kudo` (atomic multi-table) 🔴

```sql
create or replace function public.create_kudo(
  p_recipient_id uuid,
  p_body         text,
  p_is_anonymous boolean default false,
  p_hashtag_ids  bigint[] default '{}',
  p_image_paths  text[]  default '{}',
  p_links        jsonb   default '[]'      -- [{"url":..,"title":..}]
) returns uuid
language plpgsql security invoker as $$    -- runs as caller; RLS applies
declare v_kudo_id uuid;
begin
  if array_length(p_hashtag_ids,1) is null or array_length(p_hashtag_ids,1) > 5 then
    raise exception 'kudo requires 1..5 hashtags';
  end if;
  if coalesce(array_length(p_image_paths,1),0) > 5 then
    raise exception 'max 5 images';
  end if;

  insert into public.kudos (sender_id, recipient_id, body, is_anonymous)
  values (auth.uid(), p_recipient_id, p_body, p_is_anonymous)
  returning id into v_kudo_id;

  insert into public.kudo_hashtags (kudo_id, hashtag_id)
  select v_kudo_id, unnest(p_hashtag_ids);

  if array_length(p_image_paths,1) is not null then
    insert into public.kudo_images (kudo_id, storage_path)
    select v_kudo_id, unnest(p_image_paths);
  end if;

  insert into public.kudo_links (kudo_id, url, title)
  select v_kudo_id, e->>'url', e->>'title'
  from jsonb_array_elements(p_links) e;

  return v_kudo_id;
end $$;
```
**Flow:** Server Action (B) uploads images to Storage → gets paths → calls this RPC. All DB writes
atomic; if any fails the whole kudo rolls back. (Orphan storage objects cleaned by a later job.)

---

## RPC 2 — `open_secret_box` (server-authoritative random + atomic) 🔴 CRITICAL

```sql
create or replace function public.open_secret_box(p_box_id uuid)
returns public.badges
language plpgsql security definer set search_path = public as $$
declare v_badge public.badges;
begin
  -- lock the box; must belong to caller and be unopened
  perform 1 from public.secret_boxes
   where id = p_box_id and user_id = auth.uid() and status = 'unopened'
   for update;
  if not found then
    raise exception 'box not found, not yours, or already opened';
  end if;

  -- weighted random pick (efficient: exponential / weight)
  select * into v_badge from public.badges
   order by -ln(random()) / weight
   limit 1;

  update public.secret_boxes
     set status = 'opened', badge_id = v_badge.id, opened_at = now()
   where id = p_box_id;

  insert into public.user_badges (user_id, badge_id, source)
  values (auth.uid(), v_badge.id, 'secret_box');

  return v_badge;
end $$;
```
**Why D, not B:** `FOR UPDATE` lock + random pick + decrement + award run in ONE transaction.
Impossible to double-open or cheat the RNG. A Server Action doing sequential supabase-js calls
cannot guarantee this. Client calls `supabase.rpc('open_secret_box', { p_box_id })`.

---

## Trigger — `notify_on_kudo`

```sql
create or replace function public.notify_on_kudo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, kudo_id)
  values (new.recipient_id, 'kudo_received', new.id);
  return new;
end $$;

create trigger trg_notify_on_kudo
  after insert on public.kudos
  for each row execute function public.notify_on_kudo();
```
(Anonymous kudos still notify the recipient; sender identity hidden in the UI layer.)

---

## View — `user_statistics` (leaderboard / profile tiles)

```sql
create view public.user_statistics as
select
  p.id as user_id,
  (select count(*) from public.kudos k where k.recipient_id = p.id and k.status='published') as kudos_received,
  (select count(*) from public.kudos k where k.sender_id   = p.id and k.status='published') as kudos_sent,
  (select count(*) from public.user_badges ub where ub.user_id = p.id) as badges_count
from public.profiles p;
```
Heavy aggregation stays in DB. Promote to a materialized view + scheduled refresh only if it gets slow (YAGNI).

---

## RLS strategy (every table)

```sql
-- helper: is current user admin?
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
```

| Table | select | insert | update / delete |
|-------|--------|--------|-----------------|
| profiles | authenticated: all | self (signup trigger) | self (own row); admin (role) |
| kudos | `status='published'` OR own OR admin | **via `create_kudo` only** (sender=auth.uid) | admin only (moderation) |
| kudo_hashtags/images/links | follows parent kudo visibility | via RPC | admin |
| secret_boxes | own only | admin/grant path (TBD) | **none direct — via `open_secret_box`** |
| user_badges | all (public profile badges) | **via `open_secret_box` only** | none |
| badges / awards / hashtags / departments / campaigns | all authenticated | admin | admin |
| notifications | own | trigger (definer) | own (mark read) |

Key rule: secret_boxes/user_badges have **no direct insert/update policy for users** — mutated only
through the SECURITY DEFINER RPC. This is what makes the random reward tamper-proof.

---

## Realtime

```sql
alter publication supabase_realtime add table public.kudos;
alter publication supabase_realtime add table public.notifications;
```
Client subscribes (filtered by recipient for notifications). RLS still applies to realtime payloads.

## Storage buckets
- `avatars` — public read, owner write (RLS).
- `kudo-images` — authenticated read, write via signed path from the Server Action.

## Auth
- Supabase Auth → Google provider. Restrict signups to `@sun-asterisk.com` via an auth hook or a
  `before insert on auth.users`-equivalent check (Supabase: use a DB trigger on profiles creation +
  Auth "Email domain allow-list" if available). Confirm exact mechanism at implement time.
- On first login: trigger creates a `profiles` row (full_name/email/avatar from OAuth metadata).
- Role default `member`; admins promoted manually (admin-only update).

## i18n
- `next-intl`, UI strings only. No DB columns. Catalog content (awards/rules) stored single-language
  unless requirements change.

---

## Open items (for the implementation plan)
- Secret box **grant** mechanism (how users earn boxes) — still undecided.
- Exact Google-domain-restriction mechanism in current Supabase Auth.
- Whether `awards` has a "winners" relation or is purely informational (design = read-only catalog → assume informational).
- Spam detection: manual moderation assumed (no auto-classifier in design).
- Materialized-view refresh strategy if leaderboard grows.
