"use client";

/**
 * Shared filter state for the Kudos Live Board.
 *
 * A single KudosFilter is shared between the Highlight carousel and the All Kudos
 * feed. Changing either dropdown resets both lists (the query key includes the
 * filter object, so React Query refetches automatically).
 *
 * Usage: call useFilters() in the nearest shared ancestor; pass filter/setFilter
 * down as props or lift into context if the component tree gets deep.
 */

import { useState, useCallback } from "react";
import type { KudosFilter } from "./types";

export interface UseFiltersReturn {
  filter: KudosFilter;
  setHashtag: (hashtag: string | null) => void;
  setDepartmentId: (departmentId: number | null) => void;
  clearFilters: () => void;
}

const DEFAULT_FILTER: KudosFilter = { hashtag: null, departmentId: null };

export function useFilters(): UseFiltersReturn {
  const [filter, setFilter] = useState<KudosFilter>(DEFAULT_FILTER);

  const setHashtag = useCallback((hashtag: string | null) => {
    setFilter((prev) => ({ ...prev, hashtag }));
  }, []);

  const setDepartmentId = useCallback((departmentId: number | null) => {
    setFilter((prev) => ({ ...prev, departmentId }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilter(DEFAULT_FILTER);
  }, []);

  return { filter, setHashtag, setDepartmentId, clearFilters };
}
