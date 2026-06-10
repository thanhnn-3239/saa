import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/auth/allowed-domain";

/**
 * Auto-login backdoor for test/E2E (DEV ONLY) — issue #7.
 *
 * `GET /auto-login?email=&token=` mints a REAL Supabase session for an existing
 * internal user, bypassing Google OAuth. The session is genuine, so getClaims()
 * verifies everywhere and RLS works with the real auth.uid().
 *
 * SECURITY: default-OFF (disabled unless AUTO_LOGIN_TOKEN is set). EVERY reject
 * branch returns an identical 404 — never 403 — so the route's existence is never
 * revealed. NEVER set AUTO_LOGIN_TOKEN in production. See .env.example / docs/deployment.md.
 */

// node:crypto + service-role client → must run on Node, not the Edge runtime.
export const runtime = "nodejs";

/** Identical opaque 404 for every reject branch — indistinguishable from a missing route. */
function notFound() {
  return new NextResponse(null, { status: 404 });
}

/**
 * Constant-time token comparison. The length check leaks only length (acceptable —
 * the token is high-entropy) and guards timingSafeEqual against an unequal-length throw.
 */
function tokenOk(provided: string | null, expected: string) {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

type AdminClient = ReturnType<typeof createAdminClient>;

/** Look up an existing auth user by email via the service-role Admin API (paginated). */
async function findUserByEmail(admin: AdminClient, email: string) {
  const target = email.toLowerCase();
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data) return null;
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match;
    if (data.users.length < perPage) return null;
  }
}

export async function GET(request: NextRequest) {
  // 1. Disabled unless a token is configured. Don't reveal the route exists.
  // Read process.env directly: the gate is a runtime secret the test suite varies per-case; typed env captures values at import.
  const expected = process.env.AUTO_LOGIN_TOKEN;
  if (!expected) return notFound();

  // 2. Token from header (preferred) or query param — constant-time compare.
  const provided =
    request.headers.get("x-auto-login-token") ??
    request.nextUrl.searchParams.get("token");
  if (!tokenOk(provided, expected)) return notFound();

  // 3. Email must be an allowed internal address (reuses the OAuth gate).
  const email = request.nextUrl.searchParams.get("email");
  if (!isAllowedEmail(email)) return notFound();

  try {
    const admin = createAdminClient();

    // 4. User must already exist — NO on-demand creation.
    const user = await findUserByEmail(admin, email!);
    if (!user) return notFound();

    // 5. Mint a real session without a password: a magiclink hashed_token...
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({ type: "magiclink", email: email! });
    const tokenHash = linkData?.properties?.hashed_token;
    if (linkError || !tokenHash) return notFound();

    // ...verified by the SSR client, which writes the session cookies onto the
    // response (same adapter the OAuth callback relies on).
    const supabase = await createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: tokenHash,
    });
    if (verifyError) return notFound();

    // 6. Always land on "/". No `next`/`role` params are honored.
    return NextResponse.redirect(new URL("/", request.url));
  } catch {
    // Never leak a 500/stack that would hint at the backdoor.
    return notFound();
  }
}
