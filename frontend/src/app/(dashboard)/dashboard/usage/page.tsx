"use client";

import { useState, useEffect, useCallback } from "react";
import { 
    BarChart3, Zap, Database, Activity, RefreshCw, Loader2,
    AlertTriangle, CheckCircle2, Clock
} from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface UsageRecord {
    deploy_count: number;
    deploy_successful: number;
    deploy_failed: number;
    container_hours: number;
    cpu_hours: number;
    memory_gb_hours: number;
    storage_gb: number;
    bandwidth_gb: number;
    telemetry_events: number;
    webhook_calls: number;
    api_requests: number;
    crash_count: number;
    retry_count: number;
    rollback_count: number;
}

interface UsageLimits {
    max_apps: number;
    max_deploys_per_day: number;
    max_cpu_cores: number;
    max_memory_gb: number;
    max_storage_gb: number;
    log_retention_days: number;
    telemetry_retention_days: number;
}

export default function UsagePage() {
    const { activeApp } = useApp();
    const [usage, setUsage] = useState<UsageRecord | null>(null);
    const [limits, setLimits] = useState<UsageLimits | null>(null);
    const [plan, setPlan] = useState<string>("free");
    const [loading, setLoading] = useState(true);

    const fetchUsage = useCallback(async () => {
        if (!activeApp) return;
        setLoading(true);
        try {
            const [usageRes, limitsRes] = await Promise.all([
                api.get(`/usage/apps/${activeApp.id}/current`),
                api.get(`/usage/apps/${activeApp.id}/limits`)
            ]);
            setUsage(usageRes.data);
            setLimits(limitsRes.data.limits);
            setPlan(limitsRes.data.plan || "free");
        } catch (error) {
            console.error("Failed to fetch usage", error);
            // Mock data for dev
            setUsage({
                deploy_count: 12,
                deploy_successful: 10,
                deploy_failed: 2,
                container_hours: 156.5,
                cpu_hours: 78.2,
                memory_gb_hours: 312.8,
                storage_gb: 2.4,
                bandwidth_gb: 15.7,
                telemetry_events: 45230,
                webhook_calls: 892,
                api_requests: 12450,
                crash_count: 3,
                retry_count: 8,
                rollback_count: 1
            });
            setLimits({
                max_apps: 1,
                max_deploys_per_day: 5,
                max_cpu_cores: 0.5,
                max_memory_gb: 0.5,
                max_storage_gb: 1,
                log_retention_days: 1,
                telemetry_retention_days: 7
            });
        } finally {
            setLoading(false);
        }
    }, [activeApp]);

    useEffect(() => {
        fetchUsage();
    }, [fetchUsage]);

    const getUsagePercentage = (current: number, max: number) => {
        if (max === -1) return 0; // unlimited
        return Math.min((current / max) * 100, 100);
    };

    const getUsageColor = (percentage: number) => {
        if (percentage >= 90) return "bg-rose-500";
        if (percentage >= 70) return "bg-amber-500";
        return "bg-emerald-500";
    };

    return (
        <div className="min-h-screen bg-[#030712]">
            <div className="p-6 pb-0">
                <AppHeader />
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-white">Consumo</h1>
                        <p className="text-sm text-slate-500">Medição de recursos do mês atual</p>
                    </div>
                    <button 
                        onClick={fetchUsage}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                        Atualizar
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Plan Badge */}
                        <div className="flex items-center gap-3">
                            <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                                plan === "enterprise" && "bg-purple-500/20 text-purple-400 border border-purple-500/30",
                                plan === "pro" && "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
                                plan === "free" && "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                            )}>
                                Plano {plan}
                            </span>
                            <span className="text-xs text-slate-500">
                                Período: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>

                        {/* Compute Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 rounded-2xl bg-white/[0.02] border border-white/5"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <Zap className="w-5 h-5 text-indigo-400" />
                                <h3 className="font-bold text-white uppercase tracking-tight">Compute</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Deploys</p>
                                    <p className="text-2xl font-black text-white">{usage?.deploy_count || 0}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        <span className="text-xs text-emerald-400">{usage?.deploy_successful || 0}</span>
                                        <AlertTriangle className="w-3 h-3 text-rose-400 ml-2" />
                                        <span className="text-xs text-rose-400">{usage?.deploy_failed || 0}</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Container Hours</p>
                                    <p className="text-2xl font-black text-white">{usage?.container_hours?.toFixed(1) || 0}</p>
                                    <p className="text-xs text-slate-500">horas</p>
                                </div>
                                
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">CPU Hours</p>
                                    <p className="text-2xl font-black text-white">{usage?.cpu_hours?.toFixed(1) || 0}</p>
                                    <p className="text-xs text-slate-500">horas</p>
                                </div>
                                
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Memory GB·h</p>
                                    <p className="text-2xl font-black text-white">{usage?.memory_gb_hours?.toFixed(1) || 0}</p>
                                    <p className="text-xs text-slate-500">GB·horas</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Events Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="p-6 rounded-2xl bg-white/[0.02] border border-white/5"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <Activity className="w-5 h-5 text-emerald-400" />
                                <h3 className="font-bold text-white uppercase tracking-tight">Eventos</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Telemetria</p>
                                    <p className="text-2xl font-black text-white">{(usage?.telemetry_events || 0).toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">eventos</p>
                                </div>
                                
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Webhooks</p>
                                    <p className="text-2xl font-black text-white">{(usage?.webhook_calls || 0).toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">chamadas</p>
                                </div>
                                
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">API Requests</p>
                                    <p className="text-2xl font-black text-white">{(usage?.api_requests || 0).toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">requisições</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Storage Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="p-6 rounded-2xl bg-white/[0.02] border border-white/5"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <Database className="w-5 h-5 text-blue-400" />
                                <h3 className="font-bold text-white uppercase tracking-tight">Storage</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-bold text-slate-500 uppercase">Armazenamento</p>
                                        <p className="text-xs text-slate-400">
                                            {usage?.storage_gb?.toFixed(2) || 0} / {limits?.max_storage_gb === -1 ? "∞" : limits?.max_storage_gb} GB
                                        </p>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className={cn(
                                                "h-full rounded-full transition-all",
                                                getUsageColor(getUsagePercentage(usage?.storage_gb || 0, limits?.max_storage_gb || 1))
                                            )}
                                            style={{ width: `${getUsagePercentage(usage?.storage_gb || 0, limits?.max_storage_gb || 1)}%` }}
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Bandwidth</p>
                                    <p className="text-2xl font-black text-white">{usage?.bandwidth_gb?.toFixed(2) || 0}</p>
                                    <p className="text-xs text-slate-500">GB transferidos</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Incidents Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="p-6 rounded-2xl bg-white/[0.02] border border-white/5"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                                <h3 className="font-bold text-white uppercase tracking-tight">Incidentes</h3>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Crashes</p>
                                    <p className={cn(
                                        "text-2xl font-black",
                                        (usage?.crash_count || 0) > 0 ? "text-rose-400" : "text-white"
                                    )}>{usage?.crash_count || 0}</p>
                                </div>
                                
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Retries</p>
                                    <p className={cn(
                                        "text-2xl font-black",
                                        (usage?.retry_count || 0) > 5 ? "text-amber-400" : "text-white"
                                    )}>{usage?.retry_count || 0}</p>
                                </div>
                                
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Rollbacks</p>
                                    <p className={cn(
                                        "text-2xl font-black",
                                        (usage?.rollback_count || 0) > 0 ? "text-amber-400" : "text-white"
                                    )}>{usage?.rollback_count || 0}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Limits Overview */}
                        {limits && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600/10 to-purple-600/5 border border-indigo-500/20"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                                    <h3 className="font-bold text-white uppercase tracking-tight">Limites do Plano</h3>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-3 rounded-xl bg-white/[0.02]">
                                        <p className="text-xs text-slate-500">Max Apps</p>
                                        <p className="text-lg font-bold text-white">
                                            {limits.max_apps === -1 ? "∞" : limits.max_apps}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/[0.02]">
                                        <p className="text-xs text-slate-500">Deploys/dia</p>
                                        <p className="text-lg font-bold text-white">
                                            {limits.max_deploys_per_day === -1 ? "∞" : limits.max_deploys_per_day}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/[0.02]">
                                        <p className="text-xs text-slate-500">CPU Cores</p>
                                        <p className="text-lg font-bold text-white">{limits.max_cpu_cores}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/[0.02]">
                                        <p className="text-xs text-slate-500">Memória</p>
                                        <p className="text-lg font-bold text-white">{limits.max_memory_gb} GB</p>
                                    </div>
                                </div>
                                
                                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Logs: {limits.log_retention_days} dias • Telemetria: {limits.telemetry_retention_days} dias</span>
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
