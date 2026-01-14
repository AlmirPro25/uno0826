// src/services/TerminalBridge.ts
// 🔌 PONTE LOCAL: Conecta o navegador ao terminal do usuário

import { io, Socket } from 'socket.io-client';

// Eventos do protocolo Bridge
export enum BridgeEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  EXECUTE_COMMAND = 'execute_command',
  COMMAND_OUTPUT = 'command_output',
  COMMAND_ERROR = 'command_error',
  COMMAND_EXIT = 'command_exit',
  FILE_WRITE = 'file_write',
  FILE_READ = 'file_read',
  HEALTH_CHECK = 'health_check'
}

export interface TerminalCommand {
  id: string;
  command: string;
  cwd?: string;
  timeout?: number;
}

export interface CommandResult {
  id: string;
  output?: string;
  error?: string;
  exitCode?: number;
}

export interface FileOperation {
  path: string;
  content: string;
}

class TerminalBridgeService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private port: number = 4567; // Porta padrão do Local Bridge
  private commandCallbacks: Map<string, {
    onOutput: (data: string) => void;
    onError: (error: string) => void;
    onExit: (code: number) => void;
  }> = new Map();

  constructor() {}

  // Conecta ao agente local rodando na máquina do usuário
  async connect(): Promise<boolean> {
    if (this.isConnected) return true;

    return new Promise((resolve) => {
      this.socket = io(`http://localhost:${this.port}`, {
        reconnectionAttempts: 3,
        timeout: 5000,
        transports: ['websocket']
      });

      this.socket.on('connect', () => {
        console.log('🔌 Local Bridge Conectado: O AI agora tem mãos.');
        this.isConnected = true;
        this.setupListeners();
        resolve(true);
      });

      this.socket.on('connect_error', (err) => {
        console.warn('⚠️ Local Bridge não encontrado. Execute: npx ai-weaver connect', err.message);
        this.isConnected = false;
        resolve(false);
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Local Bridge desconectado.');
        this.isConnected = false;
      });
    });
  }

  private setupListeners() {
    if (!this.socket) return;

    // Stream de saída do comando
    this.socket.on(BridgeEvent.COMMAND_OUTPUT, (data: CommandResult) => {
      const callbacks = this.commandCallbacks.get(data.id);
      if (callbacks && data.output) {
        callbacks.onOutput(data.output);
      }
    });

    // Erros do comando
    this.socket.on(BridgeEvent.COMMAND_ERROR, (data: CommandResult) => {
      const callbacks = this.commandCallbacks.get(data.id);
      if (callbacks && data.error) {
        callbacks.onError(data.error);
        // 🚑 SELF-HEALING: Detecta erro para correção automática
        this.analyzeErrorForSelfHealing(data.error, data.id);
      }
    });

    // Fim da execução
    this.socket.on(BridgeEvent.COMMAND_EXIT, (data: CommandResult) => {
      const callbacks = this.commandCallbacks.get(data.id);
      if (callbacks) {
        callbacks.onExit(data.exitCode || 0);
        this.commandCallbacks.delete(data.id);
      }
    });
  }

  // Executa comando real no terminal do usuário
  executeCommand(
    cmd: string,
    cwd: string = './project',
    callbacks?: {
      onOutput?: (data: string) => void;
      onError?: (error: string) => void;
      onExit?: (code: number) => void;
    }
  ): string {
    if (!this.isConnected || !this.socket) {
      throw new Error("Bridge desconectado. Execute 'npx ai-weaver connect' no terminal.");
    }

    const commandId = crypto.randomUUID();

    // Registra o comando para referência futura (Self-Healing)
    this.commandRegistry.set(commandId, cmd);

    // Registra callbacks para este comando
    if (callbacks) {
      this.commandCallbacks.set(commandId, {
        onOutput: callbacks.onOutput || (() => {}),
        onError: callbacks.onError || (() => {}),
        onExit: callbacks.onExit || (() => {})
      });
    }

    console.log(`🚀 Enviando comando para execução real: ${cmd}`);
    this.socket.emit(BridgeEvent.EXECUTE_COMMAND, {
      id: commandId,
      command: cmd,
      cwd,
      timeout: 300000 // 5 minutos
    } as TerminalCommand);

    return commandId;
  }

  // Escreve arquivos gerados pelo Gemini direto no disco do usuário
  async writeFilesToDisk(files: FileOperation[]): Promise<boolean> {
    if (!this.isConnected || !this.socket) {
      throw new Error('Bridge desconectado.');
    }

    return new Promise((resolve) => {
      this.socket!.emit(BridgeEvent.FILE_WRITE, { files }, (response: { success: boolean }) => {
        resolve(response.success);
      });
    });
  }

  // Lê arquivo do disco local (para contexto)
  async readFileFromDisk(path: string): Promise<string | null> {
    if (!this.isConnected || !this.socket) {
      throw new Error('Bridge desconectado.');
    }

    return new Promise((resolve) => {
      this.socket!.emit(BridgeEvent.FILE_READ, { path }, (response: { content: string | null }) => {
        resolve(response.content);
      });
    });
  }

  // Health check do Bridge
  async checkHealth(): Promise<boolean> {
    if (!this.socket) return false;

    return new Promise((resolve) => {
      this.socket!.emit(BridgeEvent.HEALTH_CHECK, {}, (response: { status: string }) => {
        resolve(response.status === 'ok');
      });
    });
  }

  // 🚑 SELF-HEALING: Analisa erro para correção automática
  private analyzeErrorForSelfHealing(errorLog: string, commandId: string) {
    const criticalPatterns = [
      /Error:/i,
      /Failed/i,
      /exit code 1/i,
      /EADDRINUSE/i, // Porta ocupada
      /ENOENT/i,     // Arquivo não encontrado
      /permission denied/i,
      /Cannot find module/i, // Módulo não encontrado
      /EACCES/i,     // Permissão negada
      /ECONNREFUSED/i // Conexão recusada
    ];

    const isCritical = criticalPatterns.some(pattern => pattern.test(errorLog));

    if (isCritical) {
      console.log('🚑 Erro crítico detectado. Acionando Self-Healing Engine...');
      
      // Busca o comando original
      const callbacks = this.commandCallbacks.get(commandId);
      const command = this.getCommandById(commandId);
      
      // Emite evento customizado para o SelfHealingEngine reagir
      window.dispatchEvent(new CustomEvent('terminal_error', {
        detail: { 
          error: errorLog, 
          commandId,
          command: command || 'unknown'
        }
      }));
    }
  }

  // Armazena comandos para referência futura
  private commandRegistry: Map<string, string> = new Map();

  private getCommandById(commandId: string): string | undefined {
    return this.commandRegistry.get(commandId);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const terminalBridge = new TerminalBridgeService();
