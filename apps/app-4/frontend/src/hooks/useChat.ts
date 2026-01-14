import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "./useAuthStore";

// Types
export interface ChatMessage {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    message_type: "text" | "image" | "file";
    created_at: string;
    read: boolean;
}

export interface ChatUser {
    id: number;
    name: string;
    role: string;
    avatar?: string;
    online: boolean;
}

export interface Conversation {
    id: number;
    other_user_id: number;
    other_user?: ChatUser;
    last_message?: ChatMessage;
    unread_count: number;
    updated_at: string;
}

interface WebSocketMessage {
    type: string;
    message?: ChatMessage;
    user_id?: number;
    online?: boolean;
    sender_id?: number;
    typing?: boolean;
}

interface UseChatOptions {
    autoConnect?: boolean;
}

export function useChat(options: UseChatOptions = { autoConnect: true }) {
    const { token, user } = useAuthStore();
    const wsRef = useRef<WebSocket | null>(null);

    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
    const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
    const [error, setError] = useState<string | null>(null);

    const backendUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (!token || wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        const wsUrl = `${backendUrl}/ws/chat?token=${token}`;

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("💬 Chat WebSocket connected");
                setConnected(true);
                setError(null);
            };

            ws.onmessage = (event) => {
                try {
                    const data: WebSocketMessage = JSON.parse(event.data);
                    handleMessage(data);
                } catch (e) {
                    console.error("Error parsing chat message:", e);
                }
            };

            ws.onclose = (event) => {
                console.log("💬 Chat WebSocket closed:", event.code, event.reason);
                setConnected(false);
                wsRef.current = null;

                // Auto-reconnect after 3 seconds if not a normal closure
                if (event.code !== 1000) {
                    setTimeout(() => {
                        if (token) {
                            connect();
                        }
                    }, 3000);
                }
            };

            ws.onerror = (event) => {
                console.error("Chat WebSocket error:", event);
                setError("Erro na conexão do chat");
            };

        } catch (e) {
            console.error("Failed to create WebSocket:", e);
            setError("Falha ao conectar ao chat");
        }
    }, [token, backendUrl]);

    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close(1000, "User disconnected");
            wsRef.current = null;
            setConnected(false);
        }
    }, []);

    // Handle incoming WebSocket messages
    const handleMessage = (data: WebSocketMessage) => {
        switch (data.type) {
            case "new_message":
                if (data.message) {
                    setMessages((prev) => [...prev, data.message!]);
                }
                break;

            case "user_status":
                if (data.user_id !== undefined && data.online !== undefined) {
                    setOnlineUsers((prev) => {
                        const next = new Set(prev);
                        if (data.online) {
                            next.add(data.user_id!);
                        } else {
                            next.delete(data.user_id!);
                        }
                        return next;
                    });
                }
                break;

            case "typing":
                if (data.sender_id !== undefined) {
                    setTypingUsers((prev) => {
                        const next = new Set(prev);
                        if (data.typing) {
                            next.add(data.sender_id!);
                        } else {
                            next.delete(data.sender_id!);
                        }
                        return next;
                    });
                }
                break;

            case "messages_read":
                // Mark messages as read
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.sender_id === user?.id ? { ...msg, read: true } : msg
                    )
                );
                break;

            case "notification":
                // Handle system notifications
                console.log("Notification received:", data);
                break;

            default:
                console.log("Unknown message type:", data.type);
        }
    };

    // Send a message
    const sendMessage = useCallback(
        (receiverId: number, content: string, messageType: "text" | "image" | "file" = "text") => {
            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                setError("Chat não conectado");
                return false;
            }

            const message = {
                type: "send_message",
                receiver_id: receiverId,
                content,
                message_type: messageType,
            };

            wsRef.current.send(JSON.stringify(message));
            return true;
        },
        []
    );

    // Send typing indicator
    const sendTyping = useCallback((receiverId: number, typing: boolean) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        const message = {
            type: "typing",
            receiver_id: receiverId,
            typing,
        };

        wsRef.current.send(JSON.stringify(message));
    }, []);

    // Mark messages as read
    const markAsRead = useCallback((senderId: number) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        const message = {
            type: "read",
            sender_id: senderId,
        };

        wsRef.current.send(JSON.stringify(message));
    }, []);

    // Check if a user is online
    const isUserOnline = useCallback(
        (userId: number) => onlineUsers.has(userId),
        [onlineUsers]
    );

    // Check if a user is typing
    const isUserTyping = useCallback(
        (userId: number) => typingUsers.has(userId),
        [typingUsers]
    );

    // Get messages for a specific conversation
    const getMessagesWithUser = useCallback(
        (userId: number) =>
            messages.filter(
                (msg) =>
                    (msg.sender_id === userId && msg.receiver_id === user?.id) ||
                    (msg.sender_id === user?.id && msg.receiver_id === userId)
            ),
        [messages, user]
    );

    // Clear messages
    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    // Auto-connect on mount
    useEffect(() => {
        if (options.autoConnect && token) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [options.autoConnect, token, connect, disconnect]);

    return {
        connected,
        messages,
        onlineUsers: Array.from(onlineUsers),
        typingUsers: Array.from(typingUsers),
        error,
        connect,
        disconnect,
        sendMessage,
        sendTyping,
        markAsRead,
        isUserOnline,
        isUserTyping,
        getMessagesWithUser,
        clearMessages,
    };
}
