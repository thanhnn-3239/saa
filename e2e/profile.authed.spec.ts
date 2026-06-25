import { test, expect } from "@playwright/test";

/**
 * Profile (/profile) E2E — the logged-in member's own profile. Runs in the
 * `chromium-auth` project (AUTO_LOGIN_TOKEN + local Supabase), logged in as
 * member-test (see e2e/auth.setup.ts).
 *
 * Replaces the stale sungen-compiled specs/generated/profile spec, which still
 * asserted the old <ComingSoon/> placeholder removed in this PR — mirroring how
 * /awards-information was handled (see playwright.config.ts SUNGEN_AUTHED_SCREENS).
 * Unauthenticated /profile -> /login is already covered by e2e/auth-redirect.spec.ts.
 *
 * Text assertions accept vi and en strings, matching whichever locale renders.
 */

const SENT = /Đã gửi|Sent/;
const RECEIVED = /Đã nhận|Received/;

test.describe("Profile page (authed)", () => {
  test("renders the real self-profile (not the coming-soon placeholder)", async ({
    page,
  }) => {
    await page.goto("/profile");

    // Authed: the proxy lets us through (no bounce to /login).
    await expect(page).toHaveURL(/\/profile$/);

    // Hero identity block — the member's name renders as the page h1.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Awards section header (stable, locale-independent proper noun).
    await expect(
      page.getByRole("heading", { name: "Sun* Annual Awards 2025", exact: true }),
    ).toBeVisible();

    // Secret Box stats card action (display-only in this PR).
    await expect(
      page.getByRole("button", { name: /Mở Secret Box|Open Secret Box/ }),
    ).toBeVisible();
  });

  test("Sent/Received toggle switches the feed direction", async ({ page }) => {
    await page.goto("/profile");

    // Default direction is Sent (matches the design's "Đã gửi (N)").
    const sentTrigger = page.getByRole("button", { name: SENT }).first();
    await expect(sentTrigger).toBeVisible();

    // Open the dropdown and pick Received (FilterDropdown options are role=option).
    await sentTrigger.click();
    await page.getByRole("option", { name: RECEIVED }).click();

    // The trigger now reflects the Received direction.
    await expect(page.getByRole("button", { name: RECEIVED }).first()).toBeVisible();
  });
});
