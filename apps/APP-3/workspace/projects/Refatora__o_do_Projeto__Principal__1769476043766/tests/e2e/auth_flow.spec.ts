
import { test, expect } from '@playwright/test';

test.describe('Biometric Authentication Gate', () => {
  
  test('Invalid access code triggers security alert', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="access-code"]', 'INVALID-CODE-000');
    await page.click('[data-testid="connect-btn"]');
    
    const errorMsg = page.locator('[data-testid="auth-error"]');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('ACCESS DENIED');
  });

  test('Valid code grants access to Control Center', async ({ page }) => {
    await page.goto('/login');
    
    // Assuming backend mock or seed data accepts this
    await page.fill('[data-testid="access-code"]', 'CYDONIA-ADMIN');
    await page.click('[data-testid="connect-btn"]');
    
    await expect(page).toHaveURL('/dashboard');
  });
});
