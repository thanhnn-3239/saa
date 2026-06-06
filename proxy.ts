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
  // Run on all paths EXCEPT static assets. The trailing-extension exclusion is
  // required: public files under /fonts and /homepage-saa are served through the
  // proxy otherwise and would be 307-redirected to /login for guests.
  //
  // ⚠️ INVARIANT (auth-bypass guard): the `…$` suffix match means any request path
  // ENDING in one of these extensions skips the proxy (and its auth check). This is
  // safe today because (a) auth is allowlist-based — only PUBLIC_PATHS are public,
  // everything else redirects — and (b) there are NO catch-all (`[[...slug]]`) routes,
  // so e.g. `/profile/x.png` 404s rather than hitting a protected handler. Do NOT add
  // a catch-all route under a protected path without revisiting this matcher.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot)$).*)",
  ],
};
