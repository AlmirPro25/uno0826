/**
 * 🧪 TESTES: PROST-QS AUDITOR V2 (AGRESSIVO)
 * 
 * Validar detecção agressiva de violações
 */

const assert = require('assert');

// Simulação do Auditor V2
class ProstQSAuditorV2 {
  static audit(code) {
    const patterns = [
      { code: 'PROST-001-MOCK-LOGIN', pattern: /(?:mock|demo|example|test)\s+(?:login|credentials|email|password)|free@|pro@|demo@|test@/i, type: 'CRITICAL' },
      { code: 'PROST-002-LOCAL-AUTH', pattern: /localStorage\.setItem\s*\(\s*['"](?:auth|token|user|session|logged|isAuth)/i, type: 'CRITICAL' },
      { code: 'PROST-003-LOCAL-BILLING', pattern: /localStorage\.setItem\s*\(\s*['"](?:premium|pro|plan|subscription|isPro|isPremium)/i, type: 'CRITICAL' },
      { code: 'PROST-004-MOCK-PROST-QS', pattern: /const\s+(?:PROST_QS|prostqs)\s*=\s*\{|adapter\s*:\s*\{\s*(?:fake|mock|simulate)\s*:\s*true/i, type: 'CRITICAL' },
      { code: 'PROST-005-HEADER-AUTH', pattern: /X-User-ID|X-Plan-Status|X-Auth-Token|headers\[['"]X-/i, type: 'CRITICAL' },
      { code: 'PROST-006-BACKEND-PLAN-LOGIC', pattern: /MaxFreeWorkspaces|MaxFreePages|plan\s*===\s*['"]free|plan\s*===\s*['"]pro/i, type: 'CRITICAL' },
      { code: 'PROST-007-BACKEND-OWN-AUTH', pattern: /func\s+\(\w+\s+\*?Service\)\s+(?:Login|Register|Auth)|type\s+(?:User|Auth)\s+struct/i, type: 'CRITICAL' },
      { code: 'PROST-008-DATABASE-AUTH', pattern: /CREATE TABLE.*users|INSERT INTO.*users|SELECT.*FROM.*users.*password/i, type: 'CRITICAL' },
      { code: 'PROST-009-DIRECT-STRIPE', pattern: /import.*stripe|new\s+Stripe\s*\(|@stripe\/stripe-js/i, type: 'CRITICAL' },
      { code: 'PROST-010-LOCAL-JWT', pattern: /jwt\.sign|jsonwebtoken|crypto\.sign|hmac/i, type: 'CRITICAL' },
      { code: 'PROST-011-LOCAL-PASSWORD-HASH', pattern: /bcrypt|argon2|scrypt|crypto\.pbkdf2/i, type: 'CRITICAL' },
      { code: 'PROST-012-LOCAL-PLAN-DECISION', pattern: /if\s*\(\s*(?:isPro|isPremium|hasPlan|user\.plan)/i, type: 'CRITICAL' },
      { code: 'PROST-013-OFFLINE-SYNC', pattern: /IndexedDB|offline.*sync|sync.*queue/i, type: 'SEVERE' },
      { code: 'PROST-014-INTERNAL-PROFILE', pattern: /user\.profile|internal.*user|userProfile\s*=/i, type: 'SEVERE' },
      { code: 'PROST-015-BACKEND-COMPLETE', pattern: /func\s+main\s*\(\s*\)\s*\{|type\s+\w+Service\s+struct/i, type: 'SEVERE' },
    ];

    const violations = [];
    for (const p of patterns) {
      const matches = code.match(p.pattern);
      if (matches) {
        violations.push({
          type: p.type,
          code: p.code,
          message: `Violação ${p.code} detectada`,
          snippet: matches[0].substring(0, 50),
        });
      }
    }

    const criticalCount = violations.filter(v => v.type === 'CRITICAL').length;
    const severeCount = violations.filter(v => v.type === 'SEVERE').length;
    const score = Math.max(0, 100 - (criticalCount * 30 + severeCount * 15));

    return {
      passed: criticalCount === 0,
      score,
      violations,
      recommendation: criticalCount > 0 ? 'REJECT' : (severeCount > 0 ? 'REVIEW' : 'APPROVE'),
    };
  }
}

console.log('🧪 INICIANDO TESTES: PROST-QS AUDITOR V2 (AGRESSIVO)\n');

let testsPassed = 0;
let testsFailed = 0;

// ============================================================================
// SUITE 1: Detecção de Mock Login
// ============================================================================

console.log('📋 SUITE 1: Detecção de Mock Login');

try {
  const code = `
    // Demo login
    const credentials = {
      email: 'demo@example.com',
      password: 'demo123'
    };
  `;
  const result = ProstQSAuditorV2.audit(code);
  assert(result.violations.some(v => v.code === 'PROST-001-MOCK-LOGIN'));
  assert(result.recommendation === 'REJECT');
  console.log('✅ Teste 1.1: Detectar demo@example.com');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 1.1 FALHOU:', error.message);
  testsFailed++;
}

try {
  const code = `
    // Test credentials
    const testUser = 'free@glyph.com';
    const testPassword = 'test123';
  `;
  const result = ProstQSAuditorV2.audit(code);
  assert(result.violations.some(v => v.code === 'PROST-001-MOCK-LOGIN'));
  console.log('✅ Teste 1.2: Detectar free@glyph.com');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 1.2 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 2: Detecção de Auth Local
// ============================================================================

console.log('\n📋 SUITE 2: Detecção de Auth Local');

try {
  const code = `
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  `;
  const result = ProstQSAuditorV2.audit(code);
  assert(result.violations.some(v => v.code === 'PROST-002-LOCAL-AUTH'));
  assert(result.recommendation === 'REJECT');
  console.log('✅ Teste 2.1: Detectar localStorage auth');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 2.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 3: Detecção de Billing Local
// ============================================================================

console.log('\n📋 SUITE 3: Detecção de Billing Local');

try {
  const code = `
    localStorage.setItem('isPremium', true);
    localStorage.setItem('subscription', JSON.stringify(sub));
  `;
  const result = ProstQSAuditorV2.audit(code);
  assert(result.violations.some(v => v.code === 'PROST-003-LOCAL-BILLING'));
  console.log('✅ Teste 3.1: Detectar localStorage billing');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 3.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 4: Detecção de Mock PROST-QS
// ============================================================================

console.log('\n📋 SUITE 4: Detecção de Mock PROST-QS');

try {
  const code = `
    const PROST_QS = {
      async getAuthStatus() {
        return localStorage.getItem('isPro');
      }
    };
  `;
  const result = ProstQSAuditorV2.audit(code);
  assert(result.violations.some(v => v.code === 'PROST-004-MOCK-PROST-QS'));
  console.log('✅ Teste 4.1: Detectar mock PROST-QS');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 4.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 5: Detecção de Headers de Auth
// ============================================================================

console.log('\n📋 SUITE 5: Detecção de Headers de Auth');

try {
  const code = `
    const headers = {
      'X-User-ID': userId,
      'X-Plan-Status': planStatus,
      'X-Auth-Token': token
    };
  `;
  const result = ProstQSAuditorV2.audit(code);
  assert(result.violations.some(v => v.code === 'PROST-005-HEADER-AUTH'));
  console.log('✅ Teste 5.1: Detectar X-User-ID header');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 5.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 6: Detecção de Lógica de Plano no Backend
// ============================================================================

console.log('\n📋 SUITE 6: Detecção de Lógica de Plano no Backend');

try {
  const code = `
    const MaxFreeWorkspaces = 3;
    const MaxFreePages = 10;
    if (plan === 'free') {
      return error('Limite atingido');
    }
  `;
  const result = ProstQSAuditorV2.audit(code);
  assert(result.violations.some(v => v.code === 'PROST-006-BACKEND-PLAN-LOGIC'));
  console.log('✅ Teste 6.1: Detectar MaxFreeWorkspaces');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 6.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 7: Detecção de Backend Próprio
// ============================================================================

console.log('\n📋 SUITE 7: Detecção de Backend Próprio');

try {
  const code = `
    func (s *UserService) Login(email, password string) error {
      // Login logic
    }
    
    type User struct {
      ID string
      Email string
    }
  `;
  const result = ProstQSAuditorV2.audit(code);
  assert(result.violations.some(v => v.code === 'PROST-007-BACKEND-OWN-AUTH'));
  console.log('✅ Teste 7.1: Detectar backend auth próprio');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 7.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 8: Detecção de Banco de Dados de Auth
// ============================================================================

console.log('\n📋 SUITE 8: Detecção de Banco de Dados de Auth');

try {
  const code = `
    CREATE TABLE users (
      id UUID PRIMARY KEY,
      email VARCHAR(255),
      password_hash VARCHAR(255)
    );
    
    INSERT INTO users (email, password_hash) VALUES (?, ?);
  `;
  const result = ProstQSAuditorV2.audit(code);
  assert(result.violations.some(v => v.code === 'PROST-008-DATABASE-AUTH'));
  console.log('✅ Teste 8.1: Detectar CREATE TABLE users');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 8.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 9: Detecção de Integração Direta com Stripe
// ============================================================================

console.log('\n📋 SUITE 9: Detecção de Integração Direta com Stripe');

try {
  const code = `
    import Stripe from '@stripe/stripe-js';
    const stripe = new Stripe(publishableKey);
  `;
  const result = ProstQSAuditorV2.audit(code);
  assert(result.violations.some(v => v.code === 'PROST-009-DIRECT-STRIPE'));
  console.log('✅ Teste 9.1: Detectar import Stripe');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 9.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 10: Detecção de JWT Local
// ============================================================================

console.log('\n📋 SUITE 10: Detecção de JWT Local');

try {
  const code = `
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId }, secret);
  `;
  const result = ProstQSAuditorV2.audit(code);
  assert(result.violations.some(v => v.code === 'PROST-010-LOCAL-JWT'));
  console.log('✅ Teste 10.1: Detectar jwt.sign');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 10.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 11: Detecção de Hash de Senha Local
// ============================================================================

console.log('\n📋 SUITE 11: Detecção de Hash de Senha Local');

try {
  const code = `
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash(password, 10);
  `;
  const result = ProstQSAuditorV2.audit(code);
  assert(result.violations.some(v => v.code === 'PROST-011-LOCAL-PASSWORD-HASH'));
  console.log('✅ Teste 11.1: Detectar bcrypt');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 11.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 12: Detecção de Decisão Local de Plano
// ============================================================================

console.log('\n📋 SUITE 12: Detecção de Decisão Local de Plano');

try {
  const code = `
    if (isPremium) {
      showPremiumFeature();
    }
  `;
  const result = ProstQSAuditorV2.audit(code);
  assert(result.violations.some(v => v.code === 'PROST-012-LOCAL-PLAN-DECISION'));
  console.log('✅ Teste 12.1: Detectar if (isPremium)');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 12.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 13: Código Conforme
// ============================================================================

console.log('\n📋 SUITE 13: Código Conforme');

try {
  const code = `
    import { ProstQSClient } from './prost-qs-sdk.js';
    window.prostqs = new ProstQSClient(PROST_QS_URL);
    
    const user = await window.prostqs.get('/api/v1/identity/me');
    const subscription = await window.prostqs.get('/api/v1/billing/subscriptions/active');
    
    if (window.hasActiveSubscription()) {
      showPremiumFeature();
    }
  `;
  const result = ProstQSAuditorV2.audit(code);
  assert(result.recommendation === 'APPROVE');
  assert(result.violations.length === 0);
  console.log('✅ Teste 13.1: Código conforme aprovado');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 13.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// RESUMO
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('📊 RESUMO DOS TESTES');
console.log('='.repeat(80));
console.log(`✅ Testes Passaram: ${testsPassed}`);
console.log(`❌ Testes Falharam: ${testsFailed}`);
console.log(`📈 Taxa de Sucesso: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('='.repeat(80));

if (testsFailed === 0) {
  console.log('\n🎉 TODOS OS TESTES PASSARAM!\n');
  process.exit(0);
} else {
  console.log('\n❌ ALGUNS TESTES FALHARAM\n');
  process.exit(1);
}
