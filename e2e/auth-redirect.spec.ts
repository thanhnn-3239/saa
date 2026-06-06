import { test, expect } from "@playwright/test";

/**
 * Smoke E2E for the proxy auth gate (proxy.ts → lib/supabase/proxy-session.ts).
 *
 * Exercises the full stack — server boot, proxy session refresh, routing and
 * SSR render — end to end, without a real Supabase backend. The proxy is
 * allowlist-based: only PUBLIC_PATHS are reachable by guests; everything else
 * 307-redirects to /login.
 *
 * Two complementary cases:
 *   1. "/" is PUBLIC (the SAA homepage) — a guest stays on it, no redirect.
 *   2. "/profile" is PROTECTED — a guest is bounced to /login.
 */

test("lets an unauthenticated visitor see the public homepage at /", async ({
  page,
}) => {
  await page.goto("/");

  // Stayed on the homepage — NOT bounced to /login.
  await expect(page).not.toHaveURL(/\/login$/);
  await expect(page).toHaveURL(/\/$/);

  // The public layout (header) and homepage content (main) render for guests.
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
});

test("redirects an unauthenticated visitor from a protected route to /login", async ({
  page,
}) => {
  await page.goto("/profile");

  await expect(page).toHaveURL(/\/login$/);
  // The login screen renders its Google OAuth button.
  await expect(page.getByRole("button").first()).toBeVisible();
});
