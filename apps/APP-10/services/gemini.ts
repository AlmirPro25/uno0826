import { GoogleGenAI, Chat, Type, Part, GenerateContentResponse, Tool, FunctionDeclaration } from "@google/genai";
import { INITIAL_SYSTEM_INSTRUCTION, TOOLS_DECLARATION, getSystemInstruction } from "../constants";
import type { ProjectFile, RefinedProject, VirtualFile, Attachment } from "../types";
import { generateFileTreeString, generateContextTree } from "../utils/fileSystem";
import { useStore } from "../store";
import { WebContainerService } from "./webcontainer";
import * as Analyzer from "./analyzer";
import * as Memory from "./memory";
import { detectBundle, parseBundle, ParsedFile } from "./bundleParser";
// 🧬 ALEXANDRIA MANIFEST INTEGRATION - 127 Manifestos de Conhecimento Especializado
import { enrichWithManifests, previewManifests } from "./manifestIntegration";
// 🧠 EXECUTION LEDGER - Observabilidade Cognitiva
import * as Ledger from "./executionLedger";
// 🔐 CAPABILITY GATE - Tool Gating baseado em capabilities
import { getAvailableTools, getCapabilities, isToolAvailable } from "./capabilityGate";
// 🔐 AUTHORITY LAYER - Governança Cognitiva
import * as Authority from "./authority";
// 📜 POLICY ENGINE - Governança Decisória
import * as Policy from "./policy";
// 🧠 FASE 8 - Policy Memory Window (memória temporal com decaimento)
import * as PolicyMemory from "./policyMemory";
// 📝 FASE 9 - Self-Explanation Ledger (por que NÃO fiz algo)
import * as SelfExplanation from "./selfExplanation";
// 🗳️ FASE 10 - Multi-agent Arbitration (resolução de conflitos)
import * as Arbitration from "./arbitration";

// ============================================================================
// 🐛 AUTO-FIX SYSTEM
// ============================================================================

interface ErrorPattern {
  pattern: RegExp;
  type: string;
  autoFix: (match: RegExpMatchArray, context: any) => Promise<string | null>;
}

const ERROR_PATTERNS: ErrorPattern[] = [
  {
    pattern: /Cannot find module ['"]([^'"]+)['"]/i,
    type: 'missing_module',
    autoFix: async (match) => {
      const moduleName = match[1];
      // Extrair nome do pacote (sem path relativo)
      if (moduleName.startsWith('.') || moduleName.startsWith('/')) {
        return null; // Arquivo local, não pacote
      }
      const packageName = moduleName.split('/')[0].replace('@', '');
      return `install_package("${moduleName.startsWith('@') ? moduleName.split('/').slice(0, 2).join('/') : packageName}")`;
    }
  },
  {
    pattern: /Module not found.*['"]([^'"]+)['"]/i,
    type: 'module_not_found',
    autoFix: async (match) => {
      const moduleName = match[1];
      if (moduleName.startsWith('.')) return null;
      return `install_package("${moduleName}")`;
    }
  },
  {
    pattern: /ENOENT.*no such file.*['"]([^'"]+)['"]/i,
    type: 'file_not_found',
    autoFix: async () => null // Precisa criar o arquivo
  },
  {
    pattern: /SyntaxError.*Unexpected token/i,
    type: 'syntax_error',
    autoFix: async () => null // Precisa análise mais profunda
  },
  {
    pattern: /npm ERR! code ERESOLVE/i,
    type: 'dependency_conflict',
    autoFix: async () => `run_command("npm install --legacy-peer-deps")`
  },
  {
    pattern: /EADDRINUSE.*port (\d+)/i,
    type: 'port_in_use',
    autoFix: async (match) => {
      const port = match[1];
      return `run_command("npx kill-port ${port}; npm run dev")`;
    }
  }
];

export const analyzeError = (errorText: string): { type: string; suggestion: string | null } => {
  for (const pattern of ERROR_PATTERNS) {
    const match = errorText.match(pattern.pattern);
    if (match) {
      return {
        type: pattern.type,
        suggestion: null // Will be computed async
      };
    }
  }
  return { type: 'unknown', suggestion: null };
};

export const getAutoFixSuggestion = async (errorText: string): Promise<string | null> => {
  for (const pattern of ERROR_PATTERNS) {
    const match = errorText.match(pattern.pattern);
    if (match) {
      return await pattern.autoFix(match, {});
    }
  }
  return null;
};

let chatSession: Chat | null = null;
let currentModelId: string | null = null;

// Define the Tool Executor Interface (Extended)
export interface ToolExecutor {
  // File Operations
  readFile: (path: string) => Promise<string>;
  readMultipleFiles: (paths: string[]) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<string>;
  writeMultipleFiles: (files: Array<{path: string, content: string}>) => Promise<string>;
  deleteFile: (path: string) => Promise<string>;
  moveFile: (source: string, destination: string) => Promise<string>;
  replaceString: (path: string, search: string, replace: string) => Promise<string>;
  searchFiles: (query: string, path?: string) => Promise<string>;
  formatFile: (path: string) => Promise<string>;
  
  // Terminal & Packages
  runCommand: (command: string, timeout?: number) => Promise<string>;
  runScript: (script: string) => Promise<string>;
  installPackage: (packages: string, dev?: boolean) => Promise<string>;
  uninstallPackage: (packages: string) => Promise<string>;
  git: (args: string) => Promise<string>;
  
  // Project Management
  addTask: (text: string) => Promise<string>;
  completeTask: (id: string) => Promise<string>;
  analyzeProject: () => Promise<string>;
  
  // System Control
  clearWorkspace: () => Promise<string>;
  resetProject: () => Promise<string>;
  restartServer: () => Promise<string>;
  clearTerminal: () => Promise<string>;
  
  // Health Check & Testing
  checkAppHealth: () => Promise<string>;
  getErrorLog: () => Promise<string>;
  
  // 🖥️ PowerShell Process Management
  listProcesses: () => Promise<string>;
  getSystemState: () => Promise<string>;
  createTerminal: (name?: string, cwd?: string) => Promise<string>;
  closeTerminal: (tabId: string) => Promise<string>;
  closeAllTerminals: () => Promise<string>;
  startProcess: (command: string, name?: string, port?: number) => Promise<string>;
  stopProcess: (processId: string) => Promise<string>;
  stopAllProcesses: () => Promise<string>;
  killPort: (port: number) => Promise<string>;
  getProcessOutput: (processId: string, lines?: number) => Promise<string>;
  getLogs: (lines?: number, level?: string, source?: string) => Promise<string>;
  systemReset: () => Promise<string>;
  
