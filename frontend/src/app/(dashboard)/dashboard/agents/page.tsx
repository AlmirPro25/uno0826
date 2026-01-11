"use client";

import { useState, useEffect } from "react";
import { 
    Bot, Play, Pause, Settings, Activity, Shield, Zap,
    Loader2, RefreshCw, Info, Brain, Ghost, Crown,
    AlertTriangle, CheckCircle2, Clock
} from "lucide-react";
import { AppHeader } from "@/components/dashboard/app-header";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";

interface Agent {
    id: string;
    name: string;
    type: string;
    description: string;
    status: "active" | "paused" | "shadow" | "disabled";
    autonomy_level: number;
    authority_level: string;
    actions_today: number;
    actions_total: number;
    last_action: string | null;
    rules_count: number;
    created_at: string;
}

// Níveis de autonomia
const autonomyLevels: Record<number, { label: string; description: string; color: string }> = {
    1: { label: "Observador", description: "Apenas monitora e reporta", color: "slate" },
    2: { label: "Sugestor", description: "Sugere ações, não executa", color: "violet" },
    3: { label: "Operador", description: "Executa ações operacionais", color: "indigo" },
    4: { label: "Autônomo", description: "Executa sem confirmação", color: "amber" },
    5: { label: "Soberano", description: "Controle total do domínio", color: "rose" },
};

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAgents = async () => {
        setLoading(true);
        try {
            // Tentar buscar agentes da API
            const res = await api.get("/agents");
            const data = res.data.agents || res.data || [];
            setAgents(data.map((a: Record<string, unknown>) => ({
                id: a.id,
                name: a.name || a.agent_name,
                type: a.type || a.agent_type || "general",
                description: a.description || "",
                status: a.status || "active",
                autonomy_level: a.autonomy_level || 1,
                authority_level: a.authority_level || "operator",
                actions_today: a.actions_today || a.executions_today || 0,
                actions_total: a.actions_total || 0,
                last_action: a.last_action_at || a.last_execution_at,
                rules_count: a.rules_count || 0,
                created_at: a.created_at
            })));
        } catch {
            // Se não houver API de agentes, mostrar agentes conceituais do sistema
            setAgents([
                {
                    id: "rules-engine",
                    name: "Motor de Regras",
                    type: "cognitive",
                    description: "Avalia condições e dispara ações baseadas em métricas",
                    status: "active",
                    autonomy_level: 3,
                    authority_level: "operator",
                    actions_today: 0,
                    actions_total: 0,
                    last_action: null,
                    rules_count: 0,
                    created_at: new Date().toISOString()
                },
                {
                    id: "webhook-executor",
                    name: "Executor de Webhooks",
                    type: "action",
                    description: "Executa chamadas HTTP para sistemas externos",
                    status: "active",
                    autonomy_level: 3,
                    authority_level: "operator",
                    actions_today: 0,
                    actions_total: 0,
                    last_action: null,
                    rules_count: 0,
                    created_at: new Date().toISOString()
                },
                {
                    id: "alert-manager",
                    name: "Gerenciador de Alertas",
                    type: "notification",
                    description: "Cria e gerencia alertas do sistema",
                    status: "active",
                    autonomy_level: 4,
                    authority_level: "manager",
                    actions_today: 0,
                    actions_total: 0,
                    last_action: null,
                    rules_count: 0,
                    created_at: new Date().toISOString()
                },
                {
                    id: "shadow-observer",
                    name: "Observador Shadow",
                    type: "simulation",
                    description: "Simula ações sem executar para validação",
                    status: "shadow",
                    autonomy_level: 2,
                    authority_level: "suggestor",
                    actions_today: 0,
                    actions_total: 0,
                    last_action: null,
                    rules_count: 0,
                    created_at: new Date().toISOString()
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    const getStatusConfig = (status: Agent["status"]) => {
        switch (status) {
            case "active":
                return { label: "Ativo", color: "emerald", icon: CheckCircle2 };
            case "paused":
                return { label: "Pausado", color: "amber", icon: Clock };
            case "shadow":
                return { label: "Shadow", color: "violet", icon: Ghost };
            case "disabled":
                return { label: "Desativado", color: "slate", icon: AlertTriangle };
            default:
                return { label: status, color: "slate", icon: Bot };
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "cognitive": return Brain;
            case "action": return Zap;
            case "notification": return Activity;
            case "simulation": return Ghost;
            default: return Bot;
        }
    };

    const formatRelativeTime = (timestamp: string | null) => {
        if (!timestamp) return "Nunca";
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMin / 60);
        
        if (diffMin < 60) return `${diffMin}min atrás`;
        if (diffHour < 24) return `${diffHour}h atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    const toggleAgent = (id: string) => {
        setAgents(prev => prev.map(a => {
            if (a.id !== id) return a;
            const newStatus = a.status === "active" ? "paused" : "active";
            return { ...a, status: newStatus };
        }));
    };

    // Estatísticas
    const stats = {
        total: agents.length,
        active: agents.filter(a => a.status === "active").length,
        shadow: agents.filter(a => a.status === "shadow").length,
        actionsToday: agents.reduce((sum, a) => sum + a.actions_today, 0),
    };

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
                        <Bot className="w-8 h-8 text-indigo-400" />
                        Agentes do Sistema
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Componentes autônomos que operam o kernel
                    </p>
                </div>
                <button
                    onClick={fetchAgents}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors"
                >
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    Atualizar
                </button>
            </div>

            {/* Explicação */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20"
            >
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-indigo-300 font-medium">O que são Agentes?</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Agentes são componentes autônomos do sistema que executam tarefas específicas.
                            Cada agente tem um nível de autonomia que define o que pode fazer sem supervisão humana.
                            Agentes em modo Shadow simulam ações sem executá-las.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Total", value: stats.total, color: "indigo", icon: Bot },
                    { label: "Ativos", value: stats.active, color: "emerald", icon: Zap },
                    { label: "Shadow", value: stats.shadow, color: "violet", icon: Ghost },
                    { label: "Ações Hoje", value: stats.actionsToday, color: "cyan", icon: Activity },
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

            {/* Agents List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : agents.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <Bot className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Nenhum agente configurado</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {agents.map((agent, i) => {
                        const statusConfig = getStatusConfig(agent.status);
                        const StatusIcon = statusConfig.icon;
                        const TypeIcon = getTypeIcon(agent.type);
                        const autonomy = autonomyLevels[agent.autonomy_level] || autonomyLevels[1];
                        
                        return (
                            <motion.div
                                key={agent.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={cn(
                                    "p-5 rounded-2xl border transition-all",
                                    agent.status === "active" 
                                        ? "bg-white/[0.02] border-white/10" 
                                        : agent.status === "shadow"
                                        ? "bg-violet-500/5 border-violet-500/20"
                                        : "bg-white/[0.01] border-white/5 opacity-60"
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center",
                                        agent.status === "shadow" 
                                            ? "bg-violet-500/20" 
                                            : "bg-indigo-500/20"
                                    )}>
                                        <TypeIcon className={cn(
                                            "w-6 h-6",
                                            agent.status === "shadow" ? "text-violet-400" : "text-indigo-400"
                                        )} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-white">{agent.name}</h3>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1",
                                                `bg-${statusConfig.color}-500/20 text-${statusConfig.color}-400`
                                            )}>
                                                <StatusIcon className="w-3 h-3" />
                                                {statusConfig.label}
                                            </span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                `bg-${autonomy.color}-500/20 text-${autonomy.color}-400`
                                            )}>
                                                L{agent.autonomy_level} {autonomy.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 mb-3">{agent.description}</p>
                                        
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Activity className="w-3 h-3" />
                                                {agent.actions_today} ações hoje
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Última: {formatRelativeTime(agent.last_action)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Crown className="w-3 h-3" />
                                                {agent.authority_level}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleAgent(agent.id)}
                                            className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                agent.status === "active"
                                                    ? "text-amber-400 hover:bg-amber-500/10"
                                                    : "text-emerald-400 hover:bg-emerald-500/10"
                                            )}
                                            title={agent.status === "active" ? "Pausar" : "Ativar"}
                                        >
                                            {agent.status === "active" ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                        </button>
                                        <button 
                                            className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                            title="Configurar"
                                        >
                                            <Settings className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Links relacionados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <Link href="/dashboard/rules">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <Brain className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-purple-400">Regras</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Configure as regras que os agentes executam
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </Link>
                
                <Link href="/dashboard/authority">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-amber-400">Autoridade</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Defina os limites de poder dos agentes
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </Link>
            </div>
        </div>
    );
}
