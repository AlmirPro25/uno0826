"use client";

import { useEffect, useState } from "react";
import { 
    Shield, Users, Zap, Lock, Eye, Brain, Crown,
    AlertTriangle, CheckCircle2, XCircle, Loader2,
    RefreshCw, Info
} from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Níveis de autoridade
interface AuthorityLevel {
    level: string;
    rank: number;
    description: string;
}

// Domínios de ação
interface ActionDomain {
    domain: string;
    required_authority: string;
    description: string;
    examples: string[];
}

// Políticas de ação
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

// Tradução de níveis
const levelLabels: Record<string, { label: string; icon: typeof Shield; color: string }> = {
    observer: { label: "Observador", icon: Eye, color: "slate" },
    suggestor: { label: "Sugestor", icon: Brain, color: "violet" },
    operator: { label: "Operador", icon: Zap, color: "indigo" },
    manager: { label: "Gerente", icon: Users, color: "amber" },
    governor: { label: "Governador", icon: Shield, color: "emerald" },
    sovereign: { label: "Soberano", icon: Crown, color: "rose" },
};

// Tradução de domínios
const domainLabels: Record<string, string> = {
    tech: "Técnico",
    business: "Negócio",
    governance: "Governança",
    ops: "Operacional",
};

// Tradução de permissões
const permissionLabels: Record<string, { label: string; color: string }> = {
    automatic: { label: "Automático", color: "emerald" },
    confirmation: { label: "Requer Aprovação", color: "amber" },
    never: { label: "Nunca Automático", color: "rose" },
};

