/**
 * Server-safe sidebar query functions for the Kudos Live Board sidebar (D).
 * All use lib/supabase/server.ts (cookie auth, safe in RSC/Route Handlers).
 *
 * B3 deliverable — consumed by use-sidebar.ts and /api/kudos/sidebar/* routes.
 */

import { createClient } from "@/lib/supabase/server";
import { getStarTier } from "./stars";
import type { SidebarStats, LeaderboardItem, ProfileBrief } from "./types";

// ---------------------------------------------------------------------------
// Star-tier thresholds (must match stars.ts THRESHOLDS order)
// ---------------------------------------------------------------------------
// Tier 1 ≥ 10, Tier 2 ≥ 20, Tier 3 ≥ 50 kudos_received.
const TIER_BOUNDARIES = [10, 20, 50] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toProfileBrief(row: {
  id: string;
  full_name: string;
  avatar_url: string | null;
  department_id: number | null;
  kudos_received?: number | null;
}): ProfileBrief {
  const kudosReceived = row.kudos_received ?? 0;
  return {
    id: row.id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    stars: getStarTier(kudosReceived),
    kudosReceived,
    departmentId: row.department_id ?? null,
  };
}

// ---------------------------------------------------------------------------
// B3 Query functions
// ---------------------------------------------------------------------------

/**
 * Sidebar stats for the authenticated user (D.1).
 * Reads profile_kudo_stats (sent/received/hearts) + secret_boxes counts.
 */
