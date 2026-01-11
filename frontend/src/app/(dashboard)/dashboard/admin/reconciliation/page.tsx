"use client";

import { useState, useEffect } from "react";
import { 
    Scale, CheckCircle2, XCircle, Loader2, RefreshCw,
    DollarSign, ArrowLeftRight, Clock, FileText
} from "lucide-react";
import { AppHeader } from "@/components/dashboard/app-header";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ReconciliationResult {
    id: string;
    app_id: string;
    app_name: string;
    period_start: string;
    period_end: string;
    status: "matched" | "mismatch" | "pending";
    internal_total: number;
    stripe_total: number;
    difference: number;
    difference_percent: number;
    transactions_checked: number;
    mismatches_found: number;
    created_at: string;
}

interface ReconciliationStats {
    total_reconciliations: number;
    matched_count: number;
    mismatch_count: number;
    pending_count: number;
    total_difference: number;
}

export default function ReconciliationPage() {
    const [results, setResults] = useState<ReconciliationResult[]>([]);
    const [stats, setStats] = useState<ReconciliationStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);

    const fetchReconciliation = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/financial/reconciliation/history");
            setResults(res.data.results || []);
            setStats(res.data.stats);
        } catch (error) {
            console.error("Failed to fetch reconciliation", error);
            // Mock data
            setResults([
                {
                    id: "rec-1",
                    app_id: "app-1",
                    app_name: "App Demo",
                    period_start: "2026-01-01",
                    period_end: "2026-01-10",
                    status: "matched",
                    internal_total: 15000.00,
                    stripe_total: 15000.00,
                    difference: 0,
                    difference_percent: 0,
                    transactions_checked: 45,
                    mismatches_found: 0,
                    created_at: new Date().toISOString()
                },
                {
                    id: "rec-2",
                    app_id: "app-2",
                    app_name: "App Prod",
                    period_start: "2026-01-01",
                    period_end: "2026-01-10",
                    status: "mismatch",
                    internal_total: 8500.00,
                    stripe_total: 8475.50,
                    difference: 24.50,
                    difference_percent: 0.29,
                    transactions_checked: 32,
                    mismatches_found: 2,
                    created_at: new Date().toISOString()
                }
            ]);
            setStats({
                total_reconciliations: 2,
                matched_count: 1,
                mismatch_count: 1,
                pending_count: 0,
                total_difference: 24.50
            });
        } finally {
            setLoading(false);
        }
    };

    const runReconciliation = async () => {
        setRunning(true);
        try {
            await api.post("/admin/financial/reconciliation/run");
            await fetchReconciliation();
        } catch (error) {
            console.error("Failed to run reconciliation", error);
        } finally {
            setRunning(false);
        }
    };

    useEffect(() => {
        fetchReconciliation();
    }, []);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "matched": return { label: "Bateu", color: "emerald", icon: CheckCircle2 };
            case "mismatch": return { label: "Divergência", color: "rose", icon: XCircle };
            default: return { label: "Pendente", color: "amber", icon: Clock };
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
                        <Scale className="w-8 h-8 text-emerald-400" />
                        Reconciliação Financeira
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Fase 27.1 • Seu ledger bate com a Stripe?
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchReconciliation}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </button>
                    <button
                        onClick={runReconciliation}
                        disabled={running}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
                        Executar Reconciliação
                    </button>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: "Total", value: stats.total_reconciliations, icon: FileText, color: "slate" },
                        { label: "Bateram", value: stats.matched_count, icon: CheckCircle2, color: "emerald" },
                        { label: "Divergências", value: stats.mismatch_count, icon: XCircle, color: "rose" },
                        { label: "Pendentes", value: stats.pending_count, icon: Clock, color: "amber" },
                        { label: "Diferença Total", value: formatCurrency(stats.total_difference), icon: DollarSign, color: "rose" },
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
                                    <p className="text-xl font-black text-white">{stat.value}</p>
                                    <p className="text-xs text-slate-500">{stat.label}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Results */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            ) : results.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <Scale className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Nenhuma reconciliação</h3>
                    <p className="text-slate-500">Execute uma reconciliação para verificar seus dados</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {results.map((result, i) => {
                        const statusConfig = getStatusConfig(result.status);
                        const StatusIcon = statusConfig.icon;
                        return (
                            <motion.div
                                key={result.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={cn(
                                    "p-5 rounded-2xl border",
                                    `bg-${statusConfig.color}-500/5 border-${statusConfig.color}-500/20`
                                )}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            `bg-${statusConfig.color}-500/20`
                                        )}>
                                            <StatusIcon className={cn("w-5 h-5", `text-${statusConfig.color}-400`)} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-white font-bold">{result.app_name}</span>
                                                <span className={cn(
                                                    "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                                                    `bg-${statusConfig.color}-500/20 text-${statusConfig.color}-400`
                                                )}>
                                                    {statusConfig.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                {result.period_start} → {result.period_end} • {result.transactions_checked} transações
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-slate-500 text-xs">Interno</p>
                                                <p className="text-white font-bold">{formatCurrency(result.internal_total)}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-xs">Stripe</p>
                                                <p className="text-white font-bold">{formatCurrency(result.stripe_total)}</p>
                                            </div>
                                        </div>
                                        {result.difference !== 0 && (
                                            <p className="text-rose-400 text-sm font-bold mt-2">
                                                Δ {formatCurrency(result.difference)} ({result.difference_percent.toFixed(2)}%)
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
