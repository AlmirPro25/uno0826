'use client';

import { useEffect, useState } from 'react';
import { ghostApi, Contact } from '@/services/ghost-api';
import {
    Users, Search, Filter, RefreshCw, MessageSquare,
    Pause, Play, Target, AlertTriangle, Heart, Clock,
    TrendingUp, ChevronDown, ChevronUp, MoreVertical,
    Phone, Calendar, Star, Send
} from 'lucide-react';

// Use the imported Contact type instead of local interface

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
    const [sortBy, setSortBy] = useState<'recent' | 'intimacy' | 'sales'>('recent');
    const [expandedContact, setExpandedContact] = useState<string | null>(null);

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        setLoading(true);
        try {
            const res = await ghostApi.contacts.list();
            setContacts(res.data?.contacts || []);
        } catch (error) {
            console.error('Failed to load contacts:', error);
            // Mock data for demo
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
                    activeDirective: 'fechar venda',
                    directiveStatus: 'EXECUTING'
                },
                {
                    id: '5511988888888@c.us',
                    name: 'Maria Santos',
                    pushName: 'Mari',
                    profilePicUrl: null,
                    isPaused: false,
                    lastInteraction: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
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

    const togglePause = async (contactId: string, currentPaused: boolean) => {
        try {
            await ghostApi.contacts.control(contactId.replace('@c.us', ''),
                currentPaused ? 'resume' : 'pause'
            );
            loadContacts();
        } catch (error) {
            console.error('Failed to toggle pause:', error);
        }
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

    const getTimeSince = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    // Filter and sort contacts
    const filteredContacts = contacts
        .filter(c => {
            if (filterStatus === 'ACTIVE' && c.isPaused) return false;
            if (filterStatus === 'PAUSED' && !c.isPaused) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    c.name?.toLowerCase().includes(query) ||
                    c.pushName?.toLowerCase().includes(query) ||
                    c.id.includes(query)
                );
            }
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'intimacy') return b.intimacyLevel - a.intimacyLevel;
            if (sortBy === 'sales') return b.salesReadiness - a.salesReadiness;
            return new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime();
        });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Users className="w-8 h-8 text-blue-400" />
                            Contacts
                        </h1>
                        <p className="text-gray-400 mt-1">{contacts.length} contacts total</p>
                    </div>
                    <button
                        onClick={loadContacts}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
                        <span className="text-purple-300">Refresh</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2">
                        {(['ALL', 'ACTIVE', 'PAUSED'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-lg transition-all ${filterStatus === status
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-black/40 text-gray-400 hover:bg-black/60'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-4 py-2 bg-black/40 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    >
                        <option value="recent">Most Recent</option>
                        <option value="intimacy">Highest Intimacy</option>
                        <option value="sales">Sales Ready</option>
                    </select>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        icon={Users}
                        label="Total Contacts"
                        value={contacts.length.toString()}
                        color="blue"
                    />
                    <StatCard
                        icon={Play}
                        label="Active"
                        value={contacts.filter(c => !c.isPaused).length.toString()}
                        color="green"
                    />
                    <StatCard
                        icon={Heart}
                        label="High Intimacy"
                        value={contacts.filter(c => c.intimacyLevel > 70).length.toString()}
                        color="pink"
                    />
                    <StatCard
                        icon={Target}
                        label="Sales Ready"
                        value={contacts.filter(c => c.salesReadiness > 70).length.toString()}
                        color="yellow"
                    />
                </div>

                {/* Contacts List */}
                <div className="space-y-3">
                    {filteredContacts.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl text-white mb-2">No contacts found</h3>
                            <p className="text-gray-500">Try adjusting your filters</p>
                        </div>
                    ) : (
                        filteredContacts.map(contact => (
                            <ContactCard
                                key={contact.id}
                                contact={contact}
                                expanded={expandedContact === contact.id}
                                onToggle={() => setExpandedContact(
                                    expandedContact === contact.id ? null : contact.id
                                )}
                                onTogglePause={() => togglePause(contact.id, contact.isPaused)}
                                getEmotionEmoji={getEmotionEmoji}
                                getTimeSince={getTimeSince}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// Contact Card Component
function ContactCard({
    contact,
    expanded,
    onToggle,
    onTogglePause,
    getEmotionEmoji,
    getTimeSince
}: {
    contact: Contact;
    expanded: boolean;
    onToggle: () => void;
    onTogglePause: () => void;
    getEmotionEmoji: (emotion: string) => string;
    getTimeSince: (date: string) => string;
}) {
    return (
        <div className={`bg-black/40 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden ${contact.isPaused ? 'opacity-60' : ''
            }`}>
            {/* Main Row */}
            <div
                className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {(contact.name || contact.pushName || '?')[0].toUpperCase()}
                        </div>

                        {/* Info */}
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-medium">
                                    {contact.name || contact.pushName || 'Unknown'}
                                </span>
                                <span className="text-xl">{getEmotionEmoji(contact.emotionalState)}</span>
                                {contact.isPaused && (
                                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">
                                        PAUSED
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-gray-500 text-sm">
                                <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {contact.id.replace('@c.us', '')}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {getTimeSince(contact.lastInteraction)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Quick Stats */}
                        <div className="hidden md:flex gap-4">
                            <div className="text-center">
                                <div className="flex items-center gap-1">
                                    <Heart className="w-4 h-4 text-pink-400" />
                                    <span className="text-white font-medium">{contact.intimacyLevel}%</span>
                                </div>
                                <div className="text-gray-500 text-xs">Intimacy</div>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center gap-1">
                                    <Target className="w-4 h-4 text-green-400" />
                                    <span className="text-white font-medium">{contact.salesReadiness}%</span>
                                </div>
                                <div className="text-gray-500 text-xs">Sales</div>
                            </div>
                        </div>

                        {/* Expand Icon */}
                        {expanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="border-t border-gray-700/50 p-4 space-y-4">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricBar label="Intimacy" value={contact.intimacyLevel} color="pink" />
                        <MetricBar label="Trust" value={contact.trustLevel} color="blue" />
                        <MetricBar label="Engagement" value={contact.engagementScore} color="purple" />
                        <MetricBar label="Sales Ready" value={contact.salesReadiness} color="green" />
                    </div>

                    {/* Info Row */}
                    <div className="flex flex-wrap gap-3">
                        <div className="px-3 py-2 bg-gray-800/50 rounded-lg">
                            <span className="text-gray-500 text-sm">Emotion: </span>
                            <span className="text-white">{contact.emotionalState}</span>
                        </div>
                        <div className="px-3 py-2 bg-gray-800/50 rounded-lg">
                            <span className="text-gray-500 text-sm">Tone: </span>
                            <span className="text-white capitalize">{contact.lastTone}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onTogglePause}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${contact.isPaused
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-orange-500 hover:bg-orange-600 text-white'
                                }`}
                        >
                            {contact.isPaused ? (
                                <><Play className="w-4 h-4" /> Resume AI</>
                            ) : (
                                <><Pause className="w-4 h-4" /> Pause AI</>
                            )}
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium transition-colors">
                            <MessageSquare className="w-4 h-4" />
                            View Chat
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium transition-colors">
                            <Send className="w-4 h-4" />
                            Send Message
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: {
    icon: any;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <div className={`bg-${color}-500/10 border border-${color}-500/30 rounded-xl p-4`}>
            <Icon className={`w-5 h-5 text-${color}-400 mb-2`} />
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-gray-500 text-sm">{label}</div>
        </div>
    );
}

function MetricBar({ label, value, color }: {
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">{label}</span>
                <span className="text-white font-medium">{value}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full bg-${color}-500 transition-all duration-500`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}
