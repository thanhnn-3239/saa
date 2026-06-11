/**
 * GET /api/kudos/sidebar
 * Returns all sidebar data in one request to minimise round-trips.
 *
 * Requires authentication — returns 401 if session missing.
 *
 * Response:
 * {
 *   stats: SidebarStats,
 *   recentGiftReceivers: LeaderboardItem[],
 *   recentPromotions:    LeaderboardItem[],
 * }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getSidebarStats,
  getRecentGiftReceivers,
  getRecentPromotions,
} from "@/lib/kudos/sidebar-queries";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [stats, recentGiftReceivers, recentPromotions] = await Promise.all([
      getSidebarStats(user.id),
      getRecentGiftReceivers(10),
      getRecentPromotions(10),
    ]);

    return NextResponse.json({ stats, recentGiftReceivers, recentPromotions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
