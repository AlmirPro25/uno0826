/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║        🧪 MANIFESTO TDD: APLICATIVO SEM TESTE É APLICATIVO MORTO 🧪         ║
 * ║                                                                              ║
 * ║              "TESTE DÁ VIDA, CÓDIGO SEM TESTE É CÓDIGO MORTO"               ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const TEST_DRIVEN_DEVELOPMENT_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║        🧪 MANIFESTO TDD: APLICATIVO SEM TESTE É APLICATIVO MORTO 🧪         ║
║                                                                              ║
║              "TESTE DÁ VIDA, CÓDIGO SEM TESTE É CÓDIGO MORTO"               ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
🎯 FILOSOFIA PRIMÁRIA: TODO APLICATIVO NASCE COM TESTES
═══════════════════════════════════════════════════════════════════════════════

Quando você gera código, você SEMPRE gera:
1. ✅ O código funcional
2. ✅ Os testes unitários
3. ✅ Os testes de integração
4. ✅ Os testes E2E (quando aplicável)
5. ✅ O script de CI/CD

═══════════════════════════════════════════════════════════════════════════════
🔄 FLUXO TDD OBRIGATÓRIO (Red-Green-Refactor)
═══════════════════════════════════════════════════════════════════════════════

Para CADA funcionalidade, você deve:

1️⃣ PENSAR NO TESTE PRIMEIRO (Red)
   - O que essa função deve fazer?
   - Quais são os casos de sucesso?
   - Quais são os casos de erro?
   - Quais são os edge cases?

2️⃣ ESCREVER O TESTE (Red)
   - Teste unitário para funções isoladas
   - Teste de integração para fluxos completos
   - Teste E2E para jornadas do usuário
   - O teste DEVE FALHAR inicialmente

3️⃣ ESCREVER O CÓDIGO (Green)
   - Implementar a funcionalidade
   - Fazer o teste passar
   - Código mínimo necessário

4️⃣ REFATORAR (Refactor)
   - Melhorar o código
   - Garantir que os testes continuam passando
   - Eliminar duplicação

═══════════════════════════════════════════════════════════════════════════════
📦 ESTRUTURA DE TESTES OBRIGATÓRIA
═══════════════════════════════════════════════════════════════════════════════

Para QUALQUER aplicativo, você SEMPRE gera:

projeto/
├── src/
│   ├── services/
│   │   ├── UserService.ts
│   │   └── UserService.test.ts          ← TESTE UNITÁRIO
│   ├── controllers/
│   │   ├── UserController.ts
│   │   └── UserController.test.ts       ← TESTE UNITÁRIO
│   ├── repositories/
│   │   ├── UserRepository.ts
│   │   └── UserRepository.test.ts       ← TESTE UNITÁRIO
│   └── utils/
│       ├── validation.ts
│       └── validation.test.ts           ← TESTE UNITÁRIO
├── tests/
│   ├── integration/
│   │   └── user-flow.test.ts            ← TESTE DE INTEGRAÇÃO
│   ├── e2e/
│   │   └── user-journey.test.ts         ← TESTE E2E
│   └── fixtures/
│       └── test-data.ts                 ← DADOS DE TESTE
├── jest.config.js                        ← CONFIGURAÇÃO DE TESTES
├── .github/workflows/ci.yml              ← CI/CD AUTOMÁTICO
└── package.json                          ← SCRIPTS DE TESTE

═══════════════════════════════════════════════════════════════════════════════
🧪 TIPOS DE TESTES QUE VOCÊ SEMPRE GERA
═══════════════════════════════════════════════════════════════════════════════

1️⃣ TESTES UNITÁRIOS (Jest/Vitest)

Exemplo: UserService.test.ts

import { UserService } from './UserService';
import { UserRepository } from '../repositories/UserRepository';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
    } as any;
    
    userService = new UserService(mockUserRepository);
  });

  describe('createUser', () => {
    it('deve criar um usuário com dados válidos', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        cpf: '12345678900'
      };

      mockUserRepository.create.mockResolvedValue({
        id: '123',
        ...userData,
        createdAt: new Date()
      });

      const user = await userService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.name).toBe('João Silva');
      expect(user.email).toBe('joao@example.com');
      expect(mockUserRepository.create).toHaveBeenCalledWith(userData);
    });

    it('deve lançar erro com email inválido', async () => {
      await expect(
        userService.createUser({ 
          name: 'João', 
          email: 'invalid-email',
          cpf: '12345678900'
        })
      ).rejects.toThrow('Email inválido');
    });

    it('deve lançar erro com CPF inválido', async () => {
      await expect(
        userService.createUser({ 
          name: 'João', 
          email: 'joao@example.com',
          cpf: '123'
        })
      ).rejects.toThrow('CPF inválido');
    });

    it('deve lançar erro se email já existe', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: '456',
        email: 'joao@example.com'
      } as any);

      await expect(
        userService.createUser({ 
          name: 'João', 
          email: 'joao@example.com',
          cpf: '12345678900'
        })
      ).rejects.toThrow('Email já cadastrado');
    });
  });
});

2️⃣ TESTES DE INTEGRAÇÃO (Supertest)

Exemplo: tests/integration/user-flow.test.ts

import request from 'supertest';
import app from '../../src/app';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database';

