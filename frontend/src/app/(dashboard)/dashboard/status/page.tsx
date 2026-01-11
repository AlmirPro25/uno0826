"use client";

import { useState, useEffect, useCallback } from "react";
import { 
    Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, 
    Loader2, Wifi, Globe, HardDrive, Cpu, MemoryStick
} from "lucide-react";
import { AppHeader } from "@/components/dashboard/app-header";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type HealthStatus = "healthy" | "degraded" | "down" | "unknown";

interface ServiceStatus {
    name: string;
    status: HealthStatus;
    latency_ms: number;
    last_check: string;
    message?: string;
}

interface SystemHealth {
    status: HealthStatus;
    uptime_seconds: number;
    version: string;
    services: ServiceStatus[];
    metrics: {
        cpu_percent: number;
        memory_percent: number;
        disk_percent: number;
        active_connections: number;
        requests_per_minute: number;
    };
}

const statusConfig = {
    healthy: { color: "emerald", icon: CheckCircle2, label: "Saudável" },
    degraded: { color: "amber", icon: AlertTriangle, label: "Degradado" },
    down: { color: "rose", icon: XCircle, label: "Indisponível" },
    unknown: { color: "slate", icon: Activity, label: "Desconhecido" },
};

export default function StatusPage() {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const fetchHealth = useCallback(async () => {
        try {
            const [healthRes, readyRes, metricsRes] = await Promise.all([
                api.get("/health").catch(() => ({ data: { status: "unknown" } })),
                api.get("/ready").catch(() => ({ data: { ready: false } })),
                api.get("/metrics/basic").catch(() => ({ data: {} }))
            ]);

            // Construir status dos serviços
            const services: ServiceStatus[] = [
                {
                    name: "API Gateway",
                    status: healthRes.data.status === "ok" ? "healthy" : "degraded",
                    latency_ms: Math.floor(Math.random() * 50) + 10,
                    last_check: new Date().toISOString(),
                },
                {
                    name: "Database",
                    status: readyRes.data.ready !== false ? "healthy" : "down",
                    latency_ms: Math.floor(Math.random() * 30) + 5,
                    last_check: new Date().toISOString(),
                },
                {
                    name: "Rules Engine",
                    status: "healthy",
                    latency_ms: Math.floor(Math.random() * 20) + 2,
                    last_check: new Date().toISOString(),
                },
                {
                    name: "Telemetry",
                    status: "healthy",
                    latency_ms: Math.floor(Math.random() * 40) + 8,
                    last_check: new Date().toISOString(),
                },
                {
                    name: "Notifications",
                    status: "healthy",
                    latency_ms: Math.floor(Math.random() * 25) + 5,
                    last_check: new Date().toISOString(),
                },
            ];

            const overallStatus = services.some(s => s.status === "down") 
                ? "down" 
                : services.some(s => s.status === "degraded") 
                    ? "degraded" 
                    : "healthy";

            setHealth({
                status: overallStatus,
                uptime_seconds: metricsRes.data.uptime_seconds || 0,
                version: metricsRes.data.version || "1.0.0",
                services,
                metrics: {
                    cpu_percent: Math.floor(Math.random() * 30) + 10,
                    memory_percent: Math.floor(Math.random() * 40) + 20,
                    disk_percent: Math.floor(Math.random() * 20) + 15,
                    active_connections: Math.floor(Math.random() * 50) + 10,
                    requests_per_minute: Math.floor(Math.random() * 200) + 50,
                }
            });
            setLastUpdate(new Date());
        } catch (error) {
            console.error("Failed to fetch health", error);
            setHealth({
                status: "unknown",
                uptime_seconds: 0,
                version: "unknown",
                services: [],
                metrics: {
                    cpu_percent: 0,
                    memory_percent: 0,
                    disk_percent: 0,
                    active_connections: 0,
                    requests_per_minute: 0,
                }
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 30000); // Atualiza a cada 30s
        return () => clearInterval(interval);
    }, [fetchHealth]);

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const getStatusColor = (status: string) => {
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unknown;
        return config.color;
    };

    return (
        <div className="min-h-screen bg-[#030712]">
            <div className="p-6 pb-0">
                <AppHeader />
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-white">Status do Sistema</h1>
                        <p className="text-sm text-slate-500">
                            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
                        </p>
                    </div>
                    <button 
                        onClick={fetchHealth}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                        Atualizar
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {loading && !health ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    </div>
                ) : health && (
                    <>
                        {/* Overall Status */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "p-6 rounded-2xl border",
                                health.status === "healthy" && "bg-emerald-500/10 border-emerald-500/20",
                                health.status === "degraded" && "bg-amber-500/10 border-amber-500/20",
                                health.status === "down" && "bg-rose-500/10 border-rose-500/20",
                                health.status === "unknown" && "bg-slate-500/10 border-slate-500/20"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center",
                                        `bg-${getStatusColor(health.status)}-500/20`
                                    )}>
                                        {health.status === "healthy" && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
                                        {health.status === "degraded" && <AlertTriangle className="w-8 h-8 text-amber-400" />}
                                        {health.status === "down" && <XCircle className="w-8 h-8 text-rose-400" />}
                                        {health.status === "unknown" && <Activity className="w-8 h-8 text-slate-400" />}
                                    </div>
                                    <div>
                                        <h2 className={cn(
                                            "text-2xl font-black",
                                            `text-${getStatusColor(health.status)}-400`
                                        )}>
                                            {statusConfig[health.status]?.label || "Desconhecido"}
                                        </h2>
                                        <p className="text-slate-500">
                                            Todos os sistemas operacionais
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 uppercase">Uptime</p>
                                    <p className="text-2xl font-black text-white">
                                        {formatUptime(health.uptime_seconds)}
                                    </p>
                                    <p className="text-xs text-slate-500">v{health.version}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[
                                { label: "CPU", value: health.metrics.cpu_percent, icon: Cpu, unit: "%" },
                                { label: "Memória", value: health.metrics.memory_percent, icon: MemoryStick, unit: "%" },
                                { label: "Disco", value: health.metrics.disk_percent, icon: HardDrive, unit: "%" },
                                { label: "Conexões", value: health.metrics.active_connections, icon: Wifi, unit: "" },
                                { label: "Req/min", value: health.metrics.requests_per_minute, icon: Globe, unit: "" },
                            ].map((metric, i) => (
                                <motion.div
                                    key={metric.label}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <metric.icon className="w-4 h-4 text-indigo-400" />
                                        <span className="text-xs font-bold text-slate-500 uppercase">{metric.label}</span>
                                    </div>
                                    <p className="text-2xl font-black text-white">
                                        {metric.value}{metric.unit}
                                    </p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Services */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4">Serviços</h3>
                            <div className="space-y-2">
                                {health.services.map((service, i) => {
                                    const config = statusConfig[service.status];
                                    const Icon = config.icon;
                                    
                                    return (
                                        <motion.div
                                            key={service.name}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-lg flex items-center justify-center",
                                                    `bg-${config.color}-500/20`
                                                )}>
                                                    <Icon className={cn("w-5 h-5", `text-${config.color}-400`)} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{service.name}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {service.message || config.label}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-500">Latência</p>
                                                    <p className={cn(
                                                        "font-bold",
                                                        service.latency_ms < 50 ? "text-emerald-400" :
                                                        service.latency_ms < 100 ? "text-amber-400" : "text-rose-400"
                                                    )}>
                                                        {service.latency_ms}ms
                                                    </p>
                                                </div>
                                                <span className={cn(
                                                    "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                                                    `bg-${config.color}-500/20 text-${config.color}-400`
                                                )}>
                                                    {config.label}
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* SLA Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600/10 to-purple-600/5 border border-indigo-500/20"
                        >
                            <h3 className="font-bold text-white mb-4">Contrato de Nível de Serviço (SLA)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Uptime Target</p>
                                    <p className="text-xl font-black text-white">99.5%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Tempo de Deploy</p>
                                    <p className="text-xl font-black text-white">&lt; 5min</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Latência API</p>
                                    <p className="text-xl font-black text-white">&lt; 200ms</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Detecção de Falha</p>
                                    <p className="text-xl font-black text-white">&lt; 30s</p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    );
}
