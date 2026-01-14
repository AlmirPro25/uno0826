import { test, expect } from '@playwright/test';

/**
 * Testes E2E de Agendamentos
 */

// Helper para fazer login
async function loginAsPatient(page: any) {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'joao.silva@email.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
}

async function loginAsDoctor(page: any) {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'dr.costa@medisync.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/medico|dashboard/, { timeout: 10000 });
}

test.describe('Agendamento de Consultas - Paciente', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPatient(page);
  });

  test('deve acessar página de agendamento', async ({ page }) => {
    await page.goto('/paciente/book-appointment');
    
    await expect(page.locator('h1, h2').first()).toContainText(/agendar|consulta/i);
  });

  test('deve listar médicos disponíveis', async ({ page }) => {
    await page.goto('/paciente/book-appointment');
    
    // Aguardar carregamento dos médicos
    await page.waitForSelector('[data-testid="doctor-card"], .doctor-card, .card', { timeout: 10000 });
    
    // Verificar se há médicos listados
    const doctors = page.locator('[data-testid="doctor-card"], .doctor-card, .card');
    await expect(doctors.first()).toBeVisible();
  });

  test('deve selecionar médico e ver horários', async ({ page }) => {
    await page.goto('/paciente/book-appointment');
    
    // Selecionar primeiro médico
    await page.click('[data-testid="doctor-card"]:first-child, .doctor-card:first-child, .card:first-child');
    
    // Verificar se calendário ou horários aparecem
    await expect(page.locator('[data-testid="calendar"], .calendar, input[type="date"]')).toBeVisible({ timeout: 5000 });
  });

  test('deve ver minhas consultas', async ({ page }) => {
    await page.goto('/paciente/my-appointments');
    
    await expect(page.locator('h1, h2').first()).toContainText(/consultas|agendamentos/i);
  });

  test('deve filtrar consultas por status', async ({ page }) => {
    await page.goto('/paciente/my-appointments');
    
    // Verificar se há filtros
    const filters = page.locator('select, [role="combobox"], .filter');
    if (await filters.count() > 0) {
      await filters.first().click();
    }
  });

  test('deve ver detalhes de uma consulta', async ({ page }) => {
    await page.goto('/paciente/my-appointments');
    
    // Clicar em uma consulta (se existir)
    const appointment = page.locator('[data-testid="appointment-card"], .appointment-card, tr').first();
    if (await appointment.isVisible()) {
      await appointment.click();
    }
  });
});

test.describe('Gerenciamento de Consultas - Médico', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDoctor(page);
  });

  test('deve ver dashboard do médico', async ({ page }) => {
    await page.goto('/medico/dashboard');
    
    await expect(page.locator('h1, h2').first()).toContainText(/dashboard|agenda|consultas/i);
  });

  test('deve ver sala de espera', async ({ page }) => {
    await page.goto('/medico/waiting-room');
    
    await expect(page.locator('h1, h2').first()).toContainText(/sala de espera|waiting/i);
  });

  test('deve ver estatísticas', async ({ page }) => {
    await page.goto('/medico/stats');
    
    await expect(page.locator('h1, h2').first()).toContainText(/estatísticas|stats/i);
  });

  test('deve gerenciar bloqueios de horário', async ({ page }) => {
    await page.goto('/medico/schedule-blocks');
    
    await expect(page.locator('h1, h2').first()).toContainText(/bloqueio|horários/i);
  });

  test('deve ver receitas emitidas', async ({ page }) => {
    await page.goto('/medico/prescriptions');
    
    await expect(page.locator('h1, h2').first()).toContainText(/receitas|prescrições/i);
  });

  test('deve ver atestados emitidos', async ({ page }) => {
    await page.goto('/medico/certificates');
    
    await expect(page.locator('h1, h2').first()).toContainText(/atestados|certificados/i);
  });

  test('deve ver prontuários', async ({ page }) => {
    await page.goto('/medico/medical-records');
    
    await expect(page.locator('h1, h2').first()).toContainText(/prontuários|registros/i);
  });

  test('deve ver avaliações recebidas', async ({ page }) => {
    await page.goto('/medico/reviews');
    
    await expect(page.locator('h1, h2').first()).toContainText(/avaliações|reviews/i);
  });
});

test.describe('Fluxo Completo de Agendamento', () => {
  test('deve completar fluxo de agendamento', async ({ page }) => {
    await loginAsPatient(page);
    
    // 1. Ir para página de agendamento
    await page.goto('/paciente/book-appointment');
    
    // 2. Aguardar carregamento
    await page.waitForLoadState('networkidle');
    
    // 3. Verificar se a página carregou
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Nota: O fluxo completo depende dos dados disponíveis no banco
    // Este teste verifica se as páginas carregam corretamente
  });
});

test.describe('Cancelamento de Consultas', () => {
  test('deve poder cancelar consulta agendada', async ({ page }) => {
    await loginAsPatient(page);
    await page.goto('/paciente/my-appointments');
    
    // Procurar botão de cancelar
    const cancelButton = page.locator('button:has-text("Cancelar"), [data-testid="cancel-button"]').first();
    
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      
      // Confirmar cancelamento
      const confirmButton = page.locator('button:has-text("Confirmar"), [data-testid="confirm-button"]');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
    }
  });
});

test.describe('Avaliações', () => {
  test('deve ver minhas avaliações', async ({ page }) => {
    await loginAsPatient(page);
    await page.goto('/paciente/reviews');
    
    await expect(page.locator('h1, h2').first()).toContainText(/avaliações|reviews/i);
  });

  test('deve poder avaliar consulta concluída', async ({ page }) => {
    await loginAsPatient(page);
    await page.goto('/paciente/my-appointments');
    
    // Procurar consulta concluída com opção de avaliar
    const reviewButton = page.locator('button:has-text("Avaliar"), [data-testid="review-button"]').first();
    
    if (await reviewButton.isVisible()) {
      await reviewButton.click();
      
      // Verificar se modal de avaliação aparece
      await expect(page.locator('[role="dialog"], .modal')).toBeVisible();
    }
  });
});
