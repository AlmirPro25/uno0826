import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import { ContactList } from '@/components/chat/ContactList';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { ProfileView } from '@/components/chat/ProfileView';
import {
    MessageSquare, Users, Building2, Settings, Search,
    Bell, Loader2, Plus, AlertCircle
} from 'lucide-react';

interface Message {
    id: string;
    senderId: number;
    receiverId: number;
    content: string;
    type: 'text' | 'image' | 'file' | 'audio' | 'location';
    fileName?: string;
    fileSize?: number;
    imageUrl?: string;
    createdAt: Date;
    read: boolean;
    starred?: boolean;
    replyTo?: Message;
}

interface Contact {
    id: number;
    name: string;
    role: 'doctor' | 'patient' | 'clinic';
    specialty?: string;
    avatar?: string;
    online?: boolean;
    isFollowing?: boolean;
    rating?: number;
    lastSeen?: Date;
}

interface Conversation {
    id: string;
    participant: Contact;
    lastMessage?: string;
    lastMessageAt?: Date;
    unreadCount: number;
    typing?: boolean;
}

type ActiveView = 'chats' | 'contacts' | 'clinics';

export default function ChatPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuthStore();
    const { recipientId } = router.query;

    const [activeView, setActiveView] = useState<ActiveView>('chats');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [followedClinics, setFollowedClinics] = useState<Contact[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            loadData();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (recipientId && conversations.length > 0) {
            const conv = conversations.find(c => c.participant.id === Number(recipientId));
            if (conv) setSelectedConversation(conv);
        }
    }, [recipientId, conversations]);

    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.participant.id);
        }
    }, [selectedConversation]);

    const loadData = async () => {
        setLoading(true);
        setConnectionError(null);
        
        let apiError = false;
        try {
            const [convRes] = await Promise.all([
                axiosInstance.get('/chat/conversations').catch((err) => {
                    apiError = true;
                    return { data: [] };
                }),
                axiosInstance.get('/chat/contacts').catch(() => ({ data: [] }))
            ]);
            
            // Show warning if API failed
            if (apiError) {
                setConnectionError('Não foi possível conectar ao servidor. Exibindo dados de demonstração.');
            }
            
            // Transform API data or use mock
            if (convRes.data?.length > 0) {
                setConversations(convRes.data);
            } else {
                // Mock data
                setConversations([
                    {
                        id: '1',
                        participant: {
                            id: 1,
                            name: 'Dr. João Silva',
                            role: 'doctor',
                            specialty: 'Cardiologia',
                            online: true,
                            rating: 4.9
                        },
                        lastMessage: 'Como você está se sentindo hoje?',
                        lastMessageAt: new Date(),
                        unreadCount: 2
                    },
                    {
                        id: '2',
                        participant: {
                            id: 2,
                            name: 'Dra. Maria Santos',
                            role: 'doctor',
                            specialty: 'Dermatologia',
                            online: false,
                            lastSeen: new Date(Date.now() - 3600000),
                            rating: 4.8
                        },
                        lastMessage: 'Seus exames chegaram, tudo normal!',
                        lastMessageAt: new Date(Date.now() - 3600000),
                        unreadCount: 0
                    },
                    {
                        id: '3',
                        participant: {
                            id: 3,
                            name: 'Clínica São Lucas',
                            role: 'clinic',
                            specialty: 'Multiclínica',
                            rating: 4.7,
                            isFollowing: true
                        },
                        lastMessage: 'Novos horários disponíveis para agendamento',
                        lastMessageAt: new Date(Date.now() - 86400000),
                        unreadCount: 1
                    }
                ]);
            }

            // Mock contacts
            setContacts([
                { id: 1, name: 'Dr. João Silva', role: 'doctor', specialty: 'Cardiologia', online: true, rating: 4.9 },
                { id: 2, name: 'Dra. Maria Santos', role: 'doctor', specialty: 'Dermatologia', online: false, rating: 4.8 },
                { id: 4, name: 'Dr. Pedro Costa', role: 'doctor', specialty: 'Ortopedia', online: true, rating: 4.7 },
                { id: 5, name: 'Dra. Ana Paula', role: 'doctor', specialty: 'Pediatria', online: false, rating: 4.9 }
            ]);

            setFollowedClinics([
                { id: 3, name: 'Clínica São Lucas', role: 'clinic', specialty: 'Multiclínica', rating: 4.7, isFollowing: true },
                { id: 6, name: 'Hospital Santa Maria', role: 'clinic', specialty: 'Hospital Geral', rating: 4.8, isFollowing: true },
                { id: 7, name: 'Centro Médico Paulista', role: 'clinic', specialty: 'Especialidades', rating: 4.6, isFollowing: true }
            ]);
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (participantId: number) => {
        // Find conversation ID for this participant
        const conv = conversations.find(c => c.participant.id === participantId);
        
        try {
            if (conv && conv.id && !conv.id.startsWith('new-')) {
                const response = await axiosInstance.get(`/chat/conversations/${conv.id}/messages`);
                if (response.data?.length > 0) {
                    setMessages(response.data);
                    return;
                }
            }
        } catch (err) {
            // Using mock messages as fallback
        }
        
        // Mock messages for demo
        setMessages([
            {
                id: '1',
                senderId: participantId,
                receiverId: user?.id || 0,
                content: 'Olá! Como posso ajudar você hoje?',
                type: 'text',
                createdAt: new Date(Date.now() - 7200000),
                read: true
            },
            {
                id: '2',
                senderId: user?.id || 0,
                receiverId: participantId,
                content: 'Olá doutor! Tenho uma dúvida sobre minha medicação',
                type: 'text',
                createdAt: new Date(Date.now() - 7100000),
                read: true
            },
            {
                id: '3',
                senderId: participantId,
                receiverId: user?.id || 0,
                content: 'Claro! Pode me dizer qual medicação e qual sua dúvida?',
                type: 'text',
                createdAt: new Date(Date.now() - 7000000),
                read: true
            },
            {
                id: '4',
                senderId: user?.id || 0,
                receiverId: participantId,
                content: 'É sobre a Losartana. Posso tomar junto com o café da manhã?',
                type: 'text',
                createdAt: new Date(Date.now() - 6900000),
                read: true
            },
            {
                id: '5',
                senderId: participantId,
                receiverId: user?.id || 0,
                content: 'Sim, pode tomar junto com o café da manhã sem problemas. O importante é manter o horário regular todos os dias. 👍',
                type: 'text',
                createdAt: new Date(Date.now() - 6800000),
                read: true
            },
            {
                id: '6',
                senderId: participantId,
                receiverId: user?.id || 0,
                content: 'Como você está se sentindo hoje?',
                type: 'text',
                createdAt: new Date(Date.now() - 3600000),
                read: false
            }
        ]);
    };

    const handleSendMessage = async (content: string, type: Message['type'], _file?: File) => {
        if (!selectedConversation) return;

        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            senderId: user?.id || 0,
            receiverId: selectedConversation.participant.id,
            content,
            type,
            createdAt: new Date(),
            read: false
        };

        setMessages(prev => [...prev, tempMessage]);

        try {
            // Only send to API if we have a real conversation ID
            if (selectedConversation.id && !selectedConversation.id.startsWith('new-')) {
                await axiosInstance.post(`/chat/conversations/${selectedConversation.id}/messages`, {
                    content,
                    message_type: type
                });
            }
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    const handleSelectContact = (contact: Contact) => {
        // Find or create conversation
        let conv = conversations.find(c => c.participant.id === contact.id);
        if (!conv) {
            conv = {
                id: `new-${contact.id}`,
                participant: contact,
                unreadCount: 0
            };
            setConversations(prev => [conv!, ...prev]);
        }
        setSelectedConversation(conv);
        setActiveView('chats');
    };

    const handleAddContact = async (contactId: number) => {
        try {
            await axiosInstance.post(`/chat/contacts/${contactId}`);
            loadData();
        } catch (err) {
            setConnectionError('Erro ao adicionar contato');
        }
    };

    const removeContact = async (contactId: number) => {
        try {
            await axiosInstance.delete(`/chat/contacts/${contactId}`);
            setContacts(prev => prev.filter(c => c.id !== contactId));
        } catch (err) {
            setConnectionError('Erro ao remover contato');
        }
    };

    const handleFollowClinic = async (clinicId: number) => {
        try {
            await axiosInstance.post(`/clinics/${clinicId}/follow`);
            loadData();
        } catch (err) {
            console.error('Error following clinic:', err);
        }
    };

    const formatDate = (date?: Date) => {
        if (!date) return '';
        const d = new Date(date);
        const today = new Date();
        if (d.toDateString() === today.toDateString()) {
            return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    const filteredConversations = conversations.filter(c =>
        c.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Mensagens | MediSync</title>
            </Head>

            <div className="h-[calc(100vh-120px)] flex bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Sidebar */}
                <div className={`w-full md:w-96 border-r border-gray-200 dark:border-gray-700 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <MessageSquare className="w-6 h-6 text-cyan-500" />
                                Mensagens
                                {totalUnread > 0 && (
                                    <span className="px-2 py-0.5 bg-cyan-500 text-white text-xs rounded-full">
                                        {totalUnread}
                                    </span>
                                )}
                            </h1>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                    <Bell className="w-5 h-5" />
                                </button>
                                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                    <Settings className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar conversas..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* View Tabs */}
                        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                            {[
                                { key: 'chats', label: 'Conversas', icon: MessageSquare },
                                { key: 'contacts', label: 'Contatos', icon: Users },
                                { key: 'clinics', label: 'Clínicas', icon: Building2 }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveView(tab.key as ActiveView)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        activeView === tab.key
                                            ? 'bg-white dark:bg-gray-600 text-cyan-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Connection Error Banner */}
                    {connectionError && (
                        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700">
                            <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                                <AlertCircle className="w-3 h-3" />
                                {connectionError}
                            </p>
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                        {activeView === 'chats' && (
                            <>
                                {filteredConversations.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                                        <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
                                        <p>Nenhuma conversa</p>
                                        <button
                                            onClick={() => setActiveView('contacts')}
                                            className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium"
                                        >
                                            Iniciar conversa
                                        </button>
                                    </div>
                                ) : (
                                    filteredConversations.map(conv => (
                                        <button
                                            key={conv.id}
                                            onClick={() => setSelectedConversation(conv)}
                                            className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 transition-colors ${
                                                selectedConversation?.id === conv.id ? 'bg-cyan-50 dark:bg-cyan-900/20' : ''
                                            }`}
                                        >
                                            <div className="relative">
                                                {conv.participant.avatar ? (
                                                    <img
                                                        src={conv.participant.avatar}
                                                        alt=""
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                                                        conv.participant.role === 'clinic'
                                                            ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                                                            : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                                                    }`}>
                                                        {conv.participant.role === 'clinic' ? (
                                                            <Building2 className="w-6 h-6" />
                                                        ) : (
                                                            getInitials(conv.participant.name)
                                                        )}
                                                    </div>
                                                )}
                                                {conv.participant.online && (
                                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full" />
                                                )}
                                            </div>
                                            <div className="flex-1 text-left min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                                                        {conv.participant.name}
                                                    </p>
                                                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                                        {formatDate(conv.lastMessageAt)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {conv.typing ? (
                                                            <span className="text-cyan-500">digitando...</span>
                                                        ) : (
                                                            conv.lastMessage
                                                        )}
                                                    </p>
                                                    {conv.unreadCount > 0 && (
                                                        <span className="w-5 h-5 bg-cyan-500 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0 ml-2">
                                                            {conv.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </>
                        )}

                        {activeView === 'contacts' && (
                            <ContactList
                                contacts={contacts}
                                onSelectContact={handleSelectContact}
                                onAddContact={handleAddContact}
                                onRemoveContact={(id) => removeContact(id)}
                                loading={loading}
                            />
                        )}

                        {activeView === 'clinics' && (
                            <ContactList
                                contacts={followedClinics}
                                onSelectContact={handleSelectContact}
                                onFollowClinic={handleFollowClinic}
                                loading={loading}
                            />
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    {selectedConversation ? (
                        <ChatRoom
                            participant={{
                                ...selectedConversation.participant,
                                typing: selectedConversation.typing
                            }}
                            messages={messages}
                            currentUserId={user?.id || 0}
                            onSendMessage={handleSendMessage}
                            onBack={() => setSelectedConversation(null)}
                            onCall={(type) => {
                                if (type === 'video') {
                                    router.push(`/video-call/new?recipientId=${selectedConversation.participant.id}`);
                                }
                            }}
                            onViewProfile={() => setShowProfile(true)}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900/50">
                            <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                                MediSync Chat
                            </h2>
                            <p className="text-center max-w-sm mb-6">
                                Converse com seus médicos, acompanhe clínicas e receba atualizações importantes sobre sua saúde.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setActiveView('contacts')}
                                    className="px-6 py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Nova conversa
                                </button>
                                <button
                                    onClick={() => setActiveView('clinics')}
                                    className="px-6 py-2.5 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 flex items-center gap-2"
                                >
                                    <Building2 className="w-4 h-4" />
                                    Seguir clínicas
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Profile Modal */}
            <AnimatePresence>
                {showProfile && selectedConversation && (
                    <ProfileView
                        profile={{
                            ...selectedConversation.participant,
                            bio: 'Médico especialista com mais de 10 anos de experiência.',
                            totalConsultations: 1250,
                            totalPatients: 890,
                            responseTime: '< 1h',
                            crm: '123456/SP',
                            experience: 12,
                            consultationPrice: 250,
                            education: ['USP - Medicina', 'FMUSP - Residência em Cardiologia'],
                            isContact: true
                        }}
                        onClose={() => setShowProfile(false)}
                        onMessage={() => setShowProfile(false)}
                        onCall={(type) => {
                            setShowProfile(false);
                            if (type === 'video') {
                                router.push(`/video-call/new?recipientId=${selectedConversation.participant.id}`);
                            }
                        }}
                        onAddContact={() => handleAddContact(selectedConversation.participant.id)}
                        onFollow={() => handleFollowClinic(selectedConversation.participant.id)}
                        onSchedule={() => router.push(`/clinics?doctor=${selectedConversation.participant.id}`)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
