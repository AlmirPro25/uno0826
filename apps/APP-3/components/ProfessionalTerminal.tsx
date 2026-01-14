/**
 * ============================================
 * 🖥️ PROFESSIONAL TERMINAL - VS CODE LEVEL
 * ============================================
 * 
 * Terminal profissional com:
 * - Modo CLI e Agente unificados
 * - Streaming de output em tempo real
 * - Gerenciamento de processos
 * - Autocomplete inteligente
 * - Histórico persistente
 * - Múltiplas abas de terminal
 */

import * as React from 'react';
import { kiroUnifiedAgent, StreamEvent, ToolExecution, AgentSession } from '@/services/KiroUnifiedAgent';

const { useState, useRef, useEffect, useCallback, useMemo } = React;

// ============================================
// TIPOS
// ============================================

interface TerminalTab {
  id: string;
  name: string;
  sessionId: string;
  lines: TerminalLine[];
  isActive: boolean;
}

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'info' | 'tool' | 'system';
  content: string;
  timestamp: number;
  toolName?: string;
  isStreaming?: boolean;
}

interface ProcessStatus {
  id: string;
  name: string;
  command: string;
  status: 'running' | 'stopped' | 'error';
  port?: number;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const ProfessionalTerminal: React.FC<{
  projectFiles?: string[];
  activeFile?: string;
  onFileSelect?: (path: string) => void;
  className?: string;
}> = ({ projectFiles = [], activeFile, onFileSelect, className = '' }) => {
  
  // Estados principais
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [processes, setProcesses] = useState<ProcessStatus[]>([]);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const streamingLineRef = useRef<string>('');

  // Tab ativa
  const activeTab = useMemo(() => 
    tabs.find(t => t.id === activeTabId), 
    [tabs, activeTabId]
  );

  // ============================================
  // INICIALIZAÇÃO
  // ============================================

  useEffect(() => {
    // Criar primeira tab
    if (tabs.length === 0) {
      createNewTab();
    }
    
    // Verificar backend
    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 10000);
    
    // Carregar histórico do localStorage
    const savedHistory = localStorage.getItem('kiro_terminal_history');
    if (savedHistory) {
      setCommandHistory(JSON.parse(savedHistory));
    }

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [activeTab?.lines]);

  // ============================================
  // FUNÇÕES DE TAB
  // ============================================

  const createNewTab = useCallback(() => {
    const sessionId = kiroUnifiedAgent.createSession({
      workingDirectory: '.',
      openFiles: projectFiles,
      activeFile
    });

    const newTab: TerminalTab = {
      id: `tab_${Date.now()}`,
      name: `Terminal ${tabs.length + 1}`,
      sessionId,
      lines: [{
        id: 'welcome',
        type: 'system',
        content: '🚀 KIRO Professional Terminal - Digite "help" ou use linguagem natural',
        timestamp: Date.now()
      }],
      isActive: true
    };

    setTabs(prev => [...prev.map(t => ({ ...t, isActive: false })), newTab]);
    setActiveTabId(newTab.id);
  }, [tabs.length, projectFiles, activeFile]);

  const closeTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      kiroUnifiedAgent.deleteSession(tab.sessionId);
    }

    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (newTabs.length === 0) {
        // Criar nova tab se fechar a última
        setTimeout(createNewTab, 0);
        return [];
      }
      if (activeTabId === tabId) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
      return newTabs;
    });
  }, [tabs, activeTabId, createNewTab]);

  const selectTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
    setTabs(prev => prev.map(t => ({ ...t, isActive: t.id === tabId })));
  }, []);

  // ============================================
  // FUNÇÕES DE LINHA
  // ============================================

  const addLine = useCallback((
    type: TerminalLine['type'], 
    content: string, 
    extra?: Partial<TerminalLine>
  ) => {
    if (!activeTabId) return;

    const newLine: TerminalLine = {
      id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      content,
      timestamp: Date.now(),
      ...extra
    };

    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, lines: [...tab.lines, newLine] }
        : tab
    ));
  }, [activeTabId]);

  const updateLastLine = useCallback((content: string) => {
    if (!activeTabId) return;

    setTabs(prev => prev.map(tab => {
      if (tab.id !== activeTabId) return tab;
      const lines = [...tab.lines];
      if (lines.length > 0) {
        lines[lines.length - 1] = { ...lines[lines.length - 1], content };
      }
      return { ...tab, lines };
    }));
  }, [activeTabId]);

  // ============================================
  // VERIFICAÇÃO DE BACKEND
  // ============================================

  const checkBackendStatus = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/health');
      setBackendStatus(res.ok ? 'online' : 'offline');
    } catch {
      setBackendStatus('offline');
    }
  };

  // ============================================
  // PROCESSAMENTO DE COMANDOS
  // ============================================

  const processInput = async () => {
    if (!input.trim() || isProcessing || !activeTab) return;

    const userInput = input.trim();
    setInput('');
    setShowSuggestions(false);
    setIsProcessing(true);

    // Adiciona ao histórico
    const newHistory = [...commandHistory, userInput].slice(-100);
    setCommandHistory(newHistory);
    localStorage.setItem('kiro_terminal_history', JSON.stringify(newHistory));
    setHistoryIndex(-1);

    // Mostra input do usuário
    addLine('input', `❯ ${userInput}`);

    // Comandos especiais
    if (await handleSpecialCommand(userInput)) {
      setIsProcessing(false);
      return;
    }

    // Processa com o agente
    try {
      addLine('info', '🧠 Processando...');

      await kiroUnifiedAgent.processMessage(
        userInput,
        activeTab.sessionId,
        handleStreamEvent
      );

    } catch (error: any) {
      addLine('error', `❌ ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================
  // HANDLER DE STREAMING
  // ============================================

  const handleStreamEvent = useCallback((event: StreamEvent) => {
    switch (event.type) {
      case 'tool_start':
        addLine('tool', `🔧 ${event.tool}...`, { toolName: event.tool });
        break;

      case 'tool_end':
        if (event.result?.success) {
          const data = event.result.data;
          if (typeof data === 'string') {
            addLine('output', data.substring(0, 2000));
          } else if (data?.stdout) {
            addLine('output', data.stdout.substring(0, 2000));
          }
        } else if (event.result?.error) {
          addLine('error', `❌ ${event.result.error}`);
        }
        break;

      case 'text':
        // Remove a linha "Processando..." e adiciona resposta
        setTabs(prev => prev.map(tab => {
          if (tab.id !== activeTabId) return tab;
          const lines = tab.lines.filter(l => l.content !== '🧠 Processando...');
          return { 
            ...tab, 
            lines: [...lines, {
              id: `line_${Date.now()}`,
              type: 'output' as const,
              content: event.content || '',
              timestamp: Date.now()
            }]
          };
        }));
        break;

      case 'error':
        addLine('error', `❌ ${event.error}`);
        break;

      case 'done':
        // Streaming completo
        break;
    }
  }, [activeTabId, addLine]);

  // ============================================
  // COMANDOS ESPECIAIS
  // ============================================

  const handleSpecialCommand = async (cmd: string): Promise<boolean> => {
    const lower = cmd.toLowerCase().trim();

    // Clear
    if (lower === 'clear' || lower === 'cls') {
      setTabs(prev => prev.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, lines: [{
              id: 'cleared',
              type: 'system',
              content: '🧹 Terminal limpo',
              timestamp: Date.now()
            }]}
          : tab
      ));
      kiroUnifiedAgent.clearSession(activeTab?.sessionId);
      return true;
    }

    // Help
    if (lower === 'help' || lower === '?') {
      showHelp();
      return true;
    }

    // Exit
    if (lower === 'exit' || lower === 'quit') {
      if (tabs.length > 1) {
        closeTab(activeTabId!);
      } else {
        addLine('info', '💡 Use o botão X para fechar o terminal');
      }
      return true;
    }

    // New tab
    if (lower === 'new' || lower === 'newtab') {
      createNewTab();
      return true;
    }

    // Processes
    if (lower === 'ps' || lower === 'processes') {
      showProcesses();
      return true;
    }

    // History
    if (lower === 'history') {
      addLine('info', '📜 Histórico de comandos:');
      commandHistory.slice(-20).forEach((cmd, i) => {
        addLine('output', `  ${i + 1}. ${cmd}`);
      });
      return true;
    }

    return false;
  };

  const showHelp = () => {
    addLine('info', `
╔══════════════════════════════════════════════════════════════╗
║              🚀 KIRO PROFESSIONAL TERMINAL                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  💬 LINGUAGEM NATURAL (recomendado):                         ║
║     "liste os arquivos da pasta src"                         ║
║     "busque por useState nos arquivos tsx"                   ║
║     "crie um componente Button em components/"               ║
║     "execute npm install axios"                              ║
║     "mostre o git status"                                    ║
║     "inicie o servidor de desenvolvimento"                   ║
║                                                              ║
║  ⌨️  COMANDOS ESPECIAIS:                                      ║
║     clear/cls  - Limpar terminal                             ║
║     help/?     - Esta ajuda                                  ║
║     new        - Nova aba de terminal                        ║
║     ps         - Listar processos em background              ║
║     history    - Histórico de comandos                       ║
║     exit       - Fechar aba atual                            ║
║                                                              ║
║  ⚡ ATALHOS:                                                  ║
║     ↑/↓        - Navegar histórico                           ║
║     Tab        - Autocomplete                                ║
║     Ctrl+L     - Limpar                                      ║
║     Ctrl+C     - Cancelar                                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
  };

  const showProcesses = () => {
    const procs = kiroUnifiedAgent.getRunningProcesses();
    if (procs.length === 0) {
      addLine('info', '📭 Nenhum processo em background');
      return;
    }

    addLine('info', '📊 Processos em background:');
    procs.forEach(p => {
      const status = p.status === 'running' ? '🟢' : p.status === 'stopped' ? '🔴' : '🟡';
      addLine('output', `  ${status} [${p.id}] ${p.command}`);
    });
  };

  // ============================================
  // AUTOCOMPLETE E SUGESTÕES
  // ============================================

  const updateSuggestions = useCallback((value: string) => {
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const lower = value.toLowerCase();
    const allSuggestions: string[] = [];

    // Sugestões de comandos comuns
    const commonCommands = [
      'npm install', 'npm run dev', 'npm run build', 'npm test',
      'git status', 'git add .', 'git commit -m ""', 'git push',
      'liste os arquivos', 'busque por', 'crie um arquivo',
      'execute', 'mostre o conteúdo de', 'modifique o arquivo'
    ];

    commonCommands.forEach(cmd => {
      if (cmd.toLowerCase().includes(lower)) {
        allSuggestions.push(cmd);
      }
    });

    // Sugestões do histórico
    commandHistory.forEach(cmd => {
      if (cmd.toLowerCase().includes(lower) && !allSuggestions.includes(cmd)) {
        allSuggestions.push(cmd);
      }
    });

    // Sugestões de arquivos
    projectFiles.forEach(file => {
      if (file.toLowerCase().includes(lower)) {
        allSuggestions.push(`leia ${file}`);
      }
    });

    setSuggestions(allSuggestions.slice(0, 8));
    setShowSuggestions(allSuggestions.length > 0);
  }, [commandHistory, projectFiles]);

  // ============================================
  // HANDLERS DE INPUT
  // ============================================

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter - executar
    if (e.key === 'Enter') {
      e.preventDefault();
      processInput();
      return;
    }

    // Seta para cima - histórico anterior
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
      return;
    }

    // Seta para baixo - histórico próximo
    if (e.key === 'ArrowDown') {
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
      return;
    }

    // Tab - autocomplete
    if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setInput(suggestions[0]);
        setShowSuggestions(false);
      }
      return;
    }

    // Escape - fechar sugestões
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      return;
    }

    // Ctrl+L - limpar
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      handleSpecialCommand('clear');
      return;
    }

    // Ctrl+C - cancelar
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      if (isProcessing) {
        setIsProcessing(false);
        addLine('info', '^C');
      }
      return;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    updateSuggestions(value);
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const getLineStyle = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return 'text-sky-400 font-semibold';
      case 'output': return 'text-slate-300';
      case 'error': return 'text-red-400';
      case 'info': return 'text-blue-400';
      case 'tool': return 'text-purple-400';
      case 'system': return 'text-emerald-400';
      default: return 'text-slate-300';
    }
  };

  const getLineIcon = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return '❯';
      case 'error': return '✗';
      case 'info': return 'ℹ';
      case 'tool': return '⚙';
      case 'system': return '★';
      default: return '';
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={`flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden ${className}`}>
      
      {/* Header com Tabs */}
      <div className="flex-shrink-0 flex items-center bg-slate-800 border-b border-slate-700">
        {/* Tabs */}
        <div className="flex-1 flex items-center overflow-x-auto scrollbar-none">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`group flex items-center gap-2 px-3 py-2 border-r border-slate-700 cursor-pointer transition-colors ${
                tab.id === activeTabId 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-400 hover:bg-slate-700/50'
              }`}
              onClick={() => selectTab(tab.id)}
            >
              <i className="fa-solid fa-terminal text-xs text-emerald-400"></i>
              <span className="text-xs font-medium whitespace-nowrap">{tab.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
              >
                <i className="fa-solid fa-times text-xs"></i>
              </button>
            </div>
          ))}
          
          {/* Botão Nova Tab */}
          <button
            onClick={createNewTab}
            className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            title="Nova aba"
          >
            <i className="fa-solid fa-plus text-xs"></i>
          </button>
        </div>

        {/* Status e Controles */}
        <div className="flex items-center gap-2 px-3">
          {/* Status do Backend */}
          <div className={`flex items-center gap-1.5 text-xs ${
            backendStatus === 'online' ? 'text-green-400' :
            backendStatus === 'offline' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              backendStatus === 'online' ? 'bg-green-400' :
              backendStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
            }`}></div>
            <span>{backendStatus === 'online' ? 'Online' : backendStatus === 'offline' ? 'Offline' : '...'}</span>
          </div>

          {/* Processos */}
          {processes.length > 0 && (
            <button
              onClick={showProcesses}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600/20 text-purple-400 rounded hover:bg-purple-600/30 transition-colors"
            >
              <i className="fa-solid fa-microchip"></i>
              <span>{processes.length}</span>
            </button>
          )}
        </div>
      </div>

      {/* Output Area */}
      <div 
        ref={outputRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent"
        onClick={() => inputRef.current?.focus()}
      >
        {activeTab?.lines.map(line => (
          <div 
            key={line.id} 
            className={`${getLineStyle(line.type)} flex items-start gap-2 leading-relaxed`}
          >
            {getLineIcon(line.type) && (
              <span className="flex-shrink-0 w-4 text-center opacity-70">
                {getLineIcon(line.type)}
              </span>
            )}
            <pre className="flex-1 whitespace-pre-wrap break-words font-mono m-0">
              {line.content}
            </pre>
          </div>
        ))}

        {/* Indicador de processamento */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-yellow-400">
            <i className="fa-solid fa-spinner animate-spin"></i>
            <span>Processando...</span>
          </div>
        )}
      </div>

      {/* Sugestões */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="flex-shrink-0 border-t border-slate-700 bg-slate-800/90 backdrop-blur">
          <div className="px-4 py-2">
            <div className="text-xs text-slate-500 mb-1">
              💡 Sugestões (Tab para completar)
            </div>
            <div className="flex flex-wrap gap-1">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(suggestion);
                    setShowSuggestions(false);
                    inputRef.current?.focus();
                  }}
                  className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                >
                  {suggestion.length > 40 ? suggestion.substring(0, 40) + '...' : suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-slate-800 border-t border-slate-700">
        <span className="text-emerald-400 font-bold">❯</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Digite um comando ou use linguagem natural..."
          className="flex-1 bg-transparent text-slate-200 font-mono text-sm focus:outline-none placeholder-slate-500"
          disabled={isProcessing}
          autoFocus
        />
        <button
          onClick={processInput}
          disabled={!input.trim() || isProcessing}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded transition-colors text-sm"
        >
          {isProcessing ? (
            <i className="fa-solid fa-spinner animate-spin"></i>
          ) : (
            <i className="fa-solid fa-paper-plane"></i>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProfessionalTerminal;
