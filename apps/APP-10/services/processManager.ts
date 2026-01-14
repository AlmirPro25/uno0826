/**
 * 🔄 Process Manager Service
 * Gerencia múltiplos processos no backend
 * 
 * FUNCIONALIDADES:
 * - Listar/iniciar/parar processos
 * - Gerenciar abas de terminal
 * - Logs centralizados
 * - Estado do sistema para a IA
 */

const API_URL = 'http://localhost:3001';

export interface ManagedProcess {
  id: string;
  name: string;
  command: string;
  status: 'running' | 'stopped' | 'error';
  port?: number;
  startedAt: number;
  cwd: string;
  outputLines: number;
  pid?: number;
  tabId?: string;
}

export interface TerminalTab {
  id: string;
  name: string;
  type: 'shell' | 'process' | 'log';
  isActive: boolean;
  createdAt: number;
  cwd: string;
  processId?: string;
  outputLines: number;
}

export interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug' | 'command' | 'output';
  source: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface SystemState {
  processes: {
    total: number;
    running: number;
    stopped: number;
    error: number;
    list: Array<{
      id: string;
      name: string;
      command: string;
      status: string;
      port?: number;
      uptime: number;
    }>;
  };
  terminals: {
    total: number;
    active: string | null;
    list: Array<{
      id: string;
      name: string;
      type: string;
      isActive: boolean;
    }>;
  };
  workspace: {
    path: string;
    name: string;
  };
  ports: {
    reserved: number[];
    inUse: number[];
    available: number;
  };
  recentLogs: LogEntry[];
  health: {
    backendUptime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export interface StartProcessResult {
  success: boolean;
  reused: boolean;
  message?: string;
  process?: ManagedProcess;
  error?: string;
}

export class ProcessManagerService {
  
  // ============================================================================
  // 🔄 PROCESS MANAGEMENT
  // ============================================================================
  
  /**
   * Listar todos os processos
   */
  static async listProcesses(): Promise<ManagedProcess[]> {
    try {
      const res = await fetch(`${API_URL}/api/processes`);
      const data = await res.json();
      return data.success ? data.processes : [];
    } catch (e) {
      console.error('Failed to list processes:', e);
      return [];
    }
  }
  
  /**
   * Obter detalhes de um processo
   */
  static async getProcess(processId: string): Promise<ManagedProcess | null> {
    try {
      const res = await fetch(`${API_URL}/api/processes/${processId}`);
      const data = await res.json();
      return data.success ? data.process : null;
    } catch (e) {
      return null;
    }
  }
  
  /**
   * Obter output de um processo
   */
  static async getProcessOutput(processId: string, lines: number = 100): Promise<string> {
    try {
      const res = await fetch(`${API_URL}/api/processes/${processId}/output?lines=${lines}`);
      const data = await res.json();
      return data.success ? data.output : '';
    } catch (e) {
      return '';
    }
  }
  
  /**
   * Iniciar um novo processo (ou reusar existente)
   */
  static async startProcess(
    command: string, 
    options?: { name?: string; port?: number; cwd?: string }
  ): Promise<StartProcessResult> {
    try {
      const res = await fetch(`${API_URL}/api/processes/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          command, 
          name: options?.name,
          port: options?.port,
          cwd: options?.cwd
        })
      });
      return res.json();
    } catch (e: any) {
      return { success: false, reused: false, error: e.message };
    }
  }
  
  /**
   * Parar um processo
   */
  static async stopProcess(processId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/api/processes/${processId}/stop`, { 
        method: 'POST' 
      });
      const data = await res.json();
      return data.success;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Remover um processo
   */
  static async removeProcess(processId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/api/processes/${processId}`, { 
        method: 'DELETE' 
      });
      const data = await res.json();
      return data.success;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Parar todos os processos
   */
  static async stopAllProcesses(): Promise<number> {
    try {
      const res = await fetch(`${API_URL}/api/processes/stop-all`, { 
        method: 'POST' 
      });
      const data = await res.json();
      return data.stopped || 0;
    } catch (e) {
      return 0;
    }
  }
  
  /**
   * Enviar input para um processo
   */
  static async sendInput(processId: string, input: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/api/processes/${processId}/input`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      });
      const data = await res.json();
      return data.success;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Encontrar processo por porta
   */
  static async findByPort(port: number): Promise<ManagedProcess | null> {
    const processes = await this.listProcesses();
    return processes.find(p => p.port === port && p.status === 'running') || null;
  }
  
  /**
   * Verificar se dev server está rodando
   */
  static async isDevServerRunning(): Promise<{ running: boolean; port?: number; processId?: string }> {
    const processes = await this.listProcesses();
    const devServer = processes.find(p => 
      p.status === 'running' && 
      (p.command.includes('npm run dev') || p.command.includes('npm start') || p.command.includes('vite'))
    );
    
    if (devServer) {
      return { running: true, port: devServer.port, processId: devServer.id };
    }
    return { running: false };
  }
  
  /**
   * Iniciar dev server (reutiliza se já existir)
   */
  static async startDevServer(command: string = 'npm run dev'): Promise<StartProcessResult> {
    const existing = await this.isDevServerRunning();
    if (existing.running && existing.processId) {
      const proc = await this.getProcess(existing.processId);
      if (proc) {
        return {
          success: true,
          reused: true,
          message: `Dev server already running on port ${existing.port}`,
          process: proc
        };
      }
    }
    return this.startProcess(command, { name: 'Dev Server' });
  }
  
  // ============================================================================
  // 🖥️ TERMINAL TABS
  // ============================================================================
  
  /**
   * Listar todas as abas de terminal
   */
  static async listTerminals(): Promise<{ tabs: TerminalTab[]; activeTabId: string | null }> {
    try {
      const res = await fetch(`${API_URL}/api/terminals`);
      const data = await res.json();
      return data.success ? { tabs: data.tabs, activeTabId: data.activeTabId } : { tabs: [], activeTabId: null };
    } catch (e) {
      return { tabs: [], activeTabId: null };
    }
  }
  
  /**
   * Criar nova aba de terminal
   */
  static async createTerminal(name?: string, type: 'shell' | 'process' | 'log' = 'shell', cwd?: string): Promise<TerminalTab | null> {
    try {
      const res = await fetch(`${API_URL}/api/terminals/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, cwd })
      });
      const data = await res.json();
      return data.success ? data.tab : null;
    } catch (e) {
      return null;
    }
  }
  
  /**
   * Ativar uma aba
   */
  static async activateTerminal(tabId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/api/terminals/${tabId}/activate`, { method: 'POST' });
      const data = await res.json();
      return data.success;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Fechar uma aba
   */
  static async closeTerminal(tabId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/api/terminals/${tabId}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Fechar todas as abas
   */
  static async closeAllTerminals(): Promise<number> {
    try {
      const res = await fetch(`${API_URL}/api/terminals/close-all`, { method: 'POST' });
      const data = await res.json();
      return data.closed || 0;
    } catch (e) {
      return 0;
    }
  }
  
  /**
   * Obter output de uma aba
   */
  static async getTerminalOutput(tabId: string, lines: number = 100): Promise<string> {
    try {
      const res = await fetch(`${API_URL}/api/terminals/${tabId}/output?lines=${lines}`);
      const data = await res.json();
      return data.success ? data.output : '';
    } catch (e) {
      return '';
    }
  }
  
  /**
   * Renomear uma aba
   */
  static async renameTerminal(tabId: string, name: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/api/terminals/${tabId}/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      return data.success;
    } catch (e) {
      return false;
    }
  }
  
  // ============================================================================
  // 📊 LOGS
  // ============================================================================
  
  /**
   * Obter logs do sistema
   */
  static async getLogs(options?: { lines?: number; level?: string; source?: string }): Promise<LogEntry[]> {
    try {
      const params = new URLSearchParams();
      if (options?.lines) params.set('lines', String(options.lines));
      if (options?.level) params.set('level', options.level);
      if (options?.source) params.set('source', options.source);
      
      const res = await fetch(`${API_URL}/api/logs?${params}`);
      const data = await res.json();
      return data.success ? data.logs : [];
    } catch (e) {
      return [];
    }
  }
  
  /**
   * Adicionar log (para o agente)
   */
  static async addLog(level: LogEntry['level'], source: string, message: string, metadata?: Record<string, any>): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, source, message, metadata })
      });
      const data = await res.json();
      return data.success;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Limpar logs
   */
  static async clearLogs(): Promise<number> {
    try {
      const res = await fetch(`${API_URL}/api/logs`, { method: 'DELETE' });
      const data = await res.json();
      return data.cleared || 0;
    } catch (e) {
      return 0;
    }
  }
  
  // ============================================================================
  // 🧠 SYSTEM STATE (para a IA)
  // ============================================================================
  
  /**
   * Obter estado completo do sistema
   */
  static async getSystemState(): Promise<SystemState | null> {
    try {
      const res = await fetch(`${API_URL}/api/system/state`);
      const data = await res.json();
      return data.success ? data.state : null;
    } catch (e) {
      return null;
    }
  }
  
  /**
   * Obter resumo do sistema (formato texto para a IA)
   */
  static async getSystemSummary(): Promise<string> {
    try {
      const res = await fetch(`${API_URL}/api/system/summary`);
      const data = await res.json();
      return data.success ? data.summary : 'System state unavailable';
    } catch (e) {
      return 'Failed to get system state';
    }
  }
  
  /**
   * Resetar sistema (mata todos os processos)
   */
  static async resetSystem(): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/api/system/reset`, { method: 'POST' });
      const data = await res.json();
      return data.success;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Matar processo por PID
   */
  static async killByPid(pid: number): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/api/system/kill-pid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid })
      });
      const data = await res.json();
      return data.success;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Matar processo por porta
   */
  static async killByPort(port: number): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/api/system/kill-port`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port })
      });
      const data = await res.json();
      return data.success;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Listar processos do sistema operacional
   */
  static async listSystemProcesses(): Promise<any[]> {
    try {
      const res = await fetch(`${API_URL}/api/system/processes`);
      const data = await res.json();
      return data.success ? data.processes : [];
    } catch (e) {
      return [];
    }
  }
}

export default ProcessManagerService;
