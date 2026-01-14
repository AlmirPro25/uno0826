/**
 * ============================================
 * 🎯 UNIFIED TERMINAL PANEL
 * ============================================
 * 
 * Painel de terminal completo que integra:
 * - Terminal com WebSocket e Agente IA
 * - File Explorer mini
 * - Quick Actions
 * - Status de processos
 * 
 * Pronto para usar no ChatView ou qualquer lugar.
 */

import * as React from 'react';
import { useUnifiedTerminal } from '@/hooks/useUnifiedTerminal';

const { useState, useRef, useEffect, useCallback } = React;

// ============================================
// TIPOS
// ============================================

interface UnifiedTerminalPanelProps {
  className?: string;
  projectFiles?: string[];
  activeFile?: string;
  onFileSelect?: (path: string) => void;
  initialCwd?: string;
  showQuickActions?: boolean;
  showFileExplorer?: boolean;
}

// ============================================
// QUICK ACTIONS
// ============================================

const QUICK_ACTIONS = [
  { icon: '📂', label: 'Listar', command: 'liste os arquivos do diretório atual' },
  { icon: '🔍', label: 'Buscar', command: 'busque por ' },
  { icon: '📊', label: 'Git Status', command: 'mostre o git status' },
  { icon: '📦', label: 'NPM Install', command: 'execute npm install' },
  { icon: '🏗️', label: 'Build', command: 'execute npm run build' },
  { icon: '🧪', label: 'Test', command: 'execute npm test' },
];

// ============================================
// COMPONENTE
// ============================================

export const UnifiedTerminalPanel: React.FC<UnifiedTerminalPanelProps> = ({
  className = '',
  projectFiles = [],
  activeFile,
  onFileSelect,
  initialCwd = '.',
  showQuickActions = true,
  showFileExplorer = false
}) => {
  // Hook do terminal
  const terminal = useUnifiedTerminal({ initialCwd, autoConnect: true });
  
  // Estados locais
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showActions, setShowActions] = useState(false);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [terminal.lines]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSubmit = () => {
    if (!input.trim()) return;
    terminal.execute(input);
    setInput('');
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (terminal.commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? terminal.commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(terminal.commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= terminal.commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(terminal.commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      terminal.clearLines();
    }
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    if (action.command.endsWith(' ')) {
      setInput(action.command);
      inputRef.current?.focus();
    } else {
      terminal.execute(action.command);
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const getLineStyle = (type: string) => {
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

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={`flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden ${className}`}>
      
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-terminal text-emerald-400"></i>
          <span className="text-sm font-semibold text-slate-200">Terminal Unificado</span>
          
          {/* Mode Toggle */}
          <div className="flex items-center gap-0.5 bg-slate-700 rounded p-0.5 ml-2">
            <button
              onClick={() => terminal.setMode('agent')}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                terminal.mode === 'agent' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🤖 IA
            </button>
            <button
              onClick={() => terminal.setMode('websocket')}
              disabled={!terminal.isConnected}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                terminal.mode === 'websocket' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              } ${!terminal.isConnected ? 'opacity-50' : ''}`}
            >
              ⚡ WS
            </button>
          </div>

          {/* Status */}
          <div className={`flex items-center gap-1 text-xs ml-2 ${
            terminal.isConnected ? 'text-green-400' : 'text-yellow-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              terminal.isConnected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'
            }`}></div>
            <span>{terminal.isConnected ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showQuickActions && (
            <button
              onClick={() => setShowActions(!showActions)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                showActions ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <i className="fa-solid fa-bolt mr-1"></i>
              Actions
            </button>
          )}
          <button
            onClick={() => terminal.clearLines()}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded"
            title="Limpar"
          >
            <i className="fa-solid fa-broom"></i>
          </button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      {showQuickActions && showActions && (
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-slate-800/50 border-b border-slate-700 overflow-x-auto">
          {QUICK_ACTIONS.map((action, i) => (
            <button
              key={i}
              onClick={() => handleQuickAction(action)}
              disabled={terminal.isExecuting}
              className="flex-shrink-0 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 rounded transition-colors flex items-center gap-1"
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Output Area */}
      <div 
        ref={outputRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-sm space-y-0.5 scrollbar-thin scrollbar-thumb-slate-600"
        onClick={() => inputRef.current?.focus()}
      >
        {terminal.lines.map(line => (
          <div key={line.id} className={`${getLineStyle(line.type)} leading-relaxed`}>
            <pre className="whitespace-pre-wrap break-words m-0 font-mono">{line.content}</pre>
          </div>
        ))}
        
        {terminal.isExecuting && (
          <div className="flex items-center gap-2 text-yellow-400 mt-1">
            <i className="fa-solid fa-spinner animate-spin text-xs"></i>
            <span className="text-xs">Processando...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-slate-800 border-t border-slate-700">
        <span className={terminal.mode === 'agent' ? 'text-emerald-400' : 'text-purple-400'}>
          {terminal.mode === 'agent' ? '🤖' : '⚡'}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={terminal.mode === 'agent' 
            ? 'Digite em linguagem natural...' 
            : 'Digite um comando...'}
          className="flex-1 bg-transparent text-slate-200 font-mono text-sm focus:outline-none placeholder-slate-500"
          disabled={terminal.isExecuting}
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || terminal.isExecuting}
          className={`px-2.5 py-1 text-white rounded transition-colors text-sm disabled:bg-slate-600 disabled:cursor-not-allowed ${
            terminal.mode === 'agent' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-purple-600 hover:bg-purple-500'
          }`}
        >
          {terminal.isExecuting ? (
            <i className="fa-solid fa-spinner animate-spin"></i>
          ) : (
            <i className="fa-solid fa-paper-plane"></i>
          )}
        </button>
      </div>
    </div>
  );
};

export default UnifiedTerminalPanel;
