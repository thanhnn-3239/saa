/**
 * Sun* Kudos Live Board — page root (Server Component).
 *
 * Responsibilities:
 *   1. Resolve session user (for currentUserId propagation)
 *   2. Prefetch highlight + first feed page + filters + sidebar + spotlight
 *      into a QueryClient so the client shell hydrates without a loading flash.
 *   3. Dehydrate the QueryClient and wrap the client board in HydrationBoundary.
 *   4. Inject server-side baseUrl so copy-link never touches window.location.
 *
 * The board is already login-gated by proxy.ts; getSessionUser() returning null
 * here is a defense-in-depth guard, not the primary auth path.
 */

import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { headers } from "next/headers";

import { makeQueryClient } from "@/lib/query/query-client";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { getHighlightKudos, getKudosPage, getHashtags, getDepartments } from "@/lib/kudos/queries";
import { getSidebarStats, getRecentGiftReceivers, getRecentPromotions } from "@/lib/kudos/sidebar-queries";
import { getKudosTotal, getSpotlightNodes } from "@/lib/kudos/spotlight-queries";
import {
  highlightKudosKey,
  kudosFeedKey,
  spotlightKey,
  sidebarKey,
} from "@/lib/kudos/query-keys";

import { KudosBoard } from "./_components/kudos-board";

const DEFAULT_FILTER = { hashtag: null, departmentId: null };

export default async function SunKudosPage() {
  // ── Session ────────────────────────────────────────────────────────────────
  const user = await getSessionUser();

  // ── Base URL (server-injected to avoid window usage in copy-link) ──────────
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const baseUrl = `${proto}://${host}`;

  // ── Server prefetch ────────────────────────────────────────────────────────
  const queryClient = makeQueryClient();

  // Run all prefetches in parallel — individual failures are isolated.
  await Promise.allSettled([
    // Highlight carousel (top-5 by hearts)
    queryClient.prefetchQuery({
      queryKey: highlightKudosKey(DEFAULT_FILTER),
      queryFn: () => getHighlightKudos(DEFAULT_FILTER),
    }),

    // Feed first page
    queryClient.prefetchInfiniteQuery({
      queryKey: kudosFeedKey(DEFAULT_FILTER),
      queryFn: () => getKudosPage({ filter: DEFAULT_FILTER }),
      initialPageParam: null,
    }),

    // Spotlight cloud
    queryClient.prefetchQuery({
      queryKey: spotlightKey,
      queryFn: async () => {
        const [total, nodes] = await Promise.all([
          getKudosTotal(),
          getSpotlightNodes(),
        ]);
        return { total, nodes };
      },
    }),

    // Sidebar — requires authenticated user
    user
      ? queryClient.prefetchQuery({
          queryKey: sidebarKey,
          queryFn: async () => {
            const [stats, recentGiftReceivers, recentPromotions] = await Promise.all([
              getSidebarStats(user.id),
              getRecentGiftReceivers(),
              getRecentPromotions(),
            ]);
            return { stats, recentGiftReceivers, recentPromotions };
          },
        })
      : Promise.resolve(),
  ]);

  // ── Filter dropdown lists (used to populate selects) ─────────────────────
  const [hashtags, departments] = await Promise.allSettled([
    getHashtags(),
    getDepartments(),
  ]).then(([h, d]) => [
    h.status === "fulfilled" ? h.value : [],
    d.status === "fulfilled" ? d.value : [],
  ] as const);

  const hashtagOptions = hashtags.map((t) => ({ value: t.name, label: t.name }));
  const departmentOptions = departments.map((d) => ({
    value: String(d.id),
    label: d.name,
  }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <KudosBoard
        currentUserId={user?.id ?? null}
        baseUrl={baseUrl}
        hashtagOptions={hashtagOptions}
        departmentOptions={departmentOptions}
      />
    </HydrationBoundary>
  );
}
