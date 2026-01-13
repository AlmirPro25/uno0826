"use client";

import { useState, useEffect, useCallback } from "react";
import { 
    Brain, Lightbulb, Search, Loader2, RefreshCw, 
    ChevronRight, Zap, Shield, AlertTriangle, CheckCircle2,
    Clock, Target, GitBranch, Info
} from "lucide-react";
import { AppHeader } from "@/components/dashboard/app-header";
import { useApp } from "@/contexts/app-context";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Decision {
    id: string;
    decision_type: string;
    domain: string;
    input_summary: string;
    output: string;
    reasoning: string[];
    factors: DecisionFactor[];
    confidence: number;
    duration_ms: number;
    created_at: string;
    rule_id?: string;
    rule_name?: string;
}

interface DecisionFactor {
    name: string;
    value: string | number;
    weight: number;
    impact: "positive" | "negative" | "neutral";
}

export default function ExplainabilityPage() {
    const { activeApp } = useApp();
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
    const [filterDomain, setFilterDomain] = useState<string>("all");

    const fetchDecisions = useCallback(async () => {
        setLoading(true);
        try {
            const params = activeApp ? `?app_id=${activeApp.id}&limit=50` : "?limit=50";
            const res = await api.get(`/explainability/decisions${params}`);
            const data = res.data.decisions || res.data || [];
            setDecisions(data.map((d: Record<string, unknown>) => ({
                id: d.id || d.ID,
                decision_type: d.decision_type || d.type || "rule_evaluation",
                domain: d.domain || "rules",
                input_summary: d.input_summary || d.input || "N/A",
                output: d.output || d.result || "N/A",
                reasoning: d.reasoning || d.explanation || [],
                factors: d.factors || [],
                confidence: d.confidence || 0.95,
                duration_ms: d.duration_ms || d.latency_ms || 0,
                created_at: d.created_at || d.timestamp,
                rule_id: d.rule_id,
                rule_name: d.rule_name
            })));
        } catch {
            console.error("Failed to fetch decisions");
            setDecisions([]);
        } finally {
            setLoading(false);
        }
    }, [activeApp]);

    useEffect(() => {
        fetchDecisions();
    }, [fetchDecisions]);

    const filteredDecisions = decisions.filter(d => {
        const matchesSearch = !search || 
            d.input_summary.toLowerCase().includes(search.toLowerCase()) ||
            d.output.toLowerCase().includes(search.toLowerCase()) ||
            d.domain.toLowerCase().includes(search.toLowerCase());
        const matchesDomain = filterDomain === "all" || d.domain === filterDomain;
        return matchesSearch && matchesDomain;
    });

    const domains = [...new Set(decisions.map(d => d.domain))];

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

    const getOutputConfig = (output: string) => {
        const lower = output.toLowerCase();
        if (lower.includes("allow") || lower.includes("success") || lower.includes("approved")) {
            return { color: "emerald", icon: CheckCircle2 };
        }
        if (lower.includes("deny") || lower.includes("block") || lower.includes("rejected")) {
            return { color: "rose", icon: AlertTriangle };
        }
        if (lower.includes("risk") || lower.includes("warning")) {
            return { color: "amber", icon: Shield };
        }
        return { color: "indigo", icon: Zap };
    };

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case "positive": return "text-emerald-400";
            case "negative": return "text-rose-400";
            default: return "text-slate-400";
        }
    };

    // Stats
    const stats = {
        total: decisions.length,
        avgConfidence: decisions.length > 0 
            ? (decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length * 100).toFixed(0)
            : 0,
        avgLatency: decisions.length > 0
            ? (decisions.reduce((sum, d) => sum + d.duration_ms, 0) / decisions.length).toFixed(1)
            : 0,
    };

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
                        <Brain className="w-8 h-8 text-purple-400" />
                        Explicabilidade
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Entenda como o sistema toma decisões
                    </p>
                </div>
                <button
                    onClick={fetchDecisions}
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
                className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20"
            >
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-purple-300 font-medium">O que é Explicabilidade?</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Cada decisão do sistema é registrada com seu raciocínio completo.
                            Você pode ver exatamente quais fatores influenciaram cada resultado,
                            garantindo transparência e auditabilidade total.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Decisões", value: stats.total, color: "purple", icon: Brain },
                    { label: "Confiança Média", value: `${stats.avgConfidence}%`, color: "emerald", icon: Target },
                    { label: "Latência Média", value: `${stats.avgLatency}ms`, color: "cyan", icon: Clock },
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
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar decisões..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
                    />
                </div>
                <select
                    value={filterDomain}
                    onChange={(e) => setFilterDomain(e.target.value)}
                    className="h-12 px-4 rounded-xl bg-white/[0.02] border border-white/10 text-white focus:border-purple-500/50 outline-none"
                >
                    <option value="all">Todos Domínios</option>
                    {domains.map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
            </div>

            {/* Decisions List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
            ) : filteredDecisions.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Nenhuma decisão encontrada</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredDecisions.map((decision, i) => {
                        const outputConfig = getOutputConfig(decision.output);
                        const OutputIcon = outputConfig.icon;
                        
                        return (
                            <motion.div
                                key={decision.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className={cn(
                                    "p-5 rounded-2xl border cursor-pointer transition-all hover:border-purple-500/30",
                                    "bg-white/[0.02] border-white/5"
                                )}
                                onClick={() => setSelectedDecision(decision)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        `bg-${outputConfig.color}-500/20`
                                    )}>
                                        <OutputIcon className={cn("w-5 h-5", `text-${outputConfig.color}-400`)} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-white">{decision.input_summary}</span>
                                            <span className={cn(
                                                "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                                                `bg-${outputConfig.color}-500/20 text-${outputConfig.color}-400`
                                            )}>
                                                {decision.output}
                                            </span>
                                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-500/20 text-slate-400 uppercase">
                                                {decision.domain}
                                            </span>
                                        </div>
                                        
                                        {decision.reasoning.length > 0 && (
                                            <p className="text-sm text-slate-400 mb-2 line-clamp-1">
                                                {decision.reasoning[0]}
                                            </p>
                                        )}
                                        
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Target className="w-3 h-3" />
                                                {(decision.confidence * 100).toFixed(0)}% confiança
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {decision.duration_ms}ms
                                            </span>
                                            <span>{formatRelativeTime(decision.created_at)}</span>
                                            {decision.rule_name && (
                                                <span className="flex items-center gap-1">
                                                    <GitBranch className="w-3 h-3" />
                                                    {decision.rule_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <ChevronRight className="w-5 h-5 text-slate-500" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Decision Detail Modal */}
            <AnimatePresence>
                {selectedDecision && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setSelectedDecision(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-2xl bg-[#0a0a0f] border border-white/10 rounded-3xl p-8 space-y-6 max-h-[80vh] overflow-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center",
                                    `bg-${getOutputConfig(selectedDecision.output).color}-500/20`
                                )}>
                                    <Brain className={cn("w-6 h-6", `text-${getOutputConfig(selectedDecision.output).color}-400`)} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white">{selectedDecision.input_summary}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={cn(
                                            "px-2 py-0.5 text-xs font-bold rounded",
                                            `bg-${getOutputConfig(selectedDecision.output).color}-500/20 text-${getOutputConfig(selectedDecision.output).color}-400`
                                        )}>
                                            {selectedDecision.output}
                                        </span>
                                        <span className="text-xs text-slate-500">{selectedDecision.domain}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Reasoning */}
                            {selectedDecision.reasoning.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                        <Lightbulb className="w-4 h-4" /> Raciocínio
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedDecision.reasoning.map((reason, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                                <span className="text-purple-400 font-bold">{i + 1}.</span>
                                                <span className="text-slate-300">{reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Factors */}
                            {selectedDecision.factors.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                        <Target className="w-4 h-4" /> Fatores
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedDecision.factors.map((factor, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <code className="text-sm text-slate-400 font-mono">{factor.name}</code>
                                                    <span className={cn("text-sm font-bold", getImpactColor(factor.impact))}>
                                                        {String(factor.value)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-500">peso: {(factor.weight * 100).toFixed(0)}%</span>
                                                    <span className={cn(
                                                        "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                                                        factor.impact === "positive" ? "bg-emerald-500/20 text-emerald-400" :
                                                        factor.impact === "negative" ? "bg-rose-500/20 text-rose-400" :
                                                        "bg-slate-500/20 text-slate-400"
                                                    )}>
                                                        {factor.impact}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                                <div className="text-center">
                                    <p className="text-2xl font-black text-purple-400">
                                        {(selectedDecision.confidence * 100).toFixed(0)}%
                                    </p>
                                    <p className="text-xs text-slate-500">Confiança</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-cyan-400">
                                        {selectedDecision.duration_ms}ms
                                    </p>
                                    <p className="text-xs text-slate-500">Latência</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-white">
                                        {selectedDecision.factors.length}
                                    </p>
                                    <p className="text-xs text-slate-500">Fatores</p>
                                </div>
                            </div>

                            <button 
                                onClick={() => setSelectedDecision(null)} 
                                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                            >
                                Fechar
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
