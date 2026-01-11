"use client";

import { useState, useEffect } from "react";
import { 
    Shield, Search, AlertTriangle, CheckCircle2, Clock, 
    Loader2, RefreshCw, Info, Lock, Zap, XCircle,
    Crown
} from "lucide-react";
import { AppHeader } from "@/components/dashboard/app-header";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";

// Política de ação do backend
interface ActionPolicy {
    action_type: string;
    permission: "automatic" | "confirmation" | "never";
    max_blast_radius: {
        scope: string;
        max_affected: number;
    };
    max_duration: string;
    requires_approval: boolean;
    description: string;
}

// Tradução de permissões
const permissionConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
    automatic: { label: "Automático", color: "emerald", icon: CheckCircle2 },
    confirmation: { label: "Requer Aprovação", color: "amber", icon: Clock },
    never: { label: "Nunca Automático", color: "rose", icon: XCircle },
};

// Tradução de tipos de ação
const actionTypeLabels: Record<string, string> = {
    alert: "Criar Alerta",
    webhook: "Chamar Webhook",
    flag: "Definir Flag",
    notify: "Enviar Notificação",
    adjust: "Ajustar Config",
    create_rule: "Criar Regra",
    disable_rule: "Desativar Regra",
    escalate: "Escalar Severidade",
};

export default function PoliciesPage() {
    const [loading, setLoading] = useState(true);
    const [policies, setPolicies] = useState<Record<string, ActionPolicy>>({});
    const [prohibitedActions, setProhibitedActions] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [filterPermission, setFilterPermission] = useState<string>("all");

    const fetchPolicies = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/rules/policies");
            setPolicies(res.data.policies || {});
            setProhibitedActions(res.data.prohibited_actions || []);
        } catch (error) {
            console.error("Failed to fetch policies", error);
            setPolicies({});
            setProhibitedActions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicies();
    }, []);

    const policyList = Object.entries(policies);
    
    const filteredPolicies = policyList.filter(([key, policy]) => {
        const matchesSearch = !search || 
            key.toLowerCase().includes(search.toLowerCase()) ||
            policy.description.toLowerCase().includes(search.toLowerCase());
        const matchesPermission = filterPermission === "all" || policy.permission === filterPermission;
        return matchesSearch && matchesPermission;
    });

    // Estatísticas
    const stats = {
        total: policyList.length,
        automatic: policyList.filter(([, p]) => p.permission === "automatic").length,
        confirmation: policyList.filter(([, p]) => p.permission === "confirmation").length,
        never: policyList.filter(([, p]) => p.permission === "never").length,
        prohibited: prohibitedActions.length,
    };

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
                        <Shield className="w-8 h-8 text-indigo-400" />
                        Políticas de Ação
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        O que o sistema pode fazer automaticamente
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/authority">
                        <button className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-400 text-sm font-bold rounded-xl transition-colors">
                            <Crown className="w-4 h-4" />
                            Ver Autoridade
                        </button>
                    </Link>
                    <button
                        onClick={fetchPolicies}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </button>
                </div>
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
                        <p className="text-sm text-indigo-300 font-medium">Como funcionam as políticas?</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Cada tipo de ação tem uma política que define se pode ser executada automaticamente,
                            se precisa de aprovação humana, ou se nunca pode ser automática.
                            Isso garante que o sistema nunca tome decisões perigosas sem supervisão.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: "Total", value: stats.total, color: "indigo", icon: Shield },
                    { label: "Automáticas", value: stats.automatic, color: "emerald", icon: CheckCircle2 },
                    { label: "Aprovação", value: stats.confirmation, color: "amber", icon: Clock },
                    { label: "Nunca Auto", value: stats.never, color: "rose", icon: XCircle },
                    { label: "Proibidas", value: stats.prohibited, color: "rose", icon: Lock },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn(
                            "p-4 rounded-xl border",
                            `bg-${stat.color}-500/5 border-${stat.color}-500/20`
                        )}
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
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar políticas..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
                    />
                </div>
                <select
                    value={filterPermission}
                    onChange={(e) => setFilterPermission(e.target.value)}
                    className="h-12 px-4 rounded-xl bg-white/[0.02] border border-white/10 text-white focus:border-indigo-500/50 outline-none"
                >
                    <option value="all">Todas</option>
                    <option value="automatic">Automáticas</option>
                    <option value="confirmation">Requer Aprovação</option>
                    <option value="never">Nunca Automático</option>
                </select>
            </div>

            {/* Policies List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : filteredPolicies.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Nenhuma política encontrada</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredPolicies.map(([key, policy], i) => {
                        const config = permissionConfig[policy.permission] || permissionConfig.automatic;
                        const Icon = config.icon;
                        
                        return (
                            <motion.div
                                key={key}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className={cn(
                                    "p-5 rounded-2xl border transition-all",
                                    `bg-${config.color}-500/5 border-${config.color}-500/20`
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                        `bg-${config.color}-500/20`
                                    )}>
                                        <Icon className={cn("w-6 h-6", `text-${config.color}-400`)} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <code className="text-sm font-bold text-white font-mono">
                                                {actionTypeLabels[key] || key}
                                            </code>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                `bg-${config.color}-500/20 text-${config.color}-400`
                                            )}>
                                                {config.label}
                                            </span>
                                            {policy.requires_approval && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400">
                                                    Human-in-the-loop
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-400 mb-3">{policy.description}</p>
                                        
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                            {policy.max_blast_radius?.scope && (
                                                <span className="flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Escopo: <code className="text-slate-400">{policy.max_blast_radius.scope}</code>
                                                </span>
                                            )}
                                            {policy.max_blast_radius?.max_affected > 0 && (
                                                <span>
                                                    Max afetados: <code className="text-slate-400">{policy.max_blast_radius.max_affected}</code>
                                                </span>
                                            )}
                                            {policy.max_duration && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Duração max: <code className="text-slate-400">{policy.max_duration}</code>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center",
                                        `bg-${config.color}-500/10`
                                    )}>
                                        <Zap className={cn("w-5 h-5", `text-${config.color}-400`)} />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Ações Proibidas */}
            {prohibitedActions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Lock className="w-5 h-5 text-rose-400" />
                        <h3 className="text-lg font-bold text-rose-400 uppercase tracking-tight">
                            Ações Proibidas
                        </h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">
                        Estas ações NUNCA podem ser executadas automaticamente pelo sistema.
                        Requerem intervenção humana explícita através de interfaces específicas.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {prohibitedActions.map(action => (
                            <code 
                                key={action} 
                                className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-mono border border-rose-500/20"
                            >
                                {action}
                            </code>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Link para Authority */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Link href="/dashboard/authority">
                    <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                    <Crown className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-purple-400">Níveis de Autoridade</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Veja quem pode fazer o quê no sistema
                                    </p>
                                </div>
                            </div>
                            <Zap className="w-5 h-5 text-purple-400" />
                        </div>
                    </div>
                </Link>
            </motion.div>
        </div>
    );
}
