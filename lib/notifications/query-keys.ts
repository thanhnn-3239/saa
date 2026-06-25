/**
 * TanStack Query key factories — server-safe (NO "use client"), so both the
 * server prefetch (page.tsx) and client hooks can import them.
 */

/** Cursor-paginated notifications list. */
export const notificationsKey = ["notifications", "list"] as const;

/** Unread badge count. */
export const unreadCountKey = ["notifications", "unread-count"] as const;
