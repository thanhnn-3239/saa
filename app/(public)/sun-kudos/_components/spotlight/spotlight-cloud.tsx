"use client";
/**
 * SpotlightCloud — Section B.7: word-cloud of recipient names.
 *
 * Design ref: Figma B.7_Spotlight (2940:14174):
 *   - Total count "388 KUDOS" CENTERED at top (white, Montserrat Bold 36px)
 *   - Search input TOP-LEFT corner (gold-glass pill, 219px wide per design)
 *   - Dense organic word-cloud; names packed tightly via spiral placement
 *   - Font-size tiers by kudosReceived weight (4 tiers: 24|20|17|14 px)
 *   - ONE name highlighted in salmon/red accent (#F17676 ≈ rgba(241,118,118,1)):
 *     the top-ranked recipient (or first matched name when searching)
 *   - Expand/fullscreen icon bottom-right
 *
 * Search behavior:
 *   - Client-side filter over loaded nodes (case-insensitive substring)
 *   - Controlled by `searchTerm` prop from parent (kudos-board.tsx)
 *   - Local input syncs to parent via `onSearchChange`
 *   - Empty state shown when filter yields 0 results
 *   - Clearing search restores all nodes
 */

import { useState, useCallback, useEffect, useId, forwardRef } from "react";
import { useTranslations } from "next-intl";
import { SectionHeader } from "../ui/section-header";
import { EmptyState } from "../ui/empty-state";
import type { SpotlightNode } from "@/lib/kudos/types";
import { computeCloudLayout } from "./word-cloud-layout";
import { usePanZoom } from "./use-pan-zoom";
import { ParticleNetwork } from "./particle-network";

interface SpotlightCloudProps {
  total: number;
  nodes: SpotlightNode[];
  isLoading?: boolean;
  /** Controlled search term lifted from kudos-board.tsx */
  searchTerm: string;
  /** Notify parent of search term changes */
  onSearchChange: (term: string) => void;
  onNodeClick: (profileId: string) => void;
}

/** Highlight colour — matches design rgba(241, 118, 118, 1) */
const ACCENT_RED = "#F17676";

/** Shared style for the round zoom / fullscreen control buttons. */
const CTRL_BTN =
  "flex items-center justify-center rounded-full border border-saa-navy-border w-9 h-9 text-saa-text-muted hover:text-saa-text-secondary hover:border-saa-gold-border transition-colors disabled:opacity-30 disabled:cursor-not-allowed";

