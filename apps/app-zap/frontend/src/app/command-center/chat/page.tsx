'use client';

import { useEffect, useState, useRef } from 'react';
import { ghostApi, Contact, Message } from '@/services/ghost-api';
import { useWebSocket, WS_EVENTS } from '@/hooks/useWebSocket';
import {
    MessageSquare, Send, Mic, Image, RefreshCw,
    Phone, Bot, User, Pause, Play, AlertTriangle, Sparkles
} from 'lucide-react';

// Use imported types from ghostApi

export default function ChatPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // WebSocket Integration
    const { on, off, isConnected } = useWebSocket();

    useEffect(() => {
        loadContacts();
    }, []);

    useEffect(() => {
        if (!isConnected) return;

        const handleNewMessage = (event: any) => {
            const { contactId, message } = event.data;

            // If message is for correctly selected contact, add to list
            if (selectedContact?.id === contactId) {
                const wsMsg: Message = {
                    id: message.id || Date.now().toString(),
                    body: message.body,
                    fromMe: false,
                    timestamp: new Date().toISOString(),
                    isOperator: false
                };
                setMessages(prev => [...prev, wsMsg]);
            }

            // Update contact in sidebar
            loadContacts(); // Refresh all or just update one? Refresh for simplicity now.
        };

        const handleSentMessage = (event: any) => {
            const { contactId, message } = event.data;
            if (selectedContact?.id === contactId) {
                const wsMsg: Message = {
                    id: message.id || Date.now().toString(),
                    body: message.body,
                    fromMe: true,
                    timestamp: new Date().toISOString(),
                    isOperator: message.isAI === false
                };
                setMessages(prev => {
                    // Avoid duplicate if sent locally
                    if (prev.some(m => m.id === wsMsg.id)) return prev;
                    return [...prev, wsMsg];
                });
            }
        };

        const handleStatusUpdate = (event: any) => {
            if (selectedContact?.id === event.data.contactId) {
                setSelectedContact(prev => prev ? { ...prev, ...event.data.updates } : null);
            }
            loadContacts();
        };

        on(WS_EVENTS.MESSAGE_RECEIVED, handleNewMessage);
        on(WS_EVENTS.MESSAGE_SENT, handleSentMessage);
        on(WS_EVENTS.LEAD_SCORE_UPDATED, handleStatusUpdate);

        return () => {
            off(WS_EVENTS.MESSAGE_RECEIVED);
            off(WS_EVENTS.MESSAGE_SENT);
            off(WS_EVENTS.LEAD_SCORE_UPDATED);
        };
    }, [isConnected, selectedContact, on, off]);

    useEffect(() => {
        if (selectedContact) {
            loadMessages(selectedContact.id);
        }
    }, [selectedContact]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadContacts = async () => {
        setLoading(true);
        try {
            const res = await ghostApi.contacts.list();
            const contactsData = res.data?.contacts || [];
            setContacts(contactsData);
        } catch (error) {
            console.error('Failed to load contacts:', error);
            // Mock data
            setContacts([
                {
                    id: '5511999999999@c.us',
                    name: 'João Silva',
                    pushName: 'João',
                    profilePicUrl: null,
                    isPaused: false,
                    lastInteraction: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    semanticProfile: 'interessado',
                    avgResponseTime: 45,
                    trustLevel: 78,
                    intimacyLevel: 85,
                    emotionalState: 'EXCITED',
                    engagementScore: 92,
                    salesReadiness: 88,
                    lastTone: 'curioso',
                    replyLatencyProfile: 'NORMAL',
                    activeDirective: null,
                    directiveStatus: 'IDLE'
                },
                {
                    id: '5511988888888@c.us',
                    name: 'Maria Santos',
                    pushName: 'Mari',
                    profilePicUrl: null,
                    isPaused: false,
                    lastInteraction: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                    semanticProfile: 'neutro',
                    avgResponseTime: 60,
                    trustLevel: 70,
                    intimacyLevel: 65,
                    emotionalState: 'NEUTRAL',
                    engagementScore: 58,
                    salesReadiness: 45,
                    lastTone: 'neutro',
                    replyLatencyProfile: 'NORMAL',
                    activeDirective: null,
                    directiveStatus: 'IDLE'
                },
                {
                    id: '5511977777777@c.us',
                    name: 'Pedro Costa',
                    pushName: 'Pedro',
                    profilePicUrl: null,
                    isPaused: true,
                    lastInteraction: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    semanticProfile: 'frio',
                    avgResponseTime: 300,
                    trustLevel: 55,
                    intimacyLevel: 40,
                    emotionalState: 'NEUTRAL',
                    engagementScore: 35,
                    salesReadiness: 20,
                    lastTone: 'frio',
                    replyLatencyProfile: 'SLOW',
                    activeDirective: null,
                    directiveStatus: 'IDLE'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (contactId: string) => {
        try {
            const phone = contactId.replace('@c.us', '');
            const res = await ghostApi.contacts.getHistory(phone);
            const messagesData = res.data?.messages || [];
            setMessages(messagesData);
        } catch (error) {
            console.error('Failed to load messages:', error);
            // Mock messages
            setMessages([
                { id: '1', body: 'Oi! Tudo bem?', fromMe: false, timestamp: new Date(Date.now() - 3600000).toISOString(), isOperator: false },
                { id: '2', body: 'Oi amor! Tudo sim e você? 😊', fromMe: true, timestamp: new Date(Date.now() - 3500000).toISOString(), isOperator: false },
                { id: '3', body: 'To bem! Queria saber mais sobre o conteúdo', fromMe: false, timestamp: new Date(Date.now() - 3400000).toISOString(), isOperator: false },
                { id: '4', body: 'Claro! Te mando o link agora 💜', fromMe: true, timestamp: new Date(Date.now() - 3300000).toISOString(), isOperator: false },
                { id: '5', body: 'Perfeito! Quanto custa?', fromMe: false, timestamp: new Date(Date.now() - 1800000).toISOString(), isOperator: false },
                { id: '6', body: 'Tenho uma promoção especial pra você! 🔥', fromMe: true, timestamp: new Date(Date.now() - 1700000).toISOString(), isOperator: false }
            ]);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedContact) return;

        setSending(true);
        try {
            // This would send via API
            const newMsg: Message = {
                id: Date.now().toString(),
                body: newMessage,
                fromMe: true,
                timestamp: new Date().toISOString(),
                isOperator: true
            };
            setMessages(prev => [...prev, newMsg]);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    const togglePause = async () => {
        if (!selectedContact) return;
        try {
            const phone = selectedContact.id.replace('@c.us', '');
            await ghostApi.contacts.control(phone, selectedContact.isPaused ? 'resume' : 'pause');
            setSelectedContact(prev => prev ? { ...prev, isPaused: !prev.isPaused } : null);
            loadContacts();
        } catch (error) {
            console.error('Failed to toggle pause:', error);
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const getEmotionEmoji = (emotion: string) => {
        const emojis: Record<string, string> = {
            'NEUTRAL': '😐',
            'EXCITED': '🤩',
            'ANXIOUS': '😰',
            'ANGRY': '😠',
            'SAD': '😢',
            'HAPPY': '😊'
        };
        return emojis[emotion] || '😐';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Sort contacts by lastInteraction (most recent first)
    const sortedContacts = [...contacts].sort((a, b) => {
        const dateA = new Date(a.lastInteraction).getTime();
        const dateB = new Date(b.lastInteraction).getTime();
        return dateB - dateA;
    });

    const formatLastSeen = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins}min`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return date.toLocaleDateString('pt-BR', { weekday: 'short' });
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const isOnline = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMins = (now.getTime() - date.getTime()) / 60000;
        return diffMins < 5; // Online if active within 5 minutes
    };

    return (
        <div className="h-screen flex">
            {/* Contacts Sidebar */}
            <div className="w-80 bg-black/60 border-r border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-purple-400" />
                        Conversations
                        <span className="ml-auto text-xs text-gray-500 font-normal">{contacts.length}</span>
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {sortedContacts.map(contact => {
                        const online = isOnline(contact.lastInteraction);
                        const lastSeenText = formatLastSeen(contact.lastInteraction);

                        return (
                            <button
                                key={contact.id}
                                onClick={() => setSelectedContact(contact)}
                                className={`w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-gray-800/50 ${selectedContact?.id === contact.id ? 'bg-purple-500/20 border-l-2 border-l-purple-500' : ''
                                    }`}
                            >
                                {/* Profile Picture */}
                                <div className="relative flex-shrink-0">
                                    {contact.profilePicUrl ? (
                                        <img
                                            src={contact.profilePicUrl}
                                            alt={contact.name || 'Profile'}
                                            className="w-12 h-12 rounded-full object-cover"
                                            onError={(e) => {
                                                // Fallback to initials on image load error
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <div className={`${contact.profilePicUrl ? 'hidden' : ''} w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                                        {(contact.name || contact.pushName || '?')[0].toUpperCase()}
                                    </div>
                                    {/* Online Indicator */}
                                    {online && (
                                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-gray-900 rounded-full"></div>
                                    )}
                                </div>

                                {/* Contact Info */}
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-white font-medium truncate">
                                            {contact.name || contact.pushName || contact.id.replace('@c.us', '')}
                                        </span>
                                        <span className={`text-xs flex-shrink-0 ${online ? 'text-green-400' : 'text-gray-500'}`}>
                                            {lastSeenText}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <div className="flex items-center gap-1.5 text-gray-400 text-xs truncate">
                                            <span className="text-base">{getEmotionEmoji(contact.emotionalState)}</span>
                                            <span className="truncate">{contact.semanticProfile || 'Novo contato'}</span>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {contact.salesReadiness >= 70 && (
                                                <span className="w-2 h-2 bg-orange-500 rounded-full" title="Hot Lead"></span>
                                            )}
                                            {contact.isPaused && (
                                                <Pause className="w-3 h-3 text-orange-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    {contacts.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>Nenhum contato ainda</p>
                            <p className="text-xs mt-1">Os contatos aparecerão aqui quando você receber mensagens</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
                {selectedContact ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-700 bg-black/40 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {(selectedContact.name || selectedContact.pushName || '?')[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold">
                                        {selectedContact.name || selectedContact.pushName || 'Unknown'}
                                    </h3>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <Phone className="w-3 h-3" />
                                        {selectedContact.id.replace('@c.us', '')}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* AI Status Indicator */}
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${selectedContact.isPaused ? 'bg-orange-500/20' : 'bg-green-500/20'
                                    }`}>
                                    {selectedContact.isPaused ? (
                                        <><AlertTriangle className="w-4 h-4 text-orange-400" /><span className="text-orange-400 text-sm">AI Paused</span></>
                                    ) : (
                                        <><Bot className="w-4 h-4 text-green-400" /><span className="text-green-400 text-sm">AI Active</span></>
                                    )}
                                </div>

                                {/* Pause/Resume Button */}
                                <button
                                    onClick={togglePause}
                                    className={`p-2 rounded-lg transition-colors ${selectedContact.isPaused
                                        ? 'bg-green-500/20 hover:bg-green-500/30'
                                        : 'bg-orange-500/20 hover:bg-orange-500/30'
                                        }`}
                                >
                                    {selectedContact.isPaused ? (
                                        <Play className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <Pause className="w-5 h-5 text-orange-400" />
                                    )}
                                </button>

                                {/* Refresh */}
                                <button
                                    onClick={() => loadMessages(selectedContact.id)}
                                    className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
                                >
                                    <RefreshCw className="w-5 h-5 text-purple-400" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map(message => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[70%] ${message.fromMe
                                        ? message.isOperator
                                            ? 'bg-blue-500'
                                            : 'bg-gradient-to-r from-purple-500 to-pink-500'
                                        : 'bg-gray-800'
                                        } rounded-2xl px-4 py-3`}>
                                        {/* Sender indicator for outgoing messages */}
                                        {message.fromMe && (
                                            <div className="flex items-center gap-1 mb-1">
                                                {message.isOperator ? (
                                                    <><User className="w-3 h-3 text-white/70" /><span className="text-white/70 text-xs">You</span></>
                                                ) : (
                                                    <><Bot className="w-3 h-3 text-white/70" /><span className="text-white/70 text-xs">AI</span></>
                                                )}
                                            </div>
                                        )}
                                        <p className="text-white">{message.body}</p>
                                        <div className={`text-xs mt-1 ${message.fromMe ? 'text-white/60' : 'text-gray-500'}`}>
                                            {formatTime(message.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-gray-700 bg-black/40">
                            <div className="flex items-center gap-3">
                                {/* Quick Actions */}
                                <div className="flex gap-2">
                                    <button className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors">
                                        <Sparkles className="w-5 h-5 text-purple-400" />
                                    </button>
                                    <button className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 transition-colors">
                                        <Mic className="w-5 h-5 text-cyan-400" />
                                    </button>
                                    <button className="p-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 transition-colors">
                                        <Image className="w-5 h-5 text-violet-400" />
                                    </button>
                                </div>

                                {/* Input */}
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Digite sua mensagem..."
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                                    disabled={sending}
                                />

                                {/* Send Button */}
                                <button
                                    onClick={sendMessage}
                                    disabled={sending || !newMessage.trim()}
                                    className="p-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl transition-colors"
                                >
                                    <Send className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* No Chat Selected */
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <MessageSquare className="w-20 h-20 text-purple-500/30 mx-auto mb-4" />
                            <h3 className="text-xl text-white mb-2">Select a conversation</h3>
                            <p className="text-gray-500">Choose a contact from the sidebar to view messages</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
