"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
    Shield, Loader2, AlertTriangle, CheckCircle2, X,
    RefreshCw, Activity, Clock, AlertOctagon, Zap,
    Lock, Unlock, Heart, Ban, Eye
} from "lucide-react";
import { api } from "@/lib/api";
import { AppHeader } from "@/components/dashboard/app-header";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface HealthReport {
    status: string;
    score: number;
    open_circuits: number;
    active_quarantines: number;
    active_alerts: number;
    total_threats: number;
    total_heals: number;
    total_blocks: number;
    uptime_seconds: number;
    checked_at: string;
}

interface Alert {
    id: string;
    title: string;
    message: string;
    severity: string;
    category: string;
    source: string;
    current_level: string;
    occurrence_count: number;
    created_at: string;
    last_occurrence: string;
    is_acked: boolean;
    acked_by: string;
    acked_at: string;
}

interface Quarantine {
    id: string;
    target_type: string;
    target_id: string;
    type: string;
    reason: string;
    evidence: Record<string, unknown>;
    created_at: string;
    expires_at: string;
    auto_release: boolean;
}

interface CircuitStats {
    name: string;
    state: string;
    failures: number;
    successes: number;
    last_failure: string;
}

interface BlockedSource {
    source: string;
    expires_at: string;
    remaining: string;
}

