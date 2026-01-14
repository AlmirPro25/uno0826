// ============================================================================
// 🧠 FASE 10 — MULTI-AGENT ARBITRATION
// ============================================================================
// Quando policies conflitam, quem decide?
//
// Cenários reais:
// - Policy A diz "pode deletar" (autoridade OK)
// - Policy B diz "não deveria" (risco alto)
// - Memory diz "padrão perigoso detectado"
// - Quem ganha?
//
// Este módulo resolve conflitos entre camadas cognitivas.

import { PolicyDecision, PolicyEvaluation } from './policy';
import { AuthorityLevel } from './authority';
import { MemoryAnalysis, DangerousPattern } from './policyMemory';
import { Intent } from './executionLedger';

// ============================================================================
// TYPES
// ============================================================================

export type VoterType = 
  | 'authority'    // Camada de autoridade
  | 'policy'       // Camada de policy
  | 'memory'       // Memória temporal
  | 'capability'   // Capacidade técnica
  | 'user';        // Confirmação do usuário

export type VoteDecision = 
  | 'allow'
  | 'deny'
  | 'abstain';

export interface Vote {
  voter: VoterType;
  decision: VoteDecision;
  weight: number;           // 0-100, peso do voto
  confidence: number;       // 0-100, confiança na decisão
  reason: string;
  evidence?: string[];
}

export interface ArbitrationContext {
  tool: string;
  args: Record<string, any>;
  intent: Intent;
  
  // Inputs das camadas
  authorityLevel: AuthorityLevel;
  authorityAllowed: boolean;
  
  policyEvaluation: PolicyEvaluation;
  
  memoryAnalysis: MemoryAnalysis;
  
  capabilityAvailable: boolean;
  
  userConfirmed: boolean;
}

export interface ArbitrationResult {
  finalDecision: 'allow' | 'deny' | 'defer';
  votes: Vote[];
  consensus: number;         // 0-100, grau de consenso
  decidingFactor: string;    // O que decidiu
  requiresEscalation: boolean;
  escalationReason?: string;
  explanation: string;       // Human-readable
}

// ============================================================================
// VOTER WEIGHTS (configurável)
// ============================================================================

const DEFAULT_WEIGHTS: Record<VoterType, number> = {
  'authority': 30,    // Autoridade tem peso alto
  'policy': 25,       // Policy também
  'memory': 20,       // Memória temporal
  'capability': 15,   // Capacidade técnica
  'user': 10,         // Confirmação do usuário (bônus)
};

// Weights ajustados por contexto
const CONTEXT_WEIGHT_MODIFIERS: Record<string, Partial<Record<VoterType, number>>> = {
  // Para tools destrutivas, memory ganha mais peso
  'destructive': {
    'memory': 30,
    'policy': 30,
    'authority': 25,
  },
  // Para tools de leitura, authority é quase tudo
  'read_only': {
    'authority': 50,
    'capability': 30,
    'policy': 10,
    'memory': 5,
  },
  // Quando usuário confirma, isso tem peso extra
  'user_confirmed': {
    'user': 25,
    'authority': 25,
    'policy': 20,
  },
};

// ============================================================================
// VOTE GENERATION
// ============================================================================

/**
 * Gerar voto da camada de Authority
 */
const generateAuthorityVote = (ctx: ArbitrationContext): Vote => {
  if (ctx.authorityAllowed) {
    return {
      voter: 'authority',
      decision: 'allow',
      weight: DEFAULT_WEIGHTS.authority,
      confidence: 90,
      reason: `Authority level ${ctx.authorityLevel} permits this action`,
    };
  }
  
  return {
    voter: 'authority',
    decision: 'deny',
    weight: DEFAULT_WEIGHTS.authority,
    confidence: 95,
    reason: `Insufficient authority level: ${ctx.authorityLevel}`,
  };
};

/**
 * Gerar voto da camada de Policy
 */