  // 🔍 Advanced Discovery Tools (Kiro-Inspired)
  getDiagnostics: (paths: string[]) => Promise<string>;
  fileSearch: (query: string, exclude?: string) => Promise<string>;
  listDirectory: (path: string, depth?: number) => Promise<string>;
  appendFile: (path: string, content: string) => Promise<string>;
  webSearch: (query: string) => Promise<string>;
  webFetch: (url: string, selector?: string) => Promise<string>;
  grepSearch: (pattern: string, include?: string, exclude?: string, caseSensitive?: boolean) => Promise<string>;
  getFileInfo: (path: string) => Promise<string>;
  diffFiles: (file1: string, file2: string) => Promise<string>;
  createSnapshot: (name: string) => Promise<string>;
  restoreSnapshot: (name: string) => Promise<string>;
  listSnapshots: () => Promise<string>;
}

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

// ============================================================================
// 🧠 AETHER PRIME INTELLIGENCE ENGINE
// ============================================================================

export const cleanResponse = (text: string): string => {
  let cleaned = text.trim();
  const fenceRegex = /```(?:\w+)?\s*([\s\S]*?)```/g;
  const matches = [...cleaned.matchAll(fenceRegex)];
  
  if (matches.length > 0) {
      const scriptBlock = matches.find(m => m[1].includes("<script"));
      if (scriptBlock) {
          cleaned = scriptBlock[1].trim();
      } else {
          cleaned = matches[matches.length - 1][1].trim();
      }
  }
  
  return cleaned;
};

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0 || error.message?.includes("SAFETY") || error.message?.includes("400")) throw error;
    console.warn(`Retrying API call... Attempts left: ${retries}. Error: ${error.message}`);
    await new Promise(r => setTimeout(r, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

// Helper to get file content from virtual files
const getFileContent = (files: VirtualFile[], path: string): string | null => {
  const findFile = (nodes: VirtualFile[]): string | null => {
    for (const node of nodes) {
      if (node.path === path && !node.isFolder) return node.content;
      if (node.children) {
        const found = findFile(node.children);
        if (found !== null) return found;
      }
    }
    return null;
  };
  return findFile(files);
};

// --- MAIN GENERATION FUNCTION (AGENT LOOP) ---

export async function* generateInterfaceStream(
  modelId: string,
  prompt: string, 
  attachments: Attachment[] = [],
  toolExecutor: ToolExecutor,
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  
  const ai = getClient();

  // Reset session if model changes
  if (!chatSession || currentModelId !== modelId) {
    // 🔐 CAPABILITY-AWARE TOOL GATING
    // Filter tools based on current runtime capabilities
    const availableTools = getAvailableTools(TOOLS_DECLARATION);
    console.log(`🔐 [GATE] ${availableTools.length}/${TOOLS_DECLARATION.length} tools available for current capabilities`);
    
    const tools: Tool[] = [
        { functionDeclarations: availableTools as FunctionDeclaration[] }
    ];

    // 🧠 THINKING BUDGET DINÂMICO POR INTENT
    // Pensar muito não é sempre pensar bem - ajustar por tipo de tarefa
    const MODEL_THINKING_LIMITS: Record<string, number> = {
      'gemini-2.5-pro': 32768,
      'gemini-2.0-pro': 32768,
      'gemini-pro': 32768,
    };
    const modelMax = MODEL_THINKING_LIMITS[modelId] || 24576;
    
    // Intent-based thinking budget (será ajustado após classificação)
    // Por agora usa valor médio, será refinado no próximo turno
    let thinkingBudget = Math.min(modelMax, 16384);

    // 🧠 Use dynamic system instruction (capabilities fresh)
    const systemInstruction = getSystemInstruction();

    chatSession = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction,
        temperature: 0.5, // Lower temperature for more focused, efficient responses
        maxOutputTokens: 65536,
        tools: tools,

        thinkingConfig: { 
          thinkingBudget,
        }
      },
    });
    currentModelId = modelId;
  }

  // --- CONTEXT INJECTION ---
  const state = useStore.getState();
  const currentFiles = state.virtualFiles;
  const contextTree = generateContextTree(currentFiles);
  const isRuntimeBooted = state.isWcBooted;
  
  // 🧠 WORKSPACE CONTEXT para classificação híbrida de intent
  const workspaceHasPackageJson = currentFiles.some(f => f.path === 'package.json' || f.name === 'package.json');
  Ledger.setWorkspaceContext({
    hasFiles: currentFiles.length > 0,
    hasPackageJson: workspaceHasPackageJson,
    fileCount: currentFiles.length
  });

  // 🧠 EXECUTION LEDGER - Start session with intent classification (agora com contexto)
  const detectedIntent = Ledger.classifyIntent(prompt);
  Ledger.startSession(detectedIntent);
  console.log(`📋 [LEDGER] Intent classified as: ${detectedIntent} (workspace: ${currentFiles.length} files)`);
  
  // 📝 FASE 9: Iniciar sessão de self-explanation
  const sessionId = `session_${Date.now()}`;
  SelfExplanation.startSession(sessionId);
  
  // 🔐 AUTHORITY RESOLUTION - Resolver autoridade ANTES de qualquer tool
  // Fluxo: INTENT → AUTHORITY → POLICY → CAPABILITY → EXECUTION
  const hasCriticalFiles = currentFiles.some(f => 
    f.name === 'package.json' || 
    f.name === '.env' || 
    f.name === '.env.local' ||
    f.path?.includes('config')
  );
  
  const authorityContext = {
    intent: detectedIntent,
    workspaceHasFiles: currentFiles.length > 0,
    hasCriticalFiles,
  };
  
  const authorityState = Authority.resolve(authorityContext);
  console.log(`🔐 [AUTHORITY] Resolved: ${authorityState.currentLevel} for intent ${detectedIntent}`);
  
  // 📜 POLICY: Atualizar estado do workspace para avaliação de políticas
  Policy.updateWorkspaceState(currentFiles);
  
  // 🧠 INTENT-BASED THINKING BUDGET (ajuste fino)
  // CREATE/DEBUG precisam pensar mais, EXPLAIN/EXPLORE menos
  const INTENT_THINKING_BUDGETS: Record<Ledger.Intent, number> = {
    'CREATE': 8192,   // Criar é mais execução que pensamento
    'MODIFY': 8192,   // Modificar também
    'DEBUG': 16384,   // Debug precisa análise
    'EXPLAIN': 4096,  // Explicar é texto, não precisa muito
    'EXPLORE': 4096,  // Explorar é navegação
    'UNKNOWN': 8192,  // Default médio
  };
  const intentBudget = INTENT_THINKING_BUDGETS[detectedIntent];
  console.log(`🧠 [THINKING] Intent ${detectedIntent} → budget ${intentBudget}`);
  
  // Auto-include content of small, important files
  const getKeyFileContents = (files: VirtualFile[]): string => {
    const keyFiles = ['package.json', 'vite.config.js', 'vite.config.ts', 'tsconfig.json', 'tailwind.config.js'];
    const contents: string[] = [];
    
    const findFile = (nodes: VirtualFile[]): void => {
      for (const node of nodes) {
        if (!node.isFolder && keyFiles.includes(node.name) && node.content.length < 3000) {
          contents.push(`--- ${node.path} ---\n${node.content}`);
        }
        if (node.children) findFile(node.children);
      }
    };
    findFile(files);
    return contents.join('\n\n');
  };
  
  const keyContents = getKeyFileContents(currentFiles);
  const memories = Memory.getAllMemories();
  const memoryContext = Object.keys(memories).length > 0 
    ? `\n[AGENT MEMORY]\n${Object.entries(memories).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`
    : '';
  
  const runtimeStatus = isRuntimeBooted 
    ? '✅ RUNTIME ACTIVE - All commands available. Execute freely!'
    : '⚠️ RUNTIME BOOTING - File operations work. Terminal commands will auto-trigger boot.';
  
  // Detectar se é pedido de criação de projeto
  const isCreationRequest = ['criar', 'create', 'make', 'build', 'fazer', 'desenvolver', 'app', 'aplicativo', 'projeto', 'project']
    .some(kw => prompt.toLowerCase().includes(kw));
  
  const hasExistingProject = currentFiles.length > 0 && currentFiles.some(f => f.name === 'package.json');
  
  const contextHeader = `
[RUNTIME STATUS]
${runtimeStatus}

[CURRENT PROJECT STRUCTURE]
${contextTree || '(empty workspace)'}
${keyContents ? `\n[KEY FILES CONTENT]\n${keyContents}` : ''}
${memoryContext}
------------------------------------------------
🚨 **CRITICAL: YOU MUST CALL TOOLS IN THIS RESPONSE**

${isCreationRequest ? `
⚡ **PROJECT CREATION DETECTED** - Execute these tools NOW:
${hasExistingProject ? '1. clear_workspace(confirm: true) - CLEAR OLD PROJECT FIRST!' : ''}
${hasExistingProject ? '2' : '1'}. write_multiple_files([...all files...])
${hasExistingProject ? '3' : '2'}. install_package("react react-dom lucide-react")
${hasExistingProject ? '4' : '3'}. run_command("npm run dev")

