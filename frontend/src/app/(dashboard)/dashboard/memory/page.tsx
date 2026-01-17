"use client";

import { useState, useEffect } from "react";
import {
    Brain, Search, Clock, CheckCircle2, XCircle, AlertTriangle,
    Loader2, RefreshCw, Info, Database, TrendingUp, History,
    Lightbulb, Target, Zap, X
} from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button"; // Added Button import
import { Tooltip } from "@/components/ui/tooltip"; // Added Tooltip import

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

export default function MemoryPage() {
    const { activeApp } = useApp();
    const [entries, setEntries] = useState<MemoryEntry[]>([]);
    const [stats, setStats] = useState<MemoryStats | null>(null);
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

            const parsedEntries = data.map((e: Record<string, unknown>) => ({
                id: e.id,
                decision_id: e.decision_id || "unknown",
                action_domain: e.action_domain || e.domain || "generic",
                action_type: e.action_type || e.type || "unknown_action",
                outcome: e.outcome || "success",
                context: e.context || {},
                learned_at: e.learned_at || e.created_at || new Date().toISOString(),
                confidence: typeof e.confidence === 'number' ? e.confidence : 0.5,
                usage_count: typeof e.usage_count === 'number' ? e.usage_count : 0,
                last_used_at: e.last_used_at
            }));

            setEntries(parsedEntries);

            // Calcular stats básicas (seguro fazer no client para datasets < 1000 items)
            if (parsedEntries.length > 0) {
                const successCount = parsedEntries.filter((e: MemoryEntry) => e.outcome === "success").length;
                const domains = parsedEntries.map((e: MemoryEntry) => e.action_domain);

                // Encontrar domínio mais comum de forma segura
                const domainCounts: Record<string, number> = {};
                domains.forEach((d: string) => { domainCounts[d] = (domainCounts[d] || 0) + 1; });

                let mostCommon = "N/A";
                let maxCount = 0;
                Object.entries(domainCounts).forEach(([dom, count]) => {
                    if (count > maxCount) {
                        maxCount = count;
                        mostCommon = dom;
                    }
                });

                const avgConf = parsedEntries.reduce((sum: number, e: MemoryEntry) => sum + e.confidence, 0) / parsedEntries.length;

                setStats({
                    total_entries: parsedEntries.length,
                    success_rate: (successCount / parsedEntries.length) * 100,
                    most_common_domain: mostCommon,
                    avg_confidence: avgConf * 100
                });
            } else {
                setStats(null);
            }

        } catch (error) {
            console.error("Failed to fetch memory", error);
            toast.error("Erro ao sincronizar memórias do Kernel.");
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

    const domains = Array.from(new Set(entries.map(e => e.action_domain))).sort();

    const formatRelativeTime = (timestamp: string | null) => {
        if (!timestamp) return "Nunca";
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMin = Math.floor(diffMs / 60000);
            const diffHour = Math.floor(diffMin / 60);
            const diffDay = Math.floor(diffHour / 24);

            if (diffMin < 1) return "Agora mesmo";
            if (diffMin < 60) return `${diffMin}min atrás`;
            if (diffHour < 24) return `${diffHour}h atrás`;
            if (diffDay < 7) return `${diffDay}d atrás`;
            return date.toLocaleDateString('pt-BR');
        } catch {
            return "Data inválida";
        }
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
                        <Tooltip content="Base de conhecimento evolutivo do Kernel" side="right">
                            <Info className="w-4 h-4 text-slate-600 cursor-help" />
                        </Tooltip>
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Registro de aprendizado e adaptação do Kernel.
                    </p>
                </div>
                <Tooltip content="Recarregar registros de memória do servidor" side="left">
                    <Button
                        onClick={fetchMemory}
                        disabled={loading}
                        variant="outline"
                        className="flex items-center gap-2 border-white/10 hover:bg-white/5"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                        Atualizar
                    </Button>
                </Tooltip>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Memórias", value: stats.total_entries, icon: Database, color: "purple", tooltip: "Total de entradas de aprendizado registradas" },
                        { label: "Taxa de Sucesso", value: `${stats.success_rate.toFixed(0)}%`, icon: TrendingUp, color: "emerald", tooltip: "Porcentagem de decisões com desfecho positivo" },
                        { label: "Domínio Frequente", value: stats.most_common_domain, icon: Target, color: "indigo", tooltip: "Área de negócio com mais atividade registrada" },
                        { label: "Confiança Média", value: `${stats.avg_confidence.toFixed(0)}%`, icon: Lightbulb, color: "amber", tooltip: "Certeza média do modelo nas decisões tomadas" },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Tooltip content={stat.tooltip} side="top">
                                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl cursor-help hover:bg-white/[0.04] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-xl", `bg-${stat.color}-500/20`)}>
                                            <stat.icon className={cn("w-4 h-4", `text-${stat.color}-400`)} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-white">{stat.value}</p>
                                            <p className="text-xs text-slate-500">{stat.label}</p>
                                        </div>
                                    </div>
                                </div>
                            </Tooltip>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-3 bg-white/[0.02] p-1 rounded-xl border border-white/5 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Tooltip content="Buscar por ID, Tipo ou Domínio" side="top">
                        <input
                            type="text"
                            placeholder="Buscar na memória..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-transparent border-none text-white placeholder:text-slate-600 focus:outline-none text-sm font-medium"
                        />
                    </Tooltip>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <Tooltip content="Filtrar por Domínio de Conhecimento" side="top">
                    <select
                        value={filterDomain}
                        onChange={(e) => setFilterDomain(e.target.value)}
                        className="bg-transparent border-none text-slate-400 text-sm focus:text-white outline-none cursor-pointer pr-4 hover:text-white transition-colors"
                    >
                        <option value="all">Todos Domínios</option>
                        {domains.map(d => (
                            <option key={d} value={d} className="bg-black text-white">{d}</option>
                        ))}
                    </select>
                </Tooltip>
            </div>

            {/* Memory Entries */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500/50" />
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Acessando córtex...</p>
                </div>
            ) : filteredEntries.length === 0 ? (
                <div className="text-center py-24 bg-white/[0.02] border border-white/5 rounded-[32px]">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Brain className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Memória Vazia</h3>
                    <p className="text-slate-500 max-w-sm mx-auto text-sm">
                        O sistema ainda não registrou eventos de aprendizado correspondentes aos filtros atuais.
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
                                className="group"
                            >
                                <Tooltip content="Clique para ver detalhes do aprendizado" side="top">
                                    <div className={cn(
                                        "p-5 rounded-2xl border transition-all cursor-pointer",
                                        "bg-white/[0.02] border-white/5 hover:border-purple-500/20 hover:bg-white/[0.04]"
                                    )}>
                                        <div className="flex items-start gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                `bg-${outcomeConfig.color}-500/10 group-hover:bg-${outcomeConfig.color}-500/20`
                                            )}>
                                                <OutcomeIcon className={cn("w-5 h-5", `text-${outcomeConfig.color}-500`)} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/10 text-purple-400 uppercase border border-purple-500/20">
                                                        {entry.action_domain}
                                                    </span>
                                                    <span className={cn(
                                                        "px-2 py-0.5 text-[10px] font-bold rounded uppercase border",
                                                        `bg-${outcomeConfig.color}-500/10 text-${outcomeConfig.color}-500 border-${outcomeConfig.color}-500/20`
                                                    )}>
                                                        {outcomeConfig.label}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-mono ml-auto">
                                                        CONF: {(entry.confidence * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">{entry.action_type}</p>
                                                <div className="flex items-center gap-4 text-[10px] font-medium text-slate-500 mt-2 uppercase tracking-wide">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatRelativeTime(entry.learned_at)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <History className="w-3 h-3" />
                                                        {entry.usage_count} usos
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Tooltip>
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
                            className="relative w-full max-w-2xl bg-[#0a0a0f] border border-white/10 rounded-3xl p-8 space-y-6 max-h-[80vh] overflow-auto shadow-2xl"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                        <Brain className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white tracking-tight">{selectedEntry.action_type}</h2>
                                        <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">{selectedEntry.action_domain}</span>
                                    </div>
                                </div>
                                <Tooltip content="Fechar detalhes" side="left">
                                    <button
                                        onClick={() => setSelectedEntry(null)}
                                        className="text-slate-500 hover:text-white p-2 hover:bg-white/5 rounded-full transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </Tooltip>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Tooltip content="Identificador único da decisão que gerou esta memória">
                                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 cursor-help">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Decision ID</label>
                                        <p className="text-white mt-2 font-mono text-xs break-all">{selectedEntry.decision_id}</p>
                                    </div>
                                </Tooltip>
                                <Tooltip content="Nível de certeza atribuído pelo modelo">
                                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 cursor-help">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Score de Confiança</label>
                                        <div className="mt-2 flex items-end gap-2">
                                            <span className="text-3xl font-black text-white">{(selectedEntry.confidence * 100).toFixed(0)}</span>
                                            <span className="text-sm font-bold text-slate-500 mb-1">/ 100</span>
                                        </div>
                                    </div>
                                </Tooltip>
                                <Tooltip content="Quantas vezes este padrão já foi reutilizado">
                                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 cursor-help">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Frequência de Uso</label>
                                        <p className="text-white mt-2 text-2xl font-black">{selectedEntry.usage_count}x</p>
                                    </div>
                                </Tooltip>
                                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data de Aprendizado</label>
                                    <p className="text-white mt-2 font-medium">{new Date(selectedEntry.learned_at).toLocaleString('pt-BR')}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contexto da Decisão</label>
                                <div className="mt-3 p-4 rounded-2xl bg-black/40 border border-white/5 overflow-hidden">
                                    <pre className="text-xs font-mono text-slate-300 overflow-auto whitespace-pre-wrap max-h-60 custom-scrollbar">
                                        {JSON.stringify(selectedEntry.context, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
