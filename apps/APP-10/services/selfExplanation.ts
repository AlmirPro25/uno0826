// ============================================================================
// 🧠 FASE 9 — SELF-EXPLANATION LEDGER
// ============================================================================
// "Por que decidi NÃO fazer isso?"
//
// O sistema não só loga o que fez, mas também o que decidiu não fazer.
// Isso é crucial para:
// - Debugging cognitivo ("por que não deletou?")
// - Auditoria ("o sistema considerou X?")
// - Confiança ("ele pensou antes de agir")

import { Intent } from './executionLedger';
import { AuthorityLevel } from './authority';
import { PolicyDecision } from './policy';

// ============================================================================
// TYPES
// ============================================================================

export type DecisionType = 
  | 'blocked_by_authority'    // Não tinha permissão
  | 'blocked_by_policy'       // Policy disse não
  | 'blocked_by_capability'   // Tecnicamente impossível
  | 'blocked_by_loop'         // Já tentou demais
  | 'blocked_by_memory'       // Padrão perigoso detectado
  | 'skipped_identical'       // Ação idêntica já executada
  | 'escalation_denied'       // Não conseguiu escalar
  | 'confirmation_required'   // Precisava confirm, não tinha
  | 'alternative_suggested'   // Sugeriu outro caminho
  | 'self_correction';        // Agente se corrigiu

export interface NonDecision {
  id: string;
  timestamp: number;
  type: DecisionType;
  
  // O que foi considerado
  tool: string;
  args: Record<string, any>;
  intent: Intent;
  
  // Por que não fez
  reason: string;
  technicalReason?: string;  // Para debug
  
  // Contexto
  authorityLevel?: AuthorityLevel;
  policyDecision?: PolicyDecision;
  riskScore?: number;
  
  // Alternativa (se houver)
  suggestedAlternative?: string;
  
  // Explicação human-readable
  explanation: string;
}

export interface ExplanationSummary {
  totalDecisions: number;
  byType: Record<DecisionType, number>;
  mostBlockedTool: string | null;
  mostCommonReason: string | null;
  suggestions: string[];
}

// ============================================================================
// STORE
// ============================================================================

let nonDecisions: NonDecision[] = [];
let sessionId: string | null = null;

// ============================================================================
// EXPLANATION GENERATORS
// ============================================================================

