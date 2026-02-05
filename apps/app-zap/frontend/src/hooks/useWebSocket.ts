'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface WebSocketEvent {
    type: string;
    data: any;
    timestamp: Date;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
    autoConnect?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
}

interface UseWebSocketReturn {
    socket: Socket | null;
    status: ConnectionStatus;
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;
    subscribe: (channels: string[]) => void;
    unsubscribe: (channels: string[]) => void;
    on: (event: string, callback: (data: any) => void) => void;
    off: (event: string, callback?: (data: any) => void) => void;
    emit: (event: string, data: any) => void;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

/**
 * Custom hook for WebSocket connection
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
    const {
        autoConnect = true,
        reconnectionAttempts = 5,
        reconnectionDelay = 1000
    } = options;

    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const socketRef = useRef<Socket | null>(null);
    const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

    const connect = useCallback(() => {
        if (socketRef.current?.connected) return;

        setStatus('connecting');

        const socket = io(WS_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts,
            reconnectionDelay,
            autoConnect: true
        });

        socket.on('connect', () => {
            console.log('🔌 WebSocket connected');
            setStatus('connected');
        });

        socket.on('disconnect', (reason) => {
            console.log('🔌 WebSocket disconnected:', reason);
            setStatus('disconnected');
        });

        socket.on('connect_error', (error) => {
            console.error('🔌 WebSocket connection error:', error);
            setStatus('error');
        });

        socket.on('connected', (data) => {
            console.log('🔌 Server welcome:', data);
        });

        socketRef.current = socket;
    }, [reconnectionAttempts, reconnectionDelay]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setStatus('disconnected');
        }
    }, []);

    const subscribe = useCallback((channels: string[]) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('subscribe', channels);
        }
    }, []);

    const unsubscribe = useCallback((channels: string[]) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('unsubscribe', channels);
        }
    }, []);

    const on = useCallback((event: string, callback: (data: any) => void) => {
        if (!listenersRef.current.has(event)) {
            listenersRef.current.set(event, new Set());
        }
        listenersRef.current.get(event)!.add(callback);

        if (socketRef.current) {
            socketRef.current.on(event, callback);
        }
    }, []);

    const off = useCallback((event: string, callback?: (data: any) => void) => {
        if (callback) {
            listenersRef.current.get(event)?.delete(callback);
            socketRef.current?.off(event, callback);
        } else {
            listenersRef.current.delete(event);
            socketRef.current?.off(event);
        }
    }, []);

    const emit = useCallback((event: string, data: any) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit(event, data);
        }
    }, []);

    // Auto-connect on mount
    useEffect(() => {
        if (autoConnect) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [autoConnect, connect, disconnect]);

    // Re-register listeners when socket reconnects
    useEffect(() => {
        if (status === 'connected' && socketRef.current) {
            listenersRef.current.forEach((callbacks, event) => {
                callbacks.forEach(callback => {
                    socketRef.current?.on(event, callback);
                });
            });
        }
    }, [status]);

    return {
        socket: socketRef.current,
        status,
        isConnected: status === 'connected',
        connect,
        disconnect,
        subscribe,
        unsubscribe,
        on,
        off,
        emit
    };
}

/**
 * Hook for listening to specific events
 */
export function useWebSocketEvent<T = any>(
    eventName: string,
    callback: (data: T) => void,
    deps: any[] = []
) {
    const { on, off, isConnected } = useWebSocket({ autoConnect: true });

    useEffect(() => {
        if (isConnected) {
            on(eventName, callback);
            return () => off(eventName, callback);
        }
    }, [eventName, isConnected, ...deps]);
}

/**
 * WebSocket event types (mirror from backend)
 */
export const WS_EVENTS = {
    MESSAGE_RECEIVED: 'message:received',
    MESSAGE_SENT: 'message:sent',
    CONTACT_UPDATED: 'contact:updated',
    CONTACT_PAUSED: 'contact:paused',
    CONTACT_RESUMED: 'contact:resumed',
    RISK_DETECTED: 'risk:detected',
    RISK_RESOLVED: 'risk:resolved',
    HUNTER_EXECUTED: 'hunter:executed',
    WATCHDOG_ALERT: 'watchdog:alert',
    METRICS_UPDATE: 'metrics:update',
    TASK_COMPLETED: 'task:completed',
    BACKUP_CREATED: 'backup:created',
    LEAD_SCORE_UPDATED: 'lead:score_updated',
    CONVERSION: 'lead:conversion'
} as const;
