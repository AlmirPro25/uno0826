
import { test, expect } from '@playwright/test';

// CYDONIA AUTOMATED DIAGNOSTIC SUITE
// Verifies if the interface is correctly rendering life-critical data.

test.describe('Vital Signs Monitor', () => {
  
  test.beforeEach(async ({ page }) => {
    // Authenticate (Simulated)
    await page.goto('/login');
    await page.fill('[data-testid="access-code"]', 'ALPHA-1');
    await page.click('[data-testid="connect-btn"]');
    await page.waitForURL('/dashboard');
  });

  test('Should display Oxygen Levels within readable range', async ({ page }) => {
    // Check for the O2 Gauge
    const o2Indicator = page.locator('[data-testid="gauge-oxygen"]');
    await expect(o2Indicator).toBeVisible();
    
    // Validate text content contains "PPM"
    const text = await o2Indicator.textContent();
    expect(text).toContain('PPM');
  });

  test('Emergency Override button should trigger confirmation modal', async ({ page }) => {
    // Locate the critical action button
    const emergencyBtn = page.locator('button:has-text("FAIL-SAFE")');
    await emergencyBtn.click();

    // Expect a confirmation dialog/modal
    const modal = page.locator('[role="alertdialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('INTERVENTION EXECUTIVE REQUIRED');
  });

  test('Neural Link status should be ONLINE', async ({ page }) => {
    const statusIndicator = page.locator('[data-testid="network-status"]');
    await expect(statusIndicator).toHaveClass(/text-cyan-500|text-green-500/);
  });
});
