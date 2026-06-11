-- kudo_likes table, indexes, RLS, aggregation views, and realtime publication.
-- Depends on: 20260604070000_schema.sql (kudos, profiles tables).
-- Run: supabase db push  OR  psql $DATABASE_URL -f supabase/migrations/20260606000000_kudo_likes.sql

-- ===================== Table =====================
create table public.kudo_likes (
  id          bigint generated always as identity primary key,
  kudo_id     uuid not null references public.kudos(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  -- 1 = standard like; 2 = special-day bonus (admin-controlled, deferred)
  hearts      smallint not null default 1 check (hearts in (1, 2)),
  created_at  timestamptz not null default now(),
  -- one like per user per kudo (toggle model)
  unique (kudo_id, user_id)
);

-- ===================== Indexes =====================
create index idx_kudo_likes_kudo on public.kudo_likes (kudo_id);
create index idx_kudo_likes_user on public.kudo_likes (user_id);

-- ===================== RLS =====================
alter table public.kudo_likes enable row level security;

-- Authenticated users can read all like rows (heart counts are public on the board).
create policy kudo_likes_select on public.kudo_likes
  for select using (auth.role() = 'authenticated');

-- Users may only insert their own like, and NOT on a kudo they sent (no self-like).
create policy kudo_likes_insert on public.kudo_likes
  for insert with check (
    user_id = auth.uid()
    and not exists (
      select 1 from public.kudos k
      where k.id = kudo_id and k.sender_id = auth.uid()
    )
  );

-- Users may only delete (unlike) their own like row.
create policy kudo_likes_delete on public.kudo_likes
  for delete using (user_id = auth.uid());

-- ===================== Aggregation views =====================

-- Heart totals per kudo — consumed by the board card and realtime updates.
create view public.kudo_heart_counts as
  select
    k.id as kudo_id,
    coalesce(sum(l.hearts), 0)::int as heart_total,
    count(l.*)::int                 as like_count
  from public.kudos k
  left join public.kudo_likes l on l.kudo_id = k.id
  group by k.id;

-- Per-profile rollups for sidebar stats and spotlight sizing.
-- hearts_received = hearts credited to the sender (spec C.4.1).
-- kudos_received  = count where this profile is the recipient.
create view public.profile_kudo_stats as
  select
    p.id as profile_id,
    (
      select count(*) from public.kudos k
      where k.recipient_id = p.id and k.status = 'published'
    ) as kudos_received,
    (
      select count(*) from public.kudos k
      where k.sender_id = p.id and k.status = 'published'
    ) as kudos_sent,
    (
      select coalesce(sum(l.hearts), 0)
      from public.kudo_likes l
      join public.kudos k on k.id = l.kudo_id
      where k.sender_id = p.id
    ) as hearts_received
  from public.profiles p;

-- ===================== Replica identity =====================
-- Required for Realtime DELETE payloads to carry kudo_id + user_id columns.
-- Without FULL, pg default only includes the PK (id bigint) in payload.old,
-- so the board's DELETE handler can never decrement heart counts for other viewers.
alter table public.kudo_likes replica identity full;

-- ===================== PostgREST grants =====================
-- Views are not auto-granted in Supabase. Without these, PostgREST returns 403
-- on any query that touches kudo_heart_counts or profile_kudo_stats — which
-- crashes every card query and the sidebar stats on first board load.
grant select on public.kudo_heart_counts to authenticated, anon;
grant select on public.profile_kudo_stats to authenticated, anon;

-- ===================== Realtime publication =====================
-- kudos was added in 20260604070200_functions_triggers_views.sql; guard before re-adding.
do $$
begin
  -- kudo_likes (new table — always add)
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'kudo_likes'
  ) then
    alter publication supabase_realtime add table public.kudo_likes;
  end if;

  -- kudos (already in publication from previous migration — guard)
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'kudos'
  ) then
    alter publication supabase_realtime add table public.kudos;
  end if;
end $$;
