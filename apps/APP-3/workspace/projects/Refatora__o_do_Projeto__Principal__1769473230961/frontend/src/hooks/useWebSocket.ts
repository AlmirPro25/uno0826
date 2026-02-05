
import { useEffect, useRef, useState, useCallback } from 'react';
import { WSPayload } from '../../../../shared/types';

/**
 * HOOK: USE TACTICAL SOCKET
 * Gerencia conexão persistente WebSocket com reconexão automática.
 */
export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSPayload | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    // Determine correct protocol (ws for http, wss for https)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname; // Dev: localhost, Prod: domain
    // If dev, explicitly assume port 3000 if not proxying, but we rely on Vite proxy usually
    // However, WS proxies in Vite can be tricky, so we target backend port directly if dev
    const port = process.env.NODE_ENV === 'development' ? '3000' : window.location.port;
    const finalUrl = `ws://${host}:${port}${url}`;

    const ws = new WebSocket(finalUrl);

    ws.onopen = () => {
      console.log('[SENTINEL UPLINK] WebSocket Channel Established.');
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.warn('[SENTINEL UPLINK] Connection Lost. Attempting Reconnection Protocols...');
      setIsConnected(false);
      // Exponential backoff or simple retry
      reconnectTimeoutRef.current = setTimeout(() => connect(), 3000);
    };

    ws.onerror = (err) => {
      console.error('[SENTINEL UPLINK] Protocol Error:', err);
      ws.close();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WSPayload;
        setLastMessage(data);
      } catch (e) {
        console.error('[SENTINEL UPLINK] Malformed Telemetry Packet:', event.data);
      }
    };

    socketRef.current = ws;
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  return { isConnected, lastMessage };
}
