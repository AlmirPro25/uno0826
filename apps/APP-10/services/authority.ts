// ============================================================================
// 🔐 AUTHORITY LAYER - Governança Cognitiva
// ============================================================================
// O agente sabe o que QUER (Intent), sabe o que PODE (Capability),
// agora sabe se TEM PERMISSÃO (Authority).
//
// Authority não é capability. Capability é técnica. Authority é política.
// Você PODE matar um processo (capability), mas TEM AUTORIDADE para isso?

import { Intent } from './executionLedger';

// ============================================================================
// AUTHORITY LEVELS (hierarquia de poder)
// ============================================================================

export type AuthorityLevel = 
  | 'READ_ONLY'       // Só pode ler, navegar, explorar
  | 'SAFE_WRITE'      // Pode criar/editar arquivos não-críticos
  | 'DESTRUCTIVE'     // Pode deletar, sobrescrever, limpar
  | 'SYSTEM_CRITICAL'; // Pode afetar processos, portas, reset

// Ordem de poder (para comparação)
const AUTHORITY_HIERARCHY: Record<AuthorityLevel, number> = {
  'READ_ONLY': 0,
  'SAFE_WRITE': 1,
  'DESTRUCTIVE': 2,
  'SYSTEM_CRITICAL': 3,
};

// ============================================================================
// TOOL → AUTHORITY MAPPING
// ============================================================================

const TOOL_AUTHORITY_REQUIREMENTS: Record<string, AuthorityLevel> = {
  // READ_ONLY - Navegação e leitura
  'read_file': 'READ_ONLY',
  'read_multiple_files': 'READ_ONLY',
  'search_files': 'READ_ONLY',
  'file_search': 'READ_ONLY',
  'list_directory': 'READ_ONLY',
  'grep_search': 'READ_ONLY',
  'get_file_info': 'READ_ONLY',
  'diff_files': 'READ_ONLY',
  'list_snapshots': 'READ_ONLY',
  'recall': 'READ_ONLY',
  'get_diagnostics': 'READ_ONLY',
  'check_app_health': 'READ_ONLY',
  'get_error_log': 'READ_ONLY',
  'list_processes': 'READ_ONLY',
  'get_system_state': 'READ_ONLY',
  'get_process_output': 'READ_ONLY',
  'get_logs': 'READ_ONLY',
  'analyze_project': 'READ_ONLY',
  
  // SAFE_WRITE - Criação e edição
  'write_file': 'SAFE_WRITE',
  'write_multiple_files': 'SAFE_WRITE',
  'append_file': 'SAFE_WRITE',
  'replace_string': 'SAFE_WRITE',
  'insert_code': 'SAFE_WRITE',
  'wrap_code': 'SAFE_WRITE',
  'rename_symbol': 'SAFE_WRITE',
  'format_file': 'SAFE_WRITE',
  'move_file': 'SAFE_WRITE',
  'remember': 'SAFE_WRITE',
  'add_task': 'SAFE_WRITE',
  'complete_task': 'SAFE_WRITE',
  'create_snapshot': 'SAFE_WRITE',
  'smart_edit': 'SAFE_WRITE',
  'analyze_code': 'SAFE_WRITE',
  'generate_tests': 'SAFE_WRITE',
  'debug_error': 'SAFE_WRITE',
  'summarize_changes': 'SAFE_WRITE',
  
  // DESTRUCTIVE - Deleção e execução
  'delete_file': 'DESTRUCTIVE',
  'clear_workspace': 'DESTRUCTIVE',
  'restore_snapshot': 'DESTRUCTIVE',
  'run_command': 'DESTRUCTIVE',
  'run_script': 'DESTRUCTIVE',
  'install_package': 'DESTRUCTIVE',
  'uninstall_package': 'DESTRUCTIVE',
  'git': 'DESTRUCTIVE',
  'run_tests': 'DESTRUCTIVE',
  'check_types': 'DESTRUCTIVE',
  'lint_fix': 'DESTRUCTIVE',
  'web_search': 'DESTRUCTIVE',
  'web_fetch': 'DESTRUCTIVE',
  
  // SYSTEM_CRITICAL - Controle de sistema
  'reset_project': 'SYSTEM_CRITICAL',
  'restart_server': 'SYSTEM_CRITICAL',
  'clear_terminal': 'SYSTEM_CRITICAL',
  'create_terminal': 'SYSTEM_CRITICAL',
  'close_terminal': 'SYSTEM_CRITICAL',
  'close_all_terminals': 'SYSTEM_CRITICAL',
  'start_process': 'SYSTEM_CRITICAL',
  'stop_process': 'SYSTEM_CRITICAL',
  'stop_all_processes': 'SYSTEM_CRITICAL',
  'kill_port': 'SYSTEM_CRITICAL',
  'system_reset': 'SYSTEM_CRITICAL',
};

