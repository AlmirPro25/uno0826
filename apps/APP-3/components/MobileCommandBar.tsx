// components/MobileCommandBar.tsx
import React, { useState } from 'react';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface MobileCommandBarProps {
  onSend: (prompt: string) => void;
  isLoading: boolean;
  statusMessage: string;
  onCopyCode: () => void;
  onResetProject: () => void;
  onFinalizeInteraction: () => void;
  canFinalize: boolean;
}

export const MobileCommandBar: React.FC<MobileCommandBarProps> = ({
  onSend,
  isLoading,
  statusMessage,
  onCopyCode,
  onResetProject,
  onFinalizeInteraction,
  canFinalize,
}) => {
  const { isMobile, screenSize } = useMobileDetection();
  const [prompt, setPrompt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSend(prompt.trim());
      setPrompt('');
    }
  };

  if (!isMobile) {
    return null; // Usar CommandBar normal em desktop
  }

  return (
    <div className="bg-slate-800 border-b border-slate-700">
      {/* Status Message */}
      {statusMessage && (
        <div className="px-3 py-2 bg-slate-700/50 border-b border-slate-600">
          <div className="flex items-center gap-2">
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

      {/* Main Input */}
      <form onSubmit={handleSubmit} className="p-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Descreva o que você quer criar..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 placeholder-slate-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={isLoading}
            />
            
            {/* Character count for mobile */}
            <div className="absolute bottom-1 right-1 text-xs text-slate-500">
              {prompt.length}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {isLoading ? (
                <i className="fa-solid fa-spinner animate-spin"></i>
              ) : (
                <i className="fa-solid fa-paper-plane"></i>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <i className="fa-solid fa-cog"></i>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-2 flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setPrompt('Crie um site de empresa moderno')}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs transition-colors"
          >
            Site Empresa
          </button>
          <button
            type="button"
            onClick={() => setPrompt('Crie um e-commerce completo')}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs transition-colors"
          >
            E-commerce
          </button>
          <button
            type="button"
            onClick={() => setPrompt('Crie um dashboard admin')}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs transition-colors"
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setPrompt('Crie um jogo simples')}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs transition-colors"
          >
            Jogo
          </button>
        </div>
      </form>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="border-t border-slate-700 bg-slate-800/50 p-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onCopyCode}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md text-xs transition-colors"
            >
              <i className="fa-solid fa-copy"></i>
              Copiar
            </button>
            
            <button
              onClick={onResetProject}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-700 hover:bg-red-600 text-white rounded-md text-xs transition-colors"
            >
              <i className="fa-solid fa-refresh"></i>
              Reset
            </button>

            {canFinalize && (
              <button
                onClick={onFinalizeInteraction}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-green-700 hover:bg-green-600 text-white rounded-md text-xs transition-colors col-span-2"
              >
                <i className="fa-solid fa-check"></i>
                Finalizar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};