"use client";

import { useState, useEffect } from "react";
import { 
    GitBranch, Search, Clock, CheckCircle2, XCircle, AlertTriangle,
    Loader2, RefreshCw, Info, Brain, Zap, Ghost, Activity,
    ChevronRight, Eye
} from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
    StateColors, 
    ActionTerms, 
    formatRelativeTime 
} from "@/lib/system-states";
import Link from "next/link";

interface TimelineEvent {
    id: string;
    decision_id: string;
    event_type: string;
    actor: string;
    actor_type: "rule" | "agent" | "user" | "system";
    action: string;
    result: "success" | "failure" | "blocked" | "simulated" | "pending";
    timestamp: string;
    duration_ms?: number;
    context: Record<string, unknown>;
}

// Configuração visual por tipo de resultado
const resultConfig: Record<string, { label: string; color: keyof typeof StateColors; icon: typeof CheckCircle2 }> = {
    success: { label: ActionTerms.EXECUTED, color: "success", icon: CheckCircle2 },
    failure: { label: ActionTerms.FAILED, color: "failure", icon: XCircle },
    blocked: { label: ActionTerms.BLOCKED, color: "warning", icon: AlertTriangle },
    simulated: { label: ActionTerms.SIMULATED, color: "simulation", icon: Ghost },
    pending: { label: ActionTerms.PENDING, color: "neutral", icon: Clock },
};

// Configuração visual por tipo de ator
const actorConfig: Record<string, { label: string; icon: typeof Brain }> = {
    rule: { label: "Regra", icon: Brain },
    agent: { label: "Agente", icon: Zap },
    user: { label: "Usuário", icon: Activity },
    system: { label: "Sistema", icon: GitBranch },
};

