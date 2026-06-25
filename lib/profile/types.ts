/**
 * Types for the "Profile bản thân" (/profile) page data layer.
 *
 * ProfileHeader  — hero section (A): name, avatar, role, department, kudos tier.
 * IconBadge      — icon collection (B2–B7): full badge catalog entry with owned flag.
 *
 * Stats card (B.stats) reuses the existing SidebarStats from lib/kudos/types.ts —
 * no new type needed; see getSidebarStats() in lib/kudos/sidebar-queries.ts.
 */

import type { HeroTier } from "@/lib/kudos/hero-title";

// ---------------------------------------------------------------------------
// Profile hero
// ---------------------------------------------------------------------------

/**
 * Data for the profile hero section (design zone A).
 * All fields are display-only — the /profile route is read-only (2026-06-25 clarification).
 */
export interface ProfileHeader {
  /** Auth UUID — matches the session user's id. */
  id: string;
  /** Full name from the profiles table (OAuth-populated). */
  fullName: string;
  /** Avatar URL (Google OAuth or Pravatar seed). Null = no avatar set. */
  avatarUrl: string | null;
  /** Profile role: "member" | "admin". */
  role: string;
  /** Department display name (e.g. "CEVC10"), joined from the departments table. Null if unassigned. */
  departmentName: string | null;
  /** Raw kudos-received count from profile_kudo_stats view. 0 when no kudos yet. */
  kudosReceived: number;
  /**
   * Hero tier pill derived from kudosReceived via getHeroTier().
   * Null when kudosReceived === 0 (design: no pill shown).
   */
  heroTier: HeroTier | null;
}

// ---------------------------------------------------------------------------
// Icon collection
// ---------------------------------------------------------------------------

/**
 * A single badge entry in the icon collection (design zones B2–B7).
 * The collection is the FULL badge catalog ordered by weight;
 * owned badges are shown in colour, locked badges are shown in gray.
 */
export interface IconBadge {
  /** Badge PK from the badges table. */
  id: number;
  /** Badge display name. */
  name: string;
  /**
   * Resolved public image URL for the badge icon.
   * Empty string when image_url is null/empty in the DB.
   */
  imageUrl: string;
  /** Optional description text. Null when absent. */
  description: string | null;
  /**
   * True when the session user has a row in user_badges for this badge.
   * False = locked / gray in the UI.
   */
  owned: boolean;
}
