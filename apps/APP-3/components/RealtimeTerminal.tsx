/**
 * ============================================
 * ⚡ REALTIME TERMINAL - WEBSOCKET POWERED
 * ============================================
 * 
 * Terminal com streaming em tempo real via WebSocket.
 * Combina o melhor do ProfessionalTerminal com conexão real-time.
 */

import * as React from 'react';
import { terminalWSClient, useTerminalWebSocket } from '@/services/TerminalWebSocketClient';
import { kiroUnifiedAgent, StreamEvent } from '@/services/KiroUnifiedAgent';

const { useState, useRef, useEffect, useCallback } = React;

// ============================================
// TIPOS
// ============================================

interface TerminalLine {
  id: string;
  type: 'input' | 'stdout' | 'stderr' | 'info' | 'error' | 'system';
  content: string;
  timestamp: number;
}

interface RealtimeTerminalProps {
  className?: string;
  initialCwd?: string;
  onFileChange?: (path: string) => void;
}

// ============================================
// COMPONENTE
// ============================================

export const RealtimeTerminal: React.FC<RealtimeTerminalProps> = ({
  className = '',
  initialCwd = '.',
  onFileChange
}) => {
  // Estados
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: 'welcome', type: 'system', content: '⚡ Terminal Realtime - Conectando...', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [mode, setMode] = useState<'ws' | 'agent'>('agent');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cwd, setCwd] = useState(initialCwd);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);

  // ============================================
  // CONEXÃO WEBSOCKET
  // ============================================

  useEffect(() => {
    const connectWS = async () => {
      try {
        const sessionId = await terminalWSClient.connect();
        sessionIdRef.current = sessionId;
        setIsConnected(true);
        addLine('system', '✅ Conectado ao servidor');
      } catch (error) {
        addLine('error', '❌ Falha na conexão WebSocket. Usando modo HTTP.');
        setMode('agent');
      }
    };

    // Event listeners
    terminalWSClient.on('output', handleOutput);
    terminalWSClient.on('exit', handleExit);
    terminalWSClient.on('terminalError', handleError);
    terminalWSClient.on('close', handleClose);

    connectWS();

    return () => {
      terminalWSClient.off('output', handleOutput);
      terminalWSClient.off('exit', handleExit);
      terminalWSClient.off('terminalError', handleError);
      terminalWSClient.off('close', handleClose);
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  // ============================================
  // HANDLERS DE WEBSOCKET
  // ============================================

  const handleOutput = useCallback((data: { data: string; stream: string }) => {
    const type = data.stream === 'stderr' ? 'stderr' : 'stdout';
    // Divide por linhas para melhor visualização
    const lines = data.data.split('\n').filter(l => l.trim());
    lines.forEach(line => {
      addLine(type, line);
    });
  }, []);

  const handleExit = useCallback((data: { code: number; command: string }) => {
    setIsExecuting(false);
    if (data.code === 0) {
      addLine('info', `✅ Comando finalizado (exit: ${data.code})`);
    } else {
      addLine('error', `❌ Comando falhou (exit: ${data.code})`);
    }
  }, []);

  const handleError = useCallback((data: { message: string }) => {
    addLine('error', `❌ ${data.message}`);
    setIsExecuting(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsConnected(false);
    addLine('system', '🔌 Conexão perdida. Reconectando...');
  }, []);

  // ============================================
  // FUNÇÕES DE LINHA
  // ============================================

  const addLine = useCallback((type: TerminalLine['type'], content: string) => {
    setLines(prev => [...prev.slice(-500), { // Mantém últimas 500 linhas
      id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      content,
      timestamp: Date.now()
    }]);
  }, []);

  // ============================================
  // EXECUÇÃO DE COMANDOS
  // ============================================

  const executeCommand = async () => {
    if (!input.trim() || isExecuting) return;

    const cmd = input.trim();
    setInput('');
    setIsExecuting(true);

    // Adiciona ao histórico
    setCommandHistory(prev => [...prev.slice(-100), cmd]);
    setHistoryIndex(-1);

    // Mostra comando
    addLine('input', `❯ ${cmd}`);

    // Comandos especiais
    if (handleSpecialCommand(cmd)) {
      setIsExecuting(false);
      return;
    }

    if (mode === 'ws' && isConnected) {
      // Executa via WebSocket (streaming real)
      terminalWSClient.executeCommand(cmd, cwd);
    } else {
      // Executa via Agente (HTTP)
      await executeViaAgent(cmd);
    }
  };

  const executeViaAgent = async (cmd: string) => {
    try {
      // Cria sessão se não existir
      if (!sessionIdRef.current) {
        sessionIdRef.current = kiroUnifiedAgent.createSession({ workingDirectory: cwd });
      }

      await kiroUnifiedAgent.processMessage(cmd, sessionIdRef.current, (event: StreamEvent) => {
        switch (event.type) {
          case 'tool_start':
            addLine('info', `🔧 ${event.tool}...`);
            break;
          case 'tool_end':
            if (event.result?.data?.stdout) {
              addLine('stdout', event.result.data.stdout);
            }
            if (event.result?.error) {
              addLine('error', event.result.error);
            }
            break;
          case 'text':
            addLine('stdout', event.content || '');
            break;
          case 'error':
            addLine('error', event.error || 'Erro desconhecido');
            break;
        }
      });
    } catch (error: any) {
      addLine('error', `❌ ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // ============================================
  // COMANDOS ESPECIAIS
  // ============================================

  const handleSpecialCommand = (cmd: string): boolean => {
    const lower = cmd.toLowerCase().trim();

    if (lower === 'clear' || lower === 'cls') {
      setLines([{ id: 'cleared', type: 'system', content: '🧹 Terminal limpo', timestamp: Date.now() }]);
      return true;
    }

    if (lower === 'help') {
      addLine('info', `
╔════════════════════════════════════════════════════════════╗
║              ⚡ REALTIME TERMINAL                          ║
╠════════════════════════════════════════════════════════════╣
║  MODOS:                                                    ║
║    ws     - WebSocket (streaming real)                     ║
║    agent  - Agente IA (linguagem natural)                  ║
║                                                            ║
║  COMANDOS:                                                 ║
║    clear  - Limpar terminal                                ║
║    help   - Esta ajuda                                     ║
║    mode   - Alternar modo (ws/agent)                       ║
║    cd     - Mudar diretório                                ║
║                                                            ║
║  MODO AGENT (linguagem natural):                           ║
║    "liste os arquivos"                                     ║
║    "busque por useState"                                   ║
║    "crie um arquivo test.txt"                              ║
╚════════════════════════════════════════════════════════════╝
      `);
      return true;
    }

    if (lower === 'mode') {
      const newMode = mode === 'ws' ? 'agent' : 'ws';
      setMode(newMode);
      addLine('info', `🔄 Modo alterado para: ${newMode === 'ws' ? 'WebSocket' : 'Agente IA'}`);
      return true;
    }

    if (lower.startsWith('cd ')) {
      const newDir = cmd.substring(3).trim();
      setCwd(newDir);
      addLine('info', `📁 Diretório: ${newDir}`);
      return true;
    }

    return false;
  };

  // ============================================
  // HANDLERS DE INPUT
  // ============================================

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      if (isExecuting) {
        terminalWSClient.sendInput('\x03'); // Ctrl+C
        addLine('info', '^C');
      }
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const getLineStyle = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return 'text-sky-400 font-semibold';
      case 'stdout': return 'text-slate-300';
      case 'stderr': return 'text-orange-400';
      case 'info': return 'text-blue-400';
      case 'error': return 'text-red-400';
      case 'system': return 'text-emerald-400';
      default: return 'text-slate-300';
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={`flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-bolt text-yellow-400"></i>
          <span className="text-sm font-semibold text-slate-200">Realtime Terminal</span>
          
          {/* Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setMode('agent')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                mode === 'agent' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🤖 Agent
            </button>
            <button
              onClick={() => setMode('ws')}
              disabled={!isConnected}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                mode === 'ws' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              ⚡ WS
            </button>
          </div>

          {/* Status */}
          <div className={`flex items-center gap-1.5 text-xs ${isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`}></div>
            <span>{isConnected ? 'Conectado' : 'Offline'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>📁 {cwd}</span>
        </div>
      </div>

      {/* Output */}
      <div 
        ref={outputRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-0.5 scrollbar-thin scrollbar-thumb-slate-600"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map(line => (
          <div key={line.id} className={`${getLineStyle(line.type)} leading-relaxed`}>
            <pre className="whitespace-pre-wrap break-words m-0">{line.content}</pre>
          </div>
        ))}
        
        {isExecuting && (
          <div className="flex items-center gap-2 text-yellow-400">
            <i className="fa-solid fa-spinner animate-spin"></i>
            <span>Executando...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-slate-800 border-t border-slate-700">
        <span className={mode === 'agent' ? 'text-emerald-400' : 'text-purple-400'}>
          {mode === 'agent' ? '🤖' : '⚡'}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'agent' ? 'Digite em linguagem natural...' : 'Digite um comando...'}
          className="flex-1 bg-transparent text-slate-200 font-mono text-sm focus:outline-none placeholder-slate-500"
          disabled={isExecuting}
          autoFocus
        />
        <button
          onClick={executeCommand}
          disabled={!input.trim() || isExecuting}
          className={`px-3 py-1.5 text-white rounded transition-colors text-sm disabled:bg-slate-600 disabled:cursor-not-allowed ${
            mode === 'agent' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-purple-600 hover:bg-purple-500'
          }`}
        >
          {isExecuting ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
        </button>
      </div>
    </div>
  );
};

export default RealtimeTerminal;
