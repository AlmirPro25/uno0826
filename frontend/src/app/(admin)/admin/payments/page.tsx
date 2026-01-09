"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Loader2, ArrowUpRight, ArrowDownRight, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

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

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/payments?page=1&limit=50&status=${statusFilter}`);
            setData(res.data);
        } catch (error) {
            console.error("Failed to fetch payments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [statusFilter]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-amber-500">Financial Ledger</h1>
                    <p className="text-muted-foreground text-sm mt-1">Global transaction history.</p>
                </div>
                <Button variant="outline" className="border-amber-900/30 text-amber-400 hover:bg-amber-950/20">
                    Export CSV
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-lg border border-white/5">
                <Filter className="w-4 h-4 text-zinc-500 ml-2" />
                <select
                    className="bg-transparent border-none focus:ring-0 text-zinc-300 text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="succeeded">Succeeded</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                </select>
                <div className="h-4 w-px bg-white/10 mx-2" />
                <Search className="w-4 h-4 text-zinc-500" />
                <Input
                    className="bg-transparent border-none focus-visible:ring-0 text-zinc-300 placeholder:text-zinc-600 w-full"
                    placeholder="Search transaction ID..."
                    disabled
                />
            </div>

            <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-zinc-400 font-medium">
                        <tr>
                            <th className="px-6 py-4">Transaction</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading && (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-zinc-500">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                    Loading ledger...
                                </td>
                            </tr>
                        )}

                        {!loading && data?.data.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-zinc-500 italic">
                                    No transactions found.
                                </td>
                            </tr>
                        )}

                        {!loading && data?.data.map((payment) => (
                            <motion.tr
                                key={payment.intent_id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="hover:bg-white/5 transition-colors group"
                            >
                                <td className="px-6 py-4 font-medium text-zinc-300">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded bg-zinc-800 text-zinc-400">
                                            <CreditCard className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-white font-mono text-xs">{payment.description || "Payment"}</div>
                                            <div className="text-xs text-zinc-500 font-mono text-[10px]">{payment.intent_id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono text-white">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: payment.currency }).format(payment.amount)}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'confirmed' || payment.status === 'succeeded'
                                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                            : payment.status === 'failed'
                                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                        }`}>
                                        {payment.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-zinc-500 text-xs">
                                    {new Date(payment.created_at).toLocaleString()}
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
