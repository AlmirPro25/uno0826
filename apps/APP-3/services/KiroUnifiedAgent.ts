/**
 * ============================================
 * 🧠 KIRO UNIFIED AGENT - SISTEMA PROFISSIONAL
 * ============================================
 * 
 * Agente unificado que combina:
 * - Chat inteligente com linguagem natural
 * - Terminal com execução real de comandos
 * - Tool calling avançado com retry e paralelo
 * - Streaming de output em tempo real
 * - Gerenciamento de processos em background
 * 
 * Inspirado em: VS Code, Cursor, Windsurf, Kiro IDE
 */

import { GoogleGenAI, FunctionDeclaration, Tool, Content, Part } from "@google/genai";
import { ApiKeyManager } from './ApiKeyManager';
import { EventEmitter } from 'events';

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  dangerous?: boolean;
  requiresConfirmation?: boolean;
}

export interface ToolExecution {
  id: string;
  tool: string;
  args: Record<string, any>;
  status: 'pending' | 'running' | 'success' | 'error' | 'cancelled';
  result?: any;
  error?: string;
  startTime: number;
  endTime?: number;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: ToolExecution[];
  metadata?: Record<string, any>;
}

export interface AgentSession {
  id: string;
  messages: AgentMessage[];
  context: AgentContext;
  createdAt: number;
  lastActivity: number;
}

export interface AgentContext {
  workingDirectory: string;
  openFiles: string[];
  activeFile?: string;
  gitBranch?: string;
  runningProcesses: ProcessInfo[];
  environment: Record<string, string>;
}

export interface ProcessInfo {
  id: string;
  command: string;
  pid?: number;
  status: 'running' | 'stopped' | 'error';
  startTime: number;
  output: string[];
}

export interface StreamEvent {
  type: 'text' | 'tool_start' | 'tool_end' | 'error' | 'done';
  content?: string;
  tool?: string;
  result?: any;
  error?: string;
}

// ============================================
// DEFINIÇÃO DAS FERRAMENTAS AVANÇADAS
// ============================================

