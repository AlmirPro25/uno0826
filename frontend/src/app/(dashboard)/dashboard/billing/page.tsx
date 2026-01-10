"use client";

import { useEffect, useState } from "react";
import { CreditCard, Zap, FileText, CheckCircle2, BarChart, History, Wallet, Loader2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";

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
    const { activeApp } = useApp();
    const [account, setAccount] = useState<BillingAccount | null>(null);
    const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);

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

    const handleUpgrade = async () => {
        setUpgrading(true);
        try {
            const res = await api.post("/billing/checkout/pro");
            if (res.data.url) {
                window.location.href = res.data.url;
            } else {
                toast.error("Falha ao criar sessão de checkout");
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            toast.error(err.response?.data?.error || "Erro ao iniciar upgrade");
        } finally {
            setUpgrading(false);
        }
    };

    const handleManageSubscription = async () => {
        try {
            const res = await api.post("/billing/portal");
            if (res.data.url) {
                window.location.href = res.data.url;
            }
        } catch {
            toast.error("Falha ao abrir portal de billing");
        }
    };

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
            <AppHeader />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                        Economia {activeApp ? `de ${activeApp.name}` : "do Kernel"}
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Gestão soberana de fluxos financeiros e subscrições.</p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        variant="outline" 
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl px-6 font-bold uppercase tracking-widest text-[10px]"
                        onClick={handleManageSubscription}
                    >
                        <FileText className="w-4 h-4 mr-2" /> Portal Stripe
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Current Plan Card */}
                <div className="lg:col-span-2 p-10 rounded-[32px] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                        {isPro ? <Crown className="w-48 h-48 text-amber-500 -rotate-12" /> : <Zap className="w-48 h-48 text-indigo-500 -rotate-12" />}
                    </div>

                    <div className="relative z-10">
                        <div className={cn(
                            "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] mb-6",
                            isPro 
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                        )}>
                            {isPro ? <Crown className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                            {isPro ? "PRO ATIVO" : "PLANO FREE"}
                        </div>
                        <h2 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase leading-none">
                            {subStatus?.plan_name || "Free Tier"}
                        </h2>
                        <p className="text-slate-400 font-medium mb-10 max-w-md">
                            {isPro
                                ? `Renovação automática programada para ${formatDate(subStatus?.current_period_end)}.`
                                : "Acesse o poder total do Kernel. Crie apps ilimitados e tenha governança avançada."
                            }
                        </p>

                        {isPro ? (
                            <div className="flex items-center gap-6">
                                <Button 
                                    onClick={handleManageSubscription}
                                    className="h-14 px-10 rounded-2xl bg-white text-black hover:bg-slate-200 font-black uppercase tracking-widest text-xs transition-all"
                                >
                                    Gerenciar Assinatura
                                </Button>
                                <div className="flex items-center gap-2 text-emerald-400 font-black uppercase tracking-widest text-[10px]">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Ativo
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex flex-wrap gap-3">
                                    {["10 Apps", "5 Credenciais/App", "1000 Usuários/App", "Suporte Prioritário"].map((feature) => (
                                        <span key={feature} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold">
                                            <CheckCircle2 className="w-3 h-3" /> {feature}
                                        </span>
                                    ))}
                                </div>
                                <Button 
                                    onClick={handleUpgrade}
                                    disabled={upgrading}
                                    className="h-14 px-10 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-500 font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-600/20"
                                >
                                    {upgrading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processando...</>
                                    ) : (
                                        <><Crown className="w-4 h-4 mr-2" /> Upgrade para Pro — R$99/mês</>
                                    )}
                                </Button>
                            </div>
                        )}
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
                            <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-500/10 text-slate-500 text-[10px] font-black uppercase tracking-widest text-center">
                                Sem Saldo Acumulado
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
                            <BarChart className="w-5 h-5 text-indigo-500" /> Limites do Plano
                        </h3>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isPro ? "PRO" : "FREE"}</span>
                    </div>

                    <div className="space-y-10">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Aplicações</p>
                                    <p className="text-xl font-black text-white">0 <span className="text-slate-600 text-sm">/ {isPro ? "10" : "0"}</span></p>
                                </div>
                                <span className="text-indigo-400 font-black text-sm">0%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "0%" }}
                                    className="h-full bg-indigo-500 rounded-full"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Credenciais por App</p>
                                    <p className="text-xl font-black text-white">0 <span className="text-slate-600 text-sm">/ {isPro ? "5" : "0"}</span></p>
                                </div>
                                <span className="text-emerald-400 font-black text-sm">0%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "0%" }}
                                    className="h-full bg-emerald-500 rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <History className="w-5 h-5 text-indigo-500" /> Histórico
                        </h3>
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center text-center p-10 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                        <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <CreditCard className="w-8 h-8 text-slate-700" />
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Nenhuma transação registrada.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
