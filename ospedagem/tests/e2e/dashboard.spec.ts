
import { test, expect } from '@playwright/test';

test.describe('Dashboard de Infraestrutura Soberana', () => {
  test.beforeEach(async ({ page }) => {
    // Simulação de login ou sessão
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@sce.cloud');
    await page.fill('input[name="password"]', 'senha123');
    await page.click('button[type="submit"]');
  });

  test('deve listar projetos de infraestrutura', async ({ page }) => {
    await page.goto('/dashboard');
    const header = page.locator('h1');
    await expect(header).toContainText('Sovereign Control');
    
    // Verificar se o grid de apps está presente
    const projectGrid = page.locator('[data-aid="project-grid"]');
    await expect(projectGrid).toBeVisible();
  });

  test('deve abrir modal de criação de novo app', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('[data-aid="new-project-btn"]');
    
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Novo Aplicativo');
  });
});
