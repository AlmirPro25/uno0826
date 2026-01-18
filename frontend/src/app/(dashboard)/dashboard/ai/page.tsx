'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, Sparkles, Settings, Plus,
  Trash2, MessageSquare, Loader2, Copy, Check,
  Zap, Brain, Terminal, ChevronDown, X,
  Key, AlertCircle
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  provider?: string;
  model?: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: Date;
}

const PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini', icon: '🔮', color: 'from-blue-500 to-purple-500' },
  { id: 'openai', name: 'OpenAI GPT', icon: '🤖', color: 'from-emerald-500 to-teal-500' },
  { id: 'anthropic', name: 'Anthropic Claude', icon: '🧠', color: 'from-orange-500 to-red-500' },
];

export default function AIHubPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [copied, setCopied] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [configuring, setConfiguring] = useState(false);

  // Novo estado para controlar o sidebar do chat
  const [chatSidebarOpen, setChatSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Load conversations
    loadConversations();

    // Add welcome message
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `# 🧠 Aurora - AI Hub Central

Olá! Eu sou a **Aurora**, o cérebro central do PROST-QS Kernel.

## O que posso fazer por você:

- 📊 **Ver telemetria** em tempo real
- 🔑 **Gerar API keys** automaticamente  
- 📋 **Ver logs e alertas** do sistema
- ⚡ **Criar regras** de automação
- 💰 **Ver status de billing**
- 🚨 **Executar killswitch** de emergência

## Comandos rápidos:

- \`configure gemini <sua_api_key>\` - Configurar provider
- \`status\` - Ver saúde do sistema
- \`alertas\` - Ver alertas ativos
- \`gerar chave\` - Criar nova API key

Como posso ajudar?`,
        timestamp: new Date(),
        provider: 'system',
      }]);
    }
  }, []);

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/v1/ai/conversations', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      if (input.toLowerCase().startsWith('configure ')) {
        await handleConfigureCommand(input);
        return;
      }

      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: input,
          conversation_id: currentConversation,
          provider: selectedProvider,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get response');
      }

      const data = await res.json();

      const assistantMessage: Message = {
        id: data.message?.id || Date.now().toString(),
        role: 'assistant',
        content: data.message?.content || 'Desculpe, não consegui processar sua mensagem.',
        timestamp: new Date(),
        provider: data.provider,
        model: data.model,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.conversation_id && !currentConversation) {
        setCurrentConversation(data.conversation_id);
        loadConversations();
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ Erro ao processar mensagem. Verifique se o provider está configurado corretamente.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureCommand = async (command: string) => {
    try {
      const res = await fetch('/api/v1/ai/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ command }),
      });

      const data = await res.json();

      const responseMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: res.ok
          ? `✅ ${data.message}\n\nProvider: **${data.provider}**\nModel: **${data.model || 'default'}**`
          : `❌ Erro: ${data.error}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, responseMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ Erro ao configurar provider.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const configureProvider = async () => {
    if (!apiKeyInput.trim()) return;

    setConfiguring(true);
    try {
      const res = await fetch('/api/v1/ai/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          provider: selectedProvider,
          api_key: apiKeyInput,
          is_default: true,
        }),
      });

      if (res.ok) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ Provider **${selectedProvider}** configurado com sucesso! Agora você pode conversar comigo.`,
          timestamp: new Date(),
        }]);
        setApiKeyInput('');
        setShowSettings(false);
      } else {
        const data = await res.json();
        throw new Error(data.error);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Erro ao configurar: ${error as string}`,
        timestamp: new Date(),
      }]);
    } finally {
      setConfiguring(false);
    }
  };

  const newConversation = () => {
    setCurrentConversation(null);
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: '🆕 Nova conversa iniciada! Como posso ajudar?',
      timestamp: new Date(),
    }]);
  };

  const loadConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/ai/conversations/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const conv = await res.json();
        setCurrentConversation(id);
        setMessages(conv.messages || []);
      }
    } catch (e) {
      console.error('Failed to load conversation:', e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.includes('`')) {
        const codeParts = part.split(/(`[^`]+`)/g);
        return codeParts.map((cp, j) => {
          if (cp.startsWith('`') && cp.endsWith('`')) {
            return <code key={j} className="px-1 py-0.5 bg-black/20 rounded text-sm">{cp.slice(1, -1)}</code>;
          }
          return cp;
        });
      }
      return part;
    });
  };

  const renderMessage = (msg: Message) => {
    const isUser = msg.role === 'user';

    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner ${isUser
          ? 'bg-primary/20 text-primary'
          : 'bg-gradient-to-br from-indigo-500 to-cyan-500'
          }`}>
          {isUser ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4 text-white" />}
        </div>

        <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
          <div className={`inline-block p-4 rounded-2xl shadow-sm ${isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground border border-border/50'
            }`}>
            <div className="prose prose-sm dark:prose-invert max-w-none text-left">
              {msg.content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-2 mb-1">{line.slice(2)}</h1>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold mt-3 mb-1">{line.slice(3)}</h2>;
                if (line.startsWith('```')) return null;
                if (line.startsWith('- ')) return <li key={i} className="ml-4">{renderInlineFormatting(line.slice(2))}</li>;
                if (!line.trim()) return <br key={i} />;
                return <p key={i} className="my-1">{renderInlineFormatting(line)}</p>;
              })}
            </div>
          </div>

          {!isUser && msg.provider && (
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>{msg.provider}</span>
              {msg.model && <span>• {msg.model}</span>}
              <button
                onClick={() => copyToClipboard(msg.content, msg.id)}
                className="p-1 hover:bg-muted rounded"
              >
                {copied === msg.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] glass-panel overflow-hidden">

      {/* Sidebar Toggle Button (Floating when closed) */}
      {!chatSidebarOpen && (
        <button
          onClick={() => setChatSidebarOpen(true)}
          className="absolute left-4 top-20 z-10 p-2 bg-card border border-border shadow-md rounded-lg text-muted-foreground hover:text-foreground transition-all"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}

      {/* Conversations Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: chatSidebarOpen ? 280 : 0, opacity: chatSidebarOpen ? 1 : 0 }}
        className="border-r border-border bg-card/50 flex flex-col overflow-hidden"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="font-semibold text-sm">Histórico</span>
          <button
            onClick={() => setChatSidebarOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={newConversation}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition shadow-sm text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nova Conversa
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 custom-scrollbar">
          {conversations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs">
              Nenhuma conversa recente.
            </div>
          )}
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              className={`w-full text-left p-3 rounded-lg hover:bg-muted/50 transition flex items-center gap-3 group ${currentConversation === conv.id ? 'bg-muted border border-border/50' : 'border border-transparent'
                }`}
            >
              <MessageSquare className={`w-4 h-4 flex-shrink-0 ${currentConversation === conv.id ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="truncate text-sm text-foreground/80 group-hover:text-foreground">{conv.title}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-border bg-card/30">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 py-2 px-3 text-muted-foreground hover:bg-muted/50 rounded-lg transition text-sm"
          >
            <Settings className="w-4 h-4" />
            Configurações
          </button>
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background/30 relative min-w-0">
        {/* Chat Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            {!chatSidebarOpen && (
              <button onClick={() => setChatSidebarOpen(true)} className="mr-2 md:hidden">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/10">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">Aurora AI</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Online</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProviders(!showProviders)}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 hover:bg-muted border border-border rounded-lg text-xs font-medium transition-colors"
            >
              <span className="text-base">{PROVIDERS.find(p => p.id === selectedProvider)?.icon}</span>
              <span className="hidden sm:inline">{PROVIDERS.find(p => p.id === selectedProvider)?.name}</span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>

            <AnimatePresence>
              {showProviders && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-56 glass-panel z-20 overflow-hidden"
                >
                  <div className="p-1">
                    <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Selecionar modelo</div>
                    {PROVIDERS.map(provider => (
                      <button
                        key={provider.id}
                        onClick={() => {
                          setSelectedProvider(provider.id);
                          setShowProviders(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${selectedProvider === provider.id
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted text-foreground'
                          }`}
                      >
                        <span className="text-lg">{provider.icon}</span>
                        <span className="font-medium">{provider.name}</span>
                        {selectedProvider === provider.id && <Check className="w-3.5 h-3.5 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
          {messages.map(renderMessage)}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4 max-w-3xl"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <div className="bg-muted/50 rounded-2xl rounded-tl-none p-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Floating Glass */}
        <div className="p-4 md:p-6">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
            <div className="relative glass-card flex items-end gap-2 p-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte algo para a Aurora..."
                className="flex-1 max-h-32 min-h-[50px] bg-transparent border-0 focus:ring-0 px-4 py-3 placeholder:text-muted-foreground text-sm resize-none"
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="mb-1 p-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <div className="relative">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </div>
              </button>
            </div>
            <div className="text-center mt-2">
              <p className="text-[10px] text-muted-foreground font-medium">
                Aurora pode cometer erros. Verifique informações importantes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal (Overlay) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border/50 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center justify-between mb-6 relative">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Configurações
                </h2>
                <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 relative">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Escolha o Provedor</label>
                  <div className="grid grid-cols-3 gap-3">
                    {PROVIDERS.map(provider => (
                      <button
                        key={provider.id}
                        onClick={() => setSelectedProvider(provider.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${selectedProvider === provider.id
                          ? 'border-primary bg-primary/5 shadow-sm scale-[1.02]'
                          : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                          }`}
                      >
                        <span className="text-2xl mb-2 filter drop-shadow-sm">{provider.icon}</span>
                        <span className="text-[10px] font-bold uppercase">{provider.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    Chave de API
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder={`Cole a chave da ${selectedProvider}...`}
                      className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm placeholder:text-muted-foreground/50 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-600 dark:text-amber-400 flex gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>Sua chave é salva localmente e criptografada. Nunca compartilhamos seus dados.</p>
                </div>

                <button
                  onClick={configureProvider}
                  disabled={configuring || !apiKeyInput.trim()}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {configuring ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Salvar Configuração
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
