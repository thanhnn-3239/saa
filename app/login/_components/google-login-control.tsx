"use client";

import { useState } from "react";
import { LoginButton } from "./login-button";
import { signInWithGoogle } from "@/lib/auth/oauth-actions";

/**
 * Stateful wrapper around the presentational <LoginButton>. Owns the loading
 * state and triggers Supabase Google OAuth. On success the browser navigates to
 * Google (loading stays true until then); on init failure it shows the error banner.
 */
export function GoogleLoginControl() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await signInWithGoogle("/");
      // Success path redirects to Google — keep the button in its loading state.
    } catch {
      setLoading(false);
      window.location.assign("/login?error=oauth");
    }
  }

  return <LoginButton onClick={handleClick} loading={loading} />;
}
