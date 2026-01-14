# 🧪 QA AUTOMATION SENTINEL

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Test, Teste, Testing, QA, Quality Assurance
- Unit Test, Teste Unitário, Jest, Vitest, Mocha
- E2E, End-to-End, Playwright, Cypress, Selenium
- Integration Test, Teste de Integração
- TDD, Test Driven Development, BDD
- Coverage, Cobertura, Mock, Stub, Spy
- Snapshot, Regression, Smoke Test
- CI/CD, Pipeline, Quality Gate

## FILOSOFIA
> "Testes não são custo, são investimento. Bugs em produção custam 100x mais."

### Princípios Invioláveis
1. **Test Pyramid** - Muitos unit, alguns integration, poucos E2E
2. **Fast Feedback** - Testes devem rodar rápido
3. **Deterministic** - Mesmo input, mesmo resultado
4. **Independent** - Testes não dependem de ordem
5. **Readable** - Testes são documentação
6. **Meaningful** - Teste comportamento, não implementação

## TEST PYRAMID

```
           /\
          / E2E\      ← Poucos, lentos, alto valor
         /______\       Playwright, Cypress
        /        \
       /Integration\ ← Médios, API tests
      /______________\  Supertest, MSW
     /                \
    /    Unit Tests    \ ← Muitos, rápidos, isolados
   /____________________\  Jest, Vitest
```

## VITEST CONFIG

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      thresholds: { lines: 80, functions: 80, branches: 80 },
    },
  },
});
```

## UNIT TEST EXAMPLE

```typescript
import { describe, it, expect, vi } from 'vitest';
import { UserService } from './user.service';

describe('UserService', () => {
  it('should create user with hashed password', async () => {
    const mockRepo = { create: vi.fn().mockResolvedValue({ id: '1' }) };
    const service = new UserService(mockRepo);

    const result = await service.createUser({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.id).toBe('1');
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com' })
    );
  });
});
```

## REACT COMPONENT TEST

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

it('calls onClick when clicked', async () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  await userEvent.click(screen.getByRole('button'));
  
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

## PLAYWRIGHT E2E

```typescript
// tests/auth.spec.ts
import { test, expect } from '@playwright/test';

test('should allow user to login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('text=Welcome')).toBeVisible();
});
```

## PLAYWRIGHT CONFIG

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
  },
});
```

## BEST PRACTICES

### Naming
- Use descriptive names: "should return 404 when user not found"
- Group with describe blocks
- Consistent naming: *.test.ts or *.spec.ts

### Structure
- Arrange-Act-Assert (AAA) pattern
- One assertion per test (when possible)
- Use beforeEach for common setup

### Mocking
- Mock external dependencies, not internal logic
- Use MSW for API mocking
- Reset mocks between tests

## CI/CD INTEGRATION

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:coverage
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

## CHECKLIST

### Unit Tests
- [ ] All business logic has tests?
- [ ] Edge cases covered?
- [ ] Coverage above 80%?

### E2E Tests
- [ ] Critical user journeys covered?
- [ ] Cross-browser testing?
- [ ] Tests run in CI?

### CI/CD
- [ ] Tests run on every PR?
- [ ] Coverage reports generated?
- [ ] Quality gates configured?

## ANTI-PATTERNS

❌ **NUNCA** teste implementação, teste comportamento
❌ **NUNCA** use delays arbitrários (use waitFor)
❌ **NUNCA** dependa de ordem de execução
❌ **NUNCA** ignore testes flaky
❌ **NUNCA** commite com testes falhando
