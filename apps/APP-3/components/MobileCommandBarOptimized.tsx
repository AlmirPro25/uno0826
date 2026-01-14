// components/MobileCommandBarOptimized.tsx
import React, { useState } from 'react';

interface MobileCommandBarOptimizedProps {
  onSend: (prompt: string) => void;
  isLoading: boolean;
  statusMessage: string;
  onCopyCode: () => void;
  onResetProject: () => void;
  onFinalizeInteraction: () => void;
  canFinalize: boolean;
}

export const MobileCommandBarOptimized: React.FC<MobileCommandBarOptimizedProps> = ({
  onSend,
  isLoading,
  statusMessage,
  onCopyCode,
  onResetProject,
  onFinalizeInteraction,
  canFinalize,
}) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSend(prompt.trim());
      setPrompt('');
    }
  };

  const quickActions = [
    { emoji: '🏢', text: 'Empresa', prompt: 'Crie um site de empresa moderno' },
    { emoji: '🛒', text: 'Loja', prompt: 'Crie um e-commerce completo' },
    { emoji: '📊', text: 'Admin', prompt: 'Crie um dashboard admin' },
    { emoji: '🎮', text: 'Game', prompt: 'Crie um jogo simples' },
    { emoji: '📱', text: 'App', prompt: 'Crie um app mobile' },
    { emoji: '🎨', text: 'Blog', prompt: 'Crie um blog moderno' },
  ];

  return (
    <div className="bg-slate-800 h-full flex flex-col">
      {/* Status Message */}
      {statusMessage && (
        <div className="px-2 py-1 bg-slate-700/50 border-b border-slate-600">
          <div className="flex items-center gap-1">
            {isLoading && (
              <svg className="animate-spin h-3 w-3 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span className="text-xs text-slate-300 truncate">{statusMessage}</span>
          </div>
        </div>
      )}

      {/* Input Compacto */}
      <form onSubmit={handleSubmit} className="p-2">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="O que você quer criar?"
            className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white rounded text-xs font-medium transition-colors"
          >
            {isLoading ? (
              <i className="fa-solid fa-spinner animate-spin"></i>
            ) : (
              <i className="fa-solid fa-paper-plane"></i>
            )}
          </button>
        </div>

        {/* Quick Actions - Uma linha só */}
        <div className="flex gap-1 overflow-x-auto">
          {quickActions.slice(0, 4).map((action, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setPrompt(action.prompt)}
              className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs transition-colors"
            >
              <span>{action.emoji}</span>
              <span>{action.text}</span>
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};