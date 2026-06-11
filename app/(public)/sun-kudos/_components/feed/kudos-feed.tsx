"use client";
/**
 * KudosFeed — Section C: "ALL KUDOS" header + vertical feed with infinite scroll.
 *
 * Design ref: Figma C_All kudos (2940:13475), two-column layout:
 *   - Left col (680px): scrollable list of KudoPostCards
 *   - Right col (422px): Sidebar (D) — passed as a slot to keep coupling minimal
 *
 * Infinite scroll: IntersectionObserver sentinel triggers onLoadMore.
 * Empty state: "Hiện tại chưa có Kudos nào."
 *
 * i18n strings:
 *   Kudos.feed.eyebrow     → "Sun* Annual Awards 2025"
 *   Kudos.feed.title       → "ALL KUDOS"
 *   Kudos.feed.empty       → "Hiện tại chưa có Kudos nào."
 *   Kudos.feed.loading     → (aria-label on sentinel)
 */

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { SectionHeader } from "../ui/section-header";
import { EmptyState } from "../ui/empty-state";
import { KudoCardSkeleton } from "../ui/skeleton";
import { KudoPostCard } from "./kudo-post-card";
import type { KudoCard } from "@/lib/kudos/types";

interface KudosFeedProps {
  cards: KudoCard[];
  hasNext: boolean;
  isLoading: boolean;
  /** Server-injected origin for copy-link URL construction. */
  baseUrl: string;
  onLoadMore: () => void;
  onLike?: (id: string) => void;
  onCopyLink?: (id: string) => void;
  onOpenProfile?: (profileId: string) => void;
  onOpenImage?: (kudoId: string, index: number) => void;
  /** Right sidebar slot (D — SidebarStats) */
  sidebar?: React.ReactNode;
}

export function KudosFeed({
  cards,
  hasNext,
  isLoading,
  baseUrl,
  onLoadMore,
  onLike,
  onCopyLink,
  onOpenProfile,
  onOpenImage,
  sidebar,
}: KudosFeedProps) {
  const t = useTranslations("Home.kudosPage");
  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNext || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNext, isLoading, onLoadMore]);

  return (
    // data-testid scopes E2E selectors to the feed — the same kudo also renders
    // in the highlight carousel, so an unscoped locator would match twice.
    <section className="w-full" data-testid="all-kudos-feed">
      {/* Center the content at the reference width (feed ~770 + gap-12 + sidebar 422
          = 1240), matching production /kudos. px outside max-w on small screens,
          0 at desktop so content lands at the centered box edge like the reference. */}
      <div className="mx-auto max-w-[1240px] px-4 sm:px-9 xl:px-0">
        {/* Header — C.1 */}
        <SectionHeader eyebrow={t("feed.eyebrow")} title={t("feed.title")} />

        {/* Two-column layout: feed (left, dominant) + sidebar (right, narrower) */}
        <div className="mt-10 flex gap-12 items-start">
        {/* C.2 — Feed column: flex-1 so it takes all remaining width */}
        <div className="flex flex-col gap-6 flex-1 min-w-0">
          {cards.length === 0 && !isLoading ? (
            <EmptyState message={t("feed.empty")} />
          ) : (
            <>
              {cards.map((card) => (
                <KudoPostCard
                  key={card.id}
                  card={card}
                  baseUrl={baseUrl}
                  onLike={onLike}
                  onCopyLink={onCopyLink}
                  onOpenProfile={onOpenProfile}
                  onOpenImage={onOpenImage}
                />
              ))}

              {/* Loading skeletons */}
              {isLoading && (
                <>
                  <KudoCardSkeleton />
                  <KudoCardSkeleton />
                </>
              )}

              {/* Infinite scroll sentinel */}
              {hasNext && !isLoading && (
                <div
                  ref={sentinelRef}
                  aria-label={t("feed.loadingMore")}
                  className="h-4"
                />
              )}
            </>
          )}
        </div>

        {/* D — Sidebar slot (sticky, fixed width, no overflow — each inner block owns its scroll) */}
        {sidebar && (
          <aside className="w-[422px] shrink-0 sticky top-24 self-start">
            {sidebar}
          </aside>
        )}
        </div>
      </div>
    </section>
  );
}
