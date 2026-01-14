import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from './useAuthStore';
import { QueueDisplay, QueueTicket } from '@/api/queue';

interface UseQueueWebSocketOptions {
    onQueueUpdate?: (display: QueueDisplay) => void;
    onTicketCalled?: (ticket: QueueTicket) => void;
    autoReconnect?: boolean;
}

export function useQueueWebSocket(options: UseQueueWebSocketOptions = {}) {
    const { token } = useAuthStore();
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<QueueDisplay | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 
            (typeof window !== 'undefined' 
                ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
                : 'ws://localhost:8080');

        const ws = new WebSocket(`${wsUrl}/ws/waiting-room?token=${token}`);

        ws.onopen = () => {
            console.log('Queue WebSocket connected');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'queue_update' && data.data) {
                    setLastUpdate(data.data);
                    options.onQueueUpdate?.(data.data);
                    
                    // Check if there's a new call
                    if (data.data.last_called) {
                        options.onTicketCalled?.(data.data.last_called);
                    }
                }
            } catch (err) {
                console.error('Error parsing WebSocket message:', err);
            }
        };

        ws.onclose = () => {
            console.log('Queue WebSocket disconnected');
            setIsConnected(false);
            
            // Auto reconnect
            if (options.autoReconnect !== false) {
                reconnectTimeoutRef.current = setTimeout(() => {
                    connect();
                }, 3000);
            }
        };

        ws.onerror = (error) => {
            console.error('Queue WebSocket error:', error);
        };

        wsRef.current = ws;
    }, [token, options]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (token) {
            connect();
        }
        return () => disconnect();
    }, [token, connect, disconnect]);

    return {
        isConnected,
        lastUpdate,
        connect,
        disconnect
    };
}

export default useQueueWebSocket;
