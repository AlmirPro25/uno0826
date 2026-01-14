import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Diretório dos testes
  testDir: './e2e',
  
  // Timeout para cada teste
  timeout: 30 * 1000,
  
  // Timeout para expect
  expect: {
    timeout: 5000
  },
  
  // Executar testes em paralelo
  fullyParallel: true,
  
  // Falhar o build se deixar test.only no código
  forbidOnly: !!process.env.CI,
  
  // Retry em CI
  retries: process.env.CI ? 2 : 0,
  
  // Workers
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : [])
  ],
  
  // Configurações compartilhadas
  use: {
    // URL base
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    // Coletar trace em caso de falha
    trace: 'on-first-retry',
    
    // Screenshot em caso de falha
    screenshot: 'only-on-failure',
    
    // Vídeo em caso de falha
    video: 'on-first-retry',
    
    // Viewport padrão
    viewport: { width: 1280, height: 720 },
    
    // Ignorar erros HTTPS
    ignoreHTTPSErrors: true,
    
    // Locale
    locale: 'pt-BR',
    
    // Timezone
    timezoneId: 'America/Sao_Paulo',
  },

  // Projetos (browsers)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Servidor de desenvolvimento
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  
  // Diretório de output
  outputDir: 'test-results/',
});
