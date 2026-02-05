'use client';

import { useEffect, useState } from 'react';
import { ghostApi, HuntingTarget, RiskAlert, PresenceState } from '@/services/ghost-api';
import {
    Target, Shield, Clock, AlertTriangle, Users, Send,
    Play, Pause, Check, X, RefreshCw, ChevronRight,
    Moon, Sun, Coffee, Bed, Zap, Eye, MessageSquare
} from 'lucide-react';

export default function OperationsPage() {
    const [activeSection, setActiveSection] = useState<'hunter' | 'watchdog' | 'presence'>('hunter');
    const [loading, setLoading] = useState(true);

    // Hunter State
    const [targets, setTargets] = useState<HuntingTarget[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState('');
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [hunterStats, setHunterStats] = useState<any>(null);

    // Watchdog State
    const [alerts, setAlerts] = useState<RiskAlert[]>([]);
    const [riskStats, setRiskStats] = useState<any>(null);

    // Presence State
    const [presenceState, setPresenceState] = useState<PresenceState | null>(null);
    const [presenceProfile, setPresenceProfile] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [activeSection]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeSection === 'hunter') {
                const [targetsRes, campaignsRes, statsRes] = await Promise.all([
                    ghostApi.operations.getHuntingTargets(),
                    ghostApi.operations.getCampaigns(),
                    ghostApi.operations.getHuntingStats()
                ]);
                setTargets(targetsRes.data?.targets || []);
                setCampaigns(campaignsRes.data?.campaigns || []);
                setHunterStats(statsRes.data?.stats);
            } else if (activeSection === 'watchdog') {
                const [alertsRes, statsRes] = await Promise.all([
                    ghostApi.operations.getAlerts(),
                    ghostApi.operations.getRiskStats()
                ]);
                setAlerts(alertsRes.data?.alerts || []);
                setRiskStats(statsRes.data?.stats);
            } else if (activeSection === 'presence') {
                const [stateRes, profileRes] = await Promise.all([
                    ghostApi.operations.getPresenceState(),
                    ghostApi.operations.getPresenceProfile()
                ]);
                setPresenceState(stateRes.data?.state);
                setPresenceProfile(profileRes.data?.profile);
            }
        } catch (error) {
            console.error('Failed to load operations data:', error);
        } finally {
            setLoading(false);
        }
    };

    const acknowledgeAlert = async (alertId: string) => {
        await ghostApi.operations.acknowledgeAlert(alertId);
        loadData();
    };

    const executeHunting = async () => {
        await ghostApi.operations.executeHunting(selectedCampaign, true);
        loadData();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Target className="w-8 h-8 text-purple-400" />
                            Operations Center
                        </h1>
                        <p className="text-gray-400 mt-1">Control Hunter, Watchdog, and Presence systems</p>
                    </div>
                    <button
                        onClick={loadData}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
                        <span className="text-purple-300">Refresh</span>
                    </button>
                </div>

                {/* Section Tabs */}
                <div className="flex gap-2 mb-8">
                    {[
                        { id: 'hunter', label: 'Hunter', icon: Target, color: 'emerald' },
                        { id: 'watchdog', label: 'Watchdog', icon: Shield, color: 'red' },
                        { id: 'presence', label: 'Presence', icon: Clock, color: 'blue' }
                    ].map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${activeSection === section.id
                                    ? `bg-${section.color}-500/20 border-${section.color}-500/50 text-${section.color}-300`
                                    : 'bg-black/30 border-gray-700 text-gray-400 hover:text-white'
                                } border`}
                        >
                            <section.icon className="w-5 h-5" />
                            {section.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {activeSection === 'hunter' && (
                            <HunterSection
                                targets={targets}
                                campaigns={campaigns}
                                stats={hunterStats}
                                selectedCampaign={selectedCampaign}
                                setSelectedCampaign={setSelectedCampaign}
                                onExecute={executeHunting}
                            />
                        )}
                        {activeSection === 'watchdog' && (
                            <WatchdogSection
                                alerts={alerts}
                                stats={riskStats}
                                onAcknowledge={acknowledgeAlert}
                            />
                        )}
                        {activeSection === 'presence' && (
                            <PresenceSection
                                state={presenceState}
                                profile={presenceProfile}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ==================== HUNTER SECTION ====================
function HunterSection({ targets, campaigns, stats, selectedCampaign, setSelectedCampaign, onExecute }: {
    targets: HuntingTarget[];
    campaigns: any[];
    stats: any;
    selectedCampaign: string;
    setSelectedCampaign: (id: string) => void;
    onExecute: () => void;
}) {
    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatBox icon={Target} label="Active Campaigns" value={campaigns.filter(c => c.isActive).length} color="emerald" />
                <StatBox icon={Users} label="Targets Found" value={targets.length} color="blue" />
                <StatBox icon={Send} label="Messages Sent" value={stats?.messagesSent || 0} color="purple" />
                <StatBox icon={Check} label="Responses" value={stats?.responses || 0} color="green" />
            </div>

            {/* Campaign Selector */}
            <div className="bg-black/40 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-400" />
                    Execute Campaign
                </h3>
                <div className="flex gap-4">
                    <select
                        value={selectedCampaign}
                        onChange={(e) => setSelectedCampaign(e.target.value)}
                        className="flex-1 bg-black/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                    >
                        <option value="">Select a campaign...</option>
                        {campaigns.map(c => (
                            <option key={c.id} value={c.id}>{c.name} - {c.description}</option>
                        ))}
                    </select>
                    <button
                        onClick={onExecute}
                        disabled={!selectedCampaign}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
                    >
                        <Play className="w-4 h-4" />
                        Execute (Dry Run)
                    </button>
                </div>
            </div>

            {/* Targets List */}
            <div className="bg-black/40 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    Hunting Targets ({targets.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {targets.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No targets found. All contacts are active! 🎉</p>
                    ) : (
                        targets.map(target => (
                            <TargetCard key={target.contactId} target={target} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function TargetCard({ target }: { target: HuntingTarget }) {
    const priorityColors = {
        LOW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        HIGH: 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    return (
        <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <div className="text-white font-medium">{target.name || 'Unknown'}</div>
                    <div className="text-gray-500 text-sm">{target.reason}</div>
                    <div className="flex gap-2 mt-1">
                        <span className="text-xs text-gray-400">Intimacy: {target.intimacyLevel}%</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">Sales Ready: {target.salesReadiness}%</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${priorityColors[target.priority]}`}>
                    {target.priority}
                </span>
                <div className="text-right">
                    <div className="text-gray-400 text-sm">{target.daysSinceContact} days ago</div>
                </div>
                <button className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg transition-colors">
                    <Send className="w-4 h-4 text-emerald-400" />
                </button>
            </div>
        </div>
    );
}

