# Implementer Report — B1 Data Foundation

**Plan:** plans/260606-1325-sun-kudos-live-board/phase-b1-data-foundation.md
**Date:** 2026-06-06
**Branch:** feat/sun-kudos-live-board

---

## Files Created / Modified

| File | Action | Lines |
|------|--------|-------|
| `supabase/migrations/20260606000000_kudo_likes.sql` | Created | 77 |
| `supabase/seed/kudos-board-seed.sql` | Created | 198 |
| `lib/kudos/types.ts` | Created | 93 |
| `lib/kudos/stars.ts` | Created | 24 |
| `lib/query/query-client.ts` | Created | 22 |
| `lib/supabase/realtime.ts` | Created | 55 |
| `app/providers.tsx` | Created | 26 |
| `app/layout.tsx` | Modified | +2 lines (import + JSX wrap) |
| `package.json` | Modified | added `@tanstack/react-query@^5.101.0`, `embla-carousel-react@^8.6.0` |

---

## Seed Run Command

```bash
# Option A — full reset (wipes DB, re-applies migrations, then all files in supabase/seeds/):
pnpm db:reset

# Option B — seed only (migrations already applied locally):
psql "$(supabase status --output json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['DB_URL'])")" \
     -f supabase/seed/kudos-board-seed.sql
```

**Hosted Supabase:** `auth.users` is not directly writable. Create the 12 seed users via the Supabase dashboard or Admin API first (use emails matching `*@seed.kudos`), then run only the `profiles` + downstream inserts. The seed file's `delete from auth.users` block is safe to remove for hosted runs.

---

## Schema Assumptions / Approximations

1. **`kudos` already in realtime publication** — `20260604070200_functions_triggers_views.sql` already does `alter publication supabase_realtime add table public.kudos`. The new migration guards with a `DO $$ … IF NOT EXISTS` block to avoid the duplicate error rather than using `IF NOT EXISTS` syntax (not supported on `ALTER PUBLICATION` in Postgres < 16).

2. **`profile_kudo_stats.hearts_received` semantics** — credits hearts to the kudo *sender* per spec C.4.1 ("tài khoản gửi kudo … được cộng 1 tim"). The view joins `kudo_likes → kudos` and sums hearts where `kudos.sender_id = profile.id`. This means hearts credited to a sender accumulate across all kudos they sent that others liked.

3. **Seed uses `pravatar.cc` for avatars** — no Storage bucket required for local dev; replace with real Supabase Storage paths in staging.

4. **No `campaigns` seed data** — the `kudos.campaign_id` FK is nullable; no campaign rows are inserted. B2/B3 queries will handle null campaign_id gracefully.

5. **`user_statistics` view (from prior migration) vs `profile_kudo_stats` (new)** — both exist. `user_statistics` lacks `hearts_received`; B2 queries should prefer `profile_kudo_stats` for the board. No conflict.

---

## Public Exports — Downstream Import Reference

### `lib/kudos/types.ts`
```ts
export interface ProfileBrief        // id, fullName, avatarUrl, stars, departmentId
export interface KudoCard            // full hydrated kudo for feed / carousel
export interface HeartState          // liked, heartTotal, pending (optimistic UI)
export interface SidebarStats        // kudosSent, kudosReceived, heartsReceived, badgesCount, secretBoxes
export interface LeaderboardItem     // rank, profile: ProfileBrief, score
export interface SpotlightNode       // profile: ProfileBrief, kudosReceived, weight
export interface KudosFilter         // hashtag: string|null, departmentId: number|null
```

### `lib/kudos/stars.ts`
```ts
export function getStarTier(kudosReceived: number): 0 | 1 | 2 | 3
```

### `lib/query/query-client.ts`
```ts
export function makeQueryClient(): QueryClient
```

### `lib/supabase/realtime.ts`
```ts
export type RealtimeEvent   = "INSERT" | "UPDATE" | "DELETE" | "*"
export type RealtimePayload = RealtimePostgresChangesPayload<Record<string, unknown>>

export function subscribeToTable(
  channelName: string,
  table: string,
  event: RealtimeEvent,
  handler: (payload: RealtimePayload) => void,
): () => void   // returns cleanup function
```

### `app/providers.tsx`
```ts
export function Providers({ children }: { children: React.ReactNode }): JSX.Element
```

---

## Type Check

```
pnpm exec tsc --noEmit  →  exit 0 (no output, no errors)
```

---

**Status:** DONE
**Summary:** All B1 deliverables implemented — migration (table + indexes + RLS + views + realtime guard), deps installed, QueryClient factory, QueryClientProvider mounted at root layout, Supabase Realtime helper, shared types, stars tier helper, and an idempotent 40-kudo seed with a clear TOP-5 hearts distribution. TypeScript compiles clean.
**Concerns:** Migration cannot be validated against a live DB from this session (no local Supabase running); SQL was reviewed for syntax correctness by inspection. The `DO $$ … $$` realtime guard block should be tested on first `supabase db reset`.
