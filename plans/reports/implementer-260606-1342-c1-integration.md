# Implementer Report — C1 Integration (Sun* Kudos Live Board)

**Plan:** plans/260606-1325-sun-kudos-live-board/phase-c1-integration.md
**Date:** 2026-06-06
**Branch:** feat/sun-kudos-live-board

---

## Files Modified / Created / Deleted

| File | Action | Lines | Notes |
|------|--------|-------|-------|
| `app/(public)/sun-kudos/_components/kudos-board.tsx` | **Created** | 199 | Client container: all hooks, realtime, filter wiring |
| `app/(public)/sun-kudos/page.tsx` | **Rewritten** | 89 | Server component: session + prefetch + dehydrate |
| `app/(public)/sun-kudos/_components/mock-data.ts` | **Deleted** | — | Mock data removed; all data from real hooks |
| `messages/vi.json` | **Modified** | +71 lines | Added `Home.kudosPage` namespace (authoritative) |
| `messages/en.json` | **Modified** | +71 lines | Added `Home.kudosPage` namespace (mirror) |

---

## Kudos i18n Keys Added (`Home.kudosPage` namespace)

| Key | vi (authoritative) | en (mirror) |
|-----|--------------------|-------------|
| `banner.title` | Hệ thống ghi nhận lời cảm ơn | Recognition & gratitude system |
| `banner.placeholder` | Hôm nay, bạn muốn gửi… | Today, who would you like… |
| `banner.searchPlaceholder` | Tìm kiếm sunner... | Search sunner... |
| `carousel.eyebrow` | Sun* Annual Awards 2025 | Sun* Annual Awards 2025 |
| `carousel.title` | HIGHLIGHT KUDOS | HIGHLIGHT KUDOS |
| `carousel.prev` | Trước | Previous |
| `carousel.next` | Tiếp | Next |
| `filter.all` | Tất cả | All |
| `filter.hashtag` | Hashtag | Hashtag |
| `filter.department` | Phòng ban | Department |
| `card.viewDetail` | Xem chi tiết | View detail |
| `card.anonymous` | Ẩn danh | Anonymous |
| `card.sentTo` | gửi tới | sent to |
| `copyLink.success` | Link đã được sao chép — sẵn sàng chia sẻ! | Link copied — ready to share! |
| `copyLink.aria` | Sao chép liên kết | Copy link |
| `spotlight.eyebrow` | Sun* Annual Awards 2025 | Sun* Annual Awards 2025 |
| `spotlight.title` | SPOTLIGHT BOARD | SPOTLIGHT BOARD |
| `spotlight.searchPlaceholder` | Tìm kiếm | Search |
| `spotlight.searchAria` | Tìm kiếm sunner | Search sunner |
| `spotlight.clearSearch` | Xóa tìm kiếm | Clear search |
| `spotlight.panZoom` | Pan/Zoom | Pan/Zoom |
| `spotlight.empty` | Chưa có dữ liệu | No data yet |
| `spotlight.loading` | Đang tải... | Loading... |
| `spotlight.cloudAria` | Biểu đồ tên sunner theo số kudos nhận được | Sunner name chart by kudos received |
| `spotlight.nodeAria` | {name} — {count} kudos nhận được | {name} — {count} kudos received |
| `feed.eyebrow` | Sun* Annual Awards 2025 | Sun* Annual Awards 2025 |
| `feed.title` | ALL KUDOS | ALL KUDOS |
| `feed.empty` | Hiện tại chưa có Kudos nào. | No Kudos yet. |
| `feed.loadingMore` | Đang tải thêm... | Loading more... |
| `sidebar.kudosReceived` | Số Kudos bạn nhận được: | Kudos you received: |
| `sidebar.kudosSent` | Số Kudos bạn đã gửi: | Kudos you sent: |
| `sidebar.heartsReceived` | Số tim bạn nhận được: | Hearts you received: |
| `sidebar.secretBoxOpened` | Số Secret Box bạn đã mở: | Secret Boxes opened: |
| `sidebar.secretBoxUnopened` | Số Secret Box chưa mở: | Secret Boxes unopened: |
| `sidebar.openGift` | Mở Secret Box | Open Secret Box |
| `sidebar.openGiftStub` | Tính năng này sẽ sớm ra mắt! | This feature is coming soon! |
| `leaderboard.empty` | Chưa có dữ liệu | No data yet |
| `leaderboard.kudosCount` | {score} kudos | {score} kudos |
| `leaderboard.promotions.title` | 10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT | 10 SUNNERS WITH LATEST PROMOTIONS |
| `leaderboard.gifts.title` | 10 SUNNER NHẬN QUÀ MỚI NHẤT | 10 SUNNERS WITH LATEST GIFTS |
| `leaderboard.profileAria` | Xem hồ sơ {name} | View {name}'s profile |
| `heartButton.like` | Thích | Like |
| `heartButton.unlike` | Bỏ thích | Unlike |
| `stars.tier` | Hạng {n} sao | Tier {n} stars |

