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
