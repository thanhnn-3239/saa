import { test, expect } from '../base';
import { type Page, type BrowserContext } from '@playwright/test';
import { TestDataLoader } from '../test-data';

// This file is auto-generated from Gherkin feature files
// DO NOT EDIT MANUALLY - changes will be overwritten
// To modify tests, edit the corresponding .feature file and regenerate

const testData = TestDataLoader.load('profile', 'profile');

/**
 * Feature: Profile page
 *   As a logged-in Sunner
  I want to open my profile page
  So that I can manage my account when the feature launches
  Path: /profile
 */

test.describe.serial('Profile page', () => {
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

  test('A logged-in member sees the coming-soon placeholder', { tag: ['@auto', '@smoke'] }, async () => {
    // Open profile page
    await page.goto('/profile', { waitUntil: 'load' });
    await page.waitForLoadState('domcontentloaded');
    
    // Assert coming soon title is visible
    await expect(page.getByRole('heading', { name: 'Trang này sắp ra mắt', exact: true })).toBeVisible();
    
    // Assert back home is visible
    await expect(page.getByRole('link', { name: 'Quay lại trang chủ', exact: true })).toBeVisible();
    
  });

  test('The back-home link returns to the homepage', { tag: ['@auto'] }, async () => {
    // Open profile page
    await page.goto('/profile', { waitUntil: 'load' });
    await page.waitForLoadState('domcontentloaded');
    
    // Click back home
    await page.getByRole('link', { name: 'Quay lại trang chủ', exact: true }).click();
    // Assert awards system heading is visible
    await expect(page.getByRole('heading', { name: 'Hệ thống giải thưởng', exact: true })).toBeVisible();
    
  });

});