const generatePolicyVote = (ctx: ArbitrationContext): Vote => {
  const { policyEvaluation } = ctx;
  
  switch (policyEvaluation.decision) {
    case 'allow':
      return {
        voter: 'policy',
        decision: 'allow',
        weight: DEFAULT_WEIGHTS.policy,
        confidence: 85,
        reason: policyEvaluation.reason,
      };
    
    case 'allow_with_warning':
      return {
        voter: 'policy',
        decision: 'allow',
        weight: DEFAULT_WEIGHTS.policy * 0.7, // Peso reduzido
        confidence: 60,
        reason: `Allowed with warning: ${policyEvaluation.reason}`,
        evidence: policyEvaluation.alternative ? [policyEvaluation.alternative] : undefined,
      };
    
    case 'require_confirmation':
      return {
        voter: 'policy',
        decision: ctx.userConfirmed ? 'allow' : 'deny',
        weight: DEFAULT_WEIGHTS.policy,
        confidence: 80,
        reason: ctx.userConfirmed 
          ? 'User confirmed required action'
          : `Requires confirmation: ${policyEvaluation.reason}`,
      };
    
    case 'suggest_alternative':
      return {
        voter: 'policy',
        decision: 'deny',
        weight: DEFAULT_WEIGHTS.policy * 0.8,
        confidence: 70,
        reason: policyEvaluation.reason,
        evidence: policyEvaluation.alternative ? [`Alternative: ${policyEvaluation.alternative}`] : undefined,
      };
    
    case 'deny':
      return {
        voter: 'policy',
        decision: 'deny',
        weight: DEFAULT_WEIGHTS.policy,
        confidence: 95,
        reason: policyEvaluation.reason,
      };
    
    default:
      return {
        voter: 'policy',
        decision: 'abstain',
        weight: 0,
        confidence: 0,
        reason: 'Unknown policy decision',
      };
  }
};

/**
 * Gerar voto da camada de Memory
 */
const generateMemoryVote = (ctx: ArbitrationContext): Vote => {
  const { memoryAnalysis } = ctx;
  
  // Se não tem histórico, abstém
  if (memoryAnalysis.totalActions === 0) {
    return {
      voter: 'memory',
      decision: 'abstain',
      weight: 0,
      confidence: 0,
      reason: 'No action history to analyze',
    };
  }
  
  switch (memoryAnalysis.recommendation) {
    case 'proceed':
      return {
        voter: 'memory',
        decision: 'allow',
        weight: DEFAULT_WEIGHTS.memory,
        confidence: 80,
        reason: 'No dangerous patterns detected',
      };
    
    case 'caution':
      return {
        voter: 'memory',
        decision: 'allow',
        weight: DEFAULT_WEIGHTS.memory * 0.6,
        confidence: 50,
        reason: 'Some patterns detected, proceed with caution',
        evidence: memoryAnalysis.patterns.map(p => p.name),
      };
    
    case 'slow_down':
      return {
        voter: 'memory',
        decision: 'deny',
        weight: DEFAULT_WEIGHTS.memory * 0.8,
        confidence: 70,
        reason: `Dangerous patterns detected: ${memoryAnalysis.patterns.map(p => p.name).join(', ')}`,
        evidence: memoryAnalysis.patterns.flatMap(p => p.evidence),
      };
    
    case 'stop':
      return {
        voter: 'memory',
        decision: 'deny',
        weight: DEFAULT_WEIGHTS.memory * 1.5, // Peso aumentado para STOP
        confidence: 95,
        reason: 'Critical patterns detected - full stop recommended',
        evidence: memoryAnalysis.patterns
          .filter(p => p.severity === 'critical')
          .flatMap(p => p.evidence),
      };
    
    default:
      return {
        voter: 'memory',
        decision: 'abstain',
        weight: 0,
        confidence: 0,
        reason: 'Unknown memory recommendation',
      };
  }
};

/**
 * Gerar voto da camada de Capability
 */
const generateCapabilityVote = (ctx: ArbitrationContext): Vote => {
  if (ctx.capabilityAvailable) {
    return {
      voter: 'capability',
      decision: 'allow',
      weight: DEFAULT_WEIGHTS.capability,
      confidence: 100, // Capability é binário
      reason: 'Tool is available in current capability set',
    };
  }
  
  return {
    voter: 'capability',
    decision: 'deny',
    weight: DEFAULT_WEIGHTS.capability * 2, // Peso dobrado para deny
    confidence: 100,
    reason: 'Tool not available - technical impossibility',
  };
};

/**
 * Gerar voto do usuário (se confirmou)
 */
const generateUserVote = (ctx: ArbitrationContext): Vote => {
  if (!ctx.userConfirmed) {
    return {
      voter: 'user',
      decision: 'abstain',
      weight: 0,
      confidence: 0,
      reason: 'User has not confirmed',
    };
  }
  
  return {
    voter: 'user',
    decision: 'allow',
    weight: DEFAULT_WEIGHTS.user,
    confidence: 100,
    reason: 'User explicitly confirmed this action',
  };
};

// ============================================================================
// ARBITRATION ENGINE
// ============================================================================

/**
 * Coletar todos os votos
 */
const collectVotes = (ctx: ArbitrationContext): Vote[] => {
  return [
    generateAuthorityVote(ctx),
    generatePolicyVote(ctx),
    generateMemoryVote(ctx),
    generateCapabilityVote(ctx),
    generateUserVote(ctx),
  ].filter(v => v.decision !== 'abstain');
};

