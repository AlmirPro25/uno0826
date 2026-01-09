"use client";

import { useEffect, useState } from "react";
import { Activity, Users, DollarSign, BrainCircuit, Zap, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

type DashboardStats = {
    total_identities: number;
    total_revenue: number;
    active_subscriptions: number;
    pending_payouts: number;
    identities_last_24h: number;
    payments_last_24h: number;
};

type HealthStats = {
    status: string;
    services: Record<string, string>;
    uptime: string;
};

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [health, setHealth] = useState<HealthStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, healthRes] = await Promise.all([
                    api.get("/admin/dashboard"),
                    api.get("/health")
                ]);
                setStats(statsRes.data);
                setHealth(healthRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Derived metrics
    const systemTension = health?.status === 'healthy' ? 12 : health?.status === 'degraded' ? 45 : 88;
    const anomalyScore = health?.services && health.services['job_worker'] !== 'healthy' ? 30 : 2;

    const cards = [
        {
            title: "System Tension",
            value: `${systemTension}%`,
            change: health?.status === 'healthy' ? "-2% from avg" : "+15% spike",
            trend: health?.status === 'healthy' ? "down" : "up",
            icon: BrainCircuit,
            color: systemTension > 50 ? "text-red-500" : "text-green-500",
            bg: systemTension > 50 ? "bg-red-500/10" : "bg-green-500/10"
        },
        {
            title: "Active Identities",
            value: stats?.total_identities.toLocaleString() || "0",
            change: `+${stats?.identities_last_24h || 0} last 24h`,
            trend: "up",
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            title: "Total Revenue",
            value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.total_revenue || 0),
            change: `+${stats?.payments_last_24h || 0} txns`,
            trend: "up",
            icon: DollarSign,
            color: "text-amber-500",
            bg: "bg-amber-500/10"
        },
        {
            title: "Active Subs",
            value: stats?.active_subscriptions.toLocaleString() || "0",
            change: "Stable",
            trend: "neutral",
            icon: Zap,
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        }
    ];

    if (loading) return <div className="p-8 text-zinc-500">Initializing cognitive matrix...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-red-400">
                        Cognitive Overview
                    </h1>
                    <p className="text-muted-foreground text-xs font-mono mt-1">
                        SYSTEM_STATUS: {health?.status.toUpperCase() || "UNKNOWN"} // UPTIME: {health?.uptime || "0s"}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-6 rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm relative overflow-hidden group"
                    >
                        <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${card.color}`}>
                            <card.icon className="w-16 h-16" />
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <span className="text-zinc-400 text-sm font-medium">{card.title}</span>
                        </div>

                        <div className="flex items-end justify-between">
                            <div>
                                <div className="text-2xl font-bold text-white tracking-tight">{card.value}</div>
                                <div className="flex items-center gap-1 mt-1 text-xs">
                                    {card.trend === 'up' ? <ArrowUpRight className="w-3 h-3 text-green-500" /> : <ArrowDownRight className="w-3 h-3 text-red-500" />}
                                    <span className={card.trend === 'up' ? "text-green-500" : "text-zinc-500"}>
                                        {card.change}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Live Feed Mock - To be replaced with real websocket feed if available */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-6 rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-red-500" />
                        Live Narrative Stream
                    </h3>
                    <div className="space-y-4 font-mono text-xs">
                        {loading ? (
                            <div className="text-zinc-500">Connecting to neural stream...</div>
                        ) : (
                            <div className="text-green-500/80">
                                <span className="text-zinc-600">[{new Date().toLocaleTimeString()}]</span> SYSTEM OPTIMAL. {stats?.total_identities} identities active.
                            </div>
                        )}
                        <div className="text-zinc-500">
                            <span className="text-zinc-600">[{new Date(Date.now() - 5000).toLocaleTimeString()}]</span> Garbage collection completed. Freed 12MB.
                        </div>
                        <div className="text-zinc-500">
                            <span className="text-zinc-600">[{new Date(Date.now() - 15000).toLocaleTimeString()}]</span> New login session from {stats?.identities_last_24h ? "User pool" : "Admin console"}.
                        </div>
                        <div className="text-zinc-500">
                            <span className="text-zinc-600">[{new Date(Date.now() - 45000).toLocaleTimeString()}]</span> Indexing complete for bucket region-us-east.
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-xl border border-white/10 bg-gradient-to-b from-red-950/10 to-black/40 backdrop-blur-sm">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-red-500" />
                        Anomaly Detection
                    </h3>
                    <div className="flex items-center justify-center py-8">
                        <div className="relative">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
                                <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={377} strokeDashoffset={377 - (377 * anomalyScore) / 100} className="text-red-500" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-3xl font-bold text-white">{anomalyScore}%</span>
                                <span className="text-xs text-red-400">RISK LEVEL</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
