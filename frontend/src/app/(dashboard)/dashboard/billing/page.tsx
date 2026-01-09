"use client";

import { useEffect, useState } from "react";
import { CreditCard, Zap, FileText, Download, CheckCircle2, TrendingUp, AlertTriangle, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
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
                    api.get("/billing/account").catch(() => ({ data: null })), // Account might not exist
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

    if (loading) return <div className="p-8">Loading billing info...</div>;

    const isPro = subStatus?.has_subscription && subStatus?.status === 'active';

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Billing & Plans</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage your subscription and usage.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="hidden border-white/10 hover:bg-white/5">
                        <FileText className="w-4 h-4 mr-2" /> Invoices
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Plan Card */}
                <div className="md:col-span-2 p-6 rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Zap className="w-24 h-24 text-purple-500" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-purple-400 mb-2">
                            <Zap className="w-5 h-5" />
                            <span className="text-sm font-semibold tracking-wider uppercase">Current Plan</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-1">
                            {subStatus?.plan_name || "Free Tier"}
                        </h2>
                        <p className="text-zinc-400 text-sm mb-6">
                            {isPro
                                ? `Renews on ${formatDate(subStatus?.current_period_end)}`
                                : "Upgrade to PROST-QS Pro for advanced features."
                            }
                        </p>

                        <div className="flex items-center gap-4">
                            {isPro ? (
                                <Button className="bg-white text-black hover:bg-zinc-200">
                                    Manage Subscription
                                </Button>
                            ) : (
                                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                                    Upgrade to Pro
                                </Button>
                            )}
                            {isPro && (
                                <span className="text-sm text-green-500 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" /> Active
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Balance Card */}
                <div className="p-6 rounded-xl border border-white/10 bg-zinc-900/50 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-zinc-500 text-sm font-medium">Account Balance</span>
                            <CreditCard className="w-5 h-5 text-zinc-600" />
                        </div>
                        <div className="text-3xl font-mono text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: account?.currency || 'BRL' }).format((account?.balance || 0) / 100)}
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">Available for payouts</p>
                    </div>

                    {account && account.balance > 0 && (
                        <Button variant="secondary" className="mt-4 w-full">
                            Request Payout
                        </Button>
                    )}
                    {!account && (
                        <div className="mt-4 text-xs text-yellow-500 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> No billing account
                        </div>
                    )}
                </div>
            </div>

            {/* Invoices Mock - To be replaced with ListPayouts or ListInvoices if available */}
            <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h3 className="font-semibold text-zinc-300">Recent History</h3>
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-zinc-500">View All</Button>
                </div>
                <div className="divide-y divide-white/5">
                    {/* Placeholder for no history */}
                    <div className="p-8 text-center text-zinc-600 italic">
                        No transactions recorded.
                    </div>
                </div>
            </div>
            {/* Usage Section */}
            <div className="mt-12">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <BarChart className="w-4 h-4" /> Usage Consumption
                </h3>

                <div className="glass-card p-6 rounded-xl border border-border space-y-6">
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium">API Requests</span>
                            <span className="text-muted-foreground">754,320 / 1,000,000</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-[75%] rounded-full" />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium">Storage (GB)</span>
                            <span className="text-muted-foreground">45.2 / 50 GB</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 w-[90%] rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
