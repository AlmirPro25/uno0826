
import { test, expect } from '@playwright/test';
import { request } from '@playwright/test';

/**
 * AEGIS-VII END-TO-END VERIFICATION
 * Simulates an operator interacting with the console, now with authentication.
 */

test.describe('Tactical Command Console (Authenticated)', () => {
  let authToken: string;
  let adminAuthToken: string;

  // Before all tests, register and log in a default user
  test.beforeAll(async ({ playwright }) => {
    const apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000/api',
    });

    // Register a test user
    const registerResponse = await apiContext.post('/auth/register', {
      data: {
        username: 'e2e_operator',
        password: 'Password123!',
      },
    });
    expect(registerResponse.ok()).toBeTruthy();
    const { token: opToken } = await registerResponse.json();
    authToken = opToken;

    // Log in with the default admin user (created during DB seed)
    const adminLoginResponse = await apiContext.post('/auth/login', {
        data: {
            username: 'admin',
            password: 'password', // Default password
        },
    });
    expect(adminLoginResponse.ok()).toBeTruthy();
    const { token: admToken } = await adminLoginResponse.json();
    adminAuthToken = admToken;
    
    await apiContext.dispose();
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to the app and inject the auth token directly for convenience
    await page.goto('/');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, authToken);
    await page.reload(); // Reload to pick up the token and redirect to dashboard
    
    // Wait for the dashboard to load and the uplink to be established
    await expect(page.getByText('SECURE UPLINK ESTABLISHED')).toBeVisible({ timeout: 15000 });
    
    // Acknowledge any potential initial errors
    const acknowledgeButton = page.getByRole('button', { name: 'ACKNOWLEDGE' });
    if (await acknowledgeButton.isVisible()) {
      await acknowledgeButton.click();
      await expect(acknowledgeButton).not.toBeVisible();
    }
  });

  test('System Initialization Check and Resource Display', async ({ page }) => {
    // Verify Title / Branding
    await expect(page).toHaveTitle(/Aegis-VII/);
    
    // Check for Main Dashboard elements
    const dashboard = page.locator('main');
    await expect(dashboard).toBeVisible();

    // Verify Resources are displayed and have initial values (not 0 after init)
    await expect(page.getByText('CPU CYCLES')).toBeVisible();
    const cpuValue = await page.locator('#res-cpu').textContent();
    expect(parseInt(cpuValue!.replace(/,/g, ''))).toBeGreaterThan(0);

    await expect(page.getByText('BANDWIDTH')).toBeVisible();
    const bwValue = await page.locator('#res-bw').textContent();
    expect(parseInt(bwValue!.replace(/,/g, ''))).toBeGreaterThan(0);

    // Verify initial logs are present
    await expect(page.getByText(/AEGIS-VII C2 NODE ACTIVATED/i)).toBeVisible();
    await expect(page.getByText(/OPERATOR: E2E_OPERATOR/i)).toBeVisible(); // Check logged in user
  });

  test('Unit Fabrication Protocol - MINER', async ({ page }) => {
    // Get initial CPU & BW
    const initialCpuText = await page.locator('#res-cpu').textContent();
    const initialBwText = await page.locator('#res-bw').textContent();
    const initialCpu = parseInt(initialCpuText!.replace(/,/g, ''));
    const initialBw = parseInt(initialBwText!.replace(/,/g, ''));

    // Locate the Fabricate Miner Droid button
    const fabricateMinerButton = page.getByRole('button', { name: 'MINER DROID' });
    await expect(fabricateMinerButton).toBeEnabled();
    
    // Execute Click
    await fabricateMinerButton.click();

    // Verify a new unit appears in the roster
    await expect(page.getByText(/MNR-\d{2}/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/MINER \| LVL 1/i)).toBeVisible();
    await expect(page.locator('.unit-card').filter({ hasText: 'IDLE' })).toBeVisible();

    // Verify resources decreased (MINER cost: 50 CPU / 10 BW)
    const finalCpuText = await page.locator('#res-cpu').textContent();
    const finalBwText = await page.locator('#res-bw').textContent();
    const finalCpu = parseInt(finalCpuText!.replace(/,/g, ''));
    const finalBw = parseInt(finalBwText!.replace(/,/g, ''));

    expect(finalCpu).toBeLessThan(initialCpu);
    expect(finalBw).toBeLessThan(initialBw);

    // Verify log entry for fabrication
    await expect(page.getByText(/Fabricated new unit: MNR-\d{2} \(MINER\)/i)).toBeVisible();
  });

  test('Deploy Unit to Operation - DATA MINING', async ({ page }) => {
    // First, fabricate a unit to deploy
    const fabricateMinerButton = page.getByRole('button', { name: 'MINER DROID' });
    await fabricateMinerButton.click();
    await expect(page.getByText(/MNR-\d{2}/i)).toBeVisible();

    const unitCard = page.locator('.unit-card').filter({ hasText: /MNR-\d{2}/i }).first();
    const unitDesignation = await unitCard.locator('.font-bold').textContent();
    expect(unitDesignation).toMatch(/MNR-\d{2}/);

    // Select the newly fabricated unit
    await unitCard.click();
    await expect(page.getByText(`ORDERS FOR: ${unitDesignation}`)).toBeVisible();

    // Deploy to DATA MINING
    const deployDataMiningButton = page.getByRole('button', { name: 'DATA MINE' });
    await deployDataMiningButton.click();

    // Verify unit status changes to DEPLOYED
    await expect(unitCard.getByText('DEPLOYED')).toBeVisible({ timeout: 5000 });

    // Verify operation appears on the tactical map
    await expect(page.getByText(/DATA MINING OPERATION/i)).toBeVisible();
    
    // Check log for deployment
    await expect(page.getByText(`Unit ${unitDesignation} deployed to mission: 'DATA MINING OPERATION'.`)).toBeVisible();

    // Wait for operation to complete (10s for DATA_MINING, plus buffer)
    await page.waitForTimeout(12000); // Wait 12 seconds for 10s mission

    // Verify unit is IDLE again
    await expect(unitCard.getByText('IDLE')).toBeVisible();
    // Verify operation is gone from map
    await expect(page.getByText(/DATA MINING OPERATION/i)).not.toBeVisible();
    // Verify completion log
    await expect(page.getByText(/Operation 'DATA MINING OPERATION' completed by unit/i)).toBeVisible();
  });

  test('Error Handling Display - Insufficient Resources', async ({ page }) => {
    // Attempt to fabricate a GUARDIAN multiple times to deplete resources quickly
    const fabricateGuardianButton = page.getByRole('button', { name: 'GUARDIAN' });
    await expect(fabricateGuardianButton).toBeEnabled();

    // Click until it disables, or an error banner appears
    let clicks = 0;
    while (clicks < 10) { // Max 10 clicks to prevent infinite loop
        if (!await fabricateGuardianButton.isEnabled()) {
            break;
        }
        await fabricateGuardianButton.click();
        await page.waitForTimeout(500); // Small pause for state update
        clicks++;
    }

    // Expect the StatusBanner to appear with 'INSUFFICIENT RESOURCES'
    const alertBanner = page.locator('.text-aegis-alert');
    await expect(alertBanner).toBeVisible({ timeout: 6000 });
    await expect(alertBanner).toContainText(/INSUFFICIENT RESOURCES/i);

    // Acknowledge the error
    await page.getByRole('button', { name: 'ACKNOWLEDGE' }).click();
    await expect(alertBanner).not.toBeVisible();
  });

  test('Purge System Functionality (Admin Only)', async ({ page }) => {
    // Attempt purge as regular operator - should be denied
    const purgeButton = page.getByRole('button', { name: 'FACTORY RESET SYSTEM' });
    await expect(purgeButton).toBeDisabled();
    await expect(page.getByText('Admin privileges required for Factory Reset')).toBeVisible();

    // Log out current user and log in as admin
    await page.getByRole('button', { name: 'LOGOUT' }).click();
    await expect(page.url()).toContain('/login');
    await page.getByPlaceholder('OPERATOR-ID').fill('admin');
    await page.getByPlaceholder('ACCESS-KEY').fill('password');
    await page.getByRole('button', { name: 'SECURE LOGIN' }).click();
    await expect(page.getByText('SECURE UPLINK ESTABLISHED')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('OPERATOR: ADMIN')).toBeVisible();

    // Now, fabricate a unit to ensure there's data to purge
    const fabricateMinerButton = page.getByRole('button', { name: 'MINER DROID' });
    await fabricateMinerButton.click();
    await expect(page.getByText(/MNR-\d{2}/i)).toBeVisible();

    // Click the Purge Database button as admin
    await expect(purgeButton).toBeEnabled(); // Should now be enabled for admin
    await purgeButton.click();

    // Confirm the alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('INITIATE SYSTEM PURGE? ALL DATA WILL BE LOST. THIS ACTION IS IRREVERSIBLE.');
      await dialog.accept();
    });

    // Wait for the system to purge and re-initialize
    await expect(page.getByText(/SYSTEM PURGE INITIATED by ADMIN. ALL DATA WIPED./i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/NO ASSETS IN FIELD/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/NO ACTIVE OPERATIONS/i)).toBeVisible({ timeout: 5000 });

    // Verify resources reset to initial values
    const cpuValue = await page.locator('#res-cpu').textContent();
    expect(parseInt(cpuValue!.replace(/,/g, ''))).toBeGreaterThan(500); // Reset to 1000
  });

  test('Registration and Login flow', async ({ page }) => {
    // Log out existing user
    await page.getByRole('button', { name: 'LOGOUT' }).click();
    await expect(page.url()).toContain('/login');

    // Go to register page
    await page.getByRole('button', { name: 'REGISTER' }).click();
    await expect(page.url()).toContain('/register');

    // Fill registration form
    await page.getByPlaceholder('UNIQUE OPERATOR-ID').fill('new_operator');
    await page.getByPlaceholder('SECURE ACCESS-KEY').fill('TestPass123!');
    await page.getByPlaceholder('RE-ENTER ACCESS-KEY').fill('TestPass123!');
    await page.getByRole('button', { name: 'REGISTER OPERATOR' }).click();

    // Should be redirected to dashboard and authenticated
    await expect(page.getByText('SECURE UPLINK ESTABLISHED')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('OPERATOR: NEW_OPERATOR')).toBeVisible();

    // Logout and try to login with the new user
    await page.getByRole('button', { name: 'LOGOUT' }).click();
    await expect(page.url()).toContain('/login');
    await page.getByPlaceholder('OPERATOR-ID').fill('new_operator');
    await page.getByPlaceholder('ACCESS-KEY').fill('TestPass123!');
    await page.getByRole('button', { name: 'SECURE LOGIN' }).click();

    await expect(page.getByText('SECURE UPLINK ESTABLISHED')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('OPERATOR: NEW_OPERATOR')).toBeVisible();
  });
});
```