export default function ImmunityPage() {
    const [health, setHealth] = useState<HealthReport | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [quarantines, setQuarantines] = useState<Quarantine[]>([]);
    const [circuits, setCircuits] = useState<CircuitStats[]>([]);
    const [blockedSources, setBlockedSources] = useState<BlockedSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "alerts" | "quarantine" | "circuits" | "threats">("overview");

    const fetchData = useCallback(async () => {
        try {
            const [healthRes, alertsRes, quarantineRes, circuitsRes, threatsRes] = await Promise.all([
                api.get("/immunity/health"),
                api.get("/immunity/alerts"),
                api.get("/immunity/quarantine"),
                api.get("/immunity/circuits"),
                api.get("/immunity/threats")
            ]);
            setHealth(healthRes.data);
            setAlerts(alertsRes.data.alerts || []);
            setQuarantines(quarantineRes.data.quarantines || []);
            setCircuits(circuitsRes.data.circuits || []);
            setBlockedSources(threatsRes.data.blocked_sources || []);
        } catch (error) {
            console.error("Failed to fetch immunity data", error);
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

    const acknowledgeAlert = async (alertId: string) => {
        try {
            await api.post(`/immunity/alerts/${alertId}/ack`, { acked_by: "admin" });
            fetchData();
        } catch (error) {
            console.error("Failed to acknowledge alert", error);
        }
    };

    const releaseQuarantine = async (targetType: string, targetId: string) => {
        try {
            await api.post("/immunity/quarantine/release", {
                target_type: targetType,
                target_id: targetId,
                released_by: "admin",
                note: "Liberado manualmente via dashboard"
            });
            fetchData();
        } catch (error) {
            console.error("Failed to release quarantine", error);
        }
    };

    const resetCircuit = async (name: string) => {
        try {
            await api.post(`/immunity/circuits/${name}/reset`);
            fetchData();
        } catch (error) {
            console.error("Failed to reset circuit", error);
        }
    };

    const unblockIP = async (ip: string) => {
        try {
            await api.post("/immunity/threats/unblock", { ip });
            fetchData();
        } catch (error) {
            console.error("Failed to unblock IP", error);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "info": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            case "warning": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            case "error": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
            case "critical": return "bg-red-500/10 text-red-400 border-red-500/20";
            case "fatal": return "bg-red-600/20 text-red-400 border-red-500/30";
            default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
        }
    };

    const getCircuitColor = (state: string) => {
        switch (state) {
            case "closed": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "open": return "bg-red-500/10 text-red-400 border-red-500/20";
            case "half_open": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleString('pt-BR');
    };

    const formatUptime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    const getHealthStatus = () => {
        if (!health) return { status: "unknown", color: "slate", label: "Carregando..." };
        if (health.status === "critical") return { status: "critical", color: "red", label: "CRÍTICO" };
        if (health.status === "degraded") return { status: "degraded", color: "amber", label: "DEGRADADO" };
        return { status: "healthy", color: "emerald", label: "SAUDÁVEL" };
    };

    const healthStatus = getHealthStatus();

    const tabs = [
        { id: "overview", label: "Visão Geral", icon: Eye },
        { id: "alerts", label: "Alertas", icon: AlertTriangle, count: alerts.length },
        { id: "quarantine", label: "Quarentena", icon: Lock, count: quarantines.length },
        { id: "circuits", label: "Circuits", icon: Zap, count: circuits.filter(c => c.state !== "closed").length },
        { id: "threats", label: "Ameaças", icon: Ban, count: blockedSources.length },
    ];

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                        Sistema Imunológico
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Auto-defesa • Auto-cura • Circuit Breakers • Quarentena
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
            {health && (
                <div className={cn(
                    "p-6 rounded-2xl border flex items-center justify-between",
                    healthStatus.color === "emerald" && "bg-emerald-500/5 border-emerald-500/20",
                    healthStatus.color === "amber" && "bg-amber-500/5 border-amber-500/20",
                    healthStatus.color === "red" && "bg-red-600/10 border-red-500/30",
                    healthStatus.color === "slate" && "bg-slate-500/5 border-slate-500/20"
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
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-sm font-bold",
                                    healthStatus.color === "emerald" && "bg-emerald-500/20 text-emerald-400",
                                    healthStatus.color === "amber" && "bg-amber-500/20 text-amber-400",
                                    healthStatus.color === "red" && "bg-red-500/20 text-red-400"
                                )}>
                                    Score: {health.score.toFixed(0)}%
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                                Uptime: {formatUptime(health.uptime_seconds)} • Última verificação: {formatDate(health.checked_at)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            {health && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Ameaças</span>
                            <Shield className="w-4 h-4 text-indigo-500" />
                        </div>
                        <p className="text-3xl font-black text-indigo-400 mt-2">{health.total_threats}</p>
                        <p className="text-xs text-slate-500 mt-1">Detectadas</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Auto-Curas</span>
                            <Heart className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-3xl font-black text-emerald-400 mt-2">{health.total_heals}</p>
                        <p className="text-xs text-slate-500 mt-1">Executadas</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Bloqueios</span>
                            <Ban className="w-4 h-4 text-rose-500" />
                        </div>
                        <p className="text-3xl font-black text-rose-400 mt-2">{health.total_blocks}</p>
                        <p className="text-xs text-slate-500 mt-1">Aplicados</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Alertas</span>
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                        </div>
                        <p className="text-3xl font-black text-amber-400 mt-2">{health.active_alerts}</p>
                        <p className="text-xs text-slate-500 mt-1">Ativos</p>
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
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs">
                                {tab.count}
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
                            {/* Quick Stats */}
                            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-indigo-500" />
                                    Status Rápido
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Circuits Abertos</span>
                                        <span className={cn(
                                            "font-bold",
                                            health?.open_circuits === 0 ? "text-emerald-400" : "text-red-400"
                                        )}>
                                            {health?.open_circuits || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Quarentenas Ativas</span>
                                        <span className={cn(
                                            "font-bold",
                                            quarantines.length === 0 ? "text-emerald-400" : "text-amber-400"
                                        )}>
                                            {quarantines.length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">IPs Bloqueados</span>
                                        <span className={cn(
                                            "font-bold",
                                            blockedSources.length === 0 ? "text-emerald-400" : "text-rose-400"
                                        )}>
                                            {blockedSources.length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Alertas Não Reconhecidos</span>
                                        <span className={cn(
                                            "font-bold",
                                            alerts.filter(a => !a.is_acked).length === 0 ? "text-emerald-400" : "text-amber-400"
                                        )}>
                                            {alerts.filter(a => !a.is_acked).length}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Alerts */}
                            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                    Alertas Recentes
                                </h3>
                                {alerts.length === 0 ? (
                                    <p className="text-slate-500 text-sm">Nenhum alerta ativo</p>
                                ) : (
                                    <div className="space-y-2">
                                        {alerts.slice(0, 5).map((alert) => (
                                            <div
                                                key={alert.id}
                                                className={cn(
                                                    "p-3 rounded-xl border text-sm",
                                                    getSeverityColor(alert.severity)
                                                )}
                                            >
                                                <div className="font-bold">{alert.title}</div>
                                                <div className="text-xs opacity-70 mt-1">{alert.source}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Alerts Tab */}
                    {activeTab === "alerts" && (
                        <motion.div
                            key="alerts"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {alerts.length === 0 ? (
                                <div className="p-12 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-white mb-2">Nenhum Alerta</h3>
                                    <p className="text-sm text-slate-500">Sistema operando normalmente.</p>
                                </div>
                            ) : (
                                alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={cn(
                                            "p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01]",
                                            getSeverityColor(alert.severity)
                                        )}
                                        onClick={() => setSelectedAlert(alert)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-white">{alert.title}</h4>
                                                    {alert.is_acked && (
                                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                                                            Reconhecido
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-400 mt-1">{alert.message}</p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(alert.created_at)}
                                                    </span>
                                                    <span>Nível: {alert.current_level}</span>
                                                    <span>Ocorrências: {alert.occurrence_count}</span>
                                                </div>
                                            </div>
                                            {!alert.is_acked && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        acknowledgeAlert(alert.id);
                                                    }}
                                                    className="border-white/10 text-white hover:bg-white/5"
                                                >
                                                    Reconhecer
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {/* Quarantine Tab */}
                    {activeTab === "quarantine" && (
                        <motion.div
                            key="quarantine"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {quarantines.length === 0 ? (
                                <div className="p-12 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
                                    <Unlock className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-white mb-2">Nenhuma Quarentena</h3>
                                    <p className="text-sm text-slate-500">Nenhum elemento em isolamento.</p>
                                </div>
                            ) : (
                                quarantines.map((q) => (
                                    <div
                                        key={q.id}
                                        className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Lock className="w-4 h-4 text-amber-500" />
                                                    <h4 className="font-bold text-white">
                                                        {q.target_type}: {q.target_id}
                                                    </h4>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-xs font-bold",
                                                        q.type === "hard" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                                                    )}>
                                                        {q.type.toUpperCase()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-400 mt-1">{q.reason}</p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                    <span>Criado: {formatDate(q.created_at)}</span>
                                                    <span>Expira: {formatDate(q.expires_at)}</span>
                                                    {q.auto_release && <span className="text-emerald-400">Auto-release</span>}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => releaseQuarantine(q.target_type, q.target_id)}
                                                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                            >
                                                <Unlock className="w-4 h-4 mr-1" />
                                                Liberar
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {/* Circuits Tab */}
                    {activeTab === "circuits" && (
                        <motion.div
                            key="circuits"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {circuits.length === 0 ? (
                                <div className="p-12 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
                                    <Zap className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-white mb-2">Nenhum Circuit Breaker</h3>
                                    <p className="text-sm text-slate-500">Nenhum circuit breaker registrado.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {circuits.map((circuit) => (
                                        <div
                                            key={circuit.name}
                                            className={cn(
                                                "p-4 rounded-xl border",
                                                getCircuitColor(circuit.state)
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="w-4 h-4" />
                                                        <h4 className="font-bold text-white">{circuit.name}</h4>
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                        <span>Falhas: {circuit.failures}</span>
                                                        <span>Sucessos: {circuit.successes}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "px-2 py-1 rounded-lg text-xs font-bold uppercase",
                                                        getCircuitColor(circuit.state)
                                                    )}>
                                                        {circuit.state}
                                                    </span>
                                                    {circuit.state !== "closed" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => resetCircuit(circuit.name)}
                                                            className="border-white/10 text-white hover:bg-white/5"
                                                        >
                                                            Reset
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Threats Tab */}
                    {activeTab === "threats" && (
                        <motion.div
                            key="threats"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {blockedSources.length === 0 ? (
                                <div className="p-12 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
                                    <Shield className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-white mb-2">Nenhuma Ameaça Bloqueada</h3>
                                    <p className="text-sm text-slate-500">Nenhum IP está bloqueado no momento.</p>
                                </div>
                            ) : (
                                blockedSources.map((source) => (
                                    <div
                                        key={source.source}
                                        className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Ban className="w-4 h-4 text-rose-500" />
                                                    <h4 className="font-bold text-white font-mono">{source.source}</h4>
                                                </div>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                    <span>Expira: {formatDate(source.expires_at)}</span>
                                                    <span>Restante: {source.remaining}</span>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => unblockIP(source.source)}
                                                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                            >
                                                Desbloquear
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Alert Detail Modal */}
            {selectedAlert && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#0a0f1a] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">{selectedAlert.title}</h3>
                            <button
                                onClick={() => setSelectedAlert(null)}
                                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Severidade</label>
                                    <p className={cn("mt-1 font-bold", getSeverityColor(selectedAlert.severity).split(" ")[1])}>
                                        {selectedAlert.severity.toUpperCase()}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
                                    <p className="text-white mt-1">{selectedAlert.category}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Fonte</label>
                                    <p className="text-white mt-1">{selectedAlert.source}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nível Atual</label>
                                    <p className="text-white mt-1">{selectedAlert.current_level}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Mensagem</label>
                                <p className="text-white mt-1">{selectedAlert.message}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Criado em</label>
                                <p className="text-white mt-1">{formatDate(selectedAlert.created_at)}</p>
                            </div>
                            {selectedAlert.is_acked && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Reconhecido por</label>
                                    <p className="text-white mt-1">{selectedAlert.acked_by} em {formatDate(selectedAlert.acked_at)}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
