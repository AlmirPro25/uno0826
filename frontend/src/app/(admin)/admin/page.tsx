"use client";

import { useEffect, useState } from "react";
import { Users, DollarSign, BrainCircuit, Zap, BarChart3, Activity, ShieldAlert, Thermometer, CheckCircle2, Terminal, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type DashboardStats = {
    total_identities: number;
    total_revenue: number;
    active_subscriptions: number;
    pending_payouts: number;
    identities_last_24h: number;
    payments_last_24h: number;
};

type WarObsData = {
    global_stats: {
        total_requests: number;
        error_rate: number;
        p99_latency: number;
    };
    pressure: {
        overall_score: number;
        overall_level: string;
        overall_message: string;
    };
    slo_status: Record<string, {
        current_sla: number;
        target_sla: number;
        status: string;
    }>;
};

type Incident = {
    id: string;
    severity: string;
    trigger: string;
    description: string;
    affected_service: string;
    affected_routes: string[];
    status: string;
    started_at: string;
};

type KernelEvent = {
    id: string;
    event_type: string;
    source: string;
    description: string;
    created_at: string;
    metadata?: any;
};

type NarrativeExplanation = {
    summary: string;
    cause: string;
    confidence: number;
    recommended_human_action: string;
    uncertainty?: string;
    generated_at: string;
};

type HealthStats = {
    status: string;
    services: Record<string, string>;
    uptime: string;
};

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [warObs, setWarObs] = useState<WarObsData | null>(null);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [events, setEvents] = useState<KernelEvent[]>([]);
    const [narrative, setNarrative] = useState<NarrativeExplanation | null>(null);
    const [health, setHealth] = useState<HealthStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [explaining, setExplaining] = useState(false);

    const fetchData = async () => {
        try {
            const [statsRes, warRes, healthRes, incRes, evtRes] = await Promise.all([
                api.get("/admin/dashboard").catch(() => null),
                api.get("/warobs/dashboard").catch(() => null),
                api.get("/health").catch(() => null),
                api.get("/warobs/incidents").catch(() => null),
                api.get("/warobs/events").catch(() => null)
            ]);

            if (statsRes) setStats(statsRes.data);
            if (warRes && warRes.data.success) setWarObs(warRes.data.data);
            if (healthRes) setHealth(healthRes.data);
            if (incRes && incRes.data.success) setIncidents(incRes.data.data || []);
            if (evtRes && evtRes.data.success) setEvents(evtRes.data.data || []);
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchNarrative = async () => {
        setExplaining(true);
        try {
            const res = await api.get("/warobs/narrative/explain");
            if (res.data.success) {
                setNarrative(res.data.data);
            }
        } catch (err) {
            console.error("Narrative failed", err);
        } finally {
            setExplaining(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchNarrative();
        const interval = setInterval(fetchData, 10000); // Polling real a cada 10s para War Dashboard
        return () => clearInterval(interval);
    }, []);

    const cards = [
        {
            title: "Pressão de Guerra",
            value: warObs?.pressure?.overall_score !== undefined ? `${Math.round(warObs.pressure.overall_score)}%` : "-",
            change: warObs?.pressure?.overall_level || "UNKNOWN",
            trend: (warObs?.pressure?.overall_score || 0) > 50 ? "up" : "down",
            icon: Thermometer,
            color: (warObs?.pressure?.overall_score || 0) > 70 ? "text-red-500" : (warObs?.pressure?.overall_score || 0) > 40 ? "text-amber-500" : "text-emerald-500",
            bg: (warObs?.pressure?.overall_score || 0) > 70 ? "bg-red-500/10" : "bg-emerald-500/10"
        },
        {
            title: "Identidades Kernel",
            value: stats?.total_identities?.toLocaleString() || "-",
            change: stats?.identities_last_24h ? `+${stats.identities_last_24h} (24h)` : "Estável",
            trend: "up",
            icon: Users,
            color: "text-red-400",
            bg: "bg-red-500/10"
        },
        {
            title: "Vazão (Global)",
            value: warObs?.global_stats?.total_requests?.toLocaleString() || "-",
            change: `${warObs?.global_stats?.error_rate?.toFixed(2) || "0.00"}% ERRO`,
            trend: "neutral",
            icon: Activity,
            color: "text-zinc-300",
            bg: "bg-zinc-500/10"
        },
        {
            title: "Receita Capital",
            value: stats ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.total_revenue) : "-",
            change: stats?.payments_last_24h ? `+${stats.payments_last_24h} txns` : "Nominal",
            trend: "up",
            icon: DollarSign,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        }
    ];

    if (loading && !stats) return <div className="p-8 text-red-500/50 text-xs font-mono animate-pulse uppercase tracking-widest">Synchronizing with Kernel Virtual Pulse...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-red-200 to-red-500 tracking-tighter uppercase">
                        War Dashboard
                    </h1>
                    <p className="text-muted-foreground text-[10px] font-mono mt-1 flex items-center gap-2">
                        <Activity className="w-3 h-3 text-red-500" />
                        KERNEL_VERSION: 2.0.1 // STATUS: <span className={health?.status === 'healthy' ? "text-emerald-500" : "text-red-500"}>{health?.status?.toUpperCase() || "OFFLINE"}</span> // UPTIME: {health?.uptime || "-"}
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-500 animate-pulse flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        LIVE_TELEMETRY
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-6 rounded-2xl border border-white/5 bg-zinc-900/20 backdrop-blur-md relative overflow-hidden group hover:border-red-500/30 transition-all cursor-crosshair"
                    >
                        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity ${card.color}`}>
                            <card.icon className="w-12 h-12" />
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                                <card.icon className="w-4 h-4" />
                            </div>
                            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{card.title}</span>
                        </div>

                        <div className="space-y-1">
                            <div className="text-3xl font-black text-white tracking-tighter">{card.value}</div>
                            <div className="flex items-center gap-1.5">
                                <span className={cn(
                                    "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter",
                                    card.trend === 'up' ? "bg-emerald-500/10 text-emerald-500" :
                                        card.trend === 'down' ? "bg-red-500/10 text-red-500" : "bg-zinc-500/10 text-zinc-500"
                                )}>
                                    {card.change}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Latência e SLOs */}
                <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 bg-zinc-900/20 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" />
                            Service Level Objectives (SLOs)
                        </h3>
                        <span className="text-[10px] font-mono text-zinc-500">P99: {warObs?.global_stats?.p99_latency?.toFixed(2) || "0.00"}ms</span>
                    </div>

                    <div className="space-y-6">
                        {warObs?.slo_status ? Object.entries(warObs.slo_status).map(([name, status]) => (
                            <div key={name} className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-zinc-400">{name}</span>
                                    <span className={status.current_sla >= status.target_sla ? "text-emerald-500" : "text-red-500"}>
                                        {status.current_sla?.toFixed(3)}% / {status.target_sla}%
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${status.current_sla}%` }}
                                        className={cn(
                                            "h-full transition-all",
                                            status.current_sla >= status.target_sla ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                        )}
                                    />
                                </div>
                            </div>
                        )) : (
                            <div className="py-10 text-center text-zinc-600 font-mono text-xs uppercase italic tracking-widest">No active SLO monitors detected in Kernel.</div>
                        )}
                    </div>
                </div>

                {/* Pressure Analyzer */}
                <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-red-950/20 to-black backdrop-blur-md flex flex-col items-center justify-center min-h-[300px]">
                    <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8 w-full">
                        Pressure Index
                    </h3>

                    <div className="relative w-40 h-40">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
                            <motion.circle
                                cx="80" cy="80" r="70"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={440}
                                initial={{ strokeDashoffset: 440 }}
                                animate={{ strokeDashoffset: 440 - (440 * (warObs?.pressure?.overall_score || 0) / 100) }}
                                className={cn(
                                    "transition-all",
                                    (warObs?.pressure?.overall_score || 0) > 70 ? "text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" : (warObs?.pressure?.overall_score || 0) > 40 ? "text-amber-500" : "text-emerald-500"
                                )}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-white tracking-tighter">{Math.round(warObs?.pressure?.overall_score || 0)}</span>
                            <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">PSI</span>
                        </div>
                    </div>

                    <div className="mt-8 text-center px-4">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase leading-relaxed font-mono">
                            {warObs?.pressure?.overall_message || "System atmosphere is stable."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Cognitive Intelligence Layer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Kernel Consciousness / Narrative */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 rounded-3xl border border-red-500/20 bg-gradient-to-br from-black via-zinc-900 to-red-950/10 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <BrainCircuit className="w-32 h-32 text-red-500" />
                    </div>

                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                                <BrainCircuit className="w-5 h-5" />
                            </div>
                            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">Consciência do Kernel (Gemini)</h3>
                        </div>
                        <button
                            onClick={fetchNarrative}
                            disabled={explaining}
                            className="p-2 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={cn("w-4 h-4", explaining && "animate-spin")} />
                        </button>
                    </div>

                    {narrative ? (
                        <div className="space-y-6 relative z-10">
                            <div className="space-y-2">
                                <p className="text-xl font-bold text-white tracking-tight leading-7 italic">
                                    "{narrative.summary}"
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                        narrative.confidence > 0.8 ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                                    )}>
                                        Confiança: {Math.round(narrative.confidence * 100)}%
                                    </div>
                                    <span className="text-[9px] text-zinc-600 font-mono">Gerado em: {new Date(narrative.generated_at).toLocaleTimeString()}</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Causa Provável</span>
                                    <p className="text-[11px] text-zinc-300 leading-relaxed font-mono">{narrative.cause}</p>
                                </div>
                                {narrative.uncertainty && (
                                    <div className="space-y-1 pt-2 border-t border-white/5">
                                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Incertezas</span>
                                        <p className="text-[10px] text-zinc-500 leading-relaxed italic">{narrative.uncertainty}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                    <ShieldAlert className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Ação Humana Recomendada</span>
                                    <p className="text-[11px] text-zinc-300 font-bold">{narrative.recommended_human_action}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-12 h-12 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin mx-auto" />
                            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Analizando eventos do Kernel...</p>
                        </div>
                    )}
                </motion.div>

                {/* Memory: Incidents and Events */}
                <div className="space-y-6">
                    {/* Incidents Timeline */}
                    <div className="p-6 rounded-3xl border border-white/5 bg-zinc-900/20 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-red-500" />
                                Incidentes de Memória
                            </h3>
                            <span className="text-[10px] font-mono text-zinc-500">Últimas 24h</span>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {incidents.length > 0 ? incidents.map((inc) => (
                                <div key={inc.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 hover:bg-white/10 transition-colors">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        inc.severity === 'CRITICAL' ? "bg-red-500 animate-pulse" :
                                            inc.severity === 'HIGH' ? "bg-amber-500" : "bg-zinc-500"
                                    )} />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-white uppercase tracking-tight">{inc.trigger}</span>
                                            <span className="text-[9px] font-mono text-zinc-500">{new Date(inc.started_at).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-[10px] text-zinc-400 mt-1 truncate max-w-[200px]">{inc.description}</p>
                                    </div>
                                    <div className={cn(
                                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                        inc.status === 'OPEN' ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-500"
                                    )}>
                                        {inc.status}
                                    </div>
                                </div>
                            )) : (
                                <div className="py-12 text-center">
                                    <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest italic">Nenhum incidente na memória.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Kernel Events (Thought Feed) */}
                    <div className="p-6 rounded-3xl border border-white/5 bg-zinc-900/20 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-emerald-500" />
                                Kernel Thought Feed
                            </h3>
                        </div>

                        <div className="space-y-2 font-mono text-[9px] max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                            {events.length > 0 ? events.map((evt) => (
                                <div key={evt.id} className="flex gap-3 text-zinc-500 group hover:text-zinc-300 transition-colors">
                                    <span className="text-zinc-700 shrink-0">[{new Date(evt.created_at).toLocaleTimeString()}]</span>
                                    <span className={cn(
                                        "font-bold uppercase",
                                        evt.event_type === 'AUTO_DEFENSE_ACTION' ? "text-red-500" : "text-emerald-500"
                                    )}>{evt.event_type}:</span>
                                    <p className="truncate">{evt.description}</p>
                                </div>
                            )) : (
                                <p className="text-zinc-700 italic">O Kernel está em silêncio...</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Protocols and Guardians */}
            <div className="p-6 rounded-2xl border border-red-500/10 bg-red-500/5 backdrop-blur-sm border-dashed">
                <div className="flex items-center gap-3 text-red-500 mb-4 font-black text-xs uppercase tracking-widest">
                    <ShieldAlert className="w-4 h-4" />
                    Protocolo de Autodefesa: Circuit Breakers
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {events.filter(e => e.event_type === 'AUTO_DEFENSE_ACTION').slice(0, 3).map((defense) => (
                        <div key={defense.id} className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 animate-pulse">
                            <Zap className="w-5 h-5 text-red-500" />
                            <div>
                                <span className="text-[9px] font-black text-white uppercase tracking-widest">{defense.metadata?.route || "Global"}</span>
                                <p className="text-[10px] text-red-500 font-bold uppercase">BLOQUEIO ATIVO</p>
                            </div>
                        </div>
                    ))}
                    {events.filter(e => e.event_type === 'AUTO_DEFENSE_ACTION').length === 0 && (
                        <div className="md:col-span-3 flex items-center justify-center p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 gap-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest italic">
                                Todos os sistemas operando sem restrições.
                            </span>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
