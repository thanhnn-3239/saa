/**
 * GET /api/notifications/unread-count
 * Returns { count } — the current user's unread notification count (badge).
 * Auth required.
 */
import { NextResponse } from "next/server";
import { getUnreadCount } from "@/lib/notifications/queries";
import { getSessionUser } from "@/lib/auth/get-session-user";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const count = await getUnreadCount();
    return NextResponse.json({ count });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
