/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║        💡 PROST-QS AUTO-SUGGESTIONS - INTELLIGENT RECOMMENDATIONS 💡        ║
 * ║                                                                              ║
 * ║                  "Sugestões automáticas para conformidade"                  ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Sistema de sugestões automáticas baseado em:
 * - Padrões de violação detectados
 * - Histórico de conformidade
 * - Tendências do time
 * - Melhores práticas
 */

import { AuditResult, AuditViolation } from './ProstQSAuditor';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface Suggestion {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  code: string;
  pattern: string;
  replacement: string;
  example: {
    before: string;
    after: string;
  };
  references: string[];
  estimatedTime: number; // em minutos
}

export interface SuggestionContext {
  violations: AuditViolation[];
  score: number;
  trend: 'improving' | 'stable' | 'declining';
  recentViolations: string[];
  teamPatterns: Record<string, number>;
}

// ============================================================================
// SUGESTÕES PRÉ-DEFINIDAS
// ============================================================================

const SUGGESTIONS_DATABASE: Record<string, Suggestion> = {
  // ========================================================================
  // VIOLAÇÕES CRÍTICAS
  // ========================================================================

  'LOCAL_AUTH': {
    id: 'LOCAL_AUTH',
    severity: 'critical',
    title: 'Autenticação Local Detectada',
    description: 'Você está implementando autenticação localmente. Isso viola a soberania do PROST-QS. Remova toda lógica de auth local e use o SDK do PROST-QS.',
    code: 'LOCAL_AUTH',
    pattern: 'localStorage.setItem.*auth|localStorage.setItem.*token|localStorage.setItem.*user',
    replacement: 'Use prostqs.post("/api/v1/auth/login", credentials)',
    example: {
      before: `// ❌ ERRADO
localStorage.setItem('auth_token', token);
localStorage.setItem('user', JSON.stringify(user));
if (localStorage.getItem('auth_token')) {
  showDashboard();
}`,
      after: `// ✅ CORRETO
const response = await prostqs.post('/api/v1/auth/login', credentials);
if (response.token) {
  // Token gerenciado pelo PROST-QS
  showDashboard();
}`,
    },
    references: [
      'PROST-QS Manifest: Auth Delegation',
      'Anti-Simulation Rules v1.1',
      'SDK Documentation: Authentication',
    ],
    estimatedTime: 15,
  },

  'MOCK_PROST_QS': {
    id: 'MOCK_PROST_QS',
    severity: 'critical',
    title: 'Mock PROST-QS Detectado',
    description: 'Você criou um objeto PROST-QS fake. Isso é uma violação crítica. Remova o mock e use o SDK real.',
    code: 'MOCK_PROST_QS',
    pattern: 'const PROST_QS.*=.*{|adapter.*fake|adapter.*mock|adapter.*simulate',
    replacement: 'import { ProstQSClient } from "./prost-qs-sdk.js"',
    example: {
      before: `// ❌ ERRADO
const PROST_QS = {
  async getAuthStatus() {
    return localStorage.getItem('isPro');
  }
};`,
      after: `// ✅ CORRETO
import { ProstQSClient } from './prost-qs-sdk.js';
window.prostqs = new ProstQSClient(PROST_QS_URL);
const status = await window.prostqs.get('/api/v1/identity/me');`,
    },
    references: [
      'PROST-QS Manifest: SDK Real',
      'Anti-Simulation Rules v1.1',
      'SDK Documentation: Initialization',
    ],
    estimatedTime: 20,
  },

  'LOCAL_BILLING': {
    id: 'LOCAL_BILLING',
    severity: 'critical',
    title: 'Billing Local Detectado',
    description: 'Você está implementando billing localmente. Isso viola a soberania do PROST-QS. Remova toda lógica de billing local e use o SDK.',
    code: 'LOCAL_BILLING',
    pattern: 'localStorage.setItem.*premium|localStorage.setItem.*subscription|localStorage.setItem.*plan|if.*isPro|if.*isPremium',
    replacement: 'Use prostqs.get("/api/v1/billing/subscriptions/active")',
    example: {
      before: `// ❌ ERRADO
localStorage.setItem('isPremium', true);
if (localStorage.getItem('isPremium')) {
  showPremiumFeature();
}`,
      after: `// ✅ CORRETO
const subscription = await prostqs.get('/api/v1/billing/subscriptions/active');
if (subscription && subscription.status === 'active') {
  showPremiumFeature();
}`,
    },
    references: [
      'PROST-QS Manifest: Billing Delegation',
      'Anti-Simulation Rules v1.1',
      'SDK Documentation: Billing',
    ],
    estimatedTime: 20,
  },

  // ========================================================================
  // VIOLAÇÕES SEVERAS
  // ========================================================================

  'MISSING_SDK_IMPORT': {
    id: 'MISSING_SDK_IMPORT',
    severity: 'high',
    title: 'SDK PROST-QS Não Importado',
    description: 'O SDK do PROST-QS não foi importado. Adicione o import no início do arquivo.',
    code: 'MISSING_SDK_IMPORT',
    pattern: 'import.*ProstQSClient',
    replacement: 'import { ProstQSClient } from "./prost-qs-sdk.js"',
    example: {
      before: `// ❌ ERRADO
// Sem import do SDK
const app = createApp();`,
      after: `// ✅ CORRETO
import { ProstQSClient } from './prost-qs-sdk.js';
window.prostqs = new ProstQSClient(PROST_QS_URL);
const app = createApp();`,
    },
    references: [
      'SDK Documentation: Installation',
      'Getting Started Guide',
    ],
    estimatedTime: 5,
  },

  'MISSING_SDK_INIT': {
    id: 'MISSING_SDK_INIT',
    severity: 'high',
    title: 'SDK PROST-QS Não Inicializado',
    description: 'O SDK foi importado mas não inicializado. Adicione a inicialização no início da aplicação.',
    code: 'MISSING_SDK_INIT',
    pattern: 'window.prostqs.*=.*new ProstQSClient',
    replacement: 'window.prostqs = new ProstQSClient(PROST_QS_URL)',
    example: {
      before: `// ❌ ERRADO
import { ProstQSClient } from './prost-qs-sdk.js';
// Sem inicialização
const app = createApp();`,
      after: `// ✅ CORRETO
import { ProstQSClient } from './prost-qs-sdk.js';
window.prostqs = new ProstQSClient(process.env.PROST_QS_URL);
const app = createApp();`,
    },
    references: [
      'SDK Documentation: Initialization',
      'Configuration Guide',
    ],
    estimatedTime: 5,
  },

  'MISSING_ENDPOINT_CALLS': {
    id: 'MISSING_ENDPOINT_CALLS',
    severity: 'high',
    title: 'Chamadas aos Endpoints PROST-QS Ausentes',
    description: 'Não há chamadas aos endpoints do PROST-QS. Adicione chamadas para auth, billing ou identity.',
    code: 'MISSING_ENDPOINT_CALLS',
    pattern: 'prostqs.get|prostqs.post|prostqs.put|prostqs.delete',
    replacement: 'Adicione chamadas aos endpoints: /api/v1/auth/login, /api/v1/billing/subscriptions/active, etc',
    example: {
      before: `// ❌ ERRADO
import { ProstQSClient } from './prost-qs-sdk.js';
window.prostqs = new ProstQSClient(PROST_QS_URL);
// Sem chamadas aos endpoints
const app = createApp();`,
      after: `// ✅ CORRETO
import { ProstQSClient } from './prost-qs-sdk.js';
window.prostqs = new ProstQSClient(PROST_QS_URL);

// Chamar endpoints
const user = await prostqs.get('/api/v1/identity/me');
const subscription = await prostqs.get('/api/v1/billing/subscriptions/active');`,
    },
    references: [
      'SDK Documentation: Endpoints',
      'API Reference',
    ],
    estimatedTime: 10,
  },

  // ========================================================================
  // VIOLAÇÕES DE WARNING
  // ========================================================================

  'MISSING_OFFLINE_HANDLING': {
    id: 'MISSING_OFFLINE_HANDLING',
    severity: 'medium',
    title: 'Tratamento de Kernel Offline Ausente',
    description: 'Não há tratamento para quando o PROST-QS está offline. Adicione try/catch e bloqueie features premium.',
    code: 'MISSING_OFFLINE_HANDLING',
    pattern: 'try.*catch|error handling',
    replacement: 'Adicione tratamento de erro com bloqueio de features premium',
    example: {
      before: `// ❌ ERRADO
const subscription = await prostqs.get('/api/v1/billing/subscriptions/active');
if (subscription.status === 'active') {
  showPremiumFeature();
}`,
      after: `// ✅ CORRETO
try {
  const subscription = await prostqs.get('/api/v1/billing/subscriptions/active');
  if (subscription.status === 'active') {
    showPremiumFeature();
  }
} catch (error) {
  // KERNEL OFFLINE - BLOQUEAR ACESSO
  showKernelOfflineError();
  disablePremiumFeatures();
}`,
    },
    references: [
      'Anti-Simulation Rules: Offline Behavior',
      'Error Handling Guide',
    ],
    estimatedTime: 10,
  },

  'MISSING_FEATURE_GATING': {
    id: 'MISSING_FEATURE_GATING',
    severity: 'medium',
    title: 'Feature Gating Ausente',
    description: 'Não há feature gating baseado em subscription. Adicione verificação de subscription antes de mostrar features premium.',
    code: 'MISSING_FEATURE_GATING',
    pattern: 'hasActiveSubscription|subscription.status',
    replacement: 'Adicione: if (window.hasActiveSubscription()) { showPremiumFeature(); }',
    example: {
      before: `// ❌ ERRADO
function showPremiumFeature() {
  // Sempre mostra, sem verificação
  renderPremiumUI();
}`,
      after: `// ✅ CORRETO
function showPremiumFeature() {
  if (window.hasActiveSubscription()) {
    renderPremiumUI();
  } else {
    showPaywall();
  }
}`,
    },
    references: [
      'Feature Gating Pattern',
      'Paywall Implementation',
    ],
    estimatedTime: 8,
  },
};

