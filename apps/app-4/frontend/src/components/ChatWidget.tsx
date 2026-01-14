import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, X, Send, Paperclip, Image, Smile,
    Phone, Video, MoreVertical, Check, CheckCheck,
    Loader2, User, ChevronLeft
} from 'lucide-react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';

interface Message {
    id: string;
    senderId: number;
    receiverId: number;
    content: string;
    type: 'text' | 'image' | 'file';
    createdAt: string;
    read: boolean;
}

interface Conversation {
    id: string;
    participantId: number;
    participantName: string;
    participantRole: string;
    lastMessage?: string;
    lastMessageAt?: string;
    unreadCount: number;
}

interface ChatWidgetProps {
    recipientId?: number;
    recipientName?: string;
    onClose?: () => void;
    floating?: boolean;
}

export function ChatWidget({ recipientId, recipientName, onClose, floating = true }: ChatWidgetProps) {
    const { user } = useAuthStore();
    const [isOpen, setIsOpen] = useState(!floating);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            loadConversations();
        }
    }, [isOpen]);

    useEffect(() => {
        if (recipientId && recipientName) {
            setSelectedConversation({
                id: `conv-${recipientId}`,
                participantId: recipientId,
                participantName: recipientName,
                participantRole: 'MEDICO',
                unreadCount: 0
            });
        }
    }, [recipientId, recipientName]);

    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.participantId);
        }
    }, [selectedConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversations = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/chat/conversations');
            setConversations(response.data || []);
        } catch (err) {
            // Mock data
            setConversations([
                {
                    id: '1',
                    participantId: 1,
                    participantName: 'Dr. João Silva',
                    participantRole: 'MEDICO',
                    lastMessage: 'Como você está se sentindo hoje?',
                    lastMessageAt: new Date().toISOString(),
                    unreadCount: 2
                },
                {
                    id: '2',
                    participantId: 2,
                    participantName: 'Dra. Maria Santos',
                    participantRole: 'MEDICO',
                    lastMessage: 'Seus exames chegaram',
                    lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
                    unreadCount: 0
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (participantId: number) => {
        try {
            const response = await axiosInstance.get(`/chat/messages/${participantId}`);
            setMessages(response.data || []);
        } catch (err) {
            // Mock messages
            setMessages([
                {
                    id: '1',
                    senderId: participantId,
                    receiverId: user?.id || 0,
                    content: 'Olá! Como posso ajudar?',
                    type: 'text',
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                    read: true
                },
                {
                    id: '2',
                    senderId: user?.id || 0,
                    receiverId: participantId,
                    content: 'Olá doutor, tenho uma dúvida sobre minha medicação',
                    type: 'text',
                    createdAt: new Date(Date.now() - 3500000).toISOString(),
                    read: true
                },
                {
                    id: '3',
                    senderId: participantId,
                    receiverId: user?.id || 0,
                    content: 'Claro! Pode me dizer qual medicação?',
                    type: 'text',
                    createdAt: new Date(Date.now() - 3400000).toISOString(),
                    read: true
                }
            ]);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        setSending(true);
        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            senderId: user?.id || 0,
            receiverId: selectedConversation.participantId,
            content: newMessage,
            type: 'text',
            createdAt: new Date().toISOString(),
            read: false
        };

        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');

        try {
            await axiosInstance.post('/chat/messages', {
                receiverId: selectedConversation.participantId,
                content: newMessage,
                type: 'text'
            });
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        const today = new Date();
        if (d.toDateString() === today.toDateString()) return 'Hoje';
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };


    if (floating && !isOpen) {
        return (
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full shadow-lg shadow-cyan-500/30 flex items-center justify-center z-40"
            >
                <MessageSquare className="w-6 h-6 text-white" />
                {conversations.some(c => c.unreadCount > 0) && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                        {conversations.reduce((acc, c) => acc + c.unreadCount, 0)}
                    </span>
                )}
            </motion.button>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className={`${floating ? 'fixed bottom-24 right-6 w-96 h-[500px] shadow-2xl z-50' : 'w-full h-full'} bg-white dark:bg-gray-800 rounded-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700`}
            >
                {/* Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-between">
                    {selectedConversation ? (
                        <>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedConversation(null)}
                                    className="p-1 hover:bg-white/20 rounded-lg"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold">{selectedConversation.participantName}</p>
                                    <p className="text-xs text-cyan-100">Online</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button className="p-2 hover:bg-white/20 rounded-lg">
                                    <Phone className="w-4 h-4" />
                                </button>
                                <button className="p-2 hover:bg-white/20 rounded-lg">
                                    <Video className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                <span className="font-semibold">Mensagens</span>
                            </div>
                            {floating && (
                                <button
                                    onClick={() => { setIsOpen(false); onClose?.(); }}
                                    className="p-1 hover:bg-white/20 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {selectedConversation ? (
                        /* Messages */
                        <div className="h-full flex flex-col">
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messages.map((message, index) => {
                                    const isOwn = message.senderId === user?.id;
                                    const showDate = index === 0 || 
                                        formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt);
                                    
                                    return (
                                        <div key={message.id}>
                                            {showDate && (
                                                <div className="text-center my-4">
                                                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                                                        {formatDate(message.createdAt)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                                                    isOwn 
                                                        ? 'bg-cyan-500 text-white rounded-br-md' 
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                                                }`}>
                                                    <p className="text-sm">{message.content}</p>
                                                    <div className={`flex items-center justify-end gap-1 mt-1 ${
                                                        isOwn ? 'text-cyan-100' : 'text-gray-400'
                                                    }`}>
                                                        <span className="text-xs">{formatTime(message.createdAt)}</span>
                                                        {isOwn && (
                                                            message.read 
                                                                ? <CheckCheck className="w-3 h-3" />
                                                                : <Check className="w-3 h-3" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Digite sua mensagem..."
                                        className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-900 dark:text-white focus:outline-none"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!newMessage.trim() || sending}
                                        className="p-2 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 disabled:opacity-50"
                                    >
                                        {sending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Conversations List */
                        <div className="h-full overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
                                    <p>Nenhuma conversa</p>
                                </div>
                            ) : (
                                conversations.map(conv => (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedConversation(conv)}
                                        className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700"
                                    >
                                        <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-cyan-600" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-gray-900 dark:text-white">{conv.participantName}</p>
                                                {conv.lastMessageAt && (
                                                    <span className="text-xs text-gray-500">{formatDate(conv.lastMessageAt)}</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                                        </div>
                                        {conv.unreadCount > 0 && (
                                            <span className="w-5 h-5 bg-cyan-500 rounded-full text-white text-xs flex items-center justify-center">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export default ChatWidget;
