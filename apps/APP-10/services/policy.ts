// ============================================================================
// 🧠 DECISION POLICY ENGINE - Governança Decisória
// ============================================================================
// Authority responde: "pode ou não pode"
// Policy responde: "deveria?"
//
// Não bloqueia tools. Bloqueia decisões ruins.
// Avalia: impacto, reversibilidade, custo, risco, histórico recente.

import { Intent } from './executionLedger';
import { AuthorityLevel, getCurrentLevel, getRequiredLevel } from './authority';

// ============================================================================
// POLICY DECISION TYPES
// ============================================================================

export type PolicyDecision = 
  | 'allow'                    // Pode prosseguir
  | 'allow_with_warning'       // Pode, mas avisa
  | 'require_confirmation'     // Precisa confirm explícito
  | 'suggest_alternative'      // Sugere outro caminho
  | 'deny';                    // Bloqueia

export interface PolicyEvaluation {
  decision: PolicyDecision;
  reason: string;
  alternative?: string;        // Sugestão de alternativa
  riskScore: number;           // 0-100
  reversible: boolean;
  requiresRationale?: boolean; // Precisa explicar por quê
}

// ============================================================================
// WORKSPACE STATE TRACKING
// ============================================================================

export interface WorkspaceState {
  fileCount: number;
  hasCriticalFiles: boolean;
  criticalFiles: string[];     // package.json, .env, etc
  hasUnsavedChanges: boolean;
  lastModifiedFile?: string;
  recentActions: RecentAction[];
}

interface RecentAction {
  tool: string;
  file?: string;
  timestamp: number;
  wasDestructive: boolean;
}

let workspaceState: WorkspaceState = {
  fileCount: 0,
  hasCriticalFiles: false,
  criticalFiles: [],
  hasUnsavedChanges: false,
  recentActions: [],
};

// ============================================================================
// WORKSPACE STATE MANAGEMENT
// ============================================================================

const CRITICAL_FILES = [
  'package.json',
  'package-lock.json',
  '.env',
  '.env.local',
  '.env.production',
  'tsconfig.json',
  'vite.config.ts',
  'vite.config.js',
  'next.config.js',
  '.gitignore',
];

export const updateWorkspaceState = (files: Array<{ path?: string; name: string }>): void => {
  const criticalFound = files.filter(f => 
    CRITICAL_FILES.includes(f.name) || CRITICAL_FILES.some(cf => f.path?.endsWith(cf))
  );
  
  workspaceState = {
    ...workspaceState,
    fileCount: files.length,
    hasCriticalFiles: criticalFound.length > 0,
    criticalFiles: criticalFound.map(f => f.path || f.name),
  };
};

export const recordAction = (tool: string, file?: string, wasDestructive: boolean = false): void => {
  const action: RecentAction = {
    tool,
    file,
    timestamp: Date.now(),
    wasDestructive,
  };
  
  // Manter só últimas 20 ações
  workspaceState.recentActions = [
    action,
    ...workspaceState.recentActions.slice(0, 19),
  ];
  
  if (file) {
    workspaceState.lastModifiedFile = file;
  }
};

export const getWorkspaceState = (): WorkspaceState => ({ ...workspaceState });

// ============================================================================
// RISK SCORING
// ============================================================================

interface RiskFactors {
  toolRisk: number;           // Risco inerente da tool
  contextRisk: number;        // Risco dado o contexto atual
  historyRisk: number;        // Risco dado histórico recente
  targetRisk: number;         // Risco do alvo (arquivo crítico?)
}

const TOOL_BASE_RISK: Record<string, number> = {
  // Leitura - risco zero
  'read_file': 0,
  'read_multiple_files': 0,
  'search_files': 0,
  'list_directory': 0,
  'get_file_info': 0,
  
  // Escrita - risco baixo
  'write_file': 20,
  'write_multiple_files': 25,
  'append_file': 15,
  'replace_string': 15,
  
  // Modificação - risco médio
  'move_file': 30,
  'rename_symbol': 25,
  'insert_code': 20,
  
  // Deleção - risco alto
  'delete_file': 50,
  'clear_workspace': 80,
  
  // Execução - risco variável
  'run_command': 40,
  'install_package': 35,
  'uninstall_package': 45,
  
  // Sistema - risco crítico
  'kill_port': 60,
  'stop_process': 55,
  'stop_all_processes': 75,
  'system_reset': 95,
  'reset_project': 90,
};

