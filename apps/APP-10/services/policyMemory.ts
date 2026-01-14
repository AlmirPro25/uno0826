// ============================================================================
// 🧠 FASE 8 — POLICY MEMORY WINDOW
// ============================================================================
// Memória temporal de ações com decaimento.
// Detecta padrões perigosos ao longo do tempo.
// Não é só "o que fez agora", é "o que vem fazendo".

// ============================================================================
// TYPES
// ============================================================================

export interface MemorizedAction {
  tool: string;
  file?: string;
  timestamp: number;
  riskScore: number;
  wasDestructive: boolean;
  wasBlocked: boolean;
  intent: string;
  outcome: 'success' | 'failure' | 'blocked';
}

export interface DangerousPattern {
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected: boolean;
  evidence: string[];
}

export interface MemoryAnalysis {
  totalActions: number;
  destructiveRatio: number;
  averageRiskScore: number;
  patterns: DangerousPattern[];
  recommendation: 'proceed' | 'caution' | 'slow_down' | 'stop';
  cooldownSuggested: number; // ms
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Janela de memória (quanto tempo lembrar)
  MEMORY_WINDOW_MS: 5 * 60 * 1000, // 5 minutos
  
  // Decaimento temporal (ações antigas pesam menos)
  DECAY_HALF_LIFE_MS: 60 * 1000, // 1 minuto
  
  // Limites para padrões
  MAX_DESTRUCTIVE_RATIO: 0.5,      // 50% destrutivas = warning
  MAX_RISK_AVERAGE: 50,            // Risk score médio
  RAPID_FIRE_THRESHOLD_MS: 2000,   // Ações muito rápidas
  RAPID_FIRE_COUNT: 5,             // Quantas ações rápidas = padrão
  
  // Cooldown
  BASE_COOLDOWN_MS: 5000,
  MAX_COOLDOWN_MS: 30000,
};

// ============================================================================
// MEMORY STORE
// ============================================================================

let actionMemory: MemorizedAction[] = [];

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Registrar uma ação na memória
 */
export const remember = (action: Omit<MemorizedAction, 'timestamp'>): void => {
  const memorized: MemorizedAction = {
    ...action,
    timestamp: Date.now(),
  };
  
  actionMemory.push(memorized);
  
  // Limpar ações fora da janela
  pruneOldActions();
  
  console.log(`🧠 [MEMORY] Remembered: ${action.tool} (risk: ${action.riskScore})`);
};

/**
 * Remover ações fora da janela de memória
 */
const pruneOldActions = (): void => {
  const cutoff = Date.now() - CONFIG.MEMORY_WINDOW_MS;
  actionMemory = actionMemory.filter(a => a.timestamp > cutoff);
};

/**
 * Calcular peso de uma ação com decaimento temporal
 */
const calculateWeight = (action: MemorizedAction): number => {
  const age = Date.now() - action.timestamp;
  // Decaimento exponencial: peso = 0.5^(age/halfLife)
  return Math.pow(0.5, age / CONFIG.DECAY_HALF_LIFE_MS);
};

/**
 * Obter ações recentes com peso
 */
export const getWeightedActions = (): Array<MemorizedAction & { weight: number }> => {
  pruneOldActions();
  return actionMemory.map(a => ({
    ...a,
    weight: calculateWeight(a),
  }));
};

// ============================================================================
// PATTERN DETECTION
// ============================================================================

/**
 * Detectar padrão: Muitas ações destrutivas em sequência
 */
const detectDestructiveSpree = (): DangerousPattern => {
  const weighted = getWeightedActions();
  const destructive = weighted.filter(a => a.wasDestructive);
  
  // Soma ponderada
  const destructiveWeight = destructive.reduce((sum, a) => sum + a.weight, 0);
  const totalWeight = weighted.reduce((sum, a) => sum + a.weight, 0);
  
  const ratio = totalWeight > 0 ? destructiveWeight / totalWeight : 0;
  const detected = ratio > CONFIG.MAX_DESTRUCTIVE_RATIO && destructive.length >= 3;
  
  return {
    name: 'destructive_spree',
    description: 'Multiple destructive actions in short time',
    severity: ratio > 0.7 ? 'critical' : ratio > 0.5 ? 'high' : 'medium',
    detected,
    evidence: detected 
      ? [`${destructive.length} destructive actions`, `${Math.round(ratio * 100)}% of recent activity`]
      : [],
  };
};

