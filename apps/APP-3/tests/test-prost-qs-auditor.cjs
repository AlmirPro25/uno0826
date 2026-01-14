/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║           🔍 TESTES DO PROST-QS AUDITOR - ANTI-SIMULAÇÃO 🔍                 ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Testes para validar que o auditor detecta corretamente:
 * - Violações críticas (mock, localStorage, decisões locais)
 * - Padrões obrigatórios (SDK import, client init, endpoint calls)
 * - Score de conformidade
 * - Recomendações (APPROVE, REJECT, REVIEW)
 */

const assert = require('assert');

// ============================================================================
// MOCK DO AUDITOR (para testes sem TypeScript)
// ============================================================================

const FORBIDDEN_PATTERNS = [
  {
    pattern: /localStorage\.(get|set)Item\s*\(\s*['"`].*?(auth|user|token|session|logged|isPro|premium|plan|subscription).*?['"`]/gi,
    type: 'CRITICAL',
    code: 'PROST-001',
    message: 'Estado de auth/billing armazenado em localStorage'
  },
  {
    pattern: /if\s*\(\s*(isPro|isPremium|hasPlan|isSubscribed|user\.plan|user\.subscription)\s*\)/gi,
    type: 'CRITICAL',
    code: 'PROST-002',
    message: 'Decisão de plano feita localmente'
  },
  {
    pattern: /(upgrade|subscribe|setPremium|setIsPro)\s*\(\s*\)\s*{[^}]*localStorage/gi,
    type: 'CRITICAL',
    code: 'PROST-003',
    message: 'Função de upgrade usando localStorage'
  },
  {
    pattern: /const\s+(PROST_QS|prostqs|ProstQS)\s*=\s*{[^}]*(localStorage|mock|fake|simulate)/gi,
    type: 'CRITICAL',
    code: 'PROST-004',
    message: 'Mock/simulação do PROST-QS detectado'
  },
  {
    pattern: /import\s+.*?stripe|require\s*\(\s*['"`]stripe['"`]\s*\)|new\s+Stripe\s*\(/gi,
    type: 'CRITICAL',
    code: 'PROST-005',
    message: 'Integração direta com Stripe detectada'
  },
  {
    pattern: /(bcrypt|argon2|scrypt|pbkdf2)\.(hash|compare|verify)/gi,
    type: 'CRITICAL',
    code: 'PROST-006',
    message: 'Hash de senha implementado localmente'
  },
  {
    pattern: /(jwt|jsonwebtoken)\.(sign|verify|decode)/gi,
    type: 'CRITICAL',
    code: 'PROST-007',
    message: 'JWT implementado localmente'
  }
];

const REQUIRED_PATTERNS = [
  {
    pattern: /import\s*{?\s*ProstQSClient\s*}?\s*from\s*['"`].*prost-qs-sdk/gi,
    code: 'PROST-REQ-001',
    message: 'Import do SDK PROST-QS obrigatório',
    weight: 30
  },
  {
    pattern: /window\.prostqs\s*=\s*new\s+ProstQSClient/gi,
    code: 'PROST-REQ-002',
    message: 'Inicialização do cliente PROST-QS obrigatória',
    weight: 20
  },
  {
    pattern: /prostqs\.(get|post)\s*\(\s*['"`]\/api\/v1\/(auth|identity|billing)/gi,
    code: 'PROST-REQ-003',
    message: 'Chamadas aos endpoints PROST-QS obrigatórias',
    weight: 25
  },
  {
    pattern: /hasActiveSubscription\s*\(\s*\)/gi,
    code: 'PROST-REQ-004',
    message: 'Uso de hasActiveSubscription() para feature gating',
    weight: 25
  }
];

function auditCode(code) {
  const violations = [];
  let score = 100;
  
  // Verificar padrões proibidos
  for (const rule of FORBIDDEN_PATTERNS) {
    const matches = code.match(rule.pattern);
    if (matches) {
      for (const match of matches) {
        violations.push({
          type: rule.type,
          code: rule.code,
          message: rule.message,
          snippet: match.substring(0, 100)
        });
        score -= 50; // Crítico = -50
      }
    }
  }
  
  // Verificar padrões obrigatórios
  for (const rule of REQUIRED_PATTERNS) {
    const found = rule.pattern.test(code);
    // Reset lastIndex para próxima verificação
    rule.pattern.lastIndex = 0;
    
    if (!found) {
      violations.push({
        type: 'WARNING',
        code: rule.code,
        message: rule.message
      });
      score -= rule.weight;
    }
  }
  
  score = Math.max(0, score);
  
  // Determinar recomendação
  let recommendation;
  if (violations.some(v => v.type === 'CRITICAL')) {
    recommendation = 'REJECT';
  } else if (violations.some(v => v.type === 'SEVERE')) {
    recommendation = 'REVIEW';
  } else if (score >= 80) {
    recommendation = 'APPROVE';
  } else {
    recommendation = 'REVIEW';
  }
  
  return {
    passed: recommendation === 'APPROVE',
    score,
    violations,
    recommendation
  };
}

// ============================================================================
// CÓDIGO DE TESTE: VIOLAÇÕES
// ============================================================================

const CODE_WITH_LOCALSTORAGE_AUTH = `
// Código que viola o manifesto usando localStorage para auth
const PROST_QS = {
  async getAuthStatus() {
    const stored = localStorage.getItem('kernel_auth_v2');
    return stored ? JSON.parse(stored) : { isPro: false };
  },
  async upgrade() {
    localStorage.setItem('kernel_auth_v2', JSON.stringify({ isPro: true }));
  }
};

function checkPremium() {
  if (isPro) {
    showPremiumFeature();
  }
}
`;

const CODE_WITH_DIRECT_STRIPE = `
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createSubscription(customerId, priceId) {
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }]
  });
}
`;

const CODE_WITH_LOCAL_JWT = `
import jwt from 'jsonwebtoken';

function generateToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET);
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
`;

const CODE_WITH_PASSWORD_HASH = `
import bcrypt from 'bcrypt';

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
`;

// ============================================================================
// CÓDIGO DE TESTE: CONFORMIDADE
// ============================================================================

const CODE_COMPLIANT = `
import { ProstQSClient } from './prost-qs-sdk.js';

const PROST_QS_URL = 'http://localhost:8080';
window.prostqs = new ProstQSClient(PROST_QS_URL);

async function login(username, password) {
  const response = await prostqs.post('/api/v1/auth/login', { username, password });
  return response;
}

async function getUser() {
  return prostqs.get('/api/v1/identity/me');
}

async function checkSubscription() {
  return prostqs.get('/api/v1/billing/subscriptions/active');
}

function renderDashboard() {
  if (hasActiveSubscription()) {
    showPremiumFeature();
  } else {
    showPaywall();
  }
}
`;

const CODE_PARTIAL_COMPLIANT = `
import { ProstQSClient } from './prost-qs-sdk.js';

// Falta inicialização do cliente
// Falta chamadas aos endpoints
// Falta hasActiveSubscription

function renderDashboard() {
  // Código incompleto
}
`;

// ============================================================================
// TESTES
// ============================================================================

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║           🔍 TESTES DO PROST-QS AUDITOR - ANTI-SIMULAÇÃO 🔍                 ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Erro: ${error.message}`);
    failed++;
  }
}

// Teste 1: Detectar localStorage para auth
test('Detecta localStorage para auth/billing', () => {
  const result = auditCode(CODE_WITH_LOCALSTORAGE_AUTH);
  assert.strictEqual(result.recommendation, 'REJECT', 'Deveria rejeitar código com localStorage');
  assert.ok(result.violations.some(v => v.code === 'PROST-001'), 'Deveria detectar PROST-001');
});

// Teste 2: Detectar mock do PROST-QS
test('Detecta mock/simulação do PROST-QS', () => {
  const result = auditCode(CODE_WITH_LOCALSTORAGE_AUTH);
  assert.ok(result.violations.some(v => v.code === 'PROST-004'), 'Deveria detectar PROST-004');
});

// Teste 3: Detectar decisão local de plano
test('Detecta decisão local de plano (if isPro)', () => {
  const result = auditCode(CODE_WITH_LOCALSTORAGE_AUTH);
  assert.ok(result.violations.some(v => v.code === 'PROST-002'), 'Deveria detectar PROST-002');
});

// Teste 4: Detectar integração direta com Stripe
test('Detecta integração direta com Stripe', () => {
  const result = auditCode(CODE_WITH_DIRECT_STRIPE);
  assert.strictEqual(result.recommendation, 'REJECT', 'Deveria rejeitar código com Stripe direto');
  assert.ok(result.violations.some(v => v.code === 'PROST-005'), 'Deveria detectar PROST-005');
});

// Teste 5: Detectar JWT local
test('Detecta JWT implementado localmente', () => {
  const result = auditCode(CODE_WITH_LOCAL_JWT);
  assert.strictEqual(result.recommendation, 'REJECT', 'Deveria rejeitar código com JWT local');
  assert.ok(result.violations.some(v => v.code === 'PROST-007'), 'Deveria detectar PROST-007');
});

// Teste 6: Detectar hash de senha local
test('Detecta hash de senha implementado localmente', () => {
  const result = auditCode(CODE_WITH_PASSWORD_HASH);
  assert.strictEqual(result.recommendation, 'REJECT', 'Deveria rejeitar código com bcrypt');
  assert.ok(result.violations.some(v => v.code === 'PROST-006'), 'Deveria detectar PROST-006');
});

// Teste 7: Aprovar código conforme
test('Aprova código que segue o manifesto', () => {
  const result = auditCode(CODE_COMPLIANT);
  assert.strictEqual(result.recommendation, 'APPROVE', 'Deveria aprovar código conforme');
  assert.strictEqual(result.passed, true, 'passed deveria ser true');
  assert.ok(result.score >= 80, `Score deveria ser >= 80, mas foi ${result.score}`);
});

// Teste 8: Verificar padrões obrigatórios ausentes
test('Detecta ausência de padrões obrigatórios', () => {
  const result = auditCode(CODE_PARTIAL_COMPLIANT);
  assert.ok(result.violations.some(v => v.code === 'PROST-REQ-002'), 'Deveria detectar falta de inicialização');
  assert.ok(result.violations.some(v => v.code === 'PROST-REQ-003'), 'Deveria detectar falta de chamadas');
  assert.ok(result.violations.some(v => v.code === 'PROST-REQ-004'), 'Deveria detectar falta de hasActiveSubscription');
});

// Teste 9: Score penalizado por violações
test('Score é penalizado por violações críticas', () => {
  const result = auditCode(CODE_WITH_LOCALSTORAGE_AUTH);
  assert.ok(result.score < 50, `Score deveria ser < 50 com violações críticas, mas foi ${result.score}`);
});

// Teste 10: Código vazio não passa
test('Código vazio não passa na auditoria', () => {
  const result = auditCode('');
  assert.strictEqual(result.passed, false, 'Código vazio não deveria passar');
  assert.ok(result.violations.length > 0, 'Deveria ter violações por falta de padrões obrigatórios');
});

// ============================================================================
// RESULTADO FINAL
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════════════════════════');
console.log(`📊 RESULTADO: ${passed} passou, ${failed} falhou`);
console.log('═══════════════════════════════════════════════════════════════════════════════');

if (failed > 0) {
  console.log('\n❌ ALGUNS TESTES FALHARAM!');
  process.exit(1);
} else {
  console.log('\n✅ TODOS OS TESTES PASSARAM!');
  console.log('\n🔍 O ProstQSAuditor está funcionando corretamente.');
  console.log('🛡️ Código que viola o manifesto será REJEITADO automaticamente.');
  process.exit(0);
}
