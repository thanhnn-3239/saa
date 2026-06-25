/**
 * /profile — authenticated self-profile page (Server Component).
 *
 * Responsibilities:
 *   1. Resolve the session user; redirect to /login if unauthenticated
 *      (defense-in-depth — the proxy already handles the primary redirect).
 *   2. Parallel-fetch all page data: header, badges, sidebar stats, and the
 *      first page of the "sent" feed.
 *   3. Prefetch the feed into a QueryClient and dehydrate it so the client
 *      shell (ProfileContent) hydrates without a loading flash.
 *   4. Render ProfileHero (static, server) + HydrationBoundary-wrapped
 *      ProfileContent which owns direction state + infinite scroll.
 *
 * Security: profileId is always the session user — never client-supplied.
 */

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";

import { makeQueryClient } from "@/lib/query/query-client";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { getProfileHeader, getIconCollection } from "@/lib/profile/queries";
import { getSidebarStats } from "@/lib/kudos/sidebar-queries";
import { getKudosPage } from "@/lib/kudos/queries";
import { kudosFeedKey } from "@/lib/kudos/query-keys";
import { ROUTES } from "@/lib/navigation/routes";

import { ProfileContent } from "./_components/profile-content";

export async function generateMetadata() {
  const t = await getTranslations("Profile");
  return { title: t("pageTitle") };
}

export default async function ProfilePage() {
  // ── Session ────────────────────────────────────────────────────────────────
  const user = await getSessionUser();
  if (!user) {
    redirect(ROUTES.home); // proxy sends to /login; this is defense-in-depth
  }

  // ── Base URL (server-injected for copy-link, avoids window.location) ───────
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const baseUrl = `${proto}://${host}`;

  // ── Parallel server fetch ──────────────────────────────────────────────────
  // All four fetches are independent — run them in parallel to avoid waterfall.
  // Individual failures are isolated; the page renders with partial/empty data.
  const [headerResult, badgesResult, statsResult] = await Promise.allSettled([
    getProfileHeader(user.id),
    getIconCollection(user.id),
    getSidebarStats(user.id),
  ]);

  const initialHeader =
    headerResult.status === "fulfilled"
      ? headerResult.value
      : {
          id: user.id,
          fullName: user.email,
          avatarUrl: null,
          role: "member",
          departmentName: null,
          kudosReceived: 0,
          heroTier: null,
        };

  const initialBadges =
    badgesResult.status === "fulfilled" ? badgesResult.value : [];

  const initialStats =
    statsResult.status === "fulfilled"
      ? statsResult.value
      : {
          kudosSent: 0,
          kudosReceived: 0,
          heartsReceived: 0,
          badgesCount: 0,
          secretBoxes: { unopened: 0, total: 0 },
        };

  // ── Feed prefetch into QueryClient ────────────────────────────────────────
  // The query key must match exactly what useProfileFeed("sent") generates:
  //   kudosFeedKey({ hashtag: null, departmentId: null, direction: "sent" })
  // profileId is NOT in the client key (the route handler derives it from session).
  // We pass profileId only in the queryFn so the server query is correctly scoped.
  const queryClient = makeQueryClient();
  const profileFeedFilter = {
    hashtag: null,
    departmentId: null,
    direction: "sent" as const,
  };

  await queryClient.prefetchInfiniteQuery({
    queryKey: kudosFeedKey(profileFeedFilter),
    queryFn: () =>
      getKudosPage({
        filter: { ...profileFeedFilter, profileId: user.id },
        currentUserId: user.id,
      }),
    initialPageParam: null,
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProfileContent
        initialHeader={initialHeader}
        initialBadges={initialBadges}
        initialStats={initialStats}
        baseUrl={baseUrl}
      />
    </HydrationBoundary>
  );
}
