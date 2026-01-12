"use client";

import { useEffect, useState, useCallback } from "react";
import { 
    Bell, AlertTriangle, CheckCircle2, XCircle, Clock, 
    Loader2, RefreshCw, Volume2, VolumeX, Eye, Filter,
    Zap, Shield, Activity, TrendingUp
} from "lucide-react";
import { api } from "@/lib/api";
import { AppHeader } from "@/components/dashboard/app-header";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Alert {
    id: string;
    type: string;
    severity: string;
    title: string;
    message: string;
    source: string;
    value: number;
    threshold: number;
    fired_at: string;
    acked_at: string | null;
    acked_by: string | null;
    resolved_at: string | null;
    tags: Record<string, string>;
}

interface AlertStats {
    total_fired: number;
    total_resolved: number;
    total_acknowledged: number;
    active_count: number;
    by_severity: Record<string, number>;
    by_type: Record<string, number>;
}

interface AlertRule {
    name: string;
    type: string;
    condition: string;
    threshold: number;
    severity: string;
    cooldown: string;
    enabled: boolean;
    tags: Record<string, string>;
}

export default function AlertingPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [stats, setStats] = useState<AlertStats | null>(null);
    const [rules, setRules] = useState<AlertRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");
    const [acknowledging, setAcknowledging] = useState<string | null>(null);

    const fetchAlerts = useCallback(async () => {
        try {
            const [alertsRes, statsRes, rulesRes] = await Promise.all([
                api.get("/alerts"),
                api.get("/alerts/stats"),
                api.get("/alerts/rules")
            ]);
            setAlerts(alertsRes.data.alerts || []);
            setStats(statsRes.data);
            setRules(rulesRes.data.rules || []);
        } catch (error) {
            console.error("Failed to fetch alerts", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 30000);
        return () => clearInterval(interval);
    }, [fetchAlerts]);

    const acknowledgeAlert = async (alertId: string) => {
        setAcknowledging(alertId);
        try {
            await api.post(`/alerts/${alertId}/ack`, { acked_by: "admin" });
            toast.success("Alerta reconhecido");
            fetchAlerts();
        } catch {
            toast.error("Falha ao reconhecer alerta");
        } finally {
            setAcknowledging(null);
        }
    };

    const resolveAlert = async (alertId: string) => {
        try {
            await api.post(`/alerts/${alertId}/resolve`);
            toast.success("Alerta resolvido");
            fetchAlerts();
        } catch {
            toast.error("Falha ao resolver alerta");
        }
    };

    const toggleRule = async (ruleName: string, enabled: boolean) => {
        try {
            await api.post(`/alerts/rules/${ruleName}/${enabled ? 'enable' : 'disable'}`);
            toast.success(enabled ? "Regra ativada" : "Regra desativada");
            fetchAlerts();
        } catch {
            toast.error("Falha ao atualizar regra");
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "emergency": return "bg-red-500/20 text-red-400 border-red-500/30";
            case "critical": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
            case "warning": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
            default: return "bg-blue-500/20 text-blue-400 border-blue-500/30";
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case "emergency": return <XCircle className="w-5 h-5" />;
            case "critical": return <AlertTriangle className="w-5 h-5" />;
            case "warning": return <Bell className="w-5 h-5" />;
            default: return <Eye className="w-5 h-5" />;
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

    const filteredAlerts = alerts.filter(a => {
        if (filter === "all") return true;
        return a.severity === filter;
    });

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
                        <Bell className="w-8 h-8 text-amber-400" />
                        Sistema de Alertas
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Monitoramento em tempo real • {alerts.length} alertas ativos
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={fetchAlerts}
                    disabled={loading}
                    className="h-11 px-4 rounded-xl border-white/10"
                >
                    <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                    Atualizar
                </Button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-red-400 uppercase">Ativos</span>
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                        </div>
                        <p className="text-3xl font-black text-red-400 mt-2">{stats.active_count}</p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-400 uppercase">Disparados</span>
                            <Zap className="w-4 h-4 text-amber-500" />
                        </div>
                        <p className="text-3xl font-black text-amber-400 mt-2">{stats.total_fired}</p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-400 uppercase">Reconhecidos</span>
                            <Eye className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-3xl font-black text-blue-400 mt-2">{stats.total_acknowledged}</p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-400 uppercase">Resolvidos</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-3xl font-black text-emerald-400 mt-2">{stats.total_resolved}</p>
                    </motion.div>
                </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                {["all", "emergency", "critical", "warning", "info"].map(sev => (
                    <button
                        key={sev}
                        onClick={() => setFilter(sev)}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors",
                            filter === sev
                                ? "bg-white/10 text-white"
                                : "text-slate-500 hover:text-white hover:bg-white/5"
                        )}
                    >
                        {sev === "all" ? "Todos" : sev}
                    </button>
                ))}
            </div>

            {/* Alerts List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
            ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Tudo Tranquilo</h3>
                    <p className="text-slate-500">Nenhum alerta ativo no momento</p>
                </div>
            ) : (
                <AnimatePresence>
                    <div className="space-y-3">
                        {filteredAlerts.map((alert, i) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className={cn(
                                    "p-5 rounded-2xl border transition-all",
                                    getSeverityColor(alert.severity)
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        getSeverityColor(alert.severity)
                                    )}>
                                        {getSeverityIcon(alert.severity)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-white">{alert.title}</h3>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                getSeverityColor(alert.severity)
                                            )}>
                                                {alert.severity}
                                            </span>
                                            {alert.acked_at && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400">
                                                    ACK
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-400 mb-2">{alert.message}</p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatRelativeTime(alert.fired_at)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Activity className="w-3 h-3" />
                                                {alert.source}
                                            </span>
                                            {alert.value > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3" />
                                                    {alert.value.toFixed(2)} / {alert.threshold}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!alert.acked_at && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => acknowledgeAlert(alert.id)}
                                                disabled={acknowledging === alert.id}
                                                className="h-8 px-3 rounded-lg border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                                            >
                                                {acknowledging === alert.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Eye className="w-3 h-3" />
                                                )}
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => resolveAlert(alert.id)}
                                            className="h-8 px-3 rounded-lg border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                        >
                                            <CheckCircle2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </AnimatePresence>
            )}

            {/* Rules Section */}
            <div className="mt-8">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-400" />
                    Regras de Alerta ({rules.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rules.map((rule) => (
                        <div
                            key={rule.name}
                            className={cn(
                                "p-4 rounded-xl border transition-all",
                                rule.enabled
                                    ? "bg-white/[0.02] border-white/10"
                                    : "bg-white/[0.01] border-white/5 opacity-60"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-white text-sm">{rule.name}</h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {rule.condition} &gt; {rule.threshold}
                                    </p>
                                </div>
                                <button
                                    onClick={() => toggleRule(rule.name, !rule.enabled)}
                                    className={cn(
                                        "p-2 rounded-lg transition-colors",
                                        rule.enabled
                                            ? "text-emerald-400 hover:bg-emerald-500/10"
                                            : "text-slate-500 hover:bg-white/5"
                                    )}
                                >
                                    {rule.enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
