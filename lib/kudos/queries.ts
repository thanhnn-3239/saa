/**
 * Server-safe query functions for the Kudos Live Board feed and filters.
 * All functions use lib/supabase/server.ts (cookie-based auth, safe in RSC/Route Handlers).
 *
 * B2 deliverable — consumed by:
 *   - app/(public)/sun-kudos/page.tsx (server prefetch)
 *   - use-kudos-feed.ts / use-highlight-kudos.ts (client hooks via fetch)
 */

import { createClient } from "@/lib/supabase/server";
import { hydrateKudoCard, type RawKudoRow } from "./hydrate";
import type { KudoCard, KudosFilter } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Build the kudos select string for a given filter.
 *
 * CRITICAL (PostgREST): filtering on an embedded relation only filters the
 * PARENT rows when the embed is an INNER join (`!inner`). Without it, the
 * `.eq()` filters the embed (stripping non-matching child rows) but returns
 * ALL parent kudos — i.e. the filter silently does nothing. So we add `!inner`
 * to the hashtag embed only when a hashtag filter is active, and to the
 * recipient embed only when a department filter is active. (Unfiltered: plain
 * embeds, so kudos without hashtags still appear.)
 *
 * NOTE: kudo_heart_counts is intentionally excluded — it is an aggregate VIEW
 * with no detectable FK (PGRST200 if embedded). Heart counts are fetched
 * separately and merged via mergeHeartCounts().
 */
function buildKudoSelect(filter: KudosFilter): string {
  const recipientInner = filter.departmentId !== null ? "!inner" : "";
  const hashtagsEmbed = filter.hashtag
    ? "kudo_hashtags!inner ( hashtags!inner ( name ) )"
    : "kudo_hashtags ( hashtags ( name ) )";
  return `
    id,
    title,
    body,
    is_anonymous,
    anonymous_name,
    created_at,
    sender:profiles!kudos_sender_id_fkey (
      id, full_name, avatar_url, department_id, departments ( name )
    ),
    recipient:profiles!kudos_recipient_id_fkey${recipientInner} (
      id, full_name, avatar_url, department_id, departments ( name )
    ),
    ${hashtagsEmbed},
    kudo_images ( storage_path )
  `;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PageCursor {
  createdAt: string;
  id: string;
}

export interface KudosPage {
  items: KudoCard[];
  /** Cursor for the next page; null when no more pages. */
  nextCursor: PageCursor | null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Apply hashtag + department filters to a Supabase query. */
function applyFilters<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- supabase builder has no public generic
  query: any,
  filter: KudosFilter,
): T {
  if (filter.hashtag) {
    // Filter kudos that have a kudo_hashtag row pointing to a hashtag with this name.
    // supabase-js: filter on a related table via !inner join.
    query = query.eq("kudo_hashtags.hashtags.name", filter.hashtag);
  }
  if (filter.departmentId !== null) {
    // Recipient's department — nested eq on the join alias.
    query = query.eq("recipient.department_id", filter.departmentId);
  }
  return query as T;
}

/**
 * Fetch heart counts for a set of kudo IDs from kudo_heart_counts view
 * (queried directly — no FK embed, avoids PGRST200).
 * Returns a Map from kudo_id → { heart_total, like_count }.
 */
async function fetchHeartCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kudoIds: string[],
): Promise<Map<string, { heart_total: number; like_count: number }>> {
  if (kudoIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("kudo_heart_counts")
    .select("kudo_id, heart_total, like_count")
    .in("kudo_id", kudoIds);

  if (error) {
    throw new Error(`fetchHeartCounts: ${error.message}`);
  }

  const map = new Map<string, { heart_total: number; like_count: number }>();
  for (const row of data ?? []) {
    map.set(row.kudo_id as string, {
      heart_total: Number(row.heart_total ?? 0),
      like_count: Number(row.like_count ?? 0),
    });
  }
  return map;
}

/**
 * Merge heart counts from the Map into each raw row, producing the flat
 * heart_total / like_count fields that hydrateKudoCard expects (RawKudoRow).
 */
function mergeHeartCounts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw supabase row
  rows: any[],
  heartMap: Map<string, { heart_total: number; like_count: number }>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw supabase row
): any[] {
  return rows.map((row) => {
    const counts = heartMap.get(row.id) ?? { heart_total: 0, like_count: 0 };
    return { ...row, ...counts };
  });
}

