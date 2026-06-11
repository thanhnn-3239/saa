# Implementation Report — Review Fixes: Sun* Kudos Live Board

**Branch:** feat/sun-kudos-live-board  
**Date:** 2026-06-06  
**Source:** reviewer-260606-1342-kudos-board.md

---

## Findings Applied

### C1 — REPLICA IDENTITY FULL

**File:** `supabase/migrations/20260606000000_kudo_likes.sql` (after line 96, before publication block)

Added:
```sql
alter table public.kudo_likes replica identity full;
```
PostgreSQL's DEFAULT replica identity only includes the PK in DELETE payloads. Without FULL, `payload.old` would contain only `{ id: bigint }`, so `payload.old.kudo_id` is always `undefined` and the board's DELETE handler could never decrement heart counts for other viewers.

---

### H1 — View grants

**File:** `supabase/migrations/20260606000000_kudo_likes.sql` (same block as C1)

Added:
```sql
grant select on public.kudo_heart_counts to authenticated, anon;
grant select on public.profile_kudo_stats to authenticated, anon;
```
Supabase does not auto-grant new views to `authenticated`/`anon`. Without these, every PostgREST query joining those views returns 403 — a 100% first-load failure rate. Pattern matches the existing `rls_policies.sql` grant convention (explicit `to authenticated` on each table/view).

---

### C2 — baseUrl threading

**Files modified:**
- `app/(public)/sun-kudos/_components/kudos-board.tsx` — destructure `baseUrl` from props, thread to `HighlightCarousel` and `KudosFeed`
- `app/(public)/sun-kudos/_components/highlight/highlight-carousel.tsx` — add `baseUrl: string` prop, pass to `HighlightCard`
- `app/(public)/sun-kudos/_components/highlight/highlight-card.tsx` — add `baseUrl: string` prop, replace `window.location.origin` fallback in CopyLinkButton url
- `app/(public)/sun-kudos/_components/feed/kudos-feed.tsx` — add `baseUrl: string` prop, pass to `KudoPostCard`
- `app/(public)/sun-kudos/_components/feed/kudo-post-card.tsx` — add `baseUrl: string` prop, replace `window.location.origin` fallback in CopyLinkButton url

All `typeof window !== "undefined" ? window.location.origin : ""` fallbacks removed. `page.tsx` already correctly injects `baseUrl` from request headers (`x-forwarded-proto` + `host`).

---

### H2 — Cursor validation

**File:** `app/api/kudos/feed/route.ts`

Added two regex constants at the module level:
```ts
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
```
Added guards before building the cursor:
- Invalid `cursorCreatedAt` → 400 with `{ error: "Invalid cursor: cursorCreatedAt must be ISO 8601" }`
- Invalid `cursorId` → 400 with `{ error: "Invalid cursor: cursorId must be a UUID" }`

Both params are still optional — omitting them returns the first page normally.

---

### H3 — departmentId NaN guard

**Files:** `app/api/kudos/feed/route.ts` (~line 31), `app/api/kudos/highlight/route.ts` (~line 22)

Changed from:
```ts
deptParam !== null && deptParam !== "" ? Number(deptParam) : null
```
To:
```ts
deptParam !== null && deptParam !== "" && Number.isFinite(Number(deptParam)) ? Number(deptParam) : null
```
Matches the existing `limit` guard pattern. `NaN` now maps to `null` (no filter applied) rather than being sent to `.eq()`.

---

### H4 — Bound getRecentPromotions Step 1

**File:** `lib/kudos/sidebar-queries.ts` (~line 159)

Added `.limit(50)` to the Step-1 `profile_kudo_stats` query. 50 is a generous cap — still sliced to the `limit` param (default 10) in Step 4. Prevents Steps 2+3 `.in()` lists from growing beyond PostgREST's ~8 KB URL length limit (~200 UUID entries).

---

### Fix 7 — i18n: All ~22 hardcoded VN strings wired through next-intl

**Components updated** (all under `app/(public)/sun-kudos/_components/**`):

