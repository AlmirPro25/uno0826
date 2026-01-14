
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAgvDataStore } from '../store/agvStore';
import { AgvStatus } from '../types';

interface WebSocketContextType {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
  url: string;
}

/**
 * Provides WebSocket connectivity and handles real-time data ingestion from the streaming service.
 * Implements exponential backoff for resilience on connection failures.
 */
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, url }) => {
  const [isConnected, setIsConnected] = useState(false);
  const { updateAgvData, setAllAgvData } = useAgvDataStore();
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const connect = useCallback(() => {
    if (wsInstance) return;

    console.log(`[WebSocket] Attempting connection to ${url}...`);
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("[WebSocket] Connection established.");
      setIsConnected(true);
      setRetryCount(0); // Reset retry count on successful connection
    };

    ws.onmessage = (event) => {
      // Assuming binary data (Protobuf) or JSON payload for real-time updates.
      // For simplicity here, assume JSON string payload. In production, binary data should be deserialized.
      const data: AgvStatus[] | AgvStatus = JSON.parse(event.data);
      if (Array.isArray(data)) {
        setAllAgvData(data); // Initial snapshot update
      } else {
        updateAgvData(data); // Single AGV update delta
      }
    };

    ws.onclose = () => {
      console.log("[WebSocket] Connection closed.");
      setIsConnected(false);
      // Implement exponential backoff for resilience (Anti-pattern 4)
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max delay 30 seconds
      console.log(`[WebSocket] Retrying in ${delay / 1000} seconds...`);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setWsInstance(null); // Force new connection attempt
        connect();
      }, delay);
    };

    ws.onerror = (error) => {
      console.error("[WebSocket] Error occurred:", error);
      ws.close();
    };

    setWsInstance(ws);
  }, [url, retryCount, setAllAgvData, updateAgvData, wsInstance]);

  const disconnect = useCallback(() => {
    wsInstance?.close();
  }, [wsInstance]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return (
    <WebSocketContext.Provider value={{ isConnected, connect, disconnect }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
