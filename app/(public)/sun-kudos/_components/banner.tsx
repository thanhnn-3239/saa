"use client";
/**
 * Banner — Section A: KV hero + A.1 "ghi nhận" pill input.
 *
 * Design ref: Figma 2940:13434 / Frame 532 / A_KV Kudos (2940:13437):
 *   - MM_MEDIA_KV Background: 1440×512px feather/peacock graphic (top-right bleed)
 *   - Linear gradient overlay (dark left, transparent right)
 *   - MM_MEDIA_Kudos logo: 593×106 SVG (multi-colour; positioned below title)
 *   - Title text: "Hệ thống ghi nhận và cảm ơn" — Montserrat Bold 36px gold
 *   - A.1 pill input (738px) + search pill (381px)
 *
 * Assets saved under public/sun-kudos/:
 *   kv-hero.png   — feather background (downloaded from MoMorph)
 *   kudos-logo.svg — stylised KUDOS SVG (downloaded from MoMorph)
 *
 * Search wiring:
 *   The "Tìm kiếm sunner" pill is a real text input that drives the
 *   Spotlight cloud filter. Typing/submitting scrolls to the Spotlight
 *   section and applies the cloud name filter. The search term is
 *   lifted to kudos-board.tsx so both this input and the Spotlight
 *   in-panel input stay in sync.
 */

import { useCallback, useId, useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface BannerProps {
  /** Opens the send-kudos dialog (stub in v1 — no-op). */
  onOpenSendDialog?: () => void;
  /** Controlled search term — lifted from kudos-board.tsx */
  spotlightSearch: string;
  /** Notify parent of banner search changes */
  onSpotlightSearchChange: (term: string) => void;
  /** Ref to the Spotlight section element for scroll-into-view */
  spotlightRef?: React.RefObject<HTMLElement | null>;
}

export function Banner({
  onOpenSendDialog,
  spotlightSearch,
  onSpotlightSearchChange,
  spotlightRef,
}: BannerProps) {
  const t = useTranslations("Home.kudosPage.banner");
  const searchId = useId();

  // Local input value mirrors the controlled prop
  const [inputValue, setInputValue] = useState(spotlightSearch);

  // Keep in sync when parent resets (e.g. Spotlight's clear button)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirror controlled prop on external reset
    setInputValue(spotlightSearch);
  }, [spotlightSearch]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      onSpotlightSearchChange(val);
    },
    [onSpotlightSearchChange],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      // Scroll spotlight into view on submit
      spotlightRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [spotlightRef],
  );

  const handleClear = useCallback(() => {
    setInputValue("");
    onSpotlightSearchChange("");
  }, [onSpotlightSearchChange]);

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: 512 }}>
      {/* KV Background — MM_MEDIA_KV Background (I2940:13432;2167:5141)
          1440×512px feather/peacock graphic; positioned top-right bleeding out. */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <Image
          src="/sun-kudos/kv-hero.png"
          alt=""
          fill
          priority
          className="object-cover object-right-top"
          sizes="100vw"
        />
      </div>

      {/* Dark gradient overlay — matches Figma: dark left, transparent right */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(25deg, #00101A 14.74%, rgba(0,19,32,0.85) 47.8%, rgba(0,19,32,0.3) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Content — padded to match Figma 144px horizontal margins */}
      <div className="relative z-[2] mx-auto max-w-[1240px] flex flex-col gap-10 px-4 sm:px-9 xl:px-0 pt-24 pb-12">

        {/* A_KV Kudos block — title + logo (Figma 2940:13437) */}
        <div className="flex flex-col gap-2">
          {/* Eyebrow title — "Hệ thống ghi nhận và cảm ơn"
              Figma: Montserrat Bold 36px, color rgba(255,234,158,1) = saa-gold-accent */}
          <p
            className="font-montserrat font-bold text-[36px] leading-[44px] text-saa-gold-accent max-w-[559px]"
          >
            {t("title")}
          </p>

          {/* KUDOS logo — MM_MEDIA_Kudos logo SVG (2940:13440)
              593×106 asset; contains Sun* flame icon + "KUDOS" lettering in SVN-Gotham.
              Rendered via next/image as an <img> (not inline) since it has no color
              props needed — the SVG is fully self-contained with its own palette. */}
          <div className="relative" style={{ width: 593, height: 106, maxWidth: "100%" }}>
            <Image
              src="/sun-kudos/kudos-logo.svg"
              alt="KUDOS"
              fill
              className="object-contain object-left"
              sizes="593px"
            />
          </div>
        </div>

        {/* A.1 — pill inputs (Figma 2940:13448) */}
        <div className="flex flex-wrap gap-4">
          {/* Primary: "ghi nhận" pill (Figma 2940:13449 — 738px, pencil icon) */}
          <button
            type="button"
            onClick={onOpenSendDialog}
            aria-label={t("placeholder")}
            className="flex items-center gap-4 px-4 py-5 rounded-[68px] bg-saa-gold-glass border border-saa-gold-border w-full max-w-[738px] text-left transition-colors hover:bg-white/10 group"
          >
            {/* MM_MEDIA_Pen icon (I2940:13449;186:2759) */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-saa-text-muted group-hover:text-saa-text-secondary transition-colors"
              aria-hidden="true"
            >
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span className="font-montserrat text-base text-saa-text-muted group-hover:text-saa-text-secondary transition-colors">
              {t("placeholder")}
            </span>
          </button>

          {/* Secondary: "Tìm kiếm sunner" search pill (Figma 2940:13450 — 381px)
              Wired to drive Spotlight cloud filter; submitting scrolls to Spotlight. */}
          <form
            role="search"
            onSubmit={handleSubmit}
            className="flex items-center gap-4 px-4 py-5 rounded-[68px] bg-saa-gold-glass border border-saa-gold-border w-full max-w-[381px] transition-colors hover:bg-white/10 group focus-within:bg-white/10"
          >
            {/* MM_MEDIA_Search icon */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-saa-text-muted group-hover:text-saa-text-secondary transition-colors"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <label htmlFor={searchId} className="sr-only">
              {t("searchPlaceholder")}
            </label>
            <input
              id={searchId}
              type="search"
              spellCheck={false}
              autoComplete="off"
              placeholder={t("searchPlaceholder")}
              value={inputValue}
              maxLength={100}
              onChange={handleInputChange}
              className="bg-transparent font-montserrat text-base text-saa-text-primary placeholder:text-saa-text-muted focus:outline-none flex-1 min-w-0 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                aria-label={t("clearSearch")}
                className="text-saa-text-muted hover:text-saa-text-secondary shrink-0 transition-colors"
              >
                <svg
                  width="18"
                  height="18"
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
      </div>
    </section>
  );
}
