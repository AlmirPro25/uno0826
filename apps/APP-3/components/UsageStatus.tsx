// components/UsageStatus.tsx
// Componente para mostrar status de uso e API Key

import React, { useState, useEffect } from 'react';
import { ApiKeyManager } from '../services/ApiKeyManager';

interface UsageStatusProps {
  onOpenApiKeyModal: () => void;
}

export const UsageStatus: React.FC<UsageStatusProps> = ({ onOpenApiKeyModal }) => {
  const [stats, setStats] = useState(ApiKeyManager.getStats());

  useEffect(() => {
    // Atualizar stats periodicamente
    const interval = setInterval(() => {
      setStats(ApiKeyManager.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (stats.hasUserKey) return 'text-green-600';
    if (stats.remainingUses <= 1) return 'text-red-600';
    if (stats.remainingUses <= 2) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getStatusIcon = () => {
    if (stats.hasUserKey) return '🔑';
    if (stats.remainingUses <= 1) return '⚠️';
    return '🆓';
  };

  const getStatusText = () => {
    if (stats.hasUserKey) return 'Chave própria ativa';
    if (stats.remainingUses === 0) return 'Limite atingido';
    return `${stats.remainingUses} gerações restantes`;
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <button
        onClick={onOpenApiKeyModal}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors hover:bg-slate-700 ${getStatusColor()}`}
        title="Clique para configurar sua API Key"
      >
        <span>{getStatusIcon()}</span>
        <span className="hidden sm:inline">{getStatusText()}</span>
      </button>
      
      {!stats.hasUserKey && stats.remainingUses <= 1 && (
        <button
          onClick={onOpenApiKeyModal}
          className="px-2 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors animate-pulse"
        >
          Adicionar Chave
        </button>
      )}
    </div>
  );
};