DO NOT just respond with text. CALL THE TOOLS.
` : `
Execute the appropriate tools for this request.
`}

🔧 AVAILABLE TOOLS:
- clear_workspace: Clear old files before new project
- write_multiple_files: Create multiple files at once
- write_file: Create/update single file
- replace_string: Small edits
- install_package: npm install packages
- run_command: Execute shell commands
- read_file/read_multiple_files: Read existing files

🖥️ POWERSHELL MANAGEMENT:
- list_processes: See all running processes/terminals
- get_system_state: Full system state (processes, ports, logs)
- kill_port: Kill process on specific port
- stop_all_processes: Stop all running processes
- close_all_terminals: Close all terminal tabs
- system_reset: Full reset (kills everything)
`;
  
  // 🧬 ALEXANDRIA INTEGRATION: Enriquecer prompt com manifestos especializados
  const enrichedUserPrompt = enrichWithManifests(prompt);
  const finalPrompt = `${contextHeader}\n[USER REQUEST]: ${enrichedUserPrompt}`;

  let messagePayload: any;

  if (attachments.length > 0) {
    const parts: Part[] = [];
    if (finalPrompt) parts.push({ text: finalPrompt });
    attachments.forEach(att => {
        parts.push({
            inlineData: { mimeType: att.mimeType, data: att.data }
        });
    });
    messagePayload = parts; 
  } else {
    messagePayload = finalPrompt;
  }

  // --- AGENT LOOP (OPTIMIZED FOR MINIMAL API CALLS) ---
  let currentInput = messagePayload;
  let turnCount = 0;
  const MAX_TURNS = 15; // Increased to allow complex projects to complete fully
  
  // Track tools called across ALL turns (not just current)
  const allToolsCalled: string[] = [];
  
  // Track if we've completed the essential steps for project creation
  let hasCreatedFiles = false;
  let hasInstalledPackages = false;
  let hasStartedServer = false;
  let projectCreationDetected = false;
  
  // Detect if this is a project creation request
  const creationKeywords = ['create', 'criar', 'make', 'build', 'fazer', 'desenvolver', 'app', 'aplicativo', 'projeto', 'project', 'website', 'site', 'página', 'page', 'todo', 'counter', 'calculator', 'game', 'dashboard'];
  const isProjectCreation = creationKeywords.some(kw => prompt.toLowerCase().includes(kw));
  
  while (turnCount < MAX_TURNS) {
    turnCount++;
    
    if (signal?.aborted) {
      yield "\n\n⏹️ Generation stopped by user.";
      useStore.getState().setAgentStatus(null);
      return;
    }
    
    useStore.getState().setAgentStatus(turnCount === 1 ? "Thinking..." : `Working... (step ${turnCount}/${MAX_TURNS})`);

    const streamResult = await chatSession.sendMessageStream({ message: currentInput });
    
    let fullResponseText = '';
    let toolCalls: any[] = [];
    
    for await (const chunk of streamResult) {
        if (signal?.aborted) {
          yield "\n\n⏹️ Generation stopped by user.";
          useStore.getState().setAgentStatus(null);
          return;
        }
        
        const resp = chunk as GenerateContentResponse;
        
        if (resp.text) {
            fullResponseText += resp.text;
            yield resp.text;
        }

        const calls = resp.functionCalls;
        if (calls && calls.length > 0) {
             toolCalls = calls;
        }
    }

    // 🔒 EXECUTION CONTRACT ENFORCEMENT
    // Se intent requer tools e nenhuma foi chamada no turno 1, reinjetar correção
    if (!toolCalls || toolCalls.length === 0) {
      const requiresTools = ['CREATE', 'MODIFY', 'DEBUG'].includes(detectedIntent);
      
      if (requiresTools && turnCount === 1 && allToolsCalled.length === 0) {
        console.warn(`⚠️ [ENFORCEMENT] Intent ${detectedIntent} requires tools but none called. Reinjecting.`);
        yield "\n\n⚠️ *Corrigindo: executando ferramentas...*\n";
        
        // Reinjetar mensagem de correção sem nova chamada de API
        currentInput = [{
          functionResponse: {
            id: 'enforcement_correction',
            name: 'system',
            response: { 
              result: `VIOLATION: Intent "${detectedIntent}" requires tool calls but you only responded with text. ` +
                      `Execute the appropriate tools NOW. Do not explain, just call tools.`
            }
          }
        } as any];
        continue; // Próximo turno com correção
      }
      
      break; // Sem tools e não precisa enforcement, terminar
    }

    // Execute ALL tools in parallel when possible
    const functionResponses: Part[] = [];
    
    // Track tools called this turn
    const toolsCalledThisTurn: string[] = [];
    
    // Execute tools
    for (const call of toolCalls) {
        if (signal?.aborted) {
          yield "\n\n⏹️ Generation stopped by user.";
          useStore.getState().setAgentStatus(null);
          Ledger.endSession();
          return;
        }
        
        const { name, args, id } = call;
        let result: any = "Tool execution failed.";
        
        // 🧠 LEDGER: Check if we can attempt this action (loop prevention)
        const attemptCheck = Ledger.canAttempt(name, args.path || args.file);
        if (!attemptCheck.allowed) {
          yield `\n> ⚠️ ${attemptCheck.reason}\n`;
          Ledger.logEvent(name, args, 'skipped', attemptCheck.reason);
          // 📝 FASE 9: Logar por que não fez
          SelfExplanation.logLoopBlock(name, args, detectedIntent, attemptCheck.attempts);
          functionResponses.push({
            functionResponse: {
              id: id,
              name: name,
              response: { result: `BLOCKED: ${attemptCheck.reason}. Try a different approach.` }
            }
          });
          continue;
        }
        
        // 🧠 LEDGER: Check for identical action (skip duplicates)
        if (Ledger.hasExecutedIdentical(name, args)) {
          yield `\n> ⏭️ Skipped: identical action already executed\n`;
          Ledger.logEvent(name, args, 'skipped', 'Identical action already executed');
          // 📝 FASE 9: Logar ação idêntica pulada
          SelfExplanation.logSkippedIdentical(name, args, detectedIntent);
          functionResponses.push({
            functionResponse: {
              id: id,
              name: name,
              response: { result: 'SKIPPED: This exact action was already executed. No need to repeat.' }
            }
          });
          continue;
        }
        
        // 🧠 FASE 8: Analisar memória temporal antes de executar
        const memoryAnalysis = PolicyMemory.analyze();
        if (memoryAnalysis.recommendation === 'stop') {
          const criticalPattern = memoryAnalysis.patterns.find(p => p.severity === 'critical');
          yield `\n> 🛑 Memory block: ${criticalPattern?.description || 'Critical pattern detected'}\n`;
          Ledger.logEvent(name, args, 'skipped', 'Memory pattern block');
          // 📝 FASE 9: Logar bloqueio por memória
          SelfExplanation.logMemoryBlock(
            name, args, detectedIntent,
            criticalPattern?.name || 'unknown',
            memoryAnalysis.recommendation
          );
          functionResponses.push({
            functionResponse: {
              id: id,
              name: name,
              response: { 
                result: `BLOCKED by memory analysis: ${criticalPattern?.description || 'Dangerous pattern detected'}. ` +
                        `Cooldown suggested: ${memoryAnalysis.cooldownSuggested}ms. Try a different approach.` 
              }
            }
          });
          continue;
        }
        
        // 🧠 FASE 8: Warning se memória sugere cautela
        if (memoryAnalysis.recommendation === 'slow_down') {
          yield `\n> ⚠️ Memory warning: proceeding with caution\n`;
        }
        
        // Track tool usage
        toolsCalledThisTurn.push(name);
        allToolsCalled.push(name);
        
        let displayArgs = JSON.stringify(args);
        if (displayArgs.length > 150) displayArgs = displayArgs.substring(0, 150) + "...";
        
        yield `\n> ⚡ \`${name}\`\n`;

        const startTime = Date.now();
        try {
            result = await executeToolCall(name, args, toolExecutor, modelId, detectedIntent);
            yield getToolEmoji(name, args);
            // 🧠 LEDGER: Log successful execution and mark as executed
            Ledger.logEvent(name, args, 'success', undefined, Date.now() - startTime);
            Ledger.markExecuted(name, args);
            
            // 🧠 FASE 8: Registrar ação na memória temporal
            const policyEval = Policy.evaluate(detectedIntent, name, args);
            PolicyMemory.remember({
              tool: name,
              file: args.path || args.file,
              riskScore: policyEval.riskScore,
              wasDestructive: Authority.isDestructive(name),
              wasBlocked: false,
              intent: detectedIntent,
              outcome: 'success',
            });
        } catch (e: any) {
            result = `Error executing ${name}: ${e.message}`;
            yield `> ❌ Error: ${e.message}\n`;
            // 🧠 LEDGER: Log failed execution
            Ledger.logEvent(name, args, 'failure', e.message, Date.now() - startTime);
            
            // 🧠 FASE 8: Registrar falha na memória
            PolicyMemory.remember({
              tool: name,
              file: args.path || args.file,
              riskScore: 50, // Default para falhas
              wasDestructive: Authority.isDestructive(name),
              wasBlocked: false,
              intent: detectedIntent,
              outcome: 'failure',
            });
        }
        
        const resultStr = typeof result === 'string' ? result : JSON.stringify(result);
        // Reduce truncation limit to save tokens
        const truncatedResult = resultStr.length > 15000 
          ? resultStr.substring(0, 15000) + "...[truncated]" 
          : resultStr;

        functionResponses.push({
            functionResponse: {
                id: id,
                name: name,
                response: { result: truncatedResult }
            }
        });
    }

    // Add efficiency hint if approaching turn limit
    if (turnCount >= MAX_TURNS - 2) {
      functionResponses.push({
        functionResponse: {
          id: 'system_hint',
          name: 'system',
          response: { result: '⚠️ Approaching turn limit. Please complete remaining work in this response.' }
        }
      } as any);
    }
    
    // Track completion steps
    const wroteFiles = toolsCalledThisTurn.some(t => t.includes('write'));
    const installedPackages = toolsCalledThisTurn.includes('install_package');
    const ranCommand = toolsCalledThisTurn.includes('run_command');
    const ranDevServer = toolCalls.some(c => 
      c.name === 'run_command' && 
      (c.args?.command?.includes('npm run dev') || c.args?.command?.includes('npm start'))
    );
    
    // Update tracking
    if (wroteFiles) {
      hasCreatedFiles = true;
      projectCreationDetected = true;
    }
    if (installedPackages) hasInstalledPackages = true;
    if (ranDevServer) hasStartedServer = true;
    
    // Smart hints based on what's missing
    const state = useStore.getState();
    const hasPackageJson = state.virtualFiles.some(f => f.path === 'package.json' || f.name === 'package.json');
    
    // If created files but didn't install packages yet
    if (hasCreatedFiles && !hasInstalledPackages && hasPackageJson && turnCount < MAX_TURNS - 1) {
      // Check if package.json has dependencies
      const pkgContent = state.virtualFiles.find(f => f.path === 'package.json' || f.name === 'package.json')?.content;
      if (pkgContent && (pkgContent.includes('"dependencies"') || pkgContent.includes('"devDependencies"'))) {
        functionResponses.push({
          functionResponse: {
            id: 'completion_hint_install',
            name: 'system',
            response: { 
              result: '🚀 NEXT STEP: Files created! Now run install_package("react react-dom") to install dependencies.' 
            }
          }
        } as any);
      }
    }
    
    // If installed packages but didn't start server
    if (hasCreatedFiles && hasInstalledPackages && !hasStartedServer && turnCount < MAX_TURNS - 1) {
      functionResponses.push({
        functionResponse: {
          id: 'completion_hint_server',
          name: 'system',
          response: { 
            result: '🚀 FINAL STEP: Dependencies installed! Now run run_command("npm run dev") to start the server and show the preview!' 
          }
        }
      } as any);
    }
    
    // If this is a project creation and we're past turn 3 without starting server
    if (projectCreationDetected && turnCount >= 3 && !hasStartedServer && hasPackageJson) {
      const allWrites = allToolsCalled.filter(t => t.includes('write')).length;
      const allInstalls = allToolsCalled.filter(t => t === 'install_package').length;
      
      if (allWrites > 0 && allInstalls === 0) {
        functionResponses.push({
          functionResponse: {
            id: 'urgent_hint',
            name: 'system',
            response: { 
              result: '⚠️ URGENT: You created files but haven\'t installed dependencies or started the server! The user is waiting. Execute: install_package("react react-dom") then run_command("npm run dev") NOW!' 
            }
          }
        } as any);
      }
    }

    currentInput = functionResponses; 
  }
  
  // Warn if max turns reached
  if (turnCount >= MAX_TURNS) {
    yield "\n\n⚠️ *Reached maximum execution steps. Task may be incomplete.*\n";
  }
  
  // Verificação final de completude
  const finalState = useStore.getState();
  const hasPackageJson = finalState.virtualFiles.some(f => f.path === 'package.json' || f.name === 'package.json');
  const hasAppFile = finalState.virtualFiles.some(f => 
    f.path?.includes('App.jsx') || f.path?.includes('App.tsx') || 
    f.name === 'App.jsx' || f.name === 'App.tsx'
  );
  
  // Auto-complete: Se criou projeto mas não iniciou servidor, dar instruções claras
  if (projectCreationDetected && hasPackageJson && hasAppFile) {
    if (!hasStartedServer) {
      yield "\n\n---\n";
      yield "📋 **Project created but server not started!**\n\n";
      
      if (!hasInstalledPackages) {
        yield "To see your app, run these commands in the terminal:\n";
        yield "```bash\nnpm install\nnpm run dev\n```\n";
        yield "\nOr click the ⚡ Boot button to auto-start.\n";
      } else {
        yield "To see your app, run:\n";
        yield "```bash\nnpm run dev\n```\n";
      }
    } else if (!finalState.wcUrl) {
      yield "\n\n💡 *Server starting... The preview will appear shortly.*\n";
    }
  }
  
  // Se criou um projeto mas não está rodando, dar dica
  if (hasPackageJson && hasAppFile && !finalState.wcUrl && !projectCreationDetected) {
    yield "\n\n💡 *Tip: Click the ⚡ Boot button to start the dev server and see your app in the preview!*\n";
  }
  
  // Verificar se há erros pendentes
  const unfixedErrors = Memory.getUnfixedErrors();
  if (unfixedErrors.length > 0) {
    yield "\n\n⚠️ *Some errors were detected during execution. The agent will try to fix them automatically.*\n";
  }
  
  // 🧠 LEDGER: Validate response and log summary
  const validation = Ledger.validateResponse(detectedIntent, allToolsCalled, true);
  if (!validation.valid) {
    console.warn(`📋 [LEDGER] Response validation failed:`, validation.violations);
    // Could yield warning to user in future
  }
  if (validation.warnings.length > 0) {
    console.log(`📋 [LEDGER] Warnings:`, validation.warnings);
  }
  
  // Log repeated actions (potential loops)
  const repeatedActions = Ledger.getRepeatedActions();
  if (repeatedActions.length > 0) {
    console.log(`📋 [LEDGER] Repeated actions:`, repeatedActions);
  }
  
  // 🔐 AUTHORITY: Log escalation history and summary
  const authorityEscalations = Authority.getEscalationHistory();
  if (authorityEscalations.length > 0) {
    console.log(`� [AUTHORITY] Escalations this session:`, authorityEscalations.map(e => 
      `${e.from} → ${e.to} (${e.reason})`
    ));
  }
  console.log(`🔐 [AUTHORITY] ${Authority.getSummary()}`);
  
  // End session and log summary
  const sessionSummary = Ledger.getSessionSummary();
  console.log(`📋 [LEDGER] Session summary:\n${sessionSummary}`);
  Ledger.endSession();
  Ledger.clearExecutedActions(); // Limpar cache de ações idênticas
  Authority.reset(); // Resetar autoridade no fim da sessão
  Policy.reset(); // Resetar policy state no fim da sessão
  
  // 🧠 FASE 8: Log memory summary e reset
  const memoryAnalysis = PolicyMemory.analyze();
  if (memoryAnalysis.totalActions > 0) {
    console.log(`🧠 [MEMORY] Session: ${memoryAnalysis.totalActions} actions, ` +
                `${Math.round(memoryAnalysis.destructiveRatio * 100)}% destructive, ` +
                `avg risk: ${Math.round(memoryAnalysis.averageRiskScore)}`);
  }
  PolicyMemory.reset();
  
  // 📝 FASE 9: Log self-explanation summary e reset
  const explanationSummary = SelfExplanation.endSession();
  if (explanationSummary.totalDecisions > 0) {
    console.log(`📝 [SELF-EXPLAIN] ${explanationSummary.totalDecisions} non-decisions logged`);
    console.log(SelfExplanation.getNarrativeExplanation());
  }
  SelfExplanation.reset();
  
  // Limpar estado de execução
  Memory.endExecution();
  useStore.getState().setAgentStatus(null);
}

