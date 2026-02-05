'use client';

import { useEffect, useState } from 'react';
import { ghostApi, HuntingTarget } from '@/services/ghost-api';
import {
    Zap, Target, MessageSquare, TrendingUp,
    Play, Pause, RefreshCw, ChevronRight,
    Users, Clock, AlertCircle, Bot, Filter
} from 'lucide-react';

interface Campaign {
    id: string;
    name: string;
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    type: string;
    targetCount: number;
    sentCount: number;
    responseRate: number;
    lastRun?: string;
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [targets, setTargets] = useState<HuntingTarget[]>([]);
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [campRes, targetsRes] = await Promise.all([
                ghostApi.leads.getCampaigns(),
                ghostApi.operations.getHuntingTargets()
            ]);
            const campData = campRes.data;
            const targetData = targetsRes.data?.targets;
            setCampaigns(Array.isArray(campData) ? campData : []);
            setTargets(Array.isArray(targetData) ? targetData : []);
        } catch (error) {
            console.error('Failed to load campaigns:', error);
            // Mock data
            setCampaigns([
                {
                    id: 'camp_1',
                    name: 'Reativação Janeiro',
                    status: 'ACTIVE',
                    type: 'WARM_REACTIVATION',
                    targetCount: 150,
                    sentCount: 45,
                    responseRate: 28.5,
                    lastRun: new Date().toISOString()
                },
                {
                    id: 'camp_2',
                    name: 'Upsell Leads Quentes',
                    status: 'PAUSED',
                    type: 'HOT_CONVERSION',
                    targetCount: 50,
                    sentCount: 12,
                    responseRate: 42.0,
                    lastRun: new Date(Date.now() - 86400000).toISOString()
                }
            ]);
            setTargets([
                { contactId: '1', name: 'João Silva', intimacyLevel: 85, daysSinceContact: 4, salesReadiness: 70, reason: 'VIP íntimo', suggestedOpener: 'Oi João, sumiu?', priority: 'HIGH' },
                { contactId: '2', name: 'Maria Santos', intimacyLevel: 45, daysSinceContact: 12, salesReadiness: 30, reason: '12 dias sem contato', suggestedOpener: 'Oi Maria!', priority: 'MEDIUM' },
                { contactId: '3', name: 'Pedro Costa', intimacyLevel: 92, daysSinceContact: 2, salesReadiness: 85, reason: 'Alta prontidão de compra', suggestedOpener: 'E aí Pedro!', priority: 'HIGH' }
            ] as HuntingTarget[]);
        } finally {
            setLoading(false);
        }
    };

    const runCampaign = async (id: string, dryRun = true) => {
        setExecuting(id);
        try {
            await ghostApi.leads.executeCampaign(id, dryRun);
            alert(dryRun ? 'Dry run completed! Check logs for projected outcomes.' : 'Campaign started!');
            loadData();
        } catch (error) {
            alert('Operation failed. Check Hunter service status.');
        } finally {
            setExecuting(null);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Initializing Hunter Engine...</div>;
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon={Zap} label="Active Campaigns" value={campaigns.filter(c => c.status === 'ACTIVE').length} color="purple" />
                <StatCard icon={Target} label="Hunting Targets" value={targets.length} color="blue" />
                <StatCard icon={TrendingUp} label="Avg Response Rate" value="32.4%" color="green" />
                <StatCard icon={MessageSquare} label="Sent Today" value="128" color="orange" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Campaigns List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Zap className="w-6 h-6 text-purple-400" />
                            Hunter Campaigns
                        </h2>
                        <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-bold transition-colors">
                            New Campaign
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {campaigns.map(camp => (
                            <div key={camp.id} className="bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-purple-500/30 transition-colors group">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-white font-bold text-lg">{camp.name}</h3>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${camp.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {camp.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-sm">{camp.type.replace(/_/g, ' ')}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => runCampaign(camp.id, true)}
                                            disabled={executing === camp.id}
                                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
                                            title="Dry Run"
                                        >
                                            <RefreshCw className={`w-5 h-5 ${executing === camp.id ? 'animate-spin' : ''}`} />
                                        </button>
                                        <button
                                            onClick={() => runCampaign(camp.id, false)}
                                            disabled={executing === camp.id || camp.status === 'PAUSED'}
                                            className="p-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white transition-colors"
                                        >
                                            <Play className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                        <div className="text-gray-500 text-xs">Progress</div>
                                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 transition-all duration-1000"
                                                style={{ width: `${(camp.sentCount / camp.targetCount) * 100}%` }}
                                            />
                                        </div>
                                        <div className="text-white text-xs mt-1">{camp.sentCount} / {camp.targetCount}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-gray-500 text-xs">Response Rate</div>
                                        <div className="text-green-400 font-bold">{camp.responseRate}%</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-gray-500 text-xs">Last Active</div>
                                        <div className="text-gray-300 text-xs">{camp.lastRun ? new Date(camp.lastRun).toLocaleDateString() : 'Never'}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hunting Targets (Next in Queue) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Target className="w-6 h-6 text-blue-400" />
                            Next Targets
                        </h2>
                        <button className="text-gray-500 hover:text-white transition-colors">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
                        <div className="max-h-[600px] overflow-y-auto">
                            {targets.map(target => (
                                <div key={target.contactId} className="p-4 border-b border-gray-700/30 hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                                            {(target.name || 'U')[0]}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-white font-medium text-sm">{target.name || 'Unknown'}</div>
                                            <div className="text-gray-500 text-[10px] flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {target.daysSinceContact} days silent
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-blue-400 font-bold text-sm">{target.intimacyLevel}%</div>
                                            <div className="text-gray-600 text-[10px]">Intimacy</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded border border-blue-500/20">
                                            {target.priority}
                                        </span>
                                        <button className="text-gray-500 group-hover:text-purple-400 transition-colors">
                                            <Bot className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-black/20 text-center">
                            <button className="text-gray-400 text-sm hover:text-white transition-colors flex items-center gap-2 mx-auto">
                                View Intelligence Report
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: {
    icon: any;
    label: string;
    value: string | number;
    color: string;
}) {
    return (
        <div className="bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-5 hover:border-purple-500/30 transition-colors">
            <div className={`w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 text-${color}-400`} />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-gray-500 text-xs">{label}</div>
        </div>
    );
}
