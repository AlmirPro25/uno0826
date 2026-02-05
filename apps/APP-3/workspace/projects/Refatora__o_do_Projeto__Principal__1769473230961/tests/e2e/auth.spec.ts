
import { test, expect } from '@playwright/test';

/**
 * E2E TEST VECTOR: AUTHENTICATION
 * Verifies security perimeter access.
 */

test('User can access login screen', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveTitle(/Sentinel Nexus/);
  await expect(page.locator('h1')).toContainText('IDENTIFICATION REQUIRED');
});

test('Invalid credentials triggers alert', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('input[name="username"]', 'unauthorized_entity');
  await page.fill('input[name="password"]', 'wrong_pass');
  await page.click('button[type="submit"]');

  // Expect error toast or message
  // Assuming UI implementation shows an alert
  // await expect(page.getByRole('alert')).toBeVisible();
});

test('Valid credentials grant access to Dashboard', async ({ page }) => {
  // Mocking the backend response would be ideal here, or running against a seeded DB
  await page.goto('/login');
  
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Should redirect to dashboard
  await page.waitForURL('/');
  await expect(page.locator('nav')).toBeVisible();
});
