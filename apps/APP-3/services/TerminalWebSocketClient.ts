/**
 * ============================================
 * 🔌 TERMINAL WEBSOCKET CLIENT
 * ============================================
 * 
 * Cliente WebSocket para comunicação em tempo real
 * com o terminal do backend.
 */

import { EventEmitter } from 'events';

// ============================================
// TIPOS
// ============================================

export interface WSMessage {
  type: 'command' | 'input' | 'resize' | 'ping';
  payload: any;
  sessionId?: string;
}

export interface WSResponse {
  type: 'output' | 'error' | 'exit' | 'pong' | 'event' | 'connected';
  payload: any;
  sessionId?: string;
  timestamp: number;
}

export interface TerminalClientOptions {
  url?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
}

// ============================================
// WEBSOCKET CLIENT
// ============================================

export class TerminalWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private options: Required<TerminalClientOptions>;
  private reconnectAttempts: number = 0;
  private pingTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;

  constructor(options: TerminalClientOptions = {}) {
    super();
    this.options = {
      url: options.url || 'ws://localhost:3001/ws/terminal',
      reconnect: options.reconnect ?? true,
      reconnectInterval: options.reconnectInterval || 3000,
      maxReconnectAttempts: options.maxReconnectAttempts || 10,
      pingInterval: options.pingInterval || 30000
    };
  }

  /**
   * Conecta ao servidor WebSocket
   */
  connect(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve(this.sessionId!);
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Conexão já em andamento'));
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.options.url);

        this.ws.onopen = () => {
          console.log('🔌 WebSocket conectado');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startPing();
          this.emit('open');
        };

        this.ws.onmessage = (event) => {
          try {
            const response: WSResponse = JSON.parse(event.data);
            this.handleResponse(response, resolve);
          } catch (e) {
            console.error('Erro ao parsear mensagem:', e);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket desconectado:', event.code);
          this.isConnecting = false;
          this.stopPing();
          this.emit('close', event);
          
          if (this.options.reconnect && !event.wasClean) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket erro:', error);
          this.isConnecting = false;
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Processa respostas do servidor
   */
  private handleResponse(response: WSResponse, resolveConnect?: (sessionId: string) => void) {
    switch (response.type) {
      case 'connected':
        this.sessionId = response.payload.sessionId;
        console.log(`🔌 Sessão: ${this.sessionId}`);
        this.emit('connected', response.payload);
        if (resolveConnect) {
          resolveConnect(this.sessionId!);
        }
        break;

      case 'output':
        this.emit('output', {
          data: response.payload.data,
          stream: response.payload.stream,
          timestamp: response.timestamp
        });
        break;

      case 'error':
        this.emit('terminalError', {
          message: response.payload.message,
          timestamp: response.timestamp
        });
        break;

      case 'exit':
        this.emit('exit', {
          code: response.payload.code,
          command: response.payload.command,
          timestamp: response.timestamp
        });
        break;

      case 'pong':
        this.emit('pong', response.payload);
        break;

      case 'event':
        this.emit('serverEvent', response.payload);
        break;
    }
  }

  /**
   * Envia comando para execução
   */
  executeCommand(command: string, cwd?: string) {
    this.send({
      type: 'command',
      payload: { command, cwd }
    });
  }

  /**
   * Envia input para o processo
   */
  sendInput(data: string) {
    this.send({
      type: 'input',
      payload: { data }
    });
  }

  /**
   * Redimensiona o terminal
   */
  resize(cols: number, rows: number) {
    this.send({
      type: 'resize',
      payload: { cols, rows }
    });
  }

  /**
   * Envia mensagem
   */
  private send(message: WSMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      message.sessionId = this.sessionId || undefined;
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket não conectado');
    }
  }

  /**
   * Ping/Pong para manter conexão
   */
  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.send({ type: 'ping', payload: { time: Date.now() } });
    }, this.options.pingInterval);
  }

  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /**
   * Reconexão automática
   */
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('❌ Máximo de tentativas de reconexão atingido');
      this.emit('maxReconnectAttempts');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Reconectando... (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {});
    }, this.options.reconnectInterval);
  }

  /**
   * Desconecta
   */
  disconnect() {
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.sessionId = null;
  }

  /**
   * Getters
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get currentSessionId(): string | null {
    return this.sessionId;
  }
}

// Instância singleton
export const terminalWSClient = new TerminalWebSocketClient();

// Hook React
export function useTerminalWebSocket() {
  return {
    client: terminalWSClient,
    connect: () => terminalWSClient.connect(),
    disconnect: () => terminalWSClient.disconnect(),
    execute: (cmd: string, cwd?: string) => terminalWSClient.executeCommand(cmd, cwd),
    sendInput: (data: string) => terminalWSClient.sendInput(data),
    isConnected: terminalWSClient.isConnected
  };
}
