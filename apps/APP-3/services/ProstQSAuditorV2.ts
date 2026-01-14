/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║        🔍 PROST-QS AUDITOR V2 - AGRESSIVO & IMPLACÁVEL 🔍                  ║
 * ║                                                                              ║
 * ║              "FASE 3.5: DETECÇÃO AGRESSIVA DE VIOLAÇÕES"                    ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Auditor v2 com detecção agressiva de:
 * - Mocks de login/demo
 * - Headers de auth confiáveis
 * - Backend próprio
 * - Lógica de plano no backend
 * - Offline sync sem validação
 */

export interface AuditViolation {
  type: 'CRITICAL' | 'SEVERE' | 'WARNING';
  code: string;
  message: string;
  line?: number;
  snippet?: string;
  fix: string;
}

export interface AuditResult {
  passed: boolean;
  score: number;
  violations: AuditViolation[];
  summary: string;
  recommendation: 'APPROVE' | 'REJECT' | 'REVIEW';
}

// ============================================================================
// PADRÕES PROIBIDOS (AGRESSIVOS)
// ============================================================================

const FORBIDDEN_PATTERNS_V2 = [
  // ========================================================================
  // TIER 1: VIOLAÇÕES CRÍTICAS (REJEIÇÃO AUTOMÁTICA)
  // ========================================================================

  {
    code: 'PROST-001-MOCK-LOGIN',
    pattern: /(?:mock|demo|example|test)\s+(?:login|credentials|email|password)|free@|pro@|demo@|test@|example\.com/i,
    type: 'CRITICAL' as const,
    message: 'Mock login/demo detectado. Credenciais de teste não são permitidas.',
    fix: 'Remova todas as credenciais de teste. Use SDK PROST-QS real.',
  },

  {
    code: 'PROST-002-LOCAL-AUTH',
    pattern: /localStorage\.setItem\s*\(\s*['"](?:auth|token|user|session|logged|isAuth)/i,
    type: 'CRITICAL' as const,
    message: 'Autenticação local em localStorage detectada.',
    fix: 'Use SDK PROST-QS: window.prostqs.get("/api/v1/identity/me")',
  },

  {
    code: 'PROST-003-LOCAL-BILLING',
    pattern: /localStorage\.setItem\s*\(\s*['"](?:premium|pro|plan|subscription|isPro|isPremium|isSubscribed)/i,
    type: 'CRITICAL' as const,
    message: 'Billing local em localStorage detectado.',
    fix: 'Use SDK PROST-QS: window.prostqs.get("/api/v1/billing/subscriptions/active")',
  },

  {
    code: 'PROST-004-MOCK-PROST-QS',
    pattern: /const\s+(?:PROST_QS|prostqs|ProstQS)\s*=\s*\{|adapter\s*:\s*\{\s*(?:fake|mock|simulate)\s*:\s*true/i,
    type: 'CRITICAL' as const,
    message: 'Mock PROST-QS detectado. Não use simulações.',
    fix: 'Importe SDK real: import { ProstQSClient } from "./prost-qs-sdk.js"',
  },

  {
    code: 'PROST-005-HEADER-AUTH',
    pattern: /X-User-ID|X-Plan-Status|X-Auth-Token|X-Subscription|headers\[['"]X-/i,
    type: 'CRITICAL' as const,
    message: 'Auth via headers confiáveis detectada. Backend não pode confiar em headers.',
    fix: 'Backend deve validar com PROST-QS, não com headers do frontend.',
  },

  {
    code: 'PROST-006-BACKEND-PLAN-LOGIC',
    pattern: /MaxFreeWorkspaces|MaxFreePages|MaxFreeUsers|MaxFreeRequests|plan\s*===\s*['"]free|plan\s*===\s*['"]pro|if\s*\(\s*plan\s*===/i,
    type: 'CRITICAL' as const,
    message: 'Backend decide plano. Apenas PROST-QS pode decidir.',
    fix: 'Remova lógica de plano do backend. Delegue ao PROST-QS.',
  },

  {
    code: 'PROST-007-BACKEND-OWN-AUTH',
    pattern: /func\s+\(\w+\s+\*?Service\)\s+(?:Login|Register|Auth|Authenticate|ValidateToken)|type\s+(?:User|Auth|Session)\s+struct\s*\{/i,
    type: 'CRITICAL' as const,
    message: 'Backend implementa auth próprio. Delegue ao PROST-QS.',
    fix: 'Remova implementação de auth. Use SDK PROST-QS.',
  },

  {
    code: 'PROST-008-DATABASE-AUTH',
    pattern: /CREATE TABLE.*users|CREATE TABLE.*auth|INSERT INTO.*users|SELECT.*FROM.*users.*password|db\.query.*auth/i,
    type: 'CRITICAL' as const,
    message: 'Banco de dados próprio para auth detectado.',
    fix: 'Remova tabelas de auth. Use PROST-QS como fonte de verdade.',
  },

  {
    code: 'PROST-009-DIRECT-STRIPE',
    pattern: /import.*stripe|require.*stripe|new\s+Stripe\s*\(|@stripe\/stripe-js/i,
    type: 'CRITICAL' as const,
    message: 'Integração direta com Stripe detectada.',
    fix: 'Billing deve ser delegado ao PROST-QS, não integrado diretamente.',
  },

  {
    code: 'PROST-010-LOCAL-JWT',
    pattern: /jwt\.sign|jsonwebtoken|crypto\.sign|hmac\s*\(|sign\s*\(\s*['"]HS256/i,
    type: 'CRITICAL' as const,
    message: 'JWT local detectado. Delegue ao PROST-QS.',
    fix: 'Remova geração de JWT. Use SDK PROST-QS.',
  },

  {
    code: 'PROST-011-LOCAL-PASSWORD-HASH',
    pattern: /bcrypt|argon2|scrypt|crypto\.pbkdf2|password\.hash|hash\s*\(\s*password/i,
    type: 'CRITICAL' as const,
    message: 'Hash de senha local detectado.',
    fix: 'Remova hash de senha. Use PROST-QS para auth.',
  },

  {
    code: 'PROST-012-LOCAL-PLAN-DECISION',
    pattern: /if\s*\(\s*(?:isPro|isPremium|hasPlan|isSubscribed|user\.plan|user\.subscription|subscription\.status)\s*\)/i,
    type: 'CRITICAL' as const,
    message: 'Decisão local de plano detectada.',
    fix: 'Use: if (window.hasActiveSubscription()) { ... }',
  },

  // ========================================================================
  // TIER 2: VIOLAÇÕES SEVERAS
  // ========================================================================

  {
    code: 'PROST-013-OFFLINE-SYNC-NO-VALIDATION',
    pattern: /IndexedDB|localStorage\.setItem.*sync|offline.*mode|sync.*queue|offline.*cache/i,
    type: 'SEVERE' as const,
    message: 'Offline sync sem validação PROST-QS detectado.',
    fix: 'Offline sync deve bloquear features premium até validar com PROST-QS.',
  },

  {
    code: 'PROST-014-INTERNAL-USER-PROFILE',
    pattern: /user\.profile|internal.*user|local.*profile|userProfile\s*=|profile\s*:\s*\{|user\.metadata/i,
    type: 'SEVERE' as const,
    message: 'Perfil de usuário interno detectado. Identidade vem do PROST-QS.',
    fix: 'Remova perfil local. Use identidade do PROST-QS.',
  },

  {
    code: 'PROST-015-BACKEND-COMPLETE',
    pattern: /func\s+main\s*\(\s*\)\s*\{|type\s+\w+Service\s+struct|router\.Post|router\.Get|database\.Connect/i,
    type: 'SEVERE' as const,
    message: 'Backend próprio completo detectado. Deve ser frontend-only.',
    fix: 'Remova backend. Use apenas frontend + PROST-QS.',
  },

  // ========================================================================
  // TIER 3: VIOLAÇÕES DE WARNING
  // ========================================================================

  {
    code: 'PROST-016-MISSING-SDK-IMPORT',
    pattern: /import.*ProstQSClient|window\.prostqs\s*=|new\s+ProstQSClient/i,
    type: 'WARNING' as const,
    message: 'SDK PROST-QS não importado ou não inicializado.',
    fix: 'Adicione: import { ProstQSClient } from "./prost-qs-sdk.js"',
  },

  {
    code: 'PROST-017-MISSING-ENDPOINT-CALLS',
    pattern: /prostqs\.get|prostqs\.post|prostqs\.put|prostqs\.delete/i,
    type: 'WARNING' as const,
    message: 'Nenhuma chamada aos endpoints PROST-QS detectada.',
    fix: 'Adicione chamadas: prostqs.get("/api/v1/identity/me")',
  },
];

// ============================================================================
// CLASSE AUDITOR V2
// ============================================================================

export class ProstQSAuditorV2 {
  /**
   * 🔍 Auditar código
   */
  public static audit(code: string): AuditResult {
    const violations: AuditViolation[] = [];

    // Detectar violações
    for (const pattern of FORBIDDEN_PATTERNS_V2) {
      const matches = code.match(pattern.pattern);
      if (matches) {
        violations.push({
          type: pattern.type,
          code: pattern.code,
          message: pattern.message,
          fix: pattern.fix,
          snippet: matches[0].substring(0, 100),
        });
      }
    }

    // Calcular score
    const criticalCount = violations.filter(v => v.type === 'CRITICAL').length;
    const severeCount = violations.filter(v => v.type === 'SEVERE').length;
    const warningCount = violations.filter(v => v.type === 'WARNING').length;

    const score = Math.max(0, 100 - (criticalCount * 30 + severeCount * 15 + warningCount * 5));

    // Determinar recomendação
    let recommendation: 'APPROVE' | 'REJECT' | 'REVIEW' = 'APPROVE';
    if (criticalCount > 0) {
      recommendation = 'REJECT';
    } else if (severeCount > 0 || warningCount > 0) {
      recommendation = 'REVIEW';
    }

    return {
      passed: recommendation !== 'REJECT',
      score,
      violations,
      summary: `${violations.length} violações detectadas (${criticalCount} críticas, ${severeCount} severas, ${warningCount} warnings)`,
      recommendation,
    };
  }

  /**
   * 📊 Gerar relatório
   */
  public static generateReport(result: AuditResult): string {
    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                  🔍 PROST-QS AUDITOR V2 - RELATÓRIO                         ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

📊 RESULTADO: ${result.recommendation}
├─ Score: ${result.score}/100
├─ Violações: ${result.violations.length}
└─ Status: ${result.passed ? '✅ PASSOU' : '❌ REJEITADO'}

📋 VIOLAÇÕES DETECTADAS
${result.violations.map((v, i) => `
${i + 1}. [${v.type}] ${v.code}
   Mensagem: ${v.message}
   Snippet: ${v.snippet}
   Fix: ${v.fix}
`).join('')}

${result.recommendation === 'REJECT' ? `
🚨 CÓDIGO REJEITADO
Corrija as violações críticas antes de submeter.
` : ''}
`;
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

export function auditCode(code: string): AuditResult {
  return ProstQSAuditorV2.audit(code);
}

export function generateAuditReport(result: AuditResult): string {
  return ProstQSAuditorV2.generateReport(result);
}
