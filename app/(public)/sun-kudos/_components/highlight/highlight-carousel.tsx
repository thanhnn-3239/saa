"use client";
/**
 * HighlightCarousel — Section B: Embla carousel of 5 highlight kudo cards.
 *
 * Design ref: Figma B.2_HIGHLIGHT KUDOS (2940:13461).
 * Behaviour:
 *   - Center card is fully visible; adjacent cards fade (opacity-50 scale-95)
 *   - Prev/next arrow buttons; disabled at first/last slide
 *   - Pager "2/5" below: current number larger + gold; total smaller + muted
 *   - Filter dropdowns (B.1.1 hashtag / B.1.2 phòng ban) above
 *   - Carousel contained within section bounds (no overflow bleed)
 *
 * i18n strings:
 *   Kudos.carousel.prev         → prev button aria-label
 *   Kudos.carousel.next         → next button aria-label
 *   Kudos.carousel.eyebrow      → "Sun* Annual Awards 2025"
 *   Kudos.carousel.title        → "HIGHLIGHT KUDOS"
 *   Kudos.filter.hashtag        → "Hashtag"
 *   Kudos.filter.department     → "Phòng ban"
 */

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useTranslations } from "next-intl";

import { SectionHeader } from "../ui/section-header";
import { FilterDropdown } from "../ui/filter-dropdown";
import { HighlightCard } from "./highlight-card";
import type { KudoCard, KudosFilter } from "@/lib/kudos/types";

interface HighlightCarouselProps {
  cards: KudoCard[];
  filter: KudosFilter;
  /** Server-injected origin for copy-link URL construction. */
  baseUrl: string;
  onFilterChange: (filter: KudosFilter) => void;
  onLike?: (id: string) => void;
  onCopyLink?: (id: string) => void;
  onViewDetail?: (id: string) => void;
  onOpenProfile?: (profileId: string) => void;
  /** Options for the hashtag filter dropdown */
  hashtagOptions?: Array<{ value: string; label: string }>;
  /** Options for the department filter dropdown */
  departmentOptions?: Array<{ value: string; label: string }>;
}

export function HighlightCarousel({
  cards,
  filter,
  baseUrl,
  onFilterChange,
  onLike,
  onCopyLink,
  onViewDetail,
  onOpenProfile,
  hashtagOptions = [],
  departmentOptions = [],
}: HighlightCarouselProps) {
  const t = useTranslations("Home.kudosPage");

  // containScroll: false allows side cards to peek without hard clip at embla level;
  // the outer overflow-hidden wrapper clips at the section boundary.
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "center",
    containScroll: false,
    // Start on the 2nd slide so a card peeks on BOTH sides (less lopsided than
    // slide 1, which centers with empty space on the left). Embla clamps if <2.
    startIndex: 1,
  });

  // Mirror startIndex so the correct card is highlighted on first paint.
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- embla: sync the initial snapshot once on mount
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const total = cards.length;

  return (
    <section className="w-full flex flex-col gap-10">
      {/* Header + filters. NOTE: this <section> is a flex column, so the wrapper
          MUST be w-full — without it, auto side-margins make a flex item shrink to
          its content width (the header would look narrower than the carousel). */}
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-9 xl:px-0">
        <SectionHeader
          eyebrow={t("carousel.eyebrow")}
          title={t("carousel.title")}
          actions={
            <>
              <FilterDropdown
                label={t("filter.hashtag")}
                options={hashtagOptions}
                value={filter.hashtag}
                onChange={(v) => onFilterChange({ ...filter, hashtag: v })}
              />
              <FilterDropdown
                label={t("filter.department")}
                options={departmentOptions}
                value={filter.departmentId ? String(filter.departmentId) : null}
                onChange={(v) =>
                  onFilterChange({
                    ...filter,
                    departmentId: v ? Number(v) : null,
                  })
                }
              />
            </>
          }
        />
      </div>

      {/* Carousel viewport — CONTAINED within the 1240 frame (matches the
          reference Swiper: centeredSlides + slidesPerView:auto, clipped by the
          frame's overflow-hidden). Active card centered; adjacent cards peek but
          clip at the frame edge — they do NOT bleed to the screen edge. The
          Prev/Next arrows sit exactly at that clip edge. */}
      <div className="relative mx-auto w-full max-w-[1240px] px-4 sm:px-9 xl:px-0">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-6">
            {cards.map((card, i) => (
              <div
                key={card.id}
                /* Fixed slide width: narrower than the 1240 viewport so adjacent
                   cards peek ~270px each side (centered), like the reference. */
                className="shrink-0 w-[min(440px,82vw)] sm:w-[min(520px,72vw)] lg:w-[640px]"
              >
                <HighlightCard
                  card={card}
                  active={i === selectedIndex}
                  baseUrl={baseUrl}
                  onLike={onLike}
                  onCopyLink={onCopyLink}
                  onViewDetail={onViewDetail}
                  onOpenProfile={onOpenProfile}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Prev / Next — 56×56 gold-glass pills at the frame edges (= the card
            clip edge), vertically centered (design 2940:13471). The parent already
            provides the 1240 frame + gutters, so the overlay just insets to match.
            Overlay is click-through; only the buttons capture clicks. */}
        <div className="pointer-events-none absolute inset-0 px-4 sm:px-9 xl:px-0 flex items-center justify-between">
          <button
            type="button"
            onClick={scrollPrev}
            disabled={!canPrev}
            aria-label={t("carousel.prev")}
            className="pointer-events-auto flex items-center justify-center w-14 h-14 rounded-[4px] border border-saa-gold-border bg-saa-gold-glass text-saa-gold-accent transition-colors hover:bg-saa-gold-accent/10 hover:border-saa-gold-accent hover:text-saa-gold-bright disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={scrollNext}
            disabled={!canNext}
            aria-label={t("carousel.next")}
            className="pointer-events-auto flex items-center justify-center w-14 h-14 rounded-[4px] border border-saa-gold-border bg-saa-gold-glass text-saa-gold-accent transition-colors hover:bg-saa-gold-accent/10 hover:border-saa-gold-accent hover:text-saa-gold-bright disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Page indicator — B.5.2: current larger + gold, slash + total muted */}
      <div className="flex items-center justify-center">
        <span aria-live="polite" aria-atomic="true" className="font-montserrat font-bold flex items-baseline gap-0.5">
          <span className="text-[32px] leading-none text-saa-gold-accent">
            {total > 0 ? selectedIndex + 1 : 0}
          </span>
          <span className="text-[20px] leading-none text-saa-text-muted">/</span>
          <span className="text-[20px] leading-none text-saa-text-muted">
            {total}
          </span>
        </span>
      </div>
    </section>
  );
}
