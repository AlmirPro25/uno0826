"use client";

import { useEffect, useState } from "react";
import {
    Users, UserPlus, Search, Filter, MoreHorizontal, Shield, ShieldCheck,
    ShieldAlert, Mail, Calendar, Edit2, Trash2, Ban, CheckCircle2, XCircle,
    RefreshCw, Download, ChevronDown, Eye, Key
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type User = {
    id: string;
    username: string;
    email: string;
    role: "user" | "admin" | "super_admin" | "owner";
    status: "active" | "suspended" | "pending" | "banned";
    profile?: {
        name?: string;
        avatar_url?: string;
    };
    created_at: string;
    last_login_at?: string;
    login_count: number;
};

type UserStats = {
    total: number;
    active: number;
    suspended: number;
    admins: number;
};

export default function UsersAdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<UserStats>({ total: 0, active: 0, suspended: 0, admins: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // New user form
    const [newUser, setNewUser] = useState({
        username: "",
        email: "",
        password: "",
        role: "user",
        name: ""
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/users?limit=100").catch(() => null);
            if (res?.data) {
                // API returns { data: [...], total, page, limit, total_pages }
                const userList: User[] = (res.data.data || []).map((u: any) => ({
                    id: u.id || u.ID,
                    username: u.username || u.Username || "",
                    email: u.email || u.Email || "",
                    role: u.role || u.Role || "user",
                    status: u.status || u.Status || "active",
                    profile: {
                        name: u.profile?.name || u.Profile?.Name || u.name || u.Name || "",
                        avatar_url: u.profile?.avatar_url || ""
                    },
                    created_at: u.created_at || u.CreatedAt || new Date().toISOString(),
                    last_login_at: u.last_login_at || u.LastLoginAt || null,
                    login_count: u.login_count || u.LoginCount || 0
                }));

                setUsers(userList);

                // Calculate stats from user list
                const calculatedStats = {
                    total: res.data.total || userList.length,
                    active: userList.filter(u => u.status === "active").length,
                    suspended: userList.filter(u => u.status === "suspended" || u.status === "banned").length,
                    admins: userList.filter(u => u.role === "admin" || u.role === "super_admin").length
                };
                setStats(calculatedStats);
            } else {
                // Fallback if API not ready
                setUsers([]);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
            toast.error("Erro ao carregar usuários");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async () => {
        if (!newUser.email || !newUser.username) {
            toast.error("Email e username são obrigatórios");
            return;
        }
        setActionLoading("create");
        try {
            await api.post("/admin/users", newUser);
            toast.success("Usuário criado com sucesso!");
            setShowCreateModal(false);
            setNewUser({ username: "", email: "", password: "", role: "user", name: "" });
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Erro ao criar usuário");
        } finally {
            setActionLoading(null);
        }
    };

    const handleSuspendUser = async (userId: string) => {
        setActionLoading(userId);
        try {
            await api.post(`/admin/users/${userId}/suspend`);
            toast.success("Usuário suspenso");
            fetchUsers();
        } catch (error) {
            toast.error("Erro ao suspender usuário");
        } finally {
            setActionLoading(null);
        }
    };

    const handleActivateUser = async (userId: string) => {
        setActionLoading(userId);
        try {
            await api.post(`/admin/users/${userId}/activate`);
            toast.success("Usuário ativado");
            fetchUsers();
        } catch (error) {
            toast.error("Erro ao ativar usuário");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Tem certeza que deseja excluir este usuário? Esta ação é irreversível.")) return;
        setActionLoading(userId);
        try {
            await api.delete(`/admin/users/${userId}`);
            toast.success("Usuário excluído");
            fetchUsers();
        } catch (error) {
            toast.error("Erro ao excluir usuário");
        } finally {
            setActionLoading(null);
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case "super_admin": return "text-red-500 bg-red-500/10 border-red-500/20";
            case "admin": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
            case "owner": return "text-purple-500 bg-purple-500/10 border-purple-500/20";
            default: return "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case "super_admin": return "Super Admin";
            case "admin": return "Admin";
            case "owner": return "Owner";
            default: return "Usuário";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "text-emerald-500";
            case "suspended": return "text-red-500";
            case "pending": return "text-amber-500";
            default: return "text-zinc-500";
        }
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.profile?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === "all" || user.role === filterRole;
        const matchesStatus = filterStatus === "all" || user.status === filterStatus;
        return matchesSearch && matchesRole && matchesStatus;
    });

    if (loading) {
        return (
            <div className="p-8 text-indigo-500/50 text-xs font-mono animate-pulse uppercase tracking-widest flex items-center gap-3">
                <Users className="w-5 h-5 animate-pulse" />
                Carregando registros de identidade...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-500 tracking-tighter uppercase">
                        Usuários & Acesso
                    </h1>
                    <p className="text-muted-foreground text-[10px] font-mono mt-1 flex items-center gap-2">
                        <Shield className="w-3 h-3 text-indigo-500" />
                        IDENTITY_MANAGEMENT // TOTAL: {stats.total} USERS
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 hover:bg-indigo-500/20 transition-colors text-xs font-bold uppercase tracking-widest"
                >
                    <UserPlus className="w-4 h-4" />
                    Novo Usuário
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total", value: stats.total, icon: Users, color: "text-white" },
                    { label: "Ativos", value: stats.active, icon: CheckCircle2, color: "text-emerald-500" },
                    { label: "Suspensos", value: stats.suspended, icon: Ban, color: "text-red-500" },
                    { label: "Admins", value: stats.admins, icon: ShieldCheck, color: "text-amber-500" },
                ].map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 rounded-2xl border border-white/5 bg-zinc-900/20 backdrop-blur-md"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{stat.label}</span>
                                <div className={cn("text-2xl font-black", stat.color)}>{stat.value}</div>
                            </div>
                            <stat.icon className={cn("w-8 h-8 opacity-20", stat.color)} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por nome, email ou username..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:border-indigo-500/50 focus:outline-none transition-colors"
                    />
                </div>
                <div className="flex gap-3">
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:border-indigo-500/50 focus:outline-none transition-colors"
                    >
                        <option value="all">Todos os Roles</option>
                        <option value="user">Usuário</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="owner">Owner</option>
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:border-indigo-500/50 focus:outline-none transition-colors"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="active">Ativos</option>
                        <option value="suspended">Suspensos</option>
                        <option value="pending">Pendentes</option>
                    </select>
                    <button onClick={fetchUsers} className="p-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-colors">
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="rounded-2xl border border-white/5 bg-zinc-900/20 backdrop-blur-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest p-4">Usuário</th>
                                <th className="text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest p-4">Role</th>
                                <th className="text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest p-4">Status</th>
                                <th className="text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest p-4">Último Login</th>
                                <th className="text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest p-4">Logins</th>
                                <th className="text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest p-4">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 font-bold text-sm">
                                                {(user.profile?.name || user.username || "?").substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{user.profile?.name || user.username}</p>
                                                <p className="text-xs text-zinc-500 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase border", getRoleColor(user.role))}>
                                            {getRoleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className={cn("w-2 h-2 rounded-full", user.status === "active" ? "bg-emerald-500" : user.status === "suspended" ? "bg-red-500" : "bg-amber-500")} />
                                            <span className={cn("text-xs font-bold uppercase", getStatusColor(user.status))}>
                                                {user.status === "active" ? "Ativo" : user.status === "suspended" ? "Suspenso" : "Pendente"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs text-zinc-400 font-mono">
                                            {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Nunca"}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm font-bold text-white">{user.login_count || 0}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setSelectedUser(user)}
                                                className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                                title="Ver detalhes"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {user.status === "active" ? (
                                                <button
                                                    onClick={() => handleSuspendUser(user.id)}
                                                    disabled={actionLoading === user.id}
                                                    className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                                    title="Suspender"
                                                >
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleActivateUser(user.id)}
                                                    disabled={actionLoading === user.id}
                                                    className="p-2 rounded-lg hover:bg-emerald-500/10 text-zinc-400 hover:text-emerald-500 transition-colors disabled:opacity-50"
                                                    title="Ativar"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                disabled={actionLoading === user.id}
                                                className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <Users className="w-12 h-12 mx-auto text-zinc-700 mb-4" />
                                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Nenhum usuário encontrado</p>
                                        <p className="text-zinc-600 text-xs mt-2">Ajuste os filtros ou crie um novo usuário</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-lg bg-zinc-900 rounded-2xl border border-white/10 p-6 space-y-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-indigo-500" />
                                    Criar Novo Usuário
                                </h2>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <XCircle className="w-5 h-5 text-zinc-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Nome Completo</label>
                                        <input
                                            type="text"
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                            placeholder="João Silva"
                                            className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:border-indigo-500/50 focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Username *</label>
                                        <input
                                            type="text"
                                            value={newUser.username}
                                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                            placeholder="joaosilva"
                                            className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:border-indigo-500/50 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email *</label>
                                    <input
                                        type="email"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        placeholder="joao@empresa.com"
                                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:border-indigo-500/50 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Senha Inicial</label>
                                        <input
                                            type="password"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:border-indigo-500/50 focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Role</label>
                                        <select
                                            value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:border-indigo-500/50 focus:outline-none transition-colors"
                                        >
                                            <option value="user">Usuário</option>
                                            <option value="admin">Admin</option>
                                            <option value="super_admin">Super Admin</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-colors text-xs font-bold uppercase tracking-widest"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateUser}
                                    disabled={actionLoading === "create" || !newUser.email || !newUser.username}
                                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading === "create" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                    Criar Usuário
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* User Detail Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedUser(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-lg bg-zinc-900 rounded-2xl border border-white/10 p-6 space-y-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-indigo-500" />
                                    Detalhes do Usuário
                                </h2>
                                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <XCircle className="w-5 h-5 text-zinc-500" />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 font-bold text-xl">
                                    {(selectedUser.profile?.name || selectedUser.username || "?").substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{selectedUser.profile?.name || selectedUser.username}</h3>
                                    <p className="text-zinc-500 text-sm">{selectedUser.email}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase border", getRoleColor(selectedUser.role))}>
                                            {getRoleLabel(selectedUser.role)}
                                        </span>
                                        <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase", selectedUser.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                                            {selectedUser.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">ID</span>
                                    <p className="text-white font-mono text-xs mt-1 truncate">{selectedUser.id}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Username</span>
                                    <p className="text-white font-bold text-sm mt-1">@{selectedUser.username}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Criado em</span>
                                    <p className="text-white font-mono text-xs mt-1">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total de Logins</span>
                                    <p className="text-white font-bold text-lg mt-1">{selectedUser.login_count || 0}</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="px-4 py-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-colors text-xs font-bold uppercase tracking-widest"
                                >
                                    Fechar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
