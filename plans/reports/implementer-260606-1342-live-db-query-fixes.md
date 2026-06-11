---
title: Live DB Query Fixes — PostgREST PGRST200 bugs
date: 2026-06-06
branch: feat/sun-kudos-live-board
---

## Summary

Three PostgREST embedding bugs caused PGRST200 at runtime. Both reported bugs were confirmed against the live local Supabase, then fixed using the two-query + JS-merge pattern. All fixes validated against the live REST API. Build and test suite clean.

---

## Bug 1 — `kudo_heart_counts` embed in `queries.ts`

### Root cause
`kudo_heart_counts` is an aggregate VIEW. PostgREST cannot detect a FK relationship to `kudos`, so embedding it in `KUDO_SELECT` via `kudo_heart_counts ( heart_total, like_count )` returns PGRST200.

### Before
```ts
const KUDO_SELECT = `
  id, body, ...
  kudo_heart_counts ( heart_total, like_count ),
  ...
`;
// flattenHeartCounts() merged the embedded array into flat fields.
```

### After — `lib/kudos/queries.ts`
- Removed `kudo_heart_counts (...)` from `KUDO_SELECT`.
- Added `fetchHeartCounts(supabase, ids)` helper: queries `kudo_heart_counts` directly via `.in('kudo_id', ids)`, returns `Map<string, {heart_total, like_count}>`.
- Added `mergeHeartCounts(rows, heartMap)` helper: spreads map values onto each row before `hydrateKudoCard`.
- `flattenHeartCounts` replaced by this two-function pattern.
- Applied to both `getKudosPage` and `getHighlightKudos`.

### `getHighlightKudos` correctness fix
The old implementation fetched 5 most-recent kudos then sorted client-side — wrong for a global top-5 by heart_total when the top rows are not among the 5 most recent.

New implementation:
1. Fetch up to 200 candidate published kudos (ids + created_at + filter columns) — event scale.
2. Fetch heart counts for all 200 via `fetchHeartCounts`.
3. Sort by `heart_total desc`, tie-break `created_at desc`, take top 5 ids.
4. Fetch full KUDO_SELECT details for those 5 ids.
5. Merge heart counts and hydrate in sorted order.

### Live REST validation

**Reproduce (before fix):**
```
{"code":"PGRST200","details":"Searched for a foreign key relationship between 'kudos' and 'kudo_heart_counts' in the schema 'public', but no matches were found.","hint":"Perhaps you meant 'kudo_hashtags' instead of 'kudo_heart_counts'.","message":"..."}
```

**After fix — feed page query (200):**
```
id=b0000000 body="Minh's debugging session yeste"
id=b0000000 body='Linh handled the client escala'
id=b0000000 body="Hùng's CI pipeline work cut bu"
```

**Heart counts second query (200):**
```
kudo_id=b0000000-...-001  heart_total=4  like_count=4
kudo_id=b0000000-...-008  heart_total=2  like_count=2
kudo_id=b0000000-...-013  heart_total=2  like_count=2
```

**Highlight top-5 heart_totals (200) — all 40 published kudos scanned:**
```
kudo_id=b0000000-...-001  heart_total=4  like_count=4
kudo_id=b0000000-...-002  heart_total=3  like_count=3
kudo_id=b0000000-...-007  heart_total=3  like_count=3
kudo_id=b0000000-...-003  heart_total=2  like_count=2
kudo_id=b0000000-...-008  heart_total=2  like_count=2
```
Confirmed top-5 heart_totals: **4, 3, 3, 2, 2** — matches spec.

Cross-check via psql:
```sql
select * from kudo_heart_counts order by heart_total desc limit 5;
-- b0000000-...-001 | 4 | 4
-- b0000000-...-002 | 3 | 3
-- b0000000-...-007 | 3 | 3
-- b0000000-...-003 | 2 | 2
-- b0000000-...-008 | 2 | 2
```
REST output matches DB exactly.

---

## Bug 2 — `profiles!profile_kudo_stats_profile_id_fkey` embed in `spotlight-queries.ts`

### Root cause
`profile_kudo_stats` is a VIEW. PostgREST cannot detect FKs on views, so any `!fkey` hint embed fails with PGRST200.

Affected functions: `getSpotlightNodes` and `searchSunners`.

