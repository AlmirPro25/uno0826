
import { test, expect } from '@playwright/test';

test.describe('Beta Signup Form', () => {
  test('should allow a user to sign up for beta access successfully', async ({ page }) => {
    await page.goto('/'); // Assuming the beta signup form is on the homepage or a dedicated landing page

    // Fill the beta signup form
    await page.fill('input[data-aid="beta-name-input"]', 'John Doe');
    await page.fill('input[data-aid="beta-email-input"]', `john.doe.${Date.now()}@example.com`);
    await page.click('button[data-aid="beta-submit-button"]');

    // Expect a success toast message
    await expect(page.locator('[data-aid="toast-description"]')).toContainText('Sua inscrição para o acesso beta foi recebida. Verifique seu e-mail.');

    // Expect the form fields to be cleared after successful submission
    await expect(page.locator('input[data-aid="beta-name-input"]')).toHaveValue('');
    await expect(page.locator('input[data-aid="beta-email-input"]')).toHaveValue('');
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[data-aid="beta-name-input"]', 'Jane Doe');
    await page.fill('input[data-aid="beta-email-input"]', 'invalid-email'); // Invalid email
    await page.click('button[data-aid="beta-submit-button"]');

    // Expect an error message related to email validation
    await expect(page.locator(':has-text("Por favor, insira um e-mail válido.")')).toBeVisible();
    // No toast should appear yet, as it's a client-side validation error
  });

  test('should show error for missing name', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[data-aid="beta-email-input"]', `jane.doe.${Date.now()}@example.com`);
    // Name field left empty
    await page.click('button[data-aid="beta-submit-button"]');

    // Expect an error message related to name validation
    await expect(page.locator(':has-text("Nome deve ter no mínimo 2 caracteres.")')).toBeVisible();
  });

  test('should show error if email is already subscribed', async ({ page }) => {
    await page.goto('/');

    const existingEmail = `existing.${Date.now()}@example.com`;

    // First signup attempt (should succeed)
    await page.fill('input[data-aid="beta-name-input"]', 'First Subscriber');
    await page.fill('input[data-aid="beta-email-input"]', existingEmail);
    await page.click('button[data-aid="beta-submit-button"]');
    await expect(page.locator('[data-aid="toast-description"]')).toContainText('Sua inscrição para o acesso beta foi recebida.');
    await page.waitForTimeout(500); // Wait for toast to fade or disappear, adjust as needed

    // Second signup attempt with the same email
    await page.fill('input[data-aid="beta-name-input"]', 'Second Subscriber');
    await page.fill('input[data-aid="beta-email-input"]', existingEmail);
    await page.click('button[data-aid="beta-submit-button"]');

    // Expect an error toast message indicating email already subscribed
    await expect(page.locator('[data-aid="toast-description"]')).toContainText('Este e-mail já está inscrito no programa beta.');
  });
});