const calculateRisk = (
  tool: string, 
  targetFile: string | undefined,
  intent: Intent
): RiskFactors => {
  const toolRisk = TOOL_BASE_RISK[tool] ?? 30;
  
  // Context risk: workspace vazio é menos arriscado
  let contextRisk = 0;
  if (workspaceState.hasCriticalFiles) contextRisk += 20;
  if (workspaceState.fileCount > 10) contextRisk += 10;
  
  // History risk: muitas ações destrutivas recentes = mais risco
  const recentDestructive = workspaceState.recentActions
    .filter(a => a.wasDestructive && Date.now() - a.timestamp < 60000)
    .length;
  const historyRisk = Math.min(recentDestructive * 15, 45);
  
  // Target risk: arquivo crítico = mais risco
  let targetRisk = 0;
  if (targetFile) {
    const isCritical = CRITICAL_FILES.some(cf => 
      targetFile.endsWith(cf) || targetFile === cf
    );
    if (isCritical) targetRisk = 40;
  }
  
  return { toolRisk, contextRisk, historyRisk, targetRisk };
};

const computeRiskScore = (factors: RiskFactors): number => {
  // Weighted average
  const score = (
    factors.toolRisk * 0.4 +
    factors.contextRisk * 0.2 +
    factors.historyRisk * 0.2 +
    factors.targetRisk * 0.2
  );
  return Math.min(Math.round(score), 100);
};

// ============================================================================
// REVERSIBILITY CHECK
// ============================================================================

const IRREVERSIBLE_TOOLS = new Set([
  'delete_file',
  'clear_workspace',
  'reset_project',
  'system_reset',
  'uninstall_package',
  'stop_all_processes',
]);

const isReversible = (tool: string): boolean => {
  return !IRREVERSIBLE_TOOLS.has(tool);
};

// ============================================================================
// POLICY RULES
// ============================================================================

interface PolicyContext {
  intent: Intent;
  tool: string;
  args: Record<string, any>;
  authorityLevel: AuthorityLevel;
  workspaceState: WorkspaceState;
}

type PolicyRule = (ctx: PolicyContext) => PolicyEvaluation | null;

const POLICY_RULES: PolicyRule[] = [
  // Rule 1: Não deletar arquivo crítico sem confirmação explícita
  (ctx) => {
    if (ctx.tool !== 'delete_file') return null;
    const target = ctx.args.path;
    if (CRITICAL_FILES.some(cf => target?.endsWith(cf))) {
      return {
        decision: 'require_confirmation',
        reason: `Deleting critical file "${target}" requires explicit confirmation`,
        riskScore: 85,
        reversible: false,
        requiresRationale: true,
      };
    }
    return null;
  },
  
  // Rule 2: Não limpar workspace se tem arquivos críticos e intent não é CREATE
  (ctx) => {
    if (ctx.tool !== 'clear_workspace') return null;
    if (ctx.intent !== 'CREATE' && ctx.workspaceState.hasCriticalFiles) {
      return {
        decision: 'suggest_alternative',
        reason: 'Clearing workspace with critical files when intent is not CREATE',
        alternative: 'Consider using delete_file for specific files instead',
        riskScore: 75,
        reversible: false,
      };
    }
    return null;
  },
  
  // Rule 3: Muitas ações destrutivas em sequência = pausa
  (ctx) => {
    const recentDestructive = ctx.workspaceState.recentActions
      .filter(a => a.wasDestructive && Date.now() - a.timestamp < 30000)
      .length;
    
    if (recentDestructive >= 3) {
      const requiredLevel = getRequiredLevel(ctx.tool);
      if (requiredLevel === 'DESTRUCTIVE' || requiredLevel === 'SYSTEM_CRITICAL') {
        return {
          decision: 'allow_with_warning',
          reason: `Multiple destructive actions in short time (${recentDestructive} in last 30s)`,
          riskScore: 60,
          reversible: isReversible(ctx.tool),
        };
      }
    }
    return null;
  },
  
  // Rule 4: EXPLAIN intent não deveria chamar tools destrutivas
  (ctx) => {
    if (ctx.intent !== 'EXPLAIN') return null;
    const requiredLevel = getRequiredLevel(ctx.tool);
    if (requiredLevel === 'DESTRUCTIVE' || requiredLevel === 'SYSTEM_CRITICAL') {
      return {
        decision: 'deny',
        reason: `Intent is EXPLAIN but tool "${ctx.tool}" is destructive`,
        alternative: 'Use read-only tools for explanation',
        riskScore: 70,
        reversible: true,
      };
    }
    return null;
  },
  
  // Rule 5: EXPLORE intent só pode usar READ_ONLY
  (ctx) => {
    if (ctx.intent !== 'EXPLORE') return null;
    const requiredLevel = getRequiredLevel(ctx.tool);
    if (requiredLevel !== 'READ_ONLY') {
      return {
        decision: 'deny',
        reason: `Intent is EXPLORE but tool "${ctx.tool}" requires ${requiredLevel}`,
        alternative: 'Use navigation tools like list_directory, search_files',
        riskScore: 50,
        reversible: true,
      };
    }
    return null;
  },
  
  // Rule 6: Sobrescrever arquivo recém-modificado = warning
  (ctx) => {
    if (ctx.tool !== 'write_file' && ctx.tool !== 'write_multiple_files') return null;
    const target = ctx.args.path || ctx.args.files?.[0]?.path;
    
    const recentModification = ctx.workspaceState.recentActions.find(a => 
      a.file === target && 
      Date.now() - a.timestamp < 10000 &&
      (a.tool === 'write_file' || a.tool === 'replace_string')
    );
    
    if (recentModification) {
      return {
        decision: 'allow_with_warning',
        reason: `File "${target}" was just modified ${Math.round((Date.now() - recentModification.timestamp) / 1000)}s ago`,
        riskScore: 35,
        reversible: true,
      };
    }
    return null;
  },
  
  // Rule 7: system_reset sempre requer confirmação E rationale
  (ctx) => {
    if (ctx.tool !== 'system_reset') return null;
    if (!ctx.args.confirm) {
      return {
        decision: 'require_confirmation',
        reason: 'system_reset is a critical operation',
        riskScore: 95,
        reversible: false,
        requiresRationale: true,
      };
    }
    return null;
  },
];