/**
 * Calcular resultado da votação
 */
const calculateResult = (votes: Vote[]): { 
  decision: 'allow' | 'deny' | 'defer';
  consensus: number;
  decidingFactor: string;
} => {
  if (votes.length === 0) {
    return { decision: 'defer', consensus: 0, decidingFactor: 'No votes cast' };
  }
  
  // Calcular scores ponderados
  let allowScore = 0;
  let denyScore = 0;
  let totalWeight = 0;
  
  for (const vote of votes) {
    const weightedScore = vote.weight * (vote.confidence / 100);
    totalWeight += vote.weight;
    
    if (vote.decision === 'allow') {
      allowScore += weightedScore;
    } else if (vote.decision === 'deny') {
      denyScore += weightedScore;
    }
  }
  
  // Normalizar
  const normalizedAllow = totalWeight > 0 ? allowScore / totalWeight : 0;
  const normalizedDeny = totalWeight > 0 ? denyScore / totalWeight : 0;
  
  // Calcular consenso (quão unânime foi a decisão)
  const consensus = Math.abs(normalizedAllow - normalizedDeny) * 100;
  
  // Encontrar voto decisivo
  const sortedVotes = [...votes].sort((a, b) => 
    (b.weight * b.confidence) - (a.weight * a.confidence)
  );
  const decidingVote = sortedVotes[0];
  const decidingFactor = `${decidingVote.voter}: ${decidingVote.reason}`;
  
  // Decisão final
  if (normalizedAllow > normalizedDeny) {
    return { decision: 'allow', consensus, decidingFactor };
  } else if (normalizedDeny > normalizedAllow) {
    return { decision: 'deny', consensus, decidingFactor };
  } else {
    return { decision: 'defer', consensus: 0, decidingFactor: 'Tie - deferring to user' };
  }
};

/**
 * Verificar se precisa escalação
 */
const checkEscalation = (
  votes: Vote[], 
  result: { decision: 'allow' | 'deny' | 'defer'; consensus: number }
): { requires: boolean; reason?: string } => {
  // Consenso muito baixo = escalar
  if (result.consensus < 30) {
    return { 
      requires: true, 
      reason: `Low consensus (${Math.round(result.consensus)}%) - conflicting signals` 
    };
  }
  
  // Capability disse não = não tem como escalar
  const capabilityVote = votes.find(v => v.voter === 'capability');
  if (capabilityVote?.decision === 'deny') {
    return { requires: false }; // Não adianta escalar, é impossível
  }
  
  // Memory disse STOP com alta confiança = escalar para humano
  const memoryVote = votes.find(v => v.voter === 'memory');
  if (memoryVote?.decision === 'deny' && memoryVote.confidence >= 90) {
    return { 
      requires: true, 
      reason: 'Memory detected critical pattern - human review recommended' 
    };
  }
  
  // Policy e Authority discordam = escalar
  const policyVote = votes.find(v => v.voter === 'policy');
  const authorityVote = votes.find(v => v.voter === 'authority');
  if (policyVote && authorityVote && policyVote.decision !== authorityVote.decision) {
    return { 
      requires: true, 
      reason: 'Policy and Authority disagree - needs clarification' 
    };
  }
  
  return { requires: false };
};

/**
 * Gerar explicação human-readable
 */
const generateExplanation = (
  ctx: ArbitrationContext,
  votes: Vote[],
  result: { decision: 'allow' | 'deny' | 'defer'; consensus: number; decidingFactor: string }
): string => {
  const lines: string[] = [];
  
  lines.push(`🗳️ Arbitration for "${ctx.tool}":`);
  lines.push('');
  
  // Votos
  for (const vote of votes) {
    const emoji = vote.decision === 'allow' ? '✅' : vote.decision === 'deny' ? '❌' : '⚪';
    lines.push(`  ${emoji} ${vote.voter.toUpperCase()}: ${vote.reason}`);
  }
  
  lines.push('');
  lines.push(`📊 Consensus: ${Math.round(result.consensus)}%`);
  lines.push(`🎯 Decision: ${result.decision.toUpperCase()}`);
  lines.push(`💡 Deciding factor: ${result.decidingFactor}`);
  
  return lines.join('\n');
};

// ============================================================================
// MAIN ARBITRATION FUNCTION
// ============================================================================

/**
 * Arbitrar entre múltiplas camadas cognitivas
 */
