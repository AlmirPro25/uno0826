'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Send, Sparkles, Terminal, Zap, Bot, User,
    Loader2, Trash2, Copy, Check, ChevronDown,
    Command, Brain, Target, BarChart3, Users, Settings,
    HelpCircle, Mic, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    intent?: {
        category: string;
        action: string;
        confidence: number;
    };
    isLoading?: boolean;
}

interface QuickAction {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    command: string;
    category: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// QUICK ACTIONS CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const QUICK_ACTIONS: QuickAction[] = [
    { id: 'pulse', label: 'Ghost Pulse', icon: Sparkles, command: 'pulse do sistema', category: 'system' },
    { id: 'war', label: 'Modo Guerra', icon: Terminal, command: 'ativar modo guerra', category: 'war_mode' },
    { id: 'hot', label: 'Contatos Quentes', icon: Target, command: 'lista contatos quentes', category: 'contacts' },
    { id: 'status', label: 'Status Sistema', icon: Zap, command: 'status do sistema', category: 'system' },
    { id: 'sales', label: 'Vendas Hoje', icon: BarChart3, command: 'vendas de hoje', category: 'analytics' },
    { id: 'tests', label: 'Testes A/B', icon: Brain, command: 'qual teste está ganhando', category: 'abtests' },
    { id: 'help', label: 'Ajuda', icon: HelpCircle, command: 'ajuda', category: 'help' },
];

const CATEGORY_COLORS: Record<string, string> = {
    contacts: 'from-blue-500 to-cyan-500',
    system: 'from-green-500 to-emerald-500',
    analytics: 'from-purple-500 to-pink-500',
    persona: 'from-orange-500 to-amber-500',
    abtests: 'from-rose-500 to-red-500',
    war_mode: 'from-red-600 to-black',
    help: 'from-gray-500 to-slate-500',
};

// ═══════════════════════════════════════════════════════════════════════════
// API SERVICE
// ═══════════════════════════════════════════════════════════════════════════

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function sendMessage(message: string, sessionId: string): Promise<ChatMessage> {
    const response = await fetch(`${API_BASE}/sovereign/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('ghost_token') || ''}`
        },
        body: JSON.stringify({ message, sessionId })
    });

    if (!response.ok) {
        throw new Error('Failed to send message');
    }

    const data = await response.json();
    return data.data;
}

async function getHistory(sessionId: string): Promise<ChatMessage[]> {
    const response = await fetch(`${API_BASE}/sovereign/history?sessionId=${sessionId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('ghost_token') || ''}`
        }
    });

    if (!response.ok) {
        return [];
    }

    const data = await response.json();
    return data.data?.messages || [];
}

