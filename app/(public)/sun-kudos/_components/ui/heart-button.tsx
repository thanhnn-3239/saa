"use client";
/**
 * HeartButton — toggles gray↔red, shows heart count.
 * Disabled while pending (optimistic update in flight).
 * i18n: aria-label via Home.kudosPage.heartButton.like / .unlike.
 */

import { useTranslations } from "next-intl";

interface HeartButtonProps {
  liked: boolean;
  count: number;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function HeartButton({
  liked,
  count,
  disabled = false,
  onClick,
  className = "",
}: HeartButtonProps) {
  const t = useTranslations("Home.kudosPage.heartButton");

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={liked ? t("unlike") : t("like")}
      aria-pressed={liked}
      className={[
        // Count is near-black so it reads on the cream card (design #171717).
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-base font-semibold transition-colors duration-200 text-saa-navy-dark",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Filled heart — gray when not liked (#999), red when liked (design). */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={liked ? "text-red-500" : "text-gray-400"}
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span>{count}</span>
    </button>
  );
}
