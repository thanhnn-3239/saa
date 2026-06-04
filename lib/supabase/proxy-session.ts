import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedEmail } from "@/lib/auth/allowed-domain";

/** Paths reachable without an authenticated session. */
const PUBLIC_PATHS = new Set(["/login", "/auth/callback"]);

/**
 * Builds a redirect that carries over the freshly-refreshed auth cookies, so
 * the session is not lost when the proxy short-circuits a request.
 */
function redirectTo(
  path: string,
  request: NextRequest,
  response: NextResponse,
) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

/**
 * Refreshes the Supabase auth session on every request, syncs cookies, and
 * enforces access control:
 *   - authenticated users are kept out of /login (sent to /)
 *   - unauthenticated users may only reach PUBLIC_PATHS (else sent to /login)
 * Invoked from the root `proxy.ts` (Next.js 16 replacement for middleware.ts).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run code between client creation and getClaims().
  // getClaims() verifies the JWT signature (unlike getSession()).
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  // "Authenticated" requires a real session (`sub` claim) AND an allowed email
  // domain. The callback is the primary gate; re-checking here is defense-in-depth
  // so a disallowed session (e.g. a future provider) can never reach a protected page.
  const isAuthed =
    !!claims?.sub && isAllowedEmail(claims.email as string | undefined);

  // Normalize trailing slash so `/login/` cannot bypass the authed redirect.
  const pathname = request.nextUrl.pathname.replace(/\/+$/, "") || "/";

  if (isAuthed && pathname === "/login") {
    return redirectTo("/", request, response);
  }
  if (!isAuthed && !PUBLIC_PATHS.has(pathname)) {
    return redirectTo("/login", request, response);
  }

  return response;
}
