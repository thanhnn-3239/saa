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
        className="fixed top-0 right-0 z-50 h-full overflow-y-auto"
        style={{
          width: "553px",
          maxWidth: "100vw",
          backgroundColor: "rgba(0, 7, 12, 1)",
          padding: "24px 40px 40px 40px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "40px",
        }}
      >
        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            flex: 1,
          }}
        >
          {/* Title */}
          <h2
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 700,
              fontSize: "45px",
              lineHeight: "52px",
              color: "rgba(255, 234, 158, 1)",
              margin: 0,
            }}
          >
            {t("panelTitle")}
          </h2>

          {/* Content sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* === SECTION 1: Người nhận Kudos === */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Section heading */}
              <p
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                  fontSize: "22px",
                  lineHeight: "28px",
                  color: "rgba(255, 234, 158, 1)",
                  margin: 0,
                }}
              >
                {t("receiverSectionTitle")}
              </p>

              {/* Sub-description */}
              <p
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                  fontSize: "16px",
                  lineHeight: "24px",
                  letterSpacing: "0.5px",
                  color: "rgba(255, 255, 255, 1)",
                  margin: 0,
                }}
              >
                {t("receiverDesc")}
              </p>

              {/* Hero tiers */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {HERO_TIERS.map((tier) => (
                  <HeroTierRow key={tier.key} tier={tier} t={t} />
                ))}
              </div>
            </div>

            {/* === SECTION 2: Người gửi Kudos === */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <p
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                  fontSize: "22px",
                  lineHeight: "28px",
                  color: "rgba(255, 234, 158, 1)",
                  margin: 0,
                }}
              >
                {t("senderSectionTitle")}
              </p>

              <p
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                  fontSize: "16px",
                  lineHeight: "24px",
                  letterSpacing: "0.5px",
                  color: "rgba(255, 255, 255, 1)",
                  margin: 0,
                }}
              >
                {t("senderDesc")}
              </p>

              {/* 3×2 icon grid */}
              <div
                style={{
                  padding: "0 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 80px)",
                    gap: "16px",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  {KUDOS_ICONS.slice(0, 3).map((icon) => (
                    <KudosIconItem key={icon.key} icon={icon} t={t} />
                  ))}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 80px)",
                    gap: "16px",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  {KUDOS_ICONS.slice(3, 6).map((icon) => (
                    <KudosIconItem key={icon.key} icon={icon} t={t} />
                  ))}
                </div>
              </div>

              <p
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                  fontSize: "16px",
                  lineHeight: "24px",
                  letterSpacing: "0.5px",
                  color: "rgba(255, 255, 255, 1)",
                  margin: 0,
                }}
              >
                {t("senderCollectionReward")}
              </p>
            </div>

            {/* === SECTION 3: Kudos Quốc Dân === */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <p
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                  fontSize: "24px",
                  lineHeight: "32px",
                  color: "rgba(255, 234, 158, 1)",
                  margin: 0,
                }}
              >
                {t("nationalKudosTitle")}
              </p>

              <p
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                  fontSize: "16px",
                  lineHeight: "24px",
                  letterSpacing: "0.5px",
                  color: "rgba(255, 255, 255, 1)",
                  margin: 0,
                }}
              >
                {t("nationalKudosDesc")}
              </p>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "16px",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          {/* Close button — outline style */}
          <button
            ref={closeButtonRef}
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "16px",
              border: "1px solid rgba(153, 140, 95, 1)",
              borderRadius: "4px",
              background: "rgba(255, 234, 158, 0.10)",
              color: "rgba(255, 255, 255, 1)",
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              lineHeight: "24px",
              letterSpacing: "0.5px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "background 200ms ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255, 234, 158, 0.20)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255, 234, 158, 0.10)")
            }
          >
            {/* Close icon */}
            <Image
              src="/homepage-saa/kudos/Close.svg"
              alt=""
              width={24}
              height={24}
              style={{ filter: "brightness(0) invert(1)" }}
            />
            {t("closeButton")}
          </button>

          {/* Write Kudos button — filled gold */}
          <button
            onClick={onWriteKudos}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "16px",
              borderRadius: "4px",
              backgroundColor: "rgba(255, 234, 158, 1)",
              color: "rgba(0, 16, 26, 1)",
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              lineHeight: "24px",
              letterSpacing: "0.5px",
              cursor: "pointer",
              border: "none",
              whiteSpace: "nowrap",
              transition: "opacity 200ms ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
            }
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {/* Hero badge image (pill graphic from Figma) */}
        <div
          style={{
            border: "0.579px solid rgba(255, 234, 158, 1)",
            borderRadius: "55.579px",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <Image
            src={tier.imageSrc}
            alt={t(tier.conditionKey)}
            width={126}
            height={22}
            style={{ display: "block" }}
          />
        </div>

        {/* Condition text */}
        <span
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            lineHeight: "24px",
            letterSpacing: "0.5px",
            color: "rgba(255, 255, 255, 1)",
          }}
        >
          {t(tier.conditionKey)}
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          fontFamily: "Montserrat, sans-serif",
          fontWeight: 700,
          fontSize: "14px",
          lineHeight: "20px",
          letterSpacing: "0.1px",
          color: "rgba(255, 255, 255, 1)",
          margin: 0,
        }}
      >
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        width: "80px",
      }}
    >
      {/* Circular icon */}
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "100px",
          border: "2px solid rgba(255, 255, 255, 1)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <Image
          src={icon.imageSrc}
          alt={t(icon.labelKey)}
          width={64}
          height={64}
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />
      </div>

      {/* Label */}
      <span
        style={{
          fontFamily: "Montserrat, sans-serif",
          fontWeight: 700,
          fontSize: "11px",
          lineHeight: "16px",
          letterSpacing: "0.5px",
          color: "rgba(255, 255, 255, 1)",
          textAlign: "center",
          width: "100%",
        }}
      >
        {t(icon.labelKey)}
      </span>
    </div>
  );
}
