import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = "playwright/.auth/user.json";

/**
 * One-time login for authenticated E2E. Hits the token-gated /auto-login
 * backdoor (PR #11) to mint a REAL Supabase session for a seeded member, then
 * saves storage state for the `chromium-auth` project to reuse.
 *
 * This file only runs when AUTO_LOGIN_TOKEN is set (the config only includes the
 * `setup` project then), so the env reads below are always defined at runtime.
 */
setup("authenticate via /auto-login backdoor", async ({ page }) => {
  const token = process.env.AUTO_LOGIN_TOKEN as string;
  const email = "member-test@sun-asterisk.com";

  await page.goto(`/auto-login?email=${encodeURIComponent(email)}&token=${token}`);

  // The backdoor 307-redirects to "/" with a real session cookie; the proxy then
  // lets the authed user through (no bounce to /login).
  await expect(page).toHaveURL(/\/$/);
  await expect(page).not.toHaveURL(/\/login$/);

  await page.context().storageState({ path: AUTH_FILE });
});
