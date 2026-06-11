# Code Review — Sun* Kudos Live Board

**Branch:** feat/sun-kudos-live-board  
**Reviewer:** Staff Engineer (reviewer agent)  
**Date:** 2026-06-06  
**Waves reviewed:** B1 (data foundation) + Track A (UI) + Track B (logic) + C1 (integration)

---

## Scope

| Category | Files |
|----------|-------|
| Migration + RLS + views | `supabase/migrations/20260606000000_kudo_likes.sql` |
| Data layer | `lib/kudos/*.ts` (12 files) |
| API routes | `app/api/kudos/**` (6 routes) |
| UI + integration | `app/(public)/sun-kudos/**` (12 components + page.tsx) |
| Providers | `app/providers.tsx`, `lib/query/query-client.ts`, `lib/supabase/realtime.ts` |
| i18n | `messages/vi.json`, `messages/en.json` |

LOC (new): ~1 500 lines of production code, ~500 lines test.

---

## Overall Assessment

Solid implementation for a v1. Security baseline is good (RLS, defense-in-depth server check, JWT verification path). Business rules for likes are correctly implemented at both the DB and API layer. The architecture is clean. There are **four genuine defects** that need fixing before ship, plus several important issues.

---

## Critical Issues

### C1 — `REPLICA IDENTITY FULL` absent from migration

**File:** `supabase/migrations/20260606000000_kudo_likes.sql`  
**Severity:** Critical

The migration adds `kudo_likes` to the Supabase Realtime publication but **never sets `REPLICA IDENTITY FULL`** on the table. PostgreSQL default (`REPLICA IDENTITY DEFAULT`) only includes the primary key columns in the replication stream. For DELETE events, `payload.old` will contain only `{ id: <bigint> }` — **not `kudo_id` or `user_id`**.

The DELETE handler in `kudos-board.tsx:138` reads `payload.old as { kudo_id?, user_id? }`. Without REPLICA IDENTITY FULL, `row.kudo_id` is always `undefined`, the guard `if (!row?.kudo_id) return` fires, and **no live heart-count decrements ever happen** for any user. The `onSettled` invalidation in `useToggleLike` will eventually correct the count for the liker themselves, but all other viewers' caches stay stale until a manual refresh.

The C1 implementer report explicitly flags this as unresolved. The tester confirms it was never validated against a live DB.

**Fix — add to migration after the table creation:**
```sql
alter table public.kudo_likes replica identity full;
```

---

### C2 — `baseUrl` prop accepted but never used; hydration mismatch in copy-link URLs

**Files:** `app/(public)/sun-kudos/_components/kudos-board.tsx:48,54-58`, `_components/highlight/highlight-card.tsx:156`, `_components/feed/kudo-post-card.tsx:170`  
**Severity:** Critical (React hydration error + wrong URLs in SSR)

`KudosBoardProps` declares `baseUrl: string` and `page.tsx` passes it correctly from server-injected headers. But `KudosBoard` **destructures only `{ currentUserId, hashtagOptions, departmentOptions }`** — `baseUrl` is silently dropped.

As a result, both `HighlightCard` and `KudoPostCard` fall back to:
```tsx
url={`${typeof window !== "undefined" ? window.location.origin : ""}/sun-kudos?kudo=${card.id}`}
```

In Next.js App Router, "use client" components are still **SSR-rendered on the server** during the initial HTML pass. On the server, `typeof window === "undefined"`, so the URL becomes `"/sun-kudos?kudo=..."` (no origin). On hydration, the client replaces it with `"https://host/sun-kudos?kudo=..."`. This is a **React hydration mismatch** that will log warnings in production and potentially cause double-renders. The copy-link feature also produces a broken relative URL if copied before hydration.

**Fix:** Destructure `baseUrl` in `KudosBoard` and thread it as a prop to `HighlightCard` and `KudoPostCard`.

---

## High Priority

### H1 — Cursor pagination injects untrusted strings into PostgREST `.or()` filter

**File:** `lib/kudos/queries.ts:156-159`, `app/api/kudos/feed/route.ts:38-41`  
**Severity:** High (correctness/reliability — not SQL injection)

