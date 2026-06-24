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
