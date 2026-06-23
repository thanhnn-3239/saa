/**
 * GET /api/kudos/highlight
 * Top-5 kudos by heart_total for the Highlight carousel.
 *
 * Query params:
 *   hashtag       string   (filter by hashtag name)
 *   departmentId  number   (filter by recipient department)
 *
 * Returns: KudoCard[] JSON
 */

import { NextResponse } from "next/server";
import { getHighlightKudos } from "@/lib/kudos/queries";
import { getSessionUser } from "@/lib/auth/get-session-user";
import type { KudosFilter } from "@/lib/kudos/types";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const hashtag = searchParams.get("hashtag") ?? null;
  const deptParam = searchParams.get("departmentId");
  // Guard against NaN: Number("abc") === NaN which would be sent to .eq() as NaN.
  const departmentId =
    deptParam !== null && deptParam !== "" && Number.isFinite(Number(deptParam))
      ? Number(deptParam)
      : null;

  const filter: KudosFilter = { hashtag, departmentId };

  try {
    const user = await getSessionUser();
    const cards = await getHighlightKudos(filter, user?.id ?? null);
    return NextResponse.json(cards);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
