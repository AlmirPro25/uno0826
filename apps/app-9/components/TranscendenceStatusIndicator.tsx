import React, { useState, useEffect } from 'react';
import { testGeminiConnection } from '../services/geminiService';

interface GeminiConnectionStatus {
  connected: boolean;
  model: string;
  error?: string;
}

export const TranscendenceStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<GeminiConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const connectionStatus = await testGeminiConnection();
      setStatus(connectionStatus);
    } catch (error) {
      setStatus({
        connected: false,
        model: 'error',
        error: 'Erro ao verificar conexão'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-lg">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        <span className="text-xs text-gray-300">Verificando...</span>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div 
      className={`flex items-center gap-2 px-3 py-1 rounded-lg cursor-pointer transition-colors ${
        status.connected 
          ? 'bg-green-900/30 hover:bg-green-900/50' 
          : 'bg-red-900/30 hover:bg-red-900/50'
      }`}
      onClick={checkConnection}
      title={status.connected 
        ? `Transcendência ativa (${status.model})` 
        : `Modo offline: ${status.error || 'API não disponível'}`
      }
    >
      <div className={`w-2 h-2 rounded-full ${
        status.connected ? 'bg-green-400' : 'bg-red-400'
      }`}></div>
      <span className="text-xs text-gray-300">
        {status.connected ? '🧠 AGI' : '🤖 Offline'}
      </span>
    </div>
  );
};