/**
 * Server-safe query functions for the Spotlight word-cloud (B.7).
 * All use lib/supabase/server.ts (cookie auth, safe in RSC/Route Handlers).
 *
 * B4 deliverable — consumed by use-spotlight.ts and /api/kudos/spotlight route.
 */

import { createClient } from "@/lib/supabase/server";
import { hydrateSpotlightNodes } from "./hydrate";
import type { SpotlightNode, ProfileBrief } from "./types";

// Max nodes rendered in the cloud — keeps layout manageable.
const SPOTLIGHT_CAP = 150;

// ---------------------------------------------------------------------------
// Typed error for search validation failures (B4 spec: test 9e689933)
// ---------------------------------------------------------------------------

export class SearchValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SearchValidationError";
  }
}

// ---------------------------------------------------------------------------
// B4 Query functions
// ---------------------------------------------------------------------------

/**
 * Count of all published kudos — the "388 KUDOS" total in B.7.1.
 * Realtime: C1 will subscribe to kudos INSERT to increment this live.
 */
export async function getKudosTotal(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("kudos")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  if (error) {
    throw new Error(`getKudosTotal: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Recipient aggregation for the spotlight cloud.
 * Returns up to SPOTLIGHT_CAP nodes, each sized by kudos_received.
 * Weight (0–1) is normalised by hydrateSpotlightNodes against the max in the set.
 *
 * NOTE: profile_kudo_stats is a VIEW with no detectable FK to profiles.
 * Embedding via !fkey hint causes PGRST200. Fix: query each table separately
 * and merge in JS.
 */
export async function getSpotlightNodes(
  cap = SPOTLIGHT_CAP,
): Promise<SpotlightNode[]> {
  const supabase = await createClient();

  // Step 1: fetch stats rows (profiles with kudos_received > 0), ordered desc.
  const { data: statsData, error: statsError } = await supabase
    .from("profile_kudo_stats")
    .select("profile_id, kudos_received")
    .gt("kudos_received", 0)
    .order("kudos_received", { ascending: false })
    .limit(cap);

  if (statsError) {
    throw new Error(`getSpotlightNodes stats: ${statsError.message}`);
  }

  if (!statsData || statsData.length === 0) return [];

  const profileIds = statsData.map((r) => r.profile_id as string);

  // Step 2: fetch profile details for those ids.
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, department_id")
    .in("id", profileIds);

  if (profileError) {
    throw new Error(`getSpotlightNodes profiles: ${profileError.message}`);
  }

  const profileMap = new Map(
    (profileData ?? []).map((p) => [
      p.id as string,
      p as { id: string; full_name: string; avatar_url: string | null; department_id: number | null },
    ]),
  );

  // Step 3: merge into the shape hydrateSpotlightNodes expects.
  const rows = statsData.map((r) => ({
    recipient_id: r.profile_id as string,
    kudos_received: Number(r.kudos_received ?? 0),
    profiles: profileMap.get(r.profile_id as string) ?? null,
  }));

  return hydrateSpotlightNodes(rows);
}

/**
 * Search profiles by name (case-insensitive, partial match).
 *
 * Guards:
 *   - Empty string → throws SearchValidationError (test 9e689933: "required message").
 *   - > 100 chars  → throws SearchValidationError.
 *
 * Returns ProfileBrief[] — UI highlights / scrolls to matching nodes in the cloud.
 *
 * NOTE: profile_kudo_stats is a VIEW with no detectable FK to profiles.
 * Embedding via !fkey hint causes PGRST200. Fix: fetch profiles, collect ids,
 * fetch stats separately, merge kudos_received in JS.
 */
export async function searchSunners(
  term: string,
  /** When set, this profile id is excluded from results (e.g. recipient search excludes the sender). */
  excludeUserId?: string,
): Promise<ProfileBrief[]> {
  const trimmed = term.trim();

  if (trimmed.length === 0) {
    throw new SearchValidationError("Vui lòng nhập tên để tìm kiếm");
  }
  if (trimmed.length > 100) {
    throw new SearchValidationError("Tên tìm kiếm không được vượt quá 100 ký tự");
  }

  const supabase = await createClient();

  // Step 1: find matching profiles.
  // ilike is parameterised by the supabase-js client — no SQL injection risk.
  let profileQuery = supabase
    .from("profiles")
    .select("id, full_name, avatar_url, department_id")
    .ilike("full_name", `%${trimmed}%`)
    .limit(20);

  if (excludeUserId) {
    profileQuery = profileQuery.neq("id", excludeUserId);
  }

  const { data: profileData, error: profileError } = await profileQuery;

  if (profileError) {
    throw new Error(`searchSunners profiles: ${profileError.message}`);
  }

  if (!profileData || profileData.length === 0) return [];

  const profileIds = profileData.map((p) => p.id as string);

  // Step 2: fetch kudos_received for those profiles from the view directly.
  const { data: statsData, error: statsError } = await supabase
    .from("profile_kudo_stats")
    .select("profile_id, kudos_received")
    .in("profile_id", profileIds);

  if (statsError) {
    throw new Error(`searchSunners stats: ${statsError.message}`);
  }

  const statsMap = new Map(
    (statsData ?? []).map((r) => [r.profile_id as string, Number(r.kudos_received ?? 0)]),
  );

  // Step 3: merge and return ProfileBrief[].
  return profileData.map((row) => {
    const kudosReceived = statsMap.get(row.id as string) ?? 0;

    return {
      id: row.id as string,
      fullName: row.full_name as string,
      avatarUrl: row.avatar_url as string | null,
      stars: (kudosReceived >= 50 ? 3 : kudosReceived >= 20 ? 2 : kudosReceived >= 10 ? 1 : 0) as 0 | 1 | 2 | 3,
      kudosReceived,
      departmentId: (row.department_id as number | null) ?? null,
    } satisfies ProfileBrief;
  });
}
