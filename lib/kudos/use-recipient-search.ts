"use client";

/**
 * Recipient autocomplete for the send-kudo dialog.
 *
 * Debounces the raw input term (300ms), then queries
 * GET /api/kudos/spotlight?search=<term>&excludeSelf=1 — the server resolves
 * the authenticated user and excludes them from results (no self-kudos).
 *
 * Returns ProfileBrief[] (empty while term is blank).
 */

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ProfileBrief } from "./types";

const DEBOUNCE_MS = 300;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

async function fetchRecipients(term: string): Promise<ProfileBrief[]> {
  const params = new URLSearchParams({ search: term, excludeSelf: "1" });
  const res = await fetch(`/api/kudos/spotlight?${params.toString()}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  const body = (await res.json()) as { results: ProfileBrief[] };
  return body.results;
}

export function useRecipientSearch(term: string) {
  const debouncedTerm = useDebouncedValue(term.trim(), DEBOUNCE_MS);

  return useQuery({
    queryKey: ["kudos", "recipient-search", debouncedTerm] as const,
    queryFn: () => fetchRecipients(debouncedTerm),
    enabled: debouncedTerm.length >= 1,
    staleTime: 30_000,
  });
}
