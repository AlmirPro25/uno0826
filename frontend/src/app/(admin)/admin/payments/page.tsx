"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Filter, Loader2, CreditCard, ChevronLeft, ChevronRight, Activity, DollarSign, ReceiptText } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Payment {
    intent_id: string;
    amount: number;
    currency: string;
    status: string;
    description: string;
    created_at: string;
    user_id: string;
}

interface PaginatedPayments {
    data: Payment[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export default function AdminPaymentsPage() {
    const [data, setData] = useState<PaginatedPayments | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);

    const fetchPayments = async (pageToFetch = 1) => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/payments?page=${pageToFetch}&limit=20&status=${statusFilter}`);
            setData(res.data);
            setPage(pageToFetch);
        } catch (error) {
            console.error("Failed to fetch payments", error);
            toast.error("Erro ao carregar pagamentos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments(1);
    }, [statusFilter]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && (!data || newPage <= data.total_pages)) {
            fetchPayments(newPage);
        }
    };

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-900/20 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-white">
                        Financial <span className="text-red-500">Ledger</span>
                    </h1>
                    <p className="text-zinc-500 mt-2 font-mono text-[10px] uppercase tracking-[0.3em]">Monetary Invariants & Transactional Integrity</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-zinc-900 p-2 rounded-xl border border-white/5">
                        <Filter className="w-3 h-3 text-red-500 ml-1" />
                        <select
                            className="bg-transparent border-none focus:ring-0 text-zinc-400 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="rounded-[40px] border border-white/5 bg-zinc-900/20 backdrop-blur-md overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Transaction / IntentID</th>
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Monetary Value</th>
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Sovereign Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Sync_Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <AnimatePresence mode="popLayout">
                                {loading && (!data || data.data.length === 0) ? (
                                    <tr>
                                        <td colSpan={4} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="w-10 h-10 animate-spin text-red-500/20" />
                                                <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em] animate-pulse">Auditing Monetary Flows...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : !data || data.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-24 text-center">
                                            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">No transactional data in current buffer.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    data.data.map((payment, idx) => (
                                        <motion.tr
                                            key={payment.intent_id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.02 }}
                                            className="hover:bg-red-500/[0.02] transition-colors group cursor-crosshair"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center text-emerald-500 font-black text-lg group-hover:bg-red-950/20 group-hover:border-red-500/20 transition-all shadow-xl">
                                                        <ReceiptText className="w-6 h-6" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <div className="text-white font-black text-sm tracking-tight uppercase group-hover:text-red-400 transition-colors">
                                                            {payment.description || "SUBSCRIPTION_INTENT"}
                                                        </div>
                                                        <div className="text-[10px] text-zinc-600 font-mono tracking-tighter uppercase italic">
                                                            UID: {payment.intent_id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-lg font-black text-white tracking-tighter">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: payment.currency }).format(payment.amount)}
                                                </div>
                                                <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                                                    Verified by Stripe_API
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={cn(
                                                    "inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                                    payment.status === 'confirmed' || payment.status === 'succeeded'
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                        : payment.status === 'failed'
                                                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                )}>
                                                    <div className={cn("h-1 w-1 rounded-full mr-2 shadow-[0_0_8px_currentColor]", (payment.status === 'confirmed' || payment.status === 'succeeded') ? 'bg-emerald-500 animate-pulse' : 'bg-red-500')} />
                                                    {payment.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-[10px] text-zinc-600 font-mono font-black uppercase">
                                                    {new Date(payment.created_at).toLocaleDateString()}
                                                </div>
                                                <div className="text-[8px] text-zinc-700 font-mono uppercase tracking-tighter">
                                                    {new Date(payment.created_at).toLocaleTimeString()} UTC
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {!loading && data && (
                    <div className="p-6 border-t border-white/5 flex items-center justify-between bg-black/40">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                            Ledger_Page <span className="text-red-500">{data.page}</span> / {data.total_pages}
                        </span>
                        <div className="flex gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePageChange(data.page - 1)}
                                disabled={data.page <= 1 || loading}
                                className="h-8 text-[9px] font-black text-zinc-500 hover:text-red-400 uppercase tracking-widest disabled:opacity-30"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePageChange(data.page + 1)}
                                disabled={data.page >= data.total_pages || loading}
                                className="h-8 text-[9px] font-black text-zinc-500 hover:text-red-400 uppercase tracking-widest disabled:opacity-30"
                            >
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
