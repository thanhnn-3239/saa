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
