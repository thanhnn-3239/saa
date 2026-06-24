import { test, expect } from "@playwright/test";

/**
 * Authenticated E2E for the notification bell (header dropdown interaction).
 * Runs in the `chromium-auth` project, which reuses the storage state saved by
 * e2e/auth.setup.ts — so the page starts already logged in as member-test.
 *
 * Two-tier split (see docs/sungen-pilot.md): the static /notifications PAGE is
 * covered by sungen (qa/screens/notifications → specs/generated/). This
 * hand-written spec owns the header bell's dynamic open/preview interaction,
 * which the screen-oriented Gherkin doesn't express.
 *
 * SEED-INDEPENDENT: asserts the bell renders and its panel opens with the
 * always-present controls, without depending on any notification rows existing.
 * The bell is targeted by `aria-haspopup="dialog"` (locale-agnostic); text
 * assertions accept either locale (default vi; see lib/i18n/config) via regex.
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

  // And a "view all" link to the full page (the page itself is sungen-covered).
  await expect(
    panel.getByRole("link", { name: /Xem tất cả|View all/i }),
  ).toHaveAttribute("href", "/notifications");
});