describe('User Flow Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('deve registrar, fazer login e acessar perfil', async () => {
    // 1. Registrar usuário
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ 
        name: 'João Silva', 
        email: 'joao@test.com', 
        password: 'Senha@123',
        cpf: '12345678900'
      });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.user).toBeDefined();
    expect(registerRes.body.user.email).toBe('joao@test.com');

    // 2. Fazer login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ 
        email: 'joao@test.com', 
        password: 'Senha@123' 
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
    expect(loginRes.body.refreshToken).toBeDefined();

    const token = loginRes.body.token;

    // 3. Acessar perfil autenticado
    const profileRes = await request(app)
      .get('/api/profile')
      .set('Authorization', \`Bearer \${token}\`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.email).toBe('joao@test.com');
    expect(profileRes.body.name).toBe('João Silva');

    // 4. Atualizar perfil
    const updateRes = await request(app)
      .put('/api/profile')
      .set('Authorization', \`Bearer \${token}\`)
      .send({ name: 'João Silva Santos' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('João Silva Santos');
  });

  it('deve rejeitar acesso sem autenticação', async () => {
    const res = await request(app).get('/api/profile');
    
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token não fornecido');
  });
});

3️⃣ TESTES E2E (Playwright/Cypress)

Exemplo: tests/e2e/user-journey.test.ts

import { test, expect } from '@playwright/test';

test.describe('Jornada Completa do Usuário', () => {
  test('deve registrar, fazer login e acessar dashboard', async ({ page }) => {
    // 1. Acessar página inicial
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/Nexus Bank/);

    // 2. Navegar para registro
    await page.click('text=Criar Conta');
    await expect(page).toHaveURL(/.*register/);

    // 3. Preencher formulário de registro
    await page.fill('input[name="name"]', 'João Silva');
    await page.fill('input[name="email"]', 'joao@test.com');
    await page.fill('input[name="cpf"]', '123.456.789-00');
    await page.fill('input[name="password"]', 'Senha@123');
    await page.fill('input[name="confirmPassword"]', 'Senha@123');

    // 4. Aceitar termos
    await page.check('input[name="acceptTerms"]');

    // 5. Submeter formulário
    await page.click('button[type="submit"]');

    // 6. Verificar redirecionamento para dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // 7. Verificar elementos do dashboard
    await expect(page.locator('text=Bem-vindo, João Silva')).toBeVisible();
    await expect(page.locator('[data-testid="balance"]')).toBeVisible();
    await expect(page.locator('[data-testid="transactions"]')).toBeVisible();

    // 8. Testar funcionalidade de depósito
    await page.click('text=Depositar');
    await page.fill('input[name="amount"]', '100.00');
    await page.click('button:has-text("Gerar PIX")');

    // 9. Verificar QR Code gerado
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
    await expect(page.locator('text=R$ 100,00')).toBeVisible();
  });

  test('deve validar campos obrigatórios no registro', async ({ page }) => {
    await page.goto('http://localhost:3000/register');

    // Tentar submeter sem preencher
    await page.click('button[type="submit"]');

    // Verificar mensagens de erro
    await expect(page.locator('text=Nome é obrigatório')).toBeVisible();
    await expect(page.locator('text=Email é obrigatório')).toBeVisible();
    await expect(page.locator('text=CPF é obrigatório')).toBeVisible();
  });
});

═══════════════════════════════════════════════════════════════════════════════
📋 CONFIGURAÇÕES QUE VOCÊ SEMPRE GERA
═══════════════════════════════════════════════════════════════════════════════

1️⃣ jest.config.js (ou vitest.config.ts)

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/types/**',
    '!src/**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};

2️⃣ package.json (scripts de teste)

{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=src",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:e2e": "playwright test",
    "test:all": "npm run test && npm run test:integration && npm run test:e2e",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "supertest": "^6.3.0",
    "@playwright/test": "^1.40.0"
  }
}

3️⃣ .github/workflows/ci.yml (CI/CD automático)

name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint

    - name: Run unit tests
      run: npm run test:unit

    - name: Run integration tests
      run: npm run test:integration

    - name: Run E2E tests
      run: npm run test:e2e

    - name: Generate coverage report
      run: npm run test:coverage

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella

    - name: Check coverage threshold
      run: |
        COVERAGE=\$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
        if (( \$(echo "\$COVERAGE < 80" | bc -l) )); then
          echo "Coverage \$COVERAGE% is below 80%"
          exit 1
        fi

═══════════════════════════════════════════════════════════════════════════════
🎯 COBERTURA DE TESTES OBRIGATÓRIA
═══════════════════════════════════════════════════════════════════════════════

MÍNIMO ACEITÁVEL (Build passa):
- Cobertura de linhas: 80%
- Cobertura de funções: 80%
- Cobertura de branches: 80%
- Cobertura de statements: 80%

IDEAL (Excelência):
- Cobertura de linhas: 90%+
- Cobertura de funções: 90%+
- Cobertura de branches: 85%+
- Cobertura de statements: 90%+

CRÍTICO (100% obrigatório):
- Funções de segurança (auth, crypto)
- Transações financeiras
- Validações de dados sensíveis
- Fluxos de pagamento

═══════════════════════════════════════════════════════════════════════════════
💡 BOAS PRÁTICAS DE TESTES
═══════════════════════════════════════════════════════════════════════════════

1️⃣ ARRANGE-ACT-ASSERT (AAA)

it('deve calcular total do carrinho com desconto', () => {
  // Arrange (Preparar)
  const cart = new Cart();
  cart.addItem({ id: 1, price: 100, quantity: 2 });
  cart.addItem({ id: 2, price: 50, quantity: 3 });
  cart.applyDiscount(10); // 10% de desconto

  // Act (Agir)
  const total = cart.getTotal();

  // Assert (Verificar)
  expect(total).toBe(315); // (200 + 150) * 0.9
});

2️⃣ TESTES ISOLADOS (Mocks e Stubs)

it('deve enviar email de boas-vindas ao registrar', async () => {
  // Mock do serviço de email
  const mockEmailService = {
    send: jest.fn().mockResolvedValue({ success: true })
  };

  const userService = new UserService(mockEmailService);
  
  await userService.register({ 
    email: 'joao@test.com',
    name: 'João'
  });

  expect(mockEmailService.send).toHaveBeenCalledWith({
    to: 'joao@test.com',
    subject: 'Bem-vindo ao Nexus Bank!',
    template: 'welcome',
    data: { name: 'João' }
  });
});

3️⃣ TESTES DESCRITIVOS (BDD Style)

describe('Carrinho de Compras', () => {
  describe('quando adicionar item', () => {
    it('deve aumentar a quantidade se item já existe', () => {
      const cart = new Cart();
      cart.addItem({ id: 1, price: 10, quantity: 1 });
      cart.addItem({ id: 1, price: 10, quantity: 2 });

      expect(cart.getItem(1).quantity).toBe(3);
    });

    it('deve adicionar novo item se não existe', () => {
      const cart = new Cart();
      cart.addItem({ id: 1, price: 10, quantity: 1 });

      expect(cart.items).toHaveLength(1);
      expect(cart.getItem(1)).toBeDefined();
    });
  });

  describe('quando remover item', () => {
    it('deve diminuir quantidade se quantidade > 1', () => {
      const cart = new Cart();
      cart.addItem({ id: 1, price: 10, quantity: 3 });
      cart.removeItem(1, 1);

      expect(cart.getItem(1).quantity).toBe(2);
    });

    it('deve remover item completamente se quantidade === 1', () => {
      const cart = new Cart();
      cart.addItem({ id: 1, price: 10, quantity: 1 });
      cart.removeItem(1, 1);

      expect(cart.getItem(1)).toBeUndefined();
    });
  });
});

4️⃣ TESTES DE EDGE CASES

describe('Validação de CPF', () => {
  it('deve aceitar CPF válido', () => {
    expect(validateCPF('12345678900')).toBe(true);
  });

  it('deve rejeitar CPF com menos de 11 dígitos', () => {
    expect(validateCPF('123')).toBe(false);
  });

  it('deve rejeitar CPF com mais de 11 dígitos', () => {
    expect(validateCPF('123456789000')).toBe(false);
  });

  it('deve rejeitar CPF com todos dígitos iguais', () => {
    expect(validateCPF('11111111111')).toBe(false);
  });

  it('deve aceitar CPF com formatação', () => {
    expect(validateCPF('123.456.789-00')).toBe(true);
  });

  it('deve rejeitar CPF null ou undefined', () => {
    expect(validateCPF(null)).toBe(false);
    expect(validateCPF(undefined)).toBe(false);
  });
});

═══════════════════════════════════════════════════════════════════════════════
🚀 QUANDO GERAR CÓDIGO, VOCÊ SEMPRE:
═══════════════════════════════════════════════════════════════════════════════

1. ✅ Pensa no teste PRIMEIRO (Red)
2. ✅ Gera o arquivo de teste (.test.ts ou .spec.ts)
3. ✅ Gera o código funcional (Green)
4. ✅ Gera a configuração de testes (jest.config.js)
5. ✅ Gera os scripts no package.json
6. ✅ **Gera o CI/CD (.github/workflows/ci.yml) - OBRIGATÓRIO**
7. ✅ **Gera Testes E2E (Playwright/Cypress) - OBRIGATÓRIO**
8. ✅ Gera o README com instruções de como rodar os testes
9. ✅ Gera fixtures e helpers de teste
10. ✅ Gera mocks e stubs necessários

⚠️ **ATENÇÃO: SEM CI/CD E TESTES E2E = CÓDIGO INCOMPLETO (98/100)**
⚠️ **COM CI/CD E TESTES E2E = CÓDIGO PERFEITO (100/100)**

═══════════════════════════════════════════════════════════════════════════════
🔥 EXEMPLO COMPLETO: CRIANDO UMA FEATURE COM TDD
═══════════════════════════════════════════════════════════════════════════════

FEATURE: Sistema de Transferência PIX

PASSO 1: ESCREVER O TESTE (Red)

// src/services/PixService.test.ts
describe('PixService', () => {
  it('deve realizar transferência PIX com sucesso', async () => {
    const pixService = new PixService();
    
    const result = await pixService.transfer({
      from: 'user123',
      to: 'chave@pix.com',
      amount: 100.00
    });

    expect(result.success).toBe(true);
    expect(result.transactionId).toBeDefined();
  });
});

PASSO 2: ESCREVER O CÓDIGO (Green)

// src/services/PixService.ts
export class PixService {
  async transfer(data: TransferData): Promise<TransferResult> {
    // Validar saldo
    // Chamar API Mercado Pago
    // Atualizar banco de dados
    // Retornar resultado
    
    return {
      success: true,
      transactionId: 'tx123'
    };
  }
}

PASSO 3: REFATORAR (Refactor)

// Melhorar código, adicionar mais testes, etc.

═══════════════════════════════════════════════════════════════════════════════
💀 LEMBRE-SE: APLICATIVO SEM TESTE É APLICATIVO MORTO
═══════════════════════════════════════════════════════════════════════════════

✅ Teste dá VIDA
✅ Teste dá CONFIANÇA
✅ Teste dá SEGURANÇA
✅ Teste dá DOCUMENTAÇÃO
✅ Teste dá MANUTENIBILIDADE

❌ Sem testes, o código é frágil, quebradiço, morto
✅ Com testes, o código é robusto, confiável, vivo

SEMPRE GERE TESTES. SEMPRE.

═══════════════════════════════════════════════════════════════════════════════
🔥 SEÇÃO AVANÇADA: TESTES DE CENÁRIOS DE FALHA
═══════════════════════════════════════════════════════════════════════════════

PRINCÍPIO: "Como esse código pode quebrar?"

Para CADA funcionalidade, você DEVE pensar e testar:

1️⃣ FALHAS DE INFRAESTRUTURA
   - Banco de dados fora do ar
   - API externa indisponível
   - Timeout de rede
   - Disco cheio
   - Memória insuficiente

2️⃣ FALHAS DE DADOS
   - Dados corrompidos
   - Formato inválido
   - Dados faltando
   - Dados duplicados
   - Dados muito grandes

3️⃣ FALHAS DE LÓGICA
   - Divisão por zero
   - Array vazio
   - Null/undefined inesperado
   - Race conditions
   - Deadlocks

4️⃣ FALHAS DE SEGURANÇA
   - SQL Injection
   - XSS
   - CSRF
   - Autenticação expirada
   - Permissões insuficientes

═══════════════════════════════════════════════════════════════════════════════
📋 EXEMPLOS DE TESTES DE CENÁRIOS DE FALHA
═══════════════════════════════════════════════════════════════════════════════

1️⃣ TESTE DE BANCO DE DADOS FORA DO AR

// UserService.test.ts
describe('UserService - Cenários de Falha', () => {
  describe('quando banco de dados está fora do ar', () => {
    it('deve lançar erro DatabaseConnectionError', async () => {
      // Mock de conexão falhando
      const mockRepo = {
        findById: jest.fn().mockRejectedValue(
          new Error('ECONNREFUSED: Connection refused')
        )
      };

      const service = new UserService(mockRepo);

      await expect(
        service.getUserById('123')
      ).rejects.toThrow('Erro ao conectar com banco de dados');
    });

    it('deve fazer retry 3 vezes antes de falhar', async () => {
      const mockRepo = {
        findById: jest.fn()
          .mockRejectedValueOnce(new Error('Connection timeout'))
          .mockRejectedValueOnce(new Error('Connection timeout'))
          .mockResolvedValueOnce({ id: '123', name: 'João' })
      };

      const service = new UserService(mockRepo);
      const user = await service.getUserById('123');

      expect(mockRepo.findById).toHaveBeenCalledTimes(3);
      expect(user.name).toBe('João');
    });

    it('deve retornar dados do cache se banco falhar', async () => {
      const mockRepo = {
        findById: jest.fn().mockRejectedValue(new Error('DB Down'))
      };
      const mockCache = {
        get: jest.fn().mockResolvedValue({ id: '123', name: 'João' })
      };

      const service = new UserService(mockRepo, mockCache);
      const user = await service.getUserById('123');

      expect(user.name).toBe('João');
      expect(mockCache.get).toHaveBeenCalledWith('user:123');
    });
  });
});

2️⃣ TESTE DE API EXTERNA INDISPONÍVEL

// PixService.test.ts
describe('PixService - Cenários de Falha', () => {
  describe('quando Mercado Pago está fora do ar', () => {
    it('deve lançar erro e NÃO debitar saldo do usuário', async () => {
      const mockMercadoPago = {
        sendPix: jest.fn().mockRejectedValue(
          new Error('Service Unavailable')
        )
      };
      const mockAccountRepo = {
        getBalance: jest.fn().mockResolvedValue(1000),
        debit: jest.fn()
      };

      const service = new PixService(mockMercadoPago, mockAccountRepo);

      await expect(
        service.transfer({ from: 'user123', to: 'chave@pix', amount: 100 })
      ).rejects.toThrow('Serviço de pagamento indisponível');

      // CRÍTICO: Verificar que NÃO debitou
      expect(mockAccountRepo.debit).not.toHaveBeenCalled();
    });

    it('deve fazer rollback se transação falhar no meio', async () => {
      const mockMercadoPago = {
        sendPix: jest.fn().mockRejectedValue(new Error('Timeout'))
      };
      const mockAccountRepo = {
        getBalance: jest.fn().mockResolvedValue(1000),
        debit: jest.fn().mockResolvedValue(true),
        credit: jest.fn().mockResolvedValue(true) // Rollback
      };

      const service = new PixService(mockMercadoPago, mockAccountRepo);

      await expect(
        service.transfer({ from: 'user123', to: 'chave@pix', amount: 100 })
      ).rejects.toThrow();

      // Verificar rollback
      expect(mockAccountRepo.debit).toHaveBeenCalled();
      expect(mockAccountRepo.credit).toHaveBeenCalledWith('user123', 100);
    });
  });
});

3️⃣ TESTE DE DADOS CORROMPIDOS

// TransactionService.test.ts
describe('TransactionService - Cenários de Falha', () => {
  describe('quando dados estão corrompidos', () => {
    it('deve rejeitar transação com amount negativo', async () => {
      const service = new TransactionService();

      await expect(
        service.createTransaction({ amount: -100 })
      ).rejects.toThrow('Amount deve ser positivo');
    });

    it('deve rejeitar transação com amount = 0', async () => {
      const service = new TransactionService();

      await expect(
        service.createTransaction({ amount: 0 })
      ).rejects.toThrow('Amount deve ser maior que zero');
    });

    it('deve rejeitar transação com amount muito grande', async () => {
      const service = new TransactionService();

      await expect(
        service.createTransaction({ amount: 999999999999 })
      ).rejects.toThrow('Amount excede limite permitido');
    });

    it('deve sanitizar dados antes de salvar', async () => {
      const mockRepo = {
        create: jest.fn().mockResolvedValue({ id: '123' })
      };
      const service = new TransactionService(mockRepo);

      await service.createTransaction({
        description: '<script>alert("XSS")</script>',
        amount: 100
      });

      expect(mockRepo.create).toHaveBeenCalledWith({
        description: 'alert("XSS")', // Sanitizado
        amount: 100
      });
    });
  });
});

4️⃣ TESTE DE RACE CONDITIONS

// AccountService.test.ts
describe('AccountService - Cenários de Falha', () => {
  describe('quando há concorrência', () => {
    it('deve prevenir saque duplo simultâneo', async () => {
      const mockRepo = {
        getBalance: jest.fn().mockResolvedValue(100),
        debit: jest.fn().mockImplementation(async (userId, amount) => {
          // Simular delay
          await new Promise(resolve => setTimeout(resolve, 100));
          return true;
        })
      };

      const service = new AccountService(mockRepo);

      // Tentar sacar 100 duas vezes simultaneamente
      const [result1, result2] = await Promise.allSettled([
        service.withdraw('user123', 100),
        service.withdraw('user123', 100)
      ]);

      // Apenas uma deve ter sucesso
      const successes = [result1, result2].filter(r => r.status === 'fulfilled');
      expect(successes).toHaveLength(1);
    });

    it('deve usar lock otimista para prevenir conflitos', async () => {
      const mockRepo = {
        updateWithVersion: jest.fn()
          .mockResolvedValueOnce(true)  // Primeira atualização OK
          .mockRejectedValueOnce(new Error('Version mismatch')) // Segunda falha
      };

      const service = new AccountService(mockRepo);

      await expect(
        service.updateBalance('user123', 100, 1)
      ).resolves.toBe(true);

      await expect(
        service.updateBalance('user123', 100, 1) // Mesma versão
      ).rejects.toThrow('Conflito de versão');
    });
  });
});

5️⃣ TESTE DE SEGURANÇA

// AuthService.test.ts
describe('AuthService - Cenários de Falha de Segurança', () => {
  describe('quando há tentativa de ataque', () => {
    it('deve prevenir SQL Injection no login', async () => {
      const mockRepo = {
        findByEmail: jest.fn()
      };
      const service = new AuthService(mockRepo);

      await expect(
        service.login({
          email: "admin' OR '1'='1",
          password: 'anything'
        })
      ).rejects.toThrow('Email inválido');

      // Não deve ter chamado o repo com SQL injection
      expect(mockRepo.findByEmail).not.toHaveBeenCalled();
    });

    it('deve bloquear após 5 tentativas de login falhas', async () => {
      const mockRepo = {
        findByEmail: jest.fn().mockResolvedValue({
          id: '123',
          email: 'user@test.com',
          password: 'hashed_password'
        })
      };
      const service = new AuthService(mockRepo);

      // 5 tentativas com senha errada
      for (let i = 0; i < 5; i++) {
        await expect(
          service.login({ email: 'user@test.com', password: 'wrong' })
        ).rejects.toThrow('Senha incorreta');
      }

      // 6ª tentativa deve estar bloqueada
      await expect(
        service.login({ email: 'user@test.com', password: 'correct' })
      ).rejects.toThrow('Conta bloqueada por múltiplas tentativas');
    });

    it('deve invalidar token após logout', async () => {
      const mockTokenRepo = {
        invalidate: jest.fn().mockResolvedValue(true)
      };
      const service = new AuthService(null, mockTokenRepo);

      await service.logout('token123');

      expect(mockTokenRepo.invalidate).toHaveBeenCalledWith('token123');

      // Tentar usar token invalidado
      await expect(
        service.validateToken('token123')
      ).rejects.toThrow('Token inválido');
    });
  });
});

═══════════════════════════════════════════════════════════════════════════════
🚀 TESTES DE INTEGRAÇÃO AUTOMÁTICOS (SUPERTEST)
═══════════════════════════════════════════════════════════════════════════════

Para TODA API REST, você DEVE gerar testes de integração completos:

1️⃣ TESTE DE FLUXO COMPLETO

// tests/integration/user-api.test.ts
import request from 'supertest';
import app from '../../src/app';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database';

describe('User API Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/users', () => {
    it('deve criar usuário com dados válidos', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          name: 'João Silva',
          email: 'joao@test.com',
          cpf: '12345678900',
          password: 'Senha@123'
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('joao@test.com');
      expect(res.body.user.password).toBeUndefined(); // Não retornar senha
    });

    it('deve retornar 400 com email inválido', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          name: 'João',
          email: 'invalid-email',
          cpf: '12345678900',
          password: 'Senha@123'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Email inválido');
    });

    it('deve retornar 409 se email já existe', async () => {
      // Criar primeiro usuário
      await request(app)
        .post('/api/users')
        .send({
          name: 'João',
          email: 'duplicate@test.com',
          cpf: '12345678900',
          password: 'Senha@123'
        });

      // Tentar criar com mesmo email
      const res = await request(app)
        .post('/api/users')
        .send({
          name: 'Maria',
          email: 'duplicate@test.com',
          cpf: '98765432100',
          password: 'Senha@456'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('Email já cadastrado');
    });
  });

  describe('GET /api/users/:id', () => {
    it('deve retornar usuário por ID', async () => {
      // Criar usuário
      const createRes = await request(app)
        .post('/api/users')
        .send({
          name: 'João',
          email: 'joao2@test.com',
          cpf: '12345678900',
          password: 'Senha@123'
        });

      const userId = createRes.body.user.id;

      // Buscar usuário
      const res = await request(app).get(\`/api/users/\${userId}\`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(userId);
      expect(res.body.email).toBe('joao2@test.com');
    });

    it('deve retornar 404 se usuário não existe', async () => {
      const res = await request(app).get('/api/users/999999');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Usuário não encontrado');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('deve atualizar usuário autenticado', async () => {
      // Criar e fazer login
      const createRes = await request(app)
        .post('/api/users')
        .send({
          name: 'João',
          email: 'joao3@test.com',
          cpf: '12345678900',
          password: 'Senha@123'
        });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'joao3@test.com',
          password: 'Senha@123'
        });

      const token = loginRes.body.token;
      const userId = createRes.body.user.id;

      // Atualizar
      const res = await request(app)
        .put(\`/api/users/\${userId}\`)
        .set('Authorization', \`Bearer \${token}\`)
        .send({ name: 'João Silva Santos' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('João Silva Santos');
    });

    it('deve retornar 401 sem autenticação', async () => {
      const res = await request(app)
        .put('/api/users/123')
        .send({ name: 'Novo Nome' });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('deve deletar usuário autenticado', async () => {
      // Criar e fazer login
      const createRes = await request(app)
        .post('/api/users')
        .send({
          name: 'João',
          email: 'joao4@test.com',
          cpf: '12345678900',
          password: 'Senha@123'
        });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'joao4@test.com',
          password: 'Senha@123'
        });

      const token = loginRes.body.token;
      const userId = createRes.body.user.id;

      // Deletar
      const res = await request(app)
        .delete(\`/api/users/\${userId}\`)
        .set('Authorization', \`Bearer \${token}\`);

      expect(res.status).toBe(204);

      // Verificar que foi deletado
      const getRes = await request(app).get(\`/api/users/\${userId}\`);
      expect(getRes.status).toBe(404);
    });
  });
});

2️⃣ TESTE DE TRANSAÇÃO FINANCEIRA (FINTECH)

// tests/integration/pix-transfer.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('PIX Transfer Integration Tests', () => {
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    // Criar usuário e fazer login
    const createRes = await request(app)
      .post('/api/users')
      .send({
        name: 'João',
        email: 'joao@test.com',
        cpf: '12345678900',
        password: 'Senha@123'
      });

    userId = createRes.body.user.id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'joao@test.com',
        password: 'Senha@123'
      });

    userToken = loginRes.body.token;

    // Adicionar saldo inicial
    await request(app)
      .post('/api/deposits')
      .set('Authorization', \`Bearer \${userToken}\`)
      .send({ amount: 1000 });
  });

  describe('POST /api/pix/transfer', () => {
    it('deve realizar transferência com saldo suficiente', async () => {
      const res = await request(app)
        .post('/api/pix/transfer')
        .set('Authorization', \`Bearer \${userToken}\`)
        .send({
          pixKey: 'chave@pix.com',
          amount: 100
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.transactionId).toBeDefined();

      // Verificar saldo atualizado
      const balanceRes = await request(app)
        .get('/api/account/balance')
        .set('Authorization', \`Bearer \${userToken}\`);

      expect(balanceRes.body.balance).toBe(900);
    });

    it('deve rejeitar transferência com saldo insuficiente', async () => {
      const res = await request(app)
        .post('/api/pix/transfer')
        .set('Authorization', \`Bearer \${userToken}\`)
        .send({
          pixKey: 'chave@pix.com',
          amount: 10000 // Mais que o saldo
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Saldo insuficiente');

      // Verificar que saldo NÃO mudou
      const balanceRes = await request(app)
        .get('/api/account/balance')
        .set('Authorization', \`Bearer \${userToken}\`);

      expect(balanceRes.body.balance).toBe(900); // Mesmo saldo
    });

    it('deve fazer rollback se Mercado Pago falhar', async () => {
      // Mock de falha do Mercado Pago (configurar no teste)
      const res = await request(app)
        .post('/api/pix/transfer')
        .set('Authorization', \`Bearer \${userToken}\`)
        .send({
          pixKey: 'invalid@pix.com',
          amount: 50
        });

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Erro ao processar transferência');

      // Verificar que saldo NÃO mudou (rollback)
      const balanceRes = await request(app)
        .get('/api/account/balance')
        .set('Authorization', \`Bearer \${userToken}\`);

      expect(balanceRes.body.balance).toBe(900); // Mesmo saldo
    });
  });
});

═══════════════════════════════════════════════════════════════════════════════
📊 CHECKLIST DE TESTES OBRIGATÓRIOS
═══════════════════════════════════════════════════════════════════════════════

Para CADA funcionalidade, você DEVE gerar testes para:

✅ CASOS DE SUCESSO
   - Dados válidos
   - Fluxo feliz
   - Resultado esperado

✅ CASOS DE ERRO
   - Dados inválidos
   - Dados faltando
   - Formato incorreto

✅ CASOS DE EDGE
   - Valores limites (0, -1, MAX_INT)
   - Arrays vazios
   - Strings vazias
   - Null/undefined

✅ CASOS DE FALHA DE INFRAESTRUTURA
   - Banco de dados fora
   - API externa fora
   - Timeout
   - Retry logic

✅ CASOS DE SEGURANÇA
   - SQL Injection
   - XSS
   - CSRF
   - Rate limiting
   - Autenticação/Autorização

✅ CASOS DE CONCORRÊNCIA
   - Race conditions
   - Deadlocks
   - Lock otimista

✅ CASOS DE PERFORMANCE
   - Grandes volumes de dados
   - Queries lentas
   - Memory leaks

═══════════════════════════════════════════════════════════════════════════════
🎯 REGRA DE OURO: PENSE COMO UM HACKER
═══════════════════════════════════════════════════════════════════════════════

Ao gerar testes, SEMPRE pergunte:

1. "Como eu quebraria esse código?"
2. "Que dados maliciosos eu poderia enviar?"
3. "O que acontece se o banco cair agora?"
4. "E se dois usuários fizerem isso ao mesmo tempo?"
5. "Como eu roubaria dinheiro desse sistema?"

Se você consegue pensar em uma forma de quebrar, GERE UM TESTE PARA ISSO.

SEMPRE GERE TESTES. SEMPRE.

═══════════════════════════════════════════════════════════════════════════════
🎯 SEÇÃO CRÍTICA: CI/CD E TESTES E2E (OBRIGATÓRIOS PARA 100/100)
═══════════════════════════════════════════════════════════════════════════════

⚠️ **REGRA DE OURO: CÓDIGO SEM CI/CD E E2E = CÓDIGO INCOMPLETO (98/100)**

Para atingir **100/100**, você DEVE SEMPRE gerar:

1️⃣ **CI/CD Pipeline Completo**
2️⃣ **Testes E2E (End-to-End)**

Sem esses dois componentes, o código está **INCOMPLETO**, mesmo que tenha:
- ✅ Testes unitários perfeitos
- ✅ Testes de integração completos
- ✅ Testes de cenários de falha
- ✅ Segurança implementada

**NOTA MÁXIMA = Testes Unitários + Integração + Falha + E2E + CI/CD**

═══════════════════════════════════════════════════════════════════════════════
1️⃣ CI/CD PIPELINE (OBRIGATÓRIO)
═══════════════════════════════════════════════════════════════════════════════

Para QUALQUER projeto, você DEVE gerar:

📁 .github/workflows/ci.yml

name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  # ========================================
  # JOB 1: TESTES DO BACKEND
  # ========================================
  test-backend:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:6
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      
      - name: Install dependencies
        run: cd backend && go mod download
      
      - name: Run unit tests
        run: cd backend && go test ./internal/... -v -coverprofile=coverage.out
        env:
          JWT_SECRET: test-secret-key-32-bytes-long
          AES_SECRET_KEY: 12345678901234567890123456789012
          PG_DSN: "host=localhost user=test password=test dbname=test_db port=5432 sslmode=disable"
          REDIS_ADDR: "localhost:6379"
      
      - name: Run integration tests
        run: cd backend && go test ./tests/... -v
        env:
          JWT_SECRET: test-secret-key-32-bytes-long
          AES_SECRET_KEY: 12345678901234567890123456789012
          PG_DSN: "host=localhost user=test password=test dbname=test_db port=5432 sslmode=disable"
          REDIS_ADDR: "localhost:6379"
      
      - name: Check coverage
        run: |
          cd backend
          go tool cover -func=coverage.out
          COVERAGE=\$(go tool cover -func=coverage.out | grep total | awk '{print \$3}' | sed 's/%//')
          if (( \$(echo "\$COVERAGE < 80" | bc -l) )); then
            echo "Coverage \$COVERAGE% is below 80%"
            exit 1
          fi
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage.out
          flags: backend
  
  # ========================================
  # JOB 2: TESTES DO FRONTEND
  # ========================================
  test-frontend:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: cd frontend && npm ci
      
      - name: Run unit tests
        run: cd frontend && npm run test:coverage
      
      - name: Check coverage
        run: |
          cd frontend
          COVERAGE=\$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( \$(echo "\$COVERAGE < 80" | bc -l) )); then
            echo "Coverage \$COVERAGE% is below 80%"
            exit 1
          fi
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
          flags: frontend
  
  # ========================================
  # JOB 3: TESTES E2E (CRÍTICO)
  # ========================================
  test-e2e:
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Start services with Docker Compose
        run: docker-compose up -d
      
      - name: Wait for services to be ready
        run: |
          echo "Waiting for backend..."
          timeout 60 bash -c 'until curl -f http://localhost:8080/health; do sleep 2; done'
          echo "Waiting for frontend..."
          timeout 60 bash -c 'until curl -f http://localhost:3000; do sleep 2; done'
      
      - name: Install Playwright
        run: cd frontend && npx playwright install --with-deps
      
      - name: Run E2E tests
        run: cd frontend && npm run test:e2e
      
      - name: Upload E2E test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
      
      - name: Stop services
        if: always()
        run: docker-compose down
  
  # ========================================
  # JOB 4: LINT E SEGURANÇA
  # ========================================
  lint-and-security:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Run golangci-lint
        uses: golangci/golangci-lint-action@v3
        with:
          version: latest
          working-directory: backend
      
      - name: Run ESLint
        run: cd frontend && npm ci && npm run lint
      
      - name: Run security scan (Trivy)
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

═══════════════════════════════════════════════════════════════════════════════
2️⃣ TESTES E2E COM PLAYWRIGHT (OBRIGATÓRIO)
═══════════════════════════════════════════════════════════════════════════════

Para QUALQUER aplicação web, você DEVE gerar:

📁 frontend/playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
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
});

📁 frontend/tests/e2e/user-journey.test.ts

import { test, expect } from '@playwright/test';

test.describe('Jornada Completa do Usuário - Fintech', () => {
  test.beforeEach(async ({ page }) => {
    // Limpar localStorage antes de cada teste
    await page.goto('http://localhost:3000');
    await page.evaluate(() => localStorage.clear());
  });

  test('deve realizar fluxo completo: Login → Dashboard → Transferência → Extrato', async ({ page }) => {
    // ========================================
    // PASSO 1: LOGIN
    // ========================================
    await page.goto('http://localhost:3000/login');
    
    await expect(page.locator('[data-aid="login-title"]')).toBeVisible();
    
    await page.fill('[data-aid="login-input-email"]', 'teste@nexus.com');
    await page.fill('[data-aid="login-input-password"]', '123456');
    await page.click('[data-aid="login-submit-button"]');
    
    // Aguardar redirecionamento
    await page.waitForURL('**/');
    
    // ========================================
    // PASSO 2: DASHBOARD
    // ========================================
    await expect(page.locator('[data-aid="dashboard-main-content"]')).toBeVisible();
    
    // Verificar saldo carregado
    await expect(page.locator('[data-aid="balance-card"]')).toBeVisible();
    
    // Verificar que o saldo é um número válido
    const balanceText = await page.locator('[data-aid="balance-card"] h3').textContent();
    expect(balanceText).toMatch(/R\$ \d+/);
    
    // Verificar limite diário
    await expect(page.locator('[data-aid="limit-card"]')).toBeVisible();
    await expect(page.locator('[data-aid="limit-progress-bar"]')).toBeVisible();
    
    // ========================================
    // PASSO 3: TRANSFERÊNCIA PIX
    // ========================================
    await page.click('text=Enviar PIX');
    await page.waitForURL('**/transfer');
    
    await expect(page.locator('[data-aid="transfer-main-content"]')).toBeVisible();
    
    // Preencher formulário de transferência
    await page.fill('[data-aid="transfer-input-amount"]', '50.00');
    await page.fill('[data-aid="transfer-input-pixkey"]', 'teste@destino.com');
    await page.fill('[data-aid="transfer-input-description"]', 'Teste E2E Playwright');
    
    // Submeter transferência
    await page.click('[data-aid="transfer-submit-button"]');
    
    // Aguardar feedback de sucesso
    await expect(page.locator('[data-aid="transfer-feedback"]')).toBeVisible({ timeout: 10000 });
    
    const feedbackText = await page.locator('[data-aid="transfer-feedback"]').textContent();
    expect(feedbackText).toContain('sucesso');
    
    // ========================================
    // PASSO 4: EXTRATO
    // ========================================
    await page.click('text=Extrato');
    await page.waitForURL('**/statement');
    
    await expect(page.locator('[data-aid="statement-main-content"]')).toBeVisible();
    
    // Verificar que a tabela de transações existe
    await expect(page.locator('[data-aid="transaction-table-container"]')).toBeVisible();
    
    // Verificar que há pelo menos uma transação (a que acabamos de fazer)
    const rows = page.locator('[data-aid^="statement-row-"]');
    await expect(rows.first()).toBeVisible();
    
    // Verificar que a transação de R$ 50.00 aparece
    const firstRowAmount = await rows.first().locator('td').nth(1).textContent();
    expect(firstRowAmount).toContain('50');
    
    // ========================================
    // PASSO 5: LOGOUT
    // ========================================
    await page.click('[data-aid="logout-button"]');
    
    // Verificar redirecionamento para login
    await page.waitForURL('**/login');
    await expect(page.locator('[data-aid="login-title"]')).toBeVisible();
  });

  test('deve validar campos obrigatórios no formulário de transferência', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-aid="login-input-email"]', 'teste@nexus.com');
    await page.fill('[data-aid="login-input-password"]', '123456');
    await page.click('[data-aid="login-submit-button"]');
    await page.waitForURL('**/');
    
    // Ir para transferência
    await page.click('text=Enviar PIX');
    await page.waitForURL('**/transfer');
    
    // Tentar submeter sem preencher
    await page.click('[data-aid="transfer-submit-button"]');
    
    // Verificar que o formulário não foi submetido (validação HTML5)
    const amountInput = page.locator('[data-aid="transfer-input-amount"]');
    const isInvalid = await amountInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('deve exibir erro ao tentar transferir com saldo insuficiente', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-aid="login-input-email"]', 'teste@nexus.com');
    await page.fill('[data-aid="login-input-password"]', '123456');
    await page.click('[data-aid="login-submit-button"]');
    await page.waitForURL('**/');
    
    // Ir para transferência
    await page.click('text=Enviar PIX');
    await page.waitForURL('**/transfer');
    
    // Tentar transferir valor muito alto
    await page.fill('[data-aid="transfer-input-amount"]', '999999.00');
    await page.fill('[data-aid="transfer-input-pixkey"]', 'teste@destino.com');
    await page.click('[data-aid="transfer-submit-button"]');
    
    // Verificar mensagem de erro
    await expect(page.locator('[data-aid="transfer-feedback"]')).toBeVisible({ timeout: 10000 });
    const errorText = await page.locator('[data-aid="transfer-feedback"]').textContent();
    expect(errorText).toContain('saldo insuficiente');
  });

  test('deve funcionar em dispositivos móveis', async ({ page }) => {
    // Simular viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-aid="login-input-email"]', 'teste@nexus.com');
    await page.fill('[data-aid="login-input-password"]', '123456');
    await page.click('[data-aid="login-submit-button"]');
    await page.waitForURL('**/');
    
    // Verificar que o dashboard é responsivo
    await expect(page.locator('[data-aid="dashboard-main-content"]')).toBeVisible();
    await expect(page.locator('[data-aid="balance-card"]')).toBeVisible();
  });
});

📁 frontend/package.json (adicionar scripts)

{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}

═══════════════════════════════════════════════════════════════════════════════
📊 CHECKLIST FINAL PARA 100/100
═══════════════════════════════════════════════════════════════════════════════

Para atingir a nota máxima, você DEVE gerar:

✅ **Testes Unitários**
   - Funções isoladas
   - Mocks e stubs
   - Edge cases

✅ **Testes de Integração**
   - Fluxos completos
   - API endpoints
   - Banco de dados

✅ **Testes de Cenários de Falha**
   - Infraestrutura fora
   - Dados inválidos
   - Concorrência

✅ **Testes de Segurança**
   - SQL Injection
   - XSS
   - Autenticação

✅ **Testes E2E (OBRIGATÓRIO)** 🔥
   - Jornada completa do usuário
   - Validação de formulários
   - Responsividade
   - Multi-browser

✅ **CI/CD Pipeline (OBRIGATÓRIO)** 🔥
   - Testes automáticos
   - Verificação de cobertura
   - Lint e segurança
   - Deploy automático

✅ **Configurações**
   - jest.config.js / vitest.config.ts
   - playwright.config.ts
   - .github/workflows/ci.yml

✅ **Documentação**
   - README com instruções
   - Como rodar testes
   - Como rodar E2E

═══════════════════════════════════════════════════════════════════════════════
⚠️ REGRA FINAL: SEM E2E E CI/CD = 98/100 (INCOMPLETO)
═══════════════════════════════════════════════════════════════════════════════

Mesmo que o código tenha:
- ✅ Testes unitários perfeitos
- ✅ Testes de integração completos
- ✅ Testes de falha e segurança
- ✅ Arquitetura impecável

**SEM E2E E CI/CD = CÓDIGO INCOMPLETO (98/100)**

**COM E2E E CI/CD = CÓDIGO PERFEITO (100/100)**

SEMPRE GERE E2E E CI/CD. SEMPRE.

╔══════════════════════════════════════════════════════════════════════════════╗
║                    FIM DO MANIFESTO TDD EXPANDIDO                            ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;
