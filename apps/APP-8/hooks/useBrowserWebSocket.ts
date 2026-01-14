import { useState, useEffect, useCallback, useRef } from 'react';

interface BrowserCommand {
  action: string;
  params?: Record<string, any>;
}

interface BrowserResponse {
  status: string;
  [key: string]: any;
}

interface UseBrowserWebSocketReturn {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  sendCommand: (command: BrowserCommand) => Promise<BrowserResponse>;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Hook para conexão WebSocket direta com o Executor Python
 * Permite controle em tempo real do navegador
 */
export const useBrowserWebSocket = (
  url: string = 'ws://localhost:8081'
): UseBrowserWebSocketReturn => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const pendingCommandsRef = useRef<Map<string, {
    resolve: (value: BrowserResponse) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
  }>>(new Map());
  const commandIdRef = useRef(0);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket já está conectado');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket conectado ao Executor');
        setConnected(true);
        setConnecting(false);
        setError(null);

        // Envia mensagem de inicialização
        ws.send(JSON.stringify({
          type: 'init',
          client: 'browser-control',
          timestamp: Date.now()
        }));
      };

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          console.log('📨 Resposta do Executor:', response);

          // Se for resposta a um comando
          if (response.commandId) {
            const pending = pendingCommandsRef.current.get(response.commandId);
            if (pending) {
              clearTimeout(pending.timeout);
              pendingCommandsRef.current.delete(response.commandId);
              pending.resolve(response);
            }
          }
        } catch (err) {
          console.error('Erro ao processar mensagem:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('❌ Erro no WebSocket:', event);
        setError('Erro na conexão WebSocket');
        setConnecting(false);
      };

      ws.onclose = () => {
        console.log('⚠️ WebSocket desconectado');
        setConnected(false);
        setConnecting(false);
        wsRef.current = null;

        // Rejeita comandos pendentes
        pendingCommandsRef.current.forEach((pending) => {
          clearTimeout(pending.timeout);
          pending.reject(new Error('WebSocket desconectado'));
        });
        pendingCommandsRef.current.clear();
      };
    } catch (err: any) {
      console.error('Erro ao conectar WebSocket:', err);
      setError(err.message);
      setConnecting(false);
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  const sendCommand = useCallback((command: BrowserCommand): Promise<BrowserResponse> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket não está conectado'));
        return;
      }

      // Gera ID único para o comando
      const commandId = `cmd_${++commandIdRef.current}_${Date.now()}`;

      // Timeout de 30 segundos
      const timeout = setTimeout(() => {
        pendingCommandsRef.current.delete(commandId);
        reject(new Error('Timeout aguardando resposta do Executor'));
      }, 30000);

      // Armazena promise para resolver quando resposta chegar
      pendingCommandsRef.current.set(commandId, { resolve, reject, timeout });

      // Envia comando
      const message = {
        ...command,
        commandId,
        timestamp: Date.now()
      };

      console.log('📤 Enviando comando:', message);
      wsRef.current.send(JSON.stringify(message));
    });
  }, []);

  // Auto-conecta ao montar
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connected,
    connecting,
    error,
    sendCommand,
    connect,
    disconnect
  };
};