export default function AuthorityPage() {
    useApp(); // Para contexto do app
    const [loading, setLoading] = useState(true);
    const [levels, setLevels] = useState<AuthorityLevel[]>([]);
    const [domains, setDomains] = useState<Record<string, ActionDomain>>({});
    const [policies, setPolicies] = useState<Record<string, ActionPolicy>>({});
    const [prohibitedActions, setProhibitedActions] = useState<string[]>([]);
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

    const fetchAuthorityData = async () => {
        setLoading(true);
        try {
            const [levelsRes, domainsRes, policiesRes] = await Promise.all([
                api.get("/admin/rules/authority/levels"),
                api.get("/admin/rules/authority/domains"),
                api.get("/admin/rules/policies"),
            ]);
            
            setLevels(levelsRes.data.levels || []);
            setDomains(domainsRes.data.domains || {});
            setPolicies(policiesRes.data.policies || {});
            setProhibitedActions(policiesRes.data.prohibited_actions || []);
        } catch (error) {
            console.error("Failed to fetch authority data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuthorityData();
    }, []);

    // Calcular o que cada nível pode fazer
    const getLevelCapabilities = (levelRank: number) => {
        const canDo: string[] = [];
        const cantDo: string[] = [];
        
        Object.entries(domains).forEach(([key, domain]) => {
            const requiredRank = levels.find(l => l.level === domain.required_authority)?.rank || 99;
            
            if (levelRank >= requiredRank) {
                canDo.push(domainLabels[key] || key);
            } else {
                cantDo.push(domainLabels[key] || key);
            }
        });
        
        return { canDo, cantDo };
    };

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
                        <Shield className="w-8 h-8 text-indigo-400" />
                        Autoridade & Delegação
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Quem pode fazer o quê • Limites de poder
                    </p>
                </div>
                <button
                    onClick={fetchAuthorityData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors"
                >
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    Atualizar
                </button>
            </div>

            {/* Princípio */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600/10 to-purple-600/5 border border-indigo-500/20"
            >
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <Info className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white mb-2">Princípio de Delegação</h3>
                        <p className="text-sm text-slate-400">
                            &ldquo;Poder sem autoridade é caos. Autoridade sem limite é tirania.&rdquo;
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                            O sistema define claramente quem pode fazer o quê. Cada ação tem um nível mínimo de autoridade.
                            Ações de alto impacto requerem níveis mais altos. Algumas ações nunca são automáticas.
                        </p>
                    </div>
                </div>
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : (
                <>
                    {/* Hierarquia de Autoridade */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-6 rounded-2xl bg-white/[0.02] border border-white/5"
                    >
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-6">
                            Hierarquia de Autoridade
                        </h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {levels.map((level, i) => {
                                const config = levelLabels[level.level] || { label: level.level, icon: Shield, color: "slate" };
                                const Icon = config.icon;
                                const isSelected = selectedLevel === level.level;
                                
                                return (
                                    <motion.button
                                        key={level.level}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => setSelectedLevel(isSelected ? null : level.level)}
                                        className={cn(
                                            "p-4 rounded-xl border text-center transition-all",
                                            isSelected 
                                                ? `bg-${config.color}-500/20 border-${config.color}-500/40`
                                                : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center",
                                            `bg-${config.color}-500/20`
                                        )}>
                                            <Icon className={cn("w-5 h-5", `text-${config.color}-400`)} />
                                        </div>
                                        <p className="text-sm font-bold text-white">{config.label}</p>
                                        <p className="text-[10px] text-slate-500 uppercase mt-1">Nível {level.rank}</p>
                                    </motion.button>
                                );
                            })}
                        </div>
                        
                        {/* Detalhes do nível selecionado */}
                        {selectedLevel && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mt-6 p-4 rounded-xl bg-black/20 border border-white/5"
                            >
                                {(() => {
                                    const level = levels.find(l => l.level === selectedLevel);
                                    const config = levelLabels[selectedLevel];
                                    const capabilities = getLevelCapabilities(level?.rank || 0);
                                    
                                    return (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <config.icon className={cn("w-6 h-6", `text-${config.color}-400`)} />
                                                <div>
                                                    <h4 className="font-bold text-white">{config.label}</h4>
                                                    <p className="text-sm text-slate-400">{level?.description}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs font-bold text-emerald-400 uppercase mb-2 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> Pode fazer
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {capabilities.canDo.length > 0 ? (
                                                            capabilities.canDo.map(cap => (
                                                                <span key={cap} className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                                                                    {cap}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-slate-500">Apenas observar</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-rose-400 uppercase mb-2 flex items-center gap-1">
                                                        <XCircle className="w-3 h-3" /> Não pode fazer
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {capabilities.cantDo.length > 0 ? (
                                                            capabilities.cantDo.map(cap => (
                                                                <span key={cap} className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400">
                                                                    {cap}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-slate-500">Pode tudo</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Domínios de Ação */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-6 rounded-2xl bg-white/[0.02] border border-white/5"
                    >
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-6">
                            Domínios de Ação
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(domains).map(([key, domain], i) => {
                                const requiredConfig = levelLabels[domain.required_authority] || { label: domain.required_authority, color: "slate" };
                                
                                return (
                                    <motion.div
                                        key={key}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 + i * 0.05 }}
                                        className="p-4 rounded-xl bg-black/20 border border-white/5"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-bold text-white">{domainLabels[key] || key}</h4>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                `bg-${requiredConfig.color}-500/20 text-${requiredConfig.color}-400`
                                            )}>
                                                {requiredConfig.label}+
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 mb-3">{domain.description}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {domain.examples?.map(ex => (
                                                <code key={ex} className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-slate-400 font-mono">
                                                    {ex}
                                                </code>
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Políticas de Ação */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-6 rounded-2xl bg-white/[0.02] border border-white/5"
                    >
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-6">
                            Políticas de Ação
                        </h3>
                        
                        <div className="space-y-3">
                            {Object.entries(policies).map(([key, policy], i) => {
                                const permConfig = permissionLabels[policy.permission] || { label: policy.permission, color: "slate" };
                                
                                return (
                                    <motion.div
                                        key={key}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + i * 0.03 }}
                                        className="p-4 rounded-xl bg-black/20 border border-white/5 flex items-center gap-4"
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                            `bg-${permConfig.color}-500/20`
                                        )}>
                                            {policy.permission === "automatic" && <CheckCircle2 className={`w-5 h-5 text-${permConfig.color}-400`} />}
                                            {policy.permission === "confirmation" && <AlertTriangle className={`w-5 h-5 text-${permConfig.color}-400`} />}
                                            {policy.permission === "never" && <XCircle className={`w-5 h-5 text-${permConfig.color}-400`} />}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <code className="text-sm font-bold text-white font-mono">{policy.action_type}</code>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                    `bg-${permConfig.color}-500/20 text-${permConfig.color}-400`
                                                )}>
                                                    {permConfig.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500">{policy.description}</p>
                                        </div>
                                        
                                        <div className="text-right text-xs text-slate-500">
                                            {policy.max_duration && (
                                                <p>Max: {policy.max_duration}</p>
                                            )}
                                            {policy.max_blast_radius?.scope && (
                                                <p>Escopo: {policy.max_blast_radius.scope}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Ações Proibidas */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Lock className="w-5 h-5 text-rose-400" />
                            <h3 className="text-lg font-bold text-rose-400 uppercase tracking-tight">
                                Ações Proibidas
                            </h3>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">
                            Estas ações NUNCA podem ser executadas automaticamente, independente do nível de autoridade.
                            Requerem intervenção humana explícita.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {prohibitedActions.map(action => (
                                <code key={action} className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 text-xs font-mono border border-rose-500/20">
                                    {action}
                                </code>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    );
}
