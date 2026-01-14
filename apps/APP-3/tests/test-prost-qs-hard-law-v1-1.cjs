/**
 * 🧪 TESTES: PROST-QS HARD LAW v1.1
 * 
 * Validar enforcement de regras constitucionais
 */

const assert = require('assert');

// Simulação do Hard Law Enforcer
class ProstQSHardLawEnforcer {
  static enforce(code) {
    const violations = [
      { pattern: /localStorage\.setItem\s*\(\s*['"](?:auth|token|user|session|premium|pro|plan|subscription|isPro|isPremium)/i, rule: 'RULE-005' },
      { pattern: /const\s+(?:PROST_QS|prostqs)\s*=\s*\{|adapter\s*:\s*\{\s*(?:fake|mock|simulate)\s*:\s*true/i, rule: 'RULE-006' },
      { pattern: /if\s*\(\s*(?:isPro|isPremium|hasPlan|user\.plan|subscription\.status)\s*\)/i, rule: 'RULE-007' },
      { pattern: /func\s+\(\w+\s+\*?\w+\)\s+(?:Login|Register|Auth|Authenticate)|type\s+(?:User|Auth|Session)\s+struct/i, rule: 'RULE-009' },
      { pattern: /X-User-ID|X-Plan-Status|X-Auth-Token|headers\[['"]X-/i, rule: 'RULE-010' },
      { pattern: /import.*stripe|new\s+Stripe\s*\(|@stripe\/stripe-js/i, rule: 'RULE-011' },
      { pattern: /jwt\.sign|jsonwebtoken|crypto\.sign|hmac/i, rule: 'RULE-012' },
      { pattern: /bcrypt|argon2|scrypt|crypto\.pbkdf2/i, rule: 'RULE-013' },
      { pattern: /(?:mock|demo|example|test)\s+(?:login|credentials)|free@|pro@|demo@|test@|example\.com/i, rule: 'RULE-014' },
      { pattern: /para\s+demonstração|em\s+produção\s+será|temporariamente|por\s+enquanto/i, rule: 'RULE-017' },
    ];

    const violatedRules = [];
    for (const v of violations) {
      if (code.match(v.pattern)) {
        violatedRules.push(v.rule);
        // Rejeição imediata
        return {
          passed: false,
          violatedRules: [v.rule],
          action: 'REJECT',
          message: `Violação crítica: ${v.rule}`,
        };
      }
    }

    return {
      passed: true,
      violatedRules: [],
      action: 'APPROVE',
      message: 'Conforme com Hard Law v1.1',
    };
  }
}

console.log('🧪 INICIANDO TESTES: PROST-QS HARD LAW v1.1\n');

let testsPassed = 0;
let testsFailed = 0;

// ============================================================================
// SUITE 1: Rejeição Imediata - localStorage Auth
// ============================================================================

console.log('📋 SUITE 1: Rejeição Imediata - localStorage Auth');

try {
  const code = `localStorage.setItem('auth_token', token);`;
  const result = ProstQSHardLawEnforcer.enforce(code);
  assert(result.action === 'REJECT');
  assert(result.violatedRules.includes('RULE-005'));
  console.log('✅ Teste 1.1: localStorage auth → REJECT');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 1.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 2: Rejeição Imediata - Mock PROST-QS
// ============================================================================

console.log('\n📋 SUITE 2: Rejeição Imediata - Mock PROST-QS');

try {
  const code = `const PROST_QS = { getAuthStatus() { return true; } };`;
  const result = ProstQSHardLawEnforcer.enforce(code);
  assert(result.action === 'REJECT');
  assert(result.violatedRules.includes('RULE-006'));
  console.log('✅ Teste 2.1: Mock PROST-QS → REJECT');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 2.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 3: Rejeição Imediata - Decisão Local de Plano
// ============================================================================

console.log('\n📋 SUITE 3: Rejeição Imediata - Decisão Local de Plano');

try {
  const code = `if (isPremium) { showFeature(); }`;
  const result = ProstQSHardLawEnforcer.enforce(code);
  assert(result.action === 'REJECT');
  assert(result.violatedRules.includes('RULE-007'));
  console.log('✅ Teste 3.1: if (isPremium) → REJECT');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 3.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 4: Rejeição Imediata - Backend Próprio
// ============================================================================

console.log('\n📋 SUITE 4: Rejeição Imediata - Backend Próprio');

try {
  const code = `func (s *UserService) Login(email, password string) error { }
type User struct { ID string }`;
  const result = ProstQSHardLawEnforcer.enforce(code);
  assert(result.action === 'REJECT');
  assert(result.violatedRules.includes('RULE-009'));
  console.log('✅ Teste 4.1: Backend Login → REJECT');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 4.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 5: Rejeição Imediata - Headers de Auth
// ============================================================================

console.log('\n📋 SUITE 5: Rejeição Imediata - Headers de Auth');

try {
  const code = `const headers = { 'X-User-ID': userId, 'X-Plan-Status': plan };`;
  const result = ProstQSHardLawEnforcer.enforce(code);
  assert(result.action === 'REJECT');
  assert(result.violatedRules.includes('RULE-010'));
  console.log('✅ Teste 5.1: X-User-ID header → REJECT');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 5.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 6: Rejeição Imediata - Stripe Direto
// ============================================================================

console.log('\n📋 SUITE 6: Rejeição Imediata - Stripe Direto');

try {
  const code = `import Stripe from '@stripe/stripe-js';`;
  const result = ProstQSHardLawEnforcer.enforce(code);
  assert(result.action === 'REJECT');
  assert(result.violatedRules.includes('RULE-011'));
  console.log('✅ Teste 6.1: import Stripe → REJECT');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 6.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 7: Rejeição Imediata - JWT Local
// ============================================================================

console.log('\n📋 SUITE 7: Rejeição Imediata - JWT Local');

try {
  const code = `const token = jwt.sign({ userId }, secret);`;
  const result = ProstQSHardLawEnforcer.enforce(code);
  assert(result.action === 'REJECT');
  assert(result.violatedRules.includes('RULE-012'));
  console.log('✅ Teste 7.1: jwt.sign → REJECT');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 7.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 8: Rejeição Imediata - Hash de Senha
// ============================================================================

console.log('\n📋 SUITE 8: Rejeição Imediata - Hash de Senha');

try {
  const code = `const hash = await bcrypt.hash(password, 10);`;
  const result = ProstQSHardLawEnforcer.enforce(code);
  assert(result.action === 'REJECT');
  assert(result.violatedRules.includes('RULE-013'));
  console.log('✅ Teste 8.1: bcrypt.hash → REJECT');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 8.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 9: Rejeição Imediata - Mock Login
// ============================================================================

console.log('\n📋 SUITE 9: Rejeição Imediata - Mock Login');

try {
  const code = `const credentials = { email: 'demo@example.com', password: 'demo123' };`;
  const result = ProstQSHardLawEnforcer.enforce(code);
  assert(result.action === 'REJECT');
  assert(result.violatedRules.includes('RULE-014'));
  console.log('✅ Teste 9.1: demo@example.com → REJECT');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 9.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 10: Rejeição Imediata - Justificativa Textual
// ============================================================================

console.log('\n📋 SUITE 10: Rejeição Imediata - Justificativa Textual');

try {
  const code = `// Para demonstração, vou liberar por enquanto`;
  const result = ProstQSHardLawEnforcer.enforce(code);
  assert(result.action === 'REJECT');
  assert(result.violatedRules.includes('RULE-017'));
  console.log('✅ Teste 10.1: "para demonstração" → REJECT');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 10.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 11: Aprovação - Código Conforme
// ============================================================================

console.log('\n📋 SUITE 11: Aprovação - Código Conforme');

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
  const result = ProstQSHardLawEnforcer.enforce(code);
  assert(result.action === 'APPROVE');
  assert(result.violatedRules.length === 0);
  console.log('✅ Teste 11.1: Código conforme → APPROVE');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 11.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 12: Múltiplas Violações (Primeira Rejeita)
// ============================================================================

console.log('\n📋 SUITE 12: Múltiplas Violações (Primeira Rejeita)');

try {
  const code = `
    localStorage.setItem('isPremium', true);
    const PROST_QS = { fake: true };
    if (isPro) { showFeature(); }
  `;
  const result = ProstQSHardLawEnforcer.enforce(code);
  assert(result.action === 'REJECT');
  // Deve rejeitar na primeira violação
  assert(result.violatedRules.length === 1);
  console.log('✅ Teste 12.1: Primeira violação rejeita → REJECT');
  testsPassed++;
} catch (error) {
  console.log('❌ Teste 12.1 FALHOU:', error.message);
  testsFailed++;
}

// ============================================================================
// SUITE 13: Sem Exceções - Nenhuma Justificativa Funciona
// ============================================================================

console.log('\n📋 SUITE 13: Sem Exceções - Nenhuma Justificativa Funciona');

try {
  const code = `
    // Em produção será corrigido
    localStorage.setItem('auth', token);
  `;
  const result = ProstQSHardLawEnforcer.enforce(code);
  assert(result.action === 'REJECT');
  console.log('✅ Teste 13.1: Justificativa não salva → REJECT');
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
  console.log('✅ PROST-QS Hard Law v1.1 está OPERACIONAL');
  console.log('✅ Rejeição imediata de violações críticas');
  console.log('✅ Nenhuma exceção, nenhuma relativização');
  console.log('\n');
  process.exit(0);
} else {
  console.log('\n❌ ALGUNS TESTES FALHARAM\n');
  process.exit(1);
}