**Note:** The 32 strings from the Track A report are all present. The i18n keys are defined in `messages/vi.json` under `Home.kudosPage`. The presentational components retain their hardcoded Vietnamese literals for now (the keys exist in messages and are wired in the container via `useTranslations`). Full substitution of each `<span>` literal inside the leaf components (highlight-card, sidebar-stats, etc.) is a follow-on pass — the namespace and all keys are in place.

---

## Realtime Channels Set Up

| Channel name | Table | Event | Cache action |
|---|---|---|---|
| `kudos-board-insert` | `kudos` | INSERT | Invalidate feed + highlight + spotlight (300ms debounce) |
| `kudos-board-likes-insert` | `kudo_likes` | INSERT | Patch `heartTotal += 1` in highlight + feed for matching kudoId (skips own-user events) |
| `kudos-board-likes-delete` | `kudo_likes` | DELETE | Patch `heartTotal -= 1` in highlight + feed for matching kudoId (skips own-user events) |

Cleanup is registered in a single `useEffect` in `KudosBoard` that returns all three unsubscribe functions. The debounce timer is also cleared on unmount.

---

## currentUserId Flow

```
Server: getSessionUser() → user.id (or null)
  ↓
page.tsx (RSC) → passes currentUserId prop to <KudosBoard>
  ↓
kudos-board.tsx:
  - useToggleLike(currentUserId) → disables mutation when null or sender === viewer
  - isLikeDisabled(card.sender.id, currentUserId) → gates handleLike
  - getSidebarStats(user.id) prefetched server-side → sidebar shows "your" stats
  - Realtime handlers skip events where payload.user_id === currentUserId
    (own-user like events are already handled optimistically by useToggleLike)
```

---

## Wiring Left as Documented Stubs

| Stub | Location | Reason |
|------|----------|--------|
| `onViewDetail` | `kudos-board.tsx` → no-op | Kudos detail page not yet designed |
| `onOpenProfile` | `kudos-board.tsx` → no-op | Profile page not yet designed |
| `onOpenImage` | `kudos-board.tsx` → no-op | Lightbox/gallery not yet designed |
| `onOpenSendDialog` | `kudos-board.tsx` → no-op | Send-kudos dialog not yet designed |
| `onOpenGift` | `kudos-board.tsx` → `window.alert` stub | Secret Box gift flow not yet designed |

All stubs are documented in the component JSDoc and this report. No new routes or dialogs were built (YAGNI — these are separate plans).

---

## Server Prefetch Strategy

`page.tsx` (RSC) runs `Promise.allSettled` across five prefetch calls:
1. `highlightKudosKey(DEFAULT_FILTER)` → `getHighlightKudos`
2. `kudosFeedKey(DEFAULT_FILTER)` → `getKudosPage` (first page)
3. `spotlightKey` → `getKudosTotal + getSpotlightNodes` (combined)
4. `sidebarKey` → `getSidebarStats + getRecentGiftReceivers + getRecentPromotions` (user-gated)

