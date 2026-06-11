import { QueryClient } from "@tanstack/react-query";

/**
 * Factory that creates a QueryClient with sensible defaults for the Kudos board.
 *
 * - staleTime 30 s: board data is low-latency via Supabase Realtime; short stale
 *   window prevents stale renders without hammering the DB on every focus.
 * - gcTime default (5 min): keeps unused queries in cache while the user navigates
 *   between sidebar sections without re-fetching.
 * - retry 1: one retry on transient network errors; avoids hammering a down DB.
 *
 * Call once per React tree (in the QueryClientProvider wrapper).
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
        retry: 1,
      },
    },
  });
}
