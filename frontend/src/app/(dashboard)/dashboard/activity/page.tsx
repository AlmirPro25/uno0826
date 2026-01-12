"use client";

import { useState, useEffect, useCallback } from "react";
import { 
    Activity, Clock, MapPin, Monitor, Smartphone, Globe,
    Loader2, RefreshCw, Shield, AlertTriangle, CheckCircle2,
    LogIn, LogOut, Key, Settings, Eye
} from "lucide-react";
import { AppHeader } from "@/components/dashboard/app-header";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ActivityEvent {
    id: string;
    type: string;
    action: string;
    ip_address: string;
    user_agent: string;
    device_type: string;
    location: string;
    status: "success" | "failed" | "blocked";
    risk_score: number;
    created_at: string;
    details: Record<string, unknown>;
}

const actionIcons: Record<string, typeof Activity> = {
    login: LogIn,
    logout: LogOut,
    password_change: Key,
    settings_update: Settings,
    mfa_enable: Shield,
    mfa_disable: Shield,
    session_revoke: AlertTriangle,
    api_key_create: Key,
    api_key_revoke: Key,
};

const actionLabels: Record<string, string> = {
    login: "Login",
    logout: "Logout",
    password_change: "Alteração de Senha",
    settings_update: "Atualização de Configurações",
    mfa_enable: "MFA Habilitado",
    mfa_disable: "MFA Desabilitado",
    session_revoke: "Sessão Revogada",
    api_key_create: "API Key Criada",
    api_key_revoke: "API Key Revogada",
};

export default function ActivityPage() {
    const [activities, setActivities] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "security" | "failed">("all");

    const fetchActivities = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/activity/me?limit=100");
            const data = res.data.activities || res.data || [];
            setActivities(data.map((a: Record<string, unknown>) => ({
                id: a.id || a.ID,
                type: a.type || a.activity_type || "action",
                action: a.action || a.event_type || "unknown",
                ip_address: a.ip_address || a.ip || "N/A",
                user_agent: a.user_agent || "",
                device_type: a.device_type || detectDevice(a.user_agent as string || ""),
                location: a.location || a.geo_location || "Desconhecido",
                status: a.status || (a.success ? "success" : "failed"),
                risk_score: a.risk_score || 0,
                created_at: a.created_at || a.timestamp,
                details: a.details || a.metadata || {}
            })));
        } catch {
            // Mock data se API não disponível
            setActivities([
                {
                    id: "1",
                    type: "auth",
                    action: "login",
                    ip_address: "189.40.xxx.xxx",
                    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                    device_type: "desktop",
                    location: "São Paulo, BR",
                    status: "success",
                    risk_score: 10,
                    created_at: new Date().toISOString(),
                    details: {}
                },
                {
                    id: "2",
                    type: "security",
                    action: "mfa_enable",
                    ip_address: "189.40.xxx.xxx",
                    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                    device_type: "desktop",
                    location: "São Paulo, BR",
                    status: "success",
                    risk_score: 0,
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    details: {}
                }
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    const detectDevice = (ua: string): string => {
        if (!ua) return "unknown";
        if (/mobile/i.test(ua)) return "mobile";
        if (/tablet/i.test(ua)) return "tablet";
        return "desktop";
    };

    const filteredActivities = activities.filter(a => {
        if (filter === "security") return a.type === "security" || a.action.includes("mfa") || a.action.includes("password");
        if (filter === "failed") return a.status === "failed" || a.status === "blocked";
        return true;
    });

    const formatRelativeTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        if (diffMin < 60) return `${diffMin}min atrás`;
        if (diffHour < 24) return `${diffHour}h atrás`;
        if (diffDay < 7) return `${diffDay}d atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "success": return { label: "Sucesso", color: "emerald", icon: CheckCircle2 };
            case "failed": return { label: "Falhou", color: "rose", icon: AlertTriangle };
            case "blocked": return { label: "Bloqueado", color: "amber", icon: Shield };
            default: return { label: status, color: "slate", icon: Activity };
        }
    };

    const getDeviceIcon = (device: string) => {
        switch (device) {
            case "mobile": return Smartphone;
            case "tablet": return Monitor;
            default: return Monitor;
        }
    };

    // Stats
    const stats = {
        total: activities.length,
        success: activities.filter(a => a.status === "success").length,
        failed: activities.filter(a => a.status === "failed" || a.status === "blocked").length,
        highRisk: activities.filter(a => a.risk_score >= 70).length,
    };

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
                        <Activity className="w-8 h-8 text-indigo-400" />
                        Histórico de Atividades
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Todas as ações realizadas na sua conta
                    </p>
                </div>
                <button
                    onClick={fetchActivities}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors"
                >
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    Atualizar
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Total", value: stats.total, color: "indigo", icon: Activity },
                    { label: "Sucesso", value: stats.success, color: "emerald", icon: CheckCircle2 },
                    { label: "Falhas", value: stats.failed, color: "rose", icon: AlertTriangle },
                    { label: "Alto Risco", value: stats.highRisk, color: "amber", icon: Shield },
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
            <div className="flex gap-2">
                {(["all", "security", "failed"] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            "px-4 py-2 text-sm font-bold rounded-xl transition-colors",
                            filter === f 
                                ? "bg-indigo-600 text-white" 
                                : "bg-white/5 text-slate-400 hover:text-white"
                        )}
                    >
                        {f === "all" ? "Todas" : f === "security" ? "Segurança" : "Falhas"}
                    </button>
                ))}
            </div>

            {/* Activities List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : filteredActivities.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Nenhuma atividade encontrada</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredActivities.map((activity, i) => {
                        const statusConfig = getStatusConfig(activity.status);
                        const StatusIcon = statusConfig.icon;
                        const ActionIcon = actionIcons[activity.action] || Activity;
                        const DeviceIcon = getDeviceIcon(activity.device_type);
                        
                        return (
                            <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className={cn(
                                    "p-5 rounded-2xl border transition-all",
                                    activity.status === "success" 
                                        ? "bg-white/[0.02] border-white/5" 
                                        : activity.status === "blocked"
                                        ? "bg-amber-500/5 border-amber-500/20"
                                        : "bg-rose-500/5 border-rose-500/20"
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        `bg-${statusConfig.color}-500/20`
                                    )}>
                                        <ActionIcon className={cn("w-5 h-5", `text-${statusConfig.color}-400`)} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-white">
                                                {actionLabels[activity.action] || activity.action}
                                            </span>
                                            <span className={cn(
                                                "px-2 py-0.5 text-[10px] font-bold rounded uppercase flex items-center gap-1",
                                                `bg-${statusConfig.color}-500/20 text-${statusConfig.color}-400`
                                            )}>
                                                <StatusIcon className="w-3 h-3" />
                                                {statusConfig.label}
                                            </span>
                                            {activity.risk_score >= 70 && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-400">
                                                    Alto Risco
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatRelativeTime(activity.created_at)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Globe className="w-3 h-3" />
                                                {activity.ip_address}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {activity.location}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <DeviceIcon className="w-3 h-3" />
                                                {activity.device_type}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <button className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
