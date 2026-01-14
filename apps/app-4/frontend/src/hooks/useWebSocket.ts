import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';

type WSMessage = {
    type: string;
    payload?: any;
    appointmentId?: number;
    roomName?: string;
    [key: string]: any;
};

export const useWebSocket = () => {
    const { token, user } = useAuthStore();
    const socketRef = useRef<WebSocket | null>(null);
    const [messages, setMessages] = useState<WSMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!token || !user) return;

        // Ensure we don't create multiple connections
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        // WebSocket URL - assume localhost:8080 or from env
        const wsHost = process.env.NEXT_PUBLIC_WS_HOST || 'localhost:8080';
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsUrl = `${protocol}://${wsHost}/ws/waiting-room?token=${token}`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Connected to WebSocket');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WS Message:', data);
                setMessages(prev => [...prev, data]);

                // Dispatch a custom event for global listeners
                window.dispatchEvent(new CustomEvent('medisync-ws-message', { detail: data }));
            } catch (e) {
                console.error('Failed to parse WS message', e);
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from WebSocket');
            setIsConnected(false);
            socketRef.current = null;
        };

        ws.onerror = (err) => {
            console.error('WebSocket Error:', err);
        };

        socketRef.current = ws;

        return () => {
            // Only close if unmounting the entire app setup, usually we want to keep it open.
            // But React strict mode might trigger this twice.
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [token, user]);

    return { socket: socketRef.current, messages, isConnected };
};
