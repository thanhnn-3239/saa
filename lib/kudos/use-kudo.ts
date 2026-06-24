"use client";

import { useQuery } from "@tanstack/react-query";
import type { KudoCard } from "./types";

/** Query key for a single kudo by id. */
export function kudoByIdKey(id: string) {
  return ["kudos", "by-id", id] as const;
}

async function fetchKudo(id: string): Promise<KudoCard> {
  const res = await fetch(`/api/kudos/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to load kudo (${res.status})`);
  }
  return (await res.json()) as KudoCard;
}

/**
 * Fetch a single kudo for the detail modal. Disabled while `id` is null so the
 * modal only queries when ?kudo=<id> is present.
 */
export function useKudo(id: string | null) {
  return useQuery({
    queryKey: id ? kudoByIdKey(id) : ["kudos", "by-id", "none"],
    queryFn: () => fetchKudo(id as string),
    enabled: id !== null,
  });
}
