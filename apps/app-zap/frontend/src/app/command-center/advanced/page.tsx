'use client';

import { useEffect, useState } from 'react';
import { ghostApi, ABTest, Webhook, ScheduledTask } from '@/services/ghost-api';
import {
    Zap, Clock, Webhook as WebhookIcon, FlaskConical, Play, Pause,
    RefreshCw, Check, X, Plus, Trash2, TestTube, Trophy,
    MessageSquare, BellRing, Send, BarChart2, Settings
} from 'lucide-react';

export default function AdvancedPage() {
    const [activeSection, setActiveSection] = useState<'scheduler' | 'webhooks' | 'abtesting'>('scheduler');
    const [loading, setLoading] = useState(true);

    // Scheduler State
    const [tasks, setTasks] = useState<ScheduledTask[]>([]);

    // Webhooks State
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);

    // A/B Testing State
    const [abTests, setAbTests] = useState<ABTest[]>([]);
    const [abStats, setAbStats] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [activeSection]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeSection === 'scheduler') {
                const res = await ghostApi.advanced.getSchedulerTasks();
                setTasks(res.data?.tasks || []);
            } else if (activeSection === 'webhooks') {
                const res = await ghostApi.advanced.getWebhooks();
                setWebhooks(res.data?.webhooks || []);
            } else if (activeSection === 'abtesting') {
                const [testsRes, statsRes] = await Promise.all([
                    ghostApi.advanced.getABTests(),
                    ghostApi.advanced.getABTestStats()
                ]);
                setAbTests(testsRes.data?.tests || []);
                setAbStats(statsRes.data?.stats);
            }
        } catch (error) {
            console.error('Failed to load advanced data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTask = async (taskId: string, active: boolean) => {
        await ghostApi.advanced.toggleTask(taskId, active);
        loadData();
    };

    const runTask = async (taskId: string) => {
        await ghostApi.advanced.runTask(taskId);
        loadData();
    };

    const toggleWebhook = async (webhookId: string, active: boolean) => {
        await ghostApi.advanced.toggleWebhook(webhookId, active);
        loadData();
    };

    const testWebhook = async (webhookId: string) => {
        await ghostApi.advanced.testWebhook(webhookId);
    };

    const toggleABTest = async (testId: string, active: boolean) => {
        await ghostApi.advanced.toggleABTest(testId, active);
        loadData();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Zap className="w-8 h-8 text-yellow-400" />
                            Advanced Controls
                        </h1>
                        <p className="text-gray-400 mt-1">Scheduler, Webhooks, and A/B Testing</p>
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
                        { id: 'scheduler', label: 'Scheduler', icon: Clock, count: tasks.filter(t => t.isActive).length },
                        { id: 'webhooks', label: 'Webhooks', icon: BellRing, count: webhooks.filter(w => w.isActive).length },
                        { id: 'abtesting', label: 'A/B Testing', icon: FlaskConical, count: abTests.filter(t => t.isActive).length }
                    ].map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${activeSection === section.id
                                    ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                                    : 'bg-black/30 border-gray-700 text-gray-400 hover:text-white'
                                } border`}
                        >
                            <section.icon className="w-5 h-5" />
                            {section.label}
                            <span className={`px-2 py-0.5 rounded-full text-xs ${activeSection === section.id ? 'bg-yellow-500/30' : 'bg-gray-700'
                                }`}>
                                {section.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {activeSection === 'scheduler' && (
                            <SchedulerSection tasks={tasks} onToggle={toggleTask} onRun={runTask} />
                        )}
                        {activeSection === 'webhooks' && (
                            <WebhooksSection webhooks={webhooks} onToggle={toggleWebhook} onTest={testWebhook} />
                        )}
                        {activeSection === 'abtesting' && (
                            <ABTestingSection tests={abTests} stats={abStats} onToggle={toggleABTest} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ==================== SCHEDULER SECTION ====================
function SchedulerSection({ tasks, onToggle, onRun }: {
    tasks: ScheduledTask[];
    onToggle: (id: string, active: boolean) => void;
    onRun: (id: string) => void;
}) {
    const activeTasks = tasks.filter(t => t.isActive).length;

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Active Tasks</div>
                    <div className="text-3xl font-bold text-white">{activeTasks} / {tasks.length}</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Total Executions</div>
                    <div className="text-3xl font-bold text-white">{tasks.reduce((sum, t) => sum + t.executionCount, 0)}</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Last Run</div>
                    <div className="text-xl font-bold text-white">
                        {tasks.find(t => t.lastRun)?.lastRun ? 'Recently' : 'Never'}
                    </div>
                </div>
            </div>

            {/* Tasks List */}
            <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    Scheduled Tasks
                </h3>
                <div className="space-y-3">
                    {tasks.map(task => (
                        <div key={task.id} className={`flex items-center justify-between p-4 rounded-xl border ${task.isActive ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-gray-500/10 border-gray-500/20'
                            }`}>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => onToggle(task.id, !task.isActive)}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${task.isActive ? 'bg-green-500' : 'bg-gray-600'
                                        }`}
                                >
                                    <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all ${task.isActive ? 'left-6' : 'left-0.5'
                                        }`} />
                                </button>
                                <div>
                                    <div className="text-white font-medium">{task.name}</div>
                                    <div className="text-gray-500 text-sm">{task.description}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-yellow-300 font-mono text-sm">{task.schedule}</div>
                                    <div className="text-gray-500 text-xs">{task.executionCount} runs</div>
                                </div>
                                <button
                                    onClick={() => onRun(task.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg transition-colors"
                                >
                                    <Play className="w-4 h-4 text-yellow-400" />
                                    <span className="text-yellow-300 text-sm">Run Now</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ==================== WEBHOOKS SECTION ====================
function WebhooksSection({ webhooks, onToggle, onTest }: {
    webhooks: Webhook[];
    onToggle: (id: string, active: boolean) => void;
    onTest: (id: string) => void;
}) {
    const typeColors: Record<string, string> = {
        TELEGRAM: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        DISCORD: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
        SLACK: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        CUSTOM: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };

    return (
        <div className="space-y-6">
            {/* Add New Webhook */}
            <button className="w-full flex items-center justify-center gap-2 p-4 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 border-dashed rounded-xl transition-colors">
                <Plus className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-300">Add New Webhook</span>
            </button>

            {/* Webhooks List */}
            <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BellRing className="w-5 h-5 text-yellow-400" />
                    Configured Webhooks
                </h3>
                <div className="space-y-3">
                    {webhooks.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No webhooks configured yet</p>
                    ) : (
                        webhooks.map(webhook => (
                            <div key={webhook.id} className={`flex items-center justify-between p-4 rounded-xl border ${webhook.isActive ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-gray-500/10 border-gray-500/20'
                                }`}>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => onToggle(webhook.id, !webhook.isActive)}
                                        className={`w-12 h-6 rounded-full relative transition-colors ${webhook.isActive ? 'bg-green-500' : 'bg-gray-600'
                                            }`}
                                    >
                                        <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all ${webhook.isActive ? 'left-6' : 'left-0.5'
                                            }`} />
                                    </button>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium">{webhook.name}</span>
                                            <span className={`px-2 py-0.5 rounded text-xs border ${typeColors[webhook.type]}`}>
                                                {webhook.type}
                                            </span>
                                        </div>
                                        <div className="text-gray-500 text-sm truncate max-w-xs">{webhook.url || 'No URL configured'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1 flex-wrap max-w-40">
                                        {webhook.events.slice(0, 2).map(event => (
                                            <span key={event} className="px-2 py-0.5 bg-black/30 rounded text-xs text-gray-400">
                                                {event}
                                            </span>
                                        ))}
                                        {webhook.events.length > 2 && (
                                            <span className="px-2 py-0.5 bg-black/30 rounded text-xs text-gray-500">
                                                +{webhook.events.length - 2}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => onTest(webhook.id)}
                                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                                        title="Test Webhook"
                                    >
                                        <Send className="w-4 h-4 text-blue-400" />
                                    </button>
                                    <button className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// ==================== A/B TESTING SECTION ====================
function ABTestingSection({ tests, stats, onToggle }: {
    tests: ABTest[];
    stats: any;
    onToggle: (id: string, active: boolean) => void;
}) {
    return (
        <div className="space-y-6">
            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                        <div className="text-gray-400 text-sm mb-1">Active Tests</div>
                        <div className="text-3xl font-bold text-white">{stats.activeTests}</div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                        <div className="text-gray-400 text-sm mb-1">With Winner</div>
                        <div className="text-3xl font-bold text-white">{stats.testsWithWinner}</div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                        <div className="text-gray-400 text-sm mb-1">Impressions</div>
                        <div className="text-3xl font-bold text-white">{stats.totalImpressions}</div>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                        <div className="text-gray-400 text-sm mb-1">Conversions</div>
                        <div className="text-3xl font-bold text-white">{stats.totalConversions}</div>
                    </div>
                </div>
            )}

            {/* Tests List */}
            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-purple-400" />
                    A/B Tests
                </h3>
                <div className="space-y-4">
                    {tests.map(test => (
                        <ABTestCard key={test.id} test={test} onToggle={onToggle} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function ABTestCard({ test, onToggle }: { test: ABTest; onToggle: (id: string, active: boolean) => void }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`rounded-xl border ${test.isActive ? 'bg-purple-500/10 border-purple-500/20' : 'bg-gray-500/10 border-gray-500/20'
            }`}>
            <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggle(test.id, !test.isActive); }}
                        className={`w-12 h-6 rounded-full relative transition-colors ${test.isActive ? 'bg-green-500' : 'bg-gray-600'
                            }`}
                    >
                        <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all ${test.isActive ? 'left-6' : 'left-0.5'
                            }`} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{test.name}</span>
                            <span className="px-2 py-0.5 bg-purple-500/20 rounded text-xs text-purple-400">
                                {test.type}
                            </span>
                            {test.winningVariant && (
                                <span className="px-2 py-0.5 bg-green-500/20 rounded text-xs text-green-400 flex items-center gap-1">
                                    <Trophy className="w-3 h-3" /> Winner Found
                                </span>
                            )}
                        </div>
                        <div className="text-gray-500 text-sm">{test.description}</div>
                    </div>
                </div>
                <div className="text-gray-400">
                    {test.variants.length} variants
                </div>
            </div>

            {expanded && (
                <div className="px-4 pb-4 border-t border-gray-700/50 mt-2 pt-4">
                    <div className="grid gap-3">
                        {test.variants.map(variant => {
                            const isWinner = test.winningVariant === variant.id;
                            return (
                                <div key={variant.id} className={`flex items-center justify-between p-3 rounded-lg ${isWinner ? 'bg-green-500/10 border border-green-500/30' : 'bg-black/20'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        {isWinner && <Trophy className="w-4 h-4 text-green-400" />}
                                        <span className="text-white font-medium">{variant.name}</span>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="text-gray-400">
                                            <span className="text-white font-medium">{variant.impressions}</span> impressions
                                        </div>
                                        <div className="text-gray-400">
                                            <span className="text-white font-medium">{variant.conversions}</span> conversions
                                        </div>
                                        <div className={`font-bold ${variant.conversionRate > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                                            {variant.conversionRate.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