// ============================================================================
// INTENT → MAX AUTHORITY POLICY
// ============================================================================

export interface AuthorityPolicy {
  intent: Intent;
  maxAuthority: AuthorityLevel;
  autoEscalate: boolean;        // Pode escalar automaticamente?
  requiresConfirmation: boolean; // Precisa de confirm explícito?
}

const INTENT_POLICIES: Record<Intent, AuthorityPolicy> = {
  'EXPLORE': {
    intent: 'EXPLORE',
    maxAuthority: 'READ_ONLY',
    autoEscalate: false,
    requiresConfirmation: false,
  },
  'EXPLAIN': {
    intent: 'EXPLAIN',
    maxAuthority: 'READ_ONLY',
    autoEscalate: false,
    requiresConfirmation: false,
  },
  'MODIFY': {
    intent: 'MODIFY',
    maxAuthority: 'SAFE_WRITE',
    autoEscalate: true,  // Pode escalar para DESTRUCTIVE se necessário
    requiresConfirmation: false,
  },
  'DEBUG': {
    intent: 'DEBUG',
    maxAuthority: 'DESTRUCTIVE',
    autoEscalate: true,
    requiresConfirmation: false,
  },
  'CREATE': {
    intent: 'CREATE',
    maxAuthority: 'DESTRUCTIVE',  // Precisa limpar workspace, instalar, etc
    autoEscalate: true,
    requiresConfirmation: false,
  },
  'UNKNOWN': {
    intent: 'UNKNOWN',
    maxAuthority: 'SAFE_WRITE',
    autoEscalate: false,
    requiresConfirmation: true,
  },
};

// ============================================================================
// AUTHORITY STATE (singleton)
// ============================================================================

interface AuthorityState {
  currentLevel: AuthorityLevel;
  grantedAt: number;
  grantedBy: 'policy' | 'user' | 'escalation';
  intent: Intent;
  escalationHistory: AuthorityEscalation[];
  // 🔐 SCOPE MANAGEMENT - Evita "autoridade zumbi"
  activeScope: string | null;
  scopeStack: AuthorityScope[];
}

interface AuthorityScope {
  name: string;
  level: AuthorityLevel;
  enteredAt: number;
  tool?: string;
}

interface AuthorityEscalation {
  from: AuthorityLevel;
  to: AuthorityLevel;
  reason: string;
  approvedBy: 'policy' | 'user' | 'auto';
  timestamp: number;
  scope?: string;
}

let authorityState: AuthorityState | null = null;

// ============================================================================
// AUTHORITY RESOLUTION
// ============================================================================

export interface AuthorityContext {
  intent: Intent;
  workspaceHasFiles: boolean;
  hasCriticalFiles: boolean;  // package.json, .env, etc
  userConfirmed?: boolean;
}

/**
 * Resolve a autoridade inicial baseada no contexto
 */
export const resolve = (ctx: AuthorityContext): AuthorityState => {
  const policy = INTENT_POLICIES[ctx.intent];
  
  // Determinar nível inicial
  let initialLevel: AuthorityLevel = policy.maxAuthority;
  
  // Se workspace tem arquivos críticos e intent não é CREATE, ser mais conservador
  if (ctx.hasCriticalFiles && ctx.intent !== 'CREATE') {
    initialLevel = downgrade(initialLevel);
  }
  
  authorityState = {
    currentLevel: initialLevel,
    grantedAt: Date.now(),
    grantedBy: 'policy',
    intent: ctx.intent,
    escalationHistory: [],
    activeScope: null,
    scopeStack: [],
  };
  
  console.log(`🔐 [AUTHORITY] Resolved: ${initialLevel} for intent ${ctx.intent}`);
  return authorityState;
};

/**
 * Obter estado atual de autoridade
 */
export const getState = (): AuthorityState | null => authorityState;

/**
 * Obter nível atual
 */
export const getCurrentLevel = (): AuthorityLevel => {
  return authorityState?.currentLevel || 'READ_ONLY';
};

// ============================================================================
// AUTHORITY CHECKS
// ============================================================================

/**
 * Verificar se uma tool pode ser executada com a autoridade atual
 */
export const canExecute = (toolName: string): { allowed: boolean; reason?: string; requiredLevel?: AuthorityLevel } => {
  if (!authorityState) {
    return { allowed: false, reason: 'No authority context. Call Authority.resolve() first.' };
  }
  
  const requiredLevel = TOOL_AUTHORITY_REQUIREMENTS[toolName] || 'SAFE_WRITE';
  const currentPower = AUTHORITY_HIERARCHY[authorityState.currentLevel];
  const requiredPower = AUTHORITY_HIERARCHY[requiredLevel];
  
  if (currentPower >= requiredPower) {
    return { allowed: true };
  }
  
  return {
    allowed: false,
    reason: `Tool "${toolName}" requires ${requiredLevel}, but current authority is ${authorityState.currentLevel}`,
    requiredLevel,
  };
};

