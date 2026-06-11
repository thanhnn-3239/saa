import { test, expect } from "@playwright/test";

/**
 * Authenticated E2E. Runs in the `chromium-auth` project, which reuses the
 * storage state saved by e2e/auth.setup.ts — so the page starts already logged
 * in as the seeded member-test user.
 *
 * Verifies a logged-in user reaches protected pages (no /login bounce),
 * exercising the full authed stack: proxy session check → SSR render. On `main`,
 * `/sun-kudos` is a ComingSoon stub, so the content assertion targets the real
 * homepage `/`; `/sun-kudos` is only checked for "not redirected to /login".
 */
test("a logged-in member sees the protected homepage", async ({ page }) => {
  await page.goto("/");

  // Not bounced to /login — the session from auth.setup.ts is honored.
  await expect(page).toHaveURL(/\/$/);
  await expect(page).not.toHaveURL(/\/login$/);

  // The authenticated chrome (header) and page content render.
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
});

test("a logged-in member can reach /sun-kudos (not bounced to /login)", async ({
  page,
}) => {
  await page.goto("/sun-kudos");

  await expect(page).toHaveURL(/\/sun-kudos$/);
  await expect(page).not.toHaveURL(/\/login$/);
});
