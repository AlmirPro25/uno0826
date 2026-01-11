/**
 * SISTEMA DE ESTADOS - Vocabulário Visual Unificado
 * 
 * Este arquivo define os contratos visuais e semânticos do sistema.
 * Qualquer página que mostre estados deve usar estas definições.
 * 
 * PRINCÍPIO: Mesma cor + mesmo ícone = mesmo significado em qualquer lugar.
 */

// ============================================
// VOCABULÁRIO SEMÂNTICO
// ============================================

/**
 * Termos padronizados para ações do sistema:
 * 
 * AVALIAÇÃO  - Regra foi verificada (condition checked)
 * DISPARO    - Regra decidiu agir (condition met, action triggered)
 * EXECUÇÃO   - Ação foi realizada (webhook sent, alert created)
 * SIMULAÇÃO  - Ação foi calculada mas não realizada (shadow mode)
 * BLOQUEIO   - Ação foi impedida intencionalmente (policy, authority)
 * FALHA      - Ação tentou mas não conseguiu (error, timeout)
 * RETRY      - Ação será tentada novamente (explicit retry)
 */

export const ActionTerms = {
  // Cognição (LOOP 2)
  EVALUATION: "Avaliação",
  TRIGGER: "Disparo",
  CONDITION_MET: "Condição atendida",
  CONDITION_NOT_MET: "Condição não atendida",
  
  // Ação (LOOP 3)
  EXECUTION: "Execução",
  EXECUTED: "Executado",
  PENDING: "Pendente",
  
  // Confiança (LOOP 4)
  SIMULATION: "Simulação",
  SIMULATED: "Simulado",
  WOULD_EXECUTE: "Teria executado",
  WOULD_BLOCK: "Teria bloqueado",
  
  // Controle
  BLOCKED: "Bloqueado",
  BLOCKED_BY_POLICY: "Bloqueado por política",
  BLOCKED_BY_AUTHORITY: "Sem autoridade",
  BLOCKED_BY_KILLSWITCH: "Kill Switch ativo",
  
  // Erros
  FAILED: "Falhou",
  TIMEOUT: "Tempo esgotado",
  ERROR: "Erro",
  
  // Retry
  RETRY: "Tentar novamente",
  RETRYING: "Tentando...",
  RETRY_SCHEDULED: "Retry agendado",
  
  // Delegação (LOOP 6)
  APPROVAL_PENDING: "Aguardando aprovação",
  APPROVAL_APPROVED: "Aprovado",
  APPROVAL_REJECTED: "Rejeitado",
  APPROVAL_EXPIRED: "Expirado",
  REQUIRES_APPROVAL: "Requer aprovação",
  AUTHORITY_GRANTED: "Autoridade concedida",
  AUTHORITY_DENIED: "Autoridade negada",
} as const;

// ============================================
// CORES SEMÂNTICAS
// ============================================

/**
 * Cores que SEMPRE significam a mesma coisa:
 * 
 * emerald  - Sucesso, executado, ativo, saudável
 * rose     - Falha, erro, crítico, kill switch
 * amber    - Aviso, atenção, pendente
 * violet   - Simulação, shadow mode, hipotético
 * indigo   - Neutro, informação, padrão
 * slate    - Inativo, desabilitado, histórico
 */

export const StateColors = {
  // Sucesso / Positivo
  success: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    icon: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-400",
    pulse: "bg-emerald-500",
  },
  
  // Falha / Erro
  failure: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    text: "text-rose-400",
    icon: "text-rose-400",
    badge: "bg-rose-500/20 text-rose-400",
    pulse: "bg-rose-500",
  },
  
  // Aviso / Atenção
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    icon: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-400",
    pulse: "bg-amber-500",
  },
  
  // Simulação / Shadow
  simulation: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    text: "text-violet-400",
    icon: "text-violet-400",
    badge: "bg-violet-500/20 text-violet-400",
    pulse: "bg-violet-500",
  },
  
  // Neutro / Info
  neutral: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    text: "text-indigo-400",
    icon: "text-indigo-400",
    badge: "bg-indigo-500/20 text-indigo-400",
    pulse: "bg-indigo-500",
  },
  
  // Inativo / Desabilitado
  inactive: {
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    text: "text-slate-500",
    icon: "text-slate-500",
    badge: "bg-slate-500/20 text-slate-500",
    pulse: "bg-slate-600",
  },
} as const;

