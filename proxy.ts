import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy-session";

/**
 * Next.js 16 proxy (replaces middleware.ts). Node runtime only.
 * Keeps the Supabase auth session fresh on every matched request.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Run on all paths except static assets and image files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
