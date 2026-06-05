import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration.
 *
 * Tests live in `e2e/` (kept separate from the Vitest unit suite under
 * app/lib/i18n/messages). Playwright boots the Next.js app itself via the
 * `webServer` block below, so `pnpm test:e2e` is a one-command run.
 *
 * The app's proxy (proxy.ts) refreshes a Supabase session on every request,
 * which requires the two public Supabase env vars to exist. Their values are
 * irrelevant for the smoke test (no real backend is contacted), so dummy
 * placeholders are injected — mirroring the `build` step in CI.
 */
const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Fail the build on CI if test.only is committed.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel workers on CI for deterministic runs.
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // --- Authenticated tests (to wire up once the login feature lands) ---
    // Decision: Approach A — programmatic login + storageState (no prod code
    // changes, exercises the real Supabase session/cookie path).
    //
    // 1. Add a setup project that runs `e2e/auth.setup.ts` once:
    //      { name: "setup", testMatch: /.*\.setup\.ts/ }
    //    In it, against LOCAL Supabase (`supabase start`), use the service_role
    //    key to `admin.createUser` a confirmed @sun-asterisk.com test user, then
    //    sign in via the @supabase/ssr browser client so it writes the
    //    `sb-*-auth-token` cookie the proxy reads, and
    //    `page.context().storageState({ path: "playwright/.auth/user.json" })`.
    // 2. Add an authenticated project that depends on "setup" and reuses it:
    //      { name: "chromium-auth", dependencies: ["setup"],
    //        use: { ...devices["Desktop Chrome"],
    //               storageState: "playwright/.auth/user.json" } }
    //    Tests there start already logged in and skip the OAuth UI entirely.
    // `playwright/.auth/` is already git-ignored.
  ],
  // Build + start the production server, like real users hit it. Falls back to
  // an already-running dev server locally so iterating is fast.
  webServer: {
    command: "pnpm build && pnpm start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "e2e-placeholder-anon-key",
    },
  },
});
