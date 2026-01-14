/**
 * ============================================
 * 📦 EXEMPLO: INTEGRAÇÃO TERMINAL NO CHATVIEW
 * ============================================
 * 
 * Mostra como integrar o terminal profissional
 * no ChatView existente.
 */

import * as React from 'react';
import { UnifiedTerminalPanel } from '@/components/UnifiedTerminalPanel';

const { useState } = React;

/**
 * Exemplo de ChatView com Terminal Integrado
 */
export const ChatViewWithTerminal: React.FC<{
  projectFiles: Array<{ path: string; content: string }>;
  activeFile: string | null;
  onSelectFile: (path: string) => void;
}> = ({ projectFiles, activeFile, onSelectFile }) => {
  
  const [showTerminal, setShowTerminal] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(35); // % da altura

  return (
    <div className="h-full flex flex-col bg-slate-900">
      
      {/* Área Principal (Editor/Chat) */}
      <div 
        className="flex-1 overflow-hidden"
        style={{ height: showTerminal ? `${100 - terminalHeight}%` : '100%' }}
      >
        {/* Seu conteúdo existente aqui */}
        <div className="h-full p-4 text-slate-300">
          <h2 className="text-lg font-semibold mb-2">Editor / Chat</h2>
          <p>Arquivo ativo: {activeFile || 'nenhum'}</p>
          <p>Total de arquivos: {projectFiles.length}</p>
        </div>
      </div>

      {/* Barra de Toggle do Terminal */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-1 bg-slate-800 border-t border-slate-700">
        <button
          onClick={() => setShowTerminal(!showTerminal)}
          className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
        >
          <i className={`fa-solid fa-chevron-${showTerminal ? 'down' : 'up'}`}></i>
          <i className="fa-solid fa-terminal text-emerald-400"></i>
          <span>Terminal</span>
        </button>
        
        {showTerminal && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTerminalHeight(Math.max(20, terminalHeight - 10))}
              className="px-2 py-0.5 text-xs text-slate-400 hover:text-white"
              title="Diminuir"
            >
              <i className="fa-solid fa-minus"></i>
            </button>
            <span className="text-xs text-slate-500">{terminalHeight}%</span>
            <button
              onClick={() => setTerminalHeight(Math.min(70, terminalHeight + 10))}
              className="px-2 py-0.5 text-xs text-slate-400 hover:text-white"
              title="Aumentar"
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
        )}
      </div>

      {/* Terminal */}
      {showTerminal && (
        <div 
          className="flex-shrink-0 border-t border-slate-700"
          style={{ height: `${terminalHeight}%` }}
        >
          <UnifiedTerminalPanel
            className="h-full rounded-none border-0"
            projectFiles={projectFiles.map(f => f.path)}
            activeFile={activeFile || undefined}
            onFileSelect={onSelectFile}
            showQuickActions={true}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Exemplo de uso standalone
 */
export const TerminalStandalone: React.FC = () => {
  return (
    <div className="h-screen bg-slate-900 p-4">
      <UnifiedTerminalPanel 
        className="h-full"
        showQuickActions={true}
        initialCwd="."
      />
    </div>
  );
};

/**
 * Exemplo com layout split (Editor + Terminal lado a lado)
 */
export const SplitLayout: React.FC = () => {
  return (
    <div className="h-screen flex bg-slate-900">
      {/* Editor */}
      <div className="flex-1 border-r border-slate-700 p-4">
        <h2 className="text-slate-300">Editor</h2>
      </div>
      
      {/* Terminal */}
      <div className="w-1/2">
        <UnifiedTerminalPanel className="h-full rounded-none border-0" />
      </div>
    </div>
  );
};

export default ChatViewWithTerminal;