async function clearSession(sessionId: string): Promise<void> {
    await fetch(`${API_BASE}/sovereign/session?sessionId=${sessionId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('ghost_token') || ''}`
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function SovereignChatPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId] = useState(() => `session_${Date.now()}`);
    const [showQuickActions, setShowQuickActions] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Welcome message
    useEffect(() => {
        const welcomeMessage: ChatMessage = {
            id: 'welcome',
            role: 'assistant',
            content: `# 👑 SOVEREIGN CHAT

Olá! Eu sou o **SPECTRA**, seu terminal de comando com linguagem natural.

Você pode me pedir qualquer coisa sobre o sistema. Exemplos:
- *"Lista contatos quentes"*
- *"Qual teste A/B está ganhando?"*
- *"Muda a persona para modo agressivo"*
- *"Status do sistema"*

**Dica:** Use os botões de ação rápida abaixo ou simplesmente digite naturalmente!`,
            timestamp: new Date()
        };
        setMessages([welcomeMessage]);
    }, []);

    // Send message handler
    const handleSend = async (messageText?: string) => {
        const text = messageText || inputValue.trim();
        if (!text || isLoading) return;

        setInputValue('');
        setShowQuickActions(false);

        // Add user message
        const userMessage: ChatMessage = {
            id: `user_${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        // Add loading message
        const loadingMessage: ChatMessage = {
            id: `loading_${Date.now()}`,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isLoading: true
        };
        setMessages(prev => [...prev, loadingMessage]);

        setIsLoading(true);

        try {
            const response = await sendMessage(text, sessionId);

            // Replace loading message with response
            setMessages(prev =>
                prev.filter(m => !m.isLoading).concat({
                    ...response,
                    timestamp: new Date(response.timestamp)
                })
            );
        } catch (error) {
            // Replace loading with error
            setMessages(prev =>
                prev.filter(m => !m.isLoading).concat({
                    id: `error_${Date.now()}`,
                    role: 'assistant',
                    content: '⚠️ Erro ao processar comando. Verifique a conexão com o servidor.',
                    timestamp: new Date()
                })
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Clear chat
    const handleClear = async () => {
        await clearSession(sessionId);
        setMessages([{
            id: 'cleared',
            role: 'assistant',
            content: '🧹 Chat limpo. Como posso ajudar?',
            timestamp: new Date()
        }]);
        setShowQuickActions(true);
    };

    // Copy message
    const handleCopy = (content: string, id: string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Format markdown-like content
    const formatContent = (content: string) => {
        // Simple markdown formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-300">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="text-gray-300">$1</em>')
            .replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold text-white mb-2">$1</h1>')
            .replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold text-white mb-2">$1</h2>')
            .replace(/^• (.*?)$/gm, '<div class="flex gap-2"><span class="text-purple-400">•</span><span>$1</span></div>')
            .replace(/├─/g, '<span class="text-gray-600">├─</span>')
            .replace(/└─/g, '<span class="text-gray-600">└─</span>')
            .replace(/\n/g, '<br/>');
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl border border-purple-500/20 overflow-hidden">

            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-purple-500/20 bg-black/40 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Terminal className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white flex items-center gap-2">
                                Sovereign Chat
                                <Sparkles className="w-4 h-4 text-yellow-400" />
                            </h1>
                            <p className="text-xs text-gray-500">Terminal de comando com linguagem natural</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowQuickActions(!showQuickActions)}
                            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
                            title={showQuickActions ? 'Esconder ações rápidas' : 'Mostrar ações rápidas'}
                        >
                            {showQuickActions ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={handleClear}
                            className="p-2 rounded-lg bg-gray-800/50 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                            title="Limpar chat"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            {showQuickActions && messages.length <= 1 && (
                <div className="flex-shrink-0 p-4 border-b border-purple-500/10 bg-black/20">
                    <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Ações Rápidas</p>
                    <div className="flex flex-wrap gap-2">
                        {QUICK_ACTIONS.map(action => (
                            <button
                                key={action.id}
                                onClick={() => handleSend(action.command)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r ${CATEGORY_COLORS[action.category]} 
                                    bg-opacity-10 border border-white/10 hover:border-white/30 hover:scale-105 
                                    transition-all duration-200 group`}
                            >
                                <action.icon className="w-4 h-4 text-white/70 group-hover:text-white" />
                                <span className="text-sm text-white/80 group-hover:text-white">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map(message => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        {/* Avatar */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${message.role === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                            : 'bg-gradient-to-br from-purple-500 to-pink-500'
                            }`}>
                            {message.role === 'user' ? (
                                <User className="w-4 h-4 text-white" />
                            ) : (
                                <Bot className="w-4 h-4 text-white" />
                            )}
                        </div>

                        {/* Message Content */}
                        <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                            <div className={`inline-block px-4 py-3 rounded-2xl ${message.role === 'user'
                                ? 'bg-blue-500/20 border border-blue-500/30 text-white'
                                : 'bg-gray-800/50 border border-gray-700/50 text-gray-200'
                                }`}>
                                {message.isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                        <span className="text-gray-400">Processando...</span>
                                    </div>
                                ) : (
                                    <div
                                        className="prose prose-invert prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                                    />
                                )}
                            </div>

                            {/* Message Meta */}
                            <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${message.role === 'user' ? 'justify-end' : ''
                                }`}>
                                <span>{new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>

                                {message.intent && (
                                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                                        {message.intent.category}.{message.intent.action}
                                    </span>
                                )}

                                {message.role === 'assistant' && !message.isLoading && (
                                    <button
                                        onClick={() => handleCopy(message.content, message.id)}
                                        className="p-1 rounded hover:bg-gray-700/50 transition-colors"
                                    >
                                        {copiedId === message.id ? (
                                            <Check className="w-3 h-3 text-green-400" />
                                        ) : (
                                            <Copy className="w-3 h-3" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-4 border-t border-purple-500/20 bg-black/40 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <Command className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Digite um comando... (ex: lista contatos quentes)"
                            className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 
                                focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        onClick={() => handleSend()}
                        disabled={!inputValue.trim() || isLoading}
                        className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white 
                            hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {/* Keyboard Hint */}
                <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-600">
                    <kbd className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700">Enter</kbd>
                    <span>para enviar</span>
                    <span className="text-gray-700">•</span>
                    <span>Digite</span>
                    <kbd className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700">ajuda</kbd>
                    <span>para ver comandos</span>
                </div>
            </div>
        </div>
    );
}
