import { useState, useCallback } from 'react';
import { Search, Phone, Video, MoreVertical, Send, Mic, Image, ArrowLeft, Shield, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useP2PStore } from '@/stores/p2pStore';
import { useToast } from '@/components/ui/Toast';

// ============================================================================
// Messages Page - Chat P2P com suporte a chamadas de vídeo
// ============================================================================

interface Conversation {
  id: string;
  name: string;
  peerId: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  isOnline: boolean;
  isEncrypted: boolean;
}

interface Message {
  id: string;
  content: string;
  sender: 'me' | 'them';
  timestamp: Date;
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    name: 'CyberNinja',
    peerId: '12D3KooW...abc',
    lastMessage: 'Vamos testar a chamada de voz?',
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    unread: 2,
    isOnline: true,
    isEncrypted: true,
  },
  {
    id: '2',
    name: 'NeonHacker',
    peerId: '12D3KooW...xyz',
    lastMessage: 'O código tá pronto, manda o PR',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    unread: 0,
    isOnline: true,
    isEncrypted: true,
  },
  {
    id: '3',
    name: 'DataPhantom',
    peerId: '12D3KooW...def',
    lastMessage: 'Beleza, amanhã a gente continua',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    unread: 0,
    isOnline: false,
    isEncrypted: true,
  },
];

const mockMessages: Message[] = [
  { id: '1', content: 'E aí, tudo certo?', sender: 'them', timestamp: new Date(Date.now() - 1000 * 60 * 10) },
  { id: '2', content: 'Tudo sim! Testando o Nexus aqui', sender: 'me', timestamp: new Date(Date.now() - 1000 * 60 * 9) },
  { id: '3', content: 'Muito bom! A conexão P2P tá estável?', sender: 'them', timestamp: new Date(Date.now() - 1000 * 60 * 8) },
  { id: '4', content: 'Sim, latência baixíssima. WebRTC funcionando perfeitamente', sender: 'me', timestamp: new Date(Date.now() - 1000 * 60 * 7) },
  { id: '5', content: 'Vamos testar a chamada de voz?', sender: 'them', timestamp: new Date(Date.now() - 1000 * 60 * 2) },
];

export function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { connectedPeers, localPeerId, startCall } = useP2PStore();
  const toast = useToast();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    setIsSending(true);
    
    // Simulate sending
    await new Promise(r => setTimeout(r, 300));
    
    const msg: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'me',
      timestamp: new Date(),
    };
    
    setMessages([...messages, msg]);
    setNewMessage('');
    setIsSending(false);
  };

  // Iniciar chamada de vídeo
  const handleStartVideoCall = useCallback(() => {
    if (!selectedConversation || !localPeerId) {
      toast.error('Erro', 'Selecione uma conversa primeiro');
      return;
    }
    startCall('video', selectedConversation.peerId);
    toast.info('Iniciando chamada...', 'Conectando via P2P');
  }, [selectedConversation, localPeerId, startCall, toast]);

  // Iniciar chamada de áudio
  const handleStartAudioCall = useCallback(() => {
    if (!selectedConversation || !localPeerId) {
      toast.error('Erro', 'Selecione uma conversa primeiro');
      return;
    }
    startCall('audio', selectedConversation.peerId);
    toast.info('Iniciando chamada...', 'Conectando via P2P');
  }, [selectedConversation, localPeerId, startCall, toast]);

  // Chat View
  if (selectedConversation) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Chat Header */}
        <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedConversation(null)}
              className="p-2 -ml-2 rounded-lg hover:bg-white/10"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400/50 to-purple-500/50 flex items-center justify-center relative">
              <span className="font-bold">{selectedConversation.name[0]}</span>
              {selectedConversation.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0d0d15]" />
              )}
            </div>
            <div>
              <p className="font-semibold text-sm flex items-center gap-1.5">
                {selectedConversation.name}
                {selectedConversation.isEncrypted && (
                  <Shield size={12} className="text-emerald-400" />
                )}
              </p>
              <p className="text-xs text-gray-500">
                {selectedConversation.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={handleStartAudioCall}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors"
              title="Chamada de voz"
            >
              <Phone size={20} />
            </button>
            <button 
              onClick={handleStartVideoCall}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors"
              title="Chamada de vídeo"
            >
              <Video size={20} />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Encryption Notice */}
          <div className="flex justify-center mb-4">
            <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <Shield size={12} className="text-emerald-400" />
              <span className="text-xs text-emerald-400">Criptografia ponta-a-ponta</span>
            </div>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.sender === 'me' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] px-4 py-2.5 rounded-2xl",
                  msg.sender === 'me'
                    ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-br-md"
                    : "bg-white/10 text-white rounded-bl-md"
                )}
              >
                <p className="text-sm">{msg.content}</p>
                <p className={cn(
                  "text-[10px] mt-1",
                  msg.sender === 'me' ? "text-white/70" : "text-gray-500"
                )}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 bg-white/5 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
              <Image size={20} />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Mensagem criptografada..."
              className="flex-1 bg-white/10 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder-gray-500"
            />
            {newMessage.trim() ? (
              <button 
                onClick={handleSend}
                disabled={isSending}
                className="p-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
              >
                {isSending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            ) : (
              <button className="p-2.5 rounded-full bg-white/10 text-gray-400">
                <Mic size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Conversations List
  return (
    <div className="max-w-lg mx-auto">
      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conversas..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-cyan-500/50 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Online Now */}
      {connectedPeers.length > 0 && (
        <div className="px-4 py-2">
          <p className="text-xs text-gray-500 mb-2">ONLINE AGORA</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {connectedPeers.slice(0, 5).map((peer, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400/50 to-purple-500/50 flex items-center justify-center relative">
                  <span className="text-sm font-bold">{peer.Nickname?.[0] || 'P'}</span>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0d0d15]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversations */}
      <div className="px-4">
        <p className="text-xs text-gray-500 mb-2">MENSAGENS</p>
        <div className="space-y-1">
          {mockConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className="w-full p-3 rounded-xl hover:bg-white/5 flex items-center gap-3 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400/50 to-purple-500/50 flex items-center justify-center relative flex-shrink-0">
                <span className="font-bold">{conv.name[0]}</span>
                {conv.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0d0d15]" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm flex items-center gap-1.5">
                    {conv.name}
                    {conv.isEncrypted && <Shield size={12} className="text-emerald-400" />}
                  </p>
                  <span className="text-xs text-gray-500">{formatTime(conv.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-400 truncate">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">{conv.unread}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {mockConversations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <MessageSquare size={32} className="text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhuma conversa</h3>
          <p className="text-sm text-gray-500">
            Conecte-se a outros peers na mesh para começar a conversar
          </p>
        </div>
      )}
    </div>
  );
}
