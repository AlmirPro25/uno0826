// ============================================================================
// 🧠 EXECUTION LEDGER - Observabilidade Cognitiva
// ============================================================================
// Toda ação do agente vira um evento rastreável.
// Permite: impedir repetição, gerar explicações, auditar decisões.

export type Intent = 'CREATE' | 'MODIFY' | 'EXPLAIN' | 'DEBUG' | 'EXPLORE' | 'UNKNOWN';
export type Outcome = 'success' | 'failure' | 'partial' | 'skipped';

export interface ExecutionEvent {
  step: number;
  timestamp: number;
  intent: Intent;
  tool: string;
  args: Record<string, any>;
  file?: string;
  outcome: Outcome;
  error?: string;
  duration?: number;
}

export interface ExecutionSession {
  sessionId: string;
  startedAt: number;
  intent: Intent;
  events: ExecutionEvent[];
  attemptCounts: Record<string, number>; // tool+file -> count
}

// Singleton state
let currentSession: ExecutionSession | null = null;
let stepCounter = 0;

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export const startSession = (intent: Intent): ExecutionSession => {
  currentSession = {
    sessionId: `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    startedAt: Date.now(),
    intent,
    events: [],
    attemptCounts: {}
  };
  stepCounter = 0;
  console.log(`📋 [LEDGER] Session started: ${currentSession.sessionId} | Intent: ${intent}`);
  return currentSession;
};

export const getSession = (): ExecutionSession | null => currentSession;

export const endSession = (): ExecutionSession | null => {
  const session = currentSession;
  if (session) {
    console.log(`📋 [LEDGER] Session ended: ${session.sessionId} | Events: ${session.events.length}`);
  }
  currentSession = null;
  stepCounter = 0;
  return session;
};

// ============================================================================
// EVENT LOGGING
// ============================================================================

export const logEvent = (
  tool: string,
  args: Record<string, any>,
  outcome: Outcome,
  error?: string,
  duration?: number
): ExecutionEvent | null => {
  if (!currentSession) {
    console.warn('[LEDGER] No active session, event not logged');
    return null;
  }

  stepCounter++;
  const event: ExecutionEvent = {
    step: stepCounter,
    timestamp: Date.now(),
    intent: currentSession.intent,
    tool,
    args,
    file: args.path || args.file || args.paths?.[0],
    outcome,
    error,
    duration
  };

  currentSession.events.push(event);

  // Track attempt counts for loop detection
  const attemptKey = `${tool}:${event.file || 'global'}`;
  currentSession.attemptCounts[attemptKey] = (currentSession.attemptCounts[attemptKey] || 0) + 1;

  const emoji = outcome === 'success' ? '✅' : outcome === 'failure' ? '❌' : '⚠️';
  console.log(`📋 [LEDGER] Step ${stepCounter}: ${emoji} ${tool} ${event.file ? `on ${event.file}` : ''}`);

  return event;
};

// ============================================================================
// LOOP DETECTION & PREVENTION
// ============================================================================

const MAX_ATTEMPTS_PER_ACTION = 3;

// Track executed actions com hash para detectar ações idênticas
const executedActions = new Map<string, { count: number; lastArgs: string }>();

const hashArgs = (args: Record<string, any>): string => {
  return JSON.stringify(args, Object.keys(args).sort());
};

export const hasExecutedIdentical = (tool: string, args: Record<string, any>): boolean => {
  const argsHash = hashArgs(args);
  const key = `${tool}:${argsHash}`;
  return executedActions.has(key);
};

export const markExecuted = (tool: string, args: Record<string, any>): void => {
  const argsHash = hashArgs(args);
  const key = `${tool}:${argsHash}`;
  const existing = executedActions.get(key);
  executedActions.set(key, {
    count: (existing?.count || 0) + 1,
    lastArgs: argsHash
  });
};

export const clearExecutedActions = (): void => {
  executedActions.clear();
};

export const canAttempt = (tool: string, file?: string): { allowed: boolean; attempts: number; reason?: string } => {
  if (!currentSession) return { allowed: true, attempts: 0 };

  const attemptKey = `${tool}:${file || 'global'}`;
  const attempts = currentSession.attemptCounts[attemptKey] || 0;

  if (attempts >= MAX_ATTEMPTS_PER_ACTION) {
    return {
      allowed: false,
      attempts,
      reason: `Maximum attempts (${MAX_ATTEMPTS_PER_ACTION}) reached for ${tool} on ${file || 'this target'}`
    };
  }

  return { allowed: true, attempts };
};

export const getAttemptCount = (tool: string, file?: string): number => {
  if (!currentSession) return 0;
  const attemptKey = `${tool}:${file || 'global'}`;
  return currentSession.attemptCounts[attemptKey] || 0;
};

// ============================================================================
// INTENT CLASSIFICATION (Híbrida: linguagem + estado)
// ============================================================================

const CREATE_KEYWORDS = ['criar', 'create', 'make', 'build', 'fazer', 'desenvolver', 'gerar', 'generate', 'novo', 'new', 'app', 'aplicativo', 'projeto', 'project', 'website', 'site'];
const MODIFY_KEYWORDS = ['editar', 'edit', 'mudar', 'change', 'alterar', 'modify', 'atualizar', 'update', 'fix', 'corrigir', 'ajustar', 'adicionar', 'add', 'remover', 'remove', 'refatorar', 'refactor'];
const DEBUG_KEYWORDS = ['erro', 'error', 'bug', 'broken', 'quebrado', 'não funciona', 'not working', 'falha', 'fail', 'crash', 'debug', 'problema', 'problem'];
const EXPLORE_KEYWORDS = ['mostrar', 'show', 'listar', 'list', 'ver', 'see', 'encontrar', 'find', 'buscar', 'search', 'onde', 'where', 'qual', 'which'];
const EXPLAIN_KEYWORDS = ['explicar', 'explain', 'como', 'how', 'por que', 'why', 'o que', 'what', 'entender', 'understand', 'documentar', 'document'];

// Contexto do workspace para classificação híbrida
interface WorkspaceContext {
  hasFiles: boolean;
  hasPackageJson: boolean;
  fileCount: number;
}

let workspaceContext: WorkspaceContext = {
  hasFiles: false,
  hasPackageJson: false,
  fileCount: 0
};

export const setWorkspaceContext = (ctx: WorkspaceContext): void => {
  workspaceContext = ctx;
};

export const classifyIntent = (userMessage: string): Intent => {
  const lower = userMessage.toLowerCase();

  // Priority order matters - more specific first
  if (DEBUG_KEYWORDS.some(kw => lower.includes(kw))) return 'DEBUG';
  
  // CREATE vs MODIFY: depende do estado do workspace
  const hasCreateKeyword = CREATE_KEYWORDS.some(kw => lower.includes(kw));
  const hasModifyKeyword = MODIFY_KEYWORDS.some(kw => lower.includes(kw));
  
  // Se tem arquivos e pede modificação, é MODIFY
  if (hasModifyKeyword && workspaceContext.hasFiles) return 'MODIFY';
  
  // Se pede criação explícita, é CREATE
  if (hasCreateKeyword) return 'CREATE';
  
  // Se tem arquivos e não é explicação, provavelmente é MODIFY
  if (workspaceContext.hasFiles && !EXPLAIN_KEYWORDS.some(kw => lower.includes(kw))) {
    // Detectar intenção implícita de modificação
    if (lower.includes('adicione') || lower.includes('coloque') || lower.includes('mude')) {
      return 'MODIFY';
    }
  }
  
  if (EXPLORE_KEYWORDS.some(kw => lower.includes(kw))) return 'EXPLORE';
  if (EXPLAIN_KEYWORDS.some(kw => lower.includes(kw))) return 'EXPLAIN';

  // Default: se workspace vazio, provavelmente quer criar
  if (!workspaceContext.hasFiles) return 'CREATE';
  
  return 'UNKNOWN';
};

// ============================================================================
// INTENT DRIFT DETECTION
// ============================================================================

export const detectIntentDrift = (newMessage: string): { drifted: boolean; from: Intent; to: Intent } | null => {
  if (!currentSession) return null;

  const newIntent = classifyIntent(newMessage);
  if (newIntent !== currentSession.intent && newIntent !== 'UNKNOWN') {
    return {
      drifted: true,
      from: currentSession.intent,
      to: newIntent
    };
  }

  return null;
};

// ============================================================================
// SESSION SUMMARY & AUDIT
// ============================================================================

export const getSessionSummary = (): string => {
  if (!currentSession) return 'No active session';

  const { events, intent, sessionId } = currentSession;
  const successCount = events.filter(e => e.outcome === 'success').length;
  const failureCount = events.filter(e => e.outcome === 'failure').length;
  const toolsUsed = [...new Set(events.map(e => e.tool))];
  const filesModified = [...new Set(events.filter(e => e.file).map(e => e.file))];

  return `
Session: ${sessionId}
Intent: ${intent}
Steps: ${events.length} (✅ ${successCount} | ❌ ${failureCount})
Tools: ${toolsUsed.join(', ')}
Files: ${filesModified.join(', ') || 'none'}
`.trim();
};

export const getFailedAttempts = (): ExecutionEvent[] => {
  if (!currentSession) return [];
  return currentSession.events.filter(e => e.outcome === 'failure');
};

export const getRepeatedActions = (): Array<{ action: string; count: number }> => {
  if (!currentSession) return [];
  
  return Object.entries(currentSession.attemptCounts)
    .filter(([_, count]) => count > 1)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count);
};

// ============================================================================
// RESPONSE VALIDATOR
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  violations: string[];
  warnings: string[];
}

export const validateResponse = (
  intent: Intent,
  toolsCalled: string[],
  hasTextResponse: boolean
): ValidationResult => {
  const violations: string[] = [];
  const warnings: string[] = [];

  // Rule: CREATE/MODIFY/DEBUG must call tools
  if (['CREATE', 'MODIFY', 'DEBUG'].includes(intent) && toolsCalled.length === 0) {
    violations.push(`Intent ${intent} requires tool calls, but none were made`);
  }

  // Rule: CREATE should use write_multiple_files, not multiple write_file
  if (intent === 'CREATE') {
    const writeFileCalls = toolsCalled.filter(t => t === 'write_file').length;
    const writeMultipleCalls = toolsCalled.filter(t => t === 'write_multiple_files').length;
    
    if (writeFileCalls > 2 && writeMultipleCalls === 0) {
      warnings.push('Consider using write_multiple_files instead of multiple write_file calls');
    }
  }

  // Rule: EXPLAIN should primarily be text, tools optional
  if (intent === 'EXPLAIN' && toolsCalled.length > 3) {
    warnings.push('EXPLAIN intent should focus on explanation, not heavy tool usage');
  }

  // Rule: DEBUG should read before writing
  if (intent === 'DEBUG') {
    const firstWrite = toolsCalled.findIndex(t => t.includes('write'));
    const firstRead = toolsCalled.findIndex(t => t.includes('read'));
    
    if (firstWrite !== -1 && (firstRead === -1 || firstRead > firstWrite)) {
      warnings.push('DEBUG should read/analyze before writing fixes');
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    warnings
  };
};

// ============================================================================
// AUTHORITY EVENT LOGGING (para auditoria)
// ============================================================================

export interface AuthorityEvent {
  step: number;
  timestamp: number;
  from: string;
  to: string;
  reason: string;
  approvedBy: 'policy' | 'user' | 'auto';
  tool?: string;
}

const authorityEvents: AuthorityEvent[] = [];

export const logAuthorityEvent = (
  from: string,
  to: string,
  reason: string,
  approvedBy: 'policy' | 'user' | 'auto',
  tool?: string
): void => {
  const event: AuthorityEvent = {
    step: stepCounter,
    timestamp: Date.now(),
    from,
    to,
    reason,
    approvedBy,
    tool,
  };
  authorityEvents.push(event);
  console.log(`📋 [LEDGER] Authority: ${from} → ${to} (${reason})`);
};

export const getAuthorityEvents = (): AuthorityEvent[] => [...authorityEvents];

export const clearAuthorityEvents = (): void => {
  authorityEvents.length = 0;
};
