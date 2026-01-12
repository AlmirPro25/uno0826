"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
    BookOpen, Loader2, RefreshCw, MessageSquare, Clock,
    AlertTriangle, CheckCircle2, Brain, Sparkles
} from "lucide-react";
import { api } from "@/lib/api";
import { AppHeader } from "@/components/dashboard/app-header";
import { useApp } from "@/contexts/app-context";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NarrativeEntry {
    id: string;
    type: "insight" | "warning" | "milestone" | "anomaly" | "summary";
    title: string;
    content: string;
    context?: Record<string, unknown>;
    importance: number;
    app_id?: string;
    created_at: string;
}

interface NarrativeSummary {
    period: string;
    highlights: string[];
    concerns: string[];
    metrics: {
        events_count: number;
        decisions_count: number;
        anomalies_count: number;
    };
}

export default function NarrativePage() {
    const { activeApp } = useApp();
    const [entries, setEntries] = useState<NarrativeEntry[]>([]);
    const [summary, setSummary] = useState<NarrativeSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const fetchNarrative = useCallback(async () => {
        setLoading(true);
        try {
            const params = activeApp?.id ? `?app_id=${activeApp.id}&limit=50` : "?limit=50";
            const [entriesRes, summaryRes] = await Promise.all([
                api.get(`/narrative/entries${params}`).catch(() => ({ data: { entries: [] } })),
                api.get(`/narrative/summary${params}`).catch(() => ({ data: null }))
            ]);
            setEntries(entriesRes.data.entries || []);
            setSummary(summaryRes.data);
        } catch (error) {
            console.error("Failed to fetch narrative", error);
            setEntries([]);
        } finally {
            setLoading(false);
        }
    }, [activeApp?.id]);

    useEffect(() => {
        fetchNarrative();
    }, [fetchNarrative]);

    const generateNarrative = async () => {
        setGenerating(true);
        try {
            const params = activeApp?.id ? `?app_id=${activeApp.id}` : "";
            await api.post(`/narrative/generate${params}`);
            await fetchNarrative();
        } catch (error) {
            console.error("Failed to generate narrative", error);
        } finally {
            setGenerating(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "insight": return <Brain className="w-4 h-4 text-indigo-400" />;
            case "warning": return <AlertTriangle className="w-4 h-4 text-amber-400" />;
            case "milestone": return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            case "anomaly": return <AlertTriangle className="w-4 h-4 text-rose-400" />;
            case "summary": return <BookOpen className="w-4 h-4 text-purple-400" />;
            default: return <MessageSquare className="w-4 h-4 text-slate-400" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "insight": return "bg-indigo-500/10 border-indigo-500/20";
            case "warning": return "bg-amber-500/10 border-amber-500/20";
            case "milestone": return "bg-emerald-500/10 border-emerald-500/20";
            case "anomaly": return "bg-rose-500/10 border-rose-500/20";
            case "summary": return "bg-purple-500/10 border-purple-500/20";
            default: return "bg-slate-500/10 border-slate-500/20";
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        
        if (diffHours < 1) return "Agora";
        if (diffHours < 24) return `${diffHours}h atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                        Narrativa do Sistema
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        {activeApp 
                            ? `História e insights de ${activeApp.name}`
                            : "O que está acontecendo no kernel"}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline"
                        onClick={generateNarrative}
                        disabled={generating}
                        className="h-11 px-4 rounded-xl border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                    >
                        {generating ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Gerar Narrativa
                    </Button>
                    <Button 
                        variant="outline"
                        onClick={fetchNarrative}
                        disabled={loading}
                        className="h-11 px-4 rounded-xl border-white/10 text-white hover:bg-white/5"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Summary Card */}
            {summary && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600/10 to-purple-600/5 border border-indigo-500/20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Resumo do Período</h3>
                            <p className="text-xs text-slate-500">{summary.period}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-white/5">
                            <p className="text-2xl font-black text-white">{summary.metrics.events_count}</p>
                            <p className="text-xs text-slate-500">Eventos</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                            <p className="text-2xl font-black text-white">{summary.metrics.decisions_count}</p>
                            <p className="text-xs text-slate-500">Decisões</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                            <p className="text-2xl font-black text-amber-400">{summary.metrics.anomalies_count}</p>
                            <p className="text-xs text-slate-500">Anomalias</p>
                        </div>
                    </div>

                    {summary.highlights.length > 0 && (
                        <div className="mb-3">
                            <p className="text-xs font-bold text-emerald-400 uppercase mb-2">Destaques</p>
                            <ul className="space-y-1">
                                {summary.highlights.map((h, i) => (
                                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                        {h}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {summary.concerns.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-amber-400 uppercase mb-2">Pontos de Atenção</p>
                            <ul className="space-y-1">
                                {summary.concerns.map((c, i) => (
                                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                        {c}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Narrative Entries */}
            {entries.length > 0 ? (
                <div className="space-y-3">
                    {entries.map((entry, i) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className={cn(
                                "p-5 rounded-2xl border transition-all",
                                getTypeColor(entry.type)
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                                    getTypeColor(entry.type)
                                )}>
                                    {getTypeIcon(entry.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-white">{entry.title}</h3>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-slate-400">
                                            {entry.type}
                                        </span>
                                        {entry.importance >= 8 && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400">
                                                IMPORTANTE
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-400 mb-2">{entry.content}</p>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(entry.created_at)}
                                        </span>
                                        <span>Importância: {entry.importance}/10</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                        Nenhuma narrativa ainda
                    </h3>
                    <p className="text-slate-500 mb-4">
                        Clique em &quot;Gerar Narrativa&quot; para criar insights sobre o sistema
                    </p>
                    <Button
                        onClick={generateNarrative}
                        disabled={generating}
                        className="bg-indigo-600 hover:bg-indigo-500"
                    >
                        {generating ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Gerar Primeira Narrativa
                    </Button>
                </div>
            )}
        </div>
    );
}
