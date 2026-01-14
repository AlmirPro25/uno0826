import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Heart, Activity, Pill, Calendar, FileText,
    TrendingUp, TrendingDown, Minus, ChevronRight,
    AlertTriangle, CheckCircle, Clock, Syringe
} from 'lucide-react';
import { getHealthSummary, HealthSummary as HealthSummaryType, getScoreColor, getScoreGradient } from '@/api/health-profile';

interface HealthSummaryData {
    healthScore: number;
    healthTrend: 'up' | 'down' | 'stable';
    upcomingAppointments: number;
    pendingMedications: number;
    pendingExams: number;
    overdueVaccines: number;
    lastCheckup: string | null;
    alerts: { type: 'warning' | 'info' | 'success'; message: string }[];
}

interface HealthSummaryProps {
    compact?: boolean;
}

export function HealthSummary({ compact = false }: HealthSummaryProps) {
    const [data, setData] = useState<HealthSummaryData>({
        healthScore: 50,
        healthTrend: 'stable',
        upcomingAppointments: 0,
        pendingMedications: 0,
        pendingExams: 0,
        overdueVaccines: 0,
        lastCheckup: null,
        alerts: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSummary();
    }, []);

    const loadSummary = async () => {
        try {
            const summary = await getHealthSummary();
            setData({
                healthScore: summary.healthScore || 50,
                healthTrend: summary.healthTrend || 'stable',
                upcomingAppointments: 0, // Will be loaded from appointments API
                pendingMedications: summary.pendingMedications || 0,
                pendingExams: summary.pendingExams || 0,
                overdueVaccines: summary.overdueVaccines || 0,
                lastCheckup: summary.profile?.last_triage_date || null,
                alerts: (summary.alerts || []).map(a => ({
                    type: a.type as 'warning' | 'info' | 'success',
                    message: a.message
                }))
            });
        } catch (error) {
            console.error('Error loading health summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const TrendIcon = data.healthTrend === 'up' 
        ? TrendingUp 
        : data.healthTrend === 'down' 
            ? TrendingDown 
            : Minus;

    if (compact) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Heart className="w-5 h-5 text-rose-500" />
                        Resumo de Saúde
                    </h3>
                    <Link href="/paciente/health" className="text-cyan-600 hover:underline text-sm">
                        Ver mais
                    </Link>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className={`text-3xl font-bold ${getScoreColor(data.healthScore)}`}>
                        {data.healthScore}
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <Calendar className="w-4 h-4 mx-auto mb-1 text-cyan-500" />
                            <span className="text-gray-600 dark:text-gray-400">{data.upcomingAppointments}</span>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <Pill className="w-4 h-4 mx-auto mb-1 text-pink-500" />
                            <span className="text-gray-600 dark:text-gray-400">{data.pendingMedications}</span>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <FileText className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                            <span className="text-gray-600 dark:text-gray-400">{data.pendingExams}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header with Score */}
            <div className={`bg-gradient-to-r ${getScoreGradient(data.healthScore)} p-6 text-white`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white/80 text-sm">Seu Score de Saúde</p>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-5xl font-bold">{data.healthScore}</span>
                            <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-sm">
                                <TrendIcon className="w-4 h-4" />
                                {data.healthTrend === 'up' ? 'Melhorando' : 
                                 data.healthTrend === 'down' ? 'Atenção' : 'Estável'}
                            </div>
                        </div>
                    </div>
                    <Heart className="w-16 h-16 text-white/30" />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 divide-x divide-gray-200 dark:divide-gray-700 border-b border-gray-200 dark:border-gray-700">
                <Link href="/paciente/my-appointments" className="p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <Calendar className="w-6 h-6 mx-auto mb-2 text-cyan-500" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.upcomingAppointments}</p>
                    <p className="text-xs text-gray-500">Consultas</p>
                </Link>
                <Link href="/paciente/medications" className="p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <Pill className="w-6 h-6 mx-auto mb-2 text-pink-500" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.pendingMedications}</p>
                    <p className="text-xs text-gray-500">Medicamentos</p>
                </Link>
                <Link href="/paciente/exams" className="p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <FileText className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.pendingExams}</p>
                    <p className="text-xs text-gray-500">Exames</p>
                </Link>
                <Link href="/paciente/vaccines" className="p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <Syringe className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.overdueVaccines}</p>
                    <p className="text-xs text-gray-500">Vacinas</p>
                </Link>
            </div>

            {/* Alerts */}
            {data.alerts.length > 0 && (
                <div className="p-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Alertas</h4>
                    {data.alerts.map((alert, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-center gap-3 p-3 rounded-xl ${
                                alert.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' :
                                alert.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' :
                                'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            }`}
                        >
                            {alert.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                             alert.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
                             <Clock className="w-5 h-5" />}
                            <span className="text-sm">{alert.message}</span>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Last Checkup */}
            {data.lastCheckup && (
                <div className="px-4 pb-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Último check-up</p>
                                <p className="text-xs text-gray-500">
                                    {new Date(data.lastCheckup).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        </div>
                        <Link href="/paciente/medical-history" className="text-cyan-600 hover:underline text-sm flex items-center gap-1">
                            Ver histórico <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HealthSummary;
