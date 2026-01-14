import { test, expect } from '@playwright/test';

/**
 * Testes E2E de Autenticação
 */

test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve exibir página de login', async ({ page }) => {
    await page.goto('/auth/login');
    
    await expect(page.locator('h1, h2').first()).toContainText(/login|entrar/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[type="email"]', 'usuario@invalido.com');
    await page.fill('input[type="password"]', 'senhaerrada');
    await page.click('button[type="submit"]');
    
    // Aguardar mensagem de erro
    await expect(page.locator('[role="alert"], .toast, .error')).toBeVisible({ timeout: 5000 });
  });

  test('deve fazer login com sucesso como paciente', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[type="email"]', 'joao.silva@email.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento para dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('deve fazer login com sucesso como médico', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[type="email"]', 'dr.costa@medisync.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await expect(page).toHaveURL(/medico|dashboard/, { timeout: 10000 });
  });

  test('deve fazer login com sucesso como admin', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[type="email"]', 'admin@medisync.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await expect(page).toHaveURL(/admin|dashboard/, { timeout: 10000 });
  });

  test('deve exibir página de registro', async ({ page }) => {
    await page.goto('/auth/register');
    
    await expect(page.locator('input[name="name"], input[placeholder*="nome" i]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('deve validar campos obrigatórios no registro', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Tentar submeter sem preencher
    await page.click('button[type="submit"]');
    
    // Verificar validação
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('deve fazer logout', async ({ page }) => {
    // Primeiro fazer login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'joao.silva@email.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    
    // Fazer logout
    await page.click('[data-testid="user-menu"], button:has-text("Sair"), [aria-label="Menu do usuário"]');
    await page.click('text=Sair');
    
    // Verificar redirecionamento para login
    await expect(page).toHaveURL(/login|\/$/);
  });

  test('deve acessar página de recuperação de senha', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.click('text=Esqueci minha senha');
    
    await expect(page).toHaveURL(/forgot-password/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('deve solicitar recuperação de senha', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    await page.fill('input[type="email"]', 'joao.silva@email.com');
    await page.click('button[type="submit"]');
    
    // Aguardar mensagem de sucesso
    await expect(page.locator('text=/enviado|sucesso|email/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Proteção de Rotas', () => {
  test('deve redirecionar para login ao acessar rota protegida', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Deve redirecionar para login
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });

  test('deve redirecionar para login ao acessar área de paciente', async ({ page }) => {
    await page.goto('/paciente/my-appointments');
    
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });

  test('deve redirecionar para login ao acessar área de médico', async ({ page }) => {
    await page.goto('/medico/dashboard');
    
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });

  test('deve redirecionar para login ao acessar área de admin', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});