export const UNIFIED_TOOLS: AgentTool[] = [
  // === LEITURA DE ARQUIVOS ===
  {
    name: "readFile",
    description: "Lê o conteúdo completo de um arquivo. Use para entender código antes de modificar.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Caminho relativo do arquivo (ex: src/App.tsx)" },
        startLine: { type: "number", description: "Linha inicial (opcional)" },
        endLine: { type: "number", description: "Linha final (opcional)" }
      },
      required: ["path"]
    }
  },
  {
    name: "readMultipleFiles",
    description: "Lê múltiplos arquivos de uma vez. Mais eficiente que múltiplas chamadas de readFile.",
    parameters: {
      type: "object",
      properties: {
        paths: { type: "array", items: { type: "string" }, description: "Lista de caminhos" }
      },
      required: ["paths"]
    }
  },

  // === ESCRITA DE ARQUIVOS ===
  {
    name: "writeFile",
    description: "Cria ou sobrescreve um arquivo completamente. Use para arquivos novos ou reescritas totais.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Caminho do arquivo" },
        content: { type: "string", description: "Conteúdo completo do arquivo" }
      },
      required: ["path", "content"]
    },
    requiresConfirmation: false
  },
  {
    name: "strReplace",
    description: "Substitui uma string EXATA em um arquivo. A string deve ser única. Inclua contexto suficiente.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Caminho do arquivo" },
        oldStr: { type: "string", description: "String exata a substituir (deve ser única no arquivo)" },
        newStr: { type: "string", description: "Nova string" }
      },
      required: ["path", "oldStr", "newStr"]
    }
  },
  {
    name: "appendFile",
    description: "Adiciona conteúdo ao final de um arquivo existente.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Caminho do arquivo" },
        text: { type: "string", description: "Texto a adicionar" }
      },
      required: ["path", "text"]
    }
  },
  {
    name: "deleteFile",
    description: "Deleta um arquivo. Requer confirmação explícita.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Caminho do arquivo" },
        confirm: { type: "boolean", description: "Deve ser true para confirmar" }
      },
      required: ["path", "confirm"]
    },
    dangerous: true,
    requiresConfirmation: true
  },

  // === BUSCA E NAVEGAÇÃO ===
  {
    name: "grepSearch",
    description: "Busca texto em arquivos usando regex. Retorna matches com contexto.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Padrão regex para buscar" },
        path: { type: "string", description: "Diretório base (default: .)" },
        includePattern: { type: "string", description: "Glob pattern (ex: **/*.ts)" },
        caseSensitive: { type: "boolean", description: "Case sensitive (default: false)" },
        maxResults: { type: "number", description: "Máximo de resultados (default: 50)" }
      },
      required: ["query"]
    }
  },
  {
    name: "fileSearch",
    description: "Busca arquivos por nome usando fuzzy matching.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Parte do nome do arquivo" },
        path: { type: "string", description: "Diretório base" }
      },
      required: ["query"]
    }
  },
  {
    name: "listDirectory",
    description: "Lista arquivos e pastas de um diretório com profundidade configurável.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Caminho do diretório" },
        depth: { type: "number", description: "Profundidade (default: 2)" },
        showHidden: { type: "boolean", description: "Mostrar arquivos ocultos" }
      },
      required: ["path"]
    }
  },

  // === EXECUÇÃO DE COMANDOS ===
  {
    name: "executeCommand",
    description: "Executa um comando no terminal. Para comandos longos, use startProcess.",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "Comando a executar" },
        cwd: { type: "string", description: "Diretório de trabalho" },
        timeout: { type: "number", description: "Timeout em ms (default: 60000)" }
      },
      required: ["command"]
    }
  },
  {
    name: "startProcess",
    description: "Inicia um processo em background (dev servers, watchers, etc).",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "Comando a executar" },
        cwd: { type: "string", description: "Diretório de trabalho" },
        name: { type: "string", description: "Nome identificador do processo" }
      },
      required: ["command"]
    }
  },
  {
    name: "stopProcess",
    description: "Para um processo em background.",
    parameters: {
      type: "object",
      properties: {
        processId: { type: "string", description: "ID do processo" }
      },
      required: ["processId"]
    }
  },
  {
    name: "getProcessOutput",
    description: "Obtém output de um processo em background.",
    parameters: {
      type: "object",
      properties: {
        processId: { type: "string", description: "ID do processo" },
        lines: { type: "number", description: "Últimas N linhas (default: 50)" }
      },
      required: ["processId"]
    }
  },

  // === DIAGNÓSTICOS E ANÁLISE ===
  {
    name: "getDiagnostics",
    description: "Obtém erros, warnings e problemas de código em arquivos.",
    parameters: {
      type: "object",
      properties: {
        paths: { type: "array", items: { type: "string" }, description: "Arquivos para analisar" }
      },
      required: ["paths"]
    }
  },
  {
    name: "getSymbols",
    description: "Obtém símbolos (funções, classes, variáveis) de um arquivo.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Caminho do arquivo" }
      },
      required: ["path"]
    }
  },

  // === GIT OPERATIONS ===
  {
    name: "gitStatus",
    description: "Obtém status do repositório git.",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "gitDiff",
    description: "Obtém diff de arquivos modificados.",
    parameters: {
      type: "object",
      properties: {
        file: { type: "string", description: "Arquivo específico (opcional)" },
        staged: { type: "boolean", description: "Mostrar staged changes" }
      },
      required: []
    }
  },
  {
    name: "gitCommit",
    description: "Faz commit das mudanças staged.",
    parameters: {
      type: "object",
      properties: {
        message: { type: "string", description: "Mensagem do commit" },
        addAll: { type: "boolean", description: "Adicionar todos os arquivos antes" }
      },
      required: ["message"]
    },
    requiresConfirmation: true
  },

  // === BROWSER/PREVIEW ===
  {
    name: "openPreview",
    description: "Abre preview do projeto no navegador.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL para abrir (default: localhost)" },
        port: { type: "number", description: "Porta do servidor" }
      },
      required: []
    }
  }
];

// ============================================
// CLASSE PRINCIPAL DO AGENTE UNIFICADO
// ============================================

