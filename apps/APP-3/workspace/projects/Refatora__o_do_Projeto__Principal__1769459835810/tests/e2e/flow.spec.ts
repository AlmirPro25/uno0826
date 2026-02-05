
import { test, expect } from '@playwright/test';

test.describe('Luxe Digital User Journey', () => {
  
  test('Complete Inquiry Flow', async ({ page }) => {
    // 1. Acessar a Home
    await page.goto('http://localhost:5173');
    
    // Validar Título e Estética
    await expect(page).toHaveTitle(/Luxe Digital/);
    await expect(page.locator('h1')).toContainText('AUTOMOTIVE EXCELLENCE');

    // 2. Escolher um Veículo (Phantom VIII)
    const viewButton = page.locator('button', { hasText: 'DETALHES' }).first();
    await viewButton.click();

    // 3. Verificar Modal/Detalhes
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Engine');

    // 4. Preencher Formulário de Concierge
    await page.fill('input[name="client_name"]', 'Alexander Sterling');
    await page.fill('input[name="contact_info"]', 'alexander@wealth.com');
    
    // 5. Enviar e Validar Sucesso
    await page.click('button[type="submit"]');
    
    // Aguardar Toast de Sucesso
    const toast = page.locator('.toast-success');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('solicitação');
  });

});
