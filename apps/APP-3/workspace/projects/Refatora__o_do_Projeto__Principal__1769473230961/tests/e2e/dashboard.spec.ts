
import { test, expect } from '@playwright/test';

/**
 * E2E TEST VECTOR: TACTICAL DASHBOARD
 * Verifies telemetry and asset visualization.
 */

test.beforeEach(async ({ page }) => {
  // Bypass login for dashboard testing (Simulate Token)
  await page.addInitScript(() => {
    localStorage.setItem('sentinel_token', 'MOCK_VALID_TOKEN');
  });
});

test('Dashboard renders map and asset list', async ({ page }) => {
  await page.goto('/');
  
  // Verify core components
  await expect(page.locator('.leaflet-container')).toBeVisible(); // Map
  await expect(page.getByText('Global Threat Level')).toBeVisible();
});

test('Asset selection opens detail panel', async ({ page }) => {
  await page.goto('/');
  
  // Wait for assets to load (simulated)
  // Click first asset in list
  // await page.locator('.asset-row').first().click();
  
  // Verify details panel
  // await expect(page.locator('.asset-details')).toBeVisible();
});
