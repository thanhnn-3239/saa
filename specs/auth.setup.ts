import { test as setup, expect } from "@playwright/test";

/**
 * Auth setup for sungen's authed screens.
 *
 * Sungen compiles `@auth:member` scenarios to
 * `test.use({ storageState: 'specs/.auth/member.json' })`, so that file must
 * exist before the `sungen-auth` project runs. We mint a REAL Supabase session
 * through the token-gated /auto-login backdoor (the same mechanism as
 * e2e/auth.setup.ts) instead of sungen's `makeauth`, which opens a browser for
 * manual SSO login.
 *
 * Only wired into the config when AUTO_LOGIN_TOKEN is set (see playwright.config.ts).
 */
const AUTH_FILE = "specs/.auth/member.json";

setup("authenticate via /auto-login backdoor", async ({ page }) => {
  const token = process.env.AUTO_LOGIN_TOKEN as string;
  // Distinct from e2e/auth.setup.ts's member-test: the two setups run in
  // parallel and concurrent /auto-login for the SAME user races in GoTrue.
  // member03 is neither sender nor recipient of the k1 kudo, so it can like it.
  const email = "member03@sun-asterisk.com";

  await page.goto(
    `/auto-login?email=${encodeURIComponent(email)}&token=${token}`,
  );

  // The backdoor 307-redirects to "/" with a real session cookie; the proxy
  // then lets the authed user through (no bounce to /login).
  await expect(page).toHaveURL(/\/$/);
  await expect(page).not.toHaveURL(/\/login$/);

  await page.context().storageState({ path: AUTH_FILE });
});
