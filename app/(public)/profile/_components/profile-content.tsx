"use client";
/**
 * ProfileContent — client shell for the /profile page.
 *
 * Wires the Track A UI to real data from the server prefetch (HydrationBoundary)
 * and the profile feed hook (useProfileFeed). Handles direction toggle and
 * infinite scroll (IntersectionObserver sentinel pattern).
 *
 * Regions:
 *   A  — ProfileHero (server-rendered, passed via props)
 *   B  — SidebarStatsBlock (stats card)
 *   C  — ProfileAwardsHeader (awards title + Sent/Received toggle)
 *   D  — ProfileFeed (infinite-scroll kudo cards)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { SidebarStatsBlock } from "@/app/(public)/sun-kudos/_components/sidebar/sidebar-stats";
import { ProfileHero } from "./profile-hero";
import { ProfileAwardsHeader } from "./profile-awards-header";
import { ProfileFeed } from "./profile-feed";
import { useProfileFeed, flattenProfileFeedPages } from "@/lib/profile/use-profile-feed";

import type { ProfileHeader } from "@/lib/profile/types";
import type { IconBadge } from "@/lib/profile/types";
import type { SidebarStats } from "@/lib/kudos/types";
import type { FeedDirection } from "@/lib/profile/use-profile-feed";

interface ProfileContentProps {
  initialHeader: ProfileHeader;
  initialBadges: IconBadge[];
  initialStats: SidebarStats;
  /** Server-injected origin for copy-link URLs. */
  baseUrl: string;
}

export function ProfileContent({
  initialHeader,
  initialBadges,
  initialStats,
  baseUrl,
}: ProfileContentProps) {
  const t = useTranslations("Profile");
  const [direction, setDirection] = useState<FeedDirection>("sent");

  // ── Feed data via TanStack Query (seeded by HydrationBoundary prefetch) ────
  const feedQuery = useProfileFeed(direction);
  const cards = flattenProfileFeedPages(feedQuery.data);
  const hasNextPage = feedQuery.hasNextPage ?? false;
  const isFetchingNextPage = feedQuery.isFetchingNextPage;

  // ── Infinite scroll sentinel ────────────────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void feedQuery.fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, feedQuery]);

  // ── Direction toggle: reset is handled automatically by query key change ───
  const handleDirectionChange = useCallback((next: FeedDirection) => {
    setDirection(next);
  }, []);

  // ── Stat counts for toggle labels ─────────────────────────────────────────
  const sentCount = initialStats.kudosSent;
  const receivedCount = initialStats.kudosReceived;

  // ── Empty / loading message ────────────────────────────────────────────────
  const isEmpty = !feedQuery.isLoading && cards.length === 0;

  return (
    <div className="w-full">
      {/* Region A — Hero (full-width keyvisual band) */}
      <ProfileHero header={initialHeader} badges={initialBadges} />

      {/* Regions B + C + D — centred content column (680px) */}
      <div className="max-w-[680px] mx-auto px-4 pb-16 flex flex-col gap-6 mt-10">
        {/* B — Stats card (Secret Box "Mở Secret Box" is display-only per clarification) */}
        <SidebarStatsBlock stats={initialStats} onOpenGift={undefined} />

        {/* C — Awards header + Sent/Received toggle */}
        <ProfileAwardsHeader
          direction={direction}
          sentCount={sentCount}
          receivedCount={receivedCount}
          onDirectionChange={handleDirectionChange}
        />

        {/* D — Kudo post feed */}
        {isEmpty ? (
          <p className="font-montserrat text-saa-text-muted text-center py-12">
            {t("emptyFeed")}
          </p>
        ) : (
          <ProfileFeed cards={cards} baseUrl={baseUrl} />
        )}

        {/* Loading indicator */}
        {isFetchingNextPage && (
          <p className="font-montserrat text-saa-text-muted text-center py-4 text-sm">
            {t("loadingMore")}
          </p>
        )}

        {/* Infinite scroll sentinel — invisible div watched by IntersectionObserver */}
        {hasNextPage && (
          <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
        )}
      </div>
    </div>
  );
}
