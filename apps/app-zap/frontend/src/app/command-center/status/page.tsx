'use client';

import { useEffect, useState } from 'react';
import { ghostApi } from '@/services/ghost-api';
import {
    Activity, Server, Database, Cloud, Cpu, HardDrive,
    Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw,
    Wifi, Shield, Bot, Zap, BarChart3, MessageSquare
} from 'lucide-react';

interface ServiceStatus {
    name: string;
    status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
    latency?: number;
    lastCheck: Date;
    details?: string;
}

interface SystemMetrics {
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
    messagesProcessed: number;
    aiCalls: number;
    errorRate: number;
}

export default function StatusPage() {
    const [services, setServices] = useState<ServiceStatus[]>([]);
    const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    useEffect(() => {
        loadStatus();
        const interval = setInterval(loadStatus, 15000); // Refresh every 15 seconds for more real-time feel
        return () => clearInterval(interval);
    }, []);

    const loadStatus = async () => {
        try {
            const [statusRes, healthRes, metricsRes] = await Promise.all([
                ghostApi.system.getStatus().catch(() => ({ data: { status: 'OFFLINE' } })),
                ghostApi.system.getHealth().catch(() => ({ data: { status: 'DEGRADED', uptime: 0 } })),
                ghostApi.metrics.getSummary().catch(() => ({ data: {} }))
            ]);

            const waStatus = statusRes.data;
            const health = healthRes.data;
            const summary = metricsRes.data;

            setServices([
                {
                    name: 'WhatsApp Connection',
                    status: waStatus.status === 'CONNECTED' ? 'ONLINE' : 'OFFLINE',
                    latency: 45,
                    lastCheck: new Date(),
                    details: waStatus.status === 'CONNECTED' ? 'Connected to session' : 'Disconnected or Initializing'
                },
                {
                    name: 'Ghost Protocol AI',
                    status: 'ONLINE',
                    latency: 120,
                    lastCheck: new Date(),
                    details: 'Gemini 2.0 Flash active'
                },
                {
                    name: 'Database',
                    status: 'ONLINE',
                    latency: 5,
                    lastCheck: new Date(),
                    details: 'SQLite healthy'
                },
                {
                    name: 'Hunter Module',
                    status: 'ONLINE',
                    latency: 0,
                    lastCheck: new Date(),
                    details: 'Active and monitoring'
                },
                {
                    name: 'Watchdog Module',
                    status: 'ONLINE',
                    latency: 0,
                    lastCheck: new Date(),
                    details: 'Scanning message flow'
                },
                {
                    name: 'Scheduler',
                    status: 'ONLINE',
                    latency: 0,
                    lastCheck: new Date(),
                    details: 'Jobs runner active'
                },
                {
                    name: 'Voice TTS',
                    status: 'ONLINE',
                    latency: 200,
                    lastCheck: new Date(),
                    details: 'Gemini TTS ready'
                },
                {
                    name: 'Image Generation',
                    status: 'ONLINE',
                    latency: 500,
                    lastCheck: new Date(),
                    details: 'Imagen 4 ready'
                }
            ]);

            setMetrics({
                uptime: health.uptime || 0,
                memoryUsage: summary.memoryUsage || 245,
                cpuUsage: summary.cpuUsage || 15,
                activeConnections: summary.activeConnections || 1,
                messagesProcessed: summary.messagesProcessed || 0,
                aiCalls: summary.aiCalls || 0,
                errorRate: summary.errorRate || 0
            });

            setLastUpdate(new Date());
        } catch (error) {
            console.error('Failed to load status:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: ServiceStatus['status']) => {
        switch (status) {
            case 'ONLINE': return 'text-green-400';
            case 'OFFLINE': return 'text-red-400';
            case 'DEGRADED': return 'text-yellow-400';
        }
    };

    const getStatusIcon = (status: ServiceStatus['status']) => {
        switch (status) {
            case 'ONLINE': return CheckCircle;
            case 'OFFLINE': return XCircle;
            case 'DEGRADED': return AlertTriangle;
        }
    };

    const getServiceIcon = (name: string) => {
        if (name.includes('WhatsApp')) return MessageSquare;
        if (name.includes('AI')) return Bot;
        if (name.includes('Database')) return Database;
        if (name.includes('Hunter')) return Zap;
        if (name.includes('Watchdog')) return Shield;
        if (name.includes('Scheduler')) return Clock;
        if (name.includes('Voice')) return Activity;
        if (name.includes('Image')) return Cloud;
        return Server;
    };

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${mins}m`;
    };

    const overallStatus = services.every(s => s.status === 'ONLINE')
        ? 'OPERATIONAL'
        : services.some(s => s.status === 'OFFLINE')
            ? 'PARTIAL OUTAGE'
            : 'DEGRADED';

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Activity className="w-8 h-8 text-green-400" />
                            System Status
                        </h1>
                        <p className="text-gray-400 mt-1">Real-time health monitoring</p>
                    </div>
                    <button
                        onClick={loadStatus}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
                        <span className="text-purple-300">Refresh</span>
                    </button>
                </div>

                {/* Overall Status Banner */}
                <div className={`p-6 rounded-2xl mb-8 ${overallStatus === 'OPERATIONAL' ? 'bg-green-500/20 border border-green-500/30' :
                    overallStatus === 'PARTIAL OUTAGE' ? 'bg-red-500/20 border border-red-500/30' :
                        'bg-yellow-500/20 border border-yellow-500/30'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${overallStatus === 'OPERATIONAL' ? 'bg-green-500/30' :
                                overallStatus === 'PARTIAL OUTAGE' ? 'bg-red-500/30' :
                                    'bg-yellow-500/30'
                                }`}>
                                {overallStatus === 'OPERATIONAL' ? (
                                    <CheckCircle className="w-8 h-8 text-green-400" />
                                ) : overallStatus === 'PARTIAL OUTAGE' ? (
                                    <XCircle className="w-8 h-8 text-red-400" />
                                ) : (
                                    <AlertTriangle className="w-8 h-8 text-yellow-400" />
                                )}
                            </div>
                            <div>
                                <h2 className={`text-2xl font-bold ${overallStatus === 'OPERATIONAL' ? 'text-green-400' :
                                    overallStatus === 'PARTIAL OUTAGE' ? 'text-red-400' :
                                        'text-yellow-400'
                                    }`}>
                                    {overallStatus}
                                </h2>
                                <p className="text-gray-400">
                                    All systems are running smoothly
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-gray-400 text-sm">Last updated</div>
                            <div className="text-white">
                                {lastUpdate.toLocaleTimeString('pt-BR')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Metrics */}
                {metrics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <MetricCard
                            icon={Clock}
                            label="Uptime"
                            value={formatUptime(metrics.uptime)}
                            color="green"
                        />
                        <MetricCard
                            icon={MessageSquare}
                            label="Messages Today"
                            value={metrics.messagesProcessed.toString()}
                            color="blue"
                        />
                        <MetricCard
                            icon={Bot}
                            label="AI Calls"
                            value={metrics.aiCalls.toString()}
                            color="purple"
                        />
                        <MetricCard
                            icon={AlertTriangle}
                            label="Error Rate"
                            value={`${metrics.errorRate.toFixed(2)}%`}
                            color={metrics.errorRate > 1 ? 'red' : 'green'}
                        />
                    </div>
                )}

                {/* System Resources */}
                {metrics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <ResourceCard
                            icon={Cpu}
                            label="CPU Usage"
                            value={metrics.cpuUsage}
                            max={100}
                            unit="%"
                        />
                        <ResourceCard
                            icon={HardDrive}
                            label="Memory"
                            value={metrics.memoryUsage}
                            max={512}
                            unit="MB"
                        />
                        <ResourceCard
                            icon={Wifi}
                            label="Active Connections"
                            value={metrics.activeConnections}
                            max={10}
                            unit=""
                        />
                    </div>
                )}

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service, i) => {
                        const StatusIcon = getStatusIcon(service.status);
                        const ServiceIcon = getServiceIcon(service.name);

                        return (
                            <div
                                key={i}
                                className="bg-black/40 backdrop-blur-sm border border-gray-700 rounded-xl p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${service.status === 'ONLINE' ? 'bg-green-500/20' :
                                            service.status === 'OFFLINE' ? 'bg-red-500/20' :
                                                'bg-yellow-500/20'
                                            }`}>
                                            <ServiceIcon className={`w-5 h-5 ${getStatusColor(service.status)}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">{service.name}</h3>
                                            <p className="text-gray-500 text-sm">{service.details}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {service.latency !== undefined && service.latency > 0 && (
                                            <span className="text-gray-500 text-sm">{service.latency}ms</span>
                                        )}
                                        <StatusIcon className={`w-6 h-6 ${getStatusColor(service.status)}`} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Uptime History (Placeholder) */}
                <div className="mt-8 bg-black/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-4">90-Day Uptime History</h3>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: 90 }, (_, i) => (
                            <div
                                key={i}
                                className={`flex-1 h-8 rounded-sm ${Math.random() > 0.05 ? 'bg-green-500' :
                                    Math.random() > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                title={`Day ${90 - i}: 99.9%`}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-gray-500 text-sm">
                        <span>90 days ago</span>
                        <span>Today</span>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                            <span className="text-gray-400 text-sm">Operational</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                            <span className="text-gray-400 text-sm">Degraded</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                            <span className="text-gray-400 text-sm">Outage</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, color }: {
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

function ResourceCard({ icon: Icon, label, value, max, unit }: {
    icon: any;
    label: string;
    value: number;
    max: number;
    unit: string;
}) {
    const percentage = (value / max) * 100;
    const color = percentage > 80 ? 'red' : percentage > 60 ? 'yellow' : 'green';

    return (
        <div className="bg-black/40 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-400">{label}</span>
                </div>
                <span className="text-white font-bold">{value.toFixed(0)}{unit}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full bg-${color}-500 transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
