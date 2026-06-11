import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * Sun* Kudos board E2E — feed, filters, like. Runs in the `chromium-auth`
 * project (AUTO_LOGIN_TOKEN + local Supabase), logged in as member-test.
 *
 * Data contract: supabase/seeds/dev/seed_e2e_kudos.sql. Seed both dev files in
 * one reset so the kudos exist:
 *
 *   SUPABASE_EXTRA_SEEDS="./seeds/dev/*.sql" pnpm db:reset
 *
 * The seeded bodies carry [e2e-kN] markers used as unambiguous card locators
 * (the same kudo can appear in both the highlight carousel and the feed, so
 * every card lookup is scoped to the ALL KUDOS section). Text assertions
 * accept vi and en strings, matching whichever locale the session renders.
 */

const K1 = "[e2e-k1]"; // member01 → member02 (Design), #teamwork
const K2 = "[e2e-k2]"; // member03 → member04 (Operations), #teamwork
const K3 = "[e2e-k3]"; // member05 → member06 (Engineering), #innovation
const K5 = "[e2e-k5]"; // member02 → member01, anonymous, #ownership
const K6 = "[e2e-k6]"; // member-test → member01 — own kudo, like is guarded

function feedSection(page: Page): Locator {
  return page.locator("section").filter({
    has: page.getByRole("heading", { name: "ALL KUDOS", exact: true }),
  });
}

function feedCard(page: Page, marker: string): Locator {
  return feedSection(page).locator("article").filter({ hasText: marker });
}

/** The heart toggle is the only aria-pressed control in a card. */
function heartButton(card: Locator): Locator {
  return card.locator("button[aria-pressed]");
}

/**
 * Click the heart and wait for the like API round-trip to settle. Reloading
 * while the POST is still in flight can catch the next SSR between its
 * heart-count and liked-set queries (lib/kudos/queries.ts fetches them
 * sequentially), rendering a momentary liked=true/count=0 state.
 */
async function toggleHeart(page: Page, heart: Locator): Promise<void> {
  const settled = page.waitForResponse(
    (r) => r.url().includes("/api/kudos/") && r.url().endsWith("/like") && r.ok(),
  );
  await heart.click();
  await settled;
}

async function pickFilter(
  page: Page,
  trigger: string | RegExp,
  option: string | RegExp,
): Promise<void> {
  await page.getByRole("button", { name: trigger }).click();
  await page.getByRole("option", { name: option }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/sun-kudos");
  await expect(page).toHaveURL(/\/sun-kudos$/);
});

test("renders the three board sections", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "HIGHLIGHT KUDOS", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "SPOTLIGHT BOARD", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "ALL KUDOS", exact: true }),
  ).toBeVisible();
});

test("feed shows a seeded kudo with sender, recipient, hashtag, and time", async ({
  page,
}) => {
  const card = feedCard(page, K1);

  await expect(card).toBeVisible();
  await expect(card).toContainText("Member One");
  await expect(card).toContainText("Member Two");
  await expect(card.getByText("teamwork")).toBeVisible();
  await expect(card.locator("time")).toBeVisible();
});

test("an anonymous kudo hides the sender name", async ({ page }) => {
  const card = feedCard(page, K5);

  await expect(card).toContainText(/Ẩn danh|Anonymous/);
  // member02 sent it — her name must not leak on the card.
  await expect(card).not.toContainText("Member Two");
});

test("hashtag filter narrows the feed and All restores it", async ({
  page,
}) => {
  await expect(feedCard(page, K3)).toBeVisible();

  await pickFilter(page, "Hashtag", "teamwork");

  await expect(feedCard(page, K1)).toBeVisible();
  await expect(feedCard(page, K2)).toBeVisible();
  await expect(feedCard(page, K3)).toHaveCount(0);

  // The trigger now shows the selected tag; choosing All clears the filter.
  await pickFilter(page, "teamwork", /^(Tất cả|All)$/);
  await expect(feedCard(page, K3)).toBeVisible();
});

test("department filter keeps only kudos whose recipient is in that department", async ({
  page,
}) => {
  await pickFilter(page, /Phòng ban|Department/, "Design");

  await expect(feedCard(page, K1)).toBeVisible(); // member02 — Design
  await expect(feedCard(page, K2)).toHaveCount(0); // member04 — Operations
  await expect(feedCard(page, K3)).toHaveCount(0); // member06 — Engineering
});

test("filtering by an unused hashtag shows the feed empty state", async ({
  page,
}) => {
  await pickFilter(page, "Hashtag", "positivity");

  await expect(
    feedSection(page).getByText(/Hiện tại chưa có Kudos nào|No Kudos yet/),
  ).toBeVisible();
  await expect(feedSection(page).locator("article")).toHaveCount(0);
});

test("liking a kudo persists across reload and unliking restores the count", async ({
  page,
}) => {
  const heart = heartButton(feedCard(page, K1));
  await expect(heart).toBeVisible();

  // Normalize: a crashed earlier run may have left the like behind.
  if ((await heart.getAttribute("aria-pressed")) === "true") {
    await toggleHeart(page, heart);
    await expect(heart).toHaveAttribute("aria-pressed", "false");
  }
  const before = Number(await heart.textContent());

  await toggleHeart(page, heart);
  await expect(heart).toHaveAttribute("aria-pressed", "true");
  await expect(heart).toHaveText(String(before + 1));

  // Server persisted the like — survives a full reload.
  await page.reload();
  const heartAfterReload = heartButton(feedCard(page, K1));
  await expect(heartAfterReload).toHaveAttribute("aria-pressed", "true");
  await expect(heartAfterReload).toHaveText(String(before + 1));

  // Unlike — also resets DB state so the test is repeatable.
  await toggleHeart(page, heartAfterReload);
  await expect(heartAfterReload).toHaveAttribute("aria-pressed", "false");
  await expect(heartAfterReload).toHaveText(String(before));
});

test("clicking the heart on your own kudo does nothing", async ({ page }) => {
  const heart = heartButton(feedCard(page, K6));
  await expect(heart).toBeVisible();
  const before = (await heart.textContent()) ?? "0";

  await heart.click();

  // The self-like guard swallows the click — no optimistic bump, no request.
  await expect(heart).toHaveAttribute("aria-pressed", "false");
  await expect(heart).toHaveText(before);
});
