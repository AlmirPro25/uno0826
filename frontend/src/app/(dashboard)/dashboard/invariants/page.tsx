"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
    Shield, Loader2, AlertTriangle, CheckCircle2, X,
    RefreshCw, Trash2, Activity, Clock, AlertOctagon
} from "lucide-react";
import { api } from "@/lib/api";
import { AppHeader } from "@/components/dashboard/app-header";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Violation {
    id: string;
    invariant: string;
    message: string;
    context: Record<string, unknown>;
    stack_trace: string;
    timestamp: string;
    severity: string;
    recovered: boolean;
}

interface InvariantStats {
    total: number;
    by_severity: {
        WARNING: number;
        CRITICAL: number;
        FATAL: number;
    };
    by_invariant: Record<string, number>;
    enabled: boolean;
}

export default function InvariantsPage() {
    const [violations, setViolations] = useState<Violation[]>([]);
    const [stats, setStats] = useState<InvariantStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [violRes, statsRes] = await Promise.all([
                api.get("/admin/invariants/violations"),
                api.get("/admin/invariants/stats")
            ]);
            setViolations(violRes.data.violations || []);
            setStats(statsRes.data);
        } catch (error) {
            console.error("Failed to fetch invariants data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh a cada 10 segundos se ativado
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchData]);

    const clearViolations = async () => {
        try {
            await api.delete("/admin/invariants/violations");
            setViolations([]);
            fetchData();
        } catch (error) {
            console.error("Failed to clear violations", error);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "WARNING": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            case "CRITICAL": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
            case "FATAL": return "bg-red-600/20 text-red-400 border-red-500/30";
            default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case "WARNING": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case "CRITICAL": return <AlertOctagon className="w-4 h-4 text-rose-500" />;
            case "FATAL": return <AlertOctagon className="w-4 h-4 text-red-500" />;
            default: return <Activity className="w-4 h-4 text-slate-500" />;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('pt-BR');
    };

    const getSystemStatus = () => {
        if (!stats) return { status: "unknown", color: "slate", label: "Carregando..." };
        if (stats.by_severity.FATAL > 0) return { status: "fatal", color: "red", label: "FATAL - Sistema Comprometido" };
        if (stats.by_severity.CRITICAL > 0) return { status: "critical", color: "rose", label: "CRÍTICO - Atenção Imediata" };
        if (stats.by_severity.WARNING > 0) return { status: "warning", color: "amber", label: "Avisos Pendentes" };
        return { status: "healthy", color: "emerald", label: "Sistema Saudável" };
    };

    const systemStatus = getSystemStatus();

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                        Invariants
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Sistema Imunológico do Kernel • Monitoramento em Tempo Real
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={cn(
                            "h-11 px-4 rounded-xl border text-sm font-bold transition-all flex items-center gap-2",
                            autoRefresh 
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                                : "border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Activity className={cn("w-4 h-4", autoRefresh && "animate-pulse")} />
                        {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh"}
                    </button>
                    <Button 
                        variant="outline"
                        onClick={fetchData}
                        disabled={loading}
                        className="h-11 px-4 rounded-xl border-white/10 text-white hover:bg-white/5"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
                    <Button 
                        variant="outline"
                        onClick={clearViolations}
                        disabled={violations.length === 0}
                        className="h-11 px-5 rounded-xl border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                    >
                        <Trash2 className="w-4 h-4 mr-2" /> Limpar
                    </Button>
                </div>
            </div>

            {/* System Status Banner */}
            <div className={cn(
                "p-6 rounded-2xl border flex items-center justify-between",
                systemStatus.color === "emerald" && "bg-emerald-500/5 border-emerald-500/20",
                systemStatus.color === "amber" && "bg-amber-500/5 border-amber-500/20",
                systemStatus.color === "rose" && "bg-rose-500/5 border-rose-500/20",
                systemStatus.color === "red" && "bg-red-600/10 border-red-500/30",
                systemStatus.color === "slate" && "bg-slate-500/5 border-slate-500/20"
            )}>
                <div className="flex items-center gap-4">
                    {systemStatus.status === "healthy" ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    ) : systemStatus.status === "fatal" ? (
                        <AlertOctagon className="w-8 h-8 text-red-500 animate-pulse" />
                    ) : (
                        <AlertTriangle className={cn(
                            "w-8 h-8",
                            systemStatus.color === "amber" && "text-amber-500",
                            systemStatus.color === "rose" && "text-rose-500"
                        )} />
                    )}
                    <div>
                        <h2 className={cn(
                            "text-xl font-black uppercase tracking-tight",
                            systemStatus.color === "emerald" && "text-emerald-400",
                            systemStatus.color === "amber" && "text-amber-400",
                            systemStatus.color === "rose" && "text-rose-400",
                            systemStatus.color === "red" && "text-red-400",
                            systemStatus.color === "slate" && "text-slate-400"
                        )}>
                            {systemStatus.label}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {stats?.total || 0} violações registradas • Invariants {stats?.enabled ? "ativas" : "desativadas"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Warning</span>
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                        </div>
                        <p className="text-3xl font-black text-amber-400 mt-2">{stats.by_severity.WARNING}</p>
                        <p className="text-xs text-slate-500 mt-1">Avisos não críticos</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Critical</span>
                            <AlertOctagon className="w-4 h-4 text-rose-500" />
                        </div>
                        <p className="text-3xl font-black text-rose-400 mt-2">{stats.by_severity.CRITICAL}</p>
                        <p className="text-xs text-slate-500 mt-1">Requer atenção</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-red-600/10 border border-red-500/30">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Fatal</span>
                            <AlertOctagon className="w-4 h-4 text-red-500" />
                        </div>
                        <p className="text-3xl font-black text-red-400 mt-2">{stats.by_severity.FATAL}</p>
                        <p className="text-xs text-slate-500 mt-1">Sistema parou operação</p>
                    </div>
                </div>
            )}

            {/* Violations List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Violações Recentes</h3>
                    <span className="text-xs text-slate-500">{violations.length} registros</span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                ) : violations.length === 0 ? (
                    <div className="p-12 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
                        <Shield className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Nenhuma Violação</h3>
                        <p className="text-sm text-slate-500">
                            O sistema está operando dentro dos parâmetros esperados.
                        </p>
                    </div>
                ) : (
                    <AnimatePresence>
                        <div className="space-y-3">
                            {violations.map((violation, index) => (
                                <motion.div
                                    key={violation.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => setSelectedViolation(violation)}
                                    className={cn(
                                        "p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01]",
                                        getSeverityColor(violation.severity)
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            {getSeverityIcon(violation.severity)}
                                            <div>
                                                <h4 className="font-bold text-white">{violation.invariant}</h4>
                                                <p className="text-sm text-slate-400 mt-1">{violation.message}</p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(violation.timestamp)}
                                                    </span>
                                                    {violation.recovered && (
                                                        <span className="text-xs text-emerald-400 font-medium">
                                                            ✓ Recuperado
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "px-2 py-1 rounded-lg text-xs font-bold uppercase",
                                            getSeverityColor(violation.severity)
                                        )}>
                                            {violation.severity}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </AnimatePresence>
                )}
            </div>

            {/* Violation Detail Modal */}
            {selectedViolation && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#0a0f1a] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {getSeverityIcon(selectedViolation.severity)}
                                <h3 className="text-lg font-bold text-white">{selectedViolation.invariant}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedViolation(null)}
                                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mensagem</label>
                                <p className="text-white mt-1">{selectedViolation.message}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</label>
                                <p className="text-white mt-1">{formatDate(selectedViolation.timestamp)}</p>
                            </div>
                            {selectedViolation.context && Object.keys(selectedViolation.context).length > 0 && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contexto</label>
                                    <pre className="mt-2 p-4 rounded-xl bg-black/50 border border-white/5 text-xs text-slate-300 overflow-x-auto">
                                        {JSON.stringify(selectedViolation.context, null, 2)}
                                    </pre>
                                </div>
                            )}
                            {selectedViolation.stack_trace && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stack Trace</label>
                                    <pre className="mt-2 p-4 rounded-xl bg-black/50 border border-white/5 text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
                                        {selectedViolation.stack_trace}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
