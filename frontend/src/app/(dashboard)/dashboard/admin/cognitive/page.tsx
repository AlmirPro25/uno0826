"use client";

import { useState, useEffect } from "react";
import { Brain, Activity, Users, Zap, Clock, AlertTriangle, Eye } from "lucide-react";

interface SystemMetrics {
    active_users_24h: number;
    total_requests_24h: number;
    avg_response_time_ms: number;
    error_rate_percent: number;
    active_agents: number;
    pending_approvals: number;
    shadow_mode_actions: number;
    kill_switches_active: number;
}

interface AgentActivity {
    id: string;
    agent_name: string;
    action: string;
    status: "completed" | "pending" | "blocked" | "shadow";
    timestamp: string;
    details: string;
}

const mockMetrics: SystemMetrics = {
    active_users_24h: 47,
    total_requests_24h: 12453,
    avg_response_time_ms: 89,
    error_rate_percent: 0.12,
    active_agents: 3,
    pending_approvals: 2,
    shadow_mode_actions: 15,
    kill_switches_active: 0
};

const mockActivities: AgentActivity[] = [
    {
        id: "1",
        agent_name: "billing-agent",
        action: "process_refund",
        status: "completed",
        timestamp: "2026-01-10T09:45:00Z",
        details: "Reembolso de R$ 150,00 processado"
    },
    {
        id: "2",
        agent_name: "risk-agent",
        action: "flag_transaction",
        status: "pending",
        timestamp: "2026-01-10T09:30:00Z",
        details: "Transação suspeita aguardando revisão"
    },
    {
        id: "3",
        agent_name: "notification-agent",
        action: "send_batch",
        status: "shadow",
        timestamp: "2026-01-10T09:15:00Z",
        details: "Envio em massa simulado (shadow mode)"
    },
    {
        id: "4",
        agent_name: "cleanup-agent",
        action: "delete_old_data",
        status: "blocked",
        timestamp: "2026-01-10T09:00:00Z",
        details: "Bloqueado por política de retenção"
    }
];

export default function CognitiveDashboardPage() {
    const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
    const [activities, setActivities] = useState<AgentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setMetrics(mockMetrics);
            setActivities(mockActivities);
            setLoading(false);
        }, 500);
    }, []);

    const getStatusBadge = (status: AgentActivity["status"]) => {
        switch (status) {
            case "completed":
                return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">COMPLETED</span>;
            case "pending":
                return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">PENDING</span>;
            case "blocked":
                return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">BLOCKED</span>;
            case "shadow":
                return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">SHADOW</span>;
        }
    };

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Cognitive Dashboard</h1>
                    <p className="text-sm text-slate-400 mt-1">Observabilidade total do sistema cognitivo</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-emerald-400">LIVE</span>
                </div>
            </div>

            {/* Warning Banner */}
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-start gap-3">
                <Eye className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-indigo-400">Modo Observação</p>
                    <p className="text-xs text-indigo-400/70 mt-1">
                        Este dashboard é READ-ONLY. Você pode observar tudo, mas não pode interferir.
                        Todas as ações passam pelo sistema de governança.
                    </p>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-500/20">
                            <Users className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white">{metrics?.active_users_24h}</p>
                            <p className="text-xs text-slate-500">Usuários Ativos</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/20">
                            <Activity className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white">{metrics?.total_requests_24h.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">Requests 24h</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-cyan-500/20">
                            <Clock className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white">{metrics?.avg_response_time_ms}ms</p>
                            <p className="text-xs text-slate-500">Latência Média</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-rose-500/20">
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white">{metrics?.error_rate_percent}%</p>
                            <p className="text-xs text-slate-500">Taxa de Erro</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Governance Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-purple-500/20">
                            <Brain className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white">{metrics?.active_agents}</p>
                            <p className="text-xs text-slate-500">Agentes Ativos</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/20">
                            <Clock className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white">{metrics?.pending_approvals}</p>
                            <p className="text-xs text-slate-500">Aprovações Pendentes</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-500/20">
                            <Eye className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white">{metrics?.shadow_mode_actions}</p>
                            <p className="text-xs text-slate-500">Shadow Mode</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${metrics?.kill_switches_active ? "bg-rose-500/20" : "bg-emerald-500/20"}`}>
                            <Zap className={`w-4 h-4 ${metrics?.kill_switches_active ? "text-rose-400" : "text-emerald-400"}`} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white">{metrics?.kill_switches_active}</p>
                            <p className="text-xs text-slate-500">Kill Switches</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Agent Activity Feed */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="p-4 border-b border-white/5">
                    <h2 className="font-bold text-white">Atividade dos Agentes</h2>
                </div>
                <div className="divide-y divide-white/5">
                    {activities.map((activity) => (
                        <div key={activity.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                    <Brain className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-white">{activity.agent_name}</span>
                                        {getStatusBadge(activity.status)}
                                    </div>
                                    <p className="text-sm text-slate-400">{activity.details}</p>
                                    <p className="text-xs text-slate-500 mt-1">{activity.action} • {formatTime(activity.timestamp)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
