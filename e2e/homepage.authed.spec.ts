import { test, expect } from "@playwright/test";

/**
 * Authenticated homepage E2E. Runs in the `chromium-auth` project (requires
 * AUTO_LOGIN_TOKEN + local Supabase — see docs/e2e-testing.md), reusing the
 * storage state saved by e2e/auth.setup.ts.
 *
 * Assertions stick to strings that are identical in vi and en (nav labels,
 * countdown units, event info values, award counts), so they pass regardless
 * of the NEXT_LOCALE cookie.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page).not.toHaveURL(/\/login$/);
});

test("header nav marks About SAA 2025 as the current page", async ({
  page,
}) => {
  const nav = page.getByRole("banner").getByRole("navigation");

  await expect(
    nav.getByRole("link", { name: "About SAA 2025" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    nav.getByRole("link", { name: "Award Information" }),
  ).not.toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Sun* Kudos" })).toBeVisible();
});

test("hero shows the countdown units and event info", async ({ page }) => {
  await expect(page.getByText("DAYS")).toBeVisible();
  await expect(page.getByText("HOURS")).toBeVisible();
  await expect(page.getByText("MINUTES")).toBeVisible();

  await expect(page.getByText("26/12/2025")).toBeVisible();
  await expect(page.getByText("Âu Cơ Art Center")).toBeVisible();
});

test("awards section lists all six award categories", async ({ page }) => {
  const awards = page.locator("#awards");
  await awards.scrollIntoViewIfNeeded();

  await expect(awards.getByRole("heading", { level: 2 })).toBeVisible();
  // One card per category, each a single link anchored into /awards-information.
  await expect(awards.locator('a[href^="/awards-information#"]')).toHaveCount(
    6,
  );
});

test("header nav navigates to the Awards Information page", async ({
  page,
}) => {
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Award Information" })
    .click();

  await expect(page).toHaveURL(/\/awards-information$/);
  await expect(page).not.toHaveURL(/\/login$/);
  await expect(page.getByRole("main")).toBeVisible();
});

test("footer renders the section links", async ({ page }) => {
  const footer = page.getByRole("contentinfo");
  await footer.scrollIntoViewIfNeeded();

  await expect(
    footer.getByRole("link", { name: "About SAA 2025" }),
  ).toBeVisible();
  await expect(
    footer.getByRole("link", { name: "Award Information" }),
  ).toBeVisible();
  await expect(footer.getByRole("link", { name: "Sun* Kudos" })).toBeVisible();
});
