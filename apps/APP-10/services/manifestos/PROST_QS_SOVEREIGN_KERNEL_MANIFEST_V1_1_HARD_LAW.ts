/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║     👑 PROST-QS SOVEREIGN KERNEL v1.1 - HARD LAW (NÃO INTERPRETÁVEL) 👑    ║
 * ║                                                                              ║
 * ║                    "REGRAS SEM ESPAÇO PARA RACIONALIZAÇÃO"                  ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * VERSÃO: 1.1 HARD LAW
 * STATUS: ENFORCEMENT TOTAL
 * DATA: 28 de Dezembro de 2025
 * 
 * Este manifesto define regras CONSTITUCIONAIS que NÃO podem ser interpretadas,
 * relativizadas ou contornadas. Cada regra é uma IF/THEN/REJECT.
 */

// ============================================================================
// DIRETIVA SUPREMA (IMUTÁVEL)
// ============================================================================

export const SUPREME_DIRECTIVE = `
👑 DIRETIVA SUPREMA - IMUTÁVEL

"Todo app criado para este ecossistema é um CLIENTE do PROST-QS.
O app não tem soberania. O PROST-QS tem.
Não há exceções. Não há 'mas em produção'. Não há 'para demonstração'.
Se o PROST-QS for mencionado, TODAS as regras abaixo são OBRIGATÓRIAS."
`;

// ============================================================================
// REGRAS CONSTITUCIONAIS (IF/THEN/REJECT)
// ============================================================================

