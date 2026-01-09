"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreVertical, Shield, User as UserIcon, Loader2, Filter, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { User } from "@/types";
import { cn } from "@/lib/utils";

interface PaginatedUsers {
    data: User[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export default function AdminUsersPage() {
    const [term, setTerm] = useState("");
    const [data, setData] = useState<PaginatedUsers | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/users?page=1&limit=50&search=${term}`);
            setData(res.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(timer);
    }, [term]);

    return (
        <div className="space-y-10 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                        GESTOR DE <span className="text-indigo-500">IDENTIDADES</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Controle de acesso e governança de usuários do Kernel.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl px-6 font-bold uppercase tracking-widest text-[10px]">
                        <Download className="w-4 h-4 mr-2" /> Exportar Audit Log
                    </Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 w-full flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-2 rounded-2xl focus-within:border-indigo-500/50 transition-all">
                    <Search className="w-5 h-5 text-slate-600" />
                    <Input
                        className="bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-slate-600 font-medium h-10"
                        placeholder="Buscar por nome, email ou ID soberano..."
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="w-full md:w-auto h-14 px-6 rounded-2xl border-white/5 bg-white/[0.02] text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-white/5 hover:text-white transition-all">
                    <Filter className="w-4 h-4 mr-2" /> Filtros Avançados
                </Button>
            </div>

            <div className="rounded-[32px] border border-white/5 bg-white/[0.01] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Identidade</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Soberania (Role)</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Registro</th>
                                <th className="px-8 py-6 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <td colSpan={5} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="w-10 h-10 animate-spin text-indigo-500/20" />
                                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sincronizando com o Kernel...</p>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ) : (
                                    data?.data.map((user, idx) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="hover:bg-white/[0.02] transition-colors group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-lg shadow-inner group-hover:scale-110 transition-transform">
                                                        {(user.name || user.email || "?")[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-bold tracking-tight">{user.name || "Anon"}</div>
                                                        <div className="text-xs text-slate-500 font-medium">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {user.role === "admin" || user.role === "super_admin" ? (
                                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                                        <Shield className="w-3 h-3" /> Admin
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-800 text-slate-400 border border-slate-700">
                                                        <UserIcon className="w-3 h-3" /> User
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={cn(
                                                    "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                    user.status === 'active'
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                )}>
                                                    <div className={cn("h-1.5 w-1.5 rounded-full mr-2", user.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500')} />
                                                    {user.status || "Unknown"}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-xs text-slate-500 font-medium">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-600 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
                {!loading && (!data || data.data.length === 0) && (
                    <div className="py-32 text-center">
                        <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Nenhuma identidade encontrada no banco do Kernel.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
