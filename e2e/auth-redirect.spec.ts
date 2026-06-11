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

// Every non-allowlisted route bounces to /login — one case per nav target.
for (const route of ["/sun-kudos", "/awards-information", "/profile"]) {
  test(`redirects an unauthenticated visitor from ${route} to /login`, async ({
    page,
  }) => {
    await page.goto(route);

    await expect(page).toHaveURL(/\/login$/);
  });
}
