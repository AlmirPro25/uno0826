"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
    Shield, AlertTriangle, CheckCircle2, Loader2, 
    TrendingUp, TrendingDown, RefreshCw, Info
} from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";

interface App {
    id: string;
    name: string;
    slug: string;
}

interface RiskScore {
    app_id: string;
    app_name: string;
    overall_score: number;
    risk_level: "low" | "medium" | "high" | "critical";
    factors: RiskFactor[];
    last_calculated: string;
    trend: "up" | "down" | "stable";
    trend_change: number;
}

interface RiskFactor {
    name: string;
    score: number;
    weight: number;
    description: string;
}

export default function RiskPage() {
    const { activeApp, hasApp } = useApp();
    const [apps, setApps] = useState<App[]>([]);
    const [riskScores, setRiskScores] = useState<RiskScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState<string | null>(null);

    const fetchApps = async () => {
        try {
            const res = await api.get("/apps/mine");
            setApps(res.data.apps || []);
            return res.data.apps || [];
        } catch (error) {
            console.error("Failed to fetch apps", error);
            return [];
        }
    };

    const fetchRiskScores = async (appList: App[]) => {
        const scores: RiskScore[] = [];
        
        for (const app of appList) {
            try {
                // API: GET /api/v1/risk/apps/:id
                const res = await api.get(`/risk/apps/${app.id}`);
                const data = res.data;
                scores.push({
                    app_id: app.id,
                    app_name: app.name,
                    overall_score: data.overall_score || data.score || 0,
                    risk_level: data.risk_level || data.level || "low",
                    factors: data.factors || [],
                    last_calculated: data.calculated_at || data.last_calculated || new Date().toISOString(),
                    trend: data.trend || "stable",
                    trend_change: data.trend_change || 0
                });
            } catch {
                // App pode não ter score de risco ainda
                scores.push({
                    app_id: app.id,
                    app_name: app.name,
                    overall_score: 0,
                    risk_level: "low",
                    factors: [],
                    last_calculated: new Date().toISOString(),
                    trend: "stable",
                    trend_change: 0
                });
            }
        }
        
        setRiskScores(scores);
        setLoading(false);
    };

    useEffect(() => {
        const init = async () => {
            const appList = await fetchApps();
            if (appList.length > 0) {
                await fetchRiskScores(appList);
            } else {
                setLoading(false);
            }
        };
        init();
    }, []);

    const calculateRisk = async (appId: string) => {
        setCalculating(appId);
        try {
            await api.post(`/risk/apps/${appId}/calculate`);
            await fetchRiskScores(apps);
        } catch (error) {
            console.error("Failed to calculate risk", error);
        } finally {
            setCalculating(null);
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case "low": return "text-emerald-400";
            case "medium": return "text-amber-400";
            case "high": return "text-orange-400";
            case "critical": return "text-rose-400";
            default: return "text-slate-400";
        }
    };

    const getRiskBg = (level: string) => {
        switch (level) {
            case "low": return "bg-emerald-500/20";
            case "medium": return "bg-amber-500/20";
            case "high": return "bg-orange-500/20";
            case "critical": return "bg-rose-500/20";
            default: return "bg-slate-500/20";
        }
    };

    const getRiskIcon = (level: string) => {
        switch (level) {
            case "low": return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
            case "medium": return <Info className="w-5 h-5 text-amber-400" />;
            case "high": return <AlertTriangle className="w-5 h-5 text-orange-400" />;
            case "critical": return <AlertTriangle className="w-5 h-5 text-rose-400" />;
            default: return <Shield className="w-5 h-5 text-slate-400" />;
        }
    };

    return (
        <div className="space-y-6 pb-12">
            {/* App Context Header */}
            <AppHeader />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                        Risk Scoring {activeApp ? `de ${activeApp.name}` : ""}
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Análise de risco por aplicação
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : apps.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <Shield className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                        {hasApp && activeApp 
                            ? `${activeApp.name} ainda não tem análise de risco` 
                            : "Nenhum app para analisar"}
                    </h3>
                    <p className="text-slate-500 mb-6">Crie um app para ver a análise de risco</p>
                    <Link href="/dashboard/apps">
                        <Button className="bg-indigo-600 hover:bg-indigo-500">Criar App</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {riskScores.map((risk, i) => (
                        <motion.div
                            key={risk.app_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 rounded-2xl bg-white/[0.02] border border-white/5"
                        >
                            {/* App Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center",
                                        getRiskBg(risk.risk_level)
                                    )}>
                                        {getRiskIcon(risk.risk_level)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{risk.app_name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-xs font-bold uppercase",
                                                getRiskBg(risk.risk_level),
                                                getRiskColor(risk.risk_level)
                                            )}>
                                                {risk.risk_level}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                Última análise: {new Date(risk.last_calculated).toLocaleString('pt-BR')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-4xl font-black text-white">{risk.overall_score}</p>
                                        <div className={cn(
                                            "flex items-center gap-1 text-xs font-bold",
                                            risk.trend === "down" ? "text-emerald-400" : 
                                            risk.trend === "up" ? "text-rose-400" : "text-slate-400"
                                        )}>
                                            {risk.trend === "down" ? <TrendingDown className="w-3 h-3" /> :
                                             risk.trend === "up" ? <TrendingUp className="w-3 h-3" /> : null}
                                            {risk.trend_change > 0 ? "+" : ""}{risk.trend_change}%
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => calculateRisk(risk.app_id)}
                                        disabled={calculating === risk.app_id}
                                        className="h-10 px-4 rounded-xl border-white/10 text-white hover:bg-white/5"
                                    >
                                        <RefreshCw className={cn("w-4 h-4", calculating === risk.app_id && "animate-spin")} />
                                    </Button>
                                </div>
                            </div>

                            {/* Risk Factors */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {risk.factors.map((factor) => (
                                    <div 
                                        key={factor.name}
                                        className="p-4 rounded-xl bg-white/[0.02] border border-white/5"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase">{factor.name}</span>
                                            <span className={cn(
                                                "text-lg font-black",
                                                factor.score < 30 ? "text-emerald-400" :
                                                factor.score < 60 ? "text-amber-400" :
                                                factor.score < 80 ? "text-orange-400" : "text-rose-400"
                                            )}>
                                                {factor.score}
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className={cn(
                                                    "h-full rounded-full",
                                                    factor.score < 30 ? "bg-emerald-500" :
                                                    factor.score < 60 ? "bg-amber-500" :
                                                    factor.score < 80 ? "bg-orange-500" : "bg-rose-500"
                                                )}
                                                style={{ width: `${factor.score}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-600 mt-2">{factor.description}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
