// src/components/TerminalBridgeStatus.tsx
// 🔌 Componente de Status do Local Bridge

import React, { useState, useEffect } from 'react';
import { terminalBridge } from '../services/TerminalBridge';

export const TerminalBridgeStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const connected = await terminalBridge.connect();
      setIsConnected(connected);
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Verifica conexão ao montar
    checkConnection();

    // Verifica a cada 10 segundos
    const interval = setInterval(checkConnection, 10000);

    return () => clearInterval(interval);
  }, []);

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-green-700 font-medium">Local Bridge Conectado</span>
        <span className="text-green-600 text-xs">• Comandos serão executados automaticamente</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
      <div className="flex-1">
        <span className="text-yellow-700 font-medium">Local Bridge Desconectado</span>
        <p className="text-yellow-600 text-xs mt-1">
          Para execução automática de comandos, rode: <code className="bg-yellow-100 px-1 rounded">npx @ai-weaver/local-bridge</code>
        </p>
      </div>
      <button
        onClick={checkConnection}
        disabled={isChecking}
        className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 text-xs font-medium"
      >
        {isChecking ? 'Verificando...' : 'Reconectar'}
      </button>
    </div>
  );
};
