"use client";

import { useEffect, useState } from "react";
import { Users, DollarSign, BrainCircuit, Zap, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
                    api.get("/admin/dashboard").catch(() => null),
                    api.get("/health").catch(() => null)
                ]);
                if (statsRes) setStats(statsRes.data);
                if (healthRes) setHealth(healthRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Polling real a cada 30s
        return () => clearInterval(interval);
    }, []);

    // Métricas derivadas de dados reais
    const systemTension = health?.status === 'healthy' ? 0 : health?.status === 'degraded' ? 50 : 100;
    const anomalyScore = health?.services && Object.values(health.services).some(s => s !== 'healthy') ? 1 : 0;

    const cards = [
        {
            title: "Tensão do Sistema",
            value: `${systemTension}%`,
            change: health?.status === 'healthy' ? "Nominal" : "Degradado",
            trend: health?.status === 'healthy' ? "down" : "up",
            icon: BrainCircuit,
            color: systemTension > 50 ? "text-red-500" : "text-emerald-500",
            bg: systemTension > 50 ? "bg-red-500/10" : "bg-emerald-500/10"
        },
        {
            title: "Identidades Ativas",
            value: stats?.total_identities.toLocaleString() || "-",
            change: stats?.identities_last_24h ? `+${stats.identities_last_24h} (24h)` : "Sem novos registros",
            trend: "up",
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            title: "Receita Total",
            value: stats ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.total_revenue) : "-",
            change: stats?.payments_last_24h ? `+${stats.payments_last_24h} txns` : "Sem movimento recente",
            trend: "up",
            icon: DollarSign,
            color: "text-amber-500",
            bg: "bg-amber-500/10"
        },
        {
            title: "Assinaturas Ativas",
            value: stats?.active_subscriptions.toLocaleString() || "-",
            change: "Total recorrente",
            trend: "neutral",
            icon: Zap,
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        }
    ];

    if (loading && !stats) return <div className="p-8 text-zinc-500 text-sm animate-pulse">Carregando métricas do Kernel...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-red-400">
                        Visão Geral
                    </h1>
                    <p className="text-muted-foreground text-xs font-mono mt-1">
                        SYSTEM_STATUS: {health?.status.toUpperCase() || "OFFLINE"} // UPTIME: {health?.uptime || "-"}
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
                                    <span className={card.change.includes("Sem") ? "text-zinc-500" : "text-zinc-300"}>
                                        {card.change}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Seções fake (Logs Stream e Anomaly Graph complexo) removidas. 
                Ficar apenas com o que é dado real e sólido. 
                Se o usuário quiser logs, devemos implementar um LogViewer real conectando ao backend.
            */}

            <div className="p-6 rounded-xl border border-white/10 bg-gradient-to-b from-red-950/10 to-black/40 backdrop-blur-sm">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-red-500" />
                    Estado de Anomalia
                </h3>
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <svg className="w-24 h-24 transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-zinc-800" />
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={251} strokeDashoffset={251 - (251 * anomalyScore * 100)} className={anomalyScore > 0 ? "text-red-500" : "text-emerald-500"} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-xl font-bold text-white">{anomalyScore > 0 ? "ALERTA" : "OK"}</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-zinc-400">
                            O sistema monitora serviços críticos.
                            {anomalyScore > 0
                                ? " Uma ou mais anomalias detectadas nos serviços."
                                : " Nenhum comportamento anômalo detectado nos serviços monitorados."}
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
}