// ============================================
// MAPEAMENTO DE ESTADOS
// ============================================

export type SystemState = 
  | "success" 
  | "failure" 
  | "warning" 
  | "simulation" 
  | "neutral" 
  | "inactive";

/**
 * Mapeia estados de execução para cores
 */
export function getExecutionStateColor(state: {
  executed?: boolean;
  success?: boolean;
  simulated?: boolean;
  blocked?: boolean;
  error?: boolean;
}): SystemState {
  if (state.simulated) return "simulation";
  if (state.blocked) return "warning";
  if (state.error) return "failure";
  if (state.executed && state.success) return "success";
  if (state.executed && !state.success) return "failure";
  return "inactive";
}

/**
 * Mapeia status HTTP para cores
 */
export function getHttpStatusColor(statusCode: number | undefined): SystemState {
  if (!statusCode) return "inactive";
  if (statusCode >= 200 && statusCode < 300) return "success";
  if (statusCode >= 400 && statusCode < 500) return "warning";
  if (statusCode >= 500) return "failure";
  return "neutral";
}

/**
 * Mapeia modo do sistema para cores
 */
export function getSystemModeColor(mode: {
  killSwitchActive?: boolean;
  shadowModeActive?: boolean;
  normal?: boolean;
}): SystemState {
  if (mode.killSwitchActive) return "failure";
  if (mode.shadowModeActive) return "simulation";
  return "success";
}

// ============================================
// ÍCONES SEMÂNTICOS
// ============================================

/**
 * Ícones que SEMPRE significam a mesma coisa:
 * 
 * CheckCircle2  - Sucesso, executado, aprovado
 * XCircle       - Falha, erro, rejeitado
 * AlertTriangle - Aviso, atenção, bloqueado
 * Ghost         - Simulação, shadow mode
 * Clock         - Pendente, aguardando, tempo
 * Power         - Kill switch, controle crítico
 * Shield        - Proteção, segurança, normal
 * Brain         - Cognição, regra, decisão
 * Zap           - Ação, disparo, execução
 * Activity      - Pulso, vida, telemetria
 * Eye           - Observando, shadow ativo
 * EyeOff        - Não observando, shadow inativo
 * RotateCcw     - Retry, tentar novamente
 */

export const IconMeanings = {
  SUCCESS: "CheckCircle2",
  FAILURE: "XCircle",
  WARNING: "AlertTriangle",
  SIMULATION: "Ghost",
  PENDING: "Clock",
  KILLSWITCH: "Power",
  PROTECTION: "Shield",
  COGNITION: "Brain",
  ACTION: "Zap",
  PULSE: "Activity",
  OBSERVING: "Eye",
  NOT_OBSERVING: "EyeOff",
  RETRY: "RotateCcw",
  // Delegação (LOOP 6)
  AUTHORITY: "Crown",
  APPROVAL: "UserCheck",
  HIERARCHY: "GitBranch",
  DOMAIN: "Layers",
} as const;

// ============================================
// HELPERS DE FORMATAÇÃO
// ============================================

/**
 * Formata tempo relativo de forma consistente
 */
export function formatRelativeTime(timestamp: string | null | undefined): string {
  if (!timestamp) return "—";
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 0) return "agora";
  if (diffSec < 60) return `${diffSec}s atrás`;
  if (diffMin < 60) return `${diffMin}min atrás`;
  if (diffHour < 24) return `${diffHour}h atrás`;
  if (diffDay < 7) return `${diffDay}d atrás`;
  
  return date.toLocaleDateString('pt-BR');
}

/**
 * Formata duração em ms de forma legível
 */
export function formatDuration(ms: number | undefined): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
}

