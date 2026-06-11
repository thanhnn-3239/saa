/**
 * Central navigation route map for the SAA homepage and all linked pages.
 * Single source of truth — header, footer, CTA buttons, and award cards
 * all import from here so path changes propagate everywhere automatically.
 */

export const ROUTES = {
  home: "/",
  awardsInfo: "/he-thong-giai",
  kudos: "/sun-kudos",
  standards: "/tieu-chuan-chung",
  profile: "/profile",
} as const;

/**
 * Returns the URL for a specific award category anchor on the
 * Hệ thống giải page (e.g. "/he-thong-giai#top-talent").
 * If slug is empty, falls back to the base he-thong-giai path.
 */
export function awardAnchor(slug: string): string {
  const trimmed = slug.trim();
  if (!trimmed) return ROUTES.awardsInfo;
  return `${ROUTES.awardsInfo}#${trimmed}`;
}