export const SpotlightCloud = forwardRef<HTMLElement, SpotlightCloudProps>(
  function SpotlightCloud(
    {
      total,
      nodes,
      isLoading = false,
      searchTerm,
      onSearchChange,
      onNodeClick,
    },
    ref,
  ) {
  const t = useTranslations("Home.kudosPage.spotlight");
  const searchId = useId();

  // Pan + step-zoom for the cloud surface; fullscreen overlay toggle.
  const pz = usePanZoom();
  const [isFullscreen, setFullscreen] = useState(false);

  // Local input value mirrors the controlled prop
  const [inputValue, setInputValue] = useState(searchTerm);

  // Keep local input in sync when parent clears the term (banner clear)
  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  // ── Client-side filtering ─────────────────────────────────────────────────
  const normalised = searchTerm.toLowerCase().trim();
  const filteredNodes = normalised
    ? nodes.filter((n) =>
        n.profile.fullName.toLowerCase().includes(normalised),
      )
    : nodes;

  // Top-ranked recipient (first by kudosReceived) gets highlighted.
  // When a search filter is active, the first match is highlighted instead.
  const topId = filteredNodes.length > 0 ? filteredNodes[0].profile.id : null;

  // ── Word-cloud layout ─────────────────────────────────────────────────────
  // Container measured once on mount; falls back to 800×320 estimate.
  const [containerSize, setContainerSize] = useState({ w: 800, h: 320 });

  useEffect(() => {
    const el = pz.viewportRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setContainerSize({ w: width, h: height });
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
    // Reattach when the cloud (re)mounts (loading→data) or fullscreen resizes it.
  }, [pz.viewportRef, isLoading, isFullscreen, filteredNodes.length]);

  // Fullscreen: Escape to exit + lock body scroll while the overlay is open.
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreen]);

  const layoutNodes = filteredNodes.map((n, idx) => ({
    id: n.profile.id,
    label: n.profile.fullName,
    weight: n.weight,
    // Highlight the top node (index 0 after sort by kudosReceived descending)
    highlighted: n.profile.id === topId && idx === 0,
  }));

  // Memoisation would add complexity without correctness benefit here —
  // nodes only change on data refetch (infrequent) or filter change.
  const cloudBoxes = computeCloudLayout(
    layoutNodes,
    containerSize.w,
    containerSize.h,
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      // Live filtering: push to parent immediately (no debounce needed — client-side)
      onSearchChange(val);
    },
    [onSearchChange],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      // Empty submit is a no-op; filter is already applied via onChange
    },
    [],
  );

  const handleClear = useCallback(() => {
    setInputValue("");
    onSearchChange("");
  }, [onSearchChange]);

  const showEmpty = !isLoading && filteredNodes.length === 0;
  const emptyMessage = normalised ? t("noMatch") : t("empty");

  // Cloud surface height — taller when the panel is a fullscreen overlay.
  const cloudHeight = isFullscreen ? "calc(100vh - 260px)" : 320;

  return (
    <section ref={ref} className="w-full bg-saa-navy-darkest">
      {/* Dim backdrop behind the fullscreen overlay (click to dismiss). */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-black/80"
          aria-hidden="true"
          onClick={() => setFullscreen(false)}
        />
      )}
      <div className="mx-auto max-w-[1240px] px-4 sm:px-9 xl:px-0 py-12 flex flex-col gap-8">
        {/* Section header */}
        <SectionHeader eyebrow={t("eyebrow")} title={t("title")} />

        {/* Dark panel — B.7. Promotes to a fixed overlay in fullscreen mode. */}
        <div
          className={
            "relative w-full overflow-hidden " +
            (isFullscreen
              ? "fixed inset-3 sm:inset-6 z-[101] rounded-[24px]"
              : "rounded-[47px]")
          }
          style={{
            background: "#00101A",
            minHeight: isFullscreen ? 0 : 420,
            border: "1px solid #998C5F",
          }}
        >
          {/* Animated neural-network backdrop — drifting dots joined by lines,
              mirrors the production tsParticles "links" preset. Behind content. */}
          <ParticleNetwork className="absolute inset-0 z-0 pointer-events-none" />

          {/* All interactive content sits above the particle backdrop. */}
          <div className="relative z-10">
          {/* ── Top controls row ─────────────────────────────────────────── */}
          {/* Layout: search top-left (absolute), total count centered (full-width flex) */}
          <div className="relative flex items-center justify-center px-6 pt-6 pb-2 min-h-[60px]">
            {/* B.7.1 — total kudos count — CENTERED (position-independent of search) */}
            <p
              className="font-montserrat font-bold text-3xl text-white pointer-events-none"
              aria-label={t("totalAria", { count: total })}
            >
              {total.toLocaleString("vi-VN")} KUDOS
            </p>

            {/* B.7.3 — search bar — absolutely positioned TOP-LEFT */}
            <form
              role="search"
              onSubmit={handleSubmit}
              className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 rounded-full px-4 py-2 w-[188px] bg-black/30"
            >
              <label htmlFor={searchId} className="sr-only">
                {t("searchAria")}
              </label>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-saa-text-muted shrink-0"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                id={searchId}
                type="search"
                spellCheck={false}
                autoComplete="off"
                placeholder={t("searchPlaceholder")}
                value={inputValue}
                maxLength={100}
                onChange={handleInputChange}
                className="bg-transparent text-sm text-saa-text-primary placeholder:text-saa-text-muted focus:outline-none flex-1 min-w-0 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label={t("clearSearch")}
                  className="text-saa-text-muted hover:text-saa-text-secondary shrink-0"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </form>
          </div>

          {/* ── Word-cloud area ───────────────────────────────────────────── */}
          {isLoading ? (
            <div className="flex items-center justify-center" style={{ height: cloudHeight }}>
              <div
                className="w-8 h-8 border-2 border-saa-gold-accent/30 border-t-saa-gold-accent rounded-full animate-spin"
                role="status"
                aria-label={t("loading")}
              />
            </div>
          ) : showEmpty ? (
            <div style={{ height: cloudHeight }}>
              <EmptyState message={emptyMessage} className="text-saa-text-muted" />
            </div>
          ) : (
            /* Clip viewport — drag to pan when zoomed; inner surface is the
               scaled + translated cloud. Names drift via the .kudos-cloud-word
               animation (globals.css). */
            <div
              ref={pz.viewportRef}
              className="relative w-full overflow-hidden select-none"
              style={{
                height: cloudHeight,
                cursor: pz.scale > 1 ? (pz.isDragging ? "grabbing" : "grab") : "default",
                touchAction: pz.scale > 1 ? "none" : "auto",
              }}
              {...pz.bind}
            >
              <div
                className="absolute inset-0"
                aria-label={t("cloudAria")}
                style={{
                  transform: `scale(${pz.scale}) translate(${pz.pan.x}px, ${pz.pan.y}px)`,
                  transformOrigin: "center center",
                  transition: pz.isDragging ? "none" : "transform 0.18s ease-out",
                  willChange: "transform",
                }}
              >
                {cloudBoxes.map((box, i) => (
                  <button
                    key={box.id}
                    type="button"
                    onClick={() => {
                      // Suppress the click that ends a pan drag.
                      if (pz.movedRef.current) return;
                      onNodeClick(box.id);
                    }}
                    aria-label={t("nodeAria", {
                      name: box.label,
                      count:
                        filteredNodes.find((n) => n.profile.id === box.id)
                          ?.kudosReceived ?? 0,
                    })}
                    className="kudos-cloud-word absolute font-montserrat font-bold transition-colors duration-150 whitespace-nowrap leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold-accent rounded-sm hover:!text-saa-gold-accent"
                    style={
                      {
                        left: `${box.left}%`,
                        top: `${box.top}%`,
                        fontSize: box.fontSize,
                        color: box.highlighted ? ACCENT_RED : "rgba(255,255,255,0.85)",
                        // Per-word entrance stagger + varied float duration → organic.
                        "--cloud-delay": `${(i % 10) * 0.07}s`,
                        "--cloud-float-dur": `${8 + (i % 7) * 0.8}s`,
                      } as React.CSSProperties
                    }
                  >
                    {box.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Controls — zoom + fullscreen, bottom-right (B.7.2) ─────────── */}
          <div className="flex items-center justify-end gap-2 px-6 pb-4 pt-2">
            <button
              type="button"
              onClick={pz.zoomOut}
              disabled={!pz.canZoomOut}
              aria-label={t("zoomOut")}
              title={t("zoomOut")}
              className={CTRL_BTN}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button
              type="button"
              onClick={pz.reset}
              aria-label={t("zoomReset")}
              title={t("zoomReset")}
              className="flex items-center justify-center rounded-full border border-saa-navy-border h-9 min-w-[44px] px-2 font-montserrat text-xs font-semibold text-saa-text-muted hover:text-saa-text-secondary hover:border-saa-gold-border transition-colors"
            >
              {pz.scale.toFixed(1)}x
            </button>
            <button
              type="button"
              onClick={pz.zoomIn}
              disabled={!pz.canZoomIn}
              aria-label={t("zoomIn")}
              title={t("zoomIn")}
              className={CTRL_BTN}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setFullscreen((f) => !f)}
              aria-label={isFullscreen ? t("exitFullscreen") : t("enterFullscreen")}
              title={isFullscreen ? t("exitFullscreen") : t("enterFullscreen")}
              className={CTRL_BTN}
            >
              {isFullscreen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              )}
            </button>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
});
