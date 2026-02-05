'use client';

import { useEffect, useState } from 'react';
import { ghostApi, DailyMetrics, ConversionMetrics, RiskAlert, PresenceState, ScheduledTask } from '@/services/ghost-api';
import {
    Brain, Shield, Target, Activity, Zap, Clock, AlertTriangle,
    TrendingUp, Users, MessageSquare, Moon, Sun,
    Play, Pause, RefreshCw, ChevronRight, BarChart3, Mic, Image
} from 'lucide-react';
import { LiveMetricsBar } from '@/components/LiveMetricsBar';
import { LiveMessageFeed } from '@/components/LiveMessageFeed';

interface DashboardData {
    today: DailyMetrics | null;
    conversion: ConversionMetrics | null;
    presence: PresenceState | null;
    alerts: RiskAlert[];
    tasks: ScheduledTask[];
    isConnected: boolean;
}

export default function CommandCenter() {
    const [data, setData] = useState<DashboardData>({
        today: null,
        conversion: null,
        presence: null,
        alerts: [],
        tasks: [],
        isConnected: false
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'operations' | 'cognitive' | 'advanced'>('overview');

    useEffect(() => {
        loadDashboard();
        const interval = setInterval(loadDashboard, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const loadDashboard = async () => {
        try {
            const [todayRes, convRes, presenceRes, alertsRes, tasksRes] = await Promise.all([
                ghostApi.analytics.getToday().catch(() => null),
                ghostApi.analytics.getConversion().catch(() => null),
                ghostApi.operations.getPresenceState().catch(() => null),
                ghostApi.operations.getAlerts().catch(() => ({ data: { alerts: [] } })),
                ghostApi.advanced.getSchedulerTasks().catch(() => ({ data: { tasks: [] } }))
            ]);

            setData({
                today: todayRes?.data?.metrics || null,
                conversion: convRes?.data?.metrics || null,
                presence: presenceRes?.data?.state || null,
                alerts: alertsRes?.data?.alerts || [],
                tasks: tasksRes?.data?.tasks || [],
                isConnected: true
            });
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            setData(prev => ({ ...prev, isConnected: false }));
        } finally {
            setLoading(false);
        }
    };

    const getPresenceColor = (mode: string) => {
        const colors: Record<string, string> = {
            'sleeping': 'bg-purple-500',
            'waking': 'bg-orange-400',
            'active': 'bg-green-500',
            'lunch': 'bg-yellow-500',
            'evening': 'bg-blue-400',
            'night': 'bg-indigo-500'
        };
        return colors[mode] || 'bg-gray-500';
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-purple-300 text-lg">Loading Ghost Protocol...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Navigation Tabs */}
            <nav className="flex gap-1 border-b border-gray-700/50 mb-6">
                {[
                    { id: 'overview', label: 'Overview', icon: Activity },
                    { id: 'operations', label: 'Operations', icon: Target },
                    { id: 'cognitive', label: 'Cognitive', icon: Brain },
                    { id: 'advanced', label: 'Advanced', icon: Zap }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-6 py-3 flex items-center gap-2 border-b-2 transition-all ${activeTab === tab.id
                            ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                            : 'border-transparent text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </nav>

            {activeTab === 'overview' && (
                <div className="space-y-8">
                    {/* Live Infrastructure Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <LiveMetricsBar />
                        </div>
                        <div className="flex flex-col justify-center bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                            <div className="text-gray-400 text-sm mb-2">Presence Intelligence</div>
                            {data.presence && (
                                <div className="flex items-center gap-4">
                                    <div className={`w-4 h-4 rounded-full ${getPresenceColor(data.presence.currentMode)} animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]`} />
                                    <div>
                                        <div className="text-white font-bold capitalize text-xl">{data.presence.currentMode}</div>
                                        <div className="text-gray-500 text-xs">{data.presence.canRespond ? 'Human-like delays enabled' : 'Ghost mode active'}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            icon={MessageSquare}
                            label="Messages Today"
                            value={data.today?.messagesReceived || 0}
                            subValue={`${data.today?.aiResponses || 0} AI responses`}
                            color="blue"
                        />
                        <StatCard
                            icon={Users}
                            label="Active Contacts"
                            value={data.today?.contactsActive || 0}
                            subValue={`${data.today?.humanInterventions || 0} interventions`}
                            color="green"
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="Conversion Rate"
                            value={`${data.conversion?.conversionRate?.toFixed(1) || 0}%`}
                            subValue={`${data.conversion?.byStage?.converted || 0} converted`}
                            color="purple"
                        />
                        <StatCard
                            icon={AlertTriangle}
                            label="Risk Alerts"
                            value={data.alerts.filter(a => !a.acknowledged).length}
                            subValue={`${data.alerts.length} total`}
                            color={data.alerts.some(a => !a.acknowledged) ? 'red' : 'gray'}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Live Message Feed */}
                        <LiveMessageFeed />

                        {/* Conversion Funnel */}
                        {data.conversion && (
                            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-purple-400" />
                                    Conversion Funnel
                                </h3>
                                <div className="flex gap-4 h-48 items-end pb-4">
                                    <FunnelBar label="Cold" value={data.conversion.byStage.cold} total={data.conversion.totalContacts} color="bg-blue-500" />
                                    <FunnelBar label="Warm" value={data.conversion.byStage.warm} total={data.conversion.totalContacts} color="bg-yellow-500" />
                                    <FunnelBar label="Hot" value={data.conversion.byStage.hot} total={data.conversion.totalContacts} color="bg-orange-500" />
                                    <FunnelBar label="Converted" value={data.conversion.byStage.converted} total={data.conversion.totalContacts} color="bg-green-500" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Alerts */}
                        <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-red-400" />
                                    Recent Monitor
                                </h3>
                                <button className="text-purple-400 text-sm hover:underline">View logs</button>
                            </div>
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                {data.alerts.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">System secure. No threats detected.</p>
                                ) : (
                                    data.alerts.slice(0, 5).map(alert => (
                                        <AlertCard key={alert.id} alert={alert} />
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Scheduled Tasks */}
                        <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-purple-400" />
                                    Automation
                                </h3>
                                <button className="text-purple-400 text-sm hover:underline">Scheduler</button>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                {data.tasks.map(task => (
                                    <TaskCard key={task.id} task={task} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Proactive Strategies</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <QuickAction icon={Brain} label="Extract Style DNA" onClick={() => ghostApi.cognitive.learnObjections()} />
                            <QuickAction icon={Target} label="Recruit Leads" onClick={() => { }} />
                            <QuickAction icon={Mic} label="Contextual Voice" onClick={() => { }} />
                            <QuickAction icon={Image} label="Generate Selfie" onClick={() => { }} />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'operations' && <OperationsTab />}
            {activeTab === 'cognitive' && <CognitiveTab />}
            {activeTab === 'advanced' && <AdvancedTab tasks={data.tasks} />}
        </div>
    );
}

// ==================== COMPONENTS ====================

function StatCard({ icon: Icon, label, value, subValue, color }: {
    icon: any;
    label: string;
    value: string | number;
    subValue: string;
    color: 'blue' | 'green' | 'purple' | 'red' | 'gray';
}) {
    const colors = {
        blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
        green: 'from-green-500/20 to-green-600/10 border-green-500/30',
        purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
        red: 'from-red-500/20 to-red-600/10 border-red-500/30',
        gray: 'from-gray-500/20 to-gray-600/10 border-gray-500/30'
    };

    const iconColors = {
        blue: 'text-blue-400',
        green: 'text-green-400',
        purple: 'text-purple-400',
        red: 'text-red-400',
        gray: 'text-gray-400'
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} backdrop-blur-sm border rounded-xl p-5 hover:scale-[1.02] transition-transform duration-300`}>
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg bg-black/30`}>
                    <Icon className={`w-5 h-5 ${iconColors[color]}`} />
                </div>
                <span className="text-gray-400 text-sm">{label}</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-gray-500 text-sm">{subValue}</div>
        </div>
    );
}

function FunnelBar({ label, value, total, color }: {
    label: string;
    value: number;
    total: number;
    color: string;
}) {
    const percentage = total > 0 ? (value / total) * 100 : 0;

    return (
        <div className="flex-1">
            <div className="h-full bg-gray-800/50 rounded-lg overflow-hidden flex flex-col-reverse group">
                <div
                    className={`${color} transition-all duration-1000 group-hover:brightness-125`}
                    style={{ height: `${Math.max(percentage, 5)}%` }}
                />
            </div>
            <div className="text-center mt-2">
                <div className="text-white font-semibold">{value}</div>
                <div className="text-gray-500 text-xs">{label}</div>
            </div>
        </div>
    );
}

function AlertCard({ alert }: { alert: RiskAlert }) {
    const levelColors = {
        LOW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    return (
        <div className={`p-3 rounded-lg border ${levelColors[alert.riskLevel]} ${alert.acknowledged ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">{alert.contactName || 'Unknown'}</span>
                <span className="text-xs uppercase font-bold">{alert.riskLevel}</span>
            </div>
            <p className="text-gray-400 text-xs truncate">{alert.messagePreview}</p>
            <div className="flex gap-1 mt-2 flex-wrap">
                {alert.detectedPatterns.map((p, i) => (
                    <span key={i} className="px-2 py-0.5 bg-black/30 rounded text-[10px]">{p}</span>
                ))}
            </div>
        </div>
    );
}

function TaskCard({ task }: { task: ScheduledTask }) {
    return (
        <div className="flex items-center justify-between p-3 bg-purple-500/5 rounded-lg border border-purple-500/10 hover:bg-purple-500/10 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${task.isActive ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-gray-500'}`} />
                <div>
                    <div className="text-white text-sm font-medium">{task.name}</div>
                    <div className="text-gray-500 text-xs">{task.schedule}</div>
                </div>
            </div>
            <div className="text-gray-400 text-xs">
                {task.executionCount} runs
            </div>
        </div>
    );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 p-4 bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/20 rounded-xl transition-all group"
        >
            <Icon className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-white text-sm">{label}</span>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
        </button>
    );
}

function OperationsTab() {
    return (
        <div className="text-center py-20 bg-black/20 rounded-2xl border border-dashed border-gray-700">
            <Target className="w-16 h-16 text-purple-500/50 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Operations Center</h2>
            <p className="text-gray-400">Hunter, Watchdog, Presence controls integrated in sidebar</p>
        </div>
    );
}

function CognitiveTab() {
    return (
        <div className="text-center py-20 bg-black/20 rounded-2xl border border-dashed border-gray-700">
            <Brain className="w-16 h-16 text-purple-500/50 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Cognitive Center</h2>
            <p className="text-gray-400">Style DNA, Memory, Objection Learning integrated in sidebar</p>
        </div>
    );
}

function AdvancedTab({ tasks }: { tasks: ScheduledTask[] }) {
    return (
        <div className="space-y-6">
            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-400" />
                    System Scheduler
                </h3>
                <div className="grid gap-3">
                    {tasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-gray-700/50 hover:border-purple-500/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${task.isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                                <div>
                                    <div className="text-white font-medium">{task.name}</div>
                                    <div className="text-gray-500 text-sm">{task.description}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-purple-300 text-sm font-mono">{task.schedule}</div>
                                    <div className="text-gray-500 text-xs">{task.executionCount} executions</div>
                                </div>
                                <button className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors">
                                    {task.isActive ? <Pause className="w-4 h-4 text-purple-400" /> : <Play className="w-4 h-4 text-purple-400" />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
