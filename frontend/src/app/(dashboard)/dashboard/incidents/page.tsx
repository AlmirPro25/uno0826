"use client";

import { useState, useEffect, useCallback } from "react";
import { 
    AlertTriangle, CheckCircle2, RefreshCw, Loader2,
    MessageSquare, Eye, CheckCheck, XCircle
} from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Narrative {
    id: string;
    what: string;
    when: string;
    where: string;
    why: string;
    context: string;
    action_taken: string;
    next_step: string;
    severity: "info" | "warning" | "error" | "critical";
    status: "open" | "acknowledged" | "resolved";
    created_at: string;
}

const severityConfig = {
    info: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: MessageSquare, label: "Info" },
    warning: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: AlertTriangle, label: "Aviso" },
    error: { color: "bg-rose-500/10 text-rose-400 border-rose-500/20", icon: XCircle, label: "Erro" },
    critical: { color: "bg-rose-600/20 text-rose-300 border-rose-500/30", icon: AlertTriangle, label: "Crítico" },
};

const statusConfig = {
    open: { color: "bg-rose-500/10 text-rose-400", icon: AlertTriangle, label: "Aberto" },
    acknowledged: { color: "bg-amber-500/10 text-amber-400", icon: Eye, label: "Reconhecido" },
    resolved: { color: "bg-emerald-500/10 text-emerald-400", icon: CheckCircle2, label: "Resolvido" },
};