/**
 * Detectar padrão: Ações muito rápidas (possível loop ou automação descontrolada)
 */
const detectRapidFire = (): DangerousPattern => {
  const actions = getWeightedActions();
  if (actions.length < CONFIG.RAPID_FIRE_COUNT) {
    return {
      name: 'rapid_fire',
      description: 'Actions happening too fast',
      severity: 'low',
      detected: false,
      evidence: [],
    };
  }
  
  // Verificar intervalos entre ações
  const sorted = [...actions].sort((a, b) => a.timestamp - b.timestamp);
  let rapidCount = 0;
  
  for (let i = 1; i < sorted.length; i++) {
    const interval = sorted[i].timestamp - sorted[i - 1].timestamp;
    if (interval < CONFIG.RAPID_FIRE_THRESHOLD_MS) {
      rapidCount++;
    }
  }
  
  const detected = rapidCount >= CONFIG.RAPID_FIRE_COUNT - 1;
  
  return {
    name: 'rapid_fire',
    description: 'Actions happening too fast',
    severity: rapidCount > 10 ? 'critical' : rapidCount > 7 ? 'high' : 'medium',
    detected,
    evidence: detected
      ? [`${rapidCount} actions within ${CONFIG.RAPID_FIRE_THRESHOLD_MS}ms of each other`]
      : [],
  };
};

/**
 * Detectar padrão: Mesmo arquivo sendo modificado repetidamente
 */
const detectFileChurning = (): DangerousPattern => {
  const actions = getWeightedActions().filter(a => a.file);
  
  // Contar modificações por arquivo
  const fileCounts = new Map<string, number>();
  for (const action of actions) {
    if (action.file && (action.tool.includes('write') || action.tool === 'replace_string')) {
      fileCounts.set(action.file, (fileCounts.get(action.file) || 0) + 1);
    }
  }
  
  // Encontrar arquivos com muitas modificações
  const churned = Array.from(fileCounts.entries())
    .filter(([_, count]) => count >= 3)
    .map(([file, count]) => `${file}: ${count} modifications`);
  
  return {
    name: 'file_churning',
    description: 'Same file being modified repeatedly',
    severity: churned.length > 2 ? 'high' : 'medium',
    detected: churned.length > 0,
    evidence: churned,
  };
};

/**
 * Detectar padrão: Escalada de risco (ações cada vez mais arriscadas)
 */
const detectRiskEscalation = (): DangerousPattern => {
  const actions = getWeightedActions();
  if (actions.length < 4) {
    return {
      name: 'risk_escalation',
      description: 'Risk scores increasing over time',
      severity: 'low',
      detected: false,
      evidence: [],
    };
  }
  
  // Dividir em duas metades e comparar média de risco
  const sorted = [...actions].sort((a, b) => a.timestamp - b.timestamp);
  const mid = Math.floor(sorted.length / 2);
  
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);
  
  const avgFirst = firstHalf.reduce((sum, a) => sum + a.riskScore, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, a) => sum + a.riskScore, 0) / secondHalf.length;
  
  const escalation = avgSecond - avgFirst;
  const detected = escalation > 15; // Aumento de 15+ pontos
  
  return {
    name: 'risk_escalation',
    description: 'Risk scores increasing over time',
    severity: escalation > 30 ? 'critical' : escalation > 20 ? 'high' : 'medium',
    detected,
    evidence: detected
      ? [`Risk increased from avg ${Math.round(avgFirst)} to ${Math.round(avgSecond)}`]
      : [],
  };
};

