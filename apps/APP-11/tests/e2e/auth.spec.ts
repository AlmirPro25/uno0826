
import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  const testUser = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
  };

  test('should allow a user to register, login, and view dashboard', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    await expect(page).toHaveURL(/register/);

    // Register a new user
    await page.fill('input[data-aid="register-name-input"]', testUser.name);
    await page.fill('input[data-aid="register-email-input"]', testUser.email);
    await page.fill('input[data-aid="register-password-input"]', testUser.password);
    await page.click('button[data-aid="register-submit-button"]');

    // Expect to be redirected to login after successful registration (or directly to dashboard if auto-login)
    await page.waitForURL(/dashboard/);
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('h1')).toHaveText(`Olá, ${testUser.name.split(' ')[0]}!`);

    // Verify localStorage has tokens
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(accessToken).toBeTruthy();

    // Logout
    await page.click('button[data-aid="logout-button"]');
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
    const noAccessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(noAccessToken).toBeNull();

    // Login with the registered user
    await page.goto('/login');
    await expect(page).toHaveURL(/login/);
    await page.fill('input[data-aid="login-email-input"]', testUser.email);
    await page.fill('input[data-aid="login-password-input"]', testUser.password);
    await page.click('button[data-aid="login-submit-button"]');

    // Expect to be redirected to dashboard after successful login
    await page.waitForURL(/dashboard/);
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('h1')).toHaveText(`Olá, ${testUser.name.split(' ')[0]}!`);
  });

  test('should prevent registration with existing email', async ({ page }) => {
    // Re-use the existing user's email from the previous test or define a new one for this test specifically
    // For standalone test, let's register a user first.
    await page.goto('/register');
    await page.fill('input[data-aid="register-name-input"]', 'Existing User');
    await page.fill('input[data-aid="register-email-input"]', testUser.email); // Use the same email
    await page.fill('input[data-aid="register-password-input"]', 'anotherpass');
    await page.click('button[data-aid="register-submit-button"]');
    await page.waitForURL(/dashboard/); // First registration should succeed

    await page.click('button[data-aid="logout-button"]'); // Logout to register again
    await page.waitForURL('/');

    await page.goto('/register');
    await page.fill('input[data-aid="register-name-input"]', 'Duplicate User');
    await page.fill('input[data-aid="register-email-input"]', testUser.email); // Attempt to register with same email
    await page.fill('input[data-aid="register-password-input"]', 'duppass');
    await page.click('button[data-aid="register-submit-button"]');

    // Expect to see an error toast or message
    await expect(page.locator('[data-aid="toast-description"]')).toContainText('Este e-mail já está registrado.');
    // Should remain on the register page or a page indicating error
    await expect(page).toHaveURL(/register/);
  });

  test('should update user profile', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[data-aid="login-email-input"]', testUser.email);
    await page.fill('input[data-aid="login-password-input"]', testUser.password);
    await page.click('button[data-aid="login-submit-button"]');
    await page.waitForURL(/dashboard/);

    await page.click('a[href="/dashboard/profile"]'); // Navigate to profile page
    await expect(page).toHaveURL(/profile/);

    const newName = 'Updated Test User Name';
    const newEmail = `updated-${Date.now()}@example.com`;

    // Update name and email
    await page.fill('input[data-aid="profile-name-input"]', newName);
    await page.fill('input[data-aid="profile-email-input"]', newEmail);
    await page.click('button[data-aid="profile-save-button"]');

    // Expect success toast
    await expect(page.locator('[data-aid="toast-description"]')).toContainText('Seu perfil foi atualizado com sucesso.');

    // Verify updated name on page
    await expect(page.locator('input[data-aid="profile-name-input"]')).toHaveValue(newName);
    await expect(page.locator('input[data-aid="profile-email-input"]')).toHaveValue(newEmail);

    // Update testUser email for subsequent tests if this is part of a larger suite
    testUser.email = newEmail;
  });
});