export const arbitrate = (ctx: ArbitrationContext): ArbitrationResult => {
  console.log(`🗳️ [ARBITRATION] Starting for tool: ${ctx.tool}`);
  
  // Coletar votos
  const votes = collectVotes(ctx);
  
  // Calcular resultado
  const result = calculateResult(votes);
  
  // Verificar escalação
  const escalation = checkEscalation(votes, result);
  
  // Gerar explicação
  const explanation = generateExplanation(ctx, votes, result);
  
  const arbitrationResult: ArbitrationResult = {
    finalDecision: result.decision,
    votes,
    consensus: result.consensus,
    decidingFactor: result.decidingFactor,
    requiresEscalation: escalation.requires,
    escalationReason: escalation.reason,
    explanation,
  };
  
  console.log(`🗳️ [ARBITRATION] Result: ${result.decision} (consensus: ${Math.round(result.consensus)}%)`);
  
  return arbitrationResult;
};

// ============================================================================
// QUICK ARBITRATION (para casos simples)
// ============================================================================

/**
 * Arbitração rápida quando não há conflito óbvio
 */
export const quickArbitrate = (
  authorityAllowed: boolean,
  policyDecision: PolicyDecision,
  capabilityAvailable: boolean
): 'allow' | 'deny' | 'needs_full_arbitration' => {
  // Capability é pré-requisito absoluto
  if (!capabilityAvailable) return 'deny';
  
  // Se todos concordam em allow
  if (authorityAllowed && policyDecision === 'allow') return 'allow';
  
  // Se authority nega, é deny
  if (!authorityAllowed) return 'deny';
  
  // Se policy nega explicitamente
  if (policyDecision === 'deny') return 'deny';
  
  // Casos ambíguos precisam arbitração completa
  return 'needs_full_arbitration';
};

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

export interface ConflictReport {
  hasConflict: boolean;
  conflictingVoters: [VoterType, VoterType][];
  severity: 'low' | 'medium' | 'high';
  description: string;
}

/**
 * Detectar conflitos entre camadas
 */
export const detectConflicts = (ctx: ArbitrationContext): ConflictReport => {
  const votes = collectVotes(ctx);
  const conflicts: [VoterType, VoterType][] = [];
  
  // Comparar cada par de votos
  for (let i = 0; i < votes.length; i++) {
    for (let j = i + 1; j < votes.length; j++) {
      const v1 = votes[i];
      const v2 = votes[j];
      
      if (v1.decision !== v2.decision && 
          v1.decision !== 'abstain' && 
          v2.decision !== 'abstain') {
        conflicts.push([v1.voter, v2.voter]);
      }
    }
  }
  
  if (conflicts.length === 0) {
    return {
      hasConflict: false,
      conflictingVoters: [],
      severity: 'low',
      description: 'No conflicts detected',
    };
  }
  
  // Determinar severidade
  let severity: 'low' | 'medium' | 'high' = 'low';
  
  // Conflito entre authority e policy é sério
  if (conflicts.some(([a, b]) => 
    (a === 'authority' && b === 'policy') || 
    (a === 'policy' && b === 'authority')
  )) {
    severity = 'high';
  }
  // Conflito envolvendo memory é médio
  else if (conflicts.some(([a, b]) => a === 'memory' || b === 'memory')) {
    severity = 'medium';
  }
  
  return {
    hasConflict: true,
    conflictingVoters: conflicts,
    severity,
    description: `${conflicts.length} conflict(s) detected: ${conflicts.map(([a, b]) => `${a} vs ${b}`).join(', ')}`,
  };
};

// ============================================================================
// VETO POWER (para casos críticos)
// ============================================================================

/**
 * Verificar se alguma camada tem poder de veto
 */
export const checkVeto = (ctx: ArbitrationContext): { 
  vetoed: boolean; 
  vetoer?: VoterType; 
  reason?: string 
} => {
  // Capability tem veto absoluto (impossibilidade técnica)
  if (!ctx.capabilityAvailable) {
    return { 
      vetoed: true, 
      vetoer: 'capability', 
      reason: 'Technical impossibility - tool not available' 
    };
  }
  
  // Memory com padrão crítico tem veto
  const criticalPattern = ctx.memoryAnalysis.patterns.find(p => p.severity === 'critical');
  if (criticalPattern && ctx.memoryAnalysis.recommendation === 'stop') {
    return { 
      vetoed: true, 
      vetoer: 'memory', 
      reason: `Critical pattern: ${criticalPattern.name}` 
    };
  }
  
  // Policy deny com risco > 90 tem veto
  if (ctx.policyEvaluation.decision === 'deny' && ctx.policyEvaluation.riskScore >= 90) {
    return { 
      vetoed: true, 
      vetoer: 'policy', 
      reason: `Extreme risk (${ctx.policyEvaluation.riskScore}/100): ${ctx.policyEvaluation.reason}` 
    };
  }
  
  return { vetoed: false };
};
