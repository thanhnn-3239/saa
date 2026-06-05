import { test, expect } from "@playwright/test";

/**
 * Smoke E2E: the proxy (proxy.ts → lib/supabase/proxy-session.ts) must send
 * unauthenticated visitors to /login. This exercises the full stack —
 * server boot, proxy session refresh, routing and SSR render — end to end,
 * without needing a real Supabase backend.
 */
test("redirects an unauthenticated visitor from / to /login", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  // The login screen renders its Google OAuth button.
  await expect(page.getByRole("button").first()).toBeVisible();
});
