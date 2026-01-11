"use client";

import { useEffect, useState } from "react";
import { 
    Activity, Brain, Zap, Shield, Crown, Ghost,
    CheckCircle2, AlertTriangle, XCircle, Loader2
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";

interface LoopStatus {
    id: string;
    name: string;
    description: string;
    status: "healthy" | "warning" | "error" | "inactive";
    icon: typeof Activity;
    href: string;
    color: string;
    metric?: string;
}

interface SystemStatusProps {
    appId?: string;
    compact?: boolean;
}

export function SystemStatus({ appId, compact = false }: SystemStatusProps) {
    const [loading, setLoading] = useState(true);
    const [loops, setLoops] = useState<LoopStatus[]>([]);

    useEffect(() => {
        const fetchStatus = async () => {
            setLoading(true);
            
            // Status padrão dos loops
            const loopStatuses: LoopStatus[] = [
                {
                    id: "pulse",
                    name: "Pulso",
                    description: "Telemetria e eventos",
                    status: "healthy",
                    icon: Activity,
                    href: "/dashboard/telemetry",
                    color: "emerald",
                },
                {
                    id: "cognition",
                    name: "Cognição",
                    description: "Motor de regras",
                    status: "healthy",
                    icon: Brain,
                    href: "/dashboard/rules",
                    color: "purple",
                },
                {
                    id: "action",
                    name: "Ação",
                    description: "Webhooks e execuções",
                    status: "healthy",
                    icon: Zap,
                    href: "/dashboard/webhooks",
                    color: "indigo",
                },
                {
                    id: "trust",
                    name: "Confiança",
                    description: "Shadow Mode e Kill Switch",
                    status: "healthy",
                    icon: Shield,
                    href: "/dashboard/shadow",
                    color: "violet",
                },
                {
                    id: "delegation",
                    name: "Delegação",
                    description: "Autoridade e aprovações",
                    status: "healthy",
                    icon: Crown,
                    href: "/dashboard/authority",
                    color: "amber",
                },
            ];

            try {
                // Verificar Shadow Mode
                const shadowRes = await api.get("/admin/rules/shadow");
                if (shadowRes.data?.active) {
                    const trustLoop = loopStatuses.find(l => l.id === "trust");
                    if (trustLoop) {
                        trustLoop.status = "warning";
                        trustLoop.metric = "Shadow ativo";
                        trustLoop.icon = Ghost;
                    }
                }
            } catch {
                // Ignorar erro
            }

            try {
                // Verificar Kill Switch
                const killRes = await api.get("/admin/rules/killswitch");
                if (killRes.data?.active) {
                    const trustLoop = loopStatuses.find(l => l.id === "trust");
                    if (trustLoop) {
                        trustLoop.status = "error";
                        trustLoop.metric = "Kill Switch ativo";
                    }
                }
            } catch {
                // Ignorar erro
            }

            try {
                // Verificar aprovações pendentes
                const approvalsRes = await api.get("/approval/pending");
                const pending = approvalsRes.data.pending || approvalsRes.data || [];
                const pendingCount = Array.isArray(pending) ? pending.length : 0;
                
                if (pendingCount > 0) {
                    const delegationLoop = loopStatuses.find(l => l.id === "delegation");
                    if (delegationLoop) {
                        delegationLoop.status = "warning";
                        delegationLoop.metric = `${pendingCount} pendente${pendingCount > 1 ? "s" : ""}`;
                    }
                }
            } catch {
                // Ignorar erro
            }

            setLoops(loopStatuses);
            setLoading(false);
        };

        fetchStatus();
    }, [appId]);

    const getStatusIcon = (status: LoopStatus["status"]) => {
        switch (status) {
            case "healthy": return CheckCircle2;
            case "warning": return AlertTriangle;
            case "error": return XCircle;
            default: return CheckCircle2;
        }
    };

    const getStatusColor = (status: LoopStatus["status"]) => {
        switch (status) {
            case "healthy": return "emerald";
            case "warning": return "amber";
            case "error": return "rose";
            default: return "slate";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                {loops.map((loop) => {
                    const StatusIcon = getStatusIcon(loop.status);
                    const statusColor = getStatusColor(loop.status);
                    
                    return (
                        <Link key={loop.id} href={loop.href}>
                            <div 
                                className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                                    `bg-${statusColor}-500/20 hover:bg-${statusColor}-500/30`
                                )}
                                title={`${loop.name}: ${loop.metric || loop.status}`}
                            >
                                <StatusIcon className={cn("w-4 h-4", `text-${statusColor}-400`)} />
                            </div>
                        </Link>
                    );
                })}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-white/[0.02] border border-white/5"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                    Status do Sistema
                </h3>
                <div className="flex items-center gap-2">
                    {loops.every(l => l.status === "healthy") ? (
                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase">
                            Operacional
                        </span>
                    ) : loops.some(l => l.status === "error") ? (
                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 uppercase">
                            Atenção Requerida
                        </span>
                    ) : (
                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 uppercase">
                            Monitorando
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
                {loops.map((loop, i) => {
                    const LoopIcon = loop.icon;
                    const StatusIcon = getStatusIcon(loop.status);
                    const statusColor = getStatusColor(loop.status);
                    
                    return (
                        <Link key={loop.id} href={loop.href}>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={cn(
                                    "p-4 rounded-xl border transition-all cursor-pointer text-center",
                                    loop.status === "healthy" 
                                        ? "bg-white/[0.02] border-white/5 hover:border-white/10"
                                        : loop.status === "warning"
                                        ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40"
                                        : "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center",
                                    `bg-${loop.color}-500/20`
                                )}>
                                    <LoopIcon className={cn("w-5 h-5", `text-${loop.color}-400`)} />
                                </div>
                                <p className="text-xs font-bold text-white mb-1">{loop.name}</p>
                                <div className="flex items-center justify-center gap-1">
                                    <StatusIcon className={cn("w-3 h-3", `text-${statusColor}-400`)} />
                                    <span className={cn("text-[10px]", `text-${statusColor}-400`)}>
                                        {loop.metric || (loop.status === "healthy" ? "OK" : loop.status)}
                                    </span>
                                </div>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </motion.div>
    );
}
