import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import { RealTimeStats } from '@/components/admin/RealTimeStats';
import {
    BarChart3,
    Users,
    Calendar,
    Brain,
    Building2,
    DollarSign,
    Star,
    Loader2,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw
} from 'lucide-react';

interface AnalyticsData {
    overview: {
        total_users: number;
        total_patients: number;
        total_doctors: number;
        total_appointments: number;
        total_triages: number;
        total_clinics: number;
        growth_users: number;
        growth_appointments: number;
    };
    appointments: {
        completed: number;
        cancelled: number;
        pending: number;
        completion_rate: number;
    };
    triages: {
        total: number;
        by_priority: Record<string, number>;
        avg_response_time: number;
        conversion_rate: number;
    };
    revenue: {
        total: number;
        this_month: number;
        growth: number;
    };
    satisfaction: {
        avg_rating: number;
        total_reviews: number;
        nps: number;
    };
}

export default function AdminAnalyticsPage() {
    const router = useRouter();
    const { isAuthenticated, role } = useAuthStore();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        if (role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }
        loadAnalytics();
    }, [isAuthenticated, role, period]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            // Simulated data - in production, this would come from the backend
            const mockData: AnalyticsData = {
                overview: {
                    total_users: 1247,
                    total_patients: 1089,
                    total_doctors: 142,
                    total_appointments: 3456,
                    total_triages: 892,
                    total_clinics: 45,
                    growth_users: 12.5,
                    growth_appointments: 8.3
                },
                appointments: {
                    completed: 2890,
                    cancelled: 234,
                    pending: 332,
                    completion_rate: 83.6
                },
                triages: {
                    total: 892,
                    by_priority: {
                        'Emergência': 45,
                        'Muito Urgente': 123,
                        'Urgente': 289,
                        'Pouco Urgente': 312,
                        'Não Urgente': 123
                    },
                    avg_response_time: 4.2,
                    conversion_rate: 67.8
                },
                revenue: {
                    total: 125000,
                    this_month: 18500,
                    growth: 15.2
                },
                satisfaction: {
                    avg_rating: 4.7,
                    total_reviews: 1234,
                    nps: 72
                }
            };
            
            // Try to get real stats from backend
            try {
                const response = await axiosInstance.get('/stats/admin');
                if (response.data) {
                    mockData.overview.total_users = response.data.total_users || mockData.overview.total_users;
                    mockData.overview.total_appointments = response.data.total_appointments || mockData.overview.total_appointments;
                }
            } catch (e) {
                // Use mock data if backend fails
            }

            setData(mockData);
        } catch (err) {
            setError('Erro ao carregar analytics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('pt-BR').format(value);
    };

    const GrowthIndicator = ({ value }: { value: number }) => {
        const isPositive = value >= 0;
        return (
            <span className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(value).toFixed(1)}%
            </span>
        );
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
                <title>Analytics | Admin | MediSync</title>
            </Head>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <BarChart3 className="w-7 h-7 text-cyan-600" />
                            Analytics
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Métricas e insights do sistema
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value as any)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="7d">Últimos 7 dias</option>
                            <option value="30d">Últimos 30 dias</option>
                            <option value="90d">Últimos 90 dias</option>
                            <option value="1y">Último ano</option>
                        </select>
                        <button
                            onClick={loadAnalytics}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {/* Real-Time Stats */}
                <div className="mb-6">
                    <RealTimeStats refreshInterval={30000} />
                </div>

                {data && (
                    <>
                        {/* Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <Users className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <GrowthIndicator value={data.overview.growth_users} />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatNumber(data.overview.total_users)}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Usuários totais</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                        <Calendar className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <GrowthIndicator value={data.overview.growth_appointments} />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatNumber(data.overview.total_appointments)}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Consultas realizadas</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <Brain className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <span className="text-sm text-gray-500">{data.triages.conversion_rate}% conv.</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatNumber(data.overview.total_triages)}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Triagens IA</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                        <DollarSign className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <GrowthIndicator value={data.revenue.growth} />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(data.revenue.this_month)}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Receita este mês</p>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Appointments Status */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-cyan-600" />
                                    Status das Consultas
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600 dark:text-gray-400">Concluídas</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {formatNumber(data.appointments.completed)}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-emerald-500 rounded-full"
                                                style={{ width: `${(data.appointments.completed / data.overview.total_appointments) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600 dark:text-gray-400">Pendentes</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {formatNumber(data.appointments.pending)}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-amber-500 rounded-full"
                                                style={{ width: `${(data.appointments.pending / data.overview.total_appointments) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600 dark:text-gray-400">Canceladas</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {formatNumber(data.appointments.cancelled)}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-red-500 rounded-full"
                                                style={{ width: `${(data.appointments.cancelled / data.overview.total_appointments) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Taxa de conclusão</span>
                                        <span className="text-lg font-bold text-emerald-600">
                                            {data.appointments.completion_rate}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Triage by Priority */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-cyan-600" />
                                    Triagens por Prioridade
                                </h3>
                                <div className="space-y-3">
                                    {Object.entries(data.triages.by_priority).map(([priority, count]) => {
                                        const colors: Record<string, string> = {
                                            'Emergência': 'bg-red-500',
                                            'Muito Urgente': 'bg-orange-500',
                                            'Urgente': 'bg-yellow-500',
                                            'Pouco Urgente': 'bg-green-500',
                                            'Não Urgente': 'bg-blue-500'
                                        };
                                        const percentage = (count / data.triages.total) * 100;
                                        return (
                                            <div key={priority}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-600 dark:text-gray-400">{priority}</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {count} ({percentage.toFixed(1)}%)
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${colors[priority] || 'bg-gray-500'}`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Tempo médio de resposta</p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                            {data.triages.avg_response_time}min
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Taxa de conversão</p>
                                        <p className="text-lg font-bold text-cyan-600">
                                            {data.triages.conversion_rate}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* User Distribution */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                                    Distribuição de Usuários
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Pacientes</span>
                                        </div>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatNumber(data.overview.total_patients)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-cyan-500 rounded-full" />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Médicos</span>
                                        </div>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatNumber(data.overview.total_doctors)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-purple-500 rounded-full" />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Admins</span>
                                        </div>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {data.overview.total_users - data.overview.total_patients - data.overview.total_doctors}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Clinics */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-cyan-600" />
                                    Clínicas Parceiras
                                </h3>
                                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                    {data.overview.total_clinics}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    clínicas cadastradas
                                </p>
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-500">Receita total de clínicas</p>
                                    <p className="text-xl font-bold text-emerald-600">
                                        {formatCurrency(data.revenue.total)}
                                    </p>
                                </div>
                            </div>

                            {/* Satisfaction */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-amber-500" />
                                    Satisfação
                                </h3>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="text-4xl font-bold text-gray-900 dark:text-white">
                                        {data.satisfaction.avg_rating}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-5 h-5 ${
                                                    star <= Math.round(data.satisfaction.avg_rating)
                                                        ? 'text-amber-500 fill-current'
                                                        : 'text-gray-300'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    {formatNumber(data.satisfaction.total_reviews)} avaliações
                                </p>
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">NPS Score</span>
                                        <span className={`text-lg font-bold ${
                                            data.satisfaction.nps >= 50 ? 'text-emerald-600' : 
                                            data.satisfaction.nps >= 0 ? 'text-amber-600' : 'text-red-600'
                                        }`}>
                                            {data.satisfaction.nps}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