/**
 * Which of the given kudo IDs the CURRENT user has liked.
 * Powers the heart's active state + enables unlike. Returns empty set when
 * unauthenticated. (kudo_likes RLS allows authenticated users to read like rows.)
 */
async function fetchLikedSet(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kudoIds: string[],
): Promise<Set<string>> {
  if (kudoIds.length === 0) return new Set();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await supabase
    .from("kudo_likes")
    .select("kudo_id")
    .eq("user_id", user.id)
    .in("kudo_id", kudoIds);

  if (error) throw new Error(`fetchLikedSet: ${error.message}`);

  return new Set((data ?? []).map((r) => r.kudo_id as string));
}

/**
 * kudos_received count per profile id (from profile_kudo_stats view, queried
 * directly — no FK embed). Drives the star tier + hero-title pill on cards.
 */
async function fetchProfileStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileIds: string[],
): Promise<Map<string, number>> {
  const ids = [...new Set(profileIds)].filter(Boolean);
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from("profile_kudo_stats")
    .select("profile_id, kudos_received")
    .in("profile_id", ids);

  if (error) throw new Error(`fetchProfileStats: ${error.message}`);

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    map.set(row.profile_id as string, Number(row.kudos_received ?? 0));
  }
  return map;
}

/** Inject kudos_received into each row's sender/recipient from the stats map. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw supabase rows
function injectProfileStats(rows: any[], statsMap: Map<string, number>): any[] {
  for (const row of rows) {
    if (row.sender) row.sender.kudos_received = statsMap.get(row.sender.id) ?? 0;
    if (row.recipient) row.recipient.kudos_received = statsMap.get(row.recipient.id) ?? 0;
  }
  return rows;
}

// ---------------------------------------------------------------------------
// B2 Query functions
// ---------------------------------------------------------------------------

/**
 * Global top-5 published kudos by heart_total desc (tie-break: created_at desc).
 * Filter-aware: applying a filter resets to a fresh top-5 for that subset.
 *
 * Strategy: scan up to 200 candidate published kudos (event scale), fetch their
 * heart counts, sort by heart_total desc, take top 5, then fetch full details.
 */
export async function getHighlightKudos(filter: KudosFilter): Promise<KudoCard[]> {
  const supabase = await createClient();

  // Step 1: fetch candidate ids + created_at for the filter subset (cap 200).
  // We need created_at for tie-breaking after sorting by heart_total.
  // Candidate select MUST use the same !inner logic so the filter actually
  // narrows the candidate set (otherwise highlight ignores the filter).
  const candidateSelect = filter.hashtag
    ? "id, created_at, kudo_hashtags!inner ( hashtags!inner ( name ) ), recipient:profiles!kudos_recipient_id_fkey" +
      (filter.departmentId !== null ? "!inner" : "") +
      " ( department_id )"
    : "id, created_at, recipient:profiles!kudos_recipient_id_fkey" +
      (filter.departmentId !== null ? "!inner" : "") +
      " ( department_id )";

  let candidateQuery = supabase
    .from("kudos")
    .select(candidateSelect)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(200);

  candidateQuery = applyFilters(candidateQuery, filter);

  const { data: candidateData, error: candidateError } = await candidateQuery;

  if (candidateError) {
    throw new Error(`getHighlightKudos candidates: ${candidateError.message}`);
  }

  if (!candidateData || candidateData.length === 0) return [];

  const candidates = candidateData as unknown as RawKudoRow[];
  const candidateIds = candidates.map((r) => r.id);

  // Step 2: fetch heart counts for all candidates.
  const heartMap = await fetchHeartCounts(supabase, candidateIds);

  // Step 3: sort candidates by heart_total desc, tie-break created_at desc, take top 5.
  const sorted = candidates
    .map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      heartTotal: heartMap.get(r.id)?.heart_total ?? 0,
    }))
    .sort((a, b) => {
      if (b.heartTotal !== a.heartTotal) return b.heartTotal - a.heartTotal;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 5);

  if (sorted.length === 0) return [];

  const top5Ids = sorted.map((r) => r.id);

  // Step 4: fetch full details for the top 5 (plain embeds — ids already chosen).
  const { data: detailData, error: detailError } = await supabase
    .from("kudos")
    .select(buildKudoSelect({ hashtag: null, departmentId: null }))
    .in("id", top5Ids);

  if (detailError) {
    throw new Error(`getHighlightKudos details: ${detailError.message}`);
  }

  // Per-user liked state so the heart renders active + unlike works.
  const likedSet = await fetchLikedSet(supabase, top5Ids);

  // Stars + hero-title pill: kudos_received for each sender + recipient.
  const details = (detailData ?? []) as unknown as RawKudoRow[];
  const profileIds = details
    .flatMap((r) => [r.sender?.id, r.recipient?.id])
    .filter((id): id is string => Boolean(id));
  const statsMap = await fetchProfileStats(supabase, profileIds);

  // Merge heart counts and preserve the sorted order.
  const detailMap = new Map(
    details.map((r): [string, RawKudoRow] => [r.id, r]),
  );

  return top5Ids
    .map((id) => detailMap.get(id))
    .filter((r): r is NonNullable<typeof r> => r != null)
    .map((row) => {
      const counts = heartMap.get(row.id) ?? { heart_total: 0, like_count: 0 };
      const merged = injectProfileStats([{ ...row, ...counts }], statsMap)[0];
      return hydrateKudoCard(merged, likedSet.has(row.id));
    });
}

