"use client";

import { useEffect, useState, useCallback } from "react";
import { 
    CreditCard, TrendingUp, 
    Loader2, RefreshCw, CheckCircle2, XCircle, Clock,
    ArrowUpRight, ArrowDownRight, Receipt, Wallet
} from "lucide-react";
import { api } from "@/lib/api";
import { AppHeader } from "@/components/dashboard/app-header";
import { useApp } from "@/contexts/app-context";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Payment {
    id: string;
    user_id: string;
    amount: number;
    currency: string;
    description: string;
    status: string;
    created_at: string;
    completed_at: string | null;
}

interface PaymentStats {
    total_revenue: number;
    total_refunds: number;
    net_revenue: number;
    payments_count: number;
    success_rate: number;
}

export default function PaymentsPage() {
    const { activeApp } = useApp();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [stats, setStats] = useState<PaymentStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    const fetchPayments = useCallback(async () => {
        if (!activeApp?.id) {
            setLoading(false);
            return;
        }
        try {
            // Buscar pagamentos do app
            const [paymentsRes] = await Promise.all([
                api.get(`/billing/app/${activeApp.id}/transactions?limit=50`)
            ]);
            
            const txs = paymentsRes.data.transactions || [];
            setPayments(txs.map((tx: Record<string, unknown>) => ({
                id: tx.id,
                user_id: tx.user_id || tx.customer_id,
                amount: tx.amount || 0,
                currency: tx.currency || "BRL",
                description: tx.description || tx.type,
                status: tx.status || "completed",
                created_at: tx.created_at,
                completed_at: tx.completed_at
            })));

            // Calcular stats
            const completed = txs.filter((t: Record<string, unknown>) => t.status === "completed" || t.type === "payment");
            const refunds = txs.filter((t: Record<string, unknown>) => t.type === "refund");
            const totalRevenue = completed.reduce((sum: number, t: Record<string, unknown>) => sum + ((t.amount as number) || 0), 0);
            const totalRefunds = refunds.reduce((sum: number, t: Record<string, unknown>) => sum + ((t.amount as number) || 0), 0);

            setStats({
                total_revenue: totalRevenue,
                total_refunds: totalRefunds,
                net_revenue: totalRevenue - totalRefunds,
                payments_count: completed.length,
                success_rate: txs.length > 0 ? (completed.length / txs.length) * 100 : 100
            });
        } catch (error) {
            console.error("Failed to fetch payments", error);
            setPayments([]);
            setStats(null);
        } finally {
            setLoading(false);
        }
    }, [activeApp?.id]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const formatCurrency = (cents: number) => {
        return `R$ ${(cents / 100).toFixed(2)}`;
    };

    const formatRelativeTime = (timestamp: string) => {
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "bg-emerald-500/20 text-emerald-400";
            case "pending": return "bg-amber-500/20 text-amber-400";
            case "failed": return "bg-red-500/20 text-red-400";
            case "refunded": return "bg-violet-500/20 text-violet-400";
            default: return "bg-slate-500/20 text-slate-400";
        }
    };

    const filteredPayments = payments.filter(p => {
        if (filter === "all") return true;
        return p.status === filter;
    });

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-emerald-400" />
                        Pagamentos
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        {activeApp ? `Transações de ${activeApp.name}` : "Selecione um app"}
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={fetchPayments}
                    disabled={loading}
                    className="h-11 px-4 rounded-xl border-white/10"
                >
                    <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                    Atualizar
                </Button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-400 uppercase">Receita Total</span>
                            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-2xl font-black text-emerald-400 mt-2">
                            {formatCurrency(stats.total_revenue)}
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-red-400 uppercase">Reembolsos</span>
                            <ArrowDownRight className="w-4 h-4 text-red-500" />
                        </div>
                        <p className="text-2xl font-black text-red-400 mt-2">
                            {formatCurrency(stats.total_refunds)}
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-400 uppercase">Receita Líquida</span>
                            <Wallet className="w-4 h-4 text-indigo-500" />
                        </div>
                        <p className="text-2xl font-black text-indigo-400 mt-2">
                            {formatCurrency(stats.net_revenue)}
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-400 uppercase">Taxa Sucesso</span>
                            <TrendingUp className="w-4 h-4 text-amber-500" />
                        </div>
                        <p className="text-2xl font-black text-amber-400 mt-2">
                            {stats.success_rate.toFixed(1)}%
                        </p>
                    </motion.div>
                </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-2">
                {["all", "completed", "pending", "failed", "refunded"].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors",
                            filter === status
                                ? "bg-white/10 text-white"
                                : "text-slate-500 hover:text-white hover:bg-white/5"
                        )}
                    >
                        {status === "all" ? "Todos" : status}
                    </button>
                ))}
            </div>

            {/* Payments List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            ) : !activeApp ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Selecione um App</h3>
                    <p className="text-slate-500">Use o seletor acima para ver pagamentos</p>
                </div>
            ) : filteredPayments.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Nenhum Pagamento</h3>
                    <p className="text-slate-500">Ainda não há transações registradas</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredPayments.map((payment, i) => (
                        <motion.div
                            key={payment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                    payment.status === "completed" ? "bg-emerald-500/20" : "bg-slate-500/20"
                                )}>
                                    {payment.status === "completed" ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    ) : payment.status === "failed" ? (
                                        <XCircle className="w-5 h-5 text-red-400" />
                                    ) : (
                                        <Clock className="w-5 h-5 text-amber-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-white truncate">
                                            {payment.description || "Pagamento"}
                                        </p>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                            getStatusColor(payment.status)
                                        )}>
                                            {payment.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {formatRelativeTime(payment.created_at)} • ID: {payment.id.slice(0, 8)}...
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={cn(
                                        "text-lg font-black",
                                        payment.status === "refunded" ? "text-red-400" : "text-emerald-400"
                                    )}>
                                        {payment.status === "refunded" ? "-" : "+"}{formatCurrency(payment.amount)}
                                    </p>
                                    <p className="text-xs text-slate-500">{payment.currency}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
