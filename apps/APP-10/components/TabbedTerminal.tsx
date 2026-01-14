/**
 * 🖥️ Tabbed Terminal Component
 * Terminal com abas para shell principal e processos gerenciados
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { 
  TerminalSquare, 
  Trash2, 
  Plus, 
  X, 
  Circle,
  Square,
  RefreshCw,
  Globe,
  Play,
  Send,
  Keyboard
} from 'lucide-react';
import { isLocalMode } from '../services/runtimeBridge';
import { ProcessManagerService, ManagedProcess } from '../services/processManager';
import { io, Socket } from 'socket.io-client';

interface Tab {
  id: string;
  name: string;
  type: 'shell' | 'process';
  processId?: string;
  status?: 'running' | 'stopped' | 'error';
  port?: number;
}

interface TabbedTerminalProps {
  onInput?: (input: string) => void;
  onResize?: (cols: number, rows: number) => void;
  onOpenFile?: (path: string) => void;
  className?: string;
  terminalInstanceRef: React.RefObject<XTerm | null>;
}

const API_URL = 'http://localhost:3001';

// Componente de input para processos
const ProcessInput: React.FC<{
  processId: string;
  onSend: (processId: string, input: string) => void;
}> = ({ processId, onSend }) => {
  const [input, setInput] = useState('');
  
  const handleSend = () => {
    if (input.trim()) {
      onSend(processId, input + '\n');
      setInput('');
    }
  };
  
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-[#1a1a1d] border-b border-slate-800/50">
      <span className="text-[10px] text-slate-500">INPUT:</span>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSend();
          if (e.key === 'c' && e.ctrlKey) {
            e.preventDefault();
            onSend(processId, '\x03');
          }
        }}
        placeholder="Type input for process (Enter to send, Ctrl+C to interrupt)"
        className="flex-1 px-2 py-1 text-xs bg-slate-800/50 border border-slate-700/50 rounded text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
      />
      <button
        onClick={handleSend}
        disabled={!input.trim()}
        className="p-1 hover:bg-indigo-500/20 rounded text-slate-400 hover:text-indigo-400 disabled:opacity-30 transition-colors"
        title="Send Input"
      >
        <Send className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

const XTERM_THEME = {
  background: '#0c0c0e',
  foreground: '#f8fafc',
  cursor: '#a5b4fc',
  cursorAccent: '#0c0c0e',
  selectionBackground: '#4338ca50',
  selectionForeground: '#ffffff',
  black: '#000000',
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#eab308',
  blue: '#3b82f6',
  magenta: '#d946ef',
  cyan: '#06b6d4',
  white: '#ffffff',
  brightBlack: '#71717a',
  brightRed: '#f87171',
  brightGreen: '#4ade80',
  brightYellow: '#fde047',
  brightBlue: '#60a5fa',
  brightMagenta: '#e879f9',
  brightCyan: '#22d3ee',
  brightWhite: '#ffffff',
};

export const TabbedTerminal: React.FC<TabbedTerminalProps> = ({ 
  onInput, 
  onResize, 
  className = "", 
  terminalInstanceRef 
}) => {
  // Tabs state
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'main', name: 'Shell', type: 'shell', status: 'running' }
  ]);
  const [activeTabId, setActiveTabId] = useState('main');
  const [, setProcesses] = useState<ManagedProcess[]>([]);
  const [showNewProcess, setShowNewProcess] = useState(false);
  const [newCommand, setNewCommand] = useState('');

  // Tab ativa (declarado cedo para uso nos useEffects)
  const activeTab = tabs.find(t => t.id === activeTabId);

  // Terminal refs
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalsRef = useRef<Map<string, XTerm>>(new Map());
  const fitAddonsRef = useRef<Map<string, FitAddon>>(new Map());
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const processOutputsRef = useRef<Map<string, string[]>>(new Map());

  // Criar terminal xterm
  const createTerminal = useCallback((tabId: string, container: HTMLElement) => {
    // Verificar se o container tem dimensões válidas
    if (!container || container.clientWidth === 0 || container.clientHeight === 0) {
      console.warn(`[TabbedTerminal] Container has no dimensions for tab ${tabId}, deferring creation`);
      return null;
    }
    
    const term = new XTerm({
      theme: XTERM_THEME,
      fontSize: 13,
      fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      allowProposedApi: true,
      convertEol: true,
      drawBoldTextInBrightColors: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    
    // Abrir terminal com proteção contra erros de dimensão
    try {
      term.open(container);
    } catch (e) {
      console.warn(`[TabbedTerminal] Failed to open terminal for tab ${tabId}:`, e);
      return null;
    }
    
    terminalsRef.current.set(tabId, term);
    fitAddonsRef.current.set(tabId, fitAddon);

    // Fit after a delay with error protection
    setTimeout(() => {
      try {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          fitAddon.fit();
        }
      } catch (e) {
        console.warn(`[TabbedTerminal] Fit failed for tab ${tabId}:`, e);
      }
    }, 150);

    return term;
  }, []);

  // Conectar ao WebSocket para receber output dos processos
  useEffect(() => {
    if (!isLocalMode) return;

    socketRef.current = io(API_URL, { transports: ['websocket'] });

    socketRef.current.on('process:output', ({ id, data }: { id: string; data: string }) => {
      // Encontrar tab do processo
      const tab = tabs.find(t => t.processId === id);
      if (tab) {
        const term = terminalsRef.current.get(tab.id);
        if (term) {
          term.write(data);
        }
      }
      
      // Guardar output
      const outputs = processOutputsRef.current.get(id) || [];
      outputs.push(data);
      if (outputs.length > 1000) outputs.shift();
      processOutputsRef.current.set(id, outputs);
    });

    socketRef.current.on('process:exit', ({ id, code }: { id: string; code: number }) => {
      setTabs(prev => prev.map(t => 
        t.processId === id ? { ...t, status: code === 0 ? 'stopped' : 'error' } : t
      ));
    });

    socketRef.current.on('process:port', ({ id, port }: { id: string; port: number }) => {
      setTabs(prev => prev.map(t => 
        t.processId === id ? { ...t, port } : t
      ));
    });

    // Carregar processos existentes
    loadProcesses();

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Carregar processos do backend
  const loadProcesses = async () => {
    try {
      const procs = await ProcessManagerService.listProcesses();
      setProcesses(procs);
      
      // Adicionar tabs para processos existentes
      procs.forEach(proc => {
        if (!tabs.find(t => t.processId === proc.id)) {
          setTabs(prev => [...prev, {
            id: `proc_${proc.id}`,
            name: proc.name,
            type: 'process',
            processId: proc.id,
            status: proc.status,
            port: proc.port
          }]);
        }
      });
    } catch (e) {
      console.error('Failed to load processes:', e);
    }
  };

  // Inicializar terminal principal
  useEffect(() => {
    if (!containerRef.current) return;

    const mainTerm = createTerminal('main', containerRef.current);
    terminalInstanceRef.current = mainTerm;

    // Welcome message
    if (isLocalMode) {
      mainTerm.writeln('\x1b[1;35m╔══════════════════════════════════════════════════╗\x1b[0m');
      mainTerm.writeln('\x1b[1;35m║  🖥️  Aether PowerShell - Real Terminal           ║\x1b[0m');
      mainTerm.writeln('\x1b[1;35m╚══════════════════════════════════════════════════╝\x1b[0m');
      mainTerm.writeln('\x1b[90mReal system access. Use tabs to manage processes.\x1b[0m');
      mainTerm.writeln('\x1b[90mShortcuts: Alt+1-9 (switch tabs) | Alt+T (new) | Alt+W (close)\x1b[0m');
      mainTerm.writeln('');
    } else {
      mainTerm.writeln('\x1b[1;34m✨ Aether Terminal\x1b[0m');
    }

    // Input handler
    if (onInput) {
      mainTerm.onData(data => onInput(data));
    }

    // Resize handler
    if (onResize) {
      mainTerm.onResize(size => onResize(size.cols, size.rows));
    }

    // ResizeObserver with error protection
    resizeObserverRef.current = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        const fitAddon = fitAddonsRef.current.get(activeTabId);
        const container = containerRef.current;
        if (fitAddon && container && container.clientWidth > 0 && container.clientHeight > 0) {
          try {
            fitAddon.fit();
          } catch (e) {
            // Silently ignore dimension errors during resize
          }
        }
      });
    });
    resizeObserverRef.current.observe(containerRef.current);

    return () => {
      resizeObserverRef.current?.disconnect();
      terminalsRef.current.forEach(term => term.dispose());
    };
  }, []);

  // Mostrar/esconder terminais quando tab muda
  useEffect(() => {
    // Esconder todos os terminais de processo
    tabs.forEach(tab => {
      if (tab.type === 'process') {
        const container = document.getElementById(`term_${tab.id}`);
        if (container) {
          container.style.display = tab.id === activeTabId ? 'block' : 'none';
        }
      }
    });
    
    // Mostrar/esconder terminal principal
    if (containerRef.current) {
      containerRef.current.style.display = activeTabId === 'main' ? 'block' : 'none';
    }
    
    // Fit o terminal ativo
    const fitAddon = fitAddonsRef.current.get(activeTabId);
    if (fitAddon) {
      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch (e) {}
      }, 50);
    }
    
    // Focar no terminal ativo
    const term = terminalsRef.current.get(activeTabId);
    if (term) {
      term.focus();
    }
  }, [activeTabId, tabs]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+1-9 para trocar de aba
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (tabs[index]) {
          e.preventDefault();
          setActiveTabId(tabs[index].id);
        }
      }
      
      // Alt+T para nova aba de processo
      if (e.altKey && e.key === 't') {
        e.preventDefault();
        setShowNewProcess(true);
      }
      
      // Alt+W para fechar aba atual (se for processo)
      if (e.altKey && e.key === 'w') {
        if (activeTab?.type === 'process') {
          e.preventDefault();
          closeTab(activeTab.id);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTab]);

  // Iniciar novo processo
  const startNewProcess = async () => {
    if (!newCommand.trim()) return;

    try {
      const result = await ProcessManagerService.startProcess(newCommand, {
        name: newCommand.split(' ').slice(0, 2).join(' ')
      });

      if (result.success && result.process) {
        const tabId = `proc_${result.process.id}`;
        
        // Adicionar tab
        setTabs(prev => [...prev, {
          id: tabId,
          name: result.process!.name,
          type: 'process',
          processId: result.process!.id,
          status: 'running',
          port: result.process!.port
        }]);

        // Criar terminal para o processo
        if (containerRef.current) {
          const procContainer = document.createElement('div');
          procContainer.className = 'absolute inset-0 p-2';
          procContainer.style.display = 'none';
          procContainer.id = `term_${tabId}`;
          containerRef.current.parentElement?.appendChild(procContainer);
          
          const term = createTerminal(tabId, procContainer);
          term.writeln(`\x1b[36m$ ${newCommand}\x1b[0m`);
          term.writeln('');
          
          // Permitir input direto no terminal do processo
          const processId = result.process.id;
          term.onData(data => {
            sendInputToProcess(processId, data);
          });
          
          // Carregar output existente
          const output = await ProcessManagerService.getProcessOutput(result.process.id, 100);
          if (output) {
            term.write(output);
          }
        }

        setActiveTabId(tabId);
        setNewCommand('');
        setShowNewProcess(false);
      }
    } catch (e) {
      console.error('Failed to start process:', e);
    }
  };

  // Parar processo
  const stopProcess = async (processId: string) => {
    await ProcessManagerService.stopProcess(processId);
    setTabs(prev => prev.map(t => 
      t.processId === processId ? { ...t, status: 'stopped' } : t
    ));
  };

  // Reiniciar processo
  const restartProcess = async (tab: Tab) => {
    if (!tab.processId) return;
    
    // Pegar o comando original
    const proc = await ProcessManagerService.getProcess(tab.processId);
    if (!proc) return;
    
    const command = proc.command;
    
    // Parar o processo atual
    await ProcessManagerService.stopProcess(tab.processId);
    
    // Aguardar um pouco
    await new Promise(r => setTimeout(r, 500));
    
    // Iniciar novamente
    const result = await ProcessManagerService.startProcess(command, { name: tab.name });
    
    if (result.success && result.process) {
      // Atualizar a tab com o novo processo
      setTabs(prev => prev.map(t => 
        t.id === tab.id 
          ? { ...t, processId: result.process!.id, status: 'running', port: result.process!.port }
          : t
      ));
      
      // Limpar e mostrar mensagem no terminal
      const term = terminalsRef.current.get(tab.id);
      if (term) {
        term.clear();
        term.writeln('\x1b[33m🔄 Process restarted\x1b[0m');
        term.writeln(`\x1b[36m$ ${command}\x1b[0m`);
        term.writeln('');
      }
    }
  };

  // Enviar input para processo (Ctrl+C, etc)
  const sendInputToProcess = async (processId: string, input: string) => {
    await ProcessManagerService.sendInput(processId, input);
  };

  // Enviar Ctrl+C para processo ativo
  const sendCtrlC = () => {
    if (activeTab?.type === 'process' && activeTab.processId && activeTab.status === 'running') {
      sendInputToProcess(activeTab.processId, '\x03');
      const term = terminalsRef.current.get(activeTab.id);
      if (term) {
        term.writeln('\x1b[33m^C\x1b[0m');
      }
    }
  };

  // Fechar tab
  const closeTab = async (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || tab.type === 'shell') return;

    // Parar processo se estiver rodando
    if (tab.processId && tab.status === 'running') {
      await ProcessManagerService.stopProcess(tab.processId);
    }

    // Remover terminal
    const term = terminalsRef.current.get(tabId);
    if (term) {
      term.dispose();
      terminalsRef.current.delete(tabId);
    }

    // Remover tab
    setTabs(prev => prev.filter(t => t.id !== tabId));
    
    // Voltar para shell principal
    if (activeTabId === tabId) {
      setActiveTabId('main');
    }
  };

  // Limpar terminal ativo
  const clearActiveTerminal = () => {
    const term = terminalsRef.current.get(activeTabId);
    if (term) {
      term.clear();
      term.writeln('\x1b[32m✓ Terminal cleared\x1b[0m');
    }
  };

  // Obter cor do status
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'running': return 'text-emerald-400';
      case 'stopped': return 'text-slate-400';
      case 'error': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#0c0c0e] ${className}`}>
      {/* Header com abas */}
      <div className="flex items-center bg-[#18181b] border-b border-slate-800 shrink-0">
        {/* Abas */}
        <div className="flex items-center flex-1 overflow-x-auto">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs border-r border-slate-800/50 hover:bg-white/5 transition-colors whitespace-nowrap cursor-pointer select-none ${
                activeTabId === tab.id 
                  ? 'bg-[#0c0c0e] text-white border-b-2 border-b-indigo-500' 
                  : 'text-slate-400'
              }`}
            >
              {tab.type === 'shell' ? (
                <TerminalSquare className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <Circle className={`w-2 h-2 fill-current ${getStatusColor(tab.status)}`} />
              )}
              <span className="max-w-[100px] truncate">{tab.name}</span>
              {tab.port && (
                <span className="text-[9px] px-1 py-0.5 bg-indigo-500/20 text-indigo-300 rounded">
                  :{tab.port}
                </span>
              )}
              {tab.type === 'process' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="p-0.5 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 px-2 shrink-0 border-l border-slate-800/50">
          {isLocalMode && (
            <button
              onClick={() => setShowNewProcess(!showNewProcess)}
              className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
              title="New Process"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          
          {activeTab?.type === 'process' && activeTab.status === 'running' && (
            <>
              <button
                onClick={sendCtrlC}
                className="p-1.5 hover:bg-yellow-500/20 rounded text-slate-400 hover:text-yellow-400 transition-colors"
                title="Send Ctrl+C (Interrupt)"
              >
                <Keyboard className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => activeTab.processId && stopProcess(activeTab.processId)}
                className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-colors"
                title="Stop Process"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          
          {activeTab?.type === 'process' && activeTab.status === 'stopped' && (
            <button
              onClick={() => restartProcess(activeTab)}
              className="p-1.5 hover:bg-green-500/20 rounded text-slate-400 hover:text-green-400 transition-colors"
              title="Restart Process"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
          
          {activeTab?.port && (
            <a
              href={`http://localhost:${activeTab.port}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-indigo-400 transition-colors"
              title={`Open localhost:${activeTab.port}`}
            >
              <Globe className="w-3.5 h-3.5" />
            </a>
          )}
          
          <button
            onClick={clearActiveTerminal}
            className="p-1.5 hover:bg-white/10 rounded text-slate-500 hover:text-red-400 transition-colors"
            title="Clear Terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={loadProcesses}
            className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
            title="Refresh Processes"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          
          {tabs.filter(t => t.type === 'process' && t.status === 'running').length > 0 && (
            <button
              onClick={async () => {
                await ProcessManagerService.stopAllProcesses();
                setTabs(prev => prev.map(t => 
                  t.type === 'process' ? { ...t, status: 'stopped' } : t
                ));
              }}
              className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-colors"
              title="Stop All Processes"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Formulário novo processo */}
      {showNewProcess && (
        <div className="flex items-center gap-2 p-2 bg-[#1a1a1d] border-b border-slate-800">
          <input
            type="text"
            value={newCommand}
            onChange={(e) => setNewCommand(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && startNewProcess()}
            placeholder="Command (e.g., npm run dev)"
            className="flex-1 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          <button
            onClick={startNewProcess}
            disabled={!newCommand.trim()}
            className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded text-white transition-colors"
          >
            Start
          </button>
          <button
            onClick={() => setShowNewProcess(false)}
            className="p-1.5 hover:bg-white/10 rounded text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Info do processo ativo */}
      {activeTab?.type === 'process' && (
        <div className="flex items-center justify-between px-3 py-1 bg-[#1a1a1d] border-b border-slate-800/50 text-[11px]">
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 ${getStatusColor(activeTab.status)}`}>
              <Circle className={`w-1.5 h-1.5 fill-current`} />
              {activeTab.status}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 font-mono">{activeTab.processId}</span>
          </div>
          {activeTab.port && (
            <span className="text-indigo-400">
              http://localhost:{activeTab.port}
            </span>
          )}
        </div>
      )}

      {/* Input para enviar comandos ao processo */}
      {activeTab?.type === 'process' && activeTab.status === 'running' && (
        <ProcessInput 
          processId={activeTab.processId!}
          onSend={sendInputToProcess}
        />
      )}

      {/* Container do terminal */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          ref={containerRef} 
          className={`absolute inset-0 p-2 ${activeTabId === 'main' ? '' : 'hidden'}`}
        />
        {/* Containers dos processos são criados dinamicamente */}
      </div>
    </div>
  );
};

export default TabbedTerminal;