export const CONSTITUTIONAL_RULES = [
  {
    id: 'RULE-001',
    title: 'PROST-QS Mencionado → SDK Real Obrigatório',
    condition: 'IF código menciona "PROST-QS" OR "prost-qs" OR "prostqs"',
    then: 'THEN código DEVE importar SDK real: import { ProstQSClient } from "./prost-qs-sdk.js"',
    else: 'ELSE REJECT com mensagem: "SDK PROST-QS não importado"',
    severity: 'CRITICAL',
    noExceptions: true,
  },

  {
    id: 'RULE-002',
    title: 'SDK Importado → Inicialização Obrigatória',
    condition: 'IF código importa ProstQSClient',
    then: 'THEN código DEVE inicializar: window.prostqs = new ProstQSClient(PROST_QS_URL)',
    else: 'ELSE REJECT com mensagem: "SDK não inicializado"',
    severity: 'CRITICAL',
    noExceptions: true,
  },

  {
    id: 'RULE-003',
    title: 'Auth Mencionado → Delegação Obrigatória',
    condition: 'IF código menciona "auth" OR "login" OR "register" OR "autenticação"',
    then: 'THEN código DEVE usar SDK: prostqs.post("/api/v1/auth/login", ...) ou prostqs.post("/api/v1/auth/register", ...)',
    else: 'ELSE REJECT com mensagem: "Auth local detectado"',
    severity: 'CRITICAL',
    noExceptions: true,
  },

  {
    id: 'RULE-004',
    title: 'Billing Mencionado → Delegação Obrigatória',
    condition: 'IF código menciona "billing" OR "subscription" OR "plano" OR "premium" OR "pro"',
    then: 'THEN código DEVE usar SDK: prostqs.get("/api/v1/billing/subscriptions/active")',
    else: 'ELSE REJECT com mensagem: "Billing local detectado"',
    severity: 'CRITICAL',
    noExceptions: true,
  },

  {
    id: 'RULE-005',
    title: 'localStorage Proibido para Auth/Billing',
    condition: 'IF código contém localStorage.setItem com chaves: auth, token, user, session, premium, pro, plan, subscription, isPro, isPremium',
    then: 'THEN REJECT imediatamente',
    else: 'ELSE continuar',
    severity: 'CRITICAL',
    noExceptions: true,
  },

  {
    id: 'RULE-006',
    title: 'Mock PROST-QS Proibido',
    condition: 'IF código contém: const PROST_QS = { ... } OR adapter: { fake: true } OR adapter: { mock: true } OR adapter: { simulate: true }',
    then: 'THEN REJECT imediatamente',
    else: 'ELSE continuar',
    severity: 'CRITICAL',
    noExceptions: true,
  },

  {
    id: 'RULE-007',
    title: 'Decisão Local de Plano Proibida',
    condition: 'IF código contém: if (isPro) OR if (isPremium) OR if (user.plan) OR if (subscription.status)',
    then: 'THEN REJECT imediatamente',
    else: 'ELSE continuar',
    severity: 'CRITICAL',
    noExceptions: true,
  },

  {
    id: 'RULE-008',
    title: 'Feature Gating Obrigatório',
    condition: 'IF código menciona "premium" OR "pro" OR "feature" com acesso restrito',
    then: 'THEN código DEVE usar: if (window.hasActiveSubscription()) { showFeature(); } else { showPaywall(); }',
    else: 'ELSE REJECT com mensagem: "Feature gating não implementado"',
    severity: 'CRITICAL',
    noExceptions: true,
  },

  {
    id: 'RULE-009',
    title: 'Backend Próprio Proibido',
    condition: 'IF código contém: func (s *Service) Login OR type User struct OR CREATE TABLE users OR INSERT INTO users',
    then: 'THEN REJECT imediatamente',
    else: 'ELSE continuar',
    severity: 'CRITICAL',
    noExceptions: true,
  },

  {
    id: 'RULE-010',
    title: 'Headers de Auth Proibidos',
    condition: 'IF código contém: X-User-ID OR X-Plan-Status OR X-Auth-Token OR headers["X-',
    then: 'THEN REJECT imediatamente',
    else: 'ELSE continuar',
    severity: 'CRITICAL',
    noExceptions: true,
  },

  {
    id: 'RULE-011',
    title: 'Integração Direta com Stripe Proibida',
    condition: 'IF código contém: import Stripe OR new Stripe( OR @stripe/stripe-js',
    then: 'THEN REJECT imediatamente',
    else: 'ELSE continuar',
    severity: 'CRITICAL',
    noExceptions: true,
  },

  {
    id: 'RULE-012',
    title: 'JWT Local Proibido',
    condition: 'IF código contém: jwt.sign OR jsonwebtoken OR crypto.sign OR hmac',
    then: 'THEN REJECT imediatamente',
    else: 'ELSE continuar',
    severity: 'CRITICAL',
    noExceptions: true,
  },

  {
    id: 'RULE-013',
    title: 'Hash de Senha Local Proibido',
    condition: 'IF código contém: bcrypt OR argon2 OR scrypt OR crypto.pbkdf2',
    then: 'THEN REJECT imediatamente',
    else: 'ELSE continuar',
    severity: 'CRITICAL',
    noExceptions: true,
  },

  {
    id: 'RULE-014',
    title: 'Mock Login Proibido',
    condition: 'IF código contém: demo@ OR test@ OR example@ OR free@ OR pro@ OR mock login OR example credentials',
    then: 'THEN REJECT imediatamente',
    else: 'ELSE continuar',
    severity: 'CRITICAL',
    noExceptions: true,
  },

  {
    id: 'RULE-015',
    title: 'Offline Sem Validação Proibido',
    condition: 'IF código contém: IndexedDB OR offline sync OR offline cache SEM try/catch validando PROST-QS',
    then: 'THEN REJECT imediatamente',
    else: 'ELSE continuar',
    severity: 'CRITICAL',
    noExceptions: true,
  },

  {
    id: 'RULE-016',
    title: 'Kernel Offline → Bloqueio Obrigatório',
    condition: 'IF PROST-QS não responde (erro de conexão)',
    then: 'THEN app DEVE bloquear features premium, exibir erro, entrar em modo read-only',
    else: 'ELSE NUNCA simular ou liberar acesso',
    severity: 'CRITICAL',
    noExceptions: true,
  },

  {
    id: 'RULE-017',
    title: 'Nenhuma Justificativa Textual Relativiza Regras',
    condition: 'IF código contém comentários como: "para demonstração" OR "em produção será" OR "temporariamente" OR "por enquanto"',
    then: 'THEN REJECT imediatamente',
    else: 'ELSE continuar',
    severity: 'CRITICAL',
    noExceptions: true,
  },

  {
    id: 'RULE-018',
    title: 'Auditoria Automática Obrigatória',
    condition: 'IF código é gerado para este ecossistema',
    then: 'THEN código DEVE passar por ProstQSAuditorV2 com score >= 80 E zero violações críticas',
    else: 'ELSE REJECT antes de retornar ao usuário',
    severity: 'CRITICAL',
    noExceptions: true,
  },

  {
    id: 'RULE-019',
    title: 'CI Gate Obrigatório',
    condition: 'IF código é commitado para repositório',
    then: 'THEN código DEVE passar por ProstQSCIGate com decisão APPROVE',
    else: 'ELSE merge é bloqueado',
    severity: 'CRITICAL',
    noExceptions: true,
  },

  {
    id: 'RULE-020',
    title: 'Conformidade é Métrica de Qualidade',
    condition: 'IF app usa PROST-QS',
    then: 'THEN conformidade PROST-QS é métrica obrigatória de qualidade (não opcional)',
    else: 'ELSE app não é considerado production-ready',
    severity: 'CRITICAL',
    noExceptions: true,
  },
];

// ============================================================================
// PADRÕES DETECTÁVEIS (REGEX)
// ============================================================================

