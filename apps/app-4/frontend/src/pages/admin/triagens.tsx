import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { getTriageStats, TriageStats, TRIAGE_PRIORITY } from '@/api/triage';
import { useAuthStore } from '@/hooks/useAuthStore';
import { 
    Activity, 
    AlertCircle,
    Loader2,
    TrendingUp,
    Clock,
    CheckCircle,
    Users,
    BarChart3
} from 'lucide-react';

export default function AdminTriageStatsPage() {
    const router = useRouter();
    const { isAuthenticated, role } = useAuthStore();
    const [stats, setStats] = useState<TriageStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        if (role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }
        loadStats();
    }, [isAuthenticated, role]);

    const loadStats = async () => {
        try {
            setLoading(true);
            const data = await getTriageStats();
            setStats(data);
        } catch (err) {
            setError('Erro ao carregar estatísticas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityBgColor = (priority: string): string => {
        switch (priority) {
            case TRIAGE_PRIORITY.EMERGENCY:
                return 'bg-red-500';
            case TRIAGE_PRIORITY.VERY_URGENT:
                return 'bg-orange-500';
            case TRIAGE_PRIORITY.URGENT:
                return 'bg-yellow-500';
            case TRIAGE_PRIORITY.LESS_URGENT:
                return 'bg-green-500';
            case TRIAGE_PRIORITY.NON_URGENT:
                return 'bg-blue-500';
            default:
                return 'bg-gray-500';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Estatísticas de Triagem | Admin | MediSync</title>
            </Head>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <BarChart3 className="w-7 h-7 text-cyan-600" />
                            Estatísticas de Triagem IA
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Visão geral do sistema de triagem inteligente
                        </p>
                    </div>
                    <button
                        onClick={loadStats}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Atualizar
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {stats && (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <Activity className="w-8 h-8 text-cyan-600" />
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Total</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Triagens realizadas</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <TrendingUp className="w-8 h-8 text-emerald-600" />
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Hoje</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.today}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Triagens hoje</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <Clock className="w-8 h-8 text-amber-600" />
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Pendentes</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.by_status?.pending || 0}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Aguardando médico</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Concluídos</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.by_status?.completed || 0}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Casos finalizados</p>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* By Status */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-cyan-600" />
                                    Por Status
                                </h3>
                                <div className="space-y-4">
                                    {Object.entries(stats.by_status || {}).map(([status, count]) => {
                                        const total = stats.total || 1;
                                        const percentage = Math.round((count / total) * 100);
                                        return (
                                            <div key={status}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-600 dark:text-gray-400 capitalize">{status}</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">{count} ({percentage}%)</span>
                                                </div>
                                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-cyan-600 rounded-full transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* By Priority */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-cyan-600" />
                                    Por Prioridade (Manchester)
                                </h3>
                                <div className="space-y-4">
                                    {Object.entries(stats.by_priority || {}).map(([priority, count]) => {
                                        const total = stats.total || 1;
                                        const percentage = Math.round((count / total) * 100);
                                        return (
                                            <div key={priority}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-600 dark:text-gray-400">{priority}</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">{count} ({percentage}%)</span>
                                                </div>
                                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all ${getPriorityBgColor(priority)}`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
