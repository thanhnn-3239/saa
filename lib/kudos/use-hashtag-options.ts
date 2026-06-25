"use client";

/**
 * Hashtag options for the send-kudo dialog picker.
 *
 * Reuses GET /api/kudos/filters (same source as the board filter dropdowns) and
 * selects only the hashtags list. Existing-only taxonomy — the dialog cannot
 * create new hashtags (clarification #4).
 */

import { useQuery } from "@tanstack/react-query";

export interface HashtagOption {
  id: number;
  name: string;
}

async function fetchHashtagOptions(): Promise<HashtagOption[]> {
  const res = await fetch("/api/kudos/filters");
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  const body = (await res.json()) as { hashtags: HashtagOption[] };
  return body.hashtags;
}

export function useHashtagOptions() {
  return useQuery({
    queryKey: ["kudos", "hashtag-options"] as const,
    queryFn: fetchHashtagOptions,
    staleTime: 5 * 60_000, // taxonomy changes rarely
  });
}
