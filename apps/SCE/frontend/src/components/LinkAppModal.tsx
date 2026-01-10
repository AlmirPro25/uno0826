'use client';

import { useState } from 'react';

interface LinkAppModalProps {
  isOpen: boolean;
  appName: string;
  userEmail: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

/**
 * Modal de confirmação para vincular usuário a um novo app
 * 
 * Usado quando:
 * - Usuário já tem conta no PROST-QS
 * - Mas ainda não tem membership neste app
 * - Login retorna needs_link: true
 * 
 * Princípio: "Login unificado sem consentimento explícito é só um bug elegante."
 */
export function LinkAppModal({ isOpen, appName, userEmail, onConfirm, onCancel }: LinkAppModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err: any) {
      setError(err.message || 'Erro ao vincular conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white">
            Vincular conta
          </h2>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-zinc-300 mb-3">
            Você já tem uma conta no <span className="text-white font-medium">PROST-QS</span>.
          </p>
          <p className="text-zinc-400 text-sm mb-4">
            Deseja criar uma conta no <span className="text-white font-medium">{appName}</span> usando:
          </p>
          
          {/* Email badge */}
          <div className="bg-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-white text-sm font-mono">{userEmail}</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Vinculando...
              </>
            ) : (
              'Confirmar'
            )}
          </button>
        </div>

        {/* Footer note */}
        <p className="mt-4 text-xs text-zinc-500 text-center">
          Seus dados e configurações serão separados por app.
        </p>
      </div>
    </div>
  );
}