// ==================== WATCHDOG SECTION ====================
function WatchdogSection({ alerts, stats, onAcknowledge }: {
    alerts: RiskAlert[];
    stats: any;
    onAcknowledge: (id: string) => void;
}) {
    const unacknowledged = alerts.filter(a => !a.acknowledged);

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatBox icon={AlertTriangle} label="Active Alerts" value={unacknowledged.length} color="red" />
                <StatBox icon={Shield} label="Total Scanned" value={stats?.totalScanned || 0} color="blue" />
                <StatBox icon={Eye} label="Risks Detected" value={stats?.risksDetected || 0} color="orange" />
                <StatBox icon={Check} label="Auto-Paused" value={stats?.autoPaused || 0} color="purple" />
            </div>

            {/* Alerts List */}
            <div className="bg-black/40 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Risk Alerts ({unacknowledged.length} unacknowledged)
                </h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {alerts.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No risk alerts. System is secure! 🛡️</p>
                    ) : (
                        alerts.map(alert => (
                            <AlertCardFull key={alert.id} alert={alert} onAcknowledge={onAcknowledge} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function AlertCardFull({ alert, onAcknowledge }: { alert: RiskAlert; onAcknowledge: (id: string) => void }) {
    const levelColors = {
        LOW: 'border-blue-500/50 bg-blue-500/10',
        MEDIUM: 'border-yellow-500/50 bg-yellow-500/10',
        HIGH: 'border-orange-500/50 bg-orange-500/10',
        CRITICAL: 'border-red-500/50 bg-red-500/10 animate-pulse'
    };

    const levelBadge = {
        LOW: 'bg-blue-500/30 text-blue-300',
        MEDIUM: 'bg-yellow-500/30 text-yellow-300',
        HIGH: 'bg-orange-500/30 text-orange-300',
        CRITICAL: 'bg-red-500/30 text-red-300'
    };

    return (
        <div className={`p-4 rounded-xl border ${levelColors[alert.riskLevel]} ${alert.acknowledged ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${levelBadge[alert.riskLevel]}`}>
                            {alert.riskLevel}
                        </span>
                        <span className="text-white font-medium">{alert.contactName || 'Unknown Contact'}</span>
                        <span className="text-gray-500 text-sm">{alert.riskCategory}</span>
                    </div>
                    <p className="text-gray-300 mb-2">"{alert.messagePreview}"</p>
                    <div className="flex gap-2 flex-wrap">
                        {alert.detectedPatterns.map((pattern, i) => (
                            <span key={i} className="px-2 py-1 bg-black/30 rounded text-xs text-gray-400">
                                {pattern}
                            </span>
                        ))}
                    </div>
                </div>
                {!alert.acknowledged && (
                    <button
                        onClick={() => onAcknowledge(alert.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg transition-colors"
                    >
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-green-300 text-sm">Acknowledge</span>
                    </button>
                )}
            </div>
        </div>
    );
}

// ==================== PRESENCE SECTION ====================
function PresenceSection({ state, profile }: { state: PresenceState | null; profile: any }) {
    if (!state) return null;

    const modeInfo: Record<string, { icon: any; color: string; description: string }> = {
        sleeping: { icon: Bed, color: 'purple', description: 'Bot is sleeping. Will not respond.' },
        waking: { icon: Coffee, color: 'orange', description: 'Waking up slowly. Delayed responses.' },
        active: { icon: Zap, color: 'green', description: 'Fully active and responsive.' },
        lunch: { icon: Coffee, color: 'yellow', description: 'At lunch. Slower responses.' },
        evening: { icon: Moon, color: 'blue', description: 'Evening mode. Casual responses.' },
        night: { icon: Moon, color: 'indigo', description: 'Night mode. Very slow responses.' }
    };

    const current = modeInfo[state.currentMode] || modeInfo.active;
    const Icon = current.icon;

    return (
        <div className="space-y-6">
            {/* Current State */}
            <div className={`bg-${current.color}-500/10 border border-${current.color}-500/30 rounded-2xl p-8 text-center`}>
                <div className={`w-20 h-20 bg-${current.color}-500/20 rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-10 h-10 text-${current.color}-400`} />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 capitalize">{state.currentMode}</h2>
                <p className="text-gray-400 mb-4">{current.description}</p>

                <div className="flex justify-center gap-8 mt-6">
                    <div className="text-center">
                        <div className={`text-2xl font-bold ${state.canRespond ? 'text-green-400' : 'text-red-400'}`}>
                            {state.canRespond ? 'YES' : 'NO'}
                        </div>
                        <div className="text-gray-500 text-sm">Can Respond</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">{state.responseDelayMultiplier}x</div>
                        <div className="text-gray-500 text-sm">Delay Multiplier</div>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-black/30 rounded-xl inline-block">
                    <div className="text-gray-400 text-sm">Suggested Status</div>
                    <div className="text-white font-medium">{state.suggestedStatus}</div>
                </div>
            </div>

            {/* Schedule */}
            {profile && (
                <div className="bg-black/40 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        Activity Schedule
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <ScheduleCard icon={Sun} label="Wake Up" time={profile.wakeUpHour || '07:00'} />
                        <ScheduleCard icon={Coffee} label="Lunch Start" time={profile.lunchStartHour || '12:00'} />
                        <ScheduleCard icon={Coffee} label="Lunch End" time={profile.lunchEndHour || '13:00'} />
                        <ScheduleCard icon={Moon} label="Sleep" time={profile.sleepHour || '23:00'} />
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <ToggleCard label="Night Mode" enabled={profile.nightModeEnabled} />
                        <ToggleCard label="Slow Morning" enabled={profile.slowMorningEnabled} />
                        <ToggleCard label="Weekend Lazy" enabled={profile.weekendLazy} />
                    </div>
                </div>
            )}
        </div>
    );
}

function ScheduleCard({ icon: Icon, label, time }: { icon: any; label: string; time: string }) {
    return (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
            <Icon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-gray-400 text-sm">{label}</div>
            <div className="text-white font-bold text-xl">{time}</div>
        </div>
    );
}

function ToggleCard({ label, enabled }: { label: string; enabled: boolean }) {
    return (
        <div className={`p-4 rounded-xl border ${enabled ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
            <div className="flex items-center justify-between">
                <span className="text-white text-sm">{label}</span>
                <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-400' : 'bg-gray-500'}`} />
            </div>
        </div>
    );
}

// ==================== SHARED COMPONENTS ====================
function StatBox({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
    return (
        <div className={`bg-${color}-500/10 border border-${color}-500/30 rounded-xl p-4`}>
            <div className="flex items-center gap-3 mb-2">
                <Icon className={`w-5 h-5 text-${color}-400`} />
                <span className="text-gray-400 text-sm">{label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
        </div>
    );
}
