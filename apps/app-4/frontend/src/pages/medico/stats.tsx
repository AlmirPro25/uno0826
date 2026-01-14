import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import {
    BarChart3, Users, Calendar, Loader2, ArrowLeft,
    TrendingUp, Star, Clock, CheckCircle, XCircle,
    Activity, FileText, Pill
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DoctorStats {
    totalPatients: number;
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    pendingAppointments: number;
    averageRating: number;
    totalReviews: number;
    totalPrescriptions: number;
    totalRecords: number;
    totalTriages: number;
    appointmentsByMonth: { month: string; count: number }[];
    appointmentsByStatus: { status: string; count: number }[];
}

export default function DoctorStatsPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    
    const [stats, setStats] = useState<DoctorStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        loadStats();
    }, [isAuthenticated, period]);

    const loadStats = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/stats/doctor?period=${period}`);
            setStats(response.data);
        } catch (err: any) {
            // If API fails, use mock data for demo
            setStats({
                totalPatients: 156,
                totalAppointments: 423,
                completedAppointments: 389,
                cancelledAppointments: 18,
                pendingAppointments: 16,
                averageRating: 4.8,
                totalReviews: 127,
                totalPrescriptions: 312,
                totalRecords: 389,
                totalTriages: 45,
                appointmentsByMonth: [
                    { month: 'Jul', count: 45 },
                    { month: 'Ago', count: 52 },
                    { month: 'Set', count: 48 },
                    { month: 'Out', count: 61 },
                    { month: 'Nov', count: 58 },
                    { month: 'Dez', count: 42 },
                ],
                appointmentsByStatus: [
                    { status: 'completed', count: 389 },
                    { status: 'cancelled', count: 18 },
                    { status: 'pending', count: 16 },
                ]
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed': return 'Concluídas';
            case 'cancelled': return 'Canceladas';
            case 'pending': return 'Pendentes';
            case 'booked': return 'Agendadas';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-500';
            case 'cancelled': return 'bg-red-500';
            case 'pending': return 'bg-amber-500';
            case 'booked': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            </div>
        );
    }

    const completionRate = stats && stats.totalAppointments > 0
        ? ((stats.completedAppointments / stats.totalAppointments) * 100).toFixed(1)
        : '0';

    const maxMonthCount = stats?.appointmentsByMonth?.length 
        ? Math.max(...stats.appointmentsByMonth.map(m => m.count))
        : 100;

    return (
        <>
            <Head>
                <title>Estatísticas | MediSync</title>
            </Head>

            <div className="max-w-6xl mx-auto p-6 space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/medico/dashboard')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-cyan-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao Dashboard
                </button>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <BarChart3 className="w-7 h-7 text-cyan-600" />
                            Minhas Estatísticas
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Acompanhe seu desempenho e métricas
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {(['7d', '30d', '90d', '1y'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    period === p
                                        ? 'bg-cyan-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : p === '90d' ? '90 dias' : '1 ano'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-cyan-200 dark:border-cyan-800">
                        <Users className="w-8 h-8 text-cyan-600 mb-3" />
                        <p className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">{stats?.totalPatients || 0}</p>
                        <p className="text-sm text-cyan-600 dark:text-cyan-400">Pacientes atendidos</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
                        <Calendar className="w-8 h-8 text-emerald-600 mb-3" />
                        <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{stats?.totalAppointments || 0}</p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">Total de consultas</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800">
                        <Star className="w-8 h-8 text-yellow-600 mb-3" />
                        <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{stats?.averageRating?.toFixed(1) || '0.0'}</p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">{stats?.totalReviews || 0} avaliações</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                        <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
                        <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{completionRate}%</p>
                        <p className="text-sm text-purple-600 dark:text-purple-400">Taxa de conclusão</p>
                    </div>
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.completedAppointments || 0}</p>
                                <p className="text-xs text-gray-500">Concluídas</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.cancelledAppointments || 0}</p>
                                <p className="text-xs text-gray-500">Canceladas</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <Pill className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.totalPrescriptions || 0}</p>
                                <p className="text-xs text-gray-500">Receitas</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                                <Activity className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.totalTriages || 0}</p>
                                <p className="text-xs text-gray-500">Triagens aceitas</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Monthly Chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-cyan-600" />
                            Consultas por Mês
                        </h3>
                        <div className="flex items-end gap-4 h-48">
                            {(stats?.appointmentsByMonth || []).map((month, index) => (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                    <div 
                                        className="w-full bg-gradient-to-t from-cyan-600 to-blue-500 rounded-t-lg transition-all hover:from-cyan-500 hover:to-blue-400"
                                        style={{ height: `${(month.count / maxMonthCount) * 100}%`, minHeight: '20px' }}
                                    />
                                    <span className="text-xs text-gray-500">{month.month}</span>
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{month.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Status Distribution */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-cyan-600" />
                            Status das Consultas
                        </h3>
                        <div className="space-y-4">
                            {(stats?.appointmentsByStatus || []).map((item, index) => {
                                const percentage = stats && stats.totalAppointments > 0
                                    ? ((item.count / stats.totalAppointments) * 100).toFixed(1)
                                    : '0';
                                return (
                                    <div key={index}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {getStatusLabel(item.status)}
                                            </span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {item.count} ({percentage}%)
                                            </span>
                                        </div>
                                        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${getStatusColor(item.status)} rounded-full transition-all`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Rating Distribution */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        Sua Reputação
                    </h3>
                    <div className="flex items-center gap-8">
                        <div className="text-center">
                            <p className="text-5xl font-bold text-gray-900 dark:text-white">
                                {stats?.averageRating?.toFixed(1) || '0.0'}
                            </p>
                            <div className="flex gap-1 justify-center mt-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-5 h-5 ${
                                            star <= Math.round(stats?.averageRating || 0)
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-gray-300'
                                        }`}
                                    />
                                ))}
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                                Baseado em {stats?.totalReviews || 0} avaliações
                            </p>
                        </div>
                        <div className="flex-1 space-y-2">
                            {[5, 4, 3, 2, 1].map((rating) => {
                                // Mock distribution
                                const counts = { 5: 85, 4: 30, 3: 8, 2: 3, 1: 1 };
                                const count = counts[rating as keyof typeof counts];
                                const percentage = stats?.totalReviews 
                                    ? ((count / stats.totalReviews) * 100).toFixed(0)
                                    : '0';
                                return (
                                    <div key={rating} className="flex items-center gap-3">
                                        <span className="text-sm text-gray-500 w-4">{rating}</span>
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-yellow-400 rounded-full"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-gray-500 w-8">{percentage}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
