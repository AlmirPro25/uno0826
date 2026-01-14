import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import {
    Users,
    Search,
    Plus,
    Edit,
    Trash2,
    Shield,
    Stethoscope,
    User,
    Loader2,
    AlertCircle,
    CheckCircle,
    XCircle,
    Filter,
    MoreVertical,
    Mail,
    Calendar,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

interface UserData {
    id: number;
    email: string;
    full_name: string;
    role: string;
    specialty?: string;
    crm?: string;
    phone?: string;
    is_active: boolean;
    two_factor_enabled: boolean;
    created_at: string;
    last_login?: string;
}

interface PaginatedResponse {
    users: UserData[];
    total: number;
    page: number;
    page_size: number;
}

export default function AdminUsersPage() {
    const router = useRouter();
    const { isAuthenticated, role } = useAuthStore();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserData | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        if (role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }
        loadUsers();
    }, [isAuthenticated, role, page, roleFilter]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                page_size: '10',
            });
            if (roleFilter !== 'all') {
                params.append('role', roleFilter);
            }
            if (searchTerm) {
                params.append('search', searchTerm);
            }

            const response = await axiosInstance.get(`/admin/users?${params}`);
            const data = response.data;
            
            setUsers(data.users || data || []);
            setTotal(data.total || data.length || 0);
            setTotalPages(Math.ceil((data.total || data.length || 0) / 10));
        } catch (err) {
            setError('Erro ao carregar usuários');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadUsers();
    };

    const handleDeleteUser = async () => {
        if (!deletingUser) return;
        try {
            await axiosInstance.delete(`/admin/users/${deletingUser.id}`);
            setDeletingUser(null);
            loadUsers();
        } catch (err) {
            console.error(err);
            alert('Erro ao deletar usuário');
        }
    };

    const getRoleIcon = (userRole: string) => {
        switch (userRole) {
            case 'ADMIN':
                return <Shield className="w-4 h-4 text-purple-400" />;
            case 'MEDICO':
                return <Stethoscope className="w-4 h-4 text-cyan-400" />;
            default:
                return <User className="w-4 h-4 text-gray-400" />;
        }
    };

    const getRoleBadge = (userRole: string) => {
        switch (userRole) {
            case 'ADMIN':
                return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            case 'MEDICO':
                return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
            default:
                return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <>
            <Head>
                <title>Gestão de Usuários | Admin | MediSync</title>
            </Head>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Users className="w-7 h-7 text-cyan-600" />
                            Gestão de Usuários
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {total} usuários cadastrados
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Usuário
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar por nome ou email..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                />
                            </div>
                        </form>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                value={roleFilter}
                                onChange={(e) => {
                                    setRoleFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="all">Todos os tipos</option>
                                <option value="ADMIN">Administradores</option>
                                <option value="MEDICO">Médicos</option>
                                <option value="PACIENTE">Pacientes</option>
                            </select>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {/* Users Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Nenhum usuário encontrado</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Usuário
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Tipo
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Cadastro
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                                        {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {user.full_name || 'Sem nome'}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                            <Mail className="w-3 h-3" />
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                                                    {getRoleIcon(user.role)}
                                                    {user.role}
                                                </span>
                                                {user.specialty && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {user.specialty}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`inline-flex items-center gap-1 text-xs ${user.is_active !== false ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {user.is_active !== false ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                        {user.is_active !== false ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                    {user.two_factor_enabled && (
                                                        <span className="inline-flex items-center gap-1 text-xs text-purple-500">
                                                            <Shield className="w-3 h-3" />
                                                            2FA
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(user.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setEditingUser(user)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-cyan-600 transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingUser(user)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Página {page} de {totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deletingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Confirmar Exclusão
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Tem certeza que deseja excluir o usuário <strong>{deletingUser.full_name || deletingUser.email}</strong>? Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeletingUser(null)}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