| Component | Strings replaced |
|-----------|-----------------|
| `banner.tsx` | title, placeholder, searchPlaceholder aria-labels (added `"use client"`, `useTranslations`) |
| `highlight/highlight-carousel.tsx` | eyebrow, title, filter labels, prev/next aria-labels |
| `highlight/highlight-card.tsx` | anonymous, sentTo, profileAria, viewDetail |
| `feed/kudos-feed.tsx` | eyebrow, title, empty, loadingMore aria-label |
| `feed/kudo-post-card.tsx` | anonymous, sentTo, profileAria, imageAlt, viewDetail |
| `spotlight/spotlight-cloud.tsx` | eyebrow, title, searchAria, searchPlaceholder, clearSearch aria, panZoom, loading aria, empty, cloudAria, nodeAria |
| `sidebar/sidebar-stats.tsx` | kudosReceived, kudosSent, heartsReceived, secretBoxOpened, secretBoxUnopened, openGift |
| `sidebar/leaderboard-list.tsx` | empty, profileAria |
| `ui/heart-button.tsx` | like, unlike aria-labels |
| `ui/stars-indicator.tsx` | tier aria-label (also added `"use client"`) |
| `ui/copy-link-button.tsx` | aria, success toast, error toast (see fix 9) |
| `kudos-board.tsx` | M3: replaced hardcoded `scoreLabel` props for LeaderboardList |

**i18n keys ADDED** (both `messages/vi.json` + `messages/en.json`):

| Key path | vi value | en value |
|----------|----------|----------|
| `Home.kudosPage.card.imageAlt` | `"Ảnh kudo"` | `"Kudo image"` |
| `Home.kudosPage.copyLink.error` | `"Không thể sao chép — hãy sao chép URL thủ công."` | `"Unable to copy — please copy the URL manually."` |
| `Home.kudosPage.leaderboard.promotions.scoreLabel` | `"kudos nhận được"` | `"kudos received"` |
| `Home.kudosPage.leaderboard.gifts.scoreLabel` | `"quà đã nhận"` | `"gifts received"` |

All other i18n keys already existed in both files.

---

### Fix 8 — Gift stub UX (window.alert → toast)

**File:** `app/(public)/sun-kudos/_components/kudos-board.tsx`

Replaced `window.alert(t("sidebar.openGiftStub"))` with an inline toast state (`giftToast: boolean`). Toast renders fixed bottom-center with same CSS pattern as `CopyLinkButton`, auto-dismisses after 2.5 s. Timer is cleaned up on unmount via `useEffect` return.

---

### Fix 9 — Clipboard failure feedback in CopyLinkButton

**File:** `app/(public)/sun-kudos/_components/ui/copy-link-button.tsx`

Replaced `state: boolean` with `state: "idle" | "copied" | "error"`. On clipboard write failure (previously silent), now renders an error toast with `role="alert"` and `aria-live="assertive"`. Uses the new `copyLink.error` i18n key. Dismisses after 3 s (slightly longer than the success toast to ensure the user reads it).

---

### Out-of-scope doc notes applied

- **M1 SSDoc:** Added `@note` to `hydrateKudoCard` in `lib/kudos/hydrate.ts` documenting the known SSR `liked: false` limitation and the fix path.
- **M2 comment:** Added inline comment in `lib/kudos/queries.ts` at the `.or()` cursor tie-breaker documenting the UUID v4 ordering limitation.

---

## Tests Updated

Two test files required wrapping in `NextIntlClientProvider` because the components they test now call `useTranslations`:

- `tests/sun-kudos/heart-button.test.tsx` — added `renderWithIntl` wrapper
- `tests/sun-kudos/copy-link-toast.test.tsx` — added `renderWithIntl` wrapper

All assertions preserved verbatim (no weakening). Both use `messages/en.json` as the locale fixture.

---

## Test / Build Results

| Check | Result |
|-------|--------|
| `pnpm exec tsc --noEmit` | 0 errors |
| `pnpm build` | Success (15 routes, all ƒ Dynamic) |
| `pnpm test` | 334 / 334 passed |

---

**Status:** DONE  
**Summary:** All 9 must-fix items (C1, H1, C2, H2, H3, H4, i18n, gift-stub UX, clipboard error feedback) implemented. TypeScript clean, build passes, 334 tests green. M1 and M2 annotated with doc/code comments as specified.  
**Concerns:** None — all changes are mechanical with no architectural decisions required.
