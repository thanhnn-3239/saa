"use client";

/**
 * Thin wrapper around useKudosFeed for the profile page's Sent / Received feed.
 *
 * The query key includes `direction` (via KudosFilter) so toggling between
 * "sent" and "received" resets pagination — the same pattern used by hashtag
 * and departmentId filters on the global board.
 *
 * `profileId` is NOT passed by the client hook — it is omitted from the fetch
 * params intentionally. The route handler derives the subject user from the
 * session (server-side, self-only scope). The `profileId` field on KudosFilter
 * is included in the query key only to ensure cache isolation when a future
 * caller provides it; today on /profile it is always the session user.
 */

import { useKudosFeed } from "@/lib/kudos/use-kudos-feed";
import type { KudoCard } from "@/lib/kudos/types";
import type { KudosPage } from "@/lib/kudos/queries";

export type FeedDirection = "sent" | "received";

/**
 * Profile feed hook — scoped to the session user's sent or received kudos.
 * Pagination resets whenever `direction` changes.
 *
 * @param direction - "sent" | "received"
 * @param limit     - Items per page (default 20)
 */
export function useProfileFeed(direction: FeedDirection, limit = 20) {
  // profileId is intentionally omitted from the client-side filter.
  // The route handler resolves it server-side from the session cookie.
  // It appears here only as a type-safe empty string sentinel for query-key
  // isolation; the route ignores client-supplied profileId.
  const filter = {
    hashtag: null,
    departmentId: null,
    direction,
    // profileId left undefined — route derives it from session.
  } as const;

  return useKudosFeed(filter, limit);
}

/**
 * Flatten TanStack infinite pages into a single array of KudoCard items.
 * Call this on the `data` returned by useProfileFeed.
 */
export function flattenProfileFeedPages(
  data: { pages: KudosPage[] } | undefined,
): KudoCard[] {
  if (!data) return [];
  return data.pages.flatMap((page) => page.items);
}
