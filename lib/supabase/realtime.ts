"use client";

import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

/** Postgres change event types supported by Supabase Realtime. */
export type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

/**
 * Payload delivered to the handler on each Realtime change.
 * Typed as Record<string, unknown> because the exact row shape varies per table;
 * callers should narrow to their specific row type after receiving the payload.
 */
export type RealtimePayload = RealtimePostgresChangesPayload<
  Record<string, unknown>
>;

/**
 * Subscribe to Postgres row-level changes on a single table via Supabase Realtime.
 *
 * @param channelName - Unique channel identifier (e.g. "kudos-feed", "heart-counts").
 * @param table       - Postgres table name to watch (e.g. "kudos", "kudo_likes").
 * @param event       - Change event to subscribe to: "INSERT" | "UPDATE" | "DELETE" | "*".
 * @param handler     - Called with the change payload on each matching event.
 * @returns Cleanup function — call it in useEffect's return or on unmount.
 *
 * @example
 * useEffect(() => {
 *   return subscribeToTable("kudos-feed", "kudos", "INSERT", (payload) => {
 *     queryClient.invalidateQueries({ queryKey: ["kudos"] });
 *   });
 * }, []);
 */
export function subscribeToTable(
  channelName: string,
  table: string,
  event: RealtimeEvent,
  handler: (payload: RealtimePayload) => void,
): () => void {
  const supabase = createClient();

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event, schema: "public", table },
      handler,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
