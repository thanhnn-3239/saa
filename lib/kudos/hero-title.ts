/**
 * Hero title tier helper for the Kudos Live Board.
 * Maps kudos-received count to the named hero tier used in the "Thể lệ" panel
 * (kudos-rules-data.ts) and displayed as title pills on cards.
 *
 * Tier thresholds align with stars.ts (50/20/10) but use different label
 * granularity to match the design: 4 named tiers, same breakpoints.
 *
 * Design shows pill labels: "Legend Hero", "Super Hero", "Rising Hero", "New Hero"
 * (confirmed from MM_MEDIA_* node names in Figma).
 */

export type HeroTierKey = "legendHero" | "superHero" | "risingHero" | "newHero" | null;

export interface HeroTier {
  /** Tier key — matches kudos-rules-data.ts HERO_TIERS[].key */
  key: HeroTierKey;
  /** Display label used in pills */
  label: string;
}

const TIERS: Array<{ minKudos: number; key: HeroTierKey; label: string }> = [
  { minKudos: 50, key: "legendHero",  label: "Legend Hero" },
  { minKudos: 20, key: "superHero",   label: "Super Hero" },
  { minKudos: 10, key: "risingHero",  label: "Rising Hero" },
  { minKudos: 1,  key: "newHero",     label: "New Hero" },
];

/**
 * Returns the hero tier for a given kudos-received count.
 * Returns null (no tier / no pill) when kudos_received === 0.
 */
export function getHeroTier(kudosReceived: number): HeroTier | null {
  for (const tier of TIERS) {
    if (kudosReceived >= tier.minKudos) {
      return { key: tier.key, label: tier.label };
    }
  }
  return null;
}

/**
 * Returns the hero tier from the star tier (0–3) already computed on ProfileBrief.
 * star tier 3→Legend, 2→Super, 1→Rising, 0→null.
 * The design's 4th tier (New Hero, ≥1 kudos) isn't reachable from stars alone
 * since star tier 1 requires ≥10 kudos. Cards use this when raw kudosReceived
 * is not available on the profile (e.g. KudoCard sender/recipient).
 *
 * Limitation: profiles with 1–9 kudos received (New Hero tier) will show no pill
 * until kudosReceived is surfaced on ProfileBrief. Acceptable for v1 per YAGNI.
 */
export function getHeroTierFromStars(stars: 0 | 1 | 2 | 3): HeroTier | null {
  switch (stars) {
    case 3: return { key: "legendHero", label: "Legend Hero" };
    case 2: return { key: "superHero",  label: "Super Hero" };
    case 1: return { key: "risingHero", label: "Rising Hero" };
    default: return null;
  }
}
