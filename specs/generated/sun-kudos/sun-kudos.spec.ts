import { test, expect } from '../base';
import { type Page, type BrowserContext } from '@playwright/test';
import { TestDataLoader } from '../test-data';

// This file is auto-generated from Gherkin feature files
// DO NOT EDIT MANUALLY - changes will be overwritten
// To modify tests, edit the corresponding .feature file and regenerate

const testData = TestDataLoader.load('sun-kudos', 'sun-kudos');

/**
 * Feature: Sun* Kudos board
 *   As a logged-in Sunner
  I want to browse, filter, and react to kudos
  So that I can see and give recognition
  Path: /sun-kudos
 */

test.describe.serial('Sun* Kudos board', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({ storageState: 'specs/.auth/member.json' });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await page.close();
    await context.close();
  });

  test('A logged-in member sees the three board sections', { tag: ['@auto', '@smoke'] }, async () => {
    // Open sun-kudos page
    await page.goto('/sun-kudos', { waitUntil: 'load' });
    await page.waitForLoadState('domcontentloaded');
    
    // Assert highlight heading is visible
    await expect(page.getByRole('heading', { name: 'HIGHLIGHT KUDOS', exact: true })).toBeVisible();
    
    // Assert spotlight heading is visible
    await expect(page.getByRole('heading', { name: 'SPOTLIGHT BOARD', exact: true })).toBeVisible();
    
    // Assert all kudos heading is visible
    await expect(page.getByRole('heading', { name: 'ALL KUDOS', exact: true })).toBeVisible();
    
  });

  test('Filtering by an unused hashtag empties the feed', { tag: ['@auto'] }, async () => {
    // Open sun-kudos page
    await page.goto('/sun-kudos', { waitUntil: 'load' });
    await page.waitForLoadState('domcontentloaded');
    
    // Click hashtag filter
    await page.getByRole('button', { name: 'Hashtag', exact: true }).click();
    // Click positivity option
    await page.getByRole('option', { name: 'positivity', exact: true }).click();
    // Assert empty feed is visible
    await expect(page.locator('[data-testid="all-kudos-feed"]:has-text("Hiện tại chưa có Kudos nào.")')).toBeVisible();
    
  });

  test('Filtering by a hashtag drops non-matching kudos', { tag: ['@auto'] }, async () => {
    // Open sun-kudos page
    await page.goto('/sun-kudos', { waitUntil: 'load' });
    await page.waitForLoadState('domcontentloaded');
    
    // Click hashtag filter
    await page.getByRole('button', { name: 'Hashtag', exact: true }).click();
    // Click teamwork option
    await page.getByRole('option', { name: 'teamwork', exact: true }).click();
    // Assert k3 feed card is not visible
    await expect(page.locator('[data-testid="all-kudos-feed"] article:has-text("[e2e-k3]")')).toBeHidden();
    
  });

  test('A member likes then unlikes a kudo', { tag: ['@auto'] }, async () => {
    // Open sun-kudos page
    await page.goto('/sun-kudos', { waitUntil: 'load' });
    await page.waitForLoadState('domcontentloaded');
    
    // Assert k1 heart unliked is visible
    await expect(page.locator('[data-testid="all-kudos-feed"] article[aria-label="Kudo từ Member One tới Member Two"] button[aria-pressed="false"]')).toBeVisible();
    
    // Click k1 heart
    await page.locator('[data-testid="all-kudos-feed"] article[aria-label="Kudo từ Member One tới Member Two"] button[aria-pressed]').click();
    // Assert k1 heart liked is visible
    await expect(page.locator('[data-testid="all-kudos-feed"] article[aria-label="Kudo từ Member One tới Member Two"] button[aria-pressed="true"]')).toBeVisible();
    
    // Click k1 heart
    await page.locator('[data-testid="all-kudos-feed"] article[aria-label="Kudo từ Member One tới Member Two"] button[aria-pressed]').click();
    // Assert k1 heart unliked is visible
    await expect(page.locator('[data-testid="all-kudos-feed"] article[aria-label="Kudo từ Member One tới Member Two"] button[aria-pressed="false"]')).toBeVisible();
    
  });

});
