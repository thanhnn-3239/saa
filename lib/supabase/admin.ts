import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Supabase service-role ("admin") client. Bypasses RLS — server-only.
 * "admin" = service_role key, NOT the app's `admin` profile role.
 * Used by the auto-login backdoor to look up users and mint magiclink sessions.
 *
 * Plain `@supabase/supabase-js` (NOT `@supabase/ssr`): no cookies are involved.
 */
export function createAdminClient() {
  const secretKey = env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is required for the admin client");
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