// Tool emoji helper
const getToolEmoji = (name: string, args: any): string => {
  const emojiMap: Record<string, string> = {
    read_file: `> 📖 Read ${args.path}\n`,
    read_multiple_files: `> 📚 Read ${args.paths?.length || 0} files\n`,
    write_file: `> 💾 ${args.path}\n`,
    write_multiple_files: `> 💾 Wrote ${args.files?.length || 0} files\n`,
    delete_file: `> 🗑️ Deleted ${args.path}\n`,
    move_file: `> 🚚 ${args.source} → ${args.destination}\n`,
    replace_string: `> ✂️ Patched ${args.path}\n`,
    search_files: `> 🔍 Searched "${args.query}"\n`,
    format_file: `> 🧹 Formatted ${args.path}\n`,
    run_command: `> 💻 \`${args.command}\`\n`,
    run_script: `> ▶️ npm run ${args.script}\n`,
    install_package: `> 📦 Installed ${args.packages}\n`,
    uninstall_package: `> 📦 Removed ${args.packages}\n`,
    git: `> 🔀 git ${args.args}\n`,
    add_task: `> ✏️ Task added\n`,
    complete_task: `> ✅ Task done\n`,
    analyze_project: `> 🏅 Analysis complete\n`,
    analyze_code: `> 🔬 Analyzed ${args.path}\n`,
    find_dependencies: `> 🔗 Mapped dependencies\n`,
    detect_issues: `> 🐛 Scanned for issues\n`,
    suggest_refactor: `> 💡 Generated suggestions\n`,
    explain_code: `> 📖 Explained code\n`,
    smart_edit: `> ✨ Smart edit applied\n`,
    insert_code: `> ➕ Inserted code\n`,
    wrap_code: `> 🎁 Wrapped code\n`,
    extract_function: `> 📤 Extracted function\n`,
    rename_symbol: `> 🏷️ Renamed symbol\n`,
    run_tests: `> 🧪 Tests executed\n`,
    debug_error: `> 🔧 Debugged error\n`,
    generate_tests: `> 🧪 Generated tests\n`,
    check_types: `> 📝 Type check complete\n`,
    lint_fix: `> 🧹 Lint fix applied\n`,
    security_scan: `> 🔒 Security scan complete\n`,
    performance_audit: `> ⚡ Performance audit done\n`,
    check_accessibility: `> ♿ A11y audit complete\n`,
    create_plan: `> 📋 Plan created\n`,
    document_code: `> 📝 Documentation added\n`,
    remember: `> 🧠 Remembered\n`,
    recall: `> 💭 Recalled\n`,
    summarize_changes: `> 📊 Summary generated\n`,
    reset_project: `> 🔄 Project reset\n`,
    clear_workspace: `> 🧹 Workspace cleared\n`,
    restart_server: `> 🔄 Server restarted\n`,
    clear_terminal: `> 🧹 Terminal cleared\n`,
    check_app_health: `> 🏥 Health check\n`,
    get_error_log: `> 🐛 Error log\n`,
    // PowerShell Process Management
    list_processes: `> 📊 Listing processes\n`,
    get_system_state: `> 🧠 System state\n`,
    create_terminal: `> 🖥️ Creating terminal ${args.name || ''}\n`,
    close_terminal: `> ❌ Closing terminal ${args.tabId}\n`,
    close_all_terminals: `> 🧹 Closing all terminals\n`,
    start_process: `> 🚀 Starting: ${args.command}\n`,
    stop_process: `> ⏹️ Stopping ${args.processId}\n`,
    stop_all_processes: `> ⏹️ Stopping all processes\n`,
    kill_port: `> 💀 Killing port ${args.port}\n`,
    get_process_output: `> 📜 Process output\n`,
    get_logs: `> 📋 System logs\n`,
    system_reset: `> 🔄 System reset\n`,
    // Advanced Discovery Tools (Kiro-Inspired)
    get_diagnostics: `> 🔬 Checking ${args.paths?.length || 0} files for errors\n`,
    file_search: `> 🔎 Searching: "${args.query}"\n`,
    list_directory: `> 📂 Listing ${args.path}\n`,
    append_file: `> ➕ Appending to ${args.path}\n`,
    web_search: `> 🌐 Searching: "${args.query}"\n`,
    web_fetch: `> 📥 Fetching ${args.url}\n`,
    grep_search: `> 🔍 Grep: "${args.pattern}"\n`,
    get_file_info: `> 📊 Info: ${args.path}\n`,
    diff_files: `> 📝 Comparing files\n`,
    create_snapshot: `> 📸 Creating snapshot: ${args.name}\n`,
    restore_snapshot: `> ⏪ Restoring: ${args.name}\n`,
    list_snapshots: `> 📋 Listing snapshots\n`
  };
  return emojiMap[name] || `> ⚙️ ${name}\n`;
};