export async function getSidebarStats(userId: string): Promise<SidebarStats> {
  const supabase = await createClient();

  // Fetch kudos stats and secret box counts in parallel.
  const [statsRes, boxesRes, badgesRes] = await Promise.all([
    supabase
      .from("profile_kudo_stats")
      .select("kudos_sent, kudos_received, hearts_received")
      .eq("profile_id", userId)
      .maybeSingle(),

    supabase
      .from("secret_boxes")
      .select("status")
      .eq("user_id", userId),

    supabase
      .from("user_badges")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  if (statsRes.error) {
    throw new Error(`getSidebarStats stats: ${statsRes.error.message}`);
  }
  if (boxesRes.error) {
    throw new Error(`getSidebarStats boxes: ${boxesRes.error.message}`);
  }

  const stats = statsRes.data;
  const boxes = boxesRes.data ?? [];
  const total = boxes.length;
  const unopened = boxes.filter((b) => b.status === "unopened").length;

  return {
    kudosSent: Number(stats?.kudos_sent ?? 0),
    kudosReceived: Number(stats?.kudos_received ?? 0),
    heartsReceived: Number(stats?.hearts_received ?? 0),
    badgesCount: badgesRes.count ?? 0,
    secretBoxes: { unopened, total },
  };
}

/**
 * 10 most recent secret-box recipients (D — "SUNNER NHẬN QUÀ MỚI NHẤT").
 * Orders by opened_at desc, joins profile + badge name as the score label.
 */
export async function getRecentGiftReceivers(
  limit = 10,
): Promise<LeaderboardItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("secret_boxes")
    .select(
      `
      user_id,
      opened_at,
      profiles!secret_boxes_user_id_fkey (
        id, full_name, avatar_url, department_id
      )
    `,
    )
    .eq("status", "opened")
    .not("opened_at", "is", null)
    .order("opened_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`getRecentGiftReceivers: ${error.message}`);
  }

  return (
    (data ?? []) as unknown as Array<{ profiles: unknown; user_id: string }>
  ).map((row, idx) => {
    const p = row.profiles as {
      id: string;
      full_name: string;
      avatar_url: string | null;
      department_id: number | null;
    } | null;

    const profile: ProfileBrief = p
      ? toProfileBrief({ ...p, kudos_received: undefined })
      : { id: row.user_id, fullName: "Unknown", avatarUrl: null, stars: 0, kudosReceived: 0, departmentId: null };

    return { rank: idx + 1, profile, score: 0 };
  });
}

/**
 * 10 most recently promoted Sunners (D — "SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT").
 *
 * V1 APPROXIMATION — documented here and in the implementation report:
 *
 * A precise solution requires a `rank_events` history table (out of scope).
 * The approximation: find profiles currently sitting *at* a tier boundary
 * (kudos_received in {10, 20, 50}) then order by the timestamp of their
 * most-recently-received kudo. This identifies people who just crossed a
 * threshold — accurate for the first kudo that tips them over, and the
 * boundary values are exact matches so false positives are rare in practice.
 *
 * Limitation: a profile that received many kudos quickly jumps over multiple
 * boundaries without appearing here. Acceptable for v1; replace with
 * rank_events trigger in a future plan.
 */
export async function getRecentPromotions(
  limit = 10,
): Promise<LeaderboardItem[]> {
  const supabase = await createClient();

  // Step 1: get profile stats for all profiles at a tier boundary.
  // .limit(50) caps the candidate set so Steps 2+3 .in() lists stay within
  // PostgREST's ~8 KB URL length limit (~200 UUIDs). Still sliced to `limit`
  // in Step 4. Generous enough to not miss recent promotions in practice.
  const { data: statsData, error: statsErr } = await supabase
    .from("profile_kudo_stats")
    .select("profile_id, kudos_received")
    .in("kudos_received", TIER_BOUNDARIES as unknown as number[])
    .limit(50);

  if (statsErr) {
    throw new Error(`getRecentPromotions stats: ${statsErr.message}`);
  }

  if (!statsData || statsData.length === 0) return [];

  const profileIds = statsData.map((r) => r.profile_id as string);

  // Step 2: for each of those profiles, find the timestamp of their most
  // recent received kudo — that is the approximate "promotion moment".
  const { data: kudosData, error: kudosErr } = await supabase
    .from("kudos")
    .select("recipient_id, created_at")
    .in("recipient_id", profileIds)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (kudosErr) {
    throw new Error(`getRecentPromotions kudos: ${kudosErr.message}`);
  }

  // Build a map of profileId → most recent kudo created_at.
  const latestKudoAt = new Map<string, string>();
  for (const row of kudosData ?? []) {
    if (!latestKudoAt.has(row.recipient_id as string)) {
      latestKudoAt.set(row.recipient_id as string, row.created_at as string);
    }
  }

  // Step 3: fetch profile details for the candidate set.
  const { data: profileData, error: profileErr } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, department_id")
    .in("id", profileIds);

  if (profileErr) {
    throw new Error(`getRecentPromotions profiles: ${profileErr.message}`);
  }

  const profileMap = new Map(
    (profileData ?? []).map((p) => [p.id as string, p]),
  );

  // Step 4: merge, sort by most-recent promotion timestamp, take limit.
  const statsMap = new Map(
    statsData.map((r) => [r.profile_id as string, Number(r.kudos_received)]),
  );

  const ranked = profileIds
    .map((pid) => ({
      pid,
      kudosReceived: statsMap.get(pid) ?? 0,
      promotedAt: latestKudoAt.get(pid) ?? "",
    }))
    .sort((a, b) => b.promotedAt.localeCompare(a.promotedAt))
    .slice(0, limit);

  return ranked.map(({ pid, kudosReceived }, idx) => {
    const raw = profileMap.get(pid);
    const profile: ProfileBrief = raw
      ? toProfileBrief({ ...raw, kudos_received: kudosReceived, id: raw.id as string, full_name: raw.full_name as string, avatar_url: raw.avatar_url as string | null, department_id: raw.department_id as number | null })
      : { id: pid, fullName: "Unknown", avatarUrl: null, stars: 0, kudosReceived: 0, departmentId: null };

    return {
      rank: idx + 1,
      profile,
      // score = tier number (1–3) so UI can render tier badge
      score: getStarTier(kudosReceived),
    };
  });
}