/**
 * Verificar se pode escalar para um nível
 */
export const canEscalateTo = (targetLevel: AuthorityLevel): boolean => {
  if (!authorityState) return false;
  
  const policy = INTENT_POLICIES[authorityState.intent];
  const targetPower = AUTHORITY_HIERARCHY[targetLevel];
  const maxPower = AUTHORITY_HIERARCHY[policy.maxAuthority];
  
  // Não pode escalar além do máximo permitido pela policy
  if (targetPower > maxPower) return false;
  
  // Se não permite auto-escalation, precisa de confirmação do usuário
  if (!policy.autoEscalate) return false;
  
  return true;
};

// ============================================================================
// AUTHORITY ESCALATION
// ============================================================================

/**
 * Escalar autoridade (com validação)
 */
export const escalate = (
  targetLevel: AuthorityLevel, 
  reason: string,
  approvedBy: 'policy' | 'user' | 'auto' = 'auto'
): { success: boolean; error?: string } => {
  if (!authorityState) {
    return { success: false, error: 'No authority context' };
  }
  
  const currentPower = AUTHORITY_HIERARCHY[authorityState.currentLevel];
  const targetPower = AUTHORITY_HIERARCHY[targetLevel];
  
  // Já tem esse nível ou maior
  if (currentPower >= targetPower) {
    return { success: true };
  }
  
  // Verificar se pode escalar
  if (approvedBy !== 'user' && !canEscalateTo(targetLevel)) {
    return { 
      success: false, 
      error: `Cannot auto-escalate to ${targetLevel}. User confirmation required.` 
    };
  }
  
  // Registrar escalação
  const escalation: AuthorityEscalation = {
    from: authorityState.currentLevel,
    to: targetLevel,
    reason,
    approvedBy,
    timestamp: Date.now(),
  };
  
  authorityState.escalationHistory.push(escalation);
  authorityState.currentLevel = targetLevel;
  authorityState.grantedBy = approvedBy === 'user' ? 'user' : 'escalation';
  
  console.log(`🔐 [AUTHORITY] Escalated: ${escalation.from} → ${escalation.to} (${reason})`);
  
  return { success: true };
};

/**
 * Escalar para executar uma tool específica
 */
export const escalateForTool = (toolName: string, userConfirmed: boolean = false): { success: boolean; error?: string } => {
  const check = canExecute(toolName);
  
  if (check.allowed) {
    return { success: true };
  }
  
  if (!check.requiredLevel) {
    return { success: false, error: check.reason };
  }
  
  return escalate(
    check.requiredLevel,
    `Required for tool: ${toolName}`,
    userConfirmed ? 'user' : 'auto'
  );
};

// ============================================================================
// AUTHORITY HELPERS
// ============================================================================

/**
 * Rebaixar um nível de autoridade
 */
const downgrade = (level: AuthorityLevel): AuthorityLevel => {
  switch (level) {
    case 'SYSTEM_CRITICAL': return 'DESTRUCTIVE';
    case 'DESTRUCTIVE': return 'SAFE_WRITE';
    case 'SAFE_WRITE': return 'READ_ONLY';
    default: return 'READ_ONLY';
  }
};

/**
 * Verificar se uma tool é destrutiva
 */
export const isDestructive = (toolName: string): boolean => {
  const level = TOOL_AUTHORITY_REQUIREMENTS[toolName];
  return level === 'DESTRUCTIVE' || level === 'SYSTEM_CRITICAL';
};

/**
 * Verificar se uma tool é crítica para o sistema
 */
export const isSystemCritical = (toolName: string): boolean => {
  return TOOL_AUTHORITY_REQUIREMENTS[toolName] === 'SYSTEM_CRITICAL';
};

/**
 * Obter nível requerido por uma tool
 */
export const getRequiredLevel = (toolName: string): AuthorityLevel => {
  return TOOL_AUTHORITY_REQUIREMENTS[toolName] || 'SAFE_WRITE';
};

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Resetar autoridade (fim de sessão)
 */
export const reset = (): void => {
  if (authorityState) {
    console.log(`🔐 [AUTHORITY] Session ended. Escalations: ${authorityState.escalationHistory.length}`);
  }
  authorityState = null;
};

// ============================================================================
// SCOPE MANAGEMENT - Evita "autoridade zumbi"
// ============================================================================

