import { test, expect } from "@playwright/test";

/**
 * Login page UI E2E — runs in the default `chromium` project (no backend,
 * no auth, no .env.local needed).
 *
 * The app defaults to Vietnamese when no NEXT_LOCALE cookie is set, so the
 * initial assertions use the vi strings from messages/vi.json. The language
 * switcher test flips to English and verifies the choice persists across a
 * reload (the server action writes the NEXT_LOCALE cookie).
 */

const VI = {
  welcome: "Bắt đầu hành trình của bạn cùng SAA 2025.",
  loginButton: "Đăng nhập bằng Google",
  footer: "Bản quyền thuộc về Sun* © 2025",
  langSelectAria: "Chọn ngôn ngữ",
  closeError: "Đóng thông báo lỗi",
  errorDomain:
    "Tài khoản không thuộc miền @sun-asterisk.com. Vui lòng dùng tài khoản Sun*.",
  errorGeneric: "Đăng nhập thất bại. Vui lòng thử lại.",
};

test("renders the welcome copy, Google sign-in button, and footer", async ({
  page,
}) => {
  await page.goto("/login");

  await expect(page.getByText(VI.welcome)).toBeVisible();
  await expect(
    page.getByRole("button", { name: VI.loginButton }),
  ).toBeEnabled();
  await expect(page.getByText(VI.footer)).toBeVisible();
});

// Next.js mounts its own [role="alert"] route announcer, so banner locators
// are always filtered by the expected message text.
test("shows no error banner without an ?error param", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("button", { name: VI.loginButton }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: VI.closeError }),
  ).toHaveCount(0);
});

test("shows a dismissible banner for a known error code", async ({ page }) => {
  await page.goto("/login?error=domain");

  const banner = page.getByRole("alert").filter({ hasText: VI.errorDomain });
  await expect(banner).toBeVisible();

  await banner.getByRole("button", { name: VI.closeError }).click();
  await expect(banner).toHaveCount(0);
});

test("falls back to the generic message for unknown error codes", async ({
  page,
}) => {
  await page.goto("/login?error=something-unexpected");

  await expect(
    page.getByRole("alert").filter({ hasText: VI.errorGeneric }),
  ).toBeVisible();
});

test("language switcher flips the UI to English and persists across reload", async ({
  page,
}) => {
  await page.goto("/login");

  await page.getByRole("button", { name: VI.langSelectAria }).click();
  await page.getByRole("option", { name: "EN" }).click();

  // Server Components re-render in English after the locale cookie is set.
  const englishButton = page.getByRole("button", {
    name: "Sign in with Google",
  });
  await expect(englishButton).toBeVisible();

  // The NEXT_LOCALE cookie keeps the choice across a full reload.
  await page.reload();
  await expect(englishButton).toBeVisible();
});