The feed cursor is built directly from URL query params with no validation:
```ts
query = query.or(
  `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
);
```

`cursor.createdAt` and `cursor.id` are strings taken verbatim from `searchParams`. PostgREST parses the `.or()` argument as its own filter DSL — a malformed value like `cursorCreatedAt=2024-01-01)--` can break the filter string parsing and cause either a 4xx from PostgREST (surfaced as 500 to the client) or silently wrong results. This is **not SQL injection** (PostgREST prevents that) but it is an input validation gap that can cause denial of service via crafted pagination requests.

**Fix:** Validate `cursorCreatedAt` against ISO 8601 format and `cursorId` against UUID regex in the route handler before passing to the query function.

```ts
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (cursorCreatedAt && !ISO_RE.test(cursorCreatedAt)) {
  return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
}
```

### H2 — `departmentId` accepts `NaN` from malformed query param

**Files:** `app/api/kudos/feed/route.ts:33-35`, `app/api/kudos/highlight/route.ts:22-24`  
**Severity:** High (query correctness)

```ts
const departmentId = deptParam !== null && deptParam !== "" ? Number(deptParam) : null;
```

`Number("abc") === NaN`, and `NaN !== null` is `true`, so the filter becomes `{ departmentId: NaN }`. In `applyFilters`:
```ts
if (filter.departmentId !== null) {
  query = query.eq("recipient.department_id", filter.departmentId); // eq(..., NaN)
}
```

PostgREST receives `department_id=eq.NaN` which may return 0 rows or a 400 error depending on the version — either way, incorrect behavior. The `limit` param correctly guards with `Number.isFinite()` but `departmentId` doesn't.

**Fix:**
```ts
const departmentId = deptParam !== null && deptParam !== "" && Number.isInteger(Number(deptParam))
  ? Number(deptParam) : null;
