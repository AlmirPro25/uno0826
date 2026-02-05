'use client';

import { useEffect, useState } from 'react';
import { ghostApi, DailyMetrics, ConversionMetrics } from '@/services/ghost-api';
import {
    BarChart3, TrendingUp, Users, MessageSquare, Brain,
    Clock, Target, Zap, Download, RefreshCw, ArrowUp, ArrowDown
} from 'lucide-react';

interface ContactRanking {
    contactId: string;
    name: string | null;
    score: number;
    intimacyLevel: number;
    salesReadiness: number;
    messageCount: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
}

interface PeakHour {
    hour: number;
    messageCount: number;
}

interface Keyword {
    word: string;
    count: number;
}

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [today, setToday] = useState<DailyMetrics | null>(null);
    const [conversion, setConversion] = useState<ConversionMetrics | null>(null);
    const [performance, setPerformance] = useState<any>(null);
    const [topContacts, setTopContacts] = useState<ContactRanking[]>([]);
    const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
    const [keywords, setKeywords] = useState<Keyword[]>([]);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const [todayRes, convRes, perfRes, rankRes, peakRes, keyRes] = await Promise.all([
                ghostApi.analytics.getToday(),
                ghostApi.analytics.getConversion(),
                ghostApi.analytics.getPerformance(),
                ghostApi.analytics.getContactRanking(10),
                ghostApi.analytics.getPeakHours(),
                ghostApi.analytics.getKeywords(15)
            ]);

            setToday(todayRes.data?.metrics || null);
            setConversion(convRes.data?.metrics || null);
            setPerformance(perfRes.data?.metrics);
            setTopContacts(rankRes.data?.ranking || []);
            setPeakHours(peakRes.data?.peakHours || []);
            setKeywords(keyRes.data?.keywords || []);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportMetrics = async () => {
        const res = await ghostApi.analytics.exportMetrics();
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ghost-protocol-metrics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
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
                            <BarChart3 className="w-8 h-8 text-blue-400" />
                            Analytics Dashboard
                        </h1>
                        <p className="text-gray-400 mt-1">Real-time metrics and insights</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={loadAnalytics}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-4 h-4 text-purple-400" />
                            <span className="text-purple-300">Refresh</span>
                        </button>
                        <button
                            onClick={exportMetrics}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-colors"
                        >
                            <Download className="w-4 h-4 text-blue-400" />
                            <span className="text-blue-300">Export</span>
                        </button>
                    </div>
                </div>

                {/* Today's Stats */}
                {today && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        <MetricCard icon={MessageSquare} label="Messages In" value={today.messagesReceived} color="blue" />
                        <MetricCard icon={Zap} label="AI Responses" value={today.aiResponses} color="purple" />
                        <MetricCard icon={Users} label="Human Help" value={today.humanInterventions} color="orange" />
                        <MetricCard icon={Target} label="Active Contacts" value={today.contactsActive} color="green" />
                        <MetricCard icon={Brain} label="Risk Alerts" value={today.riskAlertsCount} color="red" />
                    </div>
                )}

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Conversion Funnel */}
                    {conversion && (
                        <div className="bg-black/40 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                                Conversion Funnel
                            </h3>
                            <div className="space-y-4">
                                <FunnelRow label="Cold" value={conversion.byStage.cold} total={conversion.totalContacts} color="bg-blue-500" />
                                <FunnelRow label="Warm" value={conversion.byStage.warm} total={conversion.totalContacts} color="bg-yellow-500" />
                                <FunnelRow label="Hot" value={conversion.byStage.hot} total={conversion.totalContacts} color="bg-orange-500" />
                                <FunnelRow label="Converted" value={conversion.byStage.converted} total={conversion.totalContacts} color="bg-green-500" />
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Conversion Rate</span>
                                    <span className="text-3xl font-bold text-green-400">{conversion.conversionRate}%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Peak Hours */}
                    <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-purple-400" />
                            Peak Activity Hours
                        </h3>
                        <div className="flex items-end justify-between h-40 gap-1">
                            {Array.from({ length: 24 }, (_, i) => {
                                const hour = peakHours.find(h => h.hour === i);
                                const maxCount = Math.max(...peakHours.map(h => h.messageCount), 1);
                                const height = hour ? (hour.messageCount / maxCount) * 100 : 5;

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                        <div
                                            className={`w-full rounded-t transition-all ${hour && hour.messageCount > maxCount * 0.7
                                                    ? 'bg-purple-500'
                                                    : 'bg-purple-500/30'
                                                }`}
                                            style={{ height: `${height}%` }}
                                            title={`${i}:00 - ${hour?.messageCount || 0} messages`}
                                        />
                                        {i % 4 === 0 && (
                                            <span className="text-gray-500 text-[10px]">{i}h</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Second Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Top Contacts */}
                    <div className="bg-black/40 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-green-400" />
                            Top Contacts
                        </h3>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {topContacts.map((contact, index) => (
                                <div key={contact.contactId} className="flex items-center gap-4 p-3 bg-green-500/10 rounded-xl">
                                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium">{contact.name || 'Unknown'}</span>
                                            {contact.trend === 'UP' && <ArrowUp className="w-4 h-4 text-green-400" />}
                                            {contact.trend === 'DOWN' && <ArrowDown className="w-4 h-4 text-red-400" />}
                                        </div>
                                        <div className="text-gray-500 text-xs">
                                            {contact.messageCount} messages • {contact.intimacyLevel}% intimacy
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-green-400">{contact.score}</div>
                                        <div className="text-gray-500 text-xs">score</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Keywords */}
                    <div className="bg-black/40 backdrop-blur-sm border border-orange-500/30 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-orange-400" />
                            Trending Keywords
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {keywords.map((kw, index) => {
                                const maxCount = Math.max(...keywords.map(k => k.count));
                                const opacity = 0.3 + (kw.count / maxCount) * 0.7;
                                const size = 0.75 + (kw.count / maxCount) * 0.5;

                                return (
                                    <span
                                        key={kw.word}
                                        className="px-3 py-1.5 bg-orange-500 rounded-full text-white font-medium"
                                        style={{
                                            opacity,
                                            fontSize: `${size}rem`,
                                            backgroundColor: `rgba(249, 115, 22, ${opacity})`
                                        }}
                                    >
                                        {kw.word}
                                        <span className="ml-1 opacity-60">({kw.count})</span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Performance */}
                {performance && (
                    <div className="bg-black/40 backdrop-blur-sm border border-gray-500/30 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            System Performance
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <PerformanceCard label="Uptime" value={formatUptime(performance.uptime)} />
                            <PerformanceCard label="Messages Processed" value={performance.totalMessagesProcessed.toLocaleString()} />
                            <PerformanceCard label="Avg Processing" value={`${performance.avgProcessingTimeMs}ms`} />
                            <PerformanceCard label="Error Rate" value={`${performance.errorRate}%`} isError={performance.errorRate > 5} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ==================== COMPONENTS ====================

function MetricCard({ icon: Icon, label, value, color }: {
    icon: any;
    label: string;
    value: number;
    color: 'blue' | 'purple' | 'orange' | 'green' | 'red';
}) {
    const colorClasses = {
        blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
        orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
        green: 'bg-green-500/10 border-green-500/30 text-green-400',
        red: 'bg-red-500/10 border-red-500/30 text-red-400'
    };

    return (
        <div className={`${colorClasses[color]} border rounded-xl p-4`}>
            <Icon className="w-5 h-5 mb-2" />
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-gray-500 text-sm">{label}</div>
        </div>
    );
}

function FunnelRow({ label, value, total, color }: {
    label: string;
    value: number;
    total: number;
    color: string;
}) {
    const percentage = total > 0 ? (value / total) * 100 : 0;

    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-gray-400 text-sm">{label}</span>
                <span className="text-white font-medium">{value} ({percentage.toFixed(1)}%)</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} transition-all duration-1000`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

function PerformanceCard({ label, value, isError = false }: {
    label: string;
    value: string;
    isError?: boolean;
}) {
    return (
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${isError ? 'text-red-400' : 'text-white'}`}>{value}</div>
            <div className="text-gray-500 text-sm">{label}</div>
        </div>
    );
}

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}
