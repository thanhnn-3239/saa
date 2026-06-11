"use client";
/**
 * StarsIndicator — renders 0–3 gold hoa thị (★) based on star tier.
 * Tier 0 renders nothing. Used alongside avatar+name in card headers.
 * i18n: aria-label via Home.kudosPage.stars.tier.
 */

import { useTranslations } from "next-intl";

interface StarsIndicatorProps {
  stars: 0 | 1 | 2 | 3;
  size?: number;
  className?: string;
}

export function StarsIndicator({ stars, size = 14, className = "" }: StarsIndicatorProps) {
  const t = useTranslations("Home.kudosPage.stars");

  if (stars === 0) return null;

  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      aria-label={t("tier", { n: stars })}
    >
      {Array.from({ length: stars }).map((_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-saa-gold-accent"
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}
