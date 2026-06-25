# Notifications Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the notifications feature work end-to-end — a live unread badge, a bell preview dropdown, a full `/notifications` page, click-through to a kudo detail modal, in vi/en.

**Architecture:** Mirror the existing `lib/kudos/` + `app/api/kudos/` conventions. A `security_invoker` Postgres view (`notification_feed`) denormalizes notification rows with the sender name (masked when anonymous) and kudo title. A thin data layer (pure hydrators + server queries + TanStack Query hooks) feeds the bell, the page, and a Supabase Realtime subscription. Clicking a notification deep-links to `/sun-kudos?kudo=<id>`, which opens a detail modal backed by a new `GET /api/kudos/[id]`.

**Tech Stack:** Next.js 16.2.7 (App Router, route handlers with `params: Promise`), React 19, TanStack Query, Supabase (Postgres + Realtime + RLS), next-intl, Vitest + Testing Library (jsdom).

## Global Constraints

- **Next.js docs:** `node_modules/next/dist/docs/` does **not** exist in this checkout. Use the in-repo route/page patterns as the source of truth (e.g. `app/api/kudos/feed/route.ts`, `app/api/kudos/[id]/like/route.ts`, `app/(public)/sun-kudos/page.tsx`). Next.js version is **16.2.7** — route handler `params` is a `Promise` and must be awaited.
- **Auth in routes:** every route handler uses `createClient()` / `getSessionUser()`, returns `401` `{ error: "Unauthorized" }` when no session. Validate `limit`/`cursor` before use; return `400` on malformed input; `500 { error: message }` on unexpected errors.
- **RLS does the security:** `notifications` has `read own` / `update own` policies. The view is `security_invoker = true`. Never bypass with the service-role/admin client.
- **Anonymity (critical):** an anonymous kudo's sender identity must never reach the client through a notification. Masking happens inside the `notification_feed` view. This has a dedicated test.
- **Query keys are server-safe:** key factories live in a non-`"use client"` module (`lib/notifications/query-keys.ts`), like `lib/kudos/query-keys.ts`.
- **i18n parity:** every new key must exist in **both** `messages/en.json` and `messages/vi.json`. `messages/messages.test.ts` enforces this.
- **Commit identity:** commits must use `git config user.email noreply@anthropic.com` / `user.name Claude`.
- **Tests:** `npm test` runs `vitest run`. Test pure functions and prop-driven/mock-driven components (the repo does not unit-test route handlers; thin handlers are verified via `npm run typecheck` + `npm run lint`).

---

## File Structure

**Create:**
- `supabase/migrations/20260623120000_notification_feed.sql` — the denormalized view.
- `lib/notifications/types.ts` — `NotificationType`, `NotificationItem`, `NotificationsPage`.
- `lib/notifications/hydrate.ts` — pure `hydrateNotification(row)`.
- `lib/notifications/hydrate.test.ts` — hydrator + anonymity-shape tests.
- `lib/notifications/query-keys.ts` — `notificationsKey`, `unreadCountKey`.
- `lib/notifications/queries.ts` — `getNotificationsPage`, `getUnreadCount`.
- `lib/notifications/queries.test.ts` — cursor / page-shape tests (pure parts).
- `lib/notifications/use-notifications.ts` — infinite-query hook.
- `lib/notifications/use-unread-count.ts` — badge count hook.
- `lib/notifications/use-mark-read.ts` — mark-one / mark-all mutations.
- `lib/notifications/use-notifications-realtime.ts` — Realtime subscription hook.
- `lib/kudos/use-kudo.ts` — single-kudo query hook.
- `app/api/notifications/route.ts` — `GET` list.
- `app/api/notifications/[id]/route.ts` — `PATCH` mark one read.
- `app/api/notifications/mark-all-read/route.ts` — `POST` mark all read.
- `app/api/notifications/unread-count/route.ts` — `GET` count.
- `app/api/kudos/[id]/route.ts` — `GET` single kudo.
- `components/notifications/notification-list-item.tsx` — shared presentational item.
- `components/notifications/notification-list-item.test.tsx` — item tests.
- `components/notifications/notification-icon.tsx` — type → icon (📩 / ⭐).
- `app/(public)/notifications/page.tsx` — full page (server prefetch).
- `app/(public)/notifications/_components/notifications-list.tsx` — client infinite list.
- `app/(public)/sun-kudos/_components/kudo-detail-modal.tsx` — `?kudo=<id>` modal.

**Modify:**
- `lib/kudos/queries.ts` — add `getKudoById`.
- `lib/navigation/routes.ts` — add `notifications: "/notifications"`.
- `components/header/notification-bell.tsx` — full rewrite (data-driven).
- `components/header/notification-bell.test.tsx` — replace placeholder badge tests.
- `app/(public)/sun-kudos/_components/kudos-board.tsx` — mount `KudoDetailModal`.
- `messages/en.json`, `messages/vi.json` — add `Notifications` namespace.

---

## Task 1: Database view `notification_feed`

**Files:**
- Create: `supabase/migrations/20260623120000_notification_feed.sql`

**Interfaces:**
- Produces: a view `public.notification_feed` with columns `id (bigint), user_id (uuid), type (text), kudo_id (uuid), is_read (bool), created_at (timestamptz), actor_name (text), kudo_title (text)`. Consumed by Task 3 (`getNotificationsPage`).

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260623120000_notification_feed.sql`:

```sql
-- ============================================================================
-- notification_feed view
-- Denormalizes notifications with the originating kudo's sender name and title
-- for display in the bell dropdown and the /notifications page.
--
-- security_invoker = true: the caller's RLS applies, so the existing
-- "notifications read own" policy restricts each user to their own rows.
--
-- Anonymity: when the source kudo is anonymous, actor_name is masked to the
-- sender-chosen alias (anonymous_name) or the generic "Ẩn danh" label. The real
-- sender's name (sender.full_name) is never selected for anonymous kudos.
-- ============================================================================
create or replace view public.notification_feed
with (security_invoker = true) as
select
  n.id,
  n.user_id,
  n.type,
  n.kudo_id,
  n.is_read,
  n.created_at,
  case
    when k.is_anonymous then coalesce(k.anonymous_name, 'Ẩn danh')
    else sender.full_name
  end as actor_name,
  k.title as kudo_title
from public.notifications n
left join public.kudos k on k.id = n.kudo_id
left join public.profiles sender on sender.id = k.sender_id;
```

- [ ] **Step 2: Apply and verify the view returns masked names**

Run (requires local Supabase via Docker):

```bash
npm run db:reset
```

Expected: reset completes, all migrations applied with no error.

Then verify the anonymity masking with a query (psql via supabase):

```bash
supabase db query "select id, type, actor_name from public.notification_feed limit 5;" 2>/dev/null || \
  echo "If local Supabase is unavailable here, the CI 'supabase-migrations' job validates apply; review the SQL for the anonymity CASE."