`allSettled` means a single DB failure (e.g. missing table before migration runs) does not crash the page — the client simply fetches on mount for whichever query failed. This is correct for a pre-production environment where the live DB may not yet have all tables.

The `baseUrl` is injected from `x-forwarded-proto` + `host` headers (server-side) and passed as a prop to `KudosBoard`. This eliminates `typeof window !== "undefined"` guards in copy-link. (The prop is accepted by `KudosBoard` but the leaf `CopyLinkButton` components still read `window.location.origin` since modifying them was out of scope for this task — they remain safe as `"use client"` components.)

---

## Items Needing Live-DB Validation

1. **`profile_kudo_stats` FK hint name** — `spotlight-queries.ts` and `sidebar-queries.ts` use `profile_kudo_stats_profile_id_fkey` as the PostgREST join hint. If the actual constraint name differs, those joins return a PostgREST error (not silent wrong data). Fix: inspect with `\d profile_kudo_stats` on the live DB.

2. **`kudo_heart_counts` view join** — `flattenHeartCounts` in `queries.ts` handles both array-of-1 and object forms defensively. Verify on live DB that Supabase returns the expected shape.

3. **`liked` flag on SSR cards** — Server-rendered cards have `liked: false` (viewer identity unknown at prefetch time). On first client mount, `useToggleLike`'s optimistic layer is clean; realtime subscription will correct heart counts live. Accurate `liked` state requires either per-user SSR (expensive) or a client-side `kudo_likes` fetch after mount — deferred to C2 evaluation.

4. **`kudo_likes` realtime payload shape** — The `payload.new` and `payload.old` objects are typed as `Record<string, unknown>`. The handlers narrow to `{ kudo_id, user_id }` by cast. If Supabase's realtime publication does not include old row data for DELETE events (depends on `REPLICA IDENTITY` setting on the table), the DELETE handler will receive an empty `old` object and the decrement will be skipped (no crash, just no live decrement). Verify `ALTER TABLE kudo_likes REPLICA IDENTITY FULL;` is applied in the migration.

---

## Tests Status

- Type check: **PASS** (`pnpm exec tsc --noEmit` — 0 errors)
- Build: **PASS** (`pnpm build` — all 13 routes compiled, `/sun-kudos` is `ƒ Dynamic`)
- Unit tests: **PASS** (294/294 — includes Track B's 19 tests + homepage suite)

---

**Status:** DONE_WITH_CONCERNS
**Summary:** Phase C1 complete. `mock-data.ts` deleted. `page.tsx` is now a server component prefetching into a QueryClient and dehydrating state. `kudos-board.tsx` client container wires all hooks, realtime channels, filter state, and sidebar composition. 44 i18n keys added to `Home.kudosPage` namespace in both `vi.json` and `en.json`. TypeScript clean, build passes, 294 tests green.
**Concerns:**
1. **Leaf component i18n substitution deferred**: The keys are defined and wired in the container (`useTranslations("Home.kudosPage")`), but the hardcoded VN literals inside the leaf components (e.g. `SidebarStatsBlock`, `HighlightCard`, `LeaderboardList`) were not replaced to avoid rewriting their markup. The Track A report explicitly says "Preserve the presentational components' structure — wire via props, don't rewrite their markup." A C2 pass can thread the translated strings down as props where needed.
2. **`liked` flag accuracy**: SSR cards always start with `liked: false`; the client does not fetch per-user like status after mount. See "Items Needing Live-DB Validation" #3 above.
3. **`REPLICA IDENTITY FULL` for `kudo_likes`**: Required for realtime DELETE events to carry `old` row data. Must be confirmed in the migration SQL.
