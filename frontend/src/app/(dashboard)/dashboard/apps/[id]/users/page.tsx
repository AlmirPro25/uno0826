"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Search, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const mockUsers: AppUser[] = [
    {
        id: "1",
        user_id: "usr_001",
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
        status: "active",
        linked_at: "2026-01-01T00:00:00Z",
        last_login: "2026-01-10T09:30:00Z"
    },
    {
        id: "2",
        user_id: "usr_002",
        email: "user@example.com",
        name: "Regular User",
        role: "member",
        status: "active",
        linked_at: "2026-01-05T10:00:00Z",
        last_login: "2026-01-09T14:20:00Z"
    },
    {
        id: "3",
        user_id: "usr_003",
        email: "pending@example.com",
        name: "Pending User",
        role: "member",
        status: "pending",
        linked_at: "2026-01-10T08:00:00Z",
        last_login: null
    }
];

export default function AppUsersPage() {
    const params = useParams();
    const router = useRouter();
    const appId = params.id as string;

    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        setTimeout(() => {
            setUsers(mockUsers);
            setLoading(false);
        }, 500);
    }, [appId]);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusBadge = (status: AppUser["status"]) => {
        switch (status) {
            case "active":
                return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ACTIVE</span>;
            case "suspended":
                return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">SUSPENDED</span>;
            case "pending":
                return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">PENDING</span>;
        }
    };

    const getRoleBadge = (role: string) => {
        if (role === "admin") {
            return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">ADMIN</span>;
        }
        return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">MEMBER</span>;
    };

    const formatDate = (date: string | null) => {
        if (!date) return "Nunca";
        return new Date(date).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/dashboard/apps/${appId}`)}
                    className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Usuários do App</h1>
                    <p className="text-sm text-slate-400 mt-1">Usuários vinculados a esta aplicação</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    placeholder="Buscar usuários..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Total", value: users.length, color: "indigo" },
                    { label: "Ativos", value: users.filter(u => u.status === "active").length, color: "emerald" },
                    { label: "Pendentes", value: users.filter(u => u.status === "pending").length, color: "amber" },
                    { label: "Admins", value: users.filter(u => u.role === "admin").length, color: "purple" }
                ].map((stat) => (
                    <div key={stat.label} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <p className="text-2xl font-black text-white">{stat.value}</p>
                        <p className="text-xs text-slate-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Users List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Nenhum usuário encontrado</p>
                </div>
            ) : (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Usuário</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Último Login</th>
                                <th className="px-6 py-4 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-white/[0.02]">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                                                {user.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{user.name}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                    <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                                    <td className="px-6 py-4 text-sm text-slate-400">{formatDate(user.last_login)}</td>
                                    <td className="px-6 py-4">
                                        <button className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
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
