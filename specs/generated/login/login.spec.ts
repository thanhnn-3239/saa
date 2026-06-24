import { test, expect } from '../base';
import { type Page, type BrowserContext } from '@playwright/test';
import { TestDataLoader } from '../test-data';

// This file is auto-generated from Gherkin feature files
// DO NOT EDIT MANUALLY - changes will be overwritten
// To modify tests, edit the corresponding .feature file and regenerate

const testData = TestDataLoader.load('login', 'login');

/**
 * Feature: Login Screen
 *   As a guest
  I want to reach the login screen and switch language
  So that I can sign in to SAA 2025
  Path: /login
 */

test.describe.serial('Login Screen', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await page.close();
    await context.close();
  });

  test('Guest sees the login entry point', { tag: ['@auto', '@smoke'] }, async () => {
    // Open login page
    await page.goto('/login', { waitUntil: 'load' });
    await page.waitForLoadState('domcontentloaded');
    
    // Assert welcome is visible
    await expect(page.getByText('Bắt đầu hành trình của bạn cùng SAA 2025.')).toBeVisible();
    
    // Assert google login is enabled
    await expect(page.getByRole('button', { name: 'Đăng nhập bằng Google', exact: true })).toBeEnabled();
    
    // Assert copyright is visible
    await expect(page.getByText('Bản quyền thuộc về Sun* © 2025')).toBeVisible();
    
    // Assert close error is not visible
    await expect(page.getByRole('button', { name: 'Đóng thông báo lỗi', exact: true })).toBeHidden();
    
  });

  test('Visiting a protected route redirects a guest to login', { tag: ['@auto'] }, async () => {
    // Open home page
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForLoadState('domcontentloaded');
    
    // Assert on login page
    await expect(page).toHaveURL(/\/login/);
    
  });

  test('A known error code shows the error banner', { tag: ['@auto'] }, async () => {
    // Open login domain error page
    await page.goto('/login?error=domain', { waitUntil: 'load' });
    await page.waitForLoadState('domcontentloaded');
    
    // Assert close error is visible
    await expect(page.getByRole('button', { name: 'Đóng thông báo lỗi', exact: true })).toBeVisible();
    
    // Assert error banner contains "domain_error_fragment"
    await expect(page.getByText('không thuộc miền')).toContainText(testData.get('domain_error_fragment'));
    
  });

  test('Switching language renders the UI in English', { tag: ['@auto'] }, async () => {
    // Open login page
    await page.goto('/login', { waitUntil: 'load' });
    await page.waitForLoadState('domcontentloaded');
    
    // Click language
    await page.getByRole('button', { name: 'Chọn ngôn ngữ', exact: true }).click();
    // Click english
    await page.getByRole('option', { name: 'EN', exact: true }).click();
    // Assert google login en is enabled
    await expect(page.getByRole('button', { name: 'Sign in with Google', exact: true })).toBeEnabled();
    
  });

});
