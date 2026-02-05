'use client';

import { useEffect, useState } from 'react';
import { ghostApi } from '@/services/ghost-api';
import { useGhostStore } from '@/stores/useGhostStore';
import {
    Settings, User, Bell, Shield, Clock, Palette,
    Save, RefreshCw, Eye, EyeOff, Check, X, Zap
} from 'lucide-react';

export default function SettingsPage() {
    const { isConnected, qrCode } = useGhostStore();
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    // Persona Settings
    const [persona, setPersona] = useState({
        name: 'Eliane',
        age: 23,
        personality: 'Simpática, divertida e sedutora',
        occupation: 'Modelo e criadora de conteúdo',
        communicationStyle: 'Casual, usa emojis, gírias e abreviações'
    });

    // Presence Settings
    const [presence, setPresence] = useState({
        wakeUpHour: 7,
        sleepHour: 23,
        lunchStartHour: 12,
        lunchEndHour: 13,
        nightModeEnabled: true,
        slowMorningEnabled: true,
        weekendLazy: true
    });

    // Risk Settings
    const [risk, setRisk] = useState({
        autoDetectRisks: true,
        autoPauseOnCritical: true,
        notifyOnHighRisk: true,
        pauseThreshold: 'HIGH' as 'MEDIUM' | 'HIGH' | 'CRITICAL'
    });

    // API Settings
    const [apiSettings, setApiSettings] = useState({
        geminiApiKey: '',
        showApiKey: false
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const presenceRes = await ghostApi.operations.getPresenceProfile();
            if (presenceRes.data?.profile) {
                setPresence(prev => ({ ...prev, ...presenceRes.data.profile }));
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const saveSettings = async () => {
        setLoading(true);
        try {
            await ghostApi.operations.updatePresenceProfile(presence);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Settings className="w-8 h-8 text-gray-400" />
                            Settings
                        </h1>
                        <p className="text-gray-400 mt-1">Configure Ghost Protocol behavior</p>
                    </div>
                    <button
                        onClick={saveSettings}
                        disabled={loading}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${saved
                            ? 'bg-green-500 text-white'
                            : 'bg-purple-500 hover:bg-purple-600 text-white'
                            }`}
                    >
                        {loading ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : saved ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {saved ? 'Saved!' : 'Save Changes'}
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Connection Settings */}
                    <SettingsCard
                        icon={Zap}
                        title="WhatsApp Connection"
                        description="Manage your connection to WhatsApp"
                        color="green"
                    >
                        <div className="flex flex-col items-center justify-center p-4">
                            <div className={`text-lg font-semibold mb-4 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </div>

                            {!isConnected && qrCode && (
                                <div className="bg-white p-4 rounded-xl">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                                    <p className="text-black text-center mt-2 font-medium">Scan to Connect</p>
                                </div>
                            )}

                            {!isConnected && !qrCode && (
                                <div className="text-gray-400 flex flex-col items-center gap-2">
                                    <RefreshCw className="w-6 h-6 animate-spin text-gray-600" />
                                    <span>Waiting for QR Code service...</span>
                                </div>
                            )}
                        </div>
                    </SettingsCard>

                    {/* Persona Settings */}
                    <SettingsCard
                        icon={User}
                        title="Persona Configuration"
                        description="Define the AI's personality and characteristics"
                        color="pink"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Name</label>
                                <input
                                    type="text"
                                    value={persona.name}
                                    onChange={e => setPersona(p => ({ ...p, name: e.target.value }))}
                                    className="w-full bg-black/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Age</label>
                                <input
                                    type="number"
                                    value={persona.age}
                                    onChange={e => setPersona(p => ({ ...p, age: parseInt(e.target.value) }))}
                                    className="w-full bg-black/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-gray-400 text-sm mb-2 block">Personality</label>
                                <textarea
                                    value={persona.personality}
                                    onChange={e => setPersona(p => ({ ...p, personality: e.target.value }))}
                                    rows={2}
                                    className="w-full bg-black/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none resize-none"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-gray-400 text-sm mb-2 block">Communication Style</label>
                                <textarea
                                    value={persona.communicationStyle}
                                    onChange={e => setPersona(p => ({ ...p, communicationStyle: e.target.value }))}
                                    rows={2}
                                    className="w-full bg-black/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none resize-none"
                                />
                            </div>
                        </div>
                    </SettingsCard>

                    {/* Presence Settings */}
                    <SettingsCard
                        icon={Clock}
                        title="Presence Schedule"
                        description="Configure human-like activity patterns"
                        color="blue"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Wake Up</label>
                                <select
                                    value={presence.wakeUpHour}
                                    onChange={e => setPresence(p => ({ ...p, wakeUpHour: parseInt(e.target.value) }))}
                                    className="w-full bg-black/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 5).map(h => (
                                        <option key={h} value={h}>{h}:00</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Sleep</label>
                                <select
                                    value={presence.sleepHour}
                                    onChange={e => setPresence(p => ({ ...p, sleepHour: parseInt(e.target.value) }))}
                                    className="w-full bg-black/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                >
                                    {Array.from({ length: 8 }, (_, i) => i + 20).map(h => (
                                        <option key={h} value={h}>{h}:00</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Lunch Start</label>
                                <select
                                    value={presence.lunchStartHour}
                                    onChange={e => setPresence(p => ({ ...p, lunchStartHour: parseInt(e.target.value) }))}
                                    className="w-full bg-black/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                >
                                    {Array.from({ length: 4 }, (_, i) => i + 11).map(h => (
                                        <option key={h} value={h}>{h}:00</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Lunch End</label>
                                <select
                                    value={presence.lunchEndHour}
                                    onChange={e => setPresence(p => ({ ...p, lunchEndHour: parseInt(e.target.value) }))}
                                    className="w-full bg-black/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                >
                                    {Array.from({ length: 4 }, (_, i) => i + 12).map(h => (
                                        <option key={h} value={h}>{h}:00</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <Toggle
                                label="Night Mode"
                                description="Slower responses at night"
                                enabled={presence.nightModeEnabled}
                                onChange={v => setPresence(p => ({ ...p, nightModeEnabled: v }))}
                            />
                            <Toggle
                                label="Slow Morning"
                                description="Delayed responses after waking"
                                enabled={presence.slowMorningEnabled}
                                onChange={v => setPresence(p => ({ ...p, slowMorningEnabled: v }))}
                            />
                            <Toggle
                                label="Weekend Lazy"
                                description="Less active on weekends"
                                enabled={presence.weekendLazy}
                                onChange={v => setPresence(p => ({ ...p, weekendLazy: v }))}
                            />
                        </div>
                    </SettingsCard>

                    {/* Risk & Safety */}
                    <SettingsCard
                        icon={Shield}
                        title="Risk & Safety"
                        description="Watchdog configuration"
                        color="red"
                    >
                        <div className="space-y-4">
                            <Toggle
                                label="Auto-Detect Risks"
                                description="Automatically scan messages for risks"
                                enabled={risk.autoDetectRisks}
                                onChange={v => setRisk(p => ({ ...p, autoDetectRisks: v }))}
                            />
                            <Toggle
                                label="Auto-Pause on Critical"
                                description="Automatically pause AI when critical risk detected"
                                enabled={risk.autoPauseOnCritical}
                                onChange={v => setRisk(p => ({ ...p, autoPauseOnCritical: v }))}
                            />
                            <Toggle
                                label="Notify on High Risk"
                                description="Send notification when high risk detected"
                                enabled={risk.notifyOnHighRisk}
                                onChange={v => setRisk(p => ({ ...p, notifyOnHighRisk: v }))}
                            />

                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Auto-Pause Threshold</label>
                                <div className="flex gap-2">
                                    {(['MEDIUM', 'HIGH', 'CRITICAL'] as const).map(level => (
                                        <button
                                            key={level}
                                            onClick={() => setRisk(p => ({ ...p, pauseThreshold: level }))}
                                            className={`px-4 py-2 rounded-lg transition-all ${risk.pauseThreshold === level
                                                ? 'bg-red-500 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </SettingsCard>

                    {/* Notifications */}
                    <SettingsCard
                        icon={Bell}
                        title="Notifications"
                        description="Configure alerts and webhooks"
                        color="yellow"
                    >
                        <p className="text-gray-500 text-center py-6">
                            Configure webhooks in the Advanced → Webhooks section
                        </p>
                    </SettingsCard>
                </div>
            </div>
        </div>
    );
}

// ==================== COMPONENTS ====================

function SettingsCard({ icon: Icon, title, description, color, children }: {
    icon: any;
    title: string;
    description: string;
    color: string;
    children: React.ReactNode;
}) {
    return (
        <div className={`bg-black/40 backdrop-blur-sm border border-${color}-500/30 rounded-2xl p-6`}>
            <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 bg-${color}-500/20 rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${color}-400`} />
                </div>
                <div>
                    <h3 className="text-white font-semibold">{title}</h3>
                    <p className="text-gray-500 text-sm">{description}</p>
                </div>
            </div>
            {children}
        </div>
    );
}

function Toggle({ label, description, enabled, onChange }: {
    label: string;
    description: string;
    enabled: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg min-w-[200px]">
            <div>
                <div className="text-white text-sm font-medium">{label}</div>
                <div className="text-gray-500 text-xs">{description}</div>
            </div>
            <button
                onClick={() => onChange(!enabled)}
                className={`w-12 h-6 rounded-full relative transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-600'
                    }`}
            >
                <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all ${enabled ? 'left-6' : 'left-0.5'
                    }`} />
            </button>
        </div>
    );
}
