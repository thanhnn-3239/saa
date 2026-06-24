# Notifications Feature — Design Spec

- **Date:** 2026-06-23
- **Status:** Approved (brainstorming) — pending implementation plan
- **Branch:** `claude/dazzling-meitner-lmxrnn`

## 1. Problem & Current State

Notifications are split: the database layer works, the application layer is a stub.

**Working (DB):**
- Table `public.notifications (id bigint identity, user_id uuid, type text, kudo_id uuid, is_read bool default false, created_at)` — `supabase/migrations/20260604070000_schema.sql:114`.
- Index `idx_notifications_user (user_id, is_read, created_at desc)`.
- RLS: `notifications read own` (select where `user_id = auth.uid()`) and `notifications update own` — `20260604070100_rls_policies.sql:63`.
- Trigger `trg_notify_on_kudo`: on `kudos` insert, inserts a `kudo_received` row for the recipient — `20260604070200_functions_triggers_views.sql:98`.
- Table published to `supabase_realtime`.

**Not working (app):**
- No API routes for notifications.
- `components/header/notification-bell.tsx` is a hardcoded placeholder: badge permanently `hidden`, panel always shows "Chưa có thông báo mới." regardless of DB contents.
- No i18n keys.

**Result:** the DB silently accumulates real notification rows that the user never sees.

## 2. Goals

Deliver the full notification experience:

1. Bell badge shows real unread count, updating **live** via Supabase Realtime.
2. Bell dropdown = quick preview of the ~5 most recent notifications + "Đánh dấu đọc tất cả" + "Xem tất cả".
3. Dedicated `/notifications` page: full, paginated list.
4. Clicking a notification marks it read and navigates to `/sun-kudos?kudo=<id>`, which opens a **kudo detail modal**.
5. i18n (vi/en).
6. Extensible `type` system: UI is ready to render a `rank_up` type (⭐ icon + style), but no generator for it is built this round (kudo_received only).

### Non-goals (this round)
- Generating `rank_up` / badge notifications (no DB trigger added). UI renders the type if rows ever appear, but nothing creates them yet.
- Email / push notifications.
- Mention notifications.

## 3. Read-State Behavior

- Clicking an individual notification → marks **that** notification read, then navigates.
- "Đánh dấu đọc tất cả" button → marks all unread read for the current user.
- Opening the panel does **not** auto-mark-read. Badge reflects genuinely-unseen items.

## 4. Architecture

Mirrors the existing `lib/kudos/` + `app/api/kudos/` conventions.

### 4.1 Database (one new migration)

**View `public.notification_feed`** (`security_invoker = true`, mirroring `user_statistics`):

Joins `notifications → kudos → profiles (sender)` to produce denormalized display fields:

| Column | Source |
|--------|--------|
| `id, user_id, type, kudo_id, is_read, created_at` | `notifications` |
| `actor_name` | sender `profiles.full_name` — **masked when the kudo is anonymous** (use `kudos.anonymous_name`, else generic) |
| `kudo_title` | `kudos.title` |

- RLS: the view runs with `security_invoker`, so the existing `notifications read own` policy applies — a user only sees their own rows. No new policy needed.
- Anonymity: if `kudos.is_anonymous`, `actor_name` MUST NOT leak the sender. Resolve to `coalesce(anonymous_name, '<generic>')` inside the view.
- Mark-read uses plain `UPDATE` through the existing `notifications update own` policy — no function required.
- Realtime is already enabled on `notifications`; no change.

### 4.2 API routes

| Route | Behavior |
|-------|----------|
| `GET /api/notifications` | Cursor-paginated list from `notification_feed`. Params: `limit` (default 20, max 50), `cursor` (last `id`, exclusive). Order `id desc`. Returns `{ items: NotificationItem[]; nextCursor: number \| null }`. Auth required. |
| `PATCH /api/notifications/[id]` | Mark one notification read (`is_read = true`). RLS enforces ownership. Returns `{ ok: true }`. |
| `POST /api/notifications/mark-all-read` | Mark all unread read for current user. Returns `{ updated: number }`. |
| `GET /api/notifications/unread-count` | `{ count }` — `head + count: exact` filtered `is_read = false`. |
| `GET /api/kudos/[id]` *(new)* | Returns a single `KudoCard` for the detail modal. Backed by new `getKudoById` in `lib/kudos/queries.ts`, reusing the existing row→`KudoCard` mapping. Auth required; respects anonymity + `ownedByViewer`. |

All routes follow the existing pattern: `createClient()` / `getSessionUser()`, 401 when unauthenticated, validate inputs before use.

### 4.3 Data layer — `lib/notifications/`

