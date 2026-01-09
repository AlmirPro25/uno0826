"use client";

import { useEffect, useState } from "react";
import { CreditCard, Zap, FileText, Download, CheckCircle2, TrendingUp, AlertTriangle, BarChart, ArrowUpRight, History, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

type BillingAccount = {
    account_id: string;
    balance: number;
    currency: string;
}

type SubscriptionStatus = {
    has_subscription: boolean;
    plan: string;
    plan_name: string;
    status: string;
    amount: number;
    currency: string;
    interval: string;
    current_period_end?: string;
    message: string;
}

export default function BillingPage() {
    const [account, setAccount] = useState<BillingAccount | null>(null);
    const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [accRes, subRes] = await Promise.all([
                    api.get("/billing/account").catch(() => ({ data: null })),
                    api.get("/billing/subscriptions/status")
                ]);
                setAccount(accRes.data);
                setSubStatus(subRes.data);
            } catch (error) {
                console.error("Billing fetch error", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString();
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <Zap className="w-8 h-8 text-indigo-500 animate-pulse" />
        </div>
    );

    const isPro = subStatus?.has_subscription && subStatus?.status === 'active';

    return (
        <div className="space-y-10 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                        ECONOMIA DO <span className="text-indigo-500">KERNEL</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Gestão soberana de fluxos financeiros e subscrições.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl px-6 font-bold uppercase tracking-widest text-[10px]">
                        <FileText className="w-4 h-4 mr-2" /> Faturas
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Current Plan Card */}
                <div className="lg:col-span-2 p-10 rounded-[32px] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                        <Zap className="w-48 h-48 text-indigo-500 -rotate-12" />
                    </div>

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                            Plan Status
                        </div>
                        <h2 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase leading-none">
                            {subStatus?.plan_name || "Free Tier"}
                        </h2>
                        <p className="text-slate-400 font-medium mb-10 max-w-md">
                            {isPro
                                ? `Renovação automática programada para ${formatDate(subStatus?.current_period_end)}.`
                                : "Acesse o poder total do Kernel. Identidade ilimitada e governança avançada."
                            }
                        </p>

                        <div className="flex items-center gap-6">
                            <Button className={cn(
                                "h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs transition-all",
                                isPro ? "bg-white text-black hover:bg-slate-200" : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20"
                            )}>
                                {isPro ? "Gerenciar Assinatura" : "Upgrade para Pro"}
                            </Button>
                            {isPro && (
                                <div className="flex items-center gap-2 text-emerald-400 font-black uppercase tracking-widest text-[10px]">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Ativo
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Balance Card */}
                <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-indigo-600/10 blur-[60px] rounded-full" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Sovereign Balance</span>
                            <Wallet className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="text-5xl font-black text-white tracking-tighter leading-none mb-2">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: account?.currency || 'BRL' }).format((account?.balance || 0) / 100)}
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Disponível para Repasse</p>
                    </div>

                    <div className="mt-12 relative z-10">
                        {account && account.balance > 0 ? (
                            <Button className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 font-bold uppercase tracking-widest text-[10px]">
                                Solicitar Resgate
                            </Button>
                        ) : (
                            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest text-center">
                                <AlertTriangle className="w-3 h-3 inline mr-1" /> Sem Saldo Acumulado
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Usage Section */}
                <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <BarChart className="w-5 h-5 text-indigo-500" /> Consumo de Telemetria
                        </h3>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Este mês</span>
                    </div>

                    <div className="space-y-10">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">API Requests</p>
                                    <p className="text-xl font-black text-white">754,320 <span className="text-slate-600 text-sm">/ 1.0M</span></p>
                                </div>
                                <span className="text-indigo-400 font-black text-sm">75%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "75%" }}
                                    className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Storage Utilizado</p>
                                    <p className="text-xl font-black text-white">45.2GB <span className="text-slate-600 text-sm">/ 50GB</span></p>
                                </div>
                                <span className="text-amber-400 font-black text-sm">90%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "90%" }}
                                    className="h-full bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <History className="w-5 h-5 text-indigo-500" /> Histórico Financeiro
                        </h3>
                        <Button variant="ghost" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Ver Tudo</Button>
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center text-center p-10 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                        <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <TrendingUp className="w-8 h-8 text-slate-700" />
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Nenhuma transação registrada no ledger imutável.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
