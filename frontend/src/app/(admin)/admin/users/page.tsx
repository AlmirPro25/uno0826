"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Shield, User as UserIcon, Loader2, ChevronLeft, ChevronRight, Activity, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { User } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PaginatedUsers {
    data: User[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export default function AdminUsersPage() {
    const [term, setTerm] = useState("");
    const [page, setPage] = useState(1);
    const [data, setData] = useState<PaginatedUsers | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async (pageToFetch = 1) => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/users?page=${pageToFetch}&limit=20&search=${term}`);
            setData(res.data);
            setPage(pageToFetch);
        } catch (error) {
            console.error("Failed to fetch users", error);
            toast.error("Erro ao carregar lista de usuários");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [term]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && (!data || newPage <= data.total_pages)) {
            fetchUsers(newPage);
        }
    };

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-900/20 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-white">
                        Identity <span className="text-red-500">Registry</span>
                    </h1>
                    <p className="text-zinc-500 mt-2 font-mono text-[10px] uppercase tracking-[0.3em]">Sovereign Entity Management & Access Control</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-500 flex items-center gap-2">
                        <Activity className="w-3 h-3" />
                        TOTAL: {data?.total || "..."}
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 w-full flex items-center gap-3 bg-zinc-900/40 border border-white/5 px-4 py-2 rounded-2xl focus-within:border-red-500/50 transition-all shadow-inner">
                    <Search className="w-4 h-4 text-zinc-600" />
                    <Input
                        className="bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-zinc-700 font-bold h-10 text-xs uppercase"
                        placeholder="Scan for identities (name, email, identifier)..."
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-[40px] border border-white/5 bg-zinc-900/20 backdrop-blur-md overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Sovereign Identity</th>
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Rank / Role</th>
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Pulse (Status)</th>
                                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Origin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <AnimatePresence mode="popLayout">
                                {loading && (!data || data.data.length === 0) ? (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <td colSpan={4} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="w-10 h-10 animate-spin text-red-500/20" />
                                                <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em] animate-pulse">Syncing Ident-Matrix...</p>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ) : (
                                    data?.data.map((user, idx) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.02 }}
                                            className="hover:bg-red-500/[0.02] transition-colors group cursor-crosshair"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center text-red-500 font-black text-lg group-hover:bg-red-950/20 group-hover:border-red-500/20 transition-all shadow-xl">
                                                        {(user.name || user.email || "?")[0].toUpperCase()}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <div className="text-white font-black text-sm tracking-tight uppercase group-hover:text-red-400 transition-colors">{user.name || "UNIDENTIFIED"}</div>
                                                        <div className="text-[10px] text-zinc-600 font-mono lower-case tracking-tight italic">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {user.role === "admin" || user.role === "super_admin" ? (
                                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20">
                                                        <Shield className="w-3 h-3" /> Admin_Kernel
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-zinc-800 text-zinc-500 border border-white/5">
                                                        <UserIcon className="w-3 h-3" /> Entity_Mortal
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={cn(
                                                    "inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                                    user.status === 'active'
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                )}>
                                                    <div className={cn("h-1 w-1 rounded-full mr-2 shadow-[0_0_8px_currentColor]", user.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500')} />
                                                    {user.status || "Unknown"}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-[10px] text-zinc-600 font-mono font-black uppercase">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </div>
                                                <div className="text-[8px] text-zinc-700 font-mono uppercase tracking-tighter">
                                                    ENTRY_LOG_ID: {user.id.substring(0, 8)}
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
                            Matrix_Page <span className="text-red-500">{data.page}</span> / {data.total_pages}
                        </span>
                        <div className="flex gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePageChange(data.page - 1)}
                                disabled={data.page <= 1 || loading}
                                className="h-8 text-[9px] font-black text-zinc-500 hover:text-red-400 uppercase tracking-widest disabled:opacity-30"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
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
