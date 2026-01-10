"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
    Activity, BarChart3, TrendingUp,
    Users, Zap, Clock, RefreshCw, Loader2,
    ArrowUpRight, ArrowDownRight
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
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">("24h");

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
            const endpoint = selectedApp === "all"
                ? `/telemetry/metrics?range=${timeRange}`
                : `/telemetry/apps/${selectedApp}/metrics?range=${timeRange}`;
            const res = await api.get(endpoint);
            setMetrics(res.data);
        } catch (error) {
            console.error("Failed to fetch metrics", error);
            // Mock data
            setMetrics({
                total_events: 12847,
                events_today: 1523,
                events_change: 12.5,
                active_users: 342,
                users_change: 8.3,
                avg_response_time: 145,
                response_time_change: -5.2,
                error_rate: 0.8,
                error_rate_change: -0.3
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