const generateExplanation = (
  type: DecisionType,
  tool: string,
  reason: string,
  context: Partial<NonDecision>
): string => {
  switch (type) {
    case 'blocked_by_authority':
      return `Não executei "${tool}" porque não tenho autoridade suficiente. ` +
             `Nível atual: ${context.authorityLevel || 'desconhecido'}. ${reason}`;
    
    case 'blocked_by_policy':
      return `Decidi não executar "${tool}" porque a política do sistema não permite. ` +
             `${reason}` +
             (context.suggestedAlternative ? ` Alternativa: ${context.suggestedAlternative}` : '');
    
    case 'blocked_by_capability':
      return `Não posso executar "${tool}" porque o ambiente atual não suporta. ${reason}`;
    
    case 'blocked_by_loop':
      return `Parei de tentar "${tool}" porque já tentei várias vezes sem sucesso. ` +
             `Isso evita loops infinitos. ${reason}`;
    
    case 'blocked_by_memory':
      return `Não executei "${tool}" porque detectei um padrão perigoso no histórico recente. ` +
             `${reason}`;
    
    case 'skipped_identical':
      return `Pulei "${tool}" porque essa exata ação já foi executada. Não há necessidade de repetir.`;
    
    case 'escalation_denied':
      return `Tentei obter permissão para "${tool}" mas a escalação foi negada. ` +
             `${reason}`;
    
    case 'confirmation_required':
      return `"${tool}" requer confirmação explícita do usuário. ` +
             `Risco: ${context.riskScore || 'desconhecido'}/100. ${reason}`;
    
    case 'alternative_suggested':
      return `Em vez de "${tool}", sugiro: ${context.suggestedAlternative || reason}`;
    
    case 'self_correction':
      return `Me corrigi antes de executar "${tool}". ${reason}`;
    
    default:
      return `Não executei "${tool}": ${reason}`;
  }
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Iniciar sessão de explicações
 */
export const startSession = (id: string): void => {
  sessionId = id;
  nonDecisions = [];
  console.log(`📝 [SELF-EXPLAIN] Session started: ${id}`);
};

/**
 * Registrar uma não-decisão
 */
export const logNonDecision = (
  type: DecisionType,
  tool: string,
  args: Record<string, any>,
  intent: Intent,
  reason: string,
  context: Partial<Omit<NonDecision, 'id' | 'timestamp' | 'type' | 'tool' | 'args' | 'intent' | 'reason' | 'explanation'>> = {}
): NonDecision => {
  const explanation = generateExplanation(type, tool, reason, { ...context, tool });
  
  const decision: NonDecision = {
    id: `nd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    type,
    tool,
    args,
    intent,
    reason,
    explanation,
    ...context,
  };
  
  nonDecisions.push(decision);
  
  console.log(`📝 [SELF-EXPLAIN] ${type}: ${tool} - ${reason}`);
  
  return decision;
};

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Logar bloqueio por autoridade
 */
export const logAuthorityBlock = (
  tool: string,
  args: Record<string, any>,
  intent: Intent,
  currentLevel: AuthorityLevel,
  requiredLevel: AuthorityLevel
): NonDecision => {
  return logNonDecision(
    'blocked_by_authority',
    tool,
    args,
    intent,
    `Requer ${requiredLevel}, atual é ${currentLevel}`,
    { authorityLevel: currentLevel }
  );
};

/**
 * Logar bloqueio por policy
 */
export const logPolicyBlock = (
  tool: string,
  args: Record<string, any>,
  intent: Intent,
  policyDecision: PolicyDecision,
  reason: string,
  riskScore?: number,
  alternative?: string
): NonDecision => {
  return logNonDecision(
    'blocked_by_policy',
    tool,
    args,
    intent,
    reason,
    { policyDecision, riskScore, suggestedAlternative: alternative }
  );
};

/**
 * Logar bloqueio por capability
 */
export const logCapabilityBlock = (
  tool: string,
  args: Record<string, any>,
  intent: Intent,
  missingCapability: string
): NonDecision => {
  return logNonDecision(
    'blocked_by_capability',
    tool,
    args,
    intent,
    `Capability ausente: ${missingCapability}`
  );
};

/**
 * Logar bloqueio por loop
 */
export const logLoopBlock = (
  tool: string,
  args: Record<string, any>,
  intent: Intent,
  attempts: number
): NonDecision => {
  return logNonDecision(
    'blocked_by_loop',
    tool,
    args,
    intent,
    `${attempts} tentativas já realizadas`
  );
};

/**
 * Logar bloqueio por memória (padrão perigoso)
 */
export const logMemoryBlock = (
  tool: string,
  args: Record<string, any>,
  intent: Intent,
  patternName: string,
  recommendation: string
): NonDecision => {
  return logNonDecision(
    'blocked_by_memory',
    tool,
    args,
    intent,
    `Padrão detectado: ${patternName}. Recomendação: ${recommendation}`
  );
};

/**
 * Logar ação idêntica pulada
 */
export const logSkippedIdentical = (
  tool: string,
  args: Record<string, any>,
  intent: Intent
): NonDecision => {
  return logNonDecision(
    'skipped_identical',
    tool,
    args,
    intent,
    'Ação idêntica já executada nesta sessão'
  );
};

/**
 * Logar necessidade de confirmação
 */
export const logConfirmationRequired = (
  tool: string,
  args: Record<string, any>,
  intent: Intent,
  reason: string,
  riskScore: number
): NonDecision => {
  return logNonDecision(
    'confirmation_required',
    tool,
    args,
    intent,
    reason,
    { riskScore }
  );
};

/**
 * Logar sugestão de alternativa
 */
export const logAlternativeSuggested = (
  tool: string,
  args: Record<string, any>,
  intent: Intent,
  alternative: string,
  reason: string
): NonDecision => {
  return logNonDecision(
    'alternative_suggested',
    tool,
    args,
    intent,
    reason,
    { suggestedAlternative: alternative }
  );
};

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Obter todas as não-decisões da sessão
 */
export const getNonDecisions = (): NonDecision[] => [...nonDecisions];

/**
 * Obter não-decisões por tipo
 */
export const getByType = (type: DecisionType): NonDecision[] => {
  return nonDecisions.filter(d => d.type === type);
};

/**
 * Obter não-decisões para uma tool específica
 */
export const getForTool = (tool: string): NonDecision[] => {
  return nonDecisions.filter(d => d.tool === tool);
};

/**
 * Obter última não-decisão
 */
export const getLastNonDecision = (): NonDecision | null => {
  return nonDecisions.length > 0 ? nonDecisions[nonDecisions.length - 1] : null;
};

// ============================================================================
// SUMMARY & ANALYSIS
// ============================================================================

/**
 * Gerar resumo das não-decisões
 */
export const getSummary = (): ExplanationSummary => {
  const byType: Record<DecisionType, number> = {
    'blocked_by_authority': 0,
    'blocked_by_policy': 0,
    'blocked_by_capability': 0,
    'blocked_by_loop': 0,
    'blocked_by_memory': 0,
    'skipped_identical': 0,
    'escalation_denied': 0,
    'confirmation_required': 0,
    'alternative_suggested': 0,
    'self_correction': 0,
  };
  
  const toolCounts = new Map<string, number>();
  const reasonCounts = new Map<string, number>();
  const suggestions: string[] = [];
  
  for (const decision of nonDecisions) {
    byType[decision.type]++;
    toolCounts.set(decision.tool, (toolCounts.get(decision.tool) || 0) + 1);
    reasonCounts.set(decision.reason, (reasonCounts.get(decision.reason) || 0) + 1);
    
    if (decision.suggestedAlternative) {
      suggestions.push(decision.suggestedAlternative);
    }
  }
  
  // Encontrar tool mais bloqueada
  let mostBlockedTool: string | null = null;
  let maxToolCount = 0;
  for (const [tool, count] of toolCounts) {
    if (count > maxToolCount) {
      maxToolCount = count;
      mostBlockedTool = tool;
    }
  }
  
  // Encontrar razão mais comum
  let mostCommonReason: string | null = null;
  let maxReasonCount = 0;
  for (const [reason, count] of reasonCounts) {
    if (count > maxReasonCount) {
      maxReasonCount = count;
      mostCommonReason = reason;
    }
  }
  
  return {
    totalDecisions: nonDecisions.length,
    byType,
    mostBlockedTool,
    mostCommonReason,
    suggestions: [...new Set(suggestions)], // Unique
  };
};

/**
 * Gerar explicação narrativa da sessão
 */
export const getNarrativeExplanation = (): string => {
  if (nonDecisions.length === 0) {
    return 'Nenhuma ação foi bloqueada ou pulada nesta sessão.';
  }
  
  const summary = getSummary();
  const lines: string[] = [];
  
  lines.push(`📝 Resumo de Decisões Não-Tomadas (${summary.totalDecisions} total):`);
  lines.push('');
  
  // Por tipo
  const significantTypes = Object.entries(summary.byType)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  
  for (const [type, count] of significantTypes) {
    const typeLabel = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    lines.push(`  • ${typeLabel}: ${count}`);
  }
  
  if (summary.mostBlockedTool) {
    lines.push('');
    lines.push(`🔧 Tool mais bloqueada: ${summary.mostBlockedTool}`);
  }
  
  if (summary.suggestions.length > 0) {
    lines.push('');
    lines.push('💡 Alternativas sugeridas:');
    for (const suggestion of summary.suggestions.slice(0, 3)) {
      lines.push(`  → ${suggestion}`);
    }
  }
  
  return lines.join('\n');
};

/**
 * Obter explicações human-readable
 */
export const getHumanExplanations = (): string[] => {
  return nonDecisions.map(d => d.explanation);
};

// ============================================================================
// RESET
// ============================================================================

export const reset = (): void => {
  nonDecisions = [];
  sessionId = null;
  console.log('📝 [SELF-EXPLAIN] Reset');
};

export const endSession = (): ExplanationSummary => {
  const summary = getSummary();
  if (nonDecisions.length > 0) {
    console.log(`📝 [SELF-EXPLAIN] Session ended. ${summary.totalDecisions} non-decisions logged.`);
  }
  return summary;
};