export default function TimelinePage() {
    const { activeApp, hasApp } = useApp();
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterResult, setFilterResult] = useState<string>("all");
    const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

    const fetchTimeline = async () => {
        setLoading(true);
        try {
            const endpoint = activeApp 
                ? `/timeline/app/${activeApp.id}?limit=50`
                : `/timeline/search?limit=50`;
            const res = await api.get(endpoint);
            const data = res.data.timelines || res.data || [];
            setEvents(data.map((t: Record<string, unknown>) => ({
                id: t.id,
                decision_id: t.decision_id,
                event_type: t.decision_type || t.event_type || "decision",
                actor: t.actor_name || (t.actor_type === "agent" ? `agent-${t.actor_id}` : `user-${t.actor_id}`),
                actor_type: t.actor_type || "system",
                action: t.action || t.decision_type,
                result: t.simulated ? "simulated" : 
                        t.outcome === "allowed" || t.was_allowed ? "success" : 
                        t.outcome === "blocked" ? "blocked" : 
                        t.outcome === "failed" ? "failure" : "pending",
                timestamp: t.created_at || t.executed_at,
                duration_ms: t.duration_ms,
                context: {
                    policy_result: t.policy_result,
                    threshold_result: t.threshold_result,
                    divergence: t.divergence,
                    rule_id: t.rule_id,
                    rule_name: t.rule_name,
                    ...(t.context || {})
                }
            })));
        } catch (error) {
            console.error("Failed to fetch timeline", error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTimeline();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeApp]);

    const filteredEvents = events.filter(event => {
        const matchesSearch = !search || 
            event.decision_id.toLowerCase().includes(search.toLowerCase()) ||
            event.actor.toLowerCase().includes(search.toLowerCase()) ||
            event.action.toLowerCase().includes(search.toLowerCase());
        const matchesResult = filterResult === "all" || event.result === filterResult;
        return matchesSearch && matchesResult;
    });

    // Estatísticas
    const stats = {
        total: events.length,
        success: events.filter(e => e.result === "success").length,
        failure: events.filter(e => e.result === "failure").length,
        simulated: events.filter(e => e.result === "simulated").length,
        blocked: events.filter(e => e.result === "blocked").length,
    };

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
                        <GitBranch className="w-8 h-8 text-indigo-400" />
                        Decision Timeline
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Rastreie cada passo de uma decisão do sistema
                    </p>
                </div>
                <button
                    onClick={fetchTimeline}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors"
                >
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    Atualizar
                </button>
            </div>

            {/* Explicação */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20"
            >
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-indigo-300 font-medium">O que é a Timeline?</p>
                        <p className="text-xs text-slate-400 mt-1">
                            A timeline mostra o histórico completo de decisões do sistema. 
                            Cada entrada representa uma avaliação de regra, execução de ação, ou simulação.
                            Use para auditar e entender o comportamento do kernel.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: "Total", value: stats.total, color: "indigo", icon: GitBranch },
                    { label: "Executados", value: stats.success, color: "emerald", icon: CheckCircle2 },
                    { label: "Falhas", value: stats.failure, color: "rose", icon: XCircle },
                    { label: "Simulados", value: stats.simulated, color: "violet", icon: Ghost },
                    { label: "Bloqueados", value: stats.blocked, color: "amber", icon: AlertTriangle },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4 rounded-xl bg-white/[0.02] border border-white/5"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <stat.icon className={cn("w-4 h-4", `text-${stat.color}-400`)} />
                            <span className="text-xs font-bold text-slate-500 uppercase">{stat.label}</span>
                        </div>
                        <p className={cn("text-2xl font-black", `text-${stat.color}-400`)}>{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por decision_id, ator ou ação..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
                    />
                </div>
                <select
                    value={filterResult}
                    onChange={(e) => setFilterResult(e.target.value)}
                    className="h-12 px-4 rounded-xl bg-white/[0.02] border border-white/10 text-white focus:border-indigo-500/50 outline-none"
                >
                    <option value="all">Todos</option>
                    <option value="success">Executados</option>
                    <option value="failure">Falhas</option>
                    <option value="simulated">Simulados</option>
                    <option value="blocked">Bloqueados</option>
                </select>
            </div>

            {/* Timeline */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <GitBranch className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">
                        {hasApp && activeApp 
                            ? `${activeApp.name} ainda não tem eventos na timeline` 
                            : "Nenhum evento encontrado"}
                    </p>
                    <Link href="/dashboard/rules" className="text-indigo-400 text-sm mt-2 inline-block hover:underline">
                        Criar regras para gerar eventos →
                    </Link>
                </div>
            ) : (
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/50 via-white/10 to-transparent" />
                    
                    <div className="space-y-3">
                        {filteredEvents.map((event, i) => {
                            const config = resultConfig[event.result] || resultConfig.pending;
                            const colors = StateColors[config.color];
                            const actorCfg = actorConfig[event.actor_type] || actorConfig.system;
                            const ResultIcon = config.icon;
                            const ActorIcon = actorCfg.icon;
                            
                            return (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="relative pl-14"
                                >
                                    {/* Timeline dot */}
                                    <div className={cn(
                                        "absolute left-4 top-5 w-5 h-5 rounded-full flex items-center justify-center border-2",
                                        colors.bg, colors.border
                                    )}>
                                        <ResultIcon className={cn("w-3 h-3", colors.icon)} />
                                    </div>
                                    
                                    <div 
                                        onClick={() => setSelectedEvent(event)}
                                        className={cn(
                                            "p-4 rounded-xl border transition-all cursor-pointer",
                                            "bg-white/[0.02] border-white/5 hover:border-white/10"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                    colors.badge
                                                )}>
                                                    {config.label}
                                                </span>
                                                <span className="font-bold text-white">{event.event_type}</span>
                                                <code className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                                                    {event.decision_id.substring(0, 8)}...
                                                </code>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                {event.duration_ms && (
                                                    <span className="text-slate-600">{event.duration_ms}ms</span>
                                                )}
                                                <span>{formatRelativeTime(event.timestamp)}</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <ActorIcon className="w-3 h-3 text-indigo-400" />
                                                <span className="text-indigo-400">{event.actor}</span>
                                            </span>
                                            <span>→</span>
                                            <span>{event.action}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setSelectedEvent(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-2xl bg-[#0a0a0f] border border-white/10 rounded-3xl p-8 space-y-6 max-h-[80vh] overflow-auto"
                        >
                            {(() => {
                                const config = resultConfig[selectedEvent.result] || resultConfig.pending;
                                const colors = StateColors[config.color];
                                const ResultIcon = config.icon;
                                
                                return (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl flex items-center justify-center",
                                                    colors.bg
                                                )}>
                                                    <ResultIcon className={cn("w-6 h-6", colors.icon)} />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-black text-white">{selectedEvent.event_type}</h2>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                        colors.badge
                                                    )}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setSelectedEvent(null)} 
                                                className="text-slate-500 hover:text-white p-2 hover:bg-white/5 rounded-lg"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Decision ID</label>
                                                <p className="text-white mt-1 font-mono text-sm">{selectedEvent.decision_id}</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Timestamp</label>
                                                <p className="text-white mt-1">{new Date(selectedEvent.timestamp).toLocaleString('pt-BR')}</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Ator</label>
                                                <p className="text-white mt-1">{selectedEvent.actor}</p>
                                                <p className="text-xs text-slate-500">{actorConfig[selectedEvent.actor_type]?.label || selectedEvent.actor_type}</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Ação</label>
                                                <p className="text-white mt-1">{selectedEvent.action}</p>
                                                {selectedEvent.duration_ms && (
                                                    <p className="text-xs text-slate-500">{selectedEvent.duration_ms}ms</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase">Contexto</label>
                                            <pre className="mt-2 p-4 rounded-xl bg-black/30 text-sm font-mono text-slate-300 overflow-auto">
                                                {JSON.stringify(selectedEvent.context, null, 2)}
                                            </pre>
                                        </div>

                                        {selectedEvent.context.rule_id && (
                                            <Link 
                                                href={`/dashboard/rules`}
                                                className="flex items-center gap-2 text-indigo-400 text-sm hover:underline"
                                            >
                                                <Eye className="w-4 h-4" />
                                                Ver regra relacionada
                                            </Link>
                                        )}
                                    </>
                                );
                            })()}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
