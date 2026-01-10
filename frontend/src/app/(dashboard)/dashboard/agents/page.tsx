"use client";

import { useState, useEffect } from "react";
import { Bot, Play, Pause, Settings, Activity, Shield, Zap } from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";

interface Agent {
    id: string;
    name: string;
    type: string;
    status: "active" | "paused" | "shadow" | "disabled";
    autonomy_level: number;
    actions_today: number;
    last_action: string | null;
    created_at: string;
}

const mockAgents: Agent[] = [
    {
        id: "1",
        name: "billing-agent",
        type: "financial",
        status: "active",
        autonomy_level: 3,
        actions_today: 47,
        last_action: "2026-01-10T09:45:00Z",
        created_at: "2026-01-01T00:00:00Z"
    },
    {
        id: "2",
        name: "risk-agent",
        type: "security",
        status: "active",
        autonomy_level: 2,
        actions_today: 156,
        last_action: "2026-01-10T09:50:00Z",
        created_at: "2026-01-01T00:00:00Z"
    },
    {
        id: "3",
        name: "cleanup-agent",
        type: "maintenance",
        status: "shadow",
        autonomy_level: 1,
        actions_today: 0,
        last_action: null,
        created_at: "2026-01-05T00:00:00Z"
    }
];

export default function AgentsPage() {
    const { activeApp, hasApp } = useApp();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setAgents(mockAgents);
            setLoading(false);
        }, 500);
    }, []);

    const getStatusBadge = (status: Agent["status"]) => {
        switch (status) {
            case "active":
                return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ACTIVE</span>;
            case "paused":
                return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">PAUSED</span>;
            case "shadow":
                return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">SHADOW</span>;
            case "disabled":
                return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">DISABLED</span>;
        }
    };

    const formatTime = (date: string | null) => {
        if (!date) return "Nunca";
        return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    };

    const toggleAgent = (id: string) => {
        setAgents(prev => prev.map(a => {
            if (a.id !== id) return a;
            const newStatus = a.status === "active" ? "paused" : "active";
            return { ...a, status: newStatus };
        }));
    };

    return (
        <div className="space-y-6">
            <AppHeader />
            
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">
                        Agentes {activeApp ? `de ${activeApp.name}` : ""}
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Gestão de agentes autônomos do sistema</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Total", value: agents.length, icon: Bot, color: "indigo" },
                    { label: "Ativos", value: agents.filter(a => a.status === "active").length, icon: Zap, color: "emerald" },
                    { label: "Shadow", value: agents.filter(a => a.status === "shadow").length, icon: Shield, color: "purple" },
                    { label: "Ações Hoje", value: agents.reduce((sum, a) => sum + a.actions_today, 0), icon: Activity, color: "cyan" }
                ].map((stat) => (
                    <div key={stat.label} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl bg-${stat.color}-500/20`}>
                                <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{stat.value}</p>
                                <p className="text-xs text-slate-500">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Agents List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : agents.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <Bot className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">
                        {hasApp && activeApp 
                            ? `${activeApp.name} ainda não tem agentes configurados` 
                            : "Nenhum agente configurado"}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {agents.map((agent) => (
                        <div key={agent.id} className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                        <Bot className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-white">{agent.name}</h3>
                                            {getStatusBadge(agent.status)}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span>Tipo: {agent.type}</span>
                                            <span>Autonomia: L{agent.autonomy_level}</span>
                                            <span>{agent.actions_today} ações hoje</span>
                                            <span>Última: {formatTime(agent.last_action)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleAgent(agent.id)}
                                        className={`p-2 rounded-lg transition-colors ${
                                            agent.status === "active"
                                                ? "text-amber-400 hover:bg-amber-500/10"
                                                : "text-emerald-400 hover:bg-emerald-500/10"
                                        }`}
                                    >
                                        {agent.status === "active" ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                    </button>
                                    <button className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                        <Settings className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
