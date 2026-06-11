/**
 * POST   /api/kudos/[id]/like   — like a kudo
 * DELETE /api/kudos/[id]/like   — unlike a kudo
 *
 * Auth required. Self-like rejected server-side (defense-in-depth; RLS also blocks).
 * Returns: { liked: boolean; heartTotal: number }
 *
 * Next.js 16 App Router: params is a Promise — must be awaited.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface LikeResponse {
  liked: boolean;
  heartTotal: number;
}

/** Fetch the current heart_total for a kudo from the aggregate view. */
async function getHeartTotal(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- supabase typed client
  supabase: any,
  kudoId: string,
): Promise<number> {
  const { data } = await supabase
    .from("kudo_heart_counts")
    .select("heart_total")
    .eq("kudo_id", kudoId)
    .single();
  return (data?.heart_total as number) ?? 0;
}

export async function POST(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse<LikeResponse | { error: string }>> {
  const { id: kudoId } = await params;
  const supabase = await createClient();

  // Verify authentication.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Defense-in-depth: reject self-like even though RLS also blocks it.
  const { data: kudo, error: kudoErr } = await supabase
    .from("kudos")
    .select("sender_id")
    .eq("id", kudoId)
    .single();

  if (kudoErr || !kudo) {
    return NextResponse.json({ error: "Kudo not found" }, { status: 404 });
  }

  if (kudo.sender_id === user.id) {
    return NextResponse.json(
      { error: "Cannot like your own kudo" },
      { status: 422 },
    );
  }

  // Insert the like row. The unique constraint (kudo_id, user_id) prevents duplicates.
  const { error: insertErr } = await supabase
    .from("kudo_likes")
    .insert({ kudo_id: kudoId, user_id: user.id, hearts: 1 });

  if (insertErr) {
    // 23505 = unique_violation — already liked; treat as a no-op success.
    if (insertErr.code !== "23505") {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
  }

  const heartTotal = await getHeartTotal(supabase, kudoId);
  return NextResponse.json({ liked: true, heartTotal });
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse<LikeResponse | { error: string }>> {
  const { id: kudoId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete the caller's own like row (RLS enforces ownership).
  const { error: deleteErr } = await supabase
    .from("kudo_likes")
    .delete()
    .eq("kudo_id", kudoId)
    .eq("user_id", user.id);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  const heartTotal = await getHeartTotal(supabase, kudoId);
  return NextResponse.json({ liked: false, heartTotal });
}
