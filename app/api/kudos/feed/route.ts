/**
 * GET /api/kudos/feed
 * Cursor-paginated All Kudos feed for the Live Board.
 *
 * Query params:
 *   limit         number   (default 20, max 50)
 *   hashtag       string   (filter by hashtag name)
 *   departmentId  number   (filter by recipient department)
 *   cursorCreatedAt string (ISO timestamp — exclusive cursor)
 *   cursorId        string (UUID — tie-breaker for cursor)
 *
 * Returns: KudosPage JSON (items: KudoCard[], nextCursor: PageCursor | null)
 */

import { NextResponse } from "next/server";
import { getKudosPage } from "@/lib/kudos/queries";
import type { PageCursor } from "@/lib/kudos/queries";
import type { KudosFilter } from "@/lib/kudos/types";
import type { NextRequest } from "next/server";

// Cursor validation patterns — guard against malformed values injected into PostgREST filter DSL.
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const rawLimit = Number(searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 50)
    : 20;

  const hashtag = searchParams.get("hashtag") ?? null;
  const deptParam = searchParams.get("departmentId");
  const departmentId =
    deptParam !== null && deptParam !== "" && Number.isFinite(Number(deptParam))
      ? Number(deptParam)
      : null;

  const filter: KudosFilter = { hashtag, departmentId };

  const cursorCreatedAt = searchParams.get("cursorCreatedAt");
  const cursorId = searchParams.get("cursorId");

  // Validate cursor params before injecting into PostgREST filter DSL.
  // Malformed values can corrupt the .or() filter string and cause 4xx or wrong results.
  if (cursorCreatedAt && !ISO_RE.test(cursorCreatedAt)) {
    return NextResponse.json({ error: "Invalid cursor: cursorCreatedAt must be ISO 8601" }, { status: 400 });
  }
  if (cursorId && !UUID_RE.test(cursorId)) {
    return NextResponse.json({ error: "Invalid cursor: cursorId must be a UUID" }, { status: 400 });
  }

  const cursor: PageCursor | null =
    cursorCreatedAt && cursorId ? { createdAt: cursorCreatedAt, id: cursorId } : null;

  try {
    const page = await getKudosPage({ cursor, limit, filter });
    return NextResponse.json(page);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
