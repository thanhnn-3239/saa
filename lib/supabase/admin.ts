import { createClient } from "@supabase/supabase-js";

/**
 * Supabase service-role ("admin") client. Bypasses RLS — server-only.
 * "admin" = service_role key, NOT the app's `admin` profile role.
 * Used by the auto-login backdoor to look up users and mint magiclink sessions.
 *
 * Plain `@supabase/supabase-js` (NOT `@supabase/ssr`): no cookies are involved,
 * this is for admin/Admin-API operations only.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