// ============================================================================
// MAIN EVALUATION FUNCTION
// ============================================================================

export const evaluate = (
  intent: Intent,
  tool: string,
  args: Record<string, any>
): PolicyEvaluation => {
  const ctx: PolicyContext = {
    intent,
    tool,
    args,
    authorityLevel: getCurrentLevel(),
    workspaceState: getWorkspaceState(),
  };
  
  // Run all rules, first match wins
  for (const rule of POLICY_RULES) {
    const result = rule(ctx);
    if (result) {
      console.log(`📜 [POLICY] ${tool}: ${result.decision} - ${result.reason}`);
      return result;
    }
  }
  
  // Default: calculate risk and allow
  const targetFile = args.path || args.file || args.files?.[0]?.path;
  const riskFactors = calculateRisk(tool, targetFile, intent);
  const riskScore = computeRiskScore(riskFactors);
  
  // High risk without explicit rule = warning
  if (riskScore >= 60) {
    return {
      decision: 'allow_with_warning',
      reason: `High risk score (${riskScore})`,
      riskScore,
      reversible: isReversible(tool),
    };
  }
  
  return {
    decision: 'allow',
    reason: 'No policy violations',
    riskScore,
    reversible: isReversible(tool),
  };
};

// ============================================================================
// POLICY ENFORCEMENT HELPERS
// ============================================================================

export const shouldBlock = (evaluation: PolicyEvaluation): boolean => {
  return evaluation.decision === 'deny';
};

export const shouldWarn = (evaluation: PolicyEvaluation): boolean => {
  return evaluation.decision === 'allow_with_warning' || 
         evaluation.decision === 'suggest_alternative';
};

export const needsConfirmation = (evaluation: PolicyEvaluation): boolean => {
  return evaluation.decision === 'require_confirmation';
};

export const getWarningMessage = (evaluation: PolicyEvaluation): string => {
  let msg = `⚠️ Policy: ${evaluation.reason}`;
  if (evaluation.alternative) {
    msg += `\n💡 Suggestion: ${evaluation.alternative}`;
  }
  msg += `\n📊 Risk: ${evaluation.riskScore}/100 | Reversible: ${evaluation.reversible ? 'Yes' : 'No'}`;
  return msg;
};

// ============================================================================
// RESET
// ============================================================================

export const reset = (): void => {
  workspaceState = {
    fileCount: 0,
    hasCriticalFiles: false,
    criticalFiles: [],
    hasUnsavedChanges: false,
    recentActions: [],
  };
};
