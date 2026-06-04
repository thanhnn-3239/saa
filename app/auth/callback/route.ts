import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/auth/allowed-domain";

/**
 * Google OAuth callback. Exchanges the PKCE `code` for a session, then enforces
 * the `@sun-asterisk.com` domain restriction server-side (the Google `hd` param
 * is only a UX hint and cannot be trusted as a security boundary).
 *
 * Failure paths redirect back to /login with an `error` code that the page maps
 * to an inline banner message:
 *   - `oauth`  → provider/exchange error
 *   - `domain` → authenticated but disallowed email domain
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  // The provider (via Supabase) may bounce back with an error instead of a code,
  // e.g. the user declining consent (`access_denied`). Map to a known banner code
  // so an attacker-controlled provider string never reaches the UI or the URL.
  const providerError = searchParams.get("error");
  if (providerError) {
    const code = providerError === "access_denied" ? "access_denied" : "oauth";
    return NextResponse.redirect(`${origin}/login?error=${code}`);
  }

  const code = searchParams.get("code");

  // Only allow same-site relative redirects to avoid open-redirect abuse.
  const nextParam = searchParams.get("next") ?? "/";
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  try {
    // getClaims() verifies the JWT signature (unlike getSession()).
    const { data } = await supabase.auth.getClaims();
    const email = data?.claims?.email as string | undefined;

    if (!isAllowedEmail(email)) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=domain`);
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch {
    // Never leave a session established if we couldn't verify the domain.
    await supabase.auth.signOut().catch(() => {});
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }
}
