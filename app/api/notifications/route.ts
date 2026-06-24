/**
 * GET /api/notifications
 * Cursor-paginated notifications for the current user (newest first).
 *
 * Query params:
 *   limit   number  (default 20, max 50)
 *   cursor  number  (exclusive — return rows with id < cursor)
 *
 * Returns: NotificationsPage JSON. Auth required.
 */
import { NextResponse } from "next/server";
import { getNotificationsPage } from "@/lib/notifications/queries";
import { getSessionUser } from "@/lib/auth/get-session-user";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;

  const rawLimit = Number(searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 50)
    : 20;

  const cursorParam = searchParams.get("cursor");
  let cursor: number | null = null;
  if (cursorParam !== null && cursorParam !== "") {
    const n = Number(cursorParam);
    if (!Number.isInteger(n) || n < 0) {
      return NextResponse.json(
        { error: "Invalid cursor: must be a non-negative integer" },
        { status: 400 },
      );
    }
    cursor = n;
  }

  try {
    const page = await getNotificationsPage({ cursor, limit });
    return NextResponse.json(page);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