```

### H3 — `getRecentPromotions` unbounded IN() on potentially large profile set

**File:** `lib/kudos/sidebar-queries.ts:157-194`  
**Severity:** High (performance — could become critical at scale)

Step 1 fetches all profiles with `kudos_received IN (10, 20, 50)` — no LIMIT. In a system with many kudos where large numbers of profiles cross these tier boundaries, `profileIds` could be hundreds of IDs. Steps 2 and 3 then run `.in("recipient_id", profileIds)` and `.in("id", profileIds)` — both unbounded. Supabase/PostgREST truncates large URL query strings at ~8KB, so requests silently fail or return partial results once `profileIds` exceeds ~200 entries.

The fix is to add `.limit(limit)` (default 10) to Step 1, since we only need the `limit` most-recently-promoted profiles anyway:

```ts
.from("profile_kudo_stats")
.select("profile_id, kudos_received")
.in("kudos_received", TIER_BOUNDARIES as unknown as number[])
.limit(50); // generous cap — still sliced to `limit` in Step 4
```

### H4 — `profile_kudo_stats` and `kudo_heart_counts` views have no explicit grants

**File:** `supabase/migrations/20260606000000_kudo_likes.sql`  
**Severity:** High (functionality — views will be inaccessible via PostgREST)

Both views are created but no `GRANT SELECT ON public.kudo_heart_counts TO authenticated;` / `anon;` is issued. In Supabase's default PostgREST setup, the `postgres` role owns the views, but the `authenticated` and `anon` roles need explicit SELECT grants to access them via the REST API. Without grants, any query that joins `kudo_heart_counts` (e.g., every `getHighlightKudos` and `getKudosPage` call) returns a PostgREST 403, crashing the board on first load.

**Fix:**
```sql
grant select on public.kudo_heart_counts to authenticated, anon;
grant select on public.profile_kudo_stats to authenticated, anon;
```

This is the single most likely reason the board would fail in production after migration.

---

## Medium Priority

### M1 — `liked` flag always `false` on SSR hydration; no client-side correction

**Files:** `lib/kudos/hydrate.ts:66`, `app/(public)/sun-kudos/page.tsx:46-86`  
**Severity:** Medium (UX correctness)

`hydrateKudoCard` defaults `viewerLiked` to `false`. The server prefetch at page load has no knowledge of the current user's like status per kudo (no per-user like query is run). On first render, all heart buttons appear unliked — even for kudos the user has already liked. The state only corrects itself if the user interacts (toggle) or if a realtime event fires.

This was a known concern deferred in C1 with the note "accurate `liked` state requires per-user SSR or a client-side kudo_likes fetch after mount." The current behavior is acceptable for v1 as a conscious trade-off but should be documented as a known UX limitation in the component JSDoc, not just in reports.

### M2 — Cursor tie-breaking unreliable with random UUID v4

**File:** `lib/kudos/queries.ts:156-159`  
**Severity:** Medium (rare pagination inconsistency)

`kudos.id` is `uuid primary key default gen_random_uuid()`. The cursor uses `id.lt.${cursor.id}` as a tie-breaker when two kudos share the same `created_at` millisecond. Random v4 UUIDs have no temporal ordering — lexicographic `<` comparison on UUID text representation doesn't reflect insertion order, so a kudo could appear on two consecutive pages or be skipped entirely when timestamps collide.

In practice with millisecond precision this is rare, but it will occasionally cause duplicate items in the infinite scroll. Fix: either switch to `bigserial` id for tie-breaking, or add a `txid_current()` / `xmin` tiebreaker, or accept it as a v1 known limitation and add a `Map`-based deduplication by `id` in the client's `flatMap` of pages.

### M3 — `scoreLabel` in `LeaderboardList` not i18n'd; passed as hardcoded VN string

**File:** `app/(public)/sun-kudos/_components/kudos-board.tsx:215,221`  
**Severity:** Medium (i18n gap)

```tsx
<LeaderboardList scoreLabel="kudos nhận được" ... />
<LeaderboardList scoreLabel="quà đã nhận" ... />
```

These strings are passed from the container component — they bypass next-intl. English locale users will always see Vietnamese text here. The i18n keys exist in `messages/*.json` but are not used for these labels.

### M4 — Hashtag filter missing `!inner` in select string (fragile PostgREST behavior)

**File:** `lib/kudos/queries.ts:19-33`, `applyFilters`  
**Severity:** Medium (correctness, PostgREST version-dependent)

The `KUDO_SELECT` string uses `kudo_hashtags ( hashtags ( name ) )` (outer embed). The comment in `applyFilters` says "filter on related table via !inner join" but the select does NOT use the `!inner` modifier. In PostgREST 11+ / supabase-js v2, applying `.eq()` on an outer-joined embedded resource does filter the parent rows (inner-join semantics for filtering), but this behavior is not guaranteed across PostgREST versions and is not obvious from the code.

The correct and explicit approach is to change the select to `kudo_hashtags!inner ( hashtags!inner ( name ) )` when a hashtag filter is active. Alternatively, use a subquery filter via PostgREST's `not.is.null` pattern.

### M5 — `profile_kudo_stats` view: correlated subqueries per row at scale

**File:** `supabase/migrations/20260606000000_kudo_likes.sql:57-74`  
**Severity:** Medium (performance)

`profile_kudo_stats` uses three correlated subqueries per profile row. For spotlight (up to 150 nodes) and leaderboard (10 rows), this materializes 150–160 × 3 = ~450+ subquery executions per page load. With a modest user base (hundreds of profiles) this is fine; at thousands it becomes expensive because the view is non-materialized. Note this for future optimization.

---

## Low Priority / Nit

### N1 — 22+ hardcoded Vietnamese strings in leaf components (project standard violation)

**Files:** All `_components/**` leaf files  
**Severity:** Nit (project standard: all visible strings via next-intl)

The C1 report acknowledges this and explains the keys exist in `messages/*.json` but leaf components were not updated. Quantifying: ~22 rendered hardcoded VN strings across 7 components (sidebar labels, button text, empty states, aria-labels, placeholders). English locale users see Vietnamese text in the sidebar stats, "Xem chi tiết", "Ẩn danh", "Chưa có dữ liệu", "Đang tải...", etc.

This is a polish issue, not a correctness defect. The keys exist; wiring them is a follow-on pass.

### N2 — `window.alert()` used for the "Mở quà" stub

**File:** `app/(public)/sun-kudos/_components/kudos-board.tsx:178-180`  
**Severity:** Nit

`window.alert()` is a blocking synchronous dialog that degrades UX (blocks JS execution, looks inconsistent on mobile). The existing toast infrastructure (`CopyLinkButton` has an inline toast pattern) should be used instead, or a simple `console.log` is acceptable for a documented stub.

### N3 — `any` casts without justification comments in query helpers

**Files:** `lib/kudos/queries.ts:57`, `lib/kudos/sidebar-queries.ts:118`, `lib/kudos/spotlight-queries.ts:81`  
**Severity:** Nit

Several `(row: any)` casts lack justification comments. The `supabase builder has no public generic` comment at line 57 of `queries.ts` is good — apply the same pattern elsewhere. This is a style issue per project rules but also obscures what shape the code actually expects.

### N4 — `CopyLinkButton` error silently swallowed

**File:** `app/(public)/sun-kudos/_components/ui/copy-link-button.tsx:33`  
**Severity:** Nit

```ts
} catch {
  // Clipboard API blocked — silently ignore (mobile WebView edge case)
}
```

The comment is correct — Clipboard API is legitimately blocked in some contexts. However, no feedback is shown to the user when this fails. The button silently does nothing. Consider showing a different toast ("Unable to copy — please copy the URL manually") so users aren't confused.

### N5 — `getHighlightKudos` sorts client-side instead of DB-side

**File:** `lib/kudos/queries.ts:117`  
**Severity:** Nit

```ts
rows.sort((a: any, b: any) => (b.heart_total ?? 0) - (a.heart_total ?? 0));
```

The comment says "sort client-side by heart_total desc since the view join makes server-side ordering on an aggregate difficult." This is a known workaround. For top-5 it's fine. For a future v2 that extends this to top-20, consider using a dedicated query against `kudo_heart_counts` with `ORDER BY heart_total DESC`.

---

## Adjudication of Known Concerns

### (a) SSR `liked` flag always false
**Verdict: Known limitation, acceptable for v1.** The behavior is correct in the sense that it's safe (no false "liked" shown) and corrects after interaction. Document in component JSDoc. (See M1 above.)

### (b) FK join hint `profile_kudo_stats_profile_id_fkey` — fragile?
**Verdict: Fragile but detectable.** The view `profile_kudo_stats` has no explicit FK constraint — it's a view over `profiles`, not a table. PostgREST infers join hints from FK constraints on the **underlying tables**. The hint name `profile_kudo_stats_profile_id_fkey` is guessed based on convention. If PostgREST can't resolve this, the join returns an error (not silent wrong data), so it surfaces immediately in testing. **Must be verified against the live DB with `\d profile_kudo_stats`** before first deploy. This is a pre-deploy validation item, not a code defect.

### (c) KV background image gradient fallback
**Verdict: Out of scope — acceptable for v1.** The CSS gradient fallback is correctly styled. The asset pipeline for the KV image is a follow-on.

---

## Security Assessment

| Check | Result |
|-------|--------|
| RLS on `kudo_likes` (select/insert/delete) | PASS — three policies correctly defined |
| No-self-like RLS (insert policy) | PASS — `not exists (select 1 from kudos k where k.sender_id = auth.uid())` |
| No-self-like defense-in-depth (API route) | PASS — explicit check at `like/route.ts:64` before insert |
| One-per-user constraint | PASS — `unique(kudo_id, user_id)` at DB level; 23505 handled as no-op in route |
| Like as someone else (user_id spoofing) | PASS — `user_id = auth.uid()` enforced in both RLS insert policy and route |
| Unlike someone else's like | PASS — RLS delete policy: `user_id = auth.uid()` |
| Auth on like/unlike route | PASS — `supabase.auth.getUser()` verified |
| Auth on feed/highlight/spotlight/filters routes | PASS (via proxy.ts) — proxy gates ALL non-public paths; unauthenticated requests are 307'd to /login before reaching route handlers |
| Hashtag input injection | PASS — supabase-js parameterizes `.eq()` values; not SQL injectable |
| Service-role key client-exposed | PASS — `NEXT_PUBLIC_SUPABASE_ANON_KEY` only in client; no service role key found |
| JWT verification | PASS — proxy uses `getClaims()` (local JWT verify); routes use `getUser()` (network verify) |

**One security gap:** views `kudo_heart_counts` and `profile_kudo_stats` lack `GRANT SELECT`. This is a functional blocker (H4), not a privilege escalation.

---

## Positive Observations

- RLS policies are defense-in-depth: both DB-level and application-level enforcement of self-like and ownership rules.
- The optimistic update rollback in `useToggleLike` is correct: `onMutate` snapshots, `onError` restores, `onSettled` invalidates. No double-count path.
- `Promise.allSettled` in `page.tsx` for server prefetch is the right pattern — a single DB failure doesn't crash the page.
- `createClient()` correctly uses `cookies()` async (Next.js 16 requirement), avoiding the common mistake of using the synchronous form.
- Realtime subscription cleanup on unmount is correct — all three channels cleaned up in a single `useEffect` return.
- `subscribeToTable` returns a cleanup function that calls `supabase.removeChannel(channel)` — no leak.
- The 300ms debounce on kudos INSERT realtime events is a smart optimization to avoid hammering the cache on burst inserts.
- `SearchValidationError` typed error class makes the search validation path testable and unambiguous.
- Stars tier thresholds (10/20/50) are in a single `stars.ts` constant — DRY, single source of truth.
- Cursor pagination correctly fetches `limit + 1` rows to detect next page without a COUNT query.

---

## Metrics

| Metric | Value |
|--------|-------|
| Test coverage (unit/logic) | ~95% |
| Test coverage (component isolated) | ~70% |
| Test coverage (integration/e2e) | 0% (deferred — no local Supabase) |
| TypeScript errors | 0 |
| Linting issues | 0 (per tester report) |
| Hardcoded VN rendered strings | ~22 in leaf components |
| Critical defects | 2 (REPLICA IDENTITY, baseUrl/hydration) |
| High defects | 4 (cursor injection, NaN departmentId, unbounded IN, missing grants) |
| Medium issues | 5 |
| Nit/style | 5 |

---

## Must-Fix List (Ordered by Severity)

| # | Issue | File | Severity |
|---|-------|------|----------|
| 1 | Add `alter table public.kudo_likes replica identity full;` to migration | `20260606000000_kudo_likes.sql` | Critical |
| 2 | Add `grant select on kudo_heart_counts, profile_kudo_stats to authenticated, anon;` to migration | `20260606000000_kudo_likes.sql` | Critical (functional) |
| 3 | Destructure and thread `baseUrl` through `KudosBoard` → `HighlightCard` / `KudoPostCard` | `kudos-board.tsx`, `highlight-card.tsx`, `kudo-post-card.tsx` | Critical |
| 4 | Validate `cursorCreatedAt` (ISO format) and `cursorId` (UUID format) in feed route | `app/api/kudos/feed/route.ts` | High |
| 5 | Guard `departmentId` against `NaN` in feed + highlight routes | `feed/route.ts`, `highlight/route.ts` | High |
| 6 | Add `.limit(50)` to `getRecentPromotions` Step 1 profile_kudo_stats query | `lib/kudos/sidebar-queries.ts` | High |
| 7 | Verify `profile_kudo_stats_profile_id_fkey` hint works on live DB before first deploy | `lib/kudos/spotlight-queries.ts`, `sidebar-queries.ts` | Pre-deploy validation |

Items 1, 2, 3 are **hard blockers**. Items 4, 5, 6 are important but the failure modes are observable errors rather than silent data corruption.

---

## Unresolved Questions

1. Does PostgREST on the Supabase project version support the `.eq()` on outer-embedded resource behavior (M4)? Needs live-DB test with `?kudo_hashtags.hashtags.name=eq.test`.
2. Is `profile_kudo_stats` actually a view that PostgREST recognizes as having an FK to `profiles.id`? The FK is implicit (view column named `profile_id` aligned to `profiles.id`) — PostgREST may or may not auto-discover this. The hint may need to be different.
3. After fixing `baseUrl` threading, the `CopyLinkButton`'s `url ?? window.location.href` fallback in the component itself should also be guarded — but once `baseUrl` is correctly threaded, no one uses the fallback path.

---

**Score: 6.5 / 10**

The core business logic (RLS, like rules, realtime, cursor pagination) is correctly designed. The critical defects are all mechanical omissions (one missing SQL line, one unused prop) rather than design flaws — they're fixable in under an hour. The functional blocker (H4: missing grants) would cause a 100% failure rate on first deploy if the Supabase default doesn't auto-grant views (which it doesn't for new views).

**Status:** DONE_WITH_CONCERNS  
**Ship verdict: NO-SHIP until items 1, 2, 3 above are fixed.**  
Items 1 and 2 are a single additional SQL block in the migration. Item 3 is a one-line destructuring fix + prop threading. All are mechanical, low-risk changes. After those three fixes, the code is shippable with the medium/nit items tracked as follow-on work.

---

## Re-review 260606-1602

**Reviewer:** Staff Engineer (reviewer agent)  
**Date:** 2026-06-06  
**Branch:** feat/sun-kudos-live-board (post-fix pass)  
**Source fix report:** plans/reports/implementer-260606-1342-review-fixes.md

### Per-Item Verdict

| # | Item | File:Line | Result |
|---|------|-----------|--------|
| C1 | `alter table public.kudo_likes replica identity full;` | `supabase/migrations/20260606000000_kudo_likes.sql:80` | **PASS** |
| H1 | `grant select on public.kudo_heart_counts to authenticated, anon;` + `profile_kudo_stats` | `supabase/migrations/20260606000000_kudo_likes.sql:86-87` | **PASS** |
| C2 | `baseUrl` destructured in `KudosBoard`, threaded to `HighlightCarousel` → `HighlightCard` and `KudosFeed` → `KudoPostCard`; `window.location.origin` fallbacks removed from cards | `kudos-board.tsx:56`, `highlight-carousel.tsx:34,49`, `highlight-card.tsx:28,161`, `kudos-feed.tsx:33,48`, `kudo-post-card.tsx:27,49,175` | **PASS** |
| H2 | `ISO_RE` + `UUID_RE` constants at module scope; guards return 400 before cursor is passed to query | `app/api/kudos/feed/route.ts:22-23,47-52` | **PASS** |
| H3 | `Number.isFinite(Number(deptParam))` guard in both routes | `app/api/kudos/feed/route.ts:36`, `app/api/kudos/highlight/route.ts:24` | **PASS** |
| H4 | `.limit(50)` on Step-1 `profile_kudo_stats` query | `lib/kudos/sidebar-queries.ts:163` | **PASS** |
| i18n | All ~22 hardcoded VN strings replaced; spot-checked `highlight-card.tsx`, `kudo-post-card.tsx`, `kudos-feed.tsx`, `kudos-board.tsx` (scoreLabel); all 4 new keys present in both `messages/vi.json` + `messages/en.json` | multiple | **PASS** |

### Notes on Each Item

**C1** — `REPLICA IDENTITY FULL` placed after view definitions and before the publication block (`:76-80`). Ordering is correct: the table exists, then identity is set, then it is added to the publication.

**H1** — Grants placed in their own named section (`:82-87`) with explanatory comments. Pattern matches the existing `rls_policies.sql` convention. Base-table grants for `kudo_likes` are handled separately via the RLS section. No collision.

**C2** — The `window.location.href` fallback remaining in `copy-link-button.tsx:31` is the `url ?? window.location.href` safety net when `url` prop is omitted. This is intentional and acceptable: once `baseUrl` is correctly threaded (it is), no production caller omits `url`. The concern from the original review (SSR mismatch in cards) is resolved.

**H2** — Both `cursorCreatedAt` and `cursorId` validated with regexes before the `PageCursor` object is constructed (`route.ts:54-55`). `null` / missing params still produce a first-page (no cursor) — correct.

**H3** — `Number.isFinite` guard matches the existing `limit` guard pattern; `NaN` now falls through to `null`. Applied in both `feed/route.ts` and `highlight/route.ts`.

**H4** — `.limit(50)` correctly placed on Step 1 only (`:163`). Steps 2 and 3 still use `.in()` with up to 50 IDs — well within the ~200-entry PostgREST URL cap. Step 4 slices to `limit` (default 10).

**i18n** — All 10 spot-checked `Home.kudosPage.*` keys present in both locale files. Components using `useTranslations` are all `"use client"` — no SSR/client boundary violations introduced. `stars-indicator.tsx` also correctly has `"use client"` per the fix report.

### Regressions Introduced

None found. The `window.location.href` in `copy-link-button.tsx` is an intentional fallback, not a regression. The `"use client"` additions (banner, stars-indicator) are necessary for `useTranslations` and consistent with the existing pattern in all other leaf components.

### Build / Test Results

| Check | Result |
|-------|--------|
| `pnpm exec tsc --noEmit` | 0 errors |
| `pnpm build` | Success — 15 routes, all ƒ Dynamic |
| `pnpm test` | 334 / 334 passed (26 test files) |

---

**Updated score: 8.5 / 10**

All 2 critical + 4 high defects are correctly resolved. The i18n pass is complete and does not introduce SSR regressions. Build and full test suite are green. Remaining open items (M1 SSR liked-flag doc note, M2 UUID cursor comment, M3–M5 medium issues, N1–N5 nits) are non-blocking and appropriately tracked.

**Status:** DONE  
**Ship verdict: SHIP** — blockers cleared, no regressions, build clean.
