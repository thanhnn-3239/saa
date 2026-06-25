"use client";

/**
 * Infinite-scroll hook for the All Kudos feed.
 *
 * Uses TanStack Query's useInfiniteQuery with cursor-based pagination
 * (created_at + id desc). The query key includes the active filter so
 * switching filters resets to page 1 and refetches from scratch.
 *
 * Each page is fetched via the /api/kudos/feed route handler so the
 * server-side Supabase client (with cookie auth) handles the query.
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import type { KudosFilter } from "./types";
import type { KudosPage, PageCursor } from "./queries";
import { kudosFeedKey } from "./query-keys";

// Re-exported for existing importers (use-toggle-like, tests). Source of truth: query-keys.ts.
export { kudosFeedKey };

async function fetchKudosPage(
  filter: KudosFilter,
  cursor: PageCursor | null,
  limit = 20,
): Promise<KudosPage> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (filter.hashtag) params.set("hashtag", filter.hashtag);
  if (filter.departmentId !== null)
    params.set("departmentId", String(filter.departmentId));
  // Profile feed: forward direction so the route handler derives profileId from session.
  // Not sent for the global board (direction undefined), keeping board path unchanged.
  if (filter.direction) params.set("direction", filter.direction);
  if (cursor) {
    params.set("cursorCreatedAt", cursor.createdAt);
    params.set("cursorId", cursor.id);
  }

  const res = await fetch(`/api/kudos/feed?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`fetchKudosPage: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<KudosPage>;
}

export function useKudosFeed(filter: KudosFilter, limit = 20) {
  return useInfiniteQuery({
    queryKey: kudosFeedKey(filter),
    queryFn: ({ pageParam }) =>
      fetchKudosPage(filter, pageParam as PageCursor | null, limit),
    initialPageParam: null as PageCursor | null,
    getNextPageParam: (lastPage: KudosPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30 * 1000,
  });
}
