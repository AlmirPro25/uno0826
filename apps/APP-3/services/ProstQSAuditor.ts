/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║           🔍 PROST-QS AUDITOR - GUARDIÃO DA SOBERANIA 🔍                    ║
 * ║                                                                              ║
 * ║                    "NENHUMA SIMULAÇÃO PASSA DESPERCEBIDA"                    ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este auditor analisa código gerado e BLOQUEIA qualquer violação do Manifesto.
 * 
 * VIOLAÇÕES DETECTADAS:
 * - Mock de auth/billing local
 * - localStorage para estado de plano
 * - Ausência do SDK obrigatório
 * - Decisões locais de premium/pro
 * - Integração direta com Stripe
 * 
 * VERSÃO: 1.0
 * STATUS: ENFORCEMENT ATIVO
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
  score: number; // 0-100
  violations: AuditViolation[];
  summary: string;
  recommendation: 'APPROVE' | 'REJECT' | 'REVIEW';
}

// ============================================================================
// PADRÕES PROIBIDOS (REGEX)
// ============================================================================

const FORBIDDEN_PATTERNS = [
  // 🚫 MOCK DE AUTH LOCAL
  {
    pattern: /localStorage\.(get|set)Item\s*\(\s*['"`].*?(auth|user|token|session|logged|isPro|premium|plan|subscription).*?['"`]/gi,
    type: 'CRITICAL' as const,
    code: 'PROST-001',
    message: 'Estado de auth/billing armazenado em localStorage',
    fix: 'Usar SDK PROST-QS: window.prostqs.get("/api/v1/identity/me")'
  },
  
  // 🚫 DECISÃO LOCAL DE PLANO
  {
    pattern: /if\s*\(\s*(isPro|isPremium|hasPlan|isSubscribed|user\.plan|user\.subscription)\s*\)/gi,
    type: 'CRITICAL' as const,
    code: 'PROST-002',
    message: 'Decisão de plano feita localmente',
    fix: 'Usar: if (window.hasActiveSubscription()) { ... }'
  },
  
  // 🚫 UPGRADE LOCAL
  {
    pattern: /(upgrade|subscribe|setPremium|setIsPro)\s*\(\s*\)\s*{[^}]*localStorage/gi,
    type: 'CRITICAL' as const,
    code: 'PROST-003',
    message: 'Função de upgrade usando localStorage',
    fix: 'Usar SDK: window.prostqs.post("/api/v1/billing/subscriptions", {...})'
  },
  
  // 🚫 MOCK DE PROST-QS
  {
    pattern: /const\s+(PROST_QS|prostqs|ProstQS)\s*=\s*{[^}]*(localStorage|mock|fake|simulate)/gi,
    type: 'CRITICAL' as const,
    code: 'PROST-004',
    message: 'Mock/simulação do PROST-QS detectado',
    fix: 'Importar SDK real: import { ProstQSClient } from "./prost-qs-sdk.js"'
  },
  
  // 🚫 INTEGRAÇÃO DIRETA COM STRIPE
  {
    pattern: /import\s+.*?stripe|require\s*\(\s*['"`]stripe['"`]\s*\)|new\s+Stripe\s*\(/gi,
    type: 'CRITICAL' as const,
    code: 'PROST-005',
    message: 'Integração direta com Stripe detectada',
    fix: 'Billing deve ser delegado ao PROST-QS, não integrado diretamente'
  },
  
  // 🚫 HASH DE SENHA LOCAL
  {
    pattern: /(bcrypt|argon2|scrypt|pbkdf2)\.(hash|compare|verify)/gi,
    type: 'CRITICAL' as const,
    code: 'PROST-006',
    message: 'Hash de senha implementado localmente',
    fix: 'Auth deve ser delegado ao PROST-QS'
  },
  
  // 🚫 JWT LOCAL
  {
    pattern: /(jwt|jsonwebtoken)\.(sign|verify|decode)/gi,
    type: 'CRITICAL' as const,
    code: 'PROST-007',
    message: 'JWT implementado localmente',
    fix: 'Tokens devem vir do PROST-QS'
  },
  
  // 🚫 TABELA DE USUÁRIOS
  {
    pattern: /(CREATE\s+TABLE|model\s+User|interface\s+User.*password|users\s*=\s*\[)/gi,
    type: 'SEVERE' as const,
    code: 'PROST-008',
    message: 'Tabela/modelo de usuários detectado',
    fix: 'Usuários são gerenciados pelo PROST-QS'
  },
  
  // 🚫 ADAPTER FAKE
  {
    pattern: /adapter.*?{[^}]*(fake|mock|simulate|localStorage)/gi,
    type: 'CRITICAL' as const,
    code: 'PROST-009',
    message: 'Adapter fake detectado',
    fix: 'Usar SDK real do PROST-QS'
  },
  
  // ⚠️ AUSÊNCIA DE SDK (verificado separadamente)
  {
    pattern: /prost-qs-sdk/gi,
    type: 'WARNING' as const,
    code: 'PROST-010',
    message: 'SDK do PROST-QS não encontrado',
    fix: 'Adicionar: import { ProstQSClient } from "./prost-qs-sdk.js"',
    invert: true // Violação se NÃO encontrar
  }
];

// ============================================================================
// PADRÕES OBRIGATÓRIOS
// ============================================================================

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


// ============================================================================
// CLASSE PRINCIPAL: PROST-QS AUDITOR
// ============================================================================

export class ProstQSAuditor {
  private violations: AuditViolation[] = [];
  private score: number = 100;
  
  /**
   * 🔍 Audita código gerado contra o Manifesto PROST-QS
   */
  audit(code: string, filename?: string): AuditResult {
    this.violations = [];
    this.score = 100;
    
    // 1. Verificar padrões proibidos
    this.checkForbiddenPatterns(code);
    
    // 2. Verificar padrões obrigatórios
    this.checkRequiredPatterns(code);
    
    // 3. Calcular score final
    const finalScore = Math.max(0, this.score);
    
    // 4. Determinar recomendação
    let recommendation: 'APPROVE' | 'REJECT' | 'REVIEW';
    if (this.violations.some(v => v.type === 'CRITICAL')) {
      recommendation = 'REJECT';
    } else if (this.violations.some(v => v.type === 'SEVERE')) {
      recommendation = 'REVIEW';
    } else if (finalScore >= 80) {
      recommendation = 'APPROVE';
    } else {
      recommendation = 'REVIEW';
    }
    
    // 5. Gerar sumário
    const criticalCount = this.violations.filter(v => v.type === 'CRITICAL').length;
    const severeCount = this.violations.filter(v => v.type === 'SEVERE').length;
    const warningCount = this.violations.filter(v => v.type === 'WARNING').length;
    
    let summary = '';
    if (recommendation === 'REJECT') {
      summary = `❌ CÓDIGO REJEITADO: ${criticalCount} violações críticas do Manifesto PROST-QS`;
    } else if (recommendation === 'REVIEW') {
      summary = `⚠️ REVISÃO NECESSÁRIA: ${severeCount} violações severas encontradas`;
    } else {
      summary = `✅ CÓDIGO APROVADO: Conformidade com Manifesto PROST-QS (${finalScore}/100)`;
    }
    
    return {
      passed: recommendation === 'APPROVE',
      score: finalScore,
      violations: this.violations,
      summary,
      recommendation
    };
  }
  
  /**
   * Verifica padrões proibidos
   */
  private checkForbiddenPatterns(code: string): void {
    for (const rule of FORBIDDEN_PATTERNS) {
      const matches = code.match(rule.pattern);
      
      if (rule.invert) {
        // Violação se NÃO encontrar
        if (!matches) {
          this.addViolation({
            type: rule.type,
            code: rule.code,
            message: rule.message,
            fix: rule.fix
          });
        }
      } else {
        // Violação se encontrar
        if (matches) {
          for (const match of matches) {
            this.addViolation({
              type: rule.type,
              code: rule.code,
              message: rule.message,
              snippet: match.substring(0, 100),
              fix: rule.fix
            });
          }
        }
      }
    }
  }
  
  /**
   * Verifica padrões obrigatórios
   */
  private checkRequiredPatterns(code: string): void {
    for (const rule of REQUIRED_PATTERNS) {
      const found = rule.pattern.test(code);
      
      if (!found) {
        this.addViolation({
          type: 'WARNING',
          code: rule.code,
          message: rule.message,
          fix: `Adicionar padrão obrigatório`
        });
        this.score -= rule.weight;
      }
    }
  }
  
  /**
   * Adiciona violação
   */
  private addViolation(violation: AuditViolation): void {
    this.violations.push(violation);
    
    // Penalizar score
    switch (violation.type) {
      case 'CRITICAL':
        this.score -= 50;
        break;
      case 'SEVERE':
        this.score -= 25;
        break;
      case 'WARNING':
        this.score -= 10;
        break;
    }
  }
  
  /**
   * 📊 Gera relatório formatado
   */
  generateReport(result: AuditResult): string {
    let report = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║           🔍 RELATÓRIO DE AUDITORIA PROST-QS 🔍                             ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

📊 RESULTADO: ${result.recommendation}
📈 SCORE: ${result.score}/100
📝 SUMÁRIO: ${result.summary}

`;

    if (result.violations.length > 0) {
      report += `
═══════════════════════════════════════════════════════════════════════════════
🚨 VIOLAÇÕES ENCONTRADAS (${result.violations.length})
═══════════════════════════════════════════════════════════════════════════════

`;
      
      for (const v of result.violations) {
        const icon = v.type === 'CRITICAL' ? '🔴' : v.type === 'SEVERE' ? '🟠' : '🟡';
        report += `${icon} [${v.code}] ${v.type}
   Mensagem: ${v.message}
   ${v.snippet ? `Trecho: "${v.snippet}..."` : ''}
   Correção: ${v.fix}

`;
      }
    }
    
    report += `
═══════════════════════════════════════════════════════════════════════════════
📜 REGRA DE OURO DO MANIFESTO
═══════════════════════════════════════════════════════════════════════════════

"O app PERGUNTA. O PROST-QS RESPONDE."
"O app não sabe de billing. O PROST-QS sabe."
"O app não valida auth. O PROST-QS valida."
"O app não decide. O PROST-QS decide."

═══════════════════════════════════════════════════════════════════════════════
`;
    
    return report;
  }
}

// ============================================================================
// FUNÇÃO DE CONVENIÊNCIA
// ============================================================================

/**
 * Audita código e retorna resultado
 */
export function auditProstQSCompliance(code: string): AuditResult {
  const auditor = new ProstQSAuditor();
  return auditor.audit(code);
}

/**
 * Audita e gera relatório formatado
 */
export function auditAndReport(code: string): string {
  const auditor = new ProstQSAuditor();
  const result = auditor.audit(code);
  return auditor.generateReport(result);
}

/**
 * Verifica se código passa na auditoria (para uso em pipelines)
 */
export function isCompliant(code: string): boolean {
  const result = auditProstQSCompliance(code);
  return result.passed;
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default ProstQSAuditor;
