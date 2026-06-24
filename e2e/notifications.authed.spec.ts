import { test, expect } from "@playwright/test";

/**
 * Authenticated E2E for the notifications feature. Runs in the `chromium-auth`
 * project, which reuses the storage state saved by e2e/auth.setup.ts — so the
 * page starts already logged in as the seeded member-test user.
 *
 * These checks are SEED-INDEPENDENT: they assert the notification UI is wired up
 * and reachable (bell renders, panel opens, /notifications page loads) without
 * depending on any specific notification rows existing for the seeded user.
 *
 * Selectors: the bell is targeted by `aria-haspopup="dialog"` (locale-agnostic);
 * text assertions accept either locale (default is vi; see lib/i18n/config) via
 * regex, so the suite survives a locale-cookie change.
 */

test("the notification bell renders and opens a panel for a logged-in user", async ({
  page,
}) => {
  await page.goto("/");

  // Authenticated, not bounced to /login.
  await expect(page).not.toHaveURL(/\/login$/);

  // The bell is the only header control with a dialog popup.
  const bell = page.locator('button[aria-haspopup="dialog"]');
  await expect(bell).toBeVisible();

  // Opening the bell reveals the notifications panel (role="dialog").
  await bell.click();
  const panel = page.getByRole("dialog");
  await expect(panel).toBeVisible();

  // The panel header always offers "mark all as read", regardless of contents.
  await expect(
    panel.getByRole("button", { name: /Đánh dấu đọc tất cả|Mark all as read/i }),
  ).toBeVisible();

  // And a "view all" link to the full page.
  await expect(
    panel.getByRole("link", { name: /Xem tất cả|View all/i }),
  ).toHaveAttribute("href", "/notifications");
});

test("a logged-in member can reach the /notifications page", async ({ page }) => {
  await page.goto("/notifications");

  // Reached the page, not bounced to /login.
  await expect(page).toHaveURL(/\/notifications$/);
  await expect(page).not.toHaveURL(/\/login$/);

  // The page renders its heading (vi "Thông Báo" / en "Notifications").
  await expect(
    page.getByRole("heading", { name: /Thông Báo|Notifications/i }),
  ).toBeVisible();
});