// ============================================================================
// CLASSE PRINCIPAL: AUTO-SUGGESTIONS
// ============================================================================

export class ProstQSAutoSuggestions {
  /**
   * 💡 Gerar sugestões baseado em audit result
   */
  public static generateSuggestions(auditResult: AuditResult): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const seenCodes = new Set<string>();

    // Adicionar sugestões para cada violação
    for (const violation of auditResult.violations) {
      if (!seenCodes.has(violation.code)) {
        const suggestion = SUGGESTIONS_DATABASE[violation.code];
        if (suggestion) {
          suggestions.push(suggestion);
          seenCodes.add(violation.code);
        }
      }
    }

    // Ordenar por severidade
    suggestions.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return suggestions;
  }

  /**
   * 💡 Gerar sugestões baseado em contexto
   */
  public static generateContextualSuggestions(context: SuggestionContext): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Se score muito baixo, sugerir revisão completa
    if (context.score < 30) {
      suggestions.push({
        id: 'COMPLETE_REVIEW',
        severity: 'critical',
        title: 'Revisão Completa Necessária',
        description: 'Score muito baixo. Recomenda-se revisão completa do código para conformidade PROST-QS.',
        code: 'COMPLETE_REVIEW',
        pattern: 'score < 30',
        replacement: 'Revisar todas as violações críticas',
        example: {
          before: 'Código com múltiplas violações',
          after: 'Código conforme com PROST-QS',
        },
        references: ['PROST-QS Manifest', 'Anti-Simulation Rules'],
        estimatedTime: 60,
      });
    }

    // Se tendência piorando, alertar
    if (context.trend === 'declining') {
      suggestions.push({
        id: 'TREND_ALERT',
        severity: 'high',
        title: 'Tendência de Conformidade Piorando',
        description: 'A conformidade está piorando. Revise os padrões recentes de violação.',
        code: 'TREND_ALERT',
        pattern: 'trend === declining',
        replacement: 'Investigar e corrigir padrões de violação',
        example: {
          before: 'Violações aumentando',
          after: 'Violações diminuindo',
        },
        references: ['Trend Analysis', 'Conformity Report'],
        estimatedTime: 30,
      });
    }

    // Adicionar sugestões para violações recentes
    for (const violationCode of context.recentViolations) {
      const suggestion = SUGGESTIONS_DATABASE[violationCode];
      if (suggestion && !suggestions.find(s => s.id === suggestion.id)) {
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }

  /**
   * 📋 Gerar relatório de sugestões
   */
  public static generateSuggestionsReport(suggestions: Suggestion[]): string {
    if (suggestions.length === 0) {
      return '✅ Nenhuma sugestão. Código está conforme!';
    }

    let report = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                  💡 PROST-QS AUTO-SUGGESTIONS REPORT                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

📊 RESUMO
├─ Total de Sugestões: ${suggestions.length}
├─ Críticas: ${suggestions.filter(s => s.severity === 'critical').length}
├─ Altas: ${suggestions.filter(s => s.severity === 'high').length}
├─ Médias: ${suggestions.filter(s => s.severity === 'medium').length}
└─ Baixas: ${suggestions.filter(s => s.severity === 'low').length}

⏱️ TEMPO ESTIMADO: ${suggestions.reduce((sum, s) => sum + s.estimatedTime, 0)} minutos

`;

    // Agrupar por severidade
    const bySeverity = {
      critical: suggestions.filter(s => s.severity === 'critical'),
      high: suggestions.filter(s => s.severity === 'high'),
      medium: suggestions.filter(s => s.severity === 'medium'),
      low: suggestions.filter(s => s.severity === 'low'),
    };

    for (const [severity, items] of Object.entries(bySeverity)) {
      if (items.length === 0) continue;

      const emoji = severity === 'critical' ? '🚨' :
                    severity === 'high' ? '🔴' :
                    severity === 'medium' ? '🟠' : '🟡';

      report += `${emoji} ${severity.toUpperCase()} (${items.length})\n`;
      report += '─'.repeat(80) + '\n';

      for (const suggestion of items) {
        report += `
${suggestion.id}
├─ Título: ${suggestion.title}
├─ Descrição: ${suggestion.description}
├─ Tempo: ${suggestion.estimatedTime} min
├─ Exemplo:
│  Antes:
│  ${suggestion.example.before.split('\n')[0]}
│  Depois:
│  ${suggestion.example.after.split('\n')[0]}
└─ Referências: ${suggestion.references.join(', ')}
`;
      }

      report += '\n';
    }

    return report;
  }

  /**
   * 🎯 Priorizar sugestões
   */
  public static prioritizeSuggestions(suggestions: Suggestion[], maxCount: number = 5): Suggestion[] {
    return suggestions.slice(0, maxCount);
  }

  /**
   * 📈 Calcular impacto de sugestão
   */
  public static calculateImpact(suggestion: Suggestion, currentScore: number): number {
    // Impacto baseado em severidade
    const severityImpact = {
      critical: 20,
      high: 15,
      medium: 10,
      low: 5,
    };

    return severityImpact[suggestion.severity];
  }

  /**
   * 🎓 Gerar sugestão educacional
   */
  public static generateEducationalSuggestion(violationCode: string): string {
    const suggestion = SUGGESTIONS_DATABASE[violationCode];
    if (!suggestion) return '';

    return `
📚 APRENDIZADO: ${suggestion.title}

${suggestion.description}

PADRÃO PROIBIDO:
${suggestion.pattern}

PADRÃO CORRETO:
${suggestion.replacement}

EXEMPLO:
❌ ANTES:
${suggestion.example.before}

✅ DEPOIS:
${suggestion.example.after}

REFERÊNCIAS:
${suggestion.references.map(r => `• ${r}`).join('\n')}

TEMPO ESTIMADO: ${suggestion.estimatedTime} minutos
`;
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * 💡 Gerar sugestões simples
 */
export function generateSuggestions(auditResult: AuditResult): Suggestion[] {
  return ProstQSAutoSuggestions.generateSuggestions(auditResult);
}

/**
 * 📋 Gerar relatório
 */
export function generateSuggestionsReport(suggestions: Suggestion[]): string {
  return ProstQSAutoSuggestions.generateSuggestionsReport(suggestions);
}

/**
 * 🎯 Priorizar
 */
export function prioritizeSuggestions(suggestions: Suggestion[], maxCount?: number): Suggestion[] {
  return ProstQSAutoSuggestions.prioritizeSuggestions(suggestions, maxCount);
}
