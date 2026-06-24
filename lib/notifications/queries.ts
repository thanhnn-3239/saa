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
