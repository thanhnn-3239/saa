/**
 * GET /api/kudos/spotlight
 * Returns total kudos count + spotlight cloud nodes.
 *
 * Response: { total: number; nodes: SpotlightNode[] }
 *
 * GET /api/kudos/spotlight?search=<term>
 * Search mode — returns { results: ProfileBrief[] }
 * Validation errors return 422 with { error: string }.
 */

import { NextResponse } from "next/server";
import {
  getKudosTotal,
  getSpotlightNodes,
  searchSunners,
  SearchValidationError,
} from "@/lib/kudos/spotlight-queries";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const searchTerm = searchParams.get("search");

  // Search mode.
  if (searchTerm !== null) {
    try {
      const results = await searchSunners(searchTerm);
      return NextResponse.json({ results });
    } catch (err) {
      if (err instanceof SearchValidationError) {
        return NextResponse.json({ error: err.message }, { status: 422 });
      }
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Cloud data mode.
  try {
    const [total, nodes] = await Promise.all([
      getKudosTotal(),
      getSpotlightNodes(),
    ]);
    return NextResponse.json({ total, nodes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
