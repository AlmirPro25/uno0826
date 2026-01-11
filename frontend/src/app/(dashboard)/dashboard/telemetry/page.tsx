"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
    Activity, BarChart3, TrendingUp,
    Users, Zap, Clock, RefreshCw, Loader2,
    ArrowUpRight, ArrowDownRight, Radio
} from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface App {
    id: string;
    name: string;
    slug: string;
}

// Pulse metrics - prova de vida
interface PulseMetrics {
    events_24h: number;
    events_5min: number;
    last_event_at: string | null;
    online_now: number;
    events_1h: number;
    total_events: number;
}

interface TelemetryMetrics {
    total_events: number;
    events_today: number;
    events_change: number;
    active_users: number;
    users_change: number;
    avg_response_time: number;
    response_time_change: number;
    error_rate: number;
    error_rate_change: number;
}

export default function TelemetryPage() {
    const { activeApp } = useApp();
    const [apps, setApps] = useState<App[]>([]);
    const [selectedApp, setSelectedApp] = useState<string>("all");
    const [metrics, setMetrics] = useState<TelemetryMetrics | null>(null);
    const [pulse, setPulse] = useState<PulseMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">("24h");

    // Formatar tempo relativo
    const formatRelativeTime = (timestamp: string | null) => {
        if (!timestamp) return null;
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        
        if (diffSec < 60) return `${diffSec}s atrás`;
        if (diffMin < 60) return `${diffMin}min atrás`;
        if (diffHour < 24) return `${diffHour}h atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    // Sincronizar com app ativo do contexto
    useEffect(() => {
        if (activeApp && selectedApp === "all") {
            setSelectedApp(activeApp.id);
        }
    }, [activeApp, selectedApp]);

    const fetchApps = async () => {
        try {
            const res = await api.get("/apps/mine");
            setApps(res.data.apps || []);
        } catch (error) {
            console.error("Failed to fetch apps", error);
        }
    };

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            if (selectedApp === "all") {
                // Agregar métricas de todos os apps
                let totalEvents = 0;
                let totalUsers = 0;
                let totalResponseTime = 0;
                let appCount = 0;
                const aggregatedPulse: PulseMetrics = {
                    events_24h: 0,
                    events_5min: 0,
                    events_1h: 0,
                    last_event_at: null,
                    online_now: 0,
                    total_events: 0
                };
                
                for (const app of apps) {
                    try {
                        const res = await api.get(`/admin/telemetry/apps/${app.id}/metrics`);
                        if (res.data) {
                            totalEvents += res.data.total_events || 0;
                            totalUsers += res.data.active_users_24h || 0;
                            totalResponseTime += res.data.avg_response_time || 0;
                            appCount++;
                            
                            // Agregar pulse
                            aggregatedPulse.events_24h += res.data.events_24h || 0;
                            aggregatedPulse.events_1h += res.data.events_1h || 0;
                            aggregatedPulse.events_5min += Math.round((res.data.events_per_minute || 0) * 5);
                            aggregatedPulse.online_now += res.data.online_now || 0;
                            aggregatedPulse.total_events += res.data.total_events || 0;
                            
                            // Pegar o último evento mais recente
                            if (res.data.last_event_at) {
                                if (!aggregatedPulse.last_event_at || 
                                    new Date(res.data.last_event_at) > new Date(aggregatedPulse.last_event_at)) {
                                    aggregatedPulse.last_event_at = res.data.last_event_at;
                                }
                            }
                        }
                    } catch {
                        // App pode não ter métricas
                    }
                }
                
                setPulse(aggregatedPulse);
                setMetrics({
                    total_events: totalEvents,
                    events_today: Math.floor(totalEvents * 0.12),
                    events_change: 0,
                    active_users: totalUsers,
                    users_change: 0,
                    avg_response_time: appCount > 0 ? Math.floor(totalResponseTime / appCount) : 0,
                    response_time_change: 0,
                    error_rate: 0,
                    error_rate_change: 0
                });
            } else {
                const res = await api.get(`/admin/telemetry/apps/${selectedApp}/metrics`);
                const data = res.data;
                
                // Pulse metrics
                setPulse({
                    events_24h: data.events_24h || 0,
                    events_5min: Math.round((data.events_per_minute || 0) * 5),
                    events_1h: data.events_1h || 0,
                    last_event_at: data.last_event_at || null,
                    online_now: data.online_now || 0,
                    total_events: data.total_events || 0
                });
                
                setMetrics({
                    total_events: data.total_events || 0,
                    events_today: data.events_per_minute ? data.events_per_minute * 60 * 24 : 0,
                    events_change: 0,
                    active_users: data.active_users_24h || data.online_now || 0,
                    users_change: 0,
                    avg_response_time: data.avg_response_time || 0,
                    response_time_change: 0,
                    error_rate: data.error_rate || 0,
                    error_rate_change: 0
                });
            }
        } catch (error) {
            console.error("Failed to fetch metrics", error);
            setPulse(null);
            setMetrics({
                total_events: 0,
                events_today: 0,
                events_change: 0,
                active_users: 0,
                users_change: 0,
                avg_response_time: 0,
                response_time_change: 0,
                error_rate: 0,
                error_rate_change: 0
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApps();
    }, []);

    useEffect(() => {
        fetchMetrics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedApp, timeRange]);

    const statCards = metrics ? [
        {
            title: "Eventos Total",
            value: metrics.total_events.toLocaleString(),
            change: metrics.events_change,
            icon: Activity,
            color: "indigo"
        },
        {
            title: "Usuários Ativos",
            value: metrics.active_users.toLocaleString(),
            change: metrics.users_change,
            icon: Users,
            color: "emerald"
        },
        {
            title: "Tempo de Resposta",
            value: `${metrics.avg_response_time}ms`,
            change: metrics.response_time_change,
            icon: Clock,
            color: "blue",
            invertChange: true
        },
        {
            title: "Taxa de Erro",
            value: `${metrics.error_rate}%`,
            change: metrics.error_rate_change,
            icon: Zap,
            color: "rose",
            invertChange: true
        }
    ] : [];

    return (
        <div className="space-y-6 pb-12">
            {/* App Context Header */}
            <AppHeader />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                        Telemetria {activeApp ? `de ${activeApp.name}` : "do Kernel"}
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Métricas e performance em tempo real
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={fetchMetrics}
                        disabled={loading}
                        className="h-10 px-4 rounded-xl border-white/10 text-white hover:bg-white/5"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <select
                    value={selectedApp}
                    onChange={(e) => setSelectedApp(e.target.value)}
                    className="h-10 px-4 rounded-xl bg-white/[0.02] border border-white/10 text-white focus:border-indigo-500/50 outline-none"
                >
                    <option value="all">Todos os Apps</option>
                    {apps.map(app => (
                        <option key={app.id} value={app.id}>{app.name}</option>
                    ))}
                </select>
                <div className="flex rounded-xl border border-white/10 overflow-hidden">
                    {(["1h", "24h", "7d", "30d"] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={cn(
                                "px-4 py-2 text-xs font-bold uppercase transition-colors",
                                timeRange === range
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white/[0.02] text-slate-400 hover:text-white"
                            )}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : (
                <>
                    {/* PULSE - Prova de vida (destaque) */}
                    {pulse && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600/10 to-purple-600/5 border border-indigo-500/20"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className={cn(
                                    "h-3 w-3 rounded-full",
                                    pulse.events_5min > 0 ? "bg-emerald-500 animate-pulse" : "bg-slate-600"
                                )} />
                                <h3 className="font-black text-white uppercase tracking-tight">
                                    Pulso do Sistema
                                </h3>
                                <Radio className="w-4 h-4 text-indigo-400" />
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {/* Eventos 24h */}
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                        Últimas 24h
                                    </p>
                                    <p className="text-3xl font-black text-white">
                                        {pulse.events_24h.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-slate-500">eventos</p>
                                </div>
                                
                                {/* Eventos 5min */}
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                        Últimos 5 min
                                    </p>
                                    <p className={cn(
                                        "text-3xl font-black",
                                        pulse.events_5min > 0 ? "text-emerald-400" : "text-white"
                                    )}>
                                        {pulse.events_5min.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-slate-500">eventos</p>
                                </div>
                                
                                {/* Online agora */}
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                        Online Agora
                                    </p>
                                    <p className={cn(
                                        "text-3xl font-black",
                                        pulse.online_now > 0 ? "text-emerald-400" : "text-white"
                                    )}>
                                        {pulse.online_now.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-slate-500">usuários</p>
                                </div>
                                
                                {/* Último evento */}
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                        Último Evento
                                    </p>
                                    {pulse.last_event_at ? (
                                        <>
                                            <p className="text-xl font-black text-white">
                                                {formatRelativeTime(pulse.last_event_at)}
                                            </p>
                                            <p className="text-xs text-slate-500">recebido</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-xl font-bold text-slate-600">—</p>
                                            <p className="text-xs text-slate-500">nenhum ainda</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {statCards.map((stat, i) => (
                            <motion.div
                                key={stat.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        stat.color === "indigo" && "bg-indigo-500/20 text-indigo-400",
                                        stat.color === "emerald" && "bg-emerald-500/20 text-emerald-400",
                                        stat.color === "blue" && "bg-blue-500/20 text-blue-400",
                                        stat.color === "rose" && "bg-rose-500/20 text-rose-400"
                                    )}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div className={cn(
                                        "flex items-center gap-1 text-xs font-bold",
                                        (stat.invertChange ? stat.change < 0 : stat.change > 0)
                                            ? "text-emerald-400"
                                            : "text-rose-400"
                                    )}>
                                        {(stat.invertChange ? stat.change < 0 : stat.change > 0) 
                                            ? <ArrowUpRight className="w-3 h-3" />
                                            : <ArrowDownRight className="w-3 h-3" />
                                        }
                                        {Math.abs(stat.change)}%
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                    {stat.title}
                                </p>
                                <p className="text-3xl font-black text-white">{stat.value}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Events Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="p-6 rounded-2xl bg-white/[0.02] border border-white/5"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-white uppercase tracking-tight">Eventos por Hora</h3>
                                <BarChart3 className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div className="h-48 flex items-end justify-between gap-1">
                                {Array.from({ length: 24 }, (_, i) => {
                                    const height = 20 + Math.random() * 80;
                                    return (
                                        <div
                                            key={i}
                                            className="flex-1 bg-indigo-500/30 hover:bg-indigo-500/50 rounded-t transition-all cursor-pointer"
                                            style={{ height: `${height}%` }}
                                            title={`${i}:00 - ${Math.floor(height * 10)} eventos`}
                                        />
                                    );
                                })}
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-slate-600">
                                <span>00:00</span>
                                <span>12:00</span>
                                <span>23:00</span>
                            </div>
                        </motion.div>

                        {/* Response Time Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="p-6 rounded-2xl bg-white/[0.02] border border-white/5"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-white uppercase tracking-tight">Tempo de Resposta</h3>
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div className="h-48 flex items-end justify-between gap-1">
                                {Array.from({ length: 24 }, (_, i) => {
                                    const height = 30 + Math.random() * 40;
                                    return (
                                        <div
                                            key={i}
                                            className="flex-1 bg-emerald-500/30 hover:bg-emerald-500/50 rounded-t transition-all cursor-pointer"
                                            style={{ height: `${height}%` }}
                                            title={`${i}:00 - ${Math.floor(100 + height)}ms`}
                                        />
                                    );
                                })}
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-slate-600">
                                <span>00:00</span>
                                <span>12:00</span>
                                <span>23:00</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Top Events */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="p-6 rounded-2xl bg-white/[0.02] border border-white/5"
                    >
                        <h3 className="font-bold text-white uppercase tracking-tight mb-6">Top Eventos</h3>
                        <div className="space-y-4">
                            {[
                                { type: "api.request", count: 4521, percentage: 35 },
                                { type: "identity.auth.success", count: 2847, percentage: 22 },
                                { type: "billing.event.ingested", count: 1923, percentage: 15 },
                                { type: "app.event.created", count: 1456, percentage: 11 },
                                { type: "governance.check", count: 892, percentage: 7 },
                            ].map((event, i) => (
                                <div key={event.type} className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-slate-500 w-6">{i + 1}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-bold text-white font-mono">{event.type}</span>
                                            <span className="text-xs text-slate-500">{event.count.toLocaleString()}</span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-indigo-500 rounded-full"
                                                style={{ width: `${event.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    );
}
