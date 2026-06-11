"use client";

/**
 * React Query hook for the Highlight carousel (top-5 kudos by hearts).
 * Query key includes the active filter so changing a filter refetches.
 *
 * The server prefetches this data in page.tsx; the client hydrates from the
 * dehydrated state — no loading flash on first render.
 */

import { useQuery } from "@tanstack/react-query";
import type { KudoCard, KudosFilter } from "./types";
import { highlightKudosKey } from "./query-keys";

// Re-exported for existing importers (use-toggle-like, tests). Source of truth: query-keys.ts.
export { highlightKudosKey };

async function fetchHighlightKudos(filter: KudosFilter): Promise<KudoCard[]> {
  const params = new URLSearchParams();
  if (filter.hashtag) params.set("hashtag", filter.hashtag);
  if (filter.departmentId !== null)
    params.set("departmentId", String(filter.departmentId));

  const res = await fetch(`/api/kudos/highlight?${params.toString()}`, {
    // No-store so fresh data is fetched when the user changes filters.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`fetchHighlightKudos: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<KudoCard[]>;
}

export function useHighlightKudos(filter: KudosFilter) {
  return useQuery({
    queryKey: highlightKudosKey(filter),
    queryFn: () => fetchHighlightKudos(filter),
    staleTime: 30 * 1000,
  });
}
