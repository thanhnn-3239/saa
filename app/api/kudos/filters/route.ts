/**
 * GET /api/kudos/filters
 * Returns hashtag and department lists for the filter dropdowns.
 *
 * Response: { hashtags: {id,name}[], departments: {id,name}[] }
 */

import { NextResponse } from "next/server";
import { getHashtags, getDepartments } from "@/lib/kudos/queries";

export async function GET() {
  try {
    const [hashtags, departments] = await Promise.all([
      getHashtags(),
      getDepartments(),
    ]);
    return NextResponse.json({ hashtags, departments });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
