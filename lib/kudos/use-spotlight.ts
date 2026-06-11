"use client";

/**
 * React Query hooks for the Spotlight word-cloud (B.7).
 *
 * useSpotlight     — total count + cloud nodes (auto-fetched)
 * useSpotlightSearch — on-demand search; call searchMutation.mutate(term)
 *
 * Loading and empty states are exposed so A3 (UI) can render skeletons
 * and "Chưa có dữ liệu" without extra checks.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import type { SpotlightNode, ProfileBrief } from "./types";
import { spotlightKey } from "./query-keys";

// ---------------------------------------------------------------------------
// Types matching API response shapes
// ---------------------------------------------------------------------------

interface SpotlightCloudData {
  total: number;
  nodes: SpotlightNode[];
}

interface SpotlightSearchResult {
  results: ProfileBrief[];
}

// Query key re-exported for existing importers. Source of truth: query-keys.ts.
export { spotlightKey };

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchSpotlight(): Promise<SpotlightCloudData> {
  const res = await fetch("/api/kudos/spotlight", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`fetchSpotlight: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<SpotlightCloudData>;
}

async function fetchSearch(term: string): Promise<ProfileBrief[]> {
  const params = new URLSearchParams({ search: term });
  const res = await fetch(`/api/kudos/spotlight?${params.toString()}`, {
    cache: "no-store",
  });

  if (res.status === 422) {
    // Validation error — surface the message so UI can display it inline.
    const body = (await res.json()) as { error?: string };
    throw new Error(body.error ?? "Validation error");
  }
  if (!res.ok) {
    throw new Error(`searchSunners: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as SpotlightSearchResult;
  return data.results;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Auto-fetched cloud data: total kudo count + sized recipient nodes. */
export function useSpotlight() {
  const { data, isLoading, error } = useQuery({
    queryKey: spotlightKey,
    queryFn: fetchSpotlight,
    staleTime: 30 * 1000,
    placeholderData: { total: 0, nodes: [] as SpotlightNode[] },
  });

  return {
    total: data?.total ?? 0,
    nodes: data?.nodes ?? [],
    isEmpty: !isLoading && (data?.nodes ?? []).length === 0,
    isLoading,
    error,
  };
}

/**
 * On-demand search mutation for the Spotlight search box (B.7.3).
 *
 * Usage:
 *   const search = useSpotlightSearch();
 *   search.mutate("Nguyen Van A");
 *   // search.data → ProfileBrief[] | undefined
 *   // search.error?.message → validation/network error string for UI display
 */
export function useSpotlightSearch() {
  return useMutation({
    mutationFn: fetchSearch,
  });
}
