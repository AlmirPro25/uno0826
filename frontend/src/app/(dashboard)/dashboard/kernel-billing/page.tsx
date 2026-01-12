"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
    DollarSign, Loader2, RefreshCw, Building2, CreditCard,
    TrendingUp, CheckCircle2
} from "lucide-react";
import { api } from "@/lib/api";
import { AppHeader } from "@/components/dashboard/app-header";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface KernelPlan {
    id: string;
    name: string;
    price_cents: number;
    interval: string;
    features: string[];
    limits: {
        apps: number;
        users_per_app: number;
        api_calls_per_month: number;
    };
    is_default: boolean;
}

interface AppSubscription {
    id: string;
    app_id: string;
    app_name: string;
    plan_id: string;
    plan_name: string;
    status: string;
    current_period_start: string;
    current_period_end: string;
    created_at: string;
}

interface KernelBillingStats {
    total_apps: number;
    paying_apps: number;
    mrr_cents: number;
    arr_cents: number;
}

export default function KernelBillingPage() {
    const [plans, setPlans] = useState<KernelPlan[]>([]);
    const [subscriptions, setSubscriptions] = useState<AppSubscription[]>([]);
    const [stats, setStats] = useState<KernelBillingStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [plansRes, subsRes, statsRes] = await Promise.all([
                api.get("/admin/kernel-billing/plans").catch(() => ({ data: { plans: [] } })),
                api.get("/admin/kernel-billing/subscriptions").catch(() => ({ data: { subscriptions: [] } })),
                api.get("/admin/kernel-billing/stats").catch(() => ({ data: null }))
            ]);
            setPlans(plansRes.data.plans || []);
            setSubscriptions(subsRes.data.subscriptions || []);
            setStats(statsRes.data);
        } catch (error) {
            console.error("Failed to fetch kernel billing data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(cents / 100);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "trialing": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            case "past_due": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            case "canceled": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
            default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
        }
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
                        Kernel Billing
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Cobrança dos apps que usam a infraestrutura do kernel
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline"
                        onClick={fetchData}
                        disabled={loading}
                        className="h-11 px-4 rounded-xl border-white/10 text-white hover:bg-white/5"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-4 gap-4">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-indigo-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-white">{stats.total_apps}</p>
                        <p className="text-xs text-slate-500">Apps Totais</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-emerald-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-emerald-400">{stats.paying_apps}</p>
                        <p className="text-xs text-emerald-400/60">Apps Pagantes</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-amber-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-amber-400">{formatCurrency(stats.mrr_cents)}</p>
                        <p className="text-xs text-amber-400/60">MRR</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-purple-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-purple-400">{formatCurrency(stats.arr_cents)}</p>
                        <p className="text-xs text-purple-400/60">ARR</p>
                    </div>
                </div>
            )}

            {/* Plans */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Planos Disponíveis</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    {plans.length > 0 ? plans.map((plan, i) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                                "p-6 rounded-2xl bg-white/[0.02] border border-white/5",
                                plan.is_default && "ring-2 ring-indigo-500/50"
                            )}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white text-lg">{plan.name}</h3>
                                {plan.is_default && (
                                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400">
                                        PADRÃO
                                    </span>
                                )}
                            </div>
                            <p className="text-3xl font-black text-white mb-1">
                                {formatCurrency(plan.price_cents)}
                                <span className="text-sm text-slate-500 font-normal">/{plan.interval}</span>
                            </p>
                            <div className="space-y-2 mt-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Apps</span>
                                    <span className="text-white">{plan.limits?.apps || "∞"}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Usuários/App</span>
                                    <span className="text-white">{plan.limits?.users_per_app || "∞"}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">API Calls/mês</span>
                                    <span className="text-white">
                                        {plan.limits?.api_calls_per_month 
                                            ? plan.limits.api_calls_per_month.toLocaleString() 
                                            : "∞"}
                                    </span>
                                </div>
                            </div>
                            {plan.features && plan.features.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/5">
                                    {plan.features.map((feature, j) => (
                                        <div key={j} className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )) : (
                        <div className="col-span-full text-center py-10 text-slate-500">
                            Nenhum plano configurado
                        </div>
                    )}
                </div>
            </div>

            {/* Subscriptions */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Assinaturas Ativas</h2>
                {subscriptions.length > 0 ? (
                    <div className="space-y-2">
                        {subscriptions.map((sub, i) => (
                            <motion.div
                                key={sub.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.02 }}
                                className="p-4 rounded-xl bg-white/[0.02] border border-white/5"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-white">{sub.app_name}</span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                                                getStatusColor(sub.status)
                                            )}>
                                                {sub.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span>Plano: {sub.plan_name}</span>
                                            <span>Período: {formatDate(sub.current_period_start)} - {formatDate(sub.current_period_end)}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                        <CreditCard className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">
                            Nenhuma assinatura ativa
                        </h3>
                        <p className="text-slate-500">
                            Apps com assinaturas aparecerão aqui
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
