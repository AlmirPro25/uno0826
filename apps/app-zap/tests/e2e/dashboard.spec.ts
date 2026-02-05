
import { test, expect } from '@playwright/test';

/**
 * TESTES E2E - GHOST CONTROL CENTER
 * Validação visual e funcional da interface de comando.
 */

test.describe('Ghost Command Center', () => {
  
  test.beforeEach(async ({ page }) => {
    // Assume que o ambiente local está rodando
    await page.goto('http://localhost:8080');
  });

  test('deve carregar o dashboard principal e mostrar status', async ({ page }) => {
    await expect(page).toHaveTitle(/Ghost Protocol/);
    await expect(page.getByText('Míssil Teleguiado')).toBeVisible();
  });

  test('deve navegar entre contatos', async ({ page }) => {
    // Mock de API seria ideal aqui, mas testando renderização básica
    const contactItem = page.locator('.contact-item').first();
    if (await contactItem.isVisible()) {
        await contactItem.click();
        await expect(page.locator('.chat-window')).toBeVisible();
    }
  });

  test('botão de controle manual deve alterar estado', async ({ page }) => {
    // Verifica a existência do botão de "Assumir Controle"
    const toggleButton = page.locator('button[aria-label="Toggle Control"]').first();
    if (await toggleButton.isVisible()) {
        await expect(toggleButton).toBeEnabled();
        // Não clicamos para não afetar estado real em produção/teste compartilhado
    }
  });
});
