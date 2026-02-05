'use client';

import { useEffect, useState } from 'react';
import { ghostApi } from '@/services/ghost-api';
import {
    Users, Diamond, Trophy, Medal, Award, Snowflake,
    TrendingUp, Clock, MessageSquare, Target, RefreshCw,
    ChevronDown, ChevronUp, Star, Zap, ArrowRight
} from 'lucide-react';

interface LeadScore {
    contactId: string;
    contactName: string | null;
    phone: string;
    overallScore: number;
    engagementScore: number;
    intentScore: number;
    recencyScore: number;
    frequencyScore: number;
    monetaryPotential: number;
    tier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE' | 'COLD';
    buyerPersona: string;
    predictedConversionDays: number;
    factors: {
        name: string;
        value: number;
        impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
        description: string;
    }[];
    recommendations: string[];
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<LeadScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTier, setSelectedTier] = useState<string>('ALL');
    const [expandedLead, setExpandedLead] = useState<string | null>(null);

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        setLoading(true);
        try {
            // Simulating lead scoring data - in production would call API
            const mockLeads: LeadScore[] = [
                {
                    contactId: '1',
                    contactName: 'João Silva',
                    phone: '+5511999999999',
                    overallScore: 92,
                    engagementScore: 95,
                    intentScore: 88,
                    recencyScore: 100,
                    frequencyScore: 85,
                    monetaryPotential: 80,
                    tier: 'DIAMOND',
                    buyerPersona: 'Hot Buyer - Ready to purchase',
                    predictedConversionDays: 1,
                    factors: [
                        { name: 'Response Rate', value: 28, impact: 'POSITIVE', description: '93% response rate' },
                        { name: 'Buy Signals', value: 35, impact: 'POSITIVE', description: '4 buying signals detected' },
                        { name: 'Intimacy Level', value: 38, impact: 'POSITIVE', description: '95% intimacy' }
                    ],
                    recommendations: [
                        '🔥 PRIORITY: Close the sale NOW',
                        '💰 Offer exclusive deal or bonus',
                        '⏰ Create urgency - limited time offer'
                    ]
                },
                {
                    contactId: '2',
                    contactName: 'Maria Santos',
                    phone: '+5511988888888',
                    overallScore: 78,
                    engagementScore: 82,
                    intentScore: 75,
                    recencyScore: 90,
                    frequencyScore: 70,
                    monetaryPotential: 65,
                    tier: 'GOLD',
                    buyerPersona: 'Warm Prospect - Needs small push',
                    predictedConversionDays: 3,
                    factors: [
                        { name: 'Response Rate', value: 24, impact: 'POSITIVE', description: '80% response rate' },
                        { name: 'Buy Signals', value: 25, impact: 'POSITIVE', description: '2 buying signals detected' },
                        { name: 'Recency', value: 90, impact: 'POSITIVE', description: 'Interacted yesterday' }
                    ],
                    recommendations: [
                        '📞 Follow up within 24 hours',
                        '🎁 Consider discount or incentive',
                        '📝 Address any remaining objections'
                    ]
                },
                {
                    contactId: '3',
                    contactName: 'Pedro Costa',
                    phone: '+5511977777777',
                    overallScore: 55,
                    engagementScore: 60,
                    intentScore: 45,
                    recencyScore: 75,
                    frequencyScore: 50,
                    monetaryPotential: 55,
                    tier: 'SILVER',
                    buyerPersona: 'Engaged Fan - Build value first',
                    predictedConversionDays: 7,
                    factors: [
                        { name: 'Engagement', value: 60, impact: 'NEUTRAL', description: 'Good engagement level' },
                        { name: 'Intent', value: 45, impact: 'NEUTRAL', description: 'Moderate buying interest' },
                        { name: 'Recency', value: 75, impact: 'POSITIVE', description: 'Last contact 3 days ago' }
                    ],
                    recommendations: [
                        '💬 Increase engagement with value content',
                        '🤝 Build more rapport and trust',
                        '❓ Ask about their specific needs'
                    ]
                },
                {
                    contactId: '4',
                    contactName: 'Ana Lima',
                    phone: '+5511966666666',
                    overallScore: 35,
                    engagementScore: 40,
                    intentScore: 25,
                    recencyScore: 30,
                    frequencyScore: 35,
                    monetaryPotential: 50,
                    tier: 'BRONZE',
                    buyerPersona: 'New Lead - Discovery phase',
                    predictedConversionDays: 14,
                    factors: [
                        { name: 'Recency', value: 30, impact: 'NEGATIVE', description: 'Last contact 10 days ago' },
                        { name: 'Intent', value: 25, impact: 'NEGATIVE', description: 'Low buying interest' }
                    ],
                    recommendations: [
                        '📚 Send educational content',
                        '🎯 Identify their pain points',
                        '⏳ Nurture gradually, don\'t push'
                    ]
                },
                {
                    contactId: '5',
                    contactName: 'Carlos Oliveira',
                    phone: '+5511955555555',
                    overallScore: 15,
                    engagementScore: 20,
                    intentScore: 10,
                    recencyScore: 5,
                    frequencyScore: 15,
                    monetaryPotential: 40,
                    tier: 'COLD',
                    buyerPersona: 'Dormant Lead - Reactivation needed',
                    predictedConversionDays: 60,
                    factors: [
                        { name: 'Recency', value: 5, impact: 'NEGATIVE', description: 'Last contact 45 days ago' },
                        { name: 'Engagement', value: 20, impact: 'NEGATIVE', description: 'Very low engagement' }
                    ],
                    recommendations: [
                        '🔄 Consider reactivation campaign',
                        '🆕 Try different approach or message',
                        '📊 May need to qualify further'
                    ]
                }
            ];

            setLeads(mockLeads);
        } catch (error) {
            console.error('Failed to load leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTierIcon = (tier: LeadScore['tier']) => {
        const icons = {
            DIAMOND: Diamond,
            GOLD: Trophy,
            SILVER: Medal,
            BRONZE: Award,
            COLD: Snowflake
        };
        return icons[tier];
    };

    const getTierColor = (tier: LeadScore['tier']) => {
        const colors = {
            DIAMOND: 'from-cyan-400 to-blue-500',
            GOLD: 'from-yellow-400 to-amber-500',
            SILVER: 'from-gray-300 to-gray-500',
            BRONZE: 'from-orange-400 to-orange-600',
            COLD: 'from-blue-300 to-blue-500'
        };
        return colors[tier];
    };

    const getTierBorder = (tier: LeadScore['tier']) => {
        const borders = {
            DIAMOND: 'border-cyan-500/50',
            GOLD: 'border-yellow-500/50',
            SILVER: 'border-gray-500/50',
            BRONZE: 'border-orange-500/50',
            COLD: 'border-blue-500/50'
        };
        return borders[tier];
    };

    const filteredLeads = selectedTier === 'ALL'
        ? leads
        : leads.filter(l => l.tier === selectedTier);

    const tierCounts = {
        ALL: leads.length,
        DIAMOND: leads.filter(l => l.tier === 'DIAMOND').length,
        GOLD: leads.filter(l => l.tier === 'GOLD').length,
        SILVER: leads.filter(l => l.tier === 'SILVER').length,
        BRONZE: leads.filter(l => l.tier === 'BRONZE').length,
        COLD: leads.filter(l => l.tier === 'COLD').length
    };

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
                            <Users className="w-8 h-8 text-emerald-400" />
                            Lead Scoring
                        </h1>
                        <p className="text-gray-400 mt-1">Advanced lead scoring with AI-powered insights</p>
                    </div>
                    <button
                        onClick={loadLeads}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
                        <span className="text-purple-300">Refresh</span>
                    </button>
                </div>

                {/* Tier Stats */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
                    {(['ALL', 'DIAMOND', 'GOLD', 'SILVER', 'BRONZE', 'COLD'] as const).map(tier => {
                        const Icon = tier === 'ALL' ? Users : getTierIcon(tier as LeadScore['tier']);
                        const isSelected = selectedTier === tier;

                        return (
                            <button
                                key={tier}
                                onClick={() => setSelectedTier(tier)}
                                className={`p-4 rounded-xl border transition-all ${isSelected
                                        ? 'bg-white/10 border-white/30'
                                        : 'bg-black/40 border-gray-700 hover:border-gray-500'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className={`w-5 h-5 ${tier === 'DIAMOND' ? 'text-cyan-400' :
                                            tier === 'GOLD' ? 'text-yellow-400' :
                                                tier === 'SILVER' ? 'text-gray-400' :
                                                    tier === 'BRONZE' ? 'text-orange-400' :
                                                        tier === 'COLD' ? 'text-blue-400' :
                                                            'text-white'
                                        }`} />
                                    <span className="text-gray-400 text-sm">{tier}</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{tierCounts[tier]}</div>
                            </button>
                        );
                    })}
                </div>

                {/* Leads List */}
                <div className="space-y-4">
                    {filteredLeads.map(lead => (
                        <LeadCard
                            key={lead.contactId}
                            lead={lead}
                            expanded={expandedLead === lead.contactId}
                            onToggle={() => setExpandedLead(
                                expandedLead === lead.contactId ? null : lead.contactId
                            )}
                            getTierColor={getTierColor}
                            getTierBorder={getTierBorder}
                            getTierIcon={getTierIcon}
                        />
                    ))}
                </div>

                {filteredLeads.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl text-white mb-2">No leads in this tier</h3>
                        <p className="text-gray-500">Try selecting a different tier</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Lead Card Component
function LeadCard({ lead, expanded, onToggle, getTierColor, getTierBorder, getTierIcon }: {
    lead: LeadScore;
    expanded: boolean;
    onToggle: () => void;
    getTierColor: (tier: LeadScore['tier']) => string;
    getTierBorder: (tier: LeadScore['tier']) => string;
    getTierIcon: (tier: LeadScore['tier']) => any;
}) {
    const TierIcon = getTierIcon(lead.tier);

    return (
        <div className={`bg-black/40 backdrop-blur-sm border ${getTierBorder(lead.tier)} rounded-2xl overflow-hidden`}>
            {/* Main Row */}
            <div
                className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Score Circle */}
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getTierColor(lead.tier)} p-0.5`}>
                            <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">{lead.overallScore}</span>
                            </div>
                        </div>

                        {/* Info */}
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-semibold text-lg">{lead.contactName || 'Unknown'}</span>
                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded bg-gradient-to-r ${getTierColor(lead.tier)}`}>
                                    <TierIcon className="w-3 h-3 text-white" />
                                    <span className="text-xs font-bold text-white">{lead.tier}</span>
                                </div>
                            </div>
                            <div className="text-gray-500 text-sm">{lead.phone}</div>
                            <div className="text-gray-400 text-sm mt-1">{lead.buyerPersona}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Quick Stats */}
                        <div className="hidden md:flex gap-4">
                            <QuickStat icon={TrendingUp} label="Intent" value={lead.intentScore} />
                            <QuickStat icon={MessageSquare} label="Engage" value={lead.engagementScore} />
                            <QuickStat icon={Clock} label="Recency" value={lead.recencyScore} />
                        </div>

                        {/* Conversion Prediction */}
                        <div className="text-right">
                            <div className="text-white font-bold">{lead.predictedConversionDays}d</div>
                            <div className="text-gray-500 text-xs">to convert</div>
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
                    {/* Score Breakdown */}
                    <div>
                        <h4 className="text-white font-medium mb-3">Score Breakdown</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <ScoreBar label="Engagement" value={lead.engagementScore} color="blue" />
                            <ScoreBar label="Intent" value={lead.intentScore} color="green" />
                            <ScoreBar label="Recency" value={lead.recencyScore} color="purple" />
                            <ScoreBar label="Frequency" value={lead.frequencyScore} color="yellow" />
                            <ScoreBar label="Monetary" value={lead.monetaryPotential} color="emerald" />
                        </div>
                    </div>

                    {/* Factors */}
                    <div>
                        <h4 className="text-white font-medium mb-3">Key Factors</h4>
                        <div className="flex flex-wrap gap-2">
                            {lead.factors.map((factor, i) => (
                                <div
                                    key={i}
                                    className={`px-3 py-2 rounded-lg border ${factor.impact === 'POSITIVE' ? 'bg-green-500/10 border-green-500/30' :
                                            factor.impact === 'NEGATIVE' ? 'bg-red-500/10 border-red-500/30' :
                                                'bg-gray-500/10 border-gray-500/30'
                                        }`}
                                >
                                    <div className="text-white text-sm font-medium">{factor.name}</div>
                                    <div className="text-gray-400 text-xs">{factor.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                        <h4 className="text-white font-medium mb-3">Recommended Actions</h4>
                        <div className="space-y-2">
                            {lead.recommendations.map((rec, i) => (
                                <div key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                                    <ArrowRight className="w-4 h-4 text-purple-400" />
                                    {rec}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium transition-colors">
                            <MessageSquare className="w-4 h-4" />
                            Send Message
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-medium transition-colors">
                            <Zap className="w-4 h-4" />
                            Quick Action
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function QuickStat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
    return (
        <div className="text-center">
            <Icon className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <div className="text-white font-medium">{value}</div>
            <div className="text-gray-500 text-xs">{label}</div>
        </div>
    );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{label}</span>
                <span className="text-white font-medium">{value}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full bg-${color}-500 transition-all duration-1000`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}
