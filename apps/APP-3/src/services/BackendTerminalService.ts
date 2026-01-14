// src/services/BackendTerminalService.ts
// 🔧 Serviço de Terminal via Backend: Conecta ao backend Express ao invés do Local Bridge CLI

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface CommandResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  command: string;
  commandId?: string;
}

export interface FileOperation {
  path: string;
  content: string;
}

export interface FileWriteResult {
  success: boolean;
  results: Array<{
    path: string;
    success: boolean;
    error?: string;
  }>;
}

// Eventos para o Console Tático ouvir
type ConsoleListener = (text: string, type: 'stdout' | 'stderr' | 'info') => void;

class BackendTerminalService {
  private token: string | null = null;
  private listeners: ConsoleListener[] = [];

  constructor() {
    // Recupera token do localStorage
    this.token = localStorage.getItem('token');
  }

  // --- Gerenciamento de Listeners (Para o Terminal Console) ---
  
  public onOutput(callback: ConsoleListener): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private emitOutput(text: string, type: 'stdout' | 'stderr' | 'info') {
    this.listeners.forEach(cb => cb(text, type));
  }

  // Define token de autenticação
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  // Remove token
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Headers com autenticação
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Verifica se o backend está disponível
  async checkHealth(): Promise<boolean> {
    try {
      // Timeout curto para não travar a UI
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${API_BASE_URL}/terminal/health`, {
        headers: this.getHeaders(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        console.warn('⚠️ Token inválido ou expirado');
        return false;
      }

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Executa comando no backend
  async executeCommand(
    command: string,
    cwd: string = './project'
  ): Promise<CommandResult> {
    // 1. Avisa o console que o comando começou
    this.emitOutput(`\r\n$ ${command}\r\n`, 'stdout');

    try {
      const response = await fetch(`${API_BASE_URL}/terminal/execute`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ command, cwd })
      });

      const result: CommandResult = await response.json();

      // 2. Joga o resultado no Console Tático
      if (result.stdout) this.emitOutput(result.stdout, 'stdout');
      if (result.stderr) this.emitOutput(result.stderr, 'stderr');

      // 3. Analisa para Self-Healing
      if (!response.ok || result.exitCode !== 0 || result.stderr) {
        this.analyzeErrorForSelfHealing(
          result.stderr || result.stdout || 'Unknown Error',
          command
        );
      }

      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Erro de conexão com backend';
      this.emitOutput(`Error: ${errorMsg}\r\n`, 'stderr');

      // Dispara erro crítico se for falha de rede/fetch
      this.analyzeErrorForSelfHealing(errorMsg, command);

      throw error;
    }
  }

  // Escreve arquivos no disco via backend
  async writeFilesToDisk(files: FileOperation[]): Promise<FileWriteResult> {
    this.emitOutput(`\r\n[System] Escrevendo ${files.length} arquivo(s) no disco...\r\n`, 'info');

    try {
      const response = await fetch(`${API_BASE_URL}/terminal/write-files`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ files })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao escrever arquivos');
      }

      const result = await response.json();
      
      if (result.success) {
        this.emitOutput(`[System] ✅ Arquivos salvos com sucesso.\r\n`, 'info');
      } else {
        this.emitOutput(`[System] ⚠️ Alguns arquivos falharam ao salvar.\r\n`, 'stderr');
      }

      return result;
    } catch (error: any) {
      this.emitOutput(`[System] ❌ Erro ao salvar: ${error.message}\r\n`, 'stderr');
      throw error;
    }
  }

  // Lê arquivo do disco via backend
  async readFileFromDisk(filePath: string): Promise<string> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/terminal/read-file?path=${encodeURIComponent(filePath)}`,
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao ler arquivo');
      }

      const data = await response.json();
      return data.content;
    } catch (error: any) {
      console.error('Erro ao ler arquivo:', error);
      throw error;
    }
  }

  // Lista arquivos do diretório via backend
  async listFiles(dirPath: string = '.'): Promise<Array<{
    name: string;
    isDirectory: boolean;
    path: string;
  }>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/terminal/list-files?path=${encodeURIComponent(dirPath)}`,
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao listar arquivos');
      }

      const data = await response.json();
      return data.files;
    } catch (error: any) {
      console.error('Erro ao listar arquivos:', error);
      throw error;
    }
  }

  // 🚑 SELF-HEALING: Analisa erro para correção automática
  analyzeErrorForSelfHealing(errorLog: string, command: string): boolean {
    const criticalPatterns = [
      /Error:/i,
      /Failed/i,
      /exit code 1/i,
      /EADDRINUSE/i,      // Porta ocupada
      /ENOENT/i,          // Arquivo não encontrado
      /permission denied/i,
      /Cannot find module/i, // Módulo não encontrado
      /EACCES/i,          // Permissão negada
      /ECONNREFUSED/i     // Conexão recusada
    ];

    // Evita disparar healing para avisos simples (npm warn)
    if (errorLog.includes('npm WARN') && !errorLog.includes('ERR!')) {
      return false;
    }

    const isCritical = criticalPatterns.some(pattern => pattern.test(errorLog));

    if (isCritical) {
      console.warn('🚑 Erro crítico detectado. Acionando Self-Healing Engine...');
      
      // Emite evento customizado para o SelfHealingEngine reagir
      window.dispatchEvent(new CustomEvent('terminal_error', {
        detail: { 
          error: errorLog, 
          command,
          cwd: './project',
          timestamp: new Date().toISOString()
        }
      }));

      return true;
    }

    return false;
  }
}

export const backendTerminalService = new BackendTerminalService();
