/**
 * Star tier helper for the Kudos Live Board.
 * Tiers are driven by kudos *received* count (specs B.3.2 / B.3.6).
 * Kept as a pure TS function so thresholds can be adjusted without a migration.
 */

/** Tier thresholds — index = tier (1-based), value = minimum kudos received. */
const THRESHOLDS = [50, 20, 10] as const;

/**
 * Returns the star tier (0–3) for a profile based on how many kudos they received.
 *
 * - ≥ 50 kudos received → 3 stars
 * - ≥ 20 kudos received → 2 stars
 * - ≥ 10 kudos received → 1 star
 * -  < 10               → 0 stars
 */
export function getStarTier(kudosReceived: number): 0 | 1 | 2 | 3 {
  if (kudosReceived >= THRESHOLDS[0]) return 3;
  if (kudosReceived >= THRESHOLDS[1]) return 2;
  if (kudosReceived >= THRESHOLDS[2]) return 1;
  return 0;
}