/**
 * Entrar em um scope de autoridade (para uma operação específica)
 * A escalação só vale dentro desse scope
 */
export const enterScope = (name: string, tool?: string): void => {
  if (!authorityState) return;
  
  const scope: AuthorityScope = {
    name,
    level: authorityState.currentLevel,
    enteredAt: Date.now(),
    tool,
  };
  
  authorityState.scopeStack.push(scope);
  authorityState.activeScope = name;
  
  console.log(`🔐 [AUTHORITY] Entered scope: ${name} (level: ${scope.level})`);
};

/**
 * Sair do scope atual e restaurar nível anterior
 */
export const exitScope = (): void => {
  if (!authorityState || authorityState.scopeStack.length === 0) return;
  
  const exitedScope = authorityState.scopeStack.pop()!;
  const previousScope = authorityState.scopeStack[authorityState.scopeStack.length - 1];
  
  // Restaurar nível do scope anterior (ou base)
  if (previousScope) {
    authorityState.currentLevel = previousScope.level;
    authorityState.activeScope = previousScope.name;
  } else {
    // Voltar ao nível base da policy
    const policy = INTENT_POLICIES[authorityState.intent];
    authorityState.currentLevel = policy.maxAuthority;
    authorityState.activeScope = null;
  }
  
  console.log(`🔐 [AUTHORITY] Exited scope: ${exitedScope.name} → restored to ${authorityState.currentLevel}`);
};

/**
 * Obter scope ativo
 */
export const getActiveScope = (): string | null => {
  return authorityState?.activeScope || null;
};

/**
 * Verificar se está em um scope específico
 */
export const isInScope = (scopeName: string): boolean => {
  return authorityState?.scopeStack.some(s => s.name === scopeName) || false;
};

/**
 * Obter histórico de escalações
 */
export const getEscalationHistory = (): AuthorityEscalation[] => {
  return authorityState?.escalationHistory || [];
};

// ============================================================================
// DYNAMIC RE-EVALUATION (risco #2 - mundo muda, authority deve reavaliar)
// ============================================================================

/**
 * Reavaliar autoridade baseado em mudança de estado do workspace
 * Chamado após certas tools que mudam o contexto
 */
export const reevaluate = (newContext: Partial<AuthorityContext>): void => {
  if (!authorityState) return;
  
  const currentLevel = authorityState.currentLevel;
  const policy = INTENT_POLICIES[authorityState.intent];
  
  // Se workspace ficou crítico e não era, rebaixar
  if (newContext.hasCriticalFiles && authorityState.intent !== 'CREATE') {
    const newLevel = downgrade(currentLevel);
    if (newLevel !== currentLevel) {
      console.log(`🔐 [AUTHORITY] Re-evaluated: ${currentLevel} → ${newLevel} (workspace became critical)`);
      authorityState.currentLevel = newLevel;
      authorityState.escalationHistory.push({
        from: currentLevel,
        to: newLevel,
        reason: 'Workspace state changed to critical',
        approvedBy: 'policy',
        timestamp: Date.now(),
      });
    }
  }
};

/**
 * Notificar que um arquivo crítico foi criado
 */
export const notifyCriticalFileCreated = (filename: string): void => {
  console.log(`🔐 [AUTHORITY] Critical file created: ${filename}`);
  reevaluate({ hasCriticalFiles: true });
};

/**
 * Notificar que workspace foi limpo
 */
export const notifyWorkspaceCleared = (): void => {
  console.log(`🔐 [AUTHORITY] Workspace cleared`);
  // Workspace vazio = pode relaxar um pouco
  if (authorityState && authorityState.intent === 'CREATE') {
    // Restaurar nível máximo para CREATE
    const policy = INTENT_POLICIES['CREATE'];
    authorityState.currentLevel = policy.maxAuthority;
  }
};

/**
 * Gerar resumo da sessão de autoridade
 */
export const getSummary = (): string => {
  if (!authorityState) return 'No authority session';
  
  const { currentLevel, intent, escalationHistory, grantedBy } = authorityState;
  const escalations = escalationHistory.length;
  
  return `Authority: ${currentLevel} | Intent: ${intent} | Granted by: ${grantedBy} | Escalations: ${escalations}`;
};

// ============================================================================
// EXPORTS FOR LEDGER INTEGRATION
// ============================================================================

export interface AuthorityLogEntry {
  from: AuthorityLevel;
  to: AuthorityLevel;
  reason: string;
  approvedBy: 'policy' | 'user' | 'auto';
  timestamp: number;
}

export const getLastEscalation = (): AuthorityLogEntry | null => {
  if (!authorityState || authorityState.escalationHistory.length === 0) {
    return null;
  }
  return authorityState.escalationHistory[authorityState.escalationHistory.length - 1];
};
