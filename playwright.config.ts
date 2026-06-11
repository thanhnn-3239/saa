import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration.
 *
 * Tests live in `e2e/`. Playwright boots the Next.js app via the `webServer`
 * block, so `pnpm test:e2e` is one command.
 *
 * Env: the app's proxy refreshes a Supabase session on every request, and typed
 * env validation (lib/env.ts) runs at build. We PASS THROUGH the real env when
 * present (so authenticated tests reach a local Supabase) and fall back to
 * schema-valid dummies otherwise (smoke test contacts no backend).
 *
 * Authenticated projects (`setup` + `chromium-auth`) only exist when
 * AUTO_LOGIN_TOKEN is set — they need local Supabase + the dev seed. Without it,
 * only the unauthenticated smoke test runs (keeps CI green).
 */
const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;
const authEnabled = !!process.env.AUTO_LOGIN_TOKEN;

const authProjects = authEnabled
  ? [
      { name: "setup", testMatch: /.*\.setup\.ts/ },
      {
        name: "chromium-auth",
        testMatch: /.*\.authed\.spec\.ts/,
        dependencies: ["setup"],
        use: {
          ...devices["Desktop Chrome"],
          storageState: "playwright/.auth/user.json",
        },
      },
    ]
  : [];

/**
 * Sungen-compiled specs (specs/generated/) — kept separate from the
 * hand-written e2e/ suite but reusing the same webServer + baseURL.
 *
 * Screens whose Gherkin uses `@auth:member` compile to specs that load a real
 * session from specs/.auth/member.json, so they only run when AUTO_LOGIN_TOKEN
 * is set (via the `sungen-auth` project + its `sungen-setup` dependency). The
 * base `sungen` project always skips those dirs, so an unauthenticated run
 * (e.g. CI without Supabase) stays green.
 */
const SUNGEN_AUTHED_SCREENS = ["sun-kudos"];
const sungenAuthedDir = new RegExp(
  `specs/generated/(${SUNGEN_AUTHED_SCREENS.join("|")})/`,
);

const sungenProjects = [
  {
    name: "sungen",
    testDir: "./specs/generated",
    testIgnore: [sungenAuthedDir],
    use: { ...devices["Desktop Chrome"] },
  },
  ...(authEnabled
    ? [
        { name: "sungen-setup", testDir: "./specs", testMatch: /auth\.setup\.ts/ },
        {
          name: "sungen-auth",
          testDir: "./specs/generated",
          testMatch: [sungenAuthedDir],
          dependencies: ["sungen-setup"],
          use: { ...devices["Desktop Chrome"] },
        },
      ]
    : []),
];

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      // The default project never runs the setup file or the authed specs.
      testIgnore: [/.*\.setup\.ts/, /.*\.authed\.spec\.ts/],
      use: { ...devices["Desktop Chrome"] },
    },
    ...sungenProjects,
    ...authProjects,
  ],
  webServer: {
    command: "pnpm build && pnpm start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      // Pass through real env when present; schema-valid dummies otherwise.
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "e2e-placeholder-anon-key",
      NEXT_PUBLIC_EVENT_DATETIME:
        process.env.NEXT_PUBLIC_EVENT_DATETIME ?? "2025-12-26T18:30:00+07:00",
      // Server-only; needed only for authenticated runs (empty = disabled/safe).
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY ?? "",
      AUTO_LOGIN_TOKEN: process.env.AUTO_LOGIN_TOKEN ?? "",
    },
  },
});
