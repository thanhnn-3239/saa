"use client";
/**
 * KudosBoard — client container that wires all real hooks to the presentational sections.
 *
 * Responsibilities:
 *   - Shared filter state (useFilters) flowing to Highlight + Feed
 *   - useHighlightKudos / useKudosFeed / useSpotlight / useSidebar hooks
 *   - useToggleLike optimistic mutation with self-like guard
 *   - Realtime subscriptions: kudos INSERT + kudo_likes INSERT/DELETE
 *   - i18n via useTranslations("Home.kudosPage")
 *   - Passes real data + callbacks to all presentational sections
 *   - Composes sidebar and passes it into KudosFeed slot
 *
 * Stubs (documented, tracked in C1 report):
 *   - onViewDetail → no-op (needs kudos detail page)
 *   - onOpenProfile → no-op (needs profile page)
 *   - onOpenImage → no-op (needs lightbox)
 *   - onOpenGift → toast stub (needs gift flow)
 *   - onOpenSendDialog → no-op (needs send-kudos dialog)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";

import { useFilters } from "@/lib/kudos/use-filters";
import { useHighlightKudos, highlightKudosKey } from "@/lib/kudos/use-highlight-kudos";
import { useKudosFeed, kudosFeedKey } from "@/lib/kudos/use-kudos-feed";
import { useToggleLike } from "@/lib/kudos/use-toggle-like";
import { useSpotlight } from "@/lib/kudos/use-spotlight";
import { useSidebar } from "@/lib/kudos/use-sidebar";
import { subscribeToTable } from "@/lib/supabase/realtime";
import { spotlightKey } from "@/lib/kudos/use-spotlight";

import { Banner } from "./banner";
import { HighlightCarousel } from "./highlight/highlight-carousel";
import { SpotlightCloud } from "./spotlight/spotlight-cloud";
import { KudosFeed } from "./feed/kudos-feed";
import { SidebarStatsBlock } from "./sidebar/sidebar-stats";
import { LeaderboardList } from "./sidebar/leaderboard-list";
import { useSendKudo } from "../../_components/send-kudo-provider";
import { KudoDetailModal } from "./kudo-detail-modal";

import type { KudoCard, KudosFilter } from "@/lib/kudos/types";
import type { KudosPage } from "@/lib/kudos/queries";

interface KudosBoardProps {
  currentUserId: string | null;
  /** Server-injected base URL (e.g. https://saa.sun-asterisk.com) for copy-link. */
  baseUrl: string;
  /** Pre-populated dropdown options (from server prefetch). */
  hashtagOptions: Array<{ value: string; label: string }>;
  departmentOptions: Array<{ value: string; label: string }>;
}