export class KiroUnifiedAgent extends EventEmitter {
  private genAI: GoogleGenAI | null = null;
  private sessions: Map<string, AgentSession> = new Map();
  private activeSessionId: string | null = null;
  private runningProcesses: Map<string, ProcessInfo> = new Map();
  private maxToolCalls = 20;
  private maxRetries = 3;
  
  // Configurações
  private config = {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 8192,
    streamOutput: true,
    autoConfirmSafe: true,
    workspaceRoot: '.'
  };

  constructor() {
    super();
    this.initializeAI();
  }

  private initializeAI() {
    const apiKey = ApiKeyManager.getKeyToUse();
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
      console.log('🧠 KiroUnifiedAgent: AI inicializada');
    } else {
      console.warn('⚠️ KiroUnifiedAgent: API Key não configurada');
    }
  }

  // ============================================
  // SYSTEM PROMPT PROFISSIONAL
  // ============================================

  private getSystemPrompt(context: AgentContext): string {
    return `Você é KIRO, um agente de código inteligente de nível profissional.

## SUAS CAPACIDADES
Você pode executar ações REAIS no sistema de arquivos e terminal do usuário:
- Ler, criar, modificar e deletar arquivos
- Executar comandos no terminal (npm, git, node, etc)
- Buscar código em todo o projeto
- Analisar erros e problemas de código
- Gerenciar processos em background (dev servers, watchers)
- Operações git (status, diff, commit)

## CONTEXTO ATUAL
- Diretório: ${context.workingDirectory}
- Arquivos abertos: ${context.openFiles.join(', ') || 'nenhum'}
- Arquivo ativo: ${context.activeFile || 'nenhum'}
- Branch git: ${context.gitBranch || 'desconhecido'}
- Processos rodando: ${context.runningProcesses.map(p => p.command).join(', ') || 'nenhum'}

## REGRAS CRÍTICAS

### 1. SEMPRE LEIA ANTES DE MODIFICAR
Antes de modificar qualquer arquivo, LEIA-O primeiro para entender o contexto completo.

### 2. USE strReplace PARA MODIFICAÇÕES PRECISAS
- A string oldStr deve ser EXATA e ÚNICA no arquivo
- Inclua 2-3 linhas de contexto antes e depois
- Se não for única, inclua mais contexto

### 3. EXECUTE COMANDOS COM CUIDADO
- Verifique se o comando é seguro
- Use timeout apropriado
- Para servidores/watchers, use startProcess

### 4. SEJA CONCISO E DIRETO
- Explique brevemente o que está fazendo
- Mostre resultados relevantes
- Não repita informações desnecessárias

### 5. TRATE ERROS INTELIGENTEMENTE
- Se uma tool falhar, tente abordagem alternativa
- Explique o problema e a solução
- Não desista facilmente

## FORMATO DE RESPOSTA
- Use markdown para formatação
- Mostre código em blocos com syntax highlighting
- Seja direto e objetivo`;
  }

  // ============================================
  // GERENCIAMENTO DE SESSÕES
  // ============================================

  createSession(context?: Partial<AgentContext>): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: AgentSession = {
      id: sessionId,
      messages: [],
      context: {
        workingDirectory: context?.workingDirectory || '.',
        openFiles: context?.openFiles || [],
        activeFile: context?.activeFile,
        gitBranch: context?.gitBranch,
        runningProcesses: [],
        environment: context?.environment || {}
      },
      createdAt: Date.now(),
      lastActivity: Date.now()
    };

    this.sessions.set(sessionId, session);
    this.activeSessionId = sessionId;
    
    this.emit('session:created', { sessionId });
    return sessionId;
  }

  getSession(sessionId?: string): AgentSession | null {
    const id = sessionId || this.activeSessionId;
    return id ? this.sessions.get(id) || null : null;
  }

  updateContext(sessionId: string, context: Partial<AgentContext>) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.context = { ...session.context, ...context };
      session.lastActivity = Date.now();
    }
  }

  // ============================================
  // PROCESSAMENTO DE MENSAGENS COM STREAMING
  // ============================================

  async processMessage(
    userMessage: string, 
    sessionId?: string,
    onStream?: (event: StreamEvent) => void
  ): Promise<AgentMessage> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error('Sessão não encontrada. Crie uma sessão primeiro.');
    }

    if (!this.genAI) {
      throw new Error('API Key do Gemini não configurada');
    }

    // Adiciona mensagem do usuário
    const userMsg: AgentMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    };
    session.messages.push(userMsg);
    session.lastActivity = Date.now();

    this.emit('message:user', { sessionId: session.id, message: userMsg });

    try {
      const response = await this.executeWithTools(session, onStream);
      
      // Adiciona resposta do assistente
      const assistantMsg: AgentMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: response.text,
        timestamp: Date.now(),
        toolCalls: response.toolCalls
      };
      session.messages.push(assistantMsg);

      this.emit('message:assistant', { sessionId: session.id, message: assistantMsg });
      
      if (onStream) {
        onStream({ type: 'done' });
      }

      return assistantMsg;

    } catch (error: any) {
      const errorMsg: AgentMessage = {
        id: `msg_${Date.now()}`,
        role: 'system',
        content: `❌ Erro: ${error.message}`,
        timestamp: Date.now()
      };
      session.messages.push(errorMsg);

      if (onStream) {
        onStream({ type: 'error', error: error.message });
      }

      throw error;
    }
  }

  // ============================================
  // EXECUÇÃO COM TOOL CALLING
  // ============================================

  private async executeWithTools(
    session: AgentSession,
    onStream?: (event: StreamEvent) => void
  ): Promise<{ text: string; toolCalls: ToolExecution[] }> {
    
    const model = this.genAI!.getGenerativeModel({
      model: this.config.model,
      tools: this.getGeminiTools(),
      systemInstruction: this.getSystemPrompt(session.context)
    });

    // Prepara histórico
    const contents: Content[] = session.messages
      .filter(m => m.role !== 'system')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }] as Part[]
      }));

    const toolCalls: ToolExecution[] = [];
    let toolCallCount = 0;

    // Loop de tool calling
    let response = await model.generateContent({ contents });
    let result = response.response;

    while (result.functionCalls && result.functionCalls.length > 0 && toolCallCount < this.maxToolCalls) {
      
      for (const functionCall of result.functionCalls) {
        const toolName = functionCall.name;
        const toolArgs = functionCall.args as Record<string, any>;
        
        toolCallCount++;

        // Emite evento de início
        if (onStream) {
          onStream({ type: 'tool_start', tool: toolName });
        }
        this.emit('tool:start', { tool: toolName, args: toolArgs });

        const execution: ToolExecution = {
          id: `exec_${Date.now()}_${toolCallCount}`,
          tool: toolName,
          args: toolArgs,
          status: 'running',
          startTime: Date.now()
        };
        toolCalls.push(execution);

        // Executa a ferramenta com retry
        const toolResult = await this.executeToolWithRetry(toolName, toolArgs);
        
        execution.status = toolResult.success ? 'success' : 'error';
        execution.result = toolResult.data;
        execution.error = toolResult.error;
        execution.endTime = Date.now();

        // Emite evento de fim
        if (onStream) {
          onStream({ type: 'tool_end', tool: toolName, result: toolResult });
        }
        this.emit('tool:end', { tool: toolName, result: toolResult });

        // Adiciona resultado ao contexto
        contents.push({
          role: 'user',
          parts: [{
            functionResponse: {
              name: toolName,
              response: toolResult
            }
          }] as Part[]
        });
      }

      // Nova chamada ao modelo
      response = await model.generateContent({ contents });
      result = response.response;
    }

    const finalText = result.text() || "Operação concluída.";
    
    // Stream do texto final
    if (onStream) {
      onStream({ type: 'text', content: finalText });
    }

    return { text: finalText, toolCalls };
  }

  // ============================================
  // EXECUÇÃO DE TOOLS COM RETRY
  // ============================================

  private async executeToolWithRetry(
    toolName: string, 
    args: Record<string, any>,
    retries = 0
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    
    try {
      const result = await this.executeTool(toolName, args);
      return result;
    } catch (error: any) {
      if (retries < this.maxRetries) {
        console.log(`🔄 Retry ${retries + 1}/${this.maxRetries} para ${toolName}`);
        await this.delay(1000 * (retries + 1)); // Backoff exponencial
        return this.executeToolWithRetry(toolName, args, retries + 1);
      }
      return { success: false, error: error.message };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================
  // IMPLEMENTAÇÃO DAS TOOLS
  // ============================================

  private async executeTool(
    toolName: string, 
    args: Record<string, any>
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    
    const API_BASE = 'http://localhost:3001/api';
    
    const authFetch = async (url: string, options: RequestInit = {}) => {
      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
    };

    console.log(`🔧 Executando: ${toolName}`, args);

    switch (toolName) {
      // === LEITURA ===
      case 'readFile': {
        const res = await authFetch(`${API_BASE}/terminal/read-file?path=${encodeURIComponent(args.path)}`);
        const data = await res.json();
        if (data.success) {
          let content = data.content;
          if (args.startLine || args.endLine) {
            const lines = content.split('\n');
            const start = (args.startLine || 1) - 1;
            const end = args.endLine || lines.length;
            content = lines.slice(start, end).join('\n');
          }
          return { success: true, data: content };
        }
        return { success: false, error: data.error };
      }

      case 'readMultipleFiles': {
        const res = await authFetch(`${API_BASE}/kiro/read-multiple`, {
          method: 'POST',
          body: JSON.stringify({ paths: args.paths })
        });
        const data = await res.json();
        return { success: data.success, data: data.files, error: data.error };
      }

      // === ESCRITA ===
      case 'writeFile': {
        const res = await authFetch(`${API_BASE}/terminal/write-files`, {
          method: 'POST',
          body: JSON.stringify({ files: [{ path: args.path, content: args.content }] })
        });
        const data = await res.json();
        return { success: data.success, error: data.error };
      }

      case 'strReplace': {
        const res = await authFetch(`${API_BASE}/kiro/replace`, {
          method: 'POST',
          body: JSON.stringify({ path: args.path, oldStr: args.oldStr, newStr: args.newStr })
        });
        const data = await res.json();
        return { success: data.success, error: data.error || data.hint };
      }

      case 'appendFile': {
        const res = await authFetch(`${API_BASE}/kiro/append`, {
          method: 'POST',
          body: JSON.stringify({ path: args.path, text: args.text })
        });
        const data = await res.json();
        return { success: data.success, error: data.error };
      }

      case 'deleteFile': {
        if (!args.confirm) {
          return { success: false, error: 'Confirmação necessária (confirm: true)' };
        }
        const res = await authFetch(`${API_BASE}/kiro/delete`, {
          method: 'DELETE',
          body: JSON.stringify({ path: args.path, confirm: true })
        });
        const data = await res.json();
        return { success: data.success, error: data.error };
      }

      // === BUSCA ===
      case 'grepSearch': {
        const res = await authFetch(`${API_BASE}/kiro/search`, {
          method: 'POST',
          body: JSON.stringify({
            query: args.query,
            path: args.path || '.',
            includePattern: args.includePattern,
            caseSensitive: args.caseSensitive,
            maxResults: args.maxResults || 50
          })
        });
        const data = await res.json();
        return { success: data.success, data: data.results, error: data.error };
      }

      case 'fileSearch': {
        const params = new URLSearchParams({ query: args.query });
        if (args.path) params.append('path', args.path);
        const res = await authFetch(`${API_BASE}/kiro/file-search?${params}`);
        const data = await res.json();
        return { success: data.success, data: data.results, error: data.error };
      }

      case 'listDirectory': {
        const params = new URLSearchParams({ path: args.path || '.' });
        if (args.depth) params.append('depth', args.depth.toString());
        const res = await authFetch(`${API_BASE}/kiro/list-recursive?${params}`);
        const data = await res.json();
        return { success: data.success, data: data.tree, error: data.error };
      }

      // === EXECUÇÃO ===
      case 'executeCommand': {
        const res = await authFetch(`${API_BASE}/terminal/execute`, {
          method: 'POST',
          body: JSON.stringify({ 
            command: args.command, 
            cwd: args.cwd,
            timeout: args.timeout || 60000
          })
        });
        const data = await res.json();
        return { 
          success: data.success, 
          data: { stdout: data.stdout, stderr: data.stderr, exitCode: data.exitCode },
          error: data.error 
        };
      }

      case 'startProcess': {
        const processId = `proc_${Date.now()}`;
        const processInfo: ProcessInfo = {
          id: processId,
          command: args.command,
          status: 'running',
          startTime: Date.now(),
          output: []
        };
        this.runningProcesses.set(processId, processInfo);
        
        // Inicia processo via backend
        const res = await authFetch(`${API_BASE}/terminal/start-process`, {
          method: 'POST',
          body: JSON.stringify({ 
            command: args.command, 
            cwd: args.cwd,
            processId 
          })
        });
        const data = await res.json();
        
        if (data.success) {
          processInfo.pid = data.pid;
          return { success: true, data: { processId, pid: data.pid } };
        }
        
        this.runningProcesses.delete(processId);
        return { success: false, error: data.error };
      }

      case 'stopProcess': {
        const process = this.runningProcesses.get(args.processId);
        if (!process) {
          return { success: false, error: 'Processo não encontrado' };
        }
        
        const res = await authFetch(`${API_BASE}/terminal/stop-process`, {
          method: 'POST',
          body: JSON.stringify({ processId: args.processId })
        });
        const data = await res.json();
        
        if (data.success) {
          process.status = 'stopped';
        }
        return { success: data.success, error: data.error };
      }

      case 'getProcessOutput': {
        const process = this.runningProcesses.get(args.processId);
        if (!process) {
          return { success: false, error: 'Processo não encontrado' };
        }
        
        const res = await authFetch(`${API_BASE}/terminal/process-output?processId=${args.processId}&lines=${args.lines || 50}`);
        const data = await res.json();
        return { success: data.success, data: data.output, error: data.error };
      }

      // === DIAGNÓSTICOS ===
      case 'getDiagnostics': {
        const res = await authFetch(`${API_BASE}/kiro/diagnostics`, {
          method: 'POST',
          body: JSON.stringify({ paths: args.paths })
        });
        const data = await res.json();
        return { success: data.success, data: data.diagnostics, error: data.error };
      }

      case 'getSymbols': {
        // Análise básica de símbolos
        const readRes = await authFetch(`${API_BASE}/terminal/read-file?path=${encodeURIComponent(args.path)}`);
        const readData = await readRes.json();
        
        if (!readData.success) {
          return { success: false, error: readData.error };
        }

        const content = readData.content;
        const symbols: any[] = [];
        
        // Regex para encontrar símbolos comuns
        const patterns = [
          { type: 'function', regex: /(?:function|const|let|var)\s+(\w+)\s*(?:=\s*(?:async\s*)?\(|=\s*function|\()/g },
          { type: 'class', regex: /class\s+(\w+)/g },
          { type: 'interface', regex: /interface\s+(\w+)/g },
          { type: 'type', regex: /type\s+(\w+)/g },
          { type: 'export', regex: /export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type)\s+(\w+)/g }
        ];

        for (const { type, regex } of patterns) {
          let match;
          while ((match = regex.exec(content)) !== null) {
            symbols.push({
              name: match[1],
              type,
              line: content.substring(0, match.index).split('\n').length
            });
          }
        }

        return { success: true, data: symbols };
      }

      // === GIT ===
      case 'gitStatus': {
        const res = await authFetch(`${API_BASE}/terminal/execute`, {
          method: 'POST',
          body: JSON.stringify({ command: 'git status --porcelain' })
        });
        const data = await res.json();
        
        if (data.success) {
          const files = data.stdout.split('\n').filter(Boolean).map((line: string) => ({
            status: line.substring(0, 2).trim(),
            file: line.substring(3)
          }));
          return { success: true, data: { files, raw: data.stdout } };
        }
        return { success: false, error: data.stderr || data.error };
      }

      case 'gitDiff': {
        let command = 'git diff';
        if (args.staged) command += ' --staged';
        if (args.file) command += ` -- ${args.file}`;
        
        const res = await authFetch(`${API_BASE}/terminal/execute`, {
          method: 'POST',
          body: JSON.stringify({ command })
        });
        const data = await res.json();
        return { success: data.success, data: data.stdout, error: data.stderr };
      }

      case 'gitCommit': {
        if (args.addAll) {
          await authFetch(`${API_BASE}/terminal/execute`, {
            method: 'POST',
            body: JSON.stringify({ command: 'git add -A' })
          });
        }
        
        const res = await authFetch(`${API_BASE}/terminal/execute`, {
          method: 'POST',
          body: JSON.stringify({ command: `git commit -m "${args.message.replace(/"/g, '\\"')}"` })
        });
        const data = await res.json();
        return { success: data.success, data: data.stdout, error: data.stderr };
      }

      // === PREVIEW ===
      case 'openPreview': {
        const url = args.url || `http://localhost:${args.port || 5173}`;
        // Abre no navegador padrão
        const command = process.platform === 'win32' ? `start ${url}` : 
                       process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`;
        
        const res = await authFetch(`${API_BASE}/terminal/execute`, {
          method: 'POST',
          body: JSON.stringify({ command })
        });
        return { success: true, data: { url } };
      }

      default:
        return { success: false, error: `Tool desconhecida: ${toolName}` };
    }
  }

  // ============================================
  // CONVERSÃO PARA FORMATO GEMINI
  // ============================================

  private getGeminiTools(): Tool[] {
    const functionDeclarations: FunctionDeclaration[] = UNIFIED_TOOLS.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object' as const,
        properties: tool.parameters.properties,
        required: tool.parameters.required
      }
    }));
    
    return [{ functionDeclarations }];
  }

  // ============================================
  // MÉTODOS UTILITÁRIOS
  // ============================================

  getRunningProcesses(): ProcessInfo[] {
    return Array.from(this.runningProcesses.values());
  }

  clearSession(sessionId?: string) {
    const id = sessionId || this.activeSessionId;
    if (id) {
      const session = this.sessions.get(id);
      if (session) {
        session.messages = [];
        session.lastActivity = Date.now();
      }
    }
  }

  deleteSession(sessionId: string) {
    this.sessions.delete(sessionId);
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }
  }

  getAllSessions(): AgentSession[] {
    return Array.from(this.sessions.values());
  }

  // ============================================
  // ATALHOS PARA COMANDOS COMUNS
  // ============================================

  async quickCommand(command: string): Promise<string> {
    const result = await this.executeTool('executeCommand', { command });
    if (result.success) {
      return result.data?.stdout || 'OK';
    }
    throw new Error(result.error || 'Erro ao executar comando');
  }

  async quickRead(path: string): Promise<string> {
    const result = await this.executeTool('readFile', { path });
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || 'Erro ao ler arquivo');
  }

  async quickWrite(path: string, content: string): Promise<void> {
    const result = await this.executeTool('writeFile', { path, content });
    if (!result.success) {
      throw new Error(result.error || 'Erro ao escrever arquivo');
    }
  }

  async quickSearch(query: string, pattern?: string): Promise<any[]> {
    const result = await this.executeTool('grepSearch', { 
      query, 
      includePattern: pattern 
    });
    if (result.success) {
      return result.data || [];
    }
    throw new Error(result.error || 'Erro na busca');
  }
}

// ============================================
// INSTÂNCIA SINGLETON
// ============================================

export const kiroUnifiedAgent = new KiroUnifiedAgent();

// ============================================
// HOOK REACT PARA USO NO FRONTEND
// ============================================

export function useKiroAgent() {
  return {
    agent: kiroUnifiedAgent,
    createSession: (context?: Partial<AgentContext>) => kiroUnifiedAgent.createSession(context),
    processMessage: (msg: string, sessionId?: string, onStream?: (e: StreamEvent) => void) => 
      kiroUnifiedAgent.processMessage(msg, sessionId, onStream),
    getSession: (id?: string) => kiroUnifiedAgent.getSession(id),
    clearSession: (id?: string) => kiroUnifiedAgent.clearSession(id),
    quickCommand: (cmd: string) => kiroUnifiedAgent.quickCommand(cmd),
    quickRead: (path: string) => kiroUnifiedAgent.quickRead(path),
    quickWrite: (path: string, content: string) => kiroUnifiedAgent.quickWrite(path, content),
    quickSearch: (query: string, pattern?: string) => kiroUnifiedAgent.quickSearch(query, pattern)
  };
}