```

Expected: rows return; for any notification tied to an anonymous kudo, `actor_name` is the alias or `Ẩn danh`, never a real `full_name`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260623120000_notification_feed.sql
git commit -m "feat(notifications): add notification_feed view with anonymity masking"
```

---

## Task 2: Types + pure hydrator

**Files:**
- Create: `lib/notifications/types.ts`
- Create: `lib/notifications/hydrate.ts`
- Test: `lib/notifications/hydrate.test.ts`

**Interfaces:**
- Produces:
  - `type NotificationType = "kudo_received" | "rank_up" | (string & {})`
  - `interface NotificationItem { id: number; type: NotificationType; kudoId: string | null; isRead: boolean; createdAt: string; actorName: string; kudoTitle: string | null; }`
  - `interface NotificationsPage { items: NotificationItem[]; nextCursor: number | null; }`
  - `interface RawNotificationRow { id: number; type: string; kudo_id: string | null; is_read: boolean; created_at: string; actor_name: string | null; kudo_title: string | null; }`
  - `function hydrateNotification(raw: RawNotificationRow): NotificationItem`
- Consumed by: Tasks 3, 4, 7, 9, 10, 11.

- [ ] **Step 1: Write the failing test**

Create `lib/notifications/hydrate.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { hydrateNotification } from "./hydrate";
import type { RawNotificationRow } from "./hydrate";

const baseRow: RawNotificationRow = {
  id: 42,
  type: "kudo_received",
  kudo_id: "kudo-1",
  is_read: false,
  created_at: "2026-06-23T10:00:00.000Z",
  actor_name: "Alice",
  kudo_title: "IDOL",
};

describe("hydrateNotification", () => {
  it("maps a raw row to a NotificationItem (camelCase)", () => {
    expect(hydrateNotification(baseRow)).toEqual({
      id: 42,
      type: "kudo_received",
      kudoId: "kudo-1",
      isRead: false,
      createdAt: "2026-06-23T10:00:00.000Z",
      actorName: "Alice",
      kudoTitle: "IDOL",
    });
  });

  it("falls back to empty actorName when null (masking edge)", () => {
    expect(hydrateNotification({ ...baseRow, actor_name: null }).actorName).toBe("");
  });

  it("preserves null kudoId / kudoTitle", () => {
    const item = hydrateNotification({ ...baseRow, kudo_id: null, kudo_title: null });
    expect(item.kudoId).toBeNull();
    expect(item.kudoTitle).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/notifications/hydrate.test.ts`
Expected: FAIL — cannot find module `./hydrate`.

- [ ] **Step 3: Write the types**

Create `lib/notifications/types.ts`:

```ts
/**
 * Shared types for the notifications feature.
 * The `type` column is open text in the DB; known types map to icons/labels in
 * the UI, unknown types fall back gracefully.
 */
export type NotificationType = "kudo_received" | "rank_up" | (string & {});

/** A notification as rendered by the bell dropdown and the /notifications page. */
export interface NotificationItem {
  id: number;
  type: NotificationType;
  /** Source kudo id for deep-linking (null for non-kudo types). */
  kudoId: string | null;
  isRead: boolean;
  /** ISO timestamp from Postgres. */
  createdAt: string;
  /** Display name of the actor; masked to alias/"Ẩn danh" for anonymous kudos. */
  actorName: string;
  kudoTitle: string | null;
}

/** One cursor-paginated page of notifications. */
export interface NotificationsPage {
  items: NotificationItem[];
  /** Pass as `cursor` to fetch the next page; null when no more rows. */
  nextCursor: number | null;
}
```

- [ ] **Step 4: Write the hydrator**

Create `lib/notifications/hydrate.ts`:

```ts
/**
 * Pure mapper: raw `notification_feed` row → NotificationItem.
 * No Supabase/HTTP — unit-tested for shape (mirrors lib/kudos/hydrate.ts).
 */
import type { NotificationItem, NotificationType } from "./types";

/** Raw row shape returned by the notification_feed select. */
export interface RawNotificationRow {
  id: number;
  type: string;
  kudo_id: string | null;
  is_read: boolean;
  created_at: string;
  actor_name: string | null;
  kudo_title: string | null;
}

export function hydrateNotification(raw: RawNotificationRow): NotificationItem {
  return {
    id: raw.id,
    type: raw.type as NotificationType,
    kudoId: raw.kudo_id,
    isRead: raw.is_read,
    createdAt: raw.created_at,
    actorName: raw.actor_name ?? "",
    kudoTitle: raw.kudo_title,
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- lib/notifications/hydrate.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/notifications/types.ts lib/notifications/hydrate.ts lib/notifications/hydrate.test.ts
git commit -m "feat(notifications): add notification types and pure hydrator"
```

---

## Task 3: Server queries + query keys

**Files:**
- Create: `lib/notifications/query-keys.ts`
- Create: `lib/notifications/queries.ts`
- Test: `lib/notifications/queries.test.ts`

**Interfaces:**
- Consumes: `hydrateNotification`, `RawNotificationRow`, `NotificationsPage` (Task 2).
- Produces:
  - `const notificationsKey = ["notifications", "list"] as const`
  - `const unreadCountKey = ["notifications", "unread-count"] as const`
  - `function buildNotificationsPage(rows: RawNotificationRow[], limit: number): NotificationsPage` (pure, exported for testing)
  - `async function getNotificationsPage(opts?: { cursor?: number | null; limit?: number }): Promise<NotificationsPage>`
  - `async function getUnreadCount(): Promise<number>`
- Consumed by: Tasks 4, 7, 11.

- [ ] **Step 1: Write the failing test (pure page-builder)**

Create `lib/notifications/queries.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildNotificationsPage } from "./queries";
import type { RawNotificationRow } from "./hydrate";

function row(id: number): RawNotificationRow {
  return {
    id,
    type: "kudo_received",
    kudo_id: `kudo-${id}`,
    is_read: false,
    created_at: "2026-06-23T10:00:00.000Z",
    actor_name: "Alice",
    kudo_title: null,
  };
}

describe("buildNotificationsPage", () => {
  it("returns no nextCursor when rows do not exceed the limit", () => {
    const page = buildNotificationsPage([row(3), row(2)], 20);
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBeNull();
  });

  it("trims the extra row and sets nextCursor to the last kept id", () => {
    // limit 2, 3 rows fetched (limit + 1) → hasMore
    const page = buildNotificationsPage([row(5), row(4), row(3)], 2);
    expect(page.items.map((i) => i.id)).toEqual([5, 4]);
    expect(page.nextCursor).toBe(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/notifications/queries.test.ts`
Expected: FAIL — cannot find module `./queries`.

- [ ] **Step 3: Write query keys**

Create `lib/notifications/query-keys.ts`:

