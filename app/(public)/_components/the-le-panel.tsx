"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { HERO_TIERS, KUDOS_ICONS } from "./kudos-rules-data";

/** Scoped translator returned by useTranslations("Home.thele"). */
type Translator = ReturnType<typeof useTranslations>;

interface TheLePanelProps {
  open: boolean;
  onClose: () => void;
  onWriteKudos: () => void;
}

export function TheLePanel({ open, onClose, onWriteKudos }: TheLePanelProps) {
  const t = useTranslations("Home.thele");
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management: trap focus inside panel when open
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    return () => {
      previouslyFocused?.focus();
    };
  }, [open]);

  // Body scroll lock while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Keyboard: Esc closes
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Focus trap
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("panelTitle")}
        className="fixed top-0 right-0 z-50 h-full overflow-y-auto flex flex-col justify-between gap-[40px] px-10 pt-6 pb-10 w-[553px] max-w-[100vw] bg-[rgba(0,7,12,1)]"
      >
        {/* Content */}
        <div className="flex flex-col gap-6 flex-1">
          {/* Title */}
          <h2 className="font-montserrat font-bold text-[45px] leading-[52px] text-saa-gold-accent m-0">
            {t("panelTitle")}
          </h2>

          {/* Content sections */}
          <div className="flex flex-col gap-4">
            {/* === SECTION 1: Người nhận Kudos === */}
            <div className="flex flex-col gap-4">
              {/* Section heading */}
              <p className="font-montserrat font-bold text-[22px] leading-7 text-saa-gold-accent m-0">
                {t("receiverSectionTitle")}
              </p>

              {/* Sub-description */}
              <p className="font-montserrat font-bold text-base leading-6 tracking-[0.5px] text-white m-0">
                {t("receiverDesc")}
              </p>

              {/* Hero tiers */}
              <div className="flex flex-col gap-2">
                {HERO_TIERS.map((tier) => (
                  <HeroTierRow key={tier.key} tier={tier} t={t} />
                ))}
              </div>
            </div>

            {/* === SECTION 2: Người gửi Kudos === */}
            <div className="flex flex-col gap-4">
              <p className="font-montserrat font-bold text-[22px] leading-7 text-saa-gold-accent m-0">
                {t("senderSectionTitle")}
              </p>

              <p className="font-montserrat font-bold text-base leading-6 tracking-[0.5px] text-white m-0">
                {t("senderDesc")}
              </p>

              {/* 3×2 icon grid */}
              <div className="flex flex-col gap-4 px-6">
                <div className="grid grid-cols-[repeat(3,80px)] gap-4 w-full justify-between">
                  {KUDOS_ICONS.slice(0, 3).map((icon) => (
                    <KudosIconItem key={icon.key} icon={icon} t={t} />
                  ))}
                </div>
                <div className="grid grid-cols-[repeat(3,80px)] gap-4 w-full justify-between">
                  {KUDOS_ICONS.slice(3, 6).map((icon) => (
                    <KudosIconItem key={icon.key} icon={icon} t={t} />
                  ))}
                </div>
              </div>

              <p className="font-montserrat font-bold text-base leading-6 tracking-[0.5px] text-white m-0">
                {t("senderCollectionReward")}
              </p>
            </div>

            {/* === SECTION 3: Kudos Quốc Dân === */}
            <div className="flex flex-col gap-2">
              <p className="font-montserrat font-bold text-2xl leading-8 text-saa-gold-accent m-0">
                {t("nationalKudosTitle")}
              </p>

              <p className="font-montserrat font-bold text-base leading-6 tracking-[0.5px] text-white m-0">
                {t("nationalKudosDesc")}
              </p>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex flex-row gap-4 items-center shrink-0">
          {/* Close button — outline style. hover:bg changes background via arbitrary hover. */}
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="flex items-center justify-center gap-2 p-4 border border-saa-gold-border rounded bg-saa-gold-glass text-white font-montserrat font-bold text-base leading-6 tracking-[0.5px] cursor-pointer whitespace-nowrap transition-colors duration-200 ease-[ease] hover:bg-[rgba(255,234,158,0.20)]"
          >
            {/* Close icon */}
            <Image
              src="/homepage-saa/kudos/Close.svg"
              alt=""
              width={24}
              height={24}
              className="[filter:brightness(0)_invert(1)]"
            />
            {t("closeButton")}
          </button>

          {/* Write Kudos button — filled gold */}
          <button
            onClick={onWriteKudos}
            className="flex-1 flex items-center justify-center gap-2 p-4 rounded bg-saa-gold-accent text-saa-navy-darkest font-montserrat font-bold text-base leading-6 tracking-[0.5px] cursor-pointer border-none whitespace-nowrap transition-opacity duration-200 ease-[ease] hover:opacity-85"
          >
            <Image
              src="/homepage-saa/kudos/Pen.svg"
              alt=""
              width={24}
              height={24}
            />
            {t("writeKudosButton")}
          </button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components (kept in the same file to stay < 200 lines each; split out
// only if either grows independently).
// ---------------------------------------------------------------------------

interface HeroTierRowProps {
  tier: (typeof import("./kudos-rules-data").HERO_TIERS)[number];
  t: Translator;
}

function HeroTierRow({ tier, t }: HeroTierRowProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex flex-row items-center gap-3">
        {/* Hero badge image (pill graphic from Figma) */}
        <div className="border-[0.579px] border-saa-gold-accent rounded-[55.579px] overflow-hidden shrink-0">
          <Image
            src={tier.imageSrc}
            alt={t(tier.conditionKey)}
            width={126}
            height={22}
            className="block"
          />
        </div>

        {/* Condition text */}
        <span className="font-montserrat font-bold text-base leading-6 tracking-[0.5px] text-white">
          {t(tier.conditionKey)}
        </span>
      </div>

      {/* Description */}
      <p className="font-montserrat font-bold text-sm leading-5 tracking-[0.1px] text-white m-0">
        {t(tier.descriptionKey)}
      </p>
    </div>
  );
}

interface KudosIconItemProps {
  icon: (typeof import("./kudos-rules-data").KUDOS_ICONS)[number];
  t: Translator;
}

function KudosIconItem({ icon, t }: KudosIconItemProps) {
  return (
    <div className="flex flex-col items-center gap-2 w-[80px]">
      {/* Circular icon */}
      <div className="w-16 h-16 rounded-full border-2 border-white overflow-hidden shrink-0">
        <Image
          src={icon.imageSrc}
          alt={t(icon.labelKey)}
          width={64}
          height={64}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Label */}
      <span className="font-montserrat font-bold text-[11px] leading-4 tracking-[0.5px] text-white text-center w-full">
        {t(icon.labelKey)}
      </span>
    </div>
  );
}