/**
 * Cursor-paginated feed of published kudos, newest-first.
 *
 * Cursor is on (created_at desc, id desc) so stable ordering is guaranteed
 * even when two kudos are created in the same millisecond.
 *
 * @param cursor - Exclusive lower bound (last item of previous page); null = first page.
 * @param limit  - Items per page (default 20).
 * @param filter - Active hashtag / department filter.
 */
export async function getKudosPage({
  cursor = null,
  limit = 20,
  filter,
}: {
  cursor?: PageCursor | null;
  limit?: number;
  filter: KudosFilter;
}): Promise<KudosPage> {
  const supabase = await createClient();

  let query = supabase
    .from("kudos")
    .select(buildKudoSelect(filter))
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1); // fetch one extra to detect if there is a next page

  if (cursor) {
    // Cursor: rows where (created_at, id) is strictly before the cursor tuple.
    // Supabase does not support tuple comparison natively; use an OR condition:
    //   created_at < cursor.createdAt
    //   OR (created_at = cursor.createdAt AND id < cursor.id)
    //
    // M2 known limitation: kudos.id is uuid v4 (random). Lexicographic `<` on UUID
    // text does not reflect insertion order, so the tie-breaker can cause a kudo to
    // appear on two consecutive pages or be skipped when timestamps collide at ms
    // precision. This is rare in practice. Fix: switch to bigserial id, or add a
    // client-side Map-based deduplication by id in the infinite-scroll flatMap.
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
    );
  }

  query = applyFilters(query, filter);

  const { data, error } = await query;

  if (error) {
    throw new Error(`getKudosPage: ${error.message}`);
  }

  const rawRows = (data ?? []) as unknown as RawKudoRow[];
  const hasMore = rawRows.length > limit;
  const pageRows = hasMore ? rawRows.slice(0, limit) : rawRows;

  // Fetch heart counts for this page separately (kudo_heart_counts is a view with no FK).
  const pageIds = pageRows.map((r) => r.id);
  const heartMap = await fetchHeartCounts(supabase, pageIds);
  const likedSet = await fetchLikedSet(supabase, pageIds);

  // Stars + hero-title pill: fetch kudos_received for every sender + recipient.
  const profileIds = pageRows
    .flatMap((r) => [r.sender?.id, r.recipient?.id])
    .filter((id): id is string => Boolean(id));
  const statsMap = await fetchProfileStats(supabase, profileIds);

  const mergedRows = injectProfileStats(mergeHeartCounts(pageRows, heartMap), statsMap);

  const items = mergedRows.map((row) => hydrateKudoCard(row, likedSet.has(row.id)));

  let nextCursor: PageCursor | null = null;
  if (hasMore) {
    const last = pageRows[pageRows.length - 1];
    nextCursor = { createdAt: last.created_at, id: last.id };
  }

  return { items, nextCursor };
}

/**
 * All hashtags in the DB, ordered alphabetically.
 * Used to populate the filter dropdown.
 */
export async function getHashtags(): Promise<Array<{ id: number; name: string }>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hashtags")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`getHashtags: ${error.message}`);
  }

  return (data ?? []) as Array<{ id: number; name: string }>;
}

/**
 * All departments in the DB, ordered alphabetically.
 * Used to populate the filter dropdown.
 */
export async function getDepartments(): Promise<Array<{ id: number; name: string }>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("departments")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`getDepartments: ${error.message}`);
  }

  return (data ?? []) as Array<{ id: number; name: string }>;
}
