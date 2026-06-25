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
