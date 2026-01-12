"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Search, MoreHorizontal, Loader2, UserPlus, ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AppUser {
    id: string;
    user_id: string;
    email: string;
    name: string;
    role: string;
    status: "active" | "suspended" | "pending";
    linked_at: string;
    last_login: string | null;
}

export default function AppUsersPage() {
    const params = useParams();
    const router = useRouter();
    const appId = params.id as string;

    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            // Endpoint correto conforme mapa de mocks: GET /applications/{id}/users
            const res = await api.get(`/applications/${appId}/users`);
            const data = res.data.users || res.data || [];

            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch app users", error);
            setError("Não foi possível carregar os usuários.");
            toast.error("Erro ao buscar usuários do aplicativo");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (appId) {
            fetchUsers();
        }
    }, [appId]);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusBadge = (status: AppUser["status"]) => {
        switch (status) {
            case "active":
                return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ATIVO</span>;
            case "suspended":
                return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">SUSPENSO</span>;
            case "pending":
                return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">PENDENTE</span>;
            default:
                return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">{(status as string)?.toUpperCase()}</span>;
        }
    };

    const getRoleBadge = (role: string) => {
        if (role === "admin" || role === "owner") {
            return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_10px_-3px_rgba(99,102,241,0.3)]">ADMIN</span>;
        }
        return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">MEMBRO</span>;
    };

    const formatDate = (date: string | null) => {
        if (!date) return "Nunca";
        try {
            return new Date(date).toLocaleDateString("pt-BR", {
                day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
            });
        } catch {
            return date;
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <ShieldAlert className="w-12 h-12 text-rose-500" />
                <h3 className="text-xl font-bold text-white">Falha na conexão</h3>
                <p className="text-slate-400">{error}</p>
                <Button onClick={fetchUsers} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" /> Tentar Novamente
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/dashboard/apps/${appId}`)}
                        className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Usuários do App</h1>
                        <p className="text-sm text-slate-400 mt-1">Gerencie quem tem acesso a esta aplicação</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={fetchUsers}
                        className="h-11 border-white/10 hover:bg-white/5 text-slate-300"
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                        Atualizar
                    </Button>
                    <Button className="h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Convidar Usuário
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
            </div>

            {/* Stats */}
            {!loading && !error && users.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total", value: users.length, color: "indigo" },
                        { label: "Ativos", value: users.filter(u => u.status === "active").length, color: "emerald" },
                        { label: "Pendentes", value: users.filter(u => u.status === "pending").length, color: "amber" },
                        { label: "Admins", value: users.filter(u => u.role === "admin").length, color: "purple" }
                    ].map((stat) => (
                        <div key={stat.label} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                            <p className="text-2xl font-black text-white">{stat.value}</p>
                            <p className={`text-xs font-bold uppercase tracking-wider text-${stat.color}-400/70 mt-1`}>{stat.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Users List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                    <p className="text-slate-500 mt-4 text-sm font-medium animate-pulse">Carregando diretório de usuários...</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Nenhum usuário encontrado</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        Parece que não há ninguém aqui ainda. Convide membros para colaborar neste app.
                    </p>
                    <Button className="mt-6 bg-indigo-600 hover:bg-indigo-500">
                        Convidar Primeiro Membro
                    </Button>
                </div>
            ) : (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.01]">
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-8">Usuário</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Função</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Último Acesso</th>
                                <th className="px-6 py-4 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4 pl-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-300 font-black border border-white/5 group-hover:border-indigo-500/30 transition-colors">
                                                {user.name?.[0]?.toUpperCase() || "?"}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm">{user.name || "Sem Nome"}</p>
                                                <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                    <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-slate-400 block">{formatDate(user.last_login)}</span>
                                        {user.last_login && <span className="text-[10px] text-slate-600 block mt-0.5">via Console</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
