"use client";

import { useState, useEffect } from "react";
import { 
    Brain, Search, Clock, CheckCircle2, XCircle, AlertTriangle,
    Loader2, RefreshCw, Info, Database, TrendingUp, History,
    Lightbulb, Target, Zap
} from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface MemoryEntry {
    id: string;
    decision_id: string;
    action_domain: string;
    action_type: string;
    outcome: "success" | "failure" | "blocked";
    context: Record<string, unknown>;
    learned_at: string;
    confidence: number;
    usage_count: number;
    last_used_at: string | null;
}

interface MemoryStats {
    total_entries: number;
    success_rate: number;
    most_common_domain: string;
    avg_confidence: number;
}

interface Pattern {
    domain: string;
    pattern: string;
    frequency: number;
    success_rate: number;
    recommendation: string;
}

export default function MemoryPage() {
    const { activeApp } = useApp();
    const [entries, setEntries] = useState<MemoryEntry[]>([]);
    const [stats, setStats] = useState<MemoryStats | null>(null);
    const [patterns, setPatterns] = useState<Pattern[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterDomain, setFilterDomain] = useState<string>("all");
    const [selectedEntry, setSelectedEntry] = useState<MemoryEntry | null>(null);

    const fetchMemory = async () => {
        setLoading(true);
        try {
            // Buscar entradas de memória
            const params = activeApp ? `?app_id=${activeApp.id}&limit=100` : "?limit=100";
            const res = await api.get(`/memory/entries${params}`);
            const data = res.data.entries || res.data || [];
            
            setEntries(data.map((e: Record<string, unknown>) => ({
                id: e.id,
                decision_id: e.decision_id,
                action_domain: e.action_domain || e.domain || "unknown",
                action_type: e.action_type || e.type,
                outcome: e.outcome || "success",
                context: e.context || {},
                learned_at: e.learned_at || e.created_at,
                confidence: e.confidence || 0.5,
                usage_count: e.usage_count || 0,
                last_used_at: e.last_used_at
            })));

            // Calcular stats
            const successCount = data.filter((e: Record<string, unknown>) => e.outcome === "success").length;
            const domains = data.map((e: Record<string, unknown>) => e.action_domain || e.domain);
            const domainCounts: Record<string, number> = {};
            domains.forEach((d: string) => { domainCounts[d] = (domainCounts[d] || 0) + 1; });
            const mostCommon = Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0];
            const avgConf = data.reduce((sum: number, e: Record<string, unknown>) => sum + ((e.confidence as number) || 0.5), 0) / (data.length || 1);

            setStats({
                total_entries: data.length,
                success_rate: data.length > 0 ? (successCount / data.length) * 100 : 0,
                most_common_domain: mostCommon?.[0] || "N/A",
                avg_confidence: avgConf * 100
            });

            // Gerar padrões (mock por enquanto)
            setPatterns([
                {
                    domain: "billing",
                    pattern: "Pagamentos falham mais às segundas",
                    frequency: 12,
                    success_rate: 65,
                    recommendation: "Considere retry automático para pagamentos às segundas"
                },
                {
                    domain: "notification",
                    pattern: "Notificações têm 98% de sucesso",
                    frequency: 45,
                    success_rate: 98,
                    recommendation: "Sistema de notificações está saudável"
                }
            ]);
        } catch (error) {
            console.error("Failed to fetch memory", error);
            setEntries([]);
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMemory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeApp?.id]);

    const filteredEntries = entries.filter(e => {
        const matchesSearch = !search || 
            e.action_domain.toLowerCase().includes(search.toLowerCase()) ||
            e.action_type.toLowerCase().includes(search.toLowerCase()) ||
            e.decision_id.toLowerCase().includes(search.toLowerCase());
        const matchesDomain = filterDomain === "all" || e.action_domain === filterDomain;
        return matchesSearch && matchesDomain;
    });

    const domains = [...new Set(entries.map(e => e.action_domain))];

    const formatRelativeTime = (timestamp: string | null) => {
        if (!timestamp) return "Nunca";
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

    const getOutcomeConfig = (outcome: string) => {
        switch (outcome) {
            case "success": return { label: "Sucesso", color: "emerald", icon: CheckCircle2 };
            case "failure": return { label: "Falha", color: "rose", icon: XCircle };
            case "blocked": return { label: "Bloqueado", color: "amber", icon: AlertTriangle };
            default: return { label: outcome, color: "slate", icon: Brain };
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
                        <Brain className="w-8 h-8 text-purple-400" />
                        Memória Institucional
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        LOOP 5 • O sistema aprende com suas decisões
                    </p>
                </div>
                <button
                    onClick={fetchMemory}
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
                        <p className="text-sm text-purple-300 font-medium">O que é a Memória Institucional?</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Cada decisão do sistema é registrada com seu contexto e resultado.
                            O kernel usa essa memória para melhorar decisões futuras, identificar padrões
                            e sugerir otimizações. É o LOOP 5 - Aprendizado.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Memórias", value: stats.total_entries, icon: Database, color: "purple" },
                        { label: "Taxa de Sucesso", value: `${stats.success_rate.toFixed(0)}%`, icon: TrendingUp, color: "emerald" },
                        { label: "Domínio Principal", value: stats.most_common_domain, icon: Target, color: "indigo" },
                        { label: "Confiança Média", value: `${stats.avg_confidence.toFixed(0)}%`, icon: Lightbulb, color: "amber" },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl"
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-xl", `bg-${stat.color}-500/20`)}>
                                    <stat.icon className={cn("w-4 h-4", `text-${stat.color}-400`)} />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">{stat.value}</p>
                                    <p className="text-xs text-slate-500">{stat.label}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Padrões Identificados */}
            {patterns.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-purple-600/10 to-indigo-600/5 border border-purple-500/20"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Lightbulb className="w-5 h-5 text-purple-400" />
                        <h3 className="font-bold text-white">Padrões Identificados</h3>
                    </div>
                    <div className="space-y-3">
                        {patterns.map((pattern, i) => (
                            <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/20 text-purple-400 uppercase">
                                                {pattern.domain}
                                            </span>
                                            <span className="text-xs text-slate-500">{pattern.frequency}x observado</span>
                                        </div>
                                        <p className="text-sm text-white font-medium">{pattern.pattern}</p>
                                        <p className="text-xs text-slate-400 mt-1">{pattern.recommendation}</p>
                                    </div>
                                    <div className={cn(
                                        "text-lg font-black",
                                        pattern.success_rate >= 80 ? "text-emerald-400" :
                                        pattern.success_rate >= 50 ? "text-amber-400" : "text-rose-400"
                                    )}>
                                        {pattern.success_rate}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar memórias..."
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

            {/* Memory Entries */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
            ) : filteredEntries.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Nenhuma memória ainda</h3>
                    <p className="text-slate-500">
                        O sistema começará a aprender quando regras forem executadas
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredEntries.map((entry, i) => {
                        const outcomeConfig = getOutcomeConfig(entry.outcome);
                        const OutcomeIcon = outcomeConfig.icon;
                        
                        return (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                onClick={() => setSelectedEntry(entry)}
                                className={cn(
                                    "p-5 rounded-2xl border transition-all cursor-pointer",
                                    "bg-white/[0.02] border-white/5 hover:border-white/10"
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        `bg-${outcomeConfig.color}-500/20`
                                    )}>
                                        <OutcomeIcon className={cn("w-5 h-5", `text-${outcomeConfig.color}-400`)} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/20 text-purple-400 uppercase">
                                                {entry.action_domain}
                                            </span>
                                            <span className={cn(
                                                "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                                                `bg-${outcomeConfig.color}-500/20 text-${outcomeConfig.color}-400`
                                            )}>
                                                {outcomeConfig.label}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                Confiança: {(entry.confidence * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-white">{entry.action_type}</p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Aprendido: {formatRelativeTime(entry.learned_at)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <History className="w-3 h-3" />
                                                Usado: {entry.usage_count}x
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Zap className="w-3 h-3" />
                                                Último uso: {formatRelativeTime(entry.last_used_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedEntry && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setSelectedEntry(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-2xl bg-[#0a0a0f] border border-white/10 rounded-3xl p-8 space-y-6 max-h-[80vh] overflow-auto"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                        <Brain className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white">{selectedEntry.action_type}</h2>
                                        <span className="text-sm text-slate-500">{selectedEntry.action_domain}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedEntry(null)} 
                                    className="text-slate-500 hover:text-white p-2 hover:bg-white/5 rounded-lg"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Decision ID</label>
                                    <p className="text-white mt-1 font-mono text-sm">{selectedEntry.decision_id}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Confiança</label>
                                    <p className="text-white mt-1 text-2xl font-black">{(selectedEntry.confidence * 100).toFixed(0)}%</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Vezes Usado</label>
                                    <p className="text-white mt-1 text-2xl font-black">{selectedEntry.usage_count}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Aprendido em</label>
                                    <p className="text-white mt-1">{new Date(selectedEntry.learned_at).toLocaleString('pt-BR')}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Contexto</label>
                                <pre className="mt-2 p-4 rounded-xl bg-black/30 text-sm font-mono text-slate-300 overflow-auto">
                                    {JSON.stringify(selectedEntry.context, null, 2)}
                                </pre>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
