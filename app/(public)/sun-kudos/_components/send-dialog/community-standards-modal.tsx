"use client";
/**
 * community-standards-modal.tsx
 *
 * Simple static modal showing community guidelines for kudo content.
 * Opens when the user clicks "Tiêu chuẩn cộng đồng" in the editor toolbar.
 * Content is fully i18n'd via the Home.kudosPage.communityStandards namespace.
 */

import { useEffect } from "react";
import { useTranslations } from "next-intl";

interface CommunityStandardsModalProps {
  open: boolean;
  onClose: () => void;
}

export function CommunityStandardsModal({
  open,
  onClose,
}: CommunityStandardsModalProps) {
  const t = useTranslations("Home.kudosPage.communityStandards");

  // Close on Escape — use capture phase so the event is handled here first
  // and stopPropagation() prevents it from reaching the parent dialog handler.
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [open, onClose]);

  if (!open) return null;

  const rules: string[] = [
    t("rule1"),
    t("rule2"),
    t("rule3"),
    t("rule4"),
    t("rule5"),
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      role="dialog"
      aria-label={t("title")}
    >
      <div
        className="relative w-full my-auto bg-[#FFF8E1] shadow-2xl flex flex-col p-6 gap-6 sm:p-10"
        style={{ maxWidth: 560, borderRadius: 20 }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute top-5 right-5 text-[#00101A] hover:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#998C5F]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Title */}
        <h2 className="font-montserrat font-bold text-[#00101A] text-2xl text-center leading-8 pr-8">
          {t("title")}
        </h2>

        {/* Intro paragraph */}
        <p className="font-montserrat text-base text-[#00101A] leading-6">
          {t("intro")}
        </p>

        {/* Rules list */}
        <ul className="flex flex-col gap-3 pl-1">
          {rules.map((rule, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#FFEA9E] font-montserrat font-bold text-xs text-[#00101A] mt-0.5">
                {i + 1}
              </span>
              <span className="font-montserrat text-sm text-[#00101A] leading-6">
                {rule}
              </span>
            </li>
          ))}
        </ul>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={onClose}
          className="self-center mt-2 bg-[#FFEA9E] font-montserrat font-bold text-base text-[#00101A] px-10 py-3 rounded-lg hover:brightness-95 active:brightness-90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#998C5F]"
        >
          {t("dismiss")}
        </button>
      </div>
    </div>
  );
}
