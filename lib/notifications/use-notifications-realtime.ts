"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeToTable } from "@/lib/supabase/realtime";
import { notificationsKey, unreadCountKey } from "./query-keys";

/**
 * Subscribe to INSERTs on `notifications`. Supabase Realtime applies RLS, so a
 * client only receives its own rows. On each insert, invalidate the list +
 * unread-count so the badge updates live without opening the panel.
 *
 * Mount once in an always-rendered authenticated component (the bell).
 */
export function useNotificationsRealtime(): void {
  const qc = useQueryClient();
  useEffect(() => {
    return subscribeToTable("notifications", "notifications", "INSERT", () => {
      qc.invalidateQueries({ queryKey: notificationsKey });
      qc.invalidateQueries({ queryKey: unreadCountKey });
    });
  }, [qc]);
}