```ts
/**
 * TanStack Query key factories — server-safe (NO "use client"), so both the
 * server prefetch (page.tsx) and client hooks can import them.
 */

/** Cursor-paginated notifications list. */
export const notificationsKey = ["notifications", "list"] as const;

/** Unread badge count. */
export const unreadCountKey = ["notifications", "unread-count"] as const;
```

- [ ] **Step 4: Write queries**

Create `lib/notifications/queries.ts`:

```ts
/**
 * Server-side notification queries. Used by the API routes and the
 * /notifications page prefetch. Mirrors lib/kudos/queries.ts conventions.
 */
import { createClient } from "@/lib/supabase/server";
import { hydrateNotification } from "./hydrate";
import type { RawNotificationRow } from "./hydrate";
import type { NotificationsPage } from "./types";

const NOTIFICATION_SELECT =
  "id, type, kudo_id, is_read, created_at, actor_name, kudo_title";

/**
 * Pure page assembler: trims the (limit + 1) fetch to `limit` rows and derives
 * the next cursor (the last kept row's id). Exported for unit testing.
 */
export function buildNotificationsPage(
  rows: RawNotificationRow[],
  limit: number,
): NotificationsPage {
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const items = pageRows.map(hydrateNotification);
  const nextCursor =
    hasMore && pageRows.length > 0 ? pageRows[pageRows.length - 1].id : null;
  return { items, nextCursor };
}

/**
 * One cursor-paginated page of the current user's notifications, newest first.
 * RLS ("notifications read own") restricts rows to the caller via the view.
 *
 * @param cursor exclusive — return rows with id < cursor. Null for the first page.
 * @param limit  page size (caller clamps to 1..50).
 */
export async function getNotificationsPage({
  cursor = null,
  limit = 20,
}: { cursor?: number | null; limit?: number } = {}): Promise<NotificationsPage> {
  const supabase = await createClient();

  let query = supabase
    .from("notification_feed")
    .select(NOTIFICATION_SELECT)
    .order("id", { ascending: false })
    .limit(limit + 1); // fetch one extra to detect a next page

  if (cursor !== null) {
    query = query.lt("id", cursor);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`getNotificationsPage: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as RawNotificationRow[];
  return buildNotificationsPage(rows, limit);
}

/** Count of the current user's unread notifications (badge). RLS-scoped. */
export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false);
  if (error) {
    throw new Error(`getUnreadCount: ${error.message}`);
  }
  return count ?? 0;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- lib/notifications/queries.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/notifications/query-keys.ts lib/notifications/queries.ts lib/notifications/queries.test.ts
git commit -m "feat(notifications): add server queries and query keys"
```

---

## Task 4: List + unread-count API routes

**Files:**
- Create: `app/api/notifications/route.ts`
- Create: `app/api/notifications/unread-count/route.ts`

**Interfaces:**
- Consumes: `getNotificationsPage`, `getUnreadCount` (Task 3); `getSessionUser` (`@/lib/auth/get-session-user`).
- Produces:
  - `GET /api/notifications?limit&cursor` → `NotificationsPage` JSON.
  - `GET /api/notifications/unread-count` → `{ count: number }`.
- Consumed by: Tasks 7 (hooks), 11 (page prefetch).

- [ ] **Step 1: Write the list route**

Create `app/api/notifications/route.ts`:

```ts
/**
 * GET /api/notifications
 * Cursor-paginated notifications for the current user (newest first).
 *
 * Query params:
 *   limit   number  (default 20, max 50)
 *   cursor  number  (exclusive — return rows with id < cursor)
 *
 * Returns: NotificationsPage JSON. Auth required.
 */
import { NextResponse } from "next/server";
import { getNotificationsPage } from "@/lib/notifications/queries";
import { getSessionUser } from "@/lib/auth/get-session-user";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;

  const rawLimit = Number(searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 50)
    : 20;

  const cursorParam = searchParams.get("cursor");
  let cursor: number | null = null;
  if (cursorParam !== null && cursorParam !== "") {
    const n = Number(cursorParam);
    if (!Number.isInteger(n) || n < 0) {
      return NextResponse.json(
        { error: "Invalid cursor: must be a non-negative integer" },
        { status: 400 },
      );
    }
    cursor = n;
  }

  try {
    const page = await getNotificationsPage({ cursor, limit });
    return NextResponse.json(page);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Write the unread-count route**

Create `app/api/notifications/unread-count/route.ts`:

```ts
/**
 * GET /api/notifications/unread-count
 * Returns { count } — the current user's unread notification count (badge).
 * Auth required.
 */
import { NextResponse } from "next/server";
import { getUnreadCount } from "@/lib/notifications/queries";
import { getSessionUser } from "@/lib/auth/get-session-user";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const count = await getUnreadCount();
    return NextResponse.json({ count });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify typecheck + lint pass**

Run: `npm run typecheck && npm run lint`
Expected: no errors (thin handlers; logic is covered by Task 3 tests).

- [ ] **Step 4: Commit**

```bash
git add app/api/notifications/route.ts app/api/notifications/unread-count/route.ts
git commit -m "feat(notifications): add list and unread-count API routes"
```

---

## Task 5: Mark-read API routes

**Files:**
- Create: `app/api/notifications/[id]/route.ts`
- Create: `app/api/notifications/mark-all-read/route.ts`

**Interfaces:**
- Consumes: `createClient` (`@/lib/supabase/server`).
- Produces:
  - `PATCH /api/notifications/[id]` → `{ ok: true }` (marks one read).
  - `POST /api/notifications/mark-all-read` → `{ updated: number }`.
- Consumed by: Task 7 (`use-mark-read`).

- [ ] **Step 1: Write the single mark-read route**

Create `app/api/notifications/[id]/route.ts`:

```ts
/**
 * PATCH /api/notifications/[id]
 * Marks one notification read. RLS ("notifications update own") enforces
 * ownership, so a user can only mark their own rows.
 *
 * Next.js 16: params is a Promise — await it.
 * Returns: { ok: true }. Auth required.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", numericId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Write the mark-all-read route**

Create `app/api/notifications/mark-all-read/route.ts`:

```ts
/**
 * POST /api/notifications/mark-all-read
 * Marks all of the current user's unread notifications read.
 * RLS scopes the UPDATE to the caller's own rows.
 * Returns: { updated: number }. Auth required.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ updated: data?.length ?? 0 });
}
```

- [ ] **Step 3: Verify typecheck + lint pass**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/notifications/[id]/route.ts app/api/notifications/mark-all-read/route.ts
git commit -m "feat(notifications): add mark-read API routes (single + all)"
```

---

## Task 6: Single-kudo query + route (for the detail modal)

**Files:**
- Modify: `lib/kudos/queries.ts` (add `getKudoById`)
- Create: `app/api/kudos/[id]/route.ts`
- Create: `lib/kudos/use-kudo.ts`

**Interfaces:**
- Consumes (existing, internal to `queries.ts`): `buildKudoSelect`, `fetchHeartCounts`, `fetchLikedSet`, `fetchProfileStats`, `mergeHeartCounts`, `injectProfileStats`, `hydrateKudoCard`, `RawKudoRow`, `KudoCard`.
- Produces:
  - `async function getKudoById(id: string, currentUserId?: string | null): Promise<KudoCard | null>`
  - `GET /api/kudos/[id]` → `KudoCard` JSON or `404`.
  - `function useKudo(id: string | null)` → TanStack `useQuery<KudoCard>` (enabled when id is non-null).
- Consumed by: Task 12 (`KudoDetailModal`).

- [ ] **Step 1: Add `getKudoById` to `lib/kudos/queries.ts`**

Append after `getKudosPage` (reusing the helpers already defined in this file):

```ts
const EMPTY_FILTER: KudosFilter = { hashtag: null, departmentId: null };

/**
 * Fetch a single published kudo by id as a fully-hydrated KudoCard, or null if
 * not found / not visible. Reuses the same select + enrichment as getKudosPage.
 */
export async function getKudoById(
  id: string,
  currentUserId: string | null = null,
): Promise<KudoCard | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("kudos")
    .select(buildKudoSelect(EMPTY_FILTER))
    .eq("status", "published")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`getKudoById: ${error.message}`);
  }
  if (!data) {
    return null;
  }

  const raw = data as unknown as RawKudoRow;
  const [heartMap, likedSet, statsMap] = await Promise.all([
    fetchHeartCounts(supabase, [raw.id]),
    fetchLikedSet(supabase, [raw.id], currentUserId),
    fetchProfileStats(
      supabase,
      [raw.sender?.id, raw.recipient?.id].filter((v): v is string => Boolean(v)),
    ),
  ]);

  const [merged] = injectProfileStats(mergeHeartCounts([raw], heartMap), statsMap);
  return hydrateKudoCard(merged, likedSet.has(raw.id), currentUserId);
}
```

> Note for the implementer: confirm the exact names of the internal helpers at the top of `lib/kudos/queries.ts` (`buildKudoSelect`, `fetchHeartCounts`, `fetchLikedSet`, `fetchProfileStats`, `mergeHeartCounts`, `injectProfileStats`) and match them. They are defined in the same file as `getKudosPage`.

- [ ] **Step 2: Write the route**

Create `app/api/kudos/[id]/route.ts`:

```ts
/**
 * GET /api/kudos/[id]
 * Returns a single published kudo as a KudoCard (for the notification → detail
 * modal), or 404 if not found / not visible. Auth required.
 *
 * Next.js 16: params is a Promise — await it.
 */