export const DETECTABLE_VIOLATIONS = [
  // Tier 1: Rejeição Automática Imediata
  {
    pattern: /localStorage\.setItem\s*\(\s*['"](?:auth|token|user|session|logged|isAuth|premium|pro|plan|subscription|isPro|isPremium)/i,
    rule: 'RULE-005',
    action: 'REJECT_IMMEDIATE',
  },
  {
    pattern: /const\s+(?:PROST_QS|prostqs)\s*=\s*\{|adapter\s*:\s*\{\s*(?:fake|mock|simulate)\s*:\s*true/i,
    rule: 'RULE-006',
    action: 'REJECT_IMMEDIATE',
  },
  {
    pattern: /if\s*\(\s*(?:isPro|isPremium|hasPlan|user\.plan|subscription\.status)\s*\)/i,
    rule: 'RULE-007',
    action: 'REJECT_IMMEDIATE',
  },
  {
    pattern: /func\s+\(\w+\s+\*?Service\)\s+(?:Login|Register|Auth)|type\s+(?:User|Auth|Session)\s+struct/i,
    rule: 'RULE-009',
    action: 'REJECT_IMMEDIATE',
  },
  {
    pattern: /X-User-ID|X-Plan-Status|X-Auth-Token|headers\[['"]X-/i,
    rule: 'RULE-010',
    action: 'REJECT_IMMEDIATE',
  },
  {
    pattern: /import.*stripe|new\s+Stripe\s*\(|@stripe\/stripe-js/i,
    rule: 'RULE-011',
    action: 'REJECT_IMMEDIATE',
  },
  {
    pattern: /jwt\.sign|jsonwebtoken|crypto\.sign|hmac/i,
    rule: 'RULE-012',
    action: 'REJECT_IMMEDIATE',
  },
  {
    pattern: /bcrypt|argon2|scrypt|crypto\.pbkdf2/i,
    rule: 'RULE-013',
    action: 'REJECT_IMMEDIATE',
  },
  {
    pattern: /(?:mock|demo|example|test)\s+(?:login|credentials)|free@|pro@|demo@|test@|example\.com/i,
    rule: 'RULE-014',
    action: 'REJECT_IMMEDIATE',
  },
  {
    pattern: /para\s+demonstração|em\s+produção\s+será|temporariamente|por\s+enquanto/i,
    rule: 'RULE-017',
    action: 'REJECT_IMMEDIATE',
  },
];

// ============================================================================
// ENFORCEMENT ENGINE
// ============================================================================

export interface EnforcementResult {
  passed: boolean;
  violatedRules: string[];
  action: 'APPROVE' | 'REJECT' | 'REVIEW';
  message: string;
}

export class ProstQSHardLawEnforcer {
  /**
   * 🚨 Enforçar regras constitucionais
   */
  public static enforce(code: string): EnforcementResult {
    const violatedRules: string[] = [];

    // Verificar cada violação detectável
    for (const violation of DETECTABLE_VIOLATIONS) {
      if (code.match(violation.pattern)) {
        violatedRules.push(violation.rule);

        // Se é rejeição imediata, retornar agora
        if (violation.action === 'REJECT_IMMEDIATE') {
          return {
            passed: false,
            violatedRules: [violation.rule],
            action: 'REJECT',
            message: `Violação crítica detectada: ${violation.rule}. Rejeição automática.`,
          };
        }
      }
    }

    // Se passou em todas as verificações
    if (violatedRules.length === 0) {
      return {
        passed: true,
        violatedRules: [],
        action: 'APPROVE',
        message: 'Código conforme com PROST-QS Hard Law v1.1',
      };
    }

    return {
      passed: false,
      violatedRules,
      action: 'REJECT',
      message: `${violatedRules.length} regras constitucionais violadas.`,
    };
  }

  /**
   * 📋 Gerar relatório de enforcement
   */
  public static generateEnforcementReport(result: EnforcementResult): string {
    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║              👑 PROST-QS HARD LAW v1.1 - ENFORCEMENT REPORT                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

🚨 RESULTADO: ${result.action}
├─ Status: ${result.passed ? '✅ PASSOU' : '❌ REJEITADO'}
├─ Regras Violadas: ${result.violatedRules.length}
└─ Mensagem: ${result.message}

${result.violatedRules.length > 0 ? `
📋 REGRAS VIOLADAS
${result.violatedRules.map((rule, i) => {
  const ruleObj = CONSTITUTIONAL_RULES.find(r => r.id === rule);
  return `
${i + 1}. ${rule}: ${ruleObj?.title}
   Condição: ${ruleObj?.condition}
   Ação: ${ruleObj?.then}
   Severidade: ${ruleObj?.severity}
   Sem Exceções: ${ruleObj?.noExceptions ? 'SIM' : 'NÃO'}
`;
}).join('')}
` : ''}

${result.action === 'REJECT' ? `
🚫 CÓDIGO REJEITADO
Nenhuma justificativa textual pode relativizar estas regras.
Corrija as violações e tente novamente.
` : `
✅ CÓDIGO APROVADO
Conforme com PROST-QS Hard Law v1.1
Pronto para merge.
`}
`;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  version: '1.1',
  status: 'HARD_LAW',
  supremeDirective: SUPREME_DIRECTIVE,
  constitutionalRules: CONSTITUTIONAL_RULES,
  detectableViolations: DETECTABLE_VIOLATIONS,
  enforcer: ProstQSHardLawEnforcer,
};
