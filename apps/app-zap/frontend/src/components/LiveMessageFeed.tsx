'use client';

import { useEffect, useState } from 'react';
import { useWebSocket, WS_EVENTS } from '@/hooks/useWebSocket';
import { MessageSquare, ArrowRight, Bot, User, Zap } from 'lucide-react';

interface LiveMessage {
    id: string;
    contactId: string;
    contactName: string;
    body: string;
    fromMe: boolean;
    isAI: boolean;
    timestamp: Date;
}

export function LiveMessageFeed() {
    const [messages, setMessages] = useState<LiveMessage[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const { on, off, isConnected } = useWebSocket();

    useEffect(() => {
        if (!isConnected || isPaused) return;

        const handleReceived = (event: any) => {
            addMessage({
                contactId: event.data.contactId,
                contactName: event.data.contactId.replace('@c.us', ''),
                body: event.data.message.body,
                fromMe: false,
                isAI: false
            });
        };

        const handleSent = (event: any) => {
            addMessage({
                contactId: event.data.contactId,
                contactName: event.data.contactId.replace('@c.us', ''),
                body: event.data.message.body,
                fromMe: true,
                isAI: event.data.message.isAI
            });
        };

        on(WS_EVENTS.MESSAGE_RECEIVED, handleReceived);
        on(WS_EVENTS.MESSAGE_SENT, handleSent);

        return () => {
            off(WS_EVENTS.MESSAGE_RECEIVED);
            off(WS_EVENTS.MESSAGE_SENT);
        };
    }, [isConnected, isPaused, on, off]);

    const addMessage = (msg: Omit<LiveMessage, 'id' | 'timestamp'>) => {
        const newMsg: LiveMessage = {
            ...msg,
            id: Date.now().toString() + Math.random(),
            timestamp: new Date()
        };

        setMessages(prev => [newMsg, ...prev].slice(0, 50));
    };

    return (
        <div className="bg-black/40 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <Zap className={`w-5 h-5 ${isConnected ? 'text-yellow-400 animate-pulse' : 'text-gray-500'}`} />
                    <span className="text-white font-semibold">Live Message Feed</span>
                    {isConnected && !isPaused && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                            LIVE
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setIsPaused(!isPaused)}
                    className={`px-3 py-1 rounded text-sm font-medium ${isPaused
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                        }`}
                >
                    {isPaused ? 'Resume' : 'Pause'}
                </button>
            </div>

            {/* Messages */}
            <div className="max-h-80 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>Waiting for messages...</p>
                        {!isConnected && (
                            <p className="text-sm mt-2 text-red-400">WebSocket disconnected</p>
                        )}
                    </div>
                ) : (
                    messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`p-3 border-b border-gray-800/50 hover:bg-white/5 transition-colors ${msg.fromMe ? 'bg-purple-500/5' : ''
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                {msg.fromMe ? (
                                    msg.isAI ? (
                                        <Bot className="w-4 h-4 text-purple-400" />
                                    ) : (
                                        <User className="w-4 h-4 text-blue-400" />
                                    )
                                ) : (
                                    <ArrowRight className="w-4 h-4 text-green-400" />
                                )}
                                <span className="text-gray-400 text-sm">{msg.contactName}</span>
                                <span className="text-gray-600 text-xs ml-auto">
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>
                            <p className={`text-sm truncate ${msg.fromMe ? 'text-purple-200' : 'text-white'
                                }`}>
                                {msg.body}
                            </p>
                            {msg.fromMe && (
                                <span className={`text-xs ${msg.isAI ? 'text-purple-400' : 'text-blue-400'}`}>
                                    {msg.isAI ? '🤖 AI Response' : '👤 Human Response'}
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-700 bg-black/30">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{messages.length} messages</span>
                    <button
                        onClick={() => setMessages([])}
                        className="text-gray-600 hover:text-red-400"
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

export default LiveMessageFeed;