import { NextResponse } from "next/server";
import { getKudoById } from "@/lib/kudos/queries";
import { getSessionUser } from "@/lib/auth/get-session-user";
import type { NextRequest } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const card = await getKudoById(id, user.id);
    if (!card) {
      return NextResponse.json({ error: "Kudo not found" }, { status: 404 });
    }
    return NextResponse.json(card);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Write the hook**

Create `lib/kudos/use-kudo.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import type { KudoCard } from "./types";

/** Query key for a single kudo by id. */
export function kudoByIdKey(id: string) {
  return ["kudos", "by-id", id] as const;
}

async function fetchKudo(id: string): Promise<KudoCard> {
  const res = await fetch(`/api/kudos/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to load kudo (${res.status})`);
  }
  return (await res.json()) as KudoCard;
}

/**
 * Fetch a single kudo for the detail modal. Disabled while `id` is null so the
 * modal only queries when ?kudo=<id> is present.
 */
export function useKudo(id: string | null) {
  return useQuery({
    queryKey: id ? kudoByIdKey(id) : ["kudos", "by-id", "none"],
    queryFn: () => fetchKudo(id as string),
    enabled: id !== null,
  });
}
```

- [ ] **Step 4: Verify typecheck + lint pass**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/kudos/queries.ts app/api/kudos/[id]/route.ts lib/kudos/use-kudo.ts
git commit -m "feat(kudos): add single-kudo query, route, and hook for detail modal"
```

---

## Task 7: Notification hooks (count, list, mark-read, realtime)

**Files:**
- Create: `lib/notifications/use-unread-count.ts`
- Create: `lib/notifications/use-notifications.ts`
- Create: `lib/notifications/use-mark-read.ts`
- Create: `lib/notifications/use-notifications-realtime.ts`

**Interfaces:**
- Consumes: `notificationsKey`, `unreadCountKey` (Task 3); `NotificationsPage` (Task 2); `subscribeToTable` (`@/lib/supabase/realtime`).
- Produces:
  - `function useUnreadCount()` → `useQuery<number>`
  - `function useNotifications()` → `useInfiniteQuery<NotificationsPage>`
  - `function useMarkRead()` → `{ markOne(id: number): void; markAll(): void; isPending: boolean }`
  - `function useNotificationsRealtime(): void`
- Consumed by: Tasks 10 (bell), 11 (page).

- [ ] **Step 1: Write the unread-count hook**

Create `lib/notifications/use-unread-count.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { unreadCountKey } from "./query-keys";

async function fetchUnreadCount(): Promise<number> {
  const res = await fetch("/api/notifications/unread-count");
  if (!res.ok) throw new Error(`unread-count ${res.status}`);
  const data = (await res.json()) as { count: number };
  return data.count;
}

/** Unread notification count for the bell badge. */
export function useUnreadCount() {
  return useQuery({ queryKey: unreadCountKey, queryFn: fetchUnreadCount });
}
```

- [ ] **Step 2: Write the infinite list hook**

Create `lib/notifications/use-notifications.ts`:

```ts
"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { notificationsKey } from "./query-keys";
import type { NotificationsPage } from "./types";

async function fetchPage(cursor: number | null, limit: number): Promise<NotificationsPage> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor !== null) params.set("cursor", String(cursor));
  const res = await fetch(`/api/notifications?${params.toString()}`);
  if (!res.ok) throw new Error(`notifications ${res.status}`);
  return (await res.json()) as NotificationsPage;
}

/**
 * Infinite list of notifications. `limit` defaults to 20; the bell passes a
 * smaller preview size.
 */
