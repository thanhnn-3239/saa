# Phase B2 — Feed & Filters Data

**Track:** B (data/logic) · **Priority:** High · **Status:** ✅ done · **Depends on:** B1

## MoMorph refs
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: ../260606-1325-sun-kudos-live-board/clarifications.md

## Overview
Data access for the **Highlight** carousel (B), the **All Kudos** infinite feed (C), and the
**Hashtag/Department filter** dropdowns (B.1.1/B.1.2). A selected filter applies to BOTH lists and
resets the carousel to page 1.

## Key insights
- Highlight = TOP 5 published kudos ordered by `heart_total` desc (join `kudo_heart_counts`), then recent.
- All Kudos = cursor pagination `(created_at desc, id desc)` so realtime inserts prepend cleanly.
- Filters = optional `hashtagId` and/or `departmentId`; department filter matches kudos whose **recipient**'s `department_id` matches (spec: filter by phòng ban). Hashtag filter via `kudo_hashtags`.
- Dropdown lists are queried live from DB (`hashtags`, `departments`) per specs B.1.1/B.1.2.

## Related code files
**Create**
- `lib/kudos/queries.ts` — server-safe query fns: `getHighlightKudos(filter)`, `getKudosPage({cursor, limit, filter})`, `getHashtags()`, `getDepartments()`.
- `lib/kudos/hydrate.ts` — shape a kudos row + joins into the `KudoCard` type (sender/recipient briefs, hearts, hashtags, images, stars).
- `lib/kudos/use-kudos-feed.ts` — `useInfiniteQuery` hook (client) wrapping `getKudosPage`, keyed by filter.
- `lib/kudos/use-highlight-kudos.ts` — `useQuery` hook for top-5, keyed by filter.
- `lib/kudos/use-filters.ts` — filter state (selected hashtag/department) shared by highlight + feed.
**Modify**
- `app/(public)/sun-kudos/page.tsx` — server component prefetches highlight + first feed page + dropdown lists into a dehydrated QueryClient.

## Implementation steps
1. Write `getKudosPage` with explicit select of joins (sender profile, recipient profile, hashtags, images) + `kudo_heart_counts`; apply hashtag/department filters; cursor on `(created_at,id)`.
2. `getHighlightKudos`: same shape, `order by heart_total desc` limit 5, filter-aware.
3. `getHashtags` / `getDepartments`: id+name, ordered by name; only tags/depts actually in use if cheap.
4. `hydrate.ts`: map raw rows → `KudoCard` (truncation handled in UI; compute stars via `lib/kudos/stars.ts`).
5. Client hooks with TanStack Query; query keys include the filter object so changing a filter refetches both highlight + feed and resets carousel page (UI reads page from highlight result).
6. Server prefetch + `dehydrate` in `page.tsx`; client hydrates (no flash).
7. Build/typecheck.

## Todo
- [x] `getKudosPage` cursor query + filters
- [x] `getHighlightKudos` top-5 by hearts + filters
- [x] `getHashtags` / `getDepartments`
- [x] `hydrate.ts` → KudoCard mapping (+ stars)
- [x] `useInfiniteQuery` feed hook + `useQuery` highlight hook + filter state
- [x] Server prefetch/dehydrate in page.tsx
- [x] Build/typecheck green

## Success criteria
- Feed paginates without dupes/gaps; empty result → empty-state signalled to UI.
- Highlight returns ≤5 sorted by hearts; respects active filter.
- Selecting a hashtag/department filters BOTH lists; clearing restores all.

## Security
- Read-only; rely on `kudos.status='published'` + RLS. No raw SQL string interpolation — use the query builder / parameterized RPC.

## Next steps
C1 wires these hooks into A2 (highlight) and A4 (feed) and adds realtime prepend/refresh.
