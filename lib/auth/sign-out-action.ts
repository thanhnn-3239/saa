"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Action: signs the current user out of Supabase and redirects to
 * the login page. Called from client components (e.g. AccountMenu).
 *
 * supabase.auth.signOut() invalidates the session server-side and clears
 * the auth cookies via the `setAll` cookie handler configured in createClient().
 * Errors are intentionally swallowed because a failed signOut should not
 * block the user from being redirected away — the proxy will reject the
 * stale session on the next protected request anyway.
 */
export async function signOut(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Intentionally swallowed (incl. createClient/env failures): a failed
    // signOut must not surface a raw 500 nor block the redirect. The proxy
    // rejects any stale session on the next protected request anyway.
  }
  // Outside try/catch: redirect() throws NEXT_REDIRECT control-flow internally.
  redirect("/login");
}
