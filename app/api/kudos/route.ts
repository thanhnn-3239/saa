/**
 * POST /api/kudos — create a kudo from the send dialog.
 *
 * Auth required (cookie session). Images are uploaded client-side to the
 * `kudo-images` bucket beforehand; this route receives the storage paths and
 * delegates all multi-table writes + validation to the create_kudo RPC
 * (title/body required + length caps, 1..5 hashtags, ≤5 images, no self-kudo
 * via table CHECK).
 *
 * Body: { recipientId, title, bodyHtml, hashtagIds, imagePaths, isAnonymous, anonymousName }
 * Returns: { id: string } | { error: string }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

interface CreateKudoBody {
  recipientId: string;
  title: string;
  bodyHtml: string;
  hashtagIds: number[];
  imagePaths: string[];
  isAnonymous: boolean;
  anonymousName: string | null;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<{ id: string } | { error: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateKudoBody;
  try {
    body = (await request.json()) as CreateKudoBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body.recipientId !== "string" ||
    typeof body.title !== "string" ||
    typeof body.bodyHtml !== "string" ||
    !Array.isArray(body.hashtagIds) ||
    !Array.isArray(body.imagePaths)
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Validate each image path belongs to the authenticated user's prefix and has no traversal.
  const userPrefix = `${user.id}/`;
  const validPaths = body.imagePaths.every(
    (p: unknown) => typeof p === "string" && p.startsWith(userPrefix) && !p.includes(".."),
  );
  if (!validPaths) {
    return NextResponse.json({ error: "Invalid image paths" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("create_kudo", {
    p_recipient_id: body.recipientId,
    p_title: body.title,
    p_body: body.bodyHtml,
    p_is_anonymous: Boolean(body.isAnonymous),
    p_hashtag_ids: body.hashtagIds,
    p_image_paths: body.imagePaths,
    p_links: [],
    p_anonymous_name: body.anonymousName || null,
  });

  if (error) {
    // RPC raise exception messages are user-actionable validation failures
    // (e.g. "kudo requires a title") → 422; anything else is unexpected.
    const validation =
      /requires|too long|max 5|1\.\.5|authentication/.test(error.message);
    return NextResponse.json(
      { error: validation ? error.message : "Internal error" },
      { status: validation ? 422 : 500 },
    );
  }

  return NextResponse.json({ id: data as string });
}
