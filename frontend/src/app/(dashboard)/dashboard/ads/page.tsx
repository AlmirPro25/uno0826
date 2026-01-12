"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
    Megaphone, Loader2, AlertTriangle, CheckCircle2,
    RefreshCw, Activity, TrendingUp, DollarSign,
    Eye, MousePointer, Shield, AlertOctagon, Zap
} from "lucide-react";
import { api } from "@/lib/api";
import { AppHeader } from "@/components/dashboard/app-header";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface AdMetrics {
    total_requests: number;
    total_fills: number;
    total_no_fills: number;
    total_fraud: number;
    fill_rate: number;
    avg_latency_ms: number;
}

interface AdInvariantViolation {
    id: string;
    invariant: string;
    message: string;
    severity: string;
    timestamp: string;
    context: Record<string, unknown>;
}

export default function AdsPage() {
    const [metrics, setMetrics] = useState<AdMetrics | null>(null);
    const [violations, setViolations] = useState<AdInvariantViolation[]>([]);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "fraud" | "delivery">("overview");

    const fetchData = useCallback(async () => {
        try {
            const [metricsRes, violationsRes] = await Promise.all([
                api.get("/ads/metrics").catch(() => ({ data: null })),
                api.get("/admin/invariants/violations?category=ads").catch(() => ({ data: { violations: [] } }))
            ]);
            
            if (metricsRes.data) {
                setMetrics(metricsRes.data);
            }
            setViolations(violationsRes.data?.violations || []);
        } catch (error) {
            console.error("Failed to fetch ads data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchData]);

    const hasDuplicateViolation = violations.some(v => 
        v.invariant === "AssertAdImpressionNotDuplicated"
    );

    const hasOrphanClickViolation = violations.some(v => 
        v.invariant === "AssertClickHasValidImpression"
    );

    const hasBudgetViolation = violations.some(v => 
        v.invariant === "AssertBudgetNotOverspent"
    );

    const fraudScore = metrics ? 
        (metrics.total_requests > 0 ? (metrics.total_fraud / metrics.total_requests) * 100 : 0) : 0;

    const getHealthStatus = () => {
        if (hasDuplicateViolation || hasOrphanClickViolation) {
            return { status: "critical", color: "red", label: "FRAUDE DETECTADA" };
        }
        if (hasBudgetViolation || fraudScore > 10) {
            return { status: "warning", color: "amber", label: "ATENÇÃO" };
        }
        return { status: "healthy", color: "emerald", label: "OPERACIONAL" };
    };

    const healthStatus = getHealthStatus();

    const tabs = [
        { id: "overview", label: "Visão Geral", icon: Eye },
        { id: "fraud", label: "Anti-Fraude", icon: Shield, alert: hasDuplicateViolation || hasOrphanClickViolation },
        { id: "delivery", label: "Delivery", icon: TrendingUp },
    ];

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                        Ad Edge Gateway
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Motor Econômico de Decisão • Anti-Fraude • Delivery
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
                        {autoRefresh ? "Live" : "Auto-Refresh"}
                    </button>
                    <Button 
                        variant="outline"
                        onClick={fetchData}
                        disabled={loading}
                        className="h-11 px-4 rounded-xl border-white/10 text-white hover:bg-white/5"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Health Status Banner */}
            <div className={cn(
                "p-6 rounded-2xl border flex items-center justify-between",
                healthStatus.color === "emerald" && "bg-emerald-500/5 border-emerald-500/20",
                healthStatus.color === "amber" && "bg-amber-500/5 border-amber-500/20",
                healthStatus.color === "red" && "bg-red-600/10 border-red-500/30 animate-pulse"
            )}>
                <div className="flex items-center gap-4">
                    {healthStatus.status === "healthy" ? (
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    ) : healthStatus.status === "critical" ? (
                        <AlertOctagon className="w-10 h-10 text-red-500 animate-pulse" />
                    ) : (
                        <AlertTriangle className="w-10 h-10 text-amber-500" />
                    )}
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className={cn(
                                "text-2xl font-black uppercase tracking-tight",
                                healthStatus.color === "emerald" && "text-emerald-400",
                                healthStatus.color === "amber" && "text-amber-400",
                                healthStatus.color === "red" && "text-red-400"
                            )}>
                                {healthStatus.label}
                            </h2>
                            {metrics && (
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-sm font-bold",
                                    healthStatus.color === "emerald" && "bg-emerald-500/20 text-emerald-400",
                                    healthStatus.color === "amber" && "bg-amber-500/20 text-amber-400",
                                    healthStatus.color === "red" && "bg-red-500/20 text-red-400"
                                )}>
                                    Fill Rate: {metrics.fill_rate.toFixed(1)}%
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            {hasDuplicateViolation && "⚠️ Impressões duplicadas detectadas - possível ataque de replay"}
                            {hasOrphanClickViolation && "⚠️ Cliques fantasmas detectados - possível fraude"}
                            {!hasDuplicateViolation && !hasOrphanClickViolation && "Sistema de anúncios operando normalmente"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Requests</span>
                            <Megaphone className="w-4 h-4 text-indigo-500" />
                        </div>
                        <p className="text-3xl font-black text-indigo-400 mt-2">{formatNumber(metrics.total_requests)}</p>
                        <p className="text-xs text-slate-500 mt-1">Total de pedidos</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Fills</span>
                            <Eye className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-3xl font-black text-emerald-400 mt-2">{formatNumber(metrics.total_fills)}</p>
                        <p className="text-xs text-slate-500 mt-1">Anúncios entregues</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Fraude</span>
                            <Shield className="w-4 h-4 text-rose-500" />
                        </div>
                        <p className="text-3xl font-black text-rose-400 mt-2">{formatNumber(metrics.total_fraud)}</p>
                        <p className="text-xs text-slate-500 mt-1">Bloqueados</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Latência</span>
                            <Zap className="w-4 h-4 text-amber-500" />
                        </div>
                        <p className="text-3xl font-black text-amber-400 mt-2">{metrics.avg_latency_ms.toFixed(0)}</p>
                        <p className="text-xs text-slate-500 mt-1">ms (média)</p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/5 pb-4 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                            activeTab === tab.id
                                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                : "text-slate-400 hover:text-white hover:bg-white/5",
                            tab.alert && "border-red-500/50 bg-red-500/10"
                        )}
                    >
                        <tab.icon className={cn("w-4 h-4", tab.alert && "text-red-400")} />
                        {tab.label}
                        {tab.alert && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs animate-pulse">
                                !
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {/* Overview Tab */}
                    {activeTab === "overview" && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            {/* Fraud Score Card */}
                            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-indigo-500" />
                                    Fraud Score (Tempo Real)
                                </h3>
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "text-6xl font-black",
                                        fraudScore < 5 && "text-emerald-400",
                                        fraudScore >= 5 && fraudScore < 10 && "text-amber-400",
                                        fraudScore >= 10 && "text-red-400"
                                    )}>
                                        {fraudScore.toFixed(1)}%
                                    </div>
                                    <div className="text-sm text-slate-500">
                                        <p>Taxa de fraude detectada</p>
                                        <p className="mt-1">
                                            {fraudScore < 5 && "✅ Dentro do esperado"}
                                            {fraudScore >= 5 && fraudScore < 10 && "⚠️ Atenção recomendada"}
                                            {fraudScore >= 10 && "🚨 Investigar imediatamente"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Stats */}
                            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                                    Delivery Performance
                                </h3>
                                {metrics && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400">Fill Rate</span>
                                            <span className={cn(
                                                "font-bold",
                                                metrics.fill_rate >= 80 ? "text-emerald-400" : 
                                                metrics.fill_rate >= 50 ? "text-amber-400" : "text-red-400"
                                            )}>
                                                {metrics.fill_rate.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400">No-Fill Rate</span>
                                            <span className="font-bold text-slate-300">
                                                {metrics.total_requests > 0 
                                                    ? ((metrics.total_no_fills / metrics.total_requests) * 100).toFixed(1) 
                                                    : 0}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400">Latência Média</span>
                                            <span className={cn(
                                                "font-bold",
                                                metrics.avg_latency_ms < 50 ? "text-emerald-400" : 
                                                metrics.avg_latency_ms < 100 ? "text-amber-400" : "text-red-400"
                                            )}>
                                                {metrics.avg_latency_ms.toFixed(0)}ms
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Fraud Tab */}
                    {activeTab === "fraud" && (
                        <motion.div
                            key="fraud"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {/* Invariant Violations */}
                            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <AlertOctagon className="w-5 h-5 text-red-500" />
                                    Violações de Invariants (Anti-Fraude)
                                </h3>
                                
                                {violations.length === 0 ? (
                                    <div className="text-center py-8">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                                        <p className="text-emerald-400 font-bold">Nenhuma violação detectada</p>
                                        <p className="text-sm text-slate-500 mt-1">Sistema de anúncios íntegro</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {violations.map((v) => (
                                            <div
                                                key={v.id}
                                                className={cn(
                                                    "p-4 rounded-xl border",
                                                    v.severity === "CRITICAL" 
                                                        ? "bg-red-500/10 border-red-500/30" 
                                                        : "bg-amber-500/10 border-amber-500/30"
                                                )}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded text-xs font-bold",
                                                                v.severity === "CRITICAL" 
                                                                    ? "bg-red-500/20 text-red-400" 
                                                                    : "bg-amber-500/20 text-amber-400"
                                                            )}>
                                                                {v.severity}
                                                            </span>
                                                            <span className="font-mono text-sm text-slate-400">
                                                                {v.invariant}
                                                            </span>
                                                        </div>
                                                        <p className="text-white font-medium mt-2">{v.message}</p>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {new Date(v.timestamp).toLocaleString('pt-BR')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Fraud Checks Status */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className={cn(
                                    "p-4 rounded-xl border",
                                    hasDuplicateViolation 
                                        ? "bg-red-500/10 border-red-500/30" 
                                        : "bg-emerald-500/5 border-emerald-500/20"
                                )}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {hasDuplicateViolation ? (
                                            <AlertOctagon className="w-5 h-5 text-red-500" />
                                        ) : (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        )}
                                        <span className="font-bold text-white">Impressões Duplicadas</span>
                                    </div>
                                    <p className="text-sm text-slate-400">
                                        {hasDuplicateViolation 
                                            ? "FRAUDE: Replay attack detectado" 
                                            : "Nenhuma duplicata detectada"}
                                    </p>
                                </div>

                                <div className={cn(
                                    "p-4 rounded-xl border",
                                    hasOrphanClickViolation 
                                        ? "bg-red-500/10 border-red-500/30" 
                                        : "bg-emerald-500/5 border-emerald-500/20"
                                )}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {hasOrphanClickViolation ? (
                                            <AlertOctagon className="w-5 h-5 text-red-500" />
                                        ) : (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        )}
                                        <span className="font-bold text-white">Cliques Órfãos</span>
                                    </div>
                                    <p className="text-sm text-slate-400">
                                        {hasOrphanClickViolation 
                                            ? "FRAUDE: Cliques fantasmas detectados" 
                                            : "Todos os cliques são válidos"}
                                    </p>
                                </div>

                                <div className={cn(
                                    "p-4 rounded-xl border",
                                    hasBudgetViolation 
                                        ? "bg-amber-500/10 border-amber-500/30" 
                                        : "bg-emerald-500/5 border-emerald-500/20"
                                )}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {hasBudgetViolation ? (
                                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                                        ) : (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        )}
                                        <span className="font-bold text-white">Budget Overspend</span>
                                    </div>
                                    <p className="text-sm text-slate-400">
                                        {hasBudgetViolation 
                                            ? "ALERTA: Budget ultrapassado" 
                                            : "Budgets dentro do limite"}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Delivery Tab */}
                    {activeTab === "delivery" && (
                        <motion.div
                            key="delivery"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                                    Métricas de Delivery
                                </h3>
                                
                                {metrics ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center p-4 rounded-xl bg-white/5">
                                            <p className="text-3xl font-black text-white">{formatNumber(metrics.total_requests)}</p>
                                            <p className="text-xs text-slate-500 mt-1">Total Requests</p>
                                        </div>
                                        <div className="text-center p-4 rounded-xl bg-white/5">
                                            <p className="text-3xl font-black text-emerald-400">{formatNumber(metrics.total_fills)}</p>
                                            <p className="text-xs text-slate-500 mt-1">Fills</p>
                                        </div>
                                        <div className="text-center p-4 rounded-xl bg-white/5">
                                            <p className="text-3xl font-black text-amber-400">{formatNumber(metrics.total_no_fills)}</p>
                                            <p className="text-xs text-slate-500 mt-1">No-Fills</p>
                                        </div>
                                        <div className="text-center p-4 rounded-xl bg-white/5">
                                            <p className="text-3xl font-black text-rose-400">{formatNumber(metrics.total_fraud)}</p>
                                            <p className="text-xs text-slate-500 mt-1">Blocked (Fraud)</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-500">Sem dados disponíveis</p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
}
