/**
 * Hydration helpers — map raw Supabase query rows → domain types.
 * Consumed by queries.ts (server) and sidebar-queries.ts.
 */

import { getStarTier } from "./stars";
import type { KudoCard, ProfileBrief, SpotlightNode, LeaderboardItem } from "./types";

// ---------------------------------------------------------------------------
// Raw row shapes returned by the query builder selects
// ---------------------------------------------------------------------------

/** Minimal profile columns used in joins. */
export interface RawProfileJoin {
  id: string;
  full_name: string;
  avatar_url: string | null;
  department_id: number | null;
  // Department name, embedded via the departments FK join (kudo-card query only).
  departments?: { name: string | null } | null;
  // kudos_received count is optionally embedded via profile_kudo_stats join
  kudos_received?: number | null;
}

/** Raw kudo row with all joins expanded. */
export interface RawKudoRow {
  id: string;
  title?: string | null;
  body: string;
  is_anonymous: boolean;
  anonymous_name?: string | null;
  created_at: string;
  sender: RawProfileJoin | null;
  recipient: RawProfileJoin | null;
  // kudo_heart_counts joined columns
  heart_total: number | null;
  like_count: number | null;
  // Whether current user liked — resolved server-side or set false client-side
  liked?: boolean;
  kudo_hashtags: Array<{ hashtags: { name: string } | null }> | null;
  kudo_images: Array<{ storage_path: string }> | null;
}

// ---------------------------------------------------------------------------
// Hydrators
// ---------------------------------------------------------------------------

/**
 * Convert a raw profile join (with optional stats) to ProfileBrief.
 * Falls back to 0 kudos_received if the stat is absent.
 */
export function hydrateProfile(raw: RawProfileJoin): ProfileBrief {
  const kudosReceived = raw.kudos_received ?? 0;
  return {
    id: raw.id,
    fullName: raw.full_name,
    avatarUrl: raw.avatar_url,
    stars: getStarTier(kudosReceived),
    kudosReceived,
    departmentId: raw.department_id ?? null,
    departmentName: raw.departments?.name ?? null,
  };
}

/**
 * Convert a raw kudo row + joins to a KudoCard.
 *
 * @param raw        - Row from the kudos select with all joins
 * @param viewerLiked - Whether the current viewer has liked this kudo.
 *                     Pass `false` for server-rendered cards (viewer check is
 *                     done client-side after session is known).
 *
 * @note M1 known limitation: SSR prefetch does not run a per-user kudo_likes query,
 *       so `viewerLiked` defaults to false on first render for all cards. The state
 *       corrects after the user interacts (toggle) or a realtime DELETE event fires.
 *       Fix: add a per-user liked-ids prefetch in page.tsx and pass the result here.
 */
export function hydrateKudoCard(
  raw: RawKudoRow,
  viewerLiked = false,
): KudoCard {
  // Fallback profiles so UI never crashes on missing join data.
  // For anonymous kudos, mask the real sender so the identity never reaches the client.
  const sender: ProfileBrief = raw.is_anonymous
    ? { id: "", fullName: raw.anonymous_name?.trim() || "Ẩn danh", avatarUrl: null, stars: 0, kudosReceived: 0, departmentId: null, departmentName: null }
    : raw.sender
      ? hydrateProfile(raw.sender)
      : { id: "", fullName: "Deleted", avatarUrl: null, stars: 0, kudosReceived: 0, departmentId: null, departmentName: null };

  const recipient: ProfileBrief = raw.recipient
    ? hydrateProfile(raw.recipient)
    : { id: "", fullName: "Deleted", avatarUrl: null, stars: 0, kudosReceived: 0, departmentId: null };

  const hashtags = (raw.kudo_hashtags ?? [])
    .map((kh) => kh.hashtags?.name)
    .filter((n): n is string => typeof n === "string");

  const images = (raw.kudo_images ?? []).map((img) => img.storage_path);

  return {
    id: raw.id,
    sender,
    recipient,
    title: raw.title ?? undefined,
    body: raw.body,
    isAnonymous: raw.is_anonymous,
    anonymousName: raw.anonymous_name ?? null,
    createdAt: raw.created_at,
    heartTotal: raw.heart_total ?? 0,
    likeCount: raw.like_count ?? 0,
    liked: raw.liked ?? viewerLiked,
    hashtags,
    images,
  };
}

// ---------------------------------------------------------------------------
// Spotlight
// ---------------------------------------------------------------------------

interface RawSpotlightRow {
  recipient_id: string;
  kudos_received: number;
  profiles: RawProfileJoin | null;
}

/**
 * Build SpotlightNode array from aggregated recipient rows.
 * Normalises weight 0–1 based on the max in the set.
 */
export function hydrateSpotlightNodes(rows: RawSpotlightRow[]): SpotlightNode[] {
  if (rows.length === 0) return [];
  const max = Math.max(...rows.map((r) => r.kudos_received), 1);
  return rows.map((row) => {
    const profile: ProfileBrief = row.profiles
      ? hydrateProfile({ ...row.profiles, kudos_received: row.kudos_received })
      : { id: row.recipient_id, fullName: "Unknown", avatarUrl: null, stars: 0, kudosReceived: 0, departmentId: null };
    return {
      profile,
      kudosReceived: row.kudos_received,
      weight: row.kudos_received / max,
    };
  });
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

interface RawLeaderboardRow {
  profile_id: string;
  score: number;
  profiles: RawProfileJoin | null;
}

/** Map raw leaderboard rows (with profile join) to LeaderboardItem[]. */
export function hydrateLeaderboard(rows: RawLeaderboardRow[]): LeaderboardItem[] {
  return rows.map((row, idx) => {
    const profile: ProfileBrief = row.profiles
      ? hydrateProfile({ ...row.profiles, kudos_received: undefined })
      : { id: row.profile_id, fullName: "Unknown", avatarUrl: null, stars: 0, kudosReceived: 0, departmentId: null };
    return { rank: idx + 1, profile, score: row.score };
  });
}
