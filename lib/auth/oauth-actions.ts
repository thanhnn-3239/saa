"use client";

import { createClient } from "@/lib/supabase/client";
import { ALLOWED_DOMAIN } from "@/lib/auth/allowed-domain";

/**
 * Starts the Google OAuth flow (full-page redirect to Google, then back to
 * /auth/callback). The real domain restriction is enforced server-side in the
 * callback route — `hd` here only pre-selects the Sun* workspace in Google's UI.
 *
 * Throws if Supabase fails to initiate the redirect, so callers can stop their
 * loading state and surface an error.
 */
export async function signInWithGoogle(next = "/"): Promise<void> {
  const supabase = createClient();
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { hd: ALLOWED_DOMAIN, prompt: "select_account" },
    },
  });

  if (error) throw error;
}
