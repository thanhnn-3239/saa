"use client";
/**
 * HeroTitlePill — the user's hero-tier badge, rendered as the design's PNG image
 * (matching production /kudos: assets/profile/level-N-hq.png at ~109×19).
 *
 * Tier → badge asset (downloaded to public/sun-kudos/):
 *   newHero → level-1 · risingHero → level-2 · superHero → level-3 · legendHero → level-4
 *
 * Used in: kudo-card-base (next to sender/recipient names).
 */

import Image from "next/image";
import type { HeroTierKey } from "@/lib/kudos/hero-title";

interface HeroTitlePillProps {
  tierKey: HeroTierKey;
  label: string;
  className?: string;
}

/** Tier → badge image (public/sun-kudos/) */
const TIER_BADGE: Record<NonNullable<HeroTierKey>, string> = {
  newHero: "/sun-kudos/hero-new.png",
  risingHero: "/sun-kudos/hero-rising.png",
  superHero: "/sun-kudos/hero-super.png",
  legendHero: "/sun-kudos/hero-legend.png",
};

export function HeroTitlePill({ tierKey, label, className = "" }: HeroTitlePillProps) {
  if (!tierKey) return null;

  return (
    <Image
      src={TIER_BADGE[tierKey]}
      alt={label}
      width={109}
      height={19}
      className={`shrink-0 ${className}`}
    />
  );
}
