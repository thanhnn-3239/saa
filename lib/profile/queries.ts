/**
 * Server-safe query functions for the "Profile bản thân" (/profile) page.
 *
 * getProfileHeader(userId) — hero section (design zone A)
 * getIconCollection(userId) — badge collection (design zones B2–B7)
 *
 * Stats card reuses getSidebarStats(userId) from lib/kudos/sidebar-queries.ts —
 * no new stats query here.
 *
 * All functions use lib/supabase/server.ts (cookie auth, safe in RSC / Route Handlers).
 * Subject userId is ALWAYS the session user — never an arbitrary caller-supplied value.
 */

import { createClient } from "@/lib/supabase/server";
import { getHeroTier } from "@/lib/kudos/hero-title";
import { kudoImageUrl } from "@/lib/kudos/kudo-image-url";
import type { ProfileHeader, IconBadge } from "./types";

// ---------------------------------------------------------------------------
// getProfileHeader
// ---------------------------------------------------------------------------

/**
 * Returns the profile hero data for the given user.
 *
 * Joins: profiles → departments (for departmentName).
 * Stats: profile_kudo_stats view → kudosReceived → heroTier.
 *
 * Both the profile join and the stats view are queried in parallel to
 * avoid a serial waterfall.
 *
 * @param userId - Session user UUID (self-only; never accept from client).
 * @throws When the profiles row is missing or a Supabase error occurs.
 */
export async function getProfileHeader(userId: string): Promise<ProfileHeader> {
  const supabase = await createClient();

  const [profileRes, statsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role, departments ( name )")
      .eq("id", userId)
      .single(),

    supabase
      .from("profile_kudo_stats")
      .select("kudos_received")
      .eq("profile_id", userId)
      .maybeSingle(),
  ]);

  if (profileRes.error) {
    throw new Error(`getProfileHeader profile: ${profileRes.error.message}`);
  }
  if (statsRes.error) {
    throw new Error(`getProfileHeader stats: ${statsRes.error.message}`);
  }

  const p = profileRes.data;
  const kudosReceived = Number(statsRes.data?.kudos_received ?? 0);

  // departments is typed as an array by the generated Supabase types (many-to-one
  // FK embed), but PostgREST returns a single object for a to-one relationship.
  // Cast via unknown to bridge the generated array type → runtime object shape.
  const dept = p.departments as unknown as { name: string } | null;

  return {
    id: p.id as string,
    fullName: p.full_name as string,
    avatarUrl: (p.avatar_url as string | null) ?? null,
    role: (p.role as string) ?? "member",
    departmentName: dept?.name ?? null,
    kudosReceived,
    heroTier: getHeroTier(kudosReceived),
  };
}

// ---------------------------------------------------------------------------
// getIconCollection
// ---------------------------------------------------------------------------

/**
 * Returns the full badge catalog ordered by weight, with an `owned` flag
 * indicating whether the session user has unlocked each badge.
 *
 * Design intent: all catalog entries are rendered — locked badges show as
 * gray placeholders (owned: false), unlocked badges in colour (owned: true).
 * If the user has no badges yet, every entry has owned: false.
 *
 * Badge image_url is resolved via kudoImageUrl() — handles both absolute URLs
 * (Google/CDN) and storage paths (same helper used for kudo images).
 *
 * @param userId - Session user UUID (self-only; never accept from client).
 */
export async function getIconCollection(userId: string): Promise<IconBadge[]> {
  const supabase = await createClient();

  // Fetch the full badge catalog and the user's owned badge ids in parallel.
  const [catalogRes, ownedRes] = await Promise.all([
    supabase
      .from("badges")
      .select("id, name, image_url, description, weight")
      .order("weight", { ascending: true }),

    supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", userId),
  ]);

  if (catalogRes.error) {
    throw new Error(`getIconCollection catalog: ${catalogRes.error.message}`);
  }
  if (ownedRes.error) {
    throw new Error(`getIconCollection owned: ${ownedRes.error.message}`);
  }

  // Build a Set of owned badge ids for O(1) lookup.
  const ownedIds = new Set<number>(
    (ownedRes.data ?? []).map((r) => Number(r.badge_id)),
  );

  return (catalogRes.data ?? []).map((badge) => ({
    id: Number(badge.id),
    name: badge.name as string,
    // Resolve storage path or absolute URL using the shared image helper.
    imageUrl: badge.image_url ? kudoImageUrl(badge.image_url as string) : "",
    description: (badge.description as string | null) ?? null,
    owned: ownedIds.has(Number(badge.id)),
  }));
}