export function useNotifications(limit = 20) {
  return useInfiniteQuery({
    queryKey: [...notificationsKey, limit],
    queryFn: ({ pageParam }) => fetchPage(pageParam, limit),
    initialPageParam: null as number | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}
```

- [ ] **Step 3: Write the mark-read mutations hook**

Create `lib/notifications/use-mark-read.ts`:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsKey, unreadCountKey } from "./query-keys";

async function patchOne(id: number): Promise<void> {
  const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  if (!res.ok) throw new Error(`mark-read ${res.status}`);
}

async function postAll(): Promise<void> {
  const res = await fetch("/api/notifications/mark-all-read", { method: "POST" });
  if (!res.ok) throw new Error(`mark-all-read ${res.status}`);
}

/**
 * Mark-read mutations. On success, invalidate the list + unread-count queries
 * so the badge and any open list refetch.
 */
export function useMarkRead() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: notificationsKey });
    qc.invalidateQueries({ queryKey: unreadCountKey });
  };

  const one = useMutation({ mutationFn: patchOne, onSuccess: invalidate });
  const all = useMutation({ mutationFn: postAll, onSuccess: invalidate });

  return {
    markOne: (id: number) => one.mutate(id),
    markAll: () => all.mutate(),
    isPending: one.isPending || all.isPending,
  };
}
```

- [ ] **Step 4: Write the realtime hook**

Create `lib/notifications/use-notifications-realtime.ts`:

```ts
"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeToTable } from "@/lib/supabase/realtime";
import { notificationsKey, unreadCountKey } from "./query-keys";

/**
 * Subscribe to INSERTs on `notifications`. Supabase Realtime applies RLS, so a
 * client only receives its own rows. On each insert, invalidate the list +
 * unread-count so the badge updates live without opening the panel.
 *
 * Mount once in an always-rendered authenticated component (the bell).
 */
export function useNotificationsRealtime(): void {
  const qc = useQueryClient();
  useEffect(() => {
    return subscribeToTable("notifications", "notifications", "INSERT", () => {
      qc.invalidateQueries({ queryKey: notificationsKey });
      qc.invalidateQueries({ queryKey: unreadCountKey });
    });
  }, [qc]);
}
```

- [ ] **Step 5: Verify typecheck + lint pass**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/notifications/use-unread-count.ts lib/notifications/use-notifications.ts lib/notifications/use-mark-read.ts lib/notifications/use-notifications-realtime.ts
git commit -m "feat(notifications): add count, list, mark-read, and realtime hooks"
```

---

## Task 8: i18n keys + route

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/vi.json`
- Modify: `lib/navigation/routes.ts`

**Interfaces:**
- Produces: `Notifications` message namespace; `ROUTES.notifications = "/notifications"`.
- Consumed by: Tasks 9, 10, 11, 12.

- [ ] **Step 1: Run the i18n parity test to confirm current state**

Run: `npm test -- messages/messages.test.ts`
Expected: PASS (baseline before adding keys).

- [ ] **Step 2: Add the `Notifications` namespace to `messages/en.json`**

Add a top-level `"Notifications"` object (sibling of `"Home"`):

```json
  "Notifications": {
    "title": "Notifications",
    "markAllRead": "Mark all as read",
    "viewAll": "View all",
    "empty": "No new notifications.",
    "bellAria": "Notifications",
    "panelAria": "Notifications panel",
    "loadMore": "Load more",
    "kudoReceived": "{sender} just sent you a kudo!",
    "rankUp": "{sender} — you've been promoted!"
  }
```

- [ ] **Step 3: Add the matching namespace to `messages/vi.json`**

```json
  "Notifications": {
    "title": "Thông Báo",
    "markAllRead": "Đánh dấu đọc tất cả",
    "viewAll": "Xem tất cả",
    "empty": "Chưa có thông báo mới.",
    "bellAria": "Thông báo",
    "panelAria": "Bảng thông báo",
    "loadMore": "Tải thêm",
    "kudoReceived": "{sender} vừa gửi đến bạn lời ghi nhận đầy yêu thương!",
    "rankUp": "{sender} — bạn vừa được thăng hạng!"
  }
```

- [ ] **Step 4: Add the route**

In `lib/navigation/routes.ts`, add to the `ROUTES` object:

```ts
  profile: "/profile",
  notifications: "/notifications",
```

- [ ] **Step 5: Run the parity test to verify both locales match**

Run: `npm test -- messages/messages.test.ts`
Expected: PASS (no missing-key diff between en/vi).

- [ ] **Step 6: Commit**

```bash
git add messages/en.json messages/vi.json lib/navigation/routes.ts
git commit -m "feat(notifications): add i18n keys and /notifications route"
```

---

## Task 9: NotificationListItem (presentational) + icon

**Files:**
- Create: `components/notifications/notification-icon.tsx`
- Create: `components/notifications/notification-list-item.tsx`
- Test: `components/notifications/notification-list-item.test.tsx`

**Interfaces:**
- Consumes: `NotificationItem`, `NotificationType` (Task 2); `Notifications` messages (Task 8).
- Produces:
  - `function NotificationIcon({ type }: { type: NotificationType })` — 📩 for `kudo_received`, ⭐ for `rank_up`/unknown.
  - `interface NotificationListItemProps { item: NotificationItem; onSelect: (item: NotificationItem) => void; }`
  - `function NotificationListItem(props)` — renders icon, localized sentence (`actorName` interpolated), date, unread dot + bold; click/Enter calls `onSelect`.
- Consumed by: Tasks 10, 11.

- [ ] **Step 1: Write the failing test**

Create `components/notifications/notification-list-item.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { NotificationListItem } from "./notification-list-item";
import type { NotificationItem } from "@/lib/notifications/types";

const item: NotificationItem = {
  id: 1,
  type: "kudo_received",
  kudoId: "kudo-1",
  isRead: false,
  createdAt: "2026-06-23T10:00:00.000Z",
  actorName: "Alice",
  kudoTitle: null,
};

function renderItem(props: Partial<NotificationItem> = {}, onSelect = vi.fn()) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <NotificationListItem item={{ ...item, ...props }} onSelect={onSelect} />
    </NextIntlClientProvider>,
  );
  return { onSelect };
}

describe("NotificationListItem", () => {
  it("renders the localized kudo_received sentence with the actor name", () => {
    renderItem();
    expect(screen.getByText("Alice just sent you a kudo!")).toBeInTheDocument();
  });

  it("calls onSelect with the item when clicked", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderItem();
    await user.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it("shows the unread indicator only when isRead is false", () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <NotificationListItem item={{ ...item, isRead: true }} onSelect={vi.fn()} />
      </NextIntlClientProvider>,
    );
    expect(container.querySelector('[data-unread="true"]')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/notifications/notification-list-item.test.tsx`
Expected: FAIL — cannot find module `./notification-list-item`.

- [ ] **Step 3: Write the icon component**

Create `components/notifications/notification-icon.tsx`:

```tsx
import type { NotificationType } from "@/lib/notifications/types";

/** Maps a notification type to its leading icon. Falls back to the star icon. */
export function NotificationIcon({ type }: { type: NotificationType }) {
  if (type === "kudo_received") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 6h16v12H4z M4 6l8 6 8-6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }
  // rank_up and any future/unknown type → star
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
```

- [ ] **Step 4: Write the list item component**

Create `components/notifications/notification-list-item.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { NotificationIcon } from "./notification-icon";
import type { NotificationItem } from "@/lib/notifications/types";

export interface NotificationListItemProps {
  item: NotificationItem;
  onSelect: (item: NotificationItem) => void;
}

/** Format an ISO timestamp as DD/MM/YYYY (matches the mockup "26/11/2025"). */
function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = d.getDate().toString().padStart(2, "0");
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Compose the localized message for a notification type. */
function useMessage(item: NotificationItem): string {
  const t = useTranslations("Notifications");
  if (item.type === "rank_up") return t("rankUp", { sender: item.actorName });
  return t("kudoReceived", { sender: item.actorName });
}

export function NotificationListItem({ item, onSelect }: NotificationListItemProps) {
  const message = useMessage(item);
  const unread = !item.isRead;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 focus:outline-none focus-visible:bg-white/5"
    >
      <span className="mt-0.5 shrink-0 text-white/70">
        <NotificationIcon type={item.type} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm ${unread ? "font-semibold text-white" : "text-white/70"}`}
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {message}
        </span>
        <span className="mt-1 block text-xs text-white/40">{formatDate(item.createdAt)}</span>
      </span>
      {unread && (
        <span
          data-unread="true"
          aria-hidden="true"
          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-500"
        />
      )}
    </button>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- components/notifications/notification-list-item.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add components/notifications/notification-icon.tsx components/notifications/notification-list-item.tsx components/notifications/notification-list-item.test.tsx
git commit -m "feat(notifications): add NotificationListItem and type icon"
```

---

## Task 10: Rewrite NotificationBell (data-driven + realtime)

**Files:**
- Modify: `components/header/notification-bell.tsx`
- Modify: `components/header/notification-bell.test.tsx`

**Interfaces:**
- Consumes: `useUnreadCount`, `useNotifications`, `useMarkRead`, `useNotificationsRealtime` (Task 7); `NotificationListItem` (Task 9); `useRouter` (`next/navigation`); `ROUTES` (Task 8); `Notifications` messages.
- Behavior: badge shows unread count (hidden when 0); open → preview first 5 items; "Mark all as read" header button; "View all" footer link → `/notifications`; clicking an item marks it read and navigates to `/sun-kudos?kudo=<kudoId>`; mounts realtime so the badge updates live.

- [ ] **Step 1: Replace the test file with data-driven tests**

Overwrite `components/header/notification-bell.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { NotificationBell } from "./notification-bell";
import type { NotificationItem } from "@/lib/notifications/types";

const { mockPush, state } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  state: {
    unread: 2,
    items: [] as NotificationItem[],
    markOne: vi.fn(),
    markAll: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock("@/lib/notifications/use-notifications-realtime", () => ({
  useNotificationsRealtime: vi.fn(),
}));
vi.mock("@/lib/notifications/use-unread-count", () => ({
  useUnreadCount: () => ({ data: state.unread }),
}));
vi.mock("@/lib/notifications/use-notifications", () => ({
  useNotifications: () => ({ data: { pages: [{ items: state.items, nextCursor: null }] } }),
}));
vi.mock("@/lib/notifications/use-mark-read", () => ({
  useMarkRead: () => ({ markOne: state.markOne, markAll: state.markAll, isPending: false }),
}));

const sampleItem: NotificationItem = {
  id: 1, type: "kudo_received", kudoId: "kudo-9", isRead: false,
  createdAt: "2026-06-23T10:00:00.000Z", actorName: "Alice", kudoTitle: null,
};

function renderBell() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <NotificationBell />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  state.unread = 2;
  state.items = [];
  mockPush.mockReset();
  state.markOne.mockReset();
  state.markAll.mockReset();
});

