/**
 * ============================================
 * 🔌 TERMINAL WEBSOCKET - STREAMING REAL-TIME
 * ============================================
 * 
 * WebSocket server para:
 * - Streaming de output de processos em tempo real
 * - Comunicação bidirecional com o terminal
 * - Notificações de eventos do sistema
 */

import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { EventEmitter } from 'events';

// ============================================
// TIPOS
// ============================================

interface WSMessage {
  type: 'command' | 'input' | 'resize' | 'ping' | 'subscribe' | 'unsubscribe';
  payload: any;
  sessionId?: string;
}

interface WSResponse {
  type: 'output' | 'error' | 'exit' | 'pong' | 'event' | 'connected';
  payload: any;
  sessionId?: string;
  timestamp: number;
}

interface TerminalSession {
  id: string;
  process: ChildProcess | null;
  ws: WebSocket;
  cwd: string;
  createdAt: number;
  lastActivity: number;
}

// ============================================
// TERMINAL WEBSOCKET SERVER
// ============================================

export class TerminalWebSocketServer extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private sessions: Map<string, TerminalSession> = new Map();
  private workspaceRoot: string;

  constructor(workspaceRoot: string = process.cwd()) {
    super();
    this.workspaceRoot = path.resolve(workspaceRoot, '..');
  }

  /**
   * Inicializa o WebSocket server
   */
  initialize(server: Server, path: string = '/ws/terminal') {
    this.wss = new WebSocketServer({ server, path });

    this.wss.on('connection', (ws, req) => {
      const sessionId = this.generateSessionId();
      console.log(`🔌 WebSocket conectado: ${sessionId}`);

      const session: TerminalSession = {
        id: sessionId,
        process: null,
        ws,
        cwd: this.workspaceRoot,
        createdAt: Date.now(),
        lastActivity: Date.now()
      };

      this.sessions.set(sessionId, session);

      // Envia confirmação de conexão
      this.send(ws, {
        type: 'connected',
        payload: { sessionId, cwd: session.cwd },
        sessionId,
        timestamp: Date.now()
      });

      // Handlers
      ws.on('message', (data) => this.handleMessage(session, data.toString()));
      ws.on('close', () => this.handleClose(session));
      ws.on('error', (err) => this.handleError(session, err));
    });

    console.log(`🔌 WebSocket server iniciado em ${path}`);
    return this;
  }

  /**
   * Processa mensagens recebidas
   */
  private handleMessage(session: TerminalSession, rawData: string) {
    try {
      const message: WSMessage = JSON.parse(rawData);
      session.lastActivity = Date.now();

      switch (message.type) {
        case 'command':
          this.executeCommand(session, message.payload);
          break;

        case 'input':
          this.sendInput(session, message.payload);
          break;

        case 'resize':
          this.resizeTerminal(session, message.payload);
          break;

        case 'ping':
          this.send(session.ws, {
            type: 'pong',
            payload: { time: Date.now() },
            sessionId: session.id,
            timestamp: Date.now()
          });
          break;

        default:
          console.warn(`Tipo de mensagem desconhecido: ${message.type}`);
      }
    } catch (error: any) {
      this.sendError(session, `Erro ao processar mensagem: ${error.message}`);
    }
  }

  /**
   * Executa um comando no terminal
   */
  private executeCommand(session: TerminalSession, payload: { command: string; cwd?: string }) {
    const { command, cwd } = payload;

    // Atualiza diretório se fornecido
    if (cwd) {
      const newCwd = path.resolve(this.workspaceRoot, cwd);
      if (newCwd.startsWith(this.workspaceRoot)) {
        session.cwd = newCwd;
      }
    }

    // Mata processo anterior se existir
    if (session.process) {
      session.process.kill();
      session.process = null;
    }

    // Inicia novo processo
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? 'cmd.exe' : '/bin/bash';
    const shellArgs = isWindows ? ['/c', command] : ['-c', command];

    const child = spawn(shell, shellArgs, {
      cwd: session.cwd,
      env: { ...process.env, FORCE_COLOR: '1', TERM: 'xterm-256color' },
      shell: false
    });

    session.process = child;

    // Stream stdout
    child.stdout?.on('data', (data) => {
      this.send(session.ws, {
        type: 'output',
        payload: { data: data.toString(), stream: 'stdout' },
        sessionId: session.id,
        timestamp: Date.now()
      });
    });

    // Stream stderr
    child.stderr?.on('data', (data) => {
      this.send(session.ws, {
        type: 'output',
        payload: { data: data.toString(), stream: 'stderr' },
        sessionId: session.id,
        timestamp: Date.now()
      });
    });

    // Processo finalizado
    child.on('close', (code) => {
      this.send(session.ws, {
        type: 'exit',
        payload: { code, command },
        sessionId: session.id,
        timestamp: Date.now()
      });
      session.process = null;
    });

    // Erro no processo
    child.on('error', (error) => {
      this.sendError(session, `Erro no processo: ${error.message}`);
      session.process = null;
    });
  }

  /**
   * Envia input para o processo
   */
  private sendInput(session: TerminalSession, payload: { data: string }) {
    if (session.process?.stdin) {
      session.process.stdin.write(payload.data);
    }
  }

  /**
   * Redimensiona o terminal (para PTY futuro)
   */
  private resizeTerminal(session: TerminalSession, payload: { cols: number; rows: number }) {
    // Implementação futura com node-pty
    console.log(`Resize: ${payload.cols}x${payload.rows}`);
  }

  /**
   * Handlers de conexão
   */
  private handleClose(session: TerminalSession) {
    console.log(`🔌 WebSocket desconectado: ${session.id}`);
    
    if (session.process) {
      session.process.kill();
    }
    
    this.sessions.delete(session.id);
    this.emit('session:closed', { sessionId: session.id });
  }

  private handleError(session: TerminalSession, error: Error) {
    console.error(`❌ WebSocket erro [${session.id}]:`, error.message);
    this.sendError(session, error.message);
  }

  /**
   * Helpers
   */
  private send(ws: WebSocket, response: WSResponse) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(response));
    }
  }

  private sendError(session: TerminalSession, message: string) {
    this.send(session.ws, {
      type: 'error',
      payload: { message },
      sessionId: session.id,
      timestamp: Date.now()
    });
  }

  private generateSessionId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Broadcast para todas as sessões
   */
  broadcast(event: string, data: any) {
    const response: WSResponse = {
      type: 'event',
      payload: { event, data },
      timestamp: Date.now()
    };

    this.sessions.forEach(session => {
      this.send(session.ws, response);
    });
  }

  /**
   * Obtém estatísticas
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      sessions: Array.from(this.sessions.values()).map(s => ({
        id: s.id,
        cwd: s.cwd,
        hasProcess: !!s.process,
        createdAt: s.createdAt,
        lastActivity: s.lastActivity
      }))
    };
  }

  /**
   * Cleanup
   */
  shutdown() {
    this.sessions.forEach(session => {
      if (session.process) {
        session.process.kill();
      }
      session.ws.close();
    });
    this.sessions.clear();
    this.wss?.close();
  }
}

// Instância singleton
export const terminalWS = new TerminalWebSocketServer();