| File | Contents |
|------|----------|
| `types.ts` | `NotificationType = "kudo_received" \| "rank_up"` (string-open for future), `NotificationItem`, `NotificationsPage`, cursor type |
| `query-keys.ts` | `notificationsKey`, `unreadCountKey` (server-safe, no `"use client"`) |
| `queries.ts` | `getNotificationsPage`, `getUnreadCount` — server-safe, used by API routes + page prefetch |
| `use-notifications.ts` | `useInfiniteQuery` over the list (full page + bell preview can read the first page) |
| `use-unread-count.ts` | `useQuery` for the badge |
| `use-mark-read.ts` | mutations (single + all); optimistic badge decrement + cache update |
| `use-notifications-realtime.ts` | `subscribeToTable("notifications", "notifications", "INSERT", …)` → invalidate `notificationsKey` + `unreadCountKey`, optimistic badge bump |

### 4.4 UI

- **`components/header/notification-bell.tsx`** (rewrite):
  - Badge shows unread count from `useUnreadCount` (hidden when 0).
  - Open → preview the ~5 newest items (first page of `use-notifications`).
  - Header: title + "Đánh dấu đọc tất cả" (mark-all mutation).
  - Footer: "Xem tất cả" → `Link` to `/notifications`.
  - Mounts `use-notifications-realtime` so the badge updates live whether or not the panel is open (bell is always mounted for authenticated users).
  - Icon by `type`: 📩 mail for `kudo_received`, ⭐ star for `rank_up`.
- **`components/notifications/notification-list-item.tsx`**: shared item (panel + page). Renders icon, composed localized sentence, date, unread dot/bold. Click → mark-read + `router.push("/sun-kudos?kudo=<kudo_id>")`.
- **`app/(public)/notifications/page.tsx`**: server-prefetches first page; client infinite list ("tải thêm" load-more button); mark-all button; empty state. Adds `notifications` to `lib/navigation/routes.ts`.
- **`app/(public)/sun-kudos/_components/kudo-detail-modal.tsx`**: reads `?kudo=<id>` via `useSearchParams`; when present, fetches via `useKudoById` and renders `kudo-card-base` inside a dialog; closing removes the param. Mounted in the `/sun-kudos` board.
- **`lib/kudos/use-kudo.ts`** + `getKudoById` (queries.ts) + `GET /api/kudos/[id]`.

### 4.5 i18n

New `Notifications` namespace in `messages/en.json` + `messages/vi.json`:
- `title`, `markAllRead`, `viewAll`, `empty`, `bellAria`, `loadMore`.
- Message templates composed client-side from `type` + `actor_name`:
  - `kudoReceived`: vi "{sender} vừa gửi đến bạn lời ghi nhận đầy yêu thương!", en "{sender} just sent you a kudo!"
  - `rankUp` placeholder string for the future ⭐ type.

The notification sentence is **composed in the client** from `type` + `actor_name` (not stored), so localization works without DB changes.

## 5. Data Flow (end to end)

```
Send kudo → kudos INSERT → trg_notify_on_kudo → notifications row (kudo_received, is_read=false)
                                                      │
                          Supabase Realtime INSERT ───┤
                                                      ▼
   NotificationBell (use-notifications-realtime) → invalidate queries + bump badge
                                                      ▼
   User opens bell → preview (notification_feed, first page) → unread bold + red dot
   Click item → PATCH /api/notifications/[id] (read) → router.push(/sun-kudos?kudo=<id>)
   /sun-kudos reads ?kudo=<id> → useKudoById → kudo-detail-modal (kudo-card-base)
   "Xem tất cả" → /notifications (full paginated list)
   "Đánh dấu đọc tất cả" → POST mark-all-read → badge → 0
```

## 6. Error Handling

- API: 401 unauthenticated; 400 on malformed `limit`/`cursor`; 404 when `GET /api/kudos/[id]` finds no visible kudo; 500 with message on unexpected errors (existing pattern).
- Mark-read mutations: optimistic update with rollback on error.
- Realtime: subscription cleaned up on unmount; on reconnect, queries refetch.
- Modal: invalid/non-existent `?kudo=<id>` → show a "not found" state and a way to dismiss (strips the param).

## 7. Testing

- `queries.ts` (notifications) — pagination + unread count.
- API route tests for each notifications route + `GET /api/kudos/[id]` (mirror existing route tests).
- `NotificationBell` — replace the placeholder badge tests with real assertions (badge count, mark-all, preview render, "Xem tất cả" link).
- `notification-list-item` — icon by type, unread styling, click → mark-read + navigation.
- `/notifications` page — list render, load-more, empty state.
- i18n: `messages.test.ts` already enforces key parity between locales — new keys must exist in both.

## 8. Key Decisions & Risks

- **Anonymity leak (critical):** anonymous kudos must never expose the sender in a notification. Handled inside `notification_feed`. Must have a test.
- **Cursor:** single `id` (bigint) desc, exclusive — simpler than the kudos feed's compound `(created_at, id)` cursor.
- **Realtime placement:** in `NotificationBell` (always mounted for authed users) so the badge stays live without opening the panel.
- **Extensible types:** `type` is open text in the DB; the UI maps known types to icon/label and falls back gracefully for unknown ones.

## 9. Out of Scope (future)

`rank_up` / `badge_earned` generation (trigger on tier-crossing or `user_badges` insert), email/push, mention notifications.