/**
 * Formata número grande de forma legível
 */
export function formatNumber(n: number | undefined): string {
  if (n === undefined || n === null) return "0";
  if (n < 1000) return n.toString();
  if (n < 1000000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1000000).toFixed(1)}M`;
}

// ============================================
// CONTRATOS DE ESTADO DO SISTEMA
// ============================================

/**
 * Estados possíveis do sistema como um todo
 */
export const SystemModes = {
  NORMAL: {
    label: "Operacional",
    description: "Sistema operando normalmente",
    color: "success" as SystemState,
  },
  SHADOW: {
    label: "Shadow Mode",
    description: "Ações simuladas, não executadas",
    color: "simulation" as SystemState,
  },
  KILLSWITCH: {
    label: "Kill Switch",
    description: "Todas as ações pausadas",
    color: "failure" as SystemState,
  },
} as const;

/**
 * Estados possíveis de uma execução
 */
export const ExecutionStates = {
  EXECUTED_SUCCESS: {
    label: "Executado",
    description: "Ação realizada com sucesso",
    color: "success" as SystemState,
  },
  EXECUTED_FAILED: {
    label: "Falhou",
    description: "Ação tentou mas não conseguiu",
    color: "failure" as SystemState,
  },
  SIMULATED_WOULD_EXECUTE: {
    label: "Teria executado",
    description: "Em modo real, esta ação seria realizada",
    color: "simulation" as SystemState,
  },
  SIMULATED_WOULD_BLOCK: {
    label: "Teria bloqueado",
    description: "Em modo real, esta ação seria impedida",
    color: "warning" as SystemState,
  },
  BLOCKED: {
    label: "Bloqueado",
    description: "Ação impedida por política ou autoridade",
    color: "warning" as SystemState,
  },
  CONDITION_NOT_MET: {
    label: "Não disparou",
    description: "Condição da regra não foi atendida",
    color: "inactive" as SystemState,
  },
} as const;

// ============================================
// ESTADOS DE APROVAÇÃO (LOOP 6)
// ============================================

/**
 * Estados possíveis de uma aprovação
 */
export const ApprovalStates = {
  PENDING: {
    label: "Pendente",
    description: "Aguardando decisão humana",
    color: "warning" as SystemState,
  },
  APPROVED: {
    label: "Aprovado",
    description: "Ação autorizada por humano",
    color: "success" as SystemState,
  },
  REJECTED: {
    label: "Rejeitado",
    description: "Ação negada por humano",
    color: "failure" as SystemState,
  },
  EXPIRED: {
    label: "Expirado",
    description: "Tempo de aprovação esgotado",
    color: "inactive" as SystemState,
  },
} as const;

/**
 * Níveis de autoridade do sistema
 */
export const AuthorityLevels = {
  OBSERVER: {
    label: "Observador",
    description: "Pode ver, não pode agir",
    rank: 1,
    color: "inactive" as SystemState,
  },
  SUGGESTOR: {
    label: "Sugestor",
    description: "Pode sugerir ações (shadow mode)",
    rank: 2,
    color: "simulation" as SystemState,
  },
  OPERATOR: {
    label: "Operador",
    description: "Pode executar ações operacionais",
    rank: 3,
    color: "neutral" as SystemState,
  },
  MANAGER: {
    label: "Gerente",
    description: "Pode mudar regras e configs",
    rank: 4,
    color: "warning" as SystemState,
  },
  GOVERNOR: {
    label: "Governador",
    description: "Pode mudar políticas",
    rank: 5,
    color: "success" as SystemState,
  },
  SOVEREIGN: {
    label: "Soberano",
    description: "Pode desligar o sistema",
    rank: 6,
    color: "failure" as SystemState,
  },
} as const;

/**
 * Mapeia status de aprovação para cor
 */
export function getApprovalStateColor(status: string): SystemState {
  switch (status) {
    case "pending": return "warning";
    case "approved": return "success";
    case "rejected": return "failure";
    case "expired": return "inactive";
    default: return "neutral";
  }
}
