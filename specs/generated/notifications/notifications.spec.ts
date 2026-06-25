import { test, expect } from '../base';
import { type Page, type BrowserContext } from '@playwright/test';
import { TestDataLoader } from '../test-data';

// This file is auto-generated from Gherkin feature files
// DO NOT EDIT MANUALLY - changes will be overwritten
// To modify tests, edit the corresponding .feature file and regenerate

const testData = TestDataLoader.load('notifications', 'notifications');

/**
 * Feature: Notifications page
 *   As a logged-in Sunner
  I want to open the notifications page
  So that I can review all my notifications in one place
  Path: /notifications
 */

test.describe.serial('Notifications page', () => {
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

  test('A logged-in member sees the notifications page', { tag: ['@auto', '@smoke'] }, async () => {
    // Open notifications page
    await page.goto('/notifications', { waitUntil: 'load' });
    await page.waitForLoadState('domcontentloaded');
    
    // Assert page heading is visible
    await expect(page.getByRole('heading', { name: 'Thông Báo', exact: true })).toBeVisible();
    
    // Assert mark all read is visible
    await expect(page.getByRole('button', { name: 'Đánh dấu đọc tất cả', exact: true })).toBeVisible();
    
  });

});
