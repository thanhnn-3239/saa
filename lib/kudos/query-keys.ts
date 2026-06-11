/**
 * TanStack Query key factories — server-safe (NO "use client").
 *
 * These keys are imported by BOTH the server component (page.tsx prefetch) and
 * the client hooks. They MUST live in a non-client module: a function exported
 * from a "use client" file becomes a client reference and cannot be invoked
 * from the server (throws "Attempted to call X() from the server...").
 */

import type { KudosFilter } from "./types";

/** Highlight carousel (top-5 by hearts), keyed by active filter. */
export function highlightKudosKey(filter: KudosFilter) {
  return ["kudos", "highlight", filter] as const;
}

/** All-Kudos infinite feed, keyed by active filter. */
export function kudosFeedKey(filter: KudosFilter) {
  return ["kudos", "feed", filter] as const;
}

/** Spotlight cloud (total + nodes). */
export const spotlightKey = ["kudos", "spotlight"] as const;

/** Sidebar stats + leaderboards. */
export const sidebarKey = ["kudos", "sidebar"] as const;
