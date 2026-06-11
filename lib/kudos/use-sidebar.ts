"use client";

/**
 * React Query hook for sidebar data (D): personal stats + two leaderboards.
 *
 * Fetches all three datasets in one request via GET /api/kudos/sidebar.
 * Empty arrays are returned as-is; UI renders "Chưa có dữ liệu" for empty lists.
 */

import { useQuery } from "@tanstack/react-query";
import type { SidebarStats, LeaderboardItem } from "./types";
import { sidebarKey } from "./query-keys";

export interface SidebarData {
  stats: SidebarStats;
  recentGiftReceivers: LeaderboardItem[];
  recentPromotions: LeaderboardItem[];
}

const EMPTY_STATS: SidebarStats = {
  kudosSent: 0,
  kudosReceived: 0,
  heartsReceived: 0,
  badgesCount: 0,
  secretBoxes: { unopened: 0, total: 0 },
};

// Query key re-exported for existing importers. Source of truth: query-keys.ts.
export { sidebarKey };

async function fetchSidebar(): Promise<SidebarData> {
  const res = await fetch("/api/kudos/sidebar", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`fetchSidebar: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<SidebarData>;
}

export function useSidebar() {
  return useQuery({
    queryKey: sidebarKey,
    queryFn: fetchSidebar,
    staleTime: 30 * 1000,
    // Return empty data while loading so UI can render skeletons without
    // conditional checks on undefined.
    placeholderData: {
      stats: EMPTY_STATS,
      recentGiftReceivers: [] as LeaderboardItem[],
      recentPromotions: [] as LeaderboardItem[],
    },
  });
}

/** Convenience hook for just the personal stats tile. */
export function useSidebarStats() {
  const { data, isLoading, error } = useSidebar();
  return { stats: data?.stats ?? EMPTY_STATS, isLoading, error };
}

/** Convenience hook for the gift-receivers leaderboard. */
export function useRecentGiftReceivers() {
  const { data, isLoading, error } = useSidebar();
  return {
    items: data?.recentGiftReceivers ?? [],
    isLoading,
    error,
  };
}

/** Convenience hook for the promotions leaderboard. */
export function useRecentPromotions() {
  const { data, isLoading, error } = useSidebar();
  return {
    items: data?.recentPromotions ?? [],
    isLoading,
    error,
  };
}
