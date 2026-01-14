/**
 * ============================================
 * 🎯 USE UNIFIED TERMINAL - HOOK DE INTEGRAÇÃO
 * ============================================
 * 
 * Hook que unifica:
 * - Terminal WebSocket (streaming real)
 * - Agente IA (linguagem natural)
 * - File Watcher (mudanças em tempo real)
 */

import * as React from 'react';
import { terminalWSClient } from '@/services/TerminalWebSocketClient';
import { kiroUnifiedAgent, StreamEvent } from '@/services/KiroUnifiedAgent';

const { useState, useEffect, useCallback, useRef } = React;

// ============================================
// TIPOS
// ============================================

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'info' | 'tool' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface UnifiedTerminalState {
  lines: TerminalLine[];
  isConnected: boolean;
  isExecuting: boolean;
  mode: 'agent' | 'websocket';
  cwd: string;
  sessionId: string | null;
}

export interface UseUnifiedTerminalOptions {
  initialCwd?: string;
  maxLines?: number;
  autoConnect?: boolean;
}

// ============================================
// HOOK
// ============================================

export function useUnifiedTerminal(options: UseUnifiedTerminalOptions = {}) {
  const {
    initialCwd = '.',
    maxLines = 500,
    autoConnect = true
  } = options;

  // Estados
  const [state, setState] = useState<UnifiedTerminalState>({
    lines: [],
    isConnected: false,
    isExecuting: false,
    mode: 'agent',
    cwd: initialCwd,
    sessionId: null
  });

  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const agentSessionRef = useRef<string | null>(null);

  // ============================================
  // CONEXÃO
  // ============================================

  const connect = useCallback(async () => {
    try {
      // Conecta WebSocket
      await terminalWSClient.connect();
      setState(prev => ({ ...prev, isConnected: true }));
      addLine('system', '✅ Conectado ao servidor');

      // Cria sessão do agente
      const sessionId = kiroUnifiedAgent.createSession({
        workingDirectory: state.cwd
      });
      agentSessionRef.current = sessionId;
      setState(prev => ({ ...prev, sessionId }));

    } catch (error: any) {
      addLine('error', `❌ Erro de conexão: ${error.message}`);
    }
  }, [state.cwd]);

  const disconnect = useCallback(() => {
    terminalWSClient.disconnect();
    setState(prev => ({ ...prev, isConnected: false }));
  }, []);

  // ============================================
  // LINHAS
  // ============================================

  const addLine = useCallback((type: TerminalLine['type'], content: string, metadata?: Record<string, any>) => {
    setState(prev => ({
      ...prev,
      lines: [...prev.lines.slice(-maxLines), {
        id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type,
        content,
        timestamp: Date.now(),
        metadata
      }]
    }));
  }, [maxLines]);

  const clearLines = useCallback(() => {
    setState(prev => ({
      ...prev,
      lines: [{ id: 'cleared', type: 'system', content: '🧹 Terminal limpo', timestamp: Date.now() }]
    }));
  }, []);

  // ============================================
  // EXECUÇÃO
  // ============================================

  const execute = useCallback(async (input: string) => {
    if (!input.trim() || state.isExecuting) return;

    const cmd = input.trim();
    setState(prev => ({ ...prev, isExecuting: true }));

    // Adiciona ao histórico
    setCommandHistory(prev => [...prev.slice(-100), cmd]);

    // Mostra input
    addLine('input', `❯ ${cmd}`);

    // Comandos especiais
    if (handleSpecialCommand(cmd)) {
      setState(prev => ({ ...prev, isExecuting: false }));
      return;
    }

    try {
      if (state.mode === 'websocket' && state.isConnected) {
        // Executa via WebSocket
        terminalWSClient.executeCommand(cmd, state.cwd);
      } else {
        // Executa via Agente
        await executeViaAgent(cmd);
      }
    } catch (error: any) {
      addLine('error', `❌ ${error.message}`);
      setState(prev => ({ ...prev, isExecuting: false }));
    }
  }, [state.isExecuting, state.mode, state.isConnected, state.cwd]);

  const executeViaAgent = async (cmd: string) => {
    try {
      if (!agentSessionRef.current) {
        agentSessionRef.current = kiroUnifiedAgent.createSession({
          workingDirectory: state.cwd
        });
      }

      await kiroUnifiedAgent.processMessage(
        cmd,
        agentSessionRef.current,
        (event: StreamEvent) => {
          switch (event.type) {
            case 'tool_start':
              addLine('tool', `🔧 ${event.tool}...`);
              break;
            case 'tool_end':
              if (event.result?.success) {
                const data = event.result.data;
                if (typeof data === 'string') {
                  addLine('output', data.substring(0, 3000));
                } else if (data?.stdout) {
                  addLine('output', data.stdout.substring(0, 3000));
                }
              }
              if (event.result?.error) {
                addLine('error', event.result.error);
              }
              break;
            case 'text':
              addLine('output', event.content || '');
              break;
            case 'error':
              addLine('error', event.error || 'Erro');
              break;
            case 'done':
              setState(prev => ({ ...prev, isExecuting: false }));
              break;
          }
        }
      );
    } finally {
      setState(prev => ({ ...prev, isExecuting: false }));
    }
  };

  // ============================================
  // COMANDOS ESPECIAIS
  // ============================================

  const handleSpecialCommand = (cmd: string): boolean => {
    const lower = cmd.toLowerCase().trim();

    if (lower === 'clear' || lower === 'cls') {
      clearLines();
      return true;
    }

    if (lower === 'help') {
      addLine('info', `
╔═══════════════════════════════════════════════════════════╗
║              🎯 UNIFIED TERMINAL                          ║
╠═══════════════════════════════════════════════════════════╣
║  MODOS:                                                   ║
║    agent     - IA com linguagem natural                   ║
║    websocket - Streaming real via WebSocket               ║
║                                                           ║
║  COMANDOS:                                                ║
║    clear     - Limpar terminal                            ║
║    help      - Esta ajuda                                 ║
║    mode      - Alternar modo                              ║
║    cd <dir>  - Mudar diretório                            ║
║                                                           ║
║  EXEMPLOS (modo agent):                                   ║
║    "liste os arquivos"                                    ║
║    "busque por useState nos tsx"                          ║
║    "crie um componente Button"                            ║
║    "execute npm install"                                  ║
╚═══════════════════════════════════════════════════════════╝
      `);
      return true;
    }

    if (lower === 'mode') {
      const newMode = state.mode === 'agent' ? 'websocket' : 'agent';
      setState(prev => ({ ...prev, mode: newMode }));
      addLine('info', `🔄 Modo: ${newMode === 'agent' ? 'Agente IA' : 'WebSocket'}`);
      return true;
    }

    if (lower.startsWith('cd ')) {
      const newCwd = cmd.substring(3).trim();
      setState(prev => ({ ...prev, cwd: newCwd }));
      addLine('info', `📁 Diretório: ${newCwd}`);
      return true;
    }

    return false;
  };

  // ============================================
  // EFFECTS
  // ============================================

  // Auto-connect
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Event listeners do WebSocket
    const handleOutput = (data: { data: string; stream: string }) => {
      const type = data.stream === 'stderr' ? 'error' : 'output';
      data.data.split('\n').filter(l => l.trim()).forEach(line => {
        addLine(type as any, line);
      });
    };

    const handleExit = (data: { code: number }) => {
      setState(prev => ({ ...prev, isExecuting: false }));
      addLine('info', data.code === 0 ? '✅ Concluído' : `❌ Exit: ${data.code}`);
    };

    const handleError = (data: { message: string }) => {
      addLine('error', data.message);
      setState(prev => ({ ...prev, isExecuting: false }));
    };

    const handleClose = () => {
      setState(prev => ({ ...prev, isConnected: false }));
      addLine('system', '🔌 Desconectado');
    };

    const handleFileChanges = (data: any) => {
      if (data.events?.length > 0) {
        addLine('info', `📁 ${data.count} arquivo(s) modificado(s)`);
      }
    };

    terminalWSClient.on('output', handleOutput);
    terminalWSClient.on('exit', handleExit);
    terminalWSClient.on('terminalError', handleError);
    terminalWSClient.on('close', handleClose);
    terminalWSClient.on('serverEvent', (payload) => {
      if (payload.event === 'fileChanges') {
        handleFileChanges(payload.data);
      }
    });

    return () => {
      terminalWSClient.off('output', handleOutput);
      terminalWSClient.off('exit', handleExit);
      terminalWSClient.off('terminalError', handleError);
      terminalWSClient.off('close', handleClose);
      disconnect();
    };
  }, [autoConnect]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Estado
    ...state,
    commandHistory,

    // Ações
    execute,
    connect,
    disconnect,
    clearLines,
    addLine,

    // Setters
    setMode: (mode: 'agent' | 'websocket') => setState(prev => ({ ...prev, mode })),
    setCwd: (cwd: string) => setState(prev => ({ ...prev, cwd })),

    // Atalhos
    quickCommand: async (cmd: string) => {
      const result = await kiroUnifiedAgent.quickCommand(cmd);
      addLine('output', result);
      return result;
    },
    quickRead: async (path: string) => {
      const content = await kiroUnifiedAgent.quickRead(path);
      return content;
    },
    quickSearch: async (query: string, pattern?: string) => {
      const results = await kiroUnifiedAgent.quickSearch(query, pattern);
      return results;
    }
  };
}

export default useUnifiedTerminal;
