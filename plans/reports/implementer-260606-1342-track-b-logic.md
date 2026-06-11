# Implementer Report — Track B Logic (B2 / B3 / B4)

**Plan:** plans/260606-1325-sun-kudos-live-board/phase-b2/b3/b4
**Date:** 2026-06-06
**Branch:** feat/sun-kudos-live-board

---

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `lib/kudos/hydrate.ts` | 110 | Raw DB row → KudoCard / ProfileBrief / SpotlightNode / LeaderboardItem |
| `lib/kudos/queries.ts` | 170 | Server: getHighlightKudos, getKudosPage, getHashtags, getDepartments |
| `lib/kudos/use-filters.ts` | 47 | Client filter state (hashtag + departmentId) |
| `lib/kudos/use-highlight-kudos.ts` | 52 | useQuery hook for top-5 carousel |
| `lib/kudos/use-kudos-feed.ts` | 56 | useInfiniteQuery hook for all-kudos feed |
| `lib/kudos/sidebar-queries.ts` | 175 | Server: getSidebarStats, getRecentGiftReceivers, getRecentPromotions |
| `lib/kudos/use-sidebar.ts` | 75 | Client hooks: useSidebar, useSidebarStats, useRecentGiftReceivers, useRecentPromotions |
| `lib/kudos/use-toggle-like.ts` | 130 | Optimistic like/unlike mutation with rollback |
| `lib/kudos/spotlight-queries.ts` | 140 | Server: getKudosTotal, getSpotlightNodes, searchSunners + SearchValidationError |
| `lib/kudos/use-spotlight.ts` | 90 | Client hooks: useSpotlight, useSpotlightSearch |
| `lib/kudos/kudos.test.ts` | 185 | 19 unit tests covering stars/hydration/validation/cursor/weights |
| `app/api/kudos/feed/route.ts` | 45 | GET /api/kudos/feed (cursor pagination) |
| `app/api/kudos/highlight/route.ts` | 35 | GET /api/kudos/highlight (top-5) |
| `app/api/kudos/filters/route.ts` | 25 | GET /api/kudos/filters (hashtags + departments) |
| `app/api/kudos/[id]/like/route.ts` | 95 | POST/DELETE /api/kudos/[id]/like (auth + self-like guard) |
| `app/api/kudos/sidebar/route.ts` | 40 | GET /api/kudos/sidebar (stats + leaderboards) |
| `app/api/kudos/spotlight/route.ts` | 45 | GET /api/kudos/spotlight (cloud data + search mode) |

---

## Exported Hook / Function Signatures for C1 Integration

### B2 — Feed & Filters

```ts
// lib/kudos/queries.ts  (server-only)
getHighlightKudos(filter: KudosFilter): Promise<KudoCard[]>
getKudosPage({ cursor, limit, filter }): Promise<KudosPage>   // KudosPage = { items, nextCursor }
getHashtags(): Promise<{ id: number; name: string }[]>
getDepartments(): Promise<{ id: number; name: string }[]>

// lib/kudos/use-filters.ts  ("use client")
useFilters(): { filter, setHashtag, setDepartmentId, clearFilters }

// lib/kudos/use-highlight-kudos.ts  ("use client")
useHighlightKudos(filter: KudosFilter): UseQueryResult<KudoCard[]>
highlightKudosKey(filter): QueryKey   // for prefetch / invalidation

// lib/kudos/use-kudos-feed.ts  ("use client")
useKudosFeed(filter: KudosFilter, limit?: number): UseInfiniteQueryResult<KudosPage>
kudosFeedKey(filter): QueryKey   // for prefetch / invalidation
```

### B3 — Likes & Stats

```ts
// app/api/kudos/[id]/like/route.ts
// POST   → { liked: true,  heartTotal: number }
// DELETE → { liked: false, heartTotal: number }
// 401 if unauth; 422 if self-like; 404 if kudo not found

// lib/kudos/use-toggle-like.ts  ("use client")
useToggleLike(currentUserId: string | null): UseMutationResult<
  LikeResponse,
  Error,
  { kudoId, currentlyLiked, filter: KudosFilter }
>
isLikeDisabled(senderId: string, currentUserId: string | null): boolean

// lib/kudos/use-sidebar.ts  ("use client")
useSidebar(): UseQueryResult<SidebarData>     // { stats, recentGiftReceivers, recentPromotions }
useSidebarStats(): { stats: SidebarStats, isLoading, error }
useRecentGiftReceivers(): { items: LeaderboardItem[], isLoading, error }
useRecentPromotions(): { items: LeaderboardItem[], isLoading, error }
```