### Before — `getSpotlightNodes`
```ts
.from("profile_kudo_stats")
.select(`profile_id, kudos_received,
  profiles!profile_kudo_stats_profile_id_fkey (id, full_name, avatar_url, department_id)`)
.gt("kudos_received", 0)
```

### After — `lib/kudos/spotlight-queries.ts`
1. Query `profile_kudo_stats` directly: `select('profile_id, kudos_received').gt('kudos_received', 0).order(...).limit(cap)`.
2. Collect `profile_id` array.
3. Query `profiles` with `.in('id', profileIds)`.
4. Build `Map<id, profile>`, merge into rows, pass to `hydrateSpotlightNodes`.

### Before — `searchSunners`
```ts
.from("profiles")
.select(`id, full_name, avatar_url, department_id,
  profile_kudo_stats!profile_kudo_stats_profile_id_fkey (kudos_received)`)
.ilike("full_name", ...)
```

### After — `searchSunners`
1. Query `profiles` (ilike search), collect ids.
2. Query `profile_kudo_stats` with `.in('profile_id', ids)`, build stats Map.
3. Merge `kudos_received` from Map, return `ProfileBrief[]`.

### Live REST validation

**Reproduce (before fix):**
```
{"code":"PGRST200","details":"Searched for a foreign key relationship between 'profile_kudo_stats' and 'profiles' using the hint 'profile_kudo_stats_profile_id_fkey' in the schema 'public', but no matches were found."...}
```

**getSpotlightNodes step 1 — stats query (200):**
```
profile_id=a1000000-...-002  kudos_received=8
profile_id=a1000000-...-001  kudos_received=6
profile_id=a1000000-...-003  kudos_received=5
profile_id=a1000000-...-004  kudos_received=4
profile_id=a1000000-...-005  kudos_received=3
(12 nodes total with kudos_received>0)
```

**getSpotlightNodes step 2 — profiles query (200):**
```
a1000000-...-002  Linh Nguyễn
a1000000-...-001  Minh Trần
a1000000-...-003  Hùng Lê
a1000000-...-004  Hương Phạm
a1000000-...-005  Đức Võ
```

**searchSunners "Minh" — profiles step (200):**
```
a1000000-...-001  Minh Trần
```
**searchSunners "Minh" — stats step (200):**
```
profile_id=a1000000-...-001  kudos_received=6
```

---

## getSidebarStats — `single()` → `maybeSingle()`

`getSidebarStats` was already using the correct two-query pattern (no FK embed). Changed `.single()` to `.maybeSingle()` to avoid throwing when a profile has no stats row yet (new user with zero kudos).

**Live REST validation (Minh Trần, userId=a1000000-...-001):**
```json
[{"kudos_sent":5,"kudos_received":6,"hearts_received":8}]
```
Expected: kudos_received=6, kudos_sent=5, hearts_received=8. Confirmed.

**`getRecentPromotions`** — already implemented with two-query pattern (stats → kudos timestamps → profiles). No FK embeds. Not modified.

---

## Build and test results

```
pnpm exec tsc --noEmit   → 0 errors
pnpm build               → ✓ Compiled successfully (Turbopack, 2.8s)
pnpm test                → 26 test files, 334 tests passed, 0 failed
```

All 334 existing tests continue to pass. The unit tests in `kudos.test.ts` test pure hydration functions (which are unchanged) — no mock query strings asserted, so no test updates were needed.

---

## Files modified

| File | Change |
|------|--------|
| `lib/kudos/queries.ts` | Removed `kudo_heart_counts` embed from `KUDO_SELECT`; added `fetchHeartCounts` + `mergeHeartCounts` helpers; rewrote `getHighlightKudos` for true global top-5; applied two-query merge to `getKudosPage` |
| `lib/kudos/spotlight-queries.ts` | Rewrote `getSpotlightNodes` and `searchSunners` to two-query + JS-merge pattern; removed all `!fkey` embed hints |
| `lib/kudos/sidebar-queries.ts` | Changed `.single()` → `.maybeSingle()` in `getSidebarStats` |

---

**Status:** DONE
**Summary:** All three PGRST200 bugs fixed. Feed, highlight (true top-5), spotlight, search, and sidebar stats validated against live local Supabase REST API. Build clean, 334 tests green.
**Concerns:** None. The getHighlightKudos candidate cap of 200 is generous for the current seed (40 kudos) and appropriate for event scale.