export function KudosBoard({
  currentUserId,
  baseUrl,
  hashtagOptions,
  departmentOptions,
}: KudosBoardProps) {
  const t = useTranslations("Home.kudosPage");
  const queryClient = useQueryClient();

  // ── Send-kudo dialog — owned by the app-level provider (also opened by the
  //    floating widget button + Thể lệ panel). The banner just triggers it. ──
  const { openSendKudo } = useSendKudo();

  // ── Spotlight search state (shared between Banner pill + SpotlightCloud) ──
  const [spotlightSearchTerm, setSpotlightSearchTerm] = useState("");
  // Ref to the Spotlight section for scroll-into-view from Banner
  const spotlightSectionRef = useRef<HTMLElement | null>(null);

  const handleSpotlightSearchChange = useCallback((term: string) => {
    setSpotlightSearchTerm(term);
  }, []);

  // ── Filter state ──────────────────────────────────────────────────────────
  const { filter, setHashtag, setDepartmentId } = useFilters();

  const handleFilterChange = useCallback(
    (next: KudosFilter) => {
      if (next.hashtag !== filter.hashtag) setHashtag(next.hashtag);
      if (next.departmentId !== filter.departmentId) setDepartmentId(next.departmentId);
    },
    [filter, setHashtag, setDepartmentId],
  );

  // ── Data hooks ─────────────────────────────────────────────────────────────
  const highlightQuery = useHighlightKudos(filter);
  const feedQuery = useKudosFeed(filter);
  const spotlightQuery = useSpotlight();
  const sidebarQuery = useSidebar();

  // ── Like mutation ─────────────────────────────────────────────────────────
  const toggleLike = useToggleLike(currentUserId);

  const handleLike = useCallback(
    (card: KudoCard) => {
      // Self-like guard via ownedByViewer (server-computed) — correct even for
      // anonymous kudos, where card.sender.id is masked. Also skip when logged out.
      if (currentUserId === null || card.ownedByViewer) return;
      toggleLike.mutate({
        kudoId: card.id,
        currentlyLiked: card.liked,
        filter,
      });
    },
    [currentUserId, filter, toggleLike],
  );

  // ── Realtime subscriptions ────────────────────────────────────────────────
  // Debounce timer ref to coalesce rapid INSERT events
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // kudos INSERT → invalidate both highlight and feed caches + bump spotlight total
    const cleanupKudos = subscribeToTable(
      "kudos-board-insert",
      "kudos",
      "INSERT",
      () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          void queryClient.invalidateQueries({ queryKey: kudosFeedKey(filter) });
          void queryClient.invalidateQueries({ queryKey: highlightKudosKey(filter) });
          void queryClient.invalidateQueries({ queryKey: spotlightKey });
        }, 300);
      },
    );

    // kudo_likes INSERT → patch heartTotal + liked in both caches optimistically
    const cleanupLikesInsert = subscribeToTable(
      "kudos-board-likes-insert",
      "kudo_likes",
      "INSERT",
      (payload) => {
        const row = payload.new as { kudo_id?: string; user_id?: string } | undefined;
        if (!row?.kudo_id) return;
        const kudoId = row.kudo_id;

        // Only patch if it came from another user (own likes already handled optimistically)
        if (row.user_id === currentUserId) return;

        patchHeartCounts(queryClient, filter, kudoId, +1);
      },
    );

    // kudo_likes DELETE → decrement heart count in caches
    const cleanupLikesDelete = subscribeToTable(
      "kudos-board-likes-delete",
      "kudo_likes",
      "DELETE",
      (payload) => {
        const row = payload.old as { kudo_id?: string; user_id?: string } | undefined;
        if (!row?.kudo_id) return;
        const kudoId = row.kudo_id;

        if (row.user_id === currentUserId) return;

        patchHeartCounts(queryClient, filter, kudoId, -1);
      },
    );

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      cleanupKudos();
      cleanupLikesInsert();
      cleanupLikesDelete();
    };
  }, [queryClient, filter, currentUserId]);

  // Cleanup gift toast timer on unmount
  useEffect(() => {
    return () => { if (giftToastTimer.current) clearTimeout(giftToastTimer.current); };
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────
  const highlightCards = highlightQuery.data ?? [];
  const feedPages = feedQuery.data?.pages ?? [];
  const feedCards = feedPages.flatMap((p) => p.items);
  const hasNextPage = feedQuery.hasNextPage ?? false;
  const isFeedLoading = feedQuery.isLoading || feedQuery.isFetchingNextPage;

  const {
    total: spotlightTotal,
    nodes: spotlightNodes,
    isLoading: spotlightLoading,
  } = spotlightQuery;

  const sidebarData = sidebarQuery.data;

  // ── Handlers (stubs) ──────────────────────────────────────────────────────
  const noop = useCallback(() => {}, []);
  const handleOpenProfile = useCallback((_id: string) => {}, []);
  const handleViewDetail = useCallback((_id: string) => {}, []);
  const handleOpenImage = useCallback((_kudoId: string, _index: number) => {}, []);
  const handleNodeClick = useCallback((_profileId: string) => {}, []);

  // Toast state for gift stub feedback (replaces window.alert).
  const [giftToast, setGiftToast] = useState(false);
  const giftToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpenGift = useCallback(() => {
    // Stub: Secret Box gift flow not yet implemented (tracked in C2 plan).
    // Show a toast instead of window.alert to avoid blocking the main thread.
    setGiftToast(true);
    if (giftToastTimer.current) clearTimeout(giftToastTimer.current);
    // eslint-disable-next-line react-hooks/immutability -- timer ref mutation in an event handler is safe
    giftToastTimer.current = setTimeout(() => setGiftToast(false), 2500);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
      void feedQuery.fetchNextPage();
    }
  }, [feedQuery]);



  // ── Sidebar composition ───────────────────────────────────────────────────
  // Design: secret-box stats block is separate (no scrollbar); only NHẬN QUÀ list scrolls.
  // Promotions leaderboard ("THĂNG HẠNG") is NOT in the design — removed from render.
  const sidebar = (
    <div className="flex flex-col gap-6">
      {/* D.1 — Stats + Open Secret Box (no overflow — self-contained block) */}
      <SidebarStatsBlock
        stats={
          sidebarData?.stats ?? {
            kudosSent: 0,
            kudosReceived: 0,
            heartsReceived: 0,
            badgesCount: 0,
            secretBoxes: { unopened: 0, total: 0 },
          }
        }
        onOpenGift={handleOpenGift}
      />
      {/* D.3 — 10 SUNNER NHẬN QUÀ MỚI NHẤT (internal scrollbar via scrollbar-saa) */}
      <LeaderboardList
        title={t("leaderboard.gifts.title")}
        items={sidebarData?.recentGiftReceivers ?? []}
        scoreLabel={t("leaderboard.gifts.scoreLabel")}
        onOpenProfile={handleOpenProfile}
      />
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="w-full min-h-screen bg-saa-navy-darkest flex flex-col gap-0">
      {/* Kudo detail modal — opens when ?kudo=<id> is present in the URL */}
      <KudoDetailModal baseUrl={baseUrl} />
      {/* Gift stub toast — replaces window.alert, auto-dismisses after 2.5 s */}
      {giftToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] rounded-lg bg-saa-navy-elevated border border-saa-gold-border px-5 py-3 text-sm font-semibold text-saa-gold-accent shadow-saa-glow animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {t("sidebar.openGiftStub")}
        </div>
      )}
      {/* ── A: Banner KV ─────────────────────────────────────────────────── */}
      <Banner
        onOpenSendDialog={openSendKudo}
        spotlightSearch={spotlightSearchTerm}
        onSpotlightSearchChange={handleSpotlightSearchChange}
        spotlightRef={spotlightSectionRef}
      />

      {/* ── B: Highlight Kudos Carousel ───────────────────────────────────── */}
      <div className="w-full py-16 bg-saa-navy-darkest">
        <HighlightCarousel
          cards={highlightCards}
          filter={filter}
          baseUrl={baseUrl}
          onFilterChange={handleFilterChange}
          onLike={(id) => {
            const card = highlightCards.find((c) => c.id === id);
            if (card) handleLike(card);
          }}
          onCopyLink={noop}
          onViewDetail={handleViewDetail}
          onOpenProfile={handleOpenProfile}
          hashtagOptions={hashtagOptions}
          departmentOptions={departmentOptions}
        />
      </div>

      {/* ── B.6/B.7: Spotlight Board ──────────────────────────────────────── */}
      <SpotlightCloud
        total={spotlightTotal}
        nodes={spotlightNodes}
        isLoading={spotlightLoading}
        searchTerm={spotlightSearchTerm}
        onSearchChange={handleSpotlightSearchChange}
        onNodeClick={handleNodeClick}
        ref={spotlightSectionRef}
      />

      {/* ── C + D: All Kudos feed (sidebar slot inside) ───────────────────── */}
      <div className="w-full py-16">
        <KudosFeed
          cards={feedCards}
          hasNext={hasNextPage}
          isLoading={isFeedLoading}
          baseUrl={baseUrl}
          onLoadMore={handleLoadMore}
          onLike={(id) => {
            const card = feedCards.find((c) => c.id === id);
            if (card) handleLike(card);
          }}
          onCopyLink={noop}
          onOpenProfile={handleOpenProfile}
          onOpenImage={handleOpenImage}
          sidebar={sidebar}
        />
      </div>
    </main>
  );
}

// ── Cache patch helper (for realtime like events from other users) ────────────

function patchHeartCounts(
  queryClient: ReturnType<typeof useQueryClient>,
  filter: KudosFilter,
  kudoId: string,
  delta: 1 | -1,
) {
  const patchCard = (card: KudoCard): KudoCard =>
    card.id === kudoId
      ? { ...card, heartTotal: Math.max(0, card.heartTotal + delta) }
      : card;

  // Patch highlight cache
  queryClient.setQueryData<KudoCard[]>(highlightKudosKey(filter), (old) =>
    old ? old.map(patchCard) : old,
  );

  // Patch feed cache (infinite pages)
  queryClient.setQueryData<{ pages: KudosPage[] }>(
    kudosFeedKey(filter),
    (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map(patchCard),
            })),
          }
        : old,
  );
}
