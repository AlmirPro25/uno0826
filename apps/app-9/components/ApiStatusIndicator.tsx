import React, { useState, useEffect } from 'react';
import { isApiAvailable } from '../services/fallbackService';

export const ApiStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkApiStatus = async () => {
    setStatus('checking');
    try {
      const available = await isApiAvailable();
      setStatus(available ? 'online' : 'offline');
      setLastCheck(new Date());
    } catch {
      setStatus('offline');
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkApiStatus();
    
    // Verificar status a cada 5 minutos
    const interval = setInterval(checkApiStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'checking': return 'bg-yellow-500 animate-pulse';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online': return 'API Online';
      case 'offline': return 'API Offline';
      case 'checking': return 'Verificando...';
      default: return 'Desconhecido';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'online': return 'Gemini API está funcionando normalmente';
      case 'offline': return 'API indisponível. Modo offline ativo com exemplos pré-configurados.';
      case 'checking': return 'Verificando conectividade com a API...';
      default: return 'Status da API desconhecido';
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
      <span className="text-gray-400">{getStatusText()}</span>
      <button
        onClick={checkApiStatus}
        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        title={`${getStatusMessage()}\nÚltima verificação: ${lastCheck.toLocaleTimeString()}\nClique para verificar novamente`}
      >
        🔄
      </button>
    </div>
  );
};