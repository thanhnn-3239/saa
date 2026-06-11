# Phase B1 — Data Foundation

**Track:** B (data/logic) · **Priority:** Critical · **Status:** ✅ done · **Depends on:** —

## MoMorph refs
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: ../260606-1325-sun-kudos-live-board/clarifications.md

## Overview
Establish everything the board's data depends on: the **likes/hearts** table (missing today),
aggregation views, RLS, the TanStack Query provider, Supabase realtime helpers, and a seed script.
This unblocks B2/B3/B4 and the C1 integration.

## Key insights
- Schema already has profiles/kudos/hashtags/departments/badges/secret_boxes (`supabase/migrations/20260604070000_schema.sql`). **No likes table.**
- Hearts credit the **sender** of a kudo, not the recipient (spec C.4.1): "tài khoản gửi kudo … được cộng 1 tim". Sidebar "Số tim bạn nhận được" = Σ hearts on kudos *you sent*.
- Hoa thị (stars) tiers are by **kudos received** count: ≥10→1★, ≥20→2★, ≥50→3★ (specs B.3.2/B.3.6).
- "Special day +2 hearts" is DEFERRED — model `hearts` as a column (default 1) so the rule can be added later without a migration.

## Related code files
**Create**
- `supabase/migrations/20260606XXXXXX_kudo_likes.sql` — table + indexes + RLS + views.
- `supabase/seed/kudos-board-seed.sql` (or `.ts`) — sample data (see Seed section).
- `lib/query/query-client.ts` — `QueryClient` factory (sane defaults: staleTime 30s).
- `app/providers.tsx` (or extend existing) — client `QueryClientProvider` wrapper.
- `lib/supabase/realtime.ts` — helper to subscribe to a table channel and map payloads.
- `lib/kudos/types.ts` — shared TS types (KudoCard, ProfileBrief, HeartState, SidebarStats, LeaderboardItem).
**Modify**
- `app/(public)/layout.tsx` or `app/layout.tsx` — mount the QueryClientProvider (client boundary).
- `package.json` — add `@tanstack/react-query`, `embla-carousel-react`.

## Migration — `kudo_likes`
```sql
create table public.kudo_likes (
  id          bigint generated always as identity primary key,
  kudo_id     uuid not null references public.kudos(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  hearts      smallint not null default 1 check (hearts in (1,2)), -- 2 reserved for special days (deferred)
  created_at  timestamptz not null default now(),
  unique (kudo_id, user_id)                                        -- one like per user per kudos
);
create index idx_kudo_likes_kudo on public.kudo_likes (kudo_id);
create index idx_kudo_likes_user on public.kudo_likes (user_id);

alter table public.kudo_likes enable row level security;

-- read: anyone authenticated can see like rows (counts are public on the board)
create policy kudo_likes_select on public.kudo_likes for select using (auth.role() = 'authenticated');
-- insert: only own row, and NOT on a kudo you sent (no self-like)
create policy kudo_likes_insert on public.kudo_likes for insert with check (
  user_id = auth.uid()
  and not exists (select 1 from public.kudos k where k.id = kudo_id and k.sender_id = auth.uid())
);
-- delete: only own like (unlike)
create policy kudo_likes_delete on public.kudo_likes for delete using (user_id = auth.uid());

-- per-kudo heart aggregation
create view public.kudo_heart_counts as
  select k.id as kudo_id,
         coalesce(sum(l.hearts), 0)::int as heart_total,
         count(l.*)::int                 as like_count
  from public.kudos k
  left join public.kudo_likes l on l.kudo_id = k.id
  group by k.id;

-- per-profile rollups (hearts received = hearts on kudos they SENT; kudos received = count as recipient)
create view public.profile_kudo_stats as
  select p.id as profile_id,
         (select count(*) from public.kudos k where k.recipient_id = p.id and k.status = 'published') as kudos_received,
         (select count(*) from public.kudos k where k.sender_id    = p.id and k.status = 'published') as kudos_sent,
         (select coalesce(sum(l.hearts),0) from public.kudo_likes l
            join public.kudos k on k.id = l.kudo_id where k.sender_id = p.id)                          as hearts_received
  from public.profiles p;
```
- Add `kudos` + `kudo_likes` to the realtime publication: `alter publication supabase_realtime add table public.kudos, public.kudo_likes;` (guard with existence check / separate migration if publication already includes them).
- Stars tier is a pure function of `kudos_received` → compute in TS (`lib/kudos/stars.ts`), not in SQL, to keep tiers configurable.

## Seed script
Create deterministic sample data so the populated design renders in dev/demo:
- ~6 departments (e.g. CEVC10, Marketing, …), ~12 profiles with avatars + department_id.
- ~12 hashtags (#Dedicated, #Inspiring, "IDOL GIỚI TRẺ", …).
- 30–50 `kudos` (varied sender/recipient/body/created_at) + `kudo_hashtags` + a few `kudo_images`.
- `kudo_likes` distributed so a clear TOP 5 emerges for Highlight.
- `secret_boxes` (opened + unopened) + `user_badges` for sidebar stats & "nhận quà" leaderboard.
- Idempotent (truncate-and-insert or `on conflict do nothing`); document `pnpm db:seed` (or psql) command.

## Implementation steps
1. Read `node_modules/next/dist/docs/` for Next.js 16 provider/client-boundary guidance.
2. Write the migration; apply locally (`supabase db push` / psql); verify views return rows.
3. Add deps; create `query-client.ts` + provider; mount at the highest sensible client boundary.
4. Build `lib/supabase/realtime.ts` subscribe helper (channel name, table, event, handler, cleanup).
5. Define shared types in `lib/kudos/types.ts` + `lib/kudos/stars.ts` tier helper.
6. Write + run the seed script; confirm board-shaped data exists.
7. `pnpm build` / typecheck.

## Todo
- [x] `kudo_likes` migration (table, indexes, RLS, views, realtime publication)
- [x] Apply migration + verify views
- [x] Add `@tanstack/react-query` + `embla-carousel-react`
- [x] QueryClient factory + provider mounted
- [x] Realtime subscribe helper
- [x] Shared types + stars tier helper
- [x] Seed script + documented run command
- [x] Build/typecheck green

## Success criteria
- Liking respects: one-per-user (unique), no self-like (RLS check), credit-sender (views).
- `kudo_heart_counts` / `profile_kudo_stats` return correct numbers against seed data.
- Provider + realtime helper importable; board can render populated data in dev.

## Security
- RLS enforces no-self-like and own-row-only insert/delete; never trust client for these.
- Seed/admin-only special-day logic stays out of v1; `hearts` column constrained to {1,2}.

## Next steps
Unblocks B2 (queries), B3 (mutations/stats), B4 (spotlight). C1 consumes the provider + realtime helper.
