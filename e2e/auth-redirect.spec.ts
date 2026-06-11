import { test, expect } from "@playwright/test";

/**
 * Smoke E2E for the proxy auth gate (proxy.ts → lib/supabase/proxy-session.ts).
 *
 * Exercises the full stack — server boot, proxy session refresh, routing — end
 * to end, without a real Supabase backend. The proxy is allowlist-based: only
 * PUBLIC_PATHS (/login, /auth/callback, /auto-login) are reachable by guests;
 * everything else (including "/") 307-redirects to /login.
 */

test("redirects an unauthenticated visitor from / to /login", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  // The login screen renders its Google OAuth button.
  await expect(page.getByRole("button").first()).toBeVisible();
});

test("redirects an unauthenticated visitor from a protected route to /login", async ({
  page,
}) => {
  await page.goto("/sun-kudos");

  await expect(page).toHaveURL(/\/login$/);
});