export default function IncidentsPage() {
    const { activeApp } = useApp();
    const [narratives, setNarratives] = useState<Narrative[]>([]);
    const [stats, setStats] = useState({ total: 0, open: 0, acknowledged: 0, resolved: 0 });
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Narrative | null>(null);
    const [filter, setFilter] = useState<"all" | "open" | "acknowledged" | "resolved">("all");

    const fetchNarratives = useCallback(async () => {
        if (!activeApp) return;
        setLoading(true);
        try {
            const [narRes, statsRes] = await Promise.all([
                api.get(`/narratives?app_id=${activeApp.id}`),
                api.get(`/narratives/stats?app_id=${activeApp.id}`)
            ]);
            setNarratives(narRes.data.narratives || []);
            setStats(statsRes.data);
        } catch (error) {
            console.error("Failed to fetch narratives", error);
            // Mock data for dev mode
            setNarratives([
                {
                    id: "1",
                    what: "Deploy falhou após timeout de build",
                    when: "2026-01-11T10:30:00Z",
                    where: "Pipeline de CI/CD - Stage: Build",
                    why: "Dependência npm não encontrada: @types/node@22.0.0",
                    context: "Projeto: api-gateway | Branch: main | Commit: abc123",
                    action_taken: "Build cancelado. Container não foi atualizado.",
                    next_step: "Verificar package.json e atualizar dependências",
                    severity: "error",
                    status: "open",
                    created_at: "2026-01-11T10:30:00Z"
                },
                {
                    id: "2",
                    what: "Limite de memória atingido",
                    when: "2026-01-11T09:15:00Z",
                    where: "Container: worker-01 | Pod: prod-workers",
                    why: "Memory leak detectado após 72h de uptime",
                    context: "Uso: 512MB/512MB | Restarts: 3 nas últimas 24h",
                    action_taken: "Container reiniciado automaticamente",
                    next_step: "Investigar leak. Considerar aumentar limite.",
                    severity: "warning",
                    status: "acknowledged",
                    created_at: "2026-01-11T09:15:00Z"
                },
                {
                    id: "3",
                    what: "Certificado SSL renovado com sucesso",
                    when: "2026-01-10T03:00:00Z",
                    where: "Domain: api.example.com",
                    why: "Renovação automática agendada",
                    context: "Validade anterior: 2026-01-15 | Nova: 2026-04-15",
                    action_taken: "Certificado atualizado em todos os edge nodes",
                    next_step: "Nenhuma ação necessária",
                    severity: "info",
                    status: "resolved",
                    created_at: "2026-01-10T03:00:00Z"
                }
            ]);
            setStats({ total: 3, open: 1, acknowledged: 1, resolved: 1 });
        } finally {
            setLoading(false);
        }
    }, [activeApp]);

    useEffect(() => {
        fetchNarratives();
    }, [fetchNarratives]);

    const handleAcknowledge = async (id: string) => {
        try {
            await api.post(`/narratives/${id}/acknowledge`);
            fetchNarratives();
        } catch (error) {
            console.error("Failed to acknowledge", error);
        }
    };

    const handleResolve = async (id: string) => {
        try {
            await api.post(`/narratives/${id}/resolve`);
            fetchNarratives();
            setSelected(null);
        } catch (error) {
            console.error("Failed to resolve", error);
        }
    };

    const filteredNarratives = narratives.filter(n => 
        filter === "all" ? true : n.status === filter
    );

    return (
        <div className="min-h-screen bg-[#030712]">
            <div className="p-6 pb-0">
                <AppHeader />
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-white">Incidentes</h1>
                    <p className="text-sm text-slate-500">Narrativas de falha em linguagem humana</p>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <button 
                        onClick={() => setFilter("all")}
                        className={cn(
                            "p-4 rounded-2xl border transition-all",
                            filter === "all" 
                                ? "bg-white/10 border-white/20" 
                                : "bg-white/[0.02] border-white/5 hover:bg-white/5"
                        )}
                    >
                        <p className="text-2xl font-black text-white">{stats.total}</p>
                        <p className="text-xs text-slate-500">Total</p>
                    </button>
                    <button 
                        onClick={() => setFilter("open")}
                        className={cn(
                            "p-4 rounded-2xl border transition-all",
                            filter === "open" 
                                ? "bg-rose-500/20 border-rose-500/30" 
                                : "bg-white/[0.02] border-white/5 hover:bg-rose-500/10"
                        )}
                    >
                        <p className="text-2xl font-black text-rose-400">{stats.open}</p>
                        <p className="text-xs text-slate-500">Abertos</p>
                    </button>
                    <button 
                        onClick={() => setFilter("acknowledged")}
                        className={cn(
                            "p-4 rounded-2xl border transition-all",
                            filter === "acknowledged" 
                                ? "bg-amber-500/20 border-amber-500/30" 
                                : "bg-white/[0.02] border-white/5 hover:bg-amber-500/10"
                        )}
                    >
                        <p className="text-2xl font-black text-amber-400">{stats.acknowledged}</p>
                        <p className="text-xs text-slate-500">Reconhecidos</p>
                    </button>
                    <button 
                        onClick={() => setFilter("resolved")}
                        className={cn(
                            "p-4 rounded-2xl border transition-all",
                            filter === "resolved" 
                                ? "bg-emerald-500/20 border-emerald-500/30" 
                                : "bg-white/[0.02] border-white/5 hover:bg-emerald-500/10"
                        )}
                    >
                        <p className="text-2xl font-black text-emerald-400">{stats.resolved}</p>
                        <p className="text-xs text-slate-500">Resolvidos</p>
                    </button>
                </div>

                {/* Refresh */}
                <div className="flex justify-end">
                    <button 
                        onClick={fetchNarratives}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                        Atualizar
                    </button>
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    </div>
                ) : filteredNarratives.length === 0 ? (
                    <div className="text-center py-20">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mx-auto mb-4" />
                        <p className="text-slate-500">Nenhum incidente {filter !== "all" ? statusConfig[filter].label.toLowerCase() : ""}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNarratives.map((narrative) => {
                            const severity = severityConfig[narrative.severity];
                            const status = statusConfig[narrative.status];
                            const SeverityIcon = severity.icon;
                            
                            return (
                                <motion.div
                                    key={narrative.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "p-4 rounded-2xl border cursor-pointer transition-all",
                                        severity.color,
                                        selected?.id === narrative.id && "ring-2 ring-white/20"
                                    )}
                                    onClick={() => setSelected(selected?.id === narrative.id ? null : narrative)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <SeverityIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-bold text-white">{narrative.what}</p>
                                                <p className="text-xs text-slate-400 mt-1">{narrative.where}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={cn("px-2 py-1 rounded-lg text-[10px] font-bold", status.color)}>
                                                {status.label}
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                {new Date(narrative.created_at).toLocaleString("pt-BR")}
                                            </span>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {selected?.id === narrative.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Por quê?</p>
                                                            <p className="text-sm text-slate-300">{narrative.why}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Contexto</p>
                                                            <p className="text-sm text-slate-300">{narrative.context}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Ação Tomada</p>
                                                            <p className="text-sm text-slate-300">{narrative.action_taken}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Próximo Passo</p>
                                                            <p className="text-sm text-slate-300">{narrative.next_step}</p>
                                                        </div>
                                                    </div>

                                                    {narrative.status !== "resolved" && (
                                                        <div className="flex gap-2 pt-2">
                                                            {narrative.status === "open" && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleAcknowledge(narrative.id); }}
                                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/30 transition-colors"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                    Reconhecer
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleResolve(narrative.id); }}
                                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 transition-colors"
                                                            >
                                                                <CheckCheck className="w-3.5 h-3.5" />
                                                                Resolver
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