// Execute tool call - handles all tools including new advanced ones
async function executeToolCall(
  name: string, 
  args: any, 
  toolExecutor: ToolExecutor,
  modelId: string,
  intent: Ledger.Intent = 'UNKNOWN'
): Promise<string> {
  // 🔐 CAPABILITY GATE ENFORCEMENT (código governa, não prompt)
  if (!isToolAvailable(name)) {
    const caps = getCapabilities();
    // 📝 FASE 9: Logar bloqueio por capability
    SelfExplanation.logCapabilityBlock(name, args, intent, `shell=${caps.shell}, fs=${caps.fs}`);
    throw new Error(
      `Tool "${name}" not available in current capability set. ` +
      `Current: shell=${caps.shell}, fs=${caps.fs}, processes=${caps.processes}`
    );
  }
  
  // 🔐 AUTHORITY ENFORCEMENT (governança cognitiva)
  const authorityCheck = Authority.canExecute(name);
  if (!authorityCheck.allowed) {
    // Tentar escalar automaticamente se permitido pela policy
    const hasUserConfirm = args.confirm === true;
    const escalation = Authority.escalateForTool(name, hasUserConfirm);
    
    if (!escalation.success) {
      // Logar tentativa de violação
      console.warn(`🔐 [AUTHORITY] BLOCKED: ${name} - ${authorityCheck.reason}`);
      // 📝 FASE 9: Logar bloqueio por authority
      SelfExplanation.logAuthorityBlock(
        name, args, intent,
        Authority.getCurrentLevel(),
        authorityCheck.requiredLevel!
      );
      throw new Error(
        `Authority violation: ${authorityCheck.reason}. ` +
        `Required: ${authorityCheck.requiredLevel}, Current: ${Authority.getCurrentLevel()}`
      );
    }
    
    // Escalação bem-sucedida
    console.log(`🔐 [AUTHORITY] Auto-escalated for ${name}`);
  }
  
  // 📜 POLICY EVALUATION (governança decisória)
  // Authority diz "pode", Policy diz "deveria"
  const policyEval = Policy.evaluate(intent, name, args);
  
  if (Policy.shouldBlock(policyEval)) {
    console.warn(`📜 [POLICY] BLOCKED: ${name} - ${policyEval.reason}`);
    // 📝 FASE 9: Logar bloqueio por policy
    SelfExplanation.logPolicyBlock(
      name, args, intent,
      policyEval.decision,
      policyEval.reason,
      policyEval.riskScore,
      policyEval.alternative
    );
    throw new Error(
      `Policy violation: ${policyEval.reason}` +
      (policyEval.alternative ? `. Suggestion: ${policyEval.alternative}` : '')
    );
  }
  
  if (Policy.needsConfirmation(policyEval) && !args.confirm) {
    console.warn(`📜 [POLICY] NEEDS CONFIRMATION: ${name}`);
    // 📝 FASE 9: Logar necessidade de confirmação
    SelfExplanation.logConfirmationRequired(name, args, intent, policyEval.reason, policyEval.riskScore);
    return `⚠️ This action requires explicit confirmation. ${policyEval.reason}. ` +
           `Call again with confirm: true if you're sure.`;
  }
  
  // 📝 FASE 9: Logar sugestão de alternativa (se houver)
  if (policyEval.alternative && policyEval.decision === 'suggest_alternative') {
    SelfExplanation.logAlternativeSuggested(name, args, intent, policyEval.alternative, policyEval.reason);
  }
  
  // Log warning but continue
  if (Policy.shouldWarn(policyEval)) {
    console.log(`📜 [POLICY] WARNING: ${Policy.getWarningMessage(policyEval)}`);
  }
  
  // 🔐 SCOPE: Entrar em scope para tools destrutivas
  const isDestructive = Authority.isDestructive(name);
  if (isDestructive) {
    Authority.enterScope(name, name);
  }
  
  // 📜 POLICY: Registrar ação
  Policy.recordAction(name, args.path || args.file, isDestructive);
  
  const state = useStore.getState();
  const files = state.virtualFiles;
  
  try {
  switch (name) {
    // === FILE OPERATIONS ===
    case 'read_file':
      Memory.logChange('Read', `Read file`, args.path);
      return await toolExecutor.readFile(args.path);
    case 'read_multiple_files':
      return await toolExecutor.readMultipleFiles(args.paths);
    case 'write_file':
      Memory.logChange('Write', `Created/updated file`, args.path);
      return await toolExecutor.writeFile(args.path, args.content);
    case 'write_multiple_files':
      Memory.logChange('Write', `Wrote ${args.files.length} files`);
      return await toolExecutor.writeMultipleFiles(args.files);
    case 'delete_file':
      Memory.logChange('Delete', `Deleted`, args.path);
      return await toolExecutor.deleteFile(args.path);
    case 'move_file':
      Memory.logChange('Move', `Moved ${args.source} to ${args.destination}`);
      return await toolExecutor.moveFile(args.source, args.destination);
    case 'replace_string':
      Memory.logChange('Edit', `Replaced string in`, args.path);
      return await toolExecutor.replaceString(args.path, args.search, args.replace);
    case 'search_files':
      return await toolExecutor.searchFiles(args.query, args.path);
    case 'format_file':
      return await toolExecutor.formatFile(args.path);

    // === TERMINAL & PACKAGES ===
    case 'run_command':
      Memory.logChange('Command', `Executed: ${args.command}`);
      return await toolExecutor.runCommand(args.command, args.timeout);
    case 'run_script':
      return await toolExecutor.runScript(args.script);
    case 'install_package':
      Memory.logChange('Install', `Installed: ${args.packages}`);
      return await toolExecutor.installPackage(args.packages, args.dev);
    case 'uninstall_package':
      return await toolExecutor.uninstallPackage(args.packages);
    case 'git':
      return await toolExecutor.git(args.args);

    // === PROJECT MANAGEMENT ===
    case 'add_task':
      return await toolExecutor.addTask(args.text);
    case 'complete_task':
      return await toolExecutor.completeTask(args.id);
    case 'analyze_project':
      return await toolExecutor.analyzeProject();

    // === CODE EDITING (LOCAL - NO API COST) ===
    case 'insert_code': {
      const content = getFileContent(files, args.path);
      if (!content) return `File not found: ${args.path}`;
      const result = Analyzer.insertCode(content, args.line, args.code);
      await toolExecutor.writeFile(args.path, result);
      return `Inserted code at line ${args.line}`;
    }
    case 'wrap_code': {
      const content = getFileContent(files, args.path);
      if (!content) return `File not found: ${args.path}`;
      const result = Analyzer.wrapCode(content, args.startLine, args.endLine, args.wrapper);
      await toolExecutor.writeFile(args.path, result);
      return `Wrapped lines ${args.startLine}-${args.endLine} with ${args.wrapper}`;
    }
    case 'rename_symbol': {
      const content = getFileContent(files, args.path);
      if (!content) return `File not found: ${args.path}`;
      const result = Analyzer.renameSymbol(content, args.oldName, args.newName);
      await toolExecutor.writeFile(args.path, result);
      return `Renamed ${args.oldName} to ${args.newName}`;
    }

    // === TESTING (TERMINAL - NO API COST) ===
    case 'run_tests':
      return await toolExecutor.runCommand(`npm test ${args.pattern || ''}`.trim(), 120000);
    case 'check_types':
      return await toolExecutor.runCommand('npx tsc --noEmit', 60000);
    case 'lint_fix':
      return await toolExecutor.runCommand(`npx eslint ${args.path || '.'} --fix`, 60000);

    // === AI-POWERED TOOLS (COST 1 API CALL - USE SPARINGLY) ===
    case 'smart_edit': {
      const content = getFileContent(files, args.path);
      if (!content) return `File not found: ${args.path}`;
      const edited = await Analyzer.smartEdit(content, args.path, args.instruction, modelId);
      await toolExecutor.writeFile(args.path, edited);
      Memory.logChange('Smart Edit', args.instruction, args.path);
      return `Applied smart edit to ${args.path}`;
    }
    case 'analyze_code': {
      const content = getFileContent(files, args.path);
      if (!content) return `File not found: ${args.path}`;
      const analysis = await Analyzer.analyzeCode(content, args.path, args.depth || 'normal', modelId);
      return JSON.stringify(analysis, null, 2);
    }
    case 'extract_function': {
      const content = getFileContent(files, args.path);
      if (!content) return `File not found: ${args.path}`;
      const result = Analyzer.extractFunction(content, args.startLine, args.endLine, args.functionName);
      await toolExecutor.writeFile(args.path, result);
      return `Extracted function ${args.functionName}`;
    }

    // === TESTING & DEBUG ===
    case 'debug_error': {
      const relevantCode = state.currentCode.substring(0, 20000);
      const debug = await Analyzer.debugError(args.error, args.context || '', relevantCode, modelId);
      return JSON.stringify(debug, null, 2);
    }
    case 'generate_tests': {
      const content = getFileContent(files, args.path);
      if (!content) return `File not found: ${args.path}`;
      const tests = await Analyzer.generateTests(content, args.path, args.framework || 'vitest', modelId);
      const testPath = args.path.replace(/\.(tsx?|jsx?)$/, '.test$&');
      await toolExecutor.writeFile(testPath, tests);
      Memory.logChange('Generate', `Created tests`, testPath);
      return `Generated tests at ${testPath}`;
    }

    // === SECURITY & PERFORMANCE (NEW!) ===
    case 'security_scan': {
      const targetPath = args.path || 'src/App.jsx';
      const content = getFileContent(files, targetPath);
      if (!content) return `File not found: ${targetPath}`;
      const issues = await Analyzer.securityScan(content, targetPath, modelId);
      return issues.length > 0 
        ? JSON.stringify(issues, null, 2)
        : '✅ No security issues detected';
    }
    case 'performance_audit':
      return await toolExecutor.runCommand('npm run build -- --report 2>&1 || echo "Build analysis complete"', 120000);
    case 'check_accessibility': {
      const content = getFileContent(files, args.path || 'src/App.jsx');
      if (!content) return `File not found: ${args.path}`;
      const issues = await Analyzer.checkAccessibility(content, args.path || 'src/App.jsx', modelId);
      return issues.length > 0
        ? JSON.stringify(issues, null, 2)
        : '✅ No accessibility issues detected';
    }

    // === PLANNING & DOCUMENTATION (NEW!) ===
    case 'create_plan': {
      const plan = await Analyzer.createPlan(args.goal, args.constraints || '', files, modelId);
      return JSON.stringify(plan, null, 2);
    }
    case 'document_code': {
      const content = getFileContent(files, args.path);
      if (!content) return `File not found: ${args.path}`;
      const documented = await Analyzer.documentCode(content, args.path, modelId);
      await toolExecutor.writeFile(args.path, documented);
      Memory.logChange('Document', `Added documentation`, args.path);
      return `Added documentation to ${args.path}`;
    }

    // === MEMORY (NEW!) ===
    case 'remember':
      return Memory.remember(args.key, args.value);
    case 'recall':
      return Memory.recall(args.key);
    case 'summarize_changes':
      return Memory.summarizeChanges();

    // === SYSTEM CONTROL ===
    case 'clear_workspace':
      if (!args.confirm) return "Clear cancelled. Set confirm: true to proceed.";
      const clearResult = await toolExecutor.clearWorkspace();
      // 🔐 Notificar que workspace foi limpo
      Authority.notifyWorkspaceCleared();
      Policy.reset(); // Reset policy state também
      return clearResult;
    case 'reset_project':
      if (!args.confirm) return "Reset cancelled. Set confirm: true to proceed.";
      const resetResult = await toolExecutor.resetProject();
      Authority.notifyWorkspaceCleared();
      Policy.reset();
      return resetResult;
    case 'restart_server':
      return await toolExecutor.restartServer();
    case 'clear_terminal':
      return await toolExecutor.clearTerminal();
    
    // === HEALTH CHECK & TESTING ===
    case 'check_app_health':
      return await toolExecutor.checkAppHealth();
    case 'get_error_log':
      return await toolExecutor.getErrorLog();

    // === 🖥️ POWERSHELL PROCESS MANAGEMENT ===
    case 'list_processes':
      return await toolExecutor.listProcesses();
    case 'get_system_state':
      return await toolExecutor.getSystemState();
    case 'create_terminal':
      return await toolExecutor.createTerminal(args.name, args.cwd);
    case 'close_terminal':
      return await toolExecutor.closeTerminal(args.tabId);
    case 'close_all_terminals':
      if (!args.confirm) return "Close all cancelled. Set confirm: true to proceed.";
      return await toolExecutor.closeAllTerminals();
    case 'start_process':
      return await toolExecutor.startProcess(args.command, args.name, args.port);
    case 'stop_process':
      return await toolExecutor.stopProcess(args.processId);
    case 'stop_all_processes':
      if (!args.confirm) return "Stop all cancelled. Set confirm: true to proceed.";
      return await toolExecutor.stopAllProcesses();
    case 'kill_port':
      return await toolExecutor.killPort(args.port);
    case 'get_process_output':
      return await toolExecutor.getProcessOutput(args.processId, args.lines || 100);
    case 'get_logs':
      return await toolExecutor.getLogs(args.lines, args.level, args.source);
    case 'system_reset':
      if (!args.confirm) return "System reset cancelled. Set confirm: true to proceed.";
      return await toolExecutor.systemReset();

    // === 🔍 ADVANCED DISCOVERY TOOLS ===
    case 'get_diagnostics':
      return await toolExecutor.getDiagnostics(args.paths);
    case 'file_search':
      return await toolExecutor.fileSearch(args.query, args.exclude);
    case 'list_directory':
      return await toolExecutor.listDirectory(args.path, args.depth || 1);
    case 'append_file':
      Memory.logChange('Append', `Appended to`, args.path);
      return await toolExecutor.appendFile(args.path, args.content);
    case 'web_search':
      return await toolExecutor.webSearch(args.query);
    case 'web_fetch':
      return await toolExecutor.webFetch(args.url, args.selector);
    case 'grep_search':
      return await toolExecutor.grepSearch(args.pattern, args.include, args.exclude, args.caseSensitive);
    case 'get_file_info':
      return await toolExecutor.getFileInfo(args.path);
    case 'diff_files':
      return await toolExecutor.diffFiles(args.file1, args.file2);
    case 'create_snapshot':
      Memory.logChange('Snapshot', `Created snapshot: ${args.name}`);
      return await toolExecutor.createSnapshot(args.name);
    case 'restore_snapshot':
      Memory.logChange('Restore', `Restored snapshot: ${args.name}`);
      const restoreResult = await toolExecutor.restoreSnapshot(args.name);
      // 🔐 Notificar que workspace mudou
      Authority.notifyWorkspaceCleared();
      return restoreResult;
    case 'list_snapshots':
      return await toolExecutor.listSnapshots();

    default:
      return `Unknown tool: ${name}`;
  }
  } finally {
    // 🔐 SCOPE: Sair do scope após tool destrutiva
    if (isDestructive) {
      Authority.exitScope();
    }
  }
}

