"use client";

import { useState, useEffect } from "react";
import { 
    Eye, AlertTriangle, Loader2, RefreshCw,
    Brain, Lightbulb
} from "lucide-react";
import { AppHeader } from "@/components/dashboard/app-header";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ObserverStatus {
    enabled: boolean;
    memory_enabled: boolean;
    last_observation: string | null;
    observations_today: number;
    suggestions_pending: number;
}

interface Observation {
    id: string;
    type: "anomaly" | "pattern" | "suggestion";
    domain: string;
    title: string;
    description: string;
    confidence: number;
    created_at: string;
    status: "pending" | "acknowledged" | "dismissed";
}

export default function ObserverPage() {
    const [status, setStatus] = useState<ObserverStatus | null>(null);
    const [observations, setObservations] = useState<Observation[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchObserver = async () => {
        setLoading(true);
        try {
            const [statusRes, obsRes] = await Promise.all([
                api.get("/observer/status"),
                api.get("/observer/observations?limit=50")
            ]);
            setStatus(statusRes.data);
            setObservations(obsRes.data.observations || []);
        } catch (error) {
            console.error("Failed to fetch observer", error);
            // Mock data
            setStatus({
                enabled: true,
                memory_enabled: true,
                last_observation: new Date().toISOString(),
                observations_today: 12,
                suggestions_pending: 3
            });
            setObservations([
                {
                    id: "obs-1",
                    type: "anomaly",
                    domain: "billing",
                    title: "Taxa de falha acima do normal",
                    description: "Detectado aumento de 15% em falhas de pagamento nas últimas 2h",
                    confidence: 0.87,
                    created_at: new Date().toISOString(),
                    status: "pending"
                },
                {
                    id: "obs-2",
                    type: "suggestion",
                    domain: "rules",
                    title: "Regra pode ser otimizada",
                    description: "A regra 'check_fraud' está executando em média 3x mais que o necessário",
                    confidence: 0.72,
                    created_at: new Date(Date.now() - 3600000).toISOString(),
                    status: "acknowledged"
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchObserver();
    }, []);

    const getTypeConfig = (type: string) => {
        switch (type) {
            case "anomaly": return { label: "Anomalia", color: "rose", icon: AlertTriangle };
            case "pattern": return { label: "Padrão", color: "purple", icon: Brain };
            case "suggestion": return { label: "Sugestão", color: "amber", icon: Lightbulb };
            default: return { label: type, color: "slate", icon: Eye };
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "acknowledged": return { label: "Reconhecido", color: "emerald" };
            case "dismissed": return { label: "Descartado", color: "slate" };
            default: return { label: "Pendente", color: "amber" };
        }
    };

    const formatRelativeTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMin / 60);
        if (diffMin < 60) return `${diffMin}min atrás`;
        if (diffHour < 24) return `${diffHour}h atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
                        <Eye className="w-8 h-8 text-cyan-400" />
                        Observer Agents
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Fase 23 • Agentes observam, analisam e sugerem
                    </p>
                </div>
                <button
                    onClick={fetchObserver}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors"
                >
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    Atualizar
                </button>
            </div>

            {/* Status */}
            {status && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "p-6 rounded-2xl border",
                        status.enabled 
                            ? "bg-gradient-to-br from-cyan-600/20 to-blue-600/10 border-cyan-500/20"
                            : "bg-white/[0.02] border-white/5"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                status.enabled ? "bg-cyan-500/20" : "bg-slate-500/20"
                            )}>
                                <Eye className={cn("w-6 h-6", status.enabled ? "text-cyan-400" : "text-slate-400")} />
                            </div>
                            <div>
                                <p className="text-white font-bold">
                                    Observer {status.enabled ? "Ativo" : "Desativado"}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Memória: {status.memory_enabled ? "Habilitada" : "Desabilitada"}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6 text-center">
                            <div>
                                <p className="text-2xl font-black text-white">{status.observations_today}</p>
                                <p className="text-xs text-slate-500">Hoje</p>
                            </div>
                            <div>
                                <p className="text-2xl font-black text-amber-400">{status.suggestions_pending}</p>
                                <p className="text-xs text-slate-500">Pendentes</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">
                                    {status.last_observation ? formatRelativeTime(status.last_observation) : "N/A"}
                                </p>
                                <p className="text-xs text-slate-500">Última</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Observations */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                </div>
            ) : observations.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <Eye className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Nenhuma observação</h3>
                    <p className="text-slate-500">O observer está monitorando o sistema</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {observations.map((obs, i) => {
                        const typeConfig = getTypeConfig(obs.type);
                        const statusConfig = getStatusConfig(obs.status);
                        const TypeIcon = typeConfig.icon;
                        return (
                            <motion.div
                                key={obs.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={cn(
                                    "p-5 rounded-2xl border",
                                    `bg-${typeConfig.color}-500/5 border-${typeConfig.color}-500/20`
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        `bg-${typeConfig.color}-500/20`
                                    )}>
                                        <TypeIcon className={cn("w-5 h-5", `text-${typeConfig.color}-400`)} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn(
                                                "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                                                `bg-${typeConfig.color}-500/20 text-${typeConfig.color}-400`
                                            )}>
                                                {typeConfig.label}
                                            </span>
                                            <span className="text-xs text-slate-500">{obs.domain}</span>
                                            <span className={cn(
                                                "px-2 py-0.5 text-[10px] font-bold rounded",
                                                `bg-${statusConfig.color}-500/20 text-${statusConfig.color}-400`
                                            )}>
                                                {statusConfig.label}
                                            </span>
                                        </div>
                                        <p className="text-white font-bold">{obs.title}</p>
                                        <p className="text-sm text-slate-400 mt-1">{obs.description}</p>
                                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                                            <span>Confiança: {(obs.confidence * 100).toFixed(0)}%</span>
                                            <span>{formatRelativeTime(obs.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