/**
 * Detectar padrão: Muitos bloqueios (agente tentando forçar)
 */
const detectForcingPattern = (): DangerousPattern => {
  const actions = getWeightedActions();
  const blocked = actions.filter(a => a.wasBlocked);
  
  const detected = blocked.length >= 3;
  
  return {
    name: 'forcing_pattern',
    description: 'Multiple blocked actions (agent may be forcing)',
    severity: blocked.length > 5 ? 'critical' : 'high',
    detected,
    evidence: detected
      ? [`${blocked.length} actions were blocked`, ...blocked.slice(0, 3).map(a => a.tool)]
      : [],
  };
};

// ============================================================================
// ANALYSIS
// ============================================================================

/**
 * Analisar memória e retornar recomendação
 */
export const analyze = (): MemoryAnalysis => {
  pruneOldActions();
  
  const weighted = getWeightedActions();
  const totalActions = weighted.length;
  
  if (totalActions === 0) {
    return {
      totalActions: 0,
      destructiveRatio: 0,
      averageRiskScore: 0,
      patterns: [],
      recommendation: 'proceed',
      cooldownSuggested: 0,
    };
  }
  
  // Calcular métricas
  const destructive = weighted.filter(a => a.wasDestructive);
  const destructiveRatio = destructive.length / totalActions;
  
  const totalWeightedRisk = weighted.reduce((sum, a) => sum + a.riskScore * a.weight, 0);
  const totalWeight = weighted.reduce((sum, a) => sum + a.weight, 0);
  const averageRiskScore = totalWeight > 0 ? totalWeightedRisk / totalWeight : 0;
  
  // Detectar padrões
  const patterns = [
    detectDestructiveSpree(),
    detectRapidFire(),
    detectFileChurning(),
    detectRiskEscalation(),
    detectForcingPattern(),
  ];
  
  const detectedPatterns = patterns.filter(p => p.detected);
  const criticalPatterns = detectedPatterns.filter(p => p.severity === 'critical');
  const highPatterns = detectedPatterns.filter(p => p.severity === 'high');
  
  // Determinar recomendação
  let recommendation: MemoryAnalysis['recommendation'] = 'proceed';
  let cooldownSuggested = 0;
  
  if (criticalPatterns.length > 0) {
    recommendation = 'stop';
    cooldownSuggested = CONFIG.MAX_COOLDOWN_MS;
  } else if (highPatterns.length >= 2 || averageRiskScore > 60) {
    recommendation = 'slow_down';
    cooldownSuggested = CONFIG.BASE_COOLDOWN_MS * 3;
  } else if (detectedPatterns.length > 0 || averageRiskScore > CONFIG.MAX_RISK_AVERAGE) {
    recommendation = 'caution';
    cooldownSuggested = CONFIG.BASE_COOLDOWN_MS;
  }
  
  const analysis: MemoryAnalysis = {
    totalActions,
    destructiveRatio,
    averageRiskScore,
    patterns: detectedPatterns,
    recommendation,
    cooldownSuggested,
  };
  
  if (detectedPatterns.length > 0) {
    console.log(`🧠 [MEMORY] Analysis: ${recommendation} | Patterns: ${detectedPatterns.map(p => p.name).join(', ')}`);
  }
  
  return analysis;
};

/**
 * Verificar se deve aplicar cooldown
 */
export const shouldCooldown = (): { should: boolean; duration: number; reason?: string } => {
  const analysis = analyze();
  
  if (analysis.cooldownSuggested > 0) {
    const criticalPattern = analysis.patterns.find(p => p.severity === 'critical');
    return {
      should: true,
      duration: analysis.cooldownSuggested,
      reason: criticalPattern?.description || `Recommendation: ${analysis.recommendation}`,
    };
  }
  
  return { should: false, duration: 0 };
};

// ============================================================================
// RESET
// ============================================================================

export const reset = (): void => {
  actionMemory = [];
  console.log('🧠 [MEMORY] Reset');
};

export const getMemorySize = (): number => actionMemory.length;
