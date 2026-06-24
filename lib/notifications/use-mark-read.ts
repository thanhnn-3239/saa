"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsKey, unreadCountKey } from "./query-keys";

async function patchOne(id: number): Promise<void> {
  const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  if (!res.ok) throw new Error(`mark-read ${res.status}`);
}

async function postAll(): Promise<void> {
  const res = await fetch("/api/notifications/mark-all-read", { method: "POST" });
  if (!res.ok) throw new Error(`mark-all-read ${res.status}`);
}

/**
 * Mark-read mutations. On success, invalidate the list + unread-count queries
 * so the badge and any open list refetch.
 */
export function useMarkRead() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: notificationsKey });
    qc.invalidateQueries({ queryKey: unreadCountKey });
  };

  const one = useMutation({ mutationFn: patchOne, onSuccess: invalidate });
  const all = useMutation({ mutationFn: postAll, onSuccess: invalidate });

  return {
    markOne: (id: number) => one.mutate(id),
    markAll: () => all.mutate(),
    isPending: one.isPending || all.isPending,
  };
}
