/**
 * GET /api/kudos/[id]
 * Returns a single published kudo as a KudoCard (for the notification → detail
 * modal), or 404 if not found / not visible. Auth required.
 *
 * Next.js 16: params is a Promise — await it.
 */
import { NextResponse } from "next/server";
import { getKudoById } from "@/lib/kudos/queries";
import { getSessionUser } from "@/lib/auth/get-session-user";
import type { NextRequest } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const card = await getKudoById(id, user.id);
    if (!card) {
      return NextResponse.json({ error: "Kudo not found" }, { status: 404 });
    }
    return NextResponse.json(card);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
