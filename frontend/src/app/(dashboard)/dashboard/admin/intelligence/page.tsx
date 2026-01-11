"use client";

import { useState, useEffect } from "react";
import { 
    Brain, AlertTriangle, Activity, Loader2, RefreshCw,
    Target, ArrowUp, ArrowDown, Minus
} from "lucide-react";
import { AppHeader } from "@/components/dashboard/app-header";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TensionPoint {
    domain: string;
    metric: string;
    current_value: number;
    threshold: number;
    trend: "up" | "down" | "stable";
    severity: "low" | "medium" | "high" | "critical";
    recommendation: string;
}

interface SystemInsight {
    type: string;
    title: string;
    description: string;
    impact: "positive" | "negative" | "neutral";
    data: Record<string, unknown>;
}

interface IntelligenceData {
    tension_points: TensionPoint[];
    insights: SystemInsight[];
    health_score: number;
    last_analysis: string;
}

export default function IntelligencePage() {
    const [data, setData] = useState<IntelligenceData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchIntelligence = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/intelligence/analysis");
            setData(res.data);
        } catch (error) {
            console.error("Failed to fetch intelligence", error);
            // Mock data for demo
            setData({
                tension_points: [
                    {
                        domain: "billing",
                        metric: "failed_payments_rate",
                        current_value: 12.5,
                        threshold: 10,
                        trend: "up",
                        severity: "medium",
                        recommendation: "Investigar gateway de pagamento"
                    },
                    {
                        domain: "rules",
                        metric: "execution_latency_p99",
                        current_value: 850,
                        threshold: 500,
                        trend: "up",
                        severity: "high",
                        recommendation: "Otimizar regras complexas"
                    }
                ],
                insights: [
                    {
                        type: "pattern",
                        title: "Pico de atividade às 14h",
                        description: "Sistema recebe 3x mais eventos entre 14h-16h",
                        impact: "neutral",
                        data: { peak_hour: 14, multiplier: 3 }
                    },
                    {
                        type: "anomaly",
                        title: "Queda em aprovações automáticas",
                        description: "Taxa de auto-approval caiu 15% esta semana",
                        impact: "negative",
                        data: { drop_percent: 15 }
                    }
                ],
                health_score: 78,
                last_analysis: new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIntelligence();
    }, []);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "critical": return "rose";
            case "high": return "orange";
            case "medium": return "amber";
            default: return "slate";
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case "up": return ArrowUp;
            case "down": return ArrowDown;
            default: return Minus;
        }
    };

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case "positive": return "emerald";
            case "negative": return "rose";
            default: return "slate";
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
                        <Brain className="w-8 h-8 text-indigo-400" />
                        Admin Intelligence
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Fase 18 • Onde o sistema está sob tensão
                    </p>
                </div>
                <button
                    onClick={fetchIntelligence}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors"
                >
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    Analisar
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : data && (
                <>
                    {/* Health Score */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border border-indigo-500/20"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-indigo-300 font-medium">Health Score do Sistema</p>
                                <p className="text-5xl font-black text-white mt-2">{data.health_score}%</p>
                                <p className="text-xs text-slate-500 mt-2">
                                    Última análise: {new Date(data.last_analysis).toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <div className={cn(
                                "w-24 h-24 rounded-full flex items-center justify-center",
                                data.health_score >= 80 ? "bg-emerald-500/20" :
                                data.health_score >= 60 ? "bg-amber-500/20" : "bg-rose-500/20"
                            )}>
                                <Activity className={cn(
                                    "w-12 h-12",
                                    data.health_score >= 80 ? "text-emerald-400" :
                                    data.health_score >= 60 ? "text-amber-400" : "text-rose-400"
                                )} />
                            </div>
                        </div>
                    </motion.div>

                    {/* Tension Points */}
                    <div>
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                            Pontos de Tensão
                        </h2>
                        <div className="space-y-3">
                            {data.tension_points.map((point, i) => {
                                const color = getSeverityColor(point.severity);
                                const TrendIcon = getTrendIcon(point.trend);
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className={cn(
                                            "p-5 rounded-2xl border",
                                            `bg-${color}-500/5 border-${color}-500/20`
                                        )}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={cn(
                                                        "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                                                        `bg-${color}-500/20 text-${color}-400`
                                                    )}>
                                                        {point.severity}
                                                    </span>
                                                    <span className="text-xs text-slate-500">{point.domain}</span>
                                                </div>
                                                <p className="text-white font-bold">{point.metric}</p>
                                                <p className="text-sm text-slate-400 mt-1">{point.recommendation}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-2xl font-black text-white">{point.current_value}</span>
                                                    <TrendIcon className={cn(
                                                        "w-4 h-4",
                                                        point.trend === "up" ? "text-rose-400" :
                                                        point.trend === "down" ? "text-emerald-400" : "text-slate-400"
                                                    )} />
                                                </div>
                                                <p className="text-xs text-slate-500">threshold: {point.threshold}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Insights */}
                    <div>
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-purple-400" />
                            Insights
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {data.insights.map((insight, i) => {
                                const color = getImpactColor(insight.impact);
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="p-5 rounded-2xl bg-white/[0.02] border border-white/5"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/20 text-purple-400 uppercase">
                                                {insight.type}
                                            </span>
                                            <span className={cn(
                                                "w-2 h-2 rounded-full",
                                                `bg-${color}-400`
                                            )} />
                                        </div>
                                        <p className="text-white font-bold">{insight.title}</p>
                                        <p className="text-sm text-slate-400 mt-1">{insight.description}</p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
