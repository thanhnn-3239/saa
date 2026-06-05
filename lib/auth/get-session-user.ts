import { createClient } from "@/lib/supabase/server";

/**
 * Authenticated user shape returned by getSessionUser.
 * `role` is optional — no role system exists yet. When a role claim is
 * eventually added to Supabase JWT custom claims it will surface here.
 */
export interface SessionUser {
  id: string;
  email: string;
  /** User role from JWT custom claims. Undefined until a role system exists. */
  role?: string;
}

/**
 * Server helper: returns the authenticated user and optional role claim from
 * the current Supabase session, or null for unauthenticated requests.
 *
 * Uses getClaims() (JWT-verified) rather than getSession() (unverified) for
 * defense-in-depth — consistent with the proxy session check.
 *
 * Safe to call from Server Components, Route Handlers, and Server Actions.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) return null;

  const claims = data.claims;
  const email = (claims.email as string | undefined) ?? "";

  if (!email) return null;

  return {
    id: claims.sub as string,
    email,
    // Custom role claim — undefined until a role system is introduced.
    role: (claims.user_role as string | undefined) ?? undefined,
  };
}