// --- REFINEMENT & EXPORT FUNCTION ---

export const refineAndStructureProject = async (
    modelId: string,
    currentCode: string
): Promise<RefinedProject> => {
    const ai = getClient();
    const prompt = `
    CTO SECURITY & EXPORT AUDIT:
    Target: Prepare codebase for "Electron" or "Production Web" export.
    Return strictly JSON.
    INPUT CODE:
    ${currentCode}
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    analysis: { type: Type.STRING },
                    securityAudit: { type: Type.STRING },
                    files: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          path: { type: Type.STRING },
                          content: { type: Type.STRING }
                        },
                        required: ["path", "content"]
                      }
                    }
                  },
                  required: ["analysis", "securityAudit", "files"]
                }
            }
        }));
        return JSON.parse(response.text!) as RefinedProject;
    } catch (error) {
        throw error;
    }
};

// Reset chat session (useful for clearing context)
export const resetChatSession = () => {
  chatSession = null;
  currentModelId = null;
  Memory.clearMemory();
  Memory.clearChangeLog();
};


// --- BUNDLE PROCESSING ---

/**
 * Processa texto da resposta da IA e detecta bundles de projeto
 * Retorna os arquivos extraídos se encontrar um bundle
 */
export const processBundleFromResponse = (responseText: string): {
  hasBundle: boolean;
  files: ParsedFile[];
  cleanText: string;
} => {
  if (!detectBundle(responseText)) {
    return { hasBundle: false, files: [], cleanText: responseText };
  }
  
  const result = parseBundle(responseText);
  
  if (result.isBundle && result.files.length > 0) {
    // Combinar texto antes e depois do bundle
    const cleanText = [result.textBefore, result.textAfter]
      .filter(Boolean)
      .join('\n\n')
      .trim() || `✅ Created ${result.files.length} files`;
    
    return {
      hasBundle: true,
      files: result.files,
      cleanText
    };
  }
  
  return { hasBundle: false, files: [], cleanText: responseText };
};

/**
 * Re-exporta funções do bundleParser para uso externo
 */
export { detectBundle, parseBundle } from "./bundleParser";