### B4 — Spotlight & Search

```ts
// lib/kudos/spotlight-queries.ts  (server-only)
getKudosTotal(): Promise<number>
getSpotlightNodes(cap?: number): Promise<SpotlightNode[]>
searchSunners(term: string): Promise<ProfileBrief[]>   // throws SearchValidationError
SearchValidationError  // extends Error, name = "SearchValidationError"

// lib/kudos/use-spotlight.ts  ("use client")
useSpotlight(): { total, nodes, isEmpty, isLoading, error }
useSpotlightSearch(): UseMutationResult<ProfileBrief[], Error, string>
spotlightKey: QueryKey   // for realtime invalidation
```

---

## getRecentPromotions Approximation

**Chosen approach:** "boundary snapshot" — query `profile_kudo_stats` for profiles
whose `kudos_received` equals exactly one of the tier thresholds (10, 20, 50), then
sort by the `created_at` of their most-recently-received published kudo as the
proxy "promotion timestamp."

**Rationale:** Exact tier-crossing events require a `rank_events` history table with
a trigger that fires each time a profile's `kudos_received` increments past a boundary.
That table is out of scope for v1. The approximation is accurate for the common case
(a profile receiving their 10th/20th/50th kudo one at a time) and produces a visually
correct leaderboard in the seed dataset.

**Limitation:** A profile that receives multiple kudos in one batch (jumping over a
boundary) may not appear, or may appear out of chronological order. Documented in
`sidebar-queries.ts` with a comment pointing to this report.

---

## Assumptions

1. **`profile_kudo_stats` FK name** — the view's join uses
   `profile_kudo_stats_profile_id_fkey`; if the actual constraint name differs the
   spotlight and sidebar queries' PostgREST join hints need updating. The query
   builder will return an error at runtime rather than silently wrong data.

2. **`kudo_heart_counts` join** — Supabase returns the view join as an array of 1
   object; `flattenHeartCounts` in queries.ts handles both `array[0]` and object
   forms defensively.

3. **Client hooks fetch via route handlers** — server query fns are not imported
   directly from client components (Next.js boundary). Route handlers re-use the
   same server query fns, so no logic is duplicated.

4. **`liked` flag** — server-rendered cards pass `viewerLiked = false` (viewer
   identity unknown at SSR time). C1 must patch `liked` per card after loading the
   current user's `kudo_likes` rows, or rely on the realtime subscription to correct
   the flag on first mount.

5. **`badges_count` in SidebarStats** — sourced from `user_badges` count, not
   `user_statistics` view (which has `badges_count` but lacks `hearts_received`).
   Both give the same value; `user_statistics` is ignored for the board.

---

## Test Status

- Type check: `pnpm exec tsc --noEmit` → exit 0 (no errors)
- Unit tests: 19/19 passed (`pnpm exec vitest run lib/kudos/kudos.test.ts`)
  - stars tier boundaries (4 cases)
  - hydrateKudoCard shape + nullability + fallbacks (8 cases)
  - spotlight weight normalisation (3 cases)
  - SearchValidationError class (2 cases)
  - cursor pagination logic (2 cases)

---

**Status:** DONE
**Summary:** All B2/B3/B4 deliverables implemented — 17 files created, 19 unit tests passing, TypeScript clean. Server query fns, client hooks, and route handlers are in place with clean server/client boundary separation.
**Concerns:** The `profile_kudo_stats` PostgREST foreign-key hint names (used in join selects) cannot be validated without a live Supabase instance. If the constraint names differ from the assumed pattern, those joins will fail at runtime with a PostgREST error, not a silent data error — easy to diagnose and fix by inspecting the actual constraint name in `\d profile_kudo_stats`.
