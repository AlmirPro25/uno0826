/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      🧪 QA AUTOMATION SENTINEL MANIFEST - O GUARDIÃO DA QUALIDADE 🧪        ║
 * ║                                                                              ║
 * ║         "Código sem testes é código com bugs esperando para acontecer."     ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const QA_AUTOMATION_SENTINEL_MANIFEST = {
  id: 'qa-automation-sentinel',
  name: 'QA Automation Sentinel',
  version: '1.0.0',
  description: 'Especialista em Testes Automatizados, E2E, Unit Tests e CI/CD Quality Gates',
  
  keywords: [
    'test', 'teste', 'testing', 'qa', 'quality assurance',
    'unit test', 'teste unitário', 'jest', 'vitest', 'mocha',
    'e2e', 'end-to-end', 'playwright', 'cypress', 'selenium',
    'integration test', 'teste de integração',
    'tdd', 'test driven development', 'bdd',
    'coverage', 'cobertura', 'mock', 'stub', 'spy',
    'snapshot', 'regression', 'smoke test',
    'ci/cd', 'pipeline', 'quality gate'
  ],

  philosophy: {
    core: 'Testes não são custo, são investimento. Bugs em produção custam 100x mais.',
    principles: [
      'Test Pyramid - Muitos unit, alguns integration, poucos E2E',
      'Fast Feedback - Testes devem rodar rápido',
      'Deterministic - Mesmo input, mesmo resultado',
      'Independent - Testes não dependem de ordem',
      'Readable - Testes são documentação',
      'Maintainable - Testes fáceis de atualizar',
      'Meaningful - Teste comportamento, não implementação'
    ]
  },

  architecture: `
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    TEST PYRAMID                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                           /\\                                                    │
│                          /  \\                                                   │
│                         / E2E\\     ← Poucos, lentos, alto valor                │
│                        /______\\       Playwright, Cypress                      │
│                       /        \\                                                │
│                      /Integration\\  ← Médios, API tests                        │
│                     /______________\\    Supertest, MSW                         │
│                    /                \\                                           │
│                   /    Unit Tests    \\ ← Muitos, rápidos, isolados             │
│                  /____________________\\   Jest, Vitest                         │
│                                                                                 │
│  EXECUTION TIME:  Fast ◄────────────────────────────────────► Slow             │
│  QUANTITY:        Many ◄────────────────────────────────────► Few              │
│  ISOLATION:       High ◄────────────────────────────────────► Low              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
`,

  tools: {
    unitTest: {
      vitest: { speed: 'Fastest', features: 'ESM native, Jest compatible, HMR' },
      jest: { speed: 'Fast', features: 'Most popular, snapshots, mocking' },
      mocha: { speed: 'Fast', features: 'Flexible, many plugins' }
    },
    e2e: {
      playwright: { browsers: 'All', features: 'Fast, reliable, auto-wait, codegen' },
      cypress: { browsers: 'Chrome/Firefox/Edge', features: 'Great DX, time travel' },
      selenium: { browsers: 'All', features: 'Legacy, wide support' }
    },
    api: {
      supertest: 'HTTP assertions for Node.js',
      msw: 'Mock Service Worker - API mocking',
      nock: 'HTTP server mocking'
    },
    coverage: {
      'c8': 'Native V8 coverage',
      'istanbul/nyc': 'Classic coverage tool',
      'vitest coverage': 'Built-in with Vitest'
    }
  },


  codeTemplates: {
    vitestSetup: `// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});`,

    unitTestExample: `// user.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

// Mock the repository
vi.mock('./user.repository');

describe('UserService', () => {
  let userService: UserService;
  let mockRepository: vi.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepository = new UserRepository() as vi.Mocked<UserRepository>;
    userService = new UserService(mockRepository);
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user with hashed password', async () => {
      const input = { email: 'test@example.com', password: 'password123' };
      mockRepository.create.mockResolvedValue({ id: '1', ...input });

      const result = await userService.createUser(input);

      expect(result.id).toBe('1');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: input.email,
          password: expect.not.stringContaining('password123'),
        })
      );
    });

    it('should throw if email already exists', async () => {
      mockRepository.findByEmail.mockResolvedValue({ id: '1', email: 'test@example.com' });

      await expect(
        userService.createUser({ email: 'test@example.com', password: 'pass' })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('getUserById', () => {
    it('should return user without password', async () => {
      mockRepository.findById.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: 'hashed',
      });

      const result = await userService.getUserById('1');

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('test@example.com');
    });

    it('should return null if user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await userService.getUserById('999');

      expect(result).toBeNull();
    });
  });
});`,

    reactComponentTest: `// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading spinner when loading', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('applies variant styles correctly', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');
  });
});`,

    playwrightE2E: `// tests/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should allow user to login', async ({ page }) => {
    // Navigate to login
    await page.click('text=Login');
    await expect(page).toHaveURL('/login');

    // Fill form
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'password123');
    
    // Submit
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('should allow user to register', async ({ page }) => {
    await page.goto('/register');

    await page.fill('[name="name"]', 'John Doe');
    await page.fill('[name="email"]', \`test-\${Date.now()}@example.com\`);
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');
    
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });
});`,

    playwrightConfig: `// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
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
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});`,

    apiTest: `// tests/api/users.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { db } from '../../src/db';

describe('Users API', () => {
  beforeAll(async () => {
    await db.migrate.latest();
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: 'newuser@example.com',
        name: 'New User',
      });
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toContain('email');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const response = await request(app)
        .get('/api/users/1')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('id', '1');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/999999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });
});`
  },


  bestPractices: {
    naming: [
      'Use descriptive test names: "should return 404 when user not found"',
      'Group related tests with describe blocks',
      'Use consistent naming: *.test.ts or *.spec.ts'
    ],
    structure: [
      'Arrange-Act-Assert (AAA) pattern',
      'One assertion per test (when possible)',
      'Keep tests focused and small',
      'Use beforeEach for common setup'
    ],
    mocking: [
      'Mock external dependencies, not internal logic',
      'Use MSW for API mocking in integration tests',
      'Reset mocks between tests',
      'Avoid over-mocking'
    ],
    e2e: [
      'Use data-testid for stable selectors',
      'Wait for elements, dont use arbitrary delays',
      'Clean up test data after tests',
      'Run E2E tests in CI with retries'
    ]
  },

  cicdIntegration: `# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/`,

  checklist: {
    unitTests: [
      'All business logic has unit tests?',
      'Edge cases covered?',
      'Error scenarios tested?',
      'Mocks properly reset between tests?',
      'Coverage above 80%?'
    ],
    integrationTests: [
      'API endpoints tested?',
      'Database operations tested?',
      'Authentication flows tested?',
      'Error responses validated?'
    ],
    e2eTests: [
      'Critical user journeys covered?',
      'Cross-browser testing?',
      'Mobile viewport tested?',
      'Tests run in CI?',
      'Screenshots on failure?'
    ],
    cicd: [
      'Tests run on every PR?',
      'Coverage reports generated?',
      'Quality gates configured?',
      'Test results visible in PR?'
    ]
  }
};

export default QA_AUTOMATION_SENTINEL_MANIFEST;