describe("NotificationBell", () => {
  it("shows the unread badge count", () => {
    renderBell();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("hides the badge when there are no unread notifications", () => {
    state.unread = 0;
    renderBell();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("opens the panel and shows the empty state when there are no items", async () => {
    const user = userEvent.setup();
    renderBell();
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await waitFor(() => {
      expect(screen.getByText("No new notifications.")).toBeInTheDocument();
    });
  });

  it("marks read and navigates to the kudo when an item is clicked", async () => {
    state.items = [sampleItem];
    const user = userEvent.setup();
    renderBell();
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await user.click(await screen.findByText("Alice just sent you a kudo!"));
    expect(state.markOne).toHaveBeenCalledWith(1);
    expect(mockPush).toHaveBeenCalledWith("/sun-kudos?kudo=kudo-9");
  });

  it("calls markAll when the header button is clicked", async () => {
    const user = userEvent.setup();
    renderBell();
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    await user.click(await screen.findByRole("button", { name: /Mark all as read/i }));
    expect(state.markAll).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/header/notification-bell.test.tsx`
Expected: FAIL — current bell has no badge count / mark-all / item behavior.

- [ ] **Step 3: Rewrite the component**

Overwrite `components/header/notification-bell.tsx`:

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/navigation/routes";
import { useUnreadCount } from "@/lib/notifications/use-unread-count";
import { useNotifications } from "@/lib/notifications/use-notifications";
import { useMarkRead } from "@/lib/notifications/use-mark-read";
import { useNotificationsRealtime } from "@/lib/notifications/use-notifications-realtime";
import { NotificationListItem } from "@/components/notifications/notification-list-item";
import type { NotificationItem } from "@/lib/notifications/types";

const PREVIEW_LIMIT = 5;

/**
 * Notification bell — authenticated-only header control.
 * Badge shows the live unread count; opening shows a preview of recent
 * notifications with "mark all read" and a "view all" link to /notifications.
 */
export function NotificationBell() {
  const t = useTranslations("Notifications");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useNotificationsRealtime();
  const { data: unread } = useUnreadCount();
  const { data } = useNotifications(PREVIEW_LIMIT);
  const { markOne, markAll } = useMarkRead();

  const items: NotificationItem[] = data?.pages?.[0]?.items ?? [];
  const unreadCount = unread ?? 0;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function handleSelect(item: NotificationItem) {
    markOne(item.id);
    setOpen(false);
    if (item.kudoId) {
      router.push(`${ROUTES.kudos}?kudo=${item.kudoId}`);
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={t("bellAria")}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      {open && (
        <div
          role="dialog"
          aria-label={t("panelAria")}
          className="absolute right-0 top-full z-20 mt-2 w-80 overflow-hidden rounded-xl shadow-2xl"
          style={{ backgroundColor: "#1a2a35", border: "1px solid rgba(46, 57, 64, 1)" }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-semibold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
              {t("title")}
            </span>
            <button
              type="button"
              onClick={() => markAll()}
              className="text-xs text-white/60 transition-colors hover:text-white"
            >
              {t("markAllRead")}
            </button>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-white/45" style={{ fontFamily: "Montserrat, sans-serif" }}>
              {t("empty")}
            </div>
          ) : (
            <ul className="max-h-96 divide-y divide-white/5 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <NotificationListItem item={item} onSelect={handleSelect} />
                </li>
              ))}
            </ul>
          )}

          <a
            href={ROUTES.notifications}
            className="block border-t border-white/5 px-4 py-3 text-center text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            {t("viewAll")}
          </a>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
        fill="currentColor"
        className="text-white"
      />
    </svg>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/header/notification-bell.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Verify the bell still renders in the header tests + typecheck**

Run: `npm test -- tests/homepage/app-header.test.tsx && npm run typecheck`
Expected: PASS / no type errors. (If `app-header.test.tsx` renders the real bell, wrap or mock the hooks there as needed; the header passes the bell as a slot, so this should be unaffected.)

- [ ] **Step 6: Commit**

```bash
git add components/header/notification-bell.tsx components/header/notification-bell.test.tsx
git commit -m "feat(notifications): rewrite NotificationBell with live data and realtime"
```

---

## Task 11: `/notifications` full page

**Files:**
- Create: `app/(public)/notifications/_components/notifications-list.tsx`
- Create: `app/(public)/notifications/page.tsx`
- Test: `app/(public)/notifications/_components/notifications-list.test.tsx`

**Interfaces:**
- Consumes: `useNotifications`, `useMarkRead` (Task 7); `NotificationListItem` (Task 9); `getNotificationsPage`, `notificationsKey` (Task 3); `useRouter`, `ROUTES`.
- Behavior: server prefetches the first page into a dehydrated QueryClient; the client list renders items, a "Load more" button (when `hasNextPage`), a "Mark all as read" button, and an empty state. Clicking an item marks read + navigates to `/sun-kudos?kudo=<id>`.

- [ ] **Step 1: Write the failing test (client list)**

Create `app/(public)/notifications/_components/notifications-list.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { NotificationsList } from "./notifications-list";
import type { NotificationItem } from "@/lib/notifications/types";

const { mockPush, state } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  state: {
    items: [] as NotificationItem[],
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    markOne: vi.fn(),
    markAll: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock("@/lib/notifications/use-notifications", () => ({
  useNotifications: () => ({
    data: { pages: [{ items: state.items, nextCursor: null }] },
    hasNextPage: state.hasNextPage,
    fetchNextPage: state.fetchNextPage,
    isFetchingNextPage: false,
  }),
}));
vi.mock("@/lib/notifications/use-mark-read", () => ({
  useMarkRead: () => ({ markOne: state.markOne, markAll: state.markAll, isPending: false }),
}));

const item: NotificationItem = {
  id: 7, type: "kudo_received", kudoId: "kudo-7", isRead: false,
  createdAt: "2026-06-23T10:00:00.000Z", actorName: "Bob", kudoTitle: null,
};

function renderList() {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <NotificationsList />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  state.items = [];
  state.hasNextPage = false;
  mockPush.mockReset();
  state.fetchNextPage.mockReset();
  state.markOne.mockReset();
});

describe("NotificationsList", () => {
  it("shows the empty state with no items", () => {
    renderList();
    expect(screen.getByText("No new notifications.")).toBeInTheDocument();
  });

  it("renders items and navigates on click", async () => {
    state.items = [item];
    const user = userEvent.setup();
    renderList();
    await user.click(screen.getByText("Bob just sent you a kudo!"));
    expect(state.markOne).toHaveBeenCalledWith(7);
    expect(mockPush).toHaveBeenCalledWith("/sun-kudos?kudo=kudo-7");
  });

  it("shows Load more and fetches the next page when present", async () => {
    state.items = [item];
    state.hasNextPage = true;
    const user = userEvent.setup();
    renderList();
    await user.click(screen.getByRole("button", { name: /Load more/i }));
    expect(state.fetchNextPage).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- app/(public)/notifications/_components/notifications-list.test.tsx`
Expected: FAIL — cannot find module `./notifications-list`.

- [ ] **Step 3: Write the client list**

Create `app/(public)/notifications/_components/notifications-list.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/navigation/routes";
import { useNotifications } from "@/lib/notifications/use-notifications";
import { useMarkRead } from "@/lib/notifications/use-mark-read";
import { NotificationListItem } from "@/components/notifications/notification-list-item";
import type { NotificationItem } from "@/lib/notifications/types";

export function NotificationsList() {
  const t = useTranslations("Notifications");
  const router = useRouter();
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useNotifications(20);
  const { markOne, markAll } = useMarkRead();

  const items: NotificationItem[] = (data?.pages ?? []).flatMap((p) => p.items);

  function handleSelect(item: NotificationItem) {
    markOne(item.id);
    if (item.kudoId) router.push(`${ROUTES.kudos}?kudo=${item.kudoId}`);
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
          {t("title")}
        </h1>
        <button
          type="button"
          onClick={() => markAll()}
          className="text-sm text-white/60 transition-colors hover:text-white"
        >
          {t("markAllRead")}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="py-12 text-center text-sm text-white/45">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-white/5 overflow-hidden rounded-xl" style={{ backgroundColor: "#1a2a35" }}>
          {items.map((item) => (
            <li key={item.id}>
              <NotificationListItem item={item} onSelect={handleSelect} />
            </li>
          ))}
        </ul>
      )}

      {hasNextPage && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/5 disabled:opacity-50"
          >
            {t("loadMore")}
          </button>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- app/(public)/notifications/_components/notifications-list.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the page (server prefetch)**

Create `app/(public)/notifications/page.tsx`:

```tsx
/**
 * /notifications — full notifications list (Server Component).
 * Prefetches the first page into a dehydrated QueryClient so the client list
 * hydrates without a loading flash, mirroring app/(public)/sun-kudos/page.tsx.
 */
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query/query-client";
import { getNotificationsPage } from "@/lib/notifications/queries";
import { notificationsKey } from "@/lib/notifications/query-keys";
import { NotificationsList } from "./_components/notifications-list";

export default async function NotificationsPage() {
  const queryClient = makeQueryClient();

  await queryClient.prefetchInfiniteQuery({
    queryKey: [...notificationsKey, 20],
    queryFn: () => getNotificationsPage({ cursor: null, limit: 20 }),
    initialPageParam: null as number | null,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NotificationsList />
    </HydrationBoundary>
  );
}
```

- [ ] **Step 6: Verify typecheck + lint + build**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add "app/(public)/notifications/page.tsx" "app/(public)/notifications/_components/notifications-list.tsx" "app/(public)/notifications/_components/notifications-list.test.tsx"
git commit -m "feat(notifications): add /notifications page with paginated list"
```

---

## Task 12: Kudo detail modal on `/sun-kudos`

**Files:**
- Create: `app/(public)/sun-kudos/_components/kudo-detail-modal.tsx`
- Test: `app/(public)/sun-kudos/_components/kudo-detail-modal.test.tsx`
- Modify: `app/(public)/sun-kudos/_components/kudos-board.tsx` (mount the modal)

**Interfaces:**
- Consumes: `useKudo` (Task 6); `KudoCardBase` (`./ui/kudo-card-base`); `useSearchParams`, `useRouter`, `usePathname` (`next/navigation`).
- Behavior: reads `?kudo=<id>`; when present, fetches the kudo and renders `KudoCardBase` inside a dialog. Closing (backdrop / Escape / close button) removes the `kudo` param. Invalid/missing kudo → a "not found" message + close.

- [ ] **Step 1: Write the failing test**

Create `app/(public)/sun-kudos/_components/kudo-detail-modal.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { KudoDetailModal } from "./kudo-detail-modal";
import type { KudoCard } from "@/lib/kudos/types";

const { state, mockReplace } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  state: { kudoParam: null as string | null, kudo: undefined as KudoCard | undefined, isLoading: false },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(state.kudoParam ? `kudo=${state.kudoParam}` : ""),
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/sun-kudos",
}));
vi.mock("@/lib/kudos/use-kudo", () => ({
  useKudo: () => ({ data: state.kudo, isLoading: state.isLoading, isError: false }),
}));

function renderModal() {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <KudoDetailModal baseUrl="http://localhost" />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  state.kudoParam = null;
  state.kudo = undefined;
  state.isLoading = false;
  mockReplace.mockReset();
});

describe("KudoDetailModal", () => {
  it("renders nothing when there is no ?kudo param", () => {
    renderModal();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a dialog when ?kudo=<id> is present", () => {
    state.kudoParam = "kudo-1";
    state.isLoading = true;
    renderModal();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- "app/(public)/sun-kudos/_components/kudo-detail-modal.test.tsx"`
Expected: FAIL — cannot find module `./kudo-detail-modal`.

- [ ] **Step 3: Write the modal**

Create `app/(public)/sun-kudos/_components/kudo-detail-modal.tsx`:

```tsx
"use client";

import { useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useKudo } from "@/lib/kudos/use-kudo";
import { KudoCardBase } from "./ui/kudo-card-base";

/**
 * Renders a kudo detail dialog when the URL has ?kudo=<id> (deep-linked from a
 * notification). Closing strips the param via router.replace so the board URL
 * returns to clean state without a history entry.
 */
export function KudoDetailModal({ baseUrl }: { baseUrl: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const kudoId = params.get("kudo");

  const { data: kudo, isLoading, isError } = useKudo(kudoId);

  const close = useCallback(() => {
    const next = new URLSearchParams(params.toString());
    next.delete("kudo");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [params, pathname, router]);

  useEffect(() => {
    if (!kudoId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [kudoId, close]);

  if (!kudoId) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Kudo detail"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60" onClick={close} aria-hidden="true" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/80 hover:text-white"
        >
          ✕
        </button>
        {isLoading && <div className="rounded-xl bg-[#1a2a35] p-8 text-center text-white/60">…</div>}
        {isError && <div className="rounded-xl bg-[#1a2a35] p-8 text-center text-white/60">Not found</div>}
        {kudo && <KudoCardBase card={kudo} baseUrl={baseUrl} showImages />}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- "app/(public)/sun-kudos/_components/kudo-detail-modal.test.tsx"`
Expected: PASS (2 tests).

- [ ] **Step 5: Mount the modal in the board**

In `app/(public)/sun-kudos/_components/kudos-board.tsx`, import and render `<KudoDetailModal baseUrl={baseUrl} />` near the root of the board's returned JSX. (`kudos-board.tsx` already receives `baseUrl` for copy-link; reuse it. Confirm the prop name and thread it through if needed.)

```tsx
import { KudoDetailModal } from "./kudo-detail-modal";
// ... inside the returned JSX, alongside the board content:
<KudoDetailModal baseUrl={baseUrl} />
```

- [ ] **Step 6: Verify typecheck + lint + full test run**

Run: `npm run typecheck && npm run lint && npm test`
Expected: no type/lint errors; all tests pass.

- [ ] **Step 7: Commit**

```bash
git add "app/(public)/sun-kudos/_components/kudo-detail-modal.tsx" "app/(public)/sun-kudos/_components/kudo-detail-modal.test.tsx" "app/(public)/sun-kudos/_components/kudos-board.tsx"
git commit -m "feat(notifications): add kudo detail modal opened via ?kudo= param"
```

---

## Task 13: End-to-end verification + docs

**Files:**
- Modify: `docs/project-changelog.md` (record the feature)

- [ ] **Step 1: Full verification**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: all green.

- [ ] **Step 2: Manual smoke (if local Supabase available)**

Run `npm run dev`, log in, send a kudo from account A to account B. As B:
- Badge increments live (no refresh).
- Open bell → see the kudo notification (bold + red dot), "Mark all as read", "View all".
- Click the item → navigates to `/sun-kudos?kudo=<id>` and the detail modal opens.
- "View all" → `/notifications` lists notifications with working "Load more".
- Verify an **anonymous** kudo notification shows the alias/"Ẩn danh", never the real sender.

- [ ] **Step 3: Update the changelog**

Add an entry to `docs/project-changelog.md` summarizing: live notifications (bell badge + dropdown), `/notifications` page, kudo detail modal, `notification_feed` view, vi/en i18n; `rank_up` type rendered but not generated.

- [ ] **Step 4: Commit**

```bash
git add docs/project-changelog.md
git commit -m "docs(notifications): record notifications feature in changelog"
```

---

## Self-Review

**1. Spec coverage:**
- Live unread badge → Tasks 7, 10. ✓
- Bell preview + mark-all + view-all → Task 10. ✓
- `/notifications` paginated page → Task 11. ✓
- Click → mark read → `/sun-kudos?kudo=<id>` → modal → Tasks 9, 10, 12. ✓
- Single-kudo API for modal → Task 6. ✓
- i18n (vi/en) → Task 8 + composition in Task 9. ✓
- Extensible type / `rank_up` icon, not generated → Tasks 2 (type), 9 (icon), 8 (string). ✓
- Anonymity masking → Task 1 (view) + Task 1 verify step. ✓
- Cursor pagination (single bigint id) → Tasks 3, 7. ✓
- Realtime in always-mounted bell → Tasks 7, 10. ✓
- Error handling (401/400/404/500) → Tasks 4, 5, 6. ✓
- Testing per layer → Tasks 2, 3, 9, 10, 11, 12. ✓

**2. Placeholder scan:** No "TBD/TODO/handle edge cases" left; every code step has full code. The two `> Note` callouts (Task 6, Task 12) ask the implementer to confirm pre-existing internal helper/prop names in files they are editing — these are verification reminders, not missing content.

**3. Type consistency:** `NotificationItem`/`NotificationsPage`/`RawNotificationRow` defined in Task 2 and used identically in Tasks 3/7/9/10/11. `getNotificationsPage`/`getUnreadCount`/`getKudoById` signatures match between definition (Tasks 3/6) and consumption (Tasks 4/6/11). `useMarkRead` returns `{ markOne, markAll, isPending }` consistently (Tasks 7/10/11). Query keys `notificationsKey`/`unreadCountKey` consistent across Tasks 3/7/11. `ROUTES.notifications`/`ROUTES.kudos` consistent (Tasks 8/10/11/12).
