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
      // Check for configure command
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
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ Erro ao configurar provider.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
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
        content: `❌ Erro ao configurar: ${error}`,
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

  const renderMessage = (msg: Message) => {
    const isUser = msg.role === 'user';
    
    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser 
            ? 'bg-primary/20 text-primary' 
            : 'bg-gradient-to-br from-purple-500 to-cyan-500'
        }`}>
          {isUser ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4 text-white" />}
        </div>
        
        <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
          <div className={`inline-block p-4 rounded-2xl ${
            isUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted'
          }`}>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {msg.content.split('\n').map((line, i) => {
                // Handle headers
                if (line.startsWith('# ')) {
                  return <h1 key={i} className="text-xl font-bold mt-2 mb-1">{line.slice(2)}</h1>;
                }
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-lg font-semibold mt-3 mb-1">{line.slice(3)}</h2>;
                }
                // Handle code blocks
                if (line.startsWith('```')) {
                  return null; // Skip code block markers
                }
                // Handle list items
                if (line.startsWith('- ')) {
                  return <li key={i} className="ml-4">{renderInlineFormatting(line.slice(2))}</li>;
                }
                // Handle empty lines
                if (!line.trim()) {
                  return <br key={i} />;
                }
                // Regular text
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

  const renderInlineFormatting = (text: string) => {
    // Handle bold
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      // Handle inline code
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

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <button
            onClick={newConversation}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            Nova Conversa
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              className={`w-full text-left p-3 rounded-lg mb-1 hover:bg-muted transition ${
                currentConversation === conv.id ? 'bg-muted' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="truncate text-sm">{conv.title}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-muted rounded-lg hover:bg-muted/80 transition"
          >
            <Settings className="w-4 h-4" />
            Configurar IA
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">Aurora - AI Hub</h1>
              <p className="text-xs text-muted-foreground">Cérebro Central do Kernel</p>
            </div>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowProviders(!showProviders)}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm"
            >
              {PROVIDERS.find(p => p.id === selectedProvider)?.icon}
              {PROVIDERS.find(p => p.id === selectedProvider)?.name}
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showProviders && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-popover border rounded-lg shadow-lg z-10">
                {PROVIDERS.map(provider => (
                  <button
                    key={provider.id}
                    onClick={() => {
                      setSelectedProvider(provider.id);
                      setShowProviders(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition ${
                      selectedProvider === provider.id ? 'bg-muted' : ''
                    }`}
                  >
                    <span>{provider.icon}</span>
                    <span>{provider.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(renderMessage)}
          
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <div className="bg-muted rounded-2xl p-4">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
              className="flex-1 resize-none bg-muted rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-background rounded-2xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Configurar AI Provider</h2>
                <button onClick={() => setShowSettings(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Provider</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PROVIDERS.map(provider => (
                      <button
                        key={provider.id}
                        onClick={() => setSelectedProvider(provider.id)}
                        className={`p-3 rounded-lg border-2 transition ${
                          selectedProvider === provider.id 
                            ? 'border-primary bg-primary/10' 
                            : 'border-muted hover:border-muted-foreground'
                        }`}
                      >
                        <div className="text-2xl mb-1">{provider.icon}</div>
                        <div className="text-xs">{provider.name.split(' ')[0]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Key className="w-4 h-4 inline mr-1" />
                    API Key
                  </label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={`Cole sua ${selectedProvider} API key aqui`}
                    className="w-full px-4 py-3 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="p-3 bg-muted rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 inline mr-1 text-amber-500" />
                  Sua API key é criptografada e armazenada de forma segura.
                </div>

                <button
                  onClick={configureProvider}
                  disabled={configuring || !apiKeyInput.trim()}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {configuring ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Configurando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Configurar Provider
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
