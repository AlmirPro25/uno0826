import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Calendar, Pill, FileText, Activity, Video,
    MessageSquare, Star, Clock, ChevronRight,
    Stethoscope, ClipboardCheck, Syringe
} from 'lucide-react';
import { axiosInstance } from '@/api/axios';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityItem {
    id: number;
    type: 'appointment' | 'triage' | 'prescription' | 'exam' | 'vaccine' | 'message' | 'review' | 'medication';
    title: string;
    description: string;
    timestamp: string;
    link?: string;
    metadata?: Record<string, any>;
}

interface RecentActivityProps {
    limit?: number;
    showHeader?: boolean;
}

export function RecentActivity({ limit = 5, showHeader = true }: RecentActivityProps) {
    const [activities, setActivities] = useState<ActivityItem[]>([
        {
            id: 1,
            type: 'appointment',
            title: 'Consulta realizada',
            description: 'Consulta com Dr. João Silva - Cardiologia',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            link: '/paciente/my-appointments'
        },
        {
            id: 2,
            type: 'triage',
            title: 'Triagem concluída',
            description: 'Classificação: Urgente - Dor no peito',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            link: '/paciente/triagens'
        },
        {
            id: 3,
            type: 'medication',
            title: 'Medicamento tomado',
            description: 'Losartana 50mg - Dose da manhã',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            link: '/paciente/medications'
        },
        {
            id: 4,
            type: 'prescription',
            title: 'Nova receita',
            description: 'Receita emitida por Dra. Maria Santos',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            link: '/paciente/prescriptions'
        },
        {
            id: 5,
            type: 'exam',
            title: 'Resultado disponível',
            description: 'Hemograma completo - Resultados prontos',
            timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            link: '/paciente/exams'
        }
    ]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadActivities();
    }, []);

    const loadActivities = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/activity/recent', { params: { limit } });
            if (response.data) setActivities(response.data);
        } catch (error) {
            // Use mock data
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'appointment': return Calendar;
            case 'triage': return ClipboardCheck;
            case 'prescription': return FileText;
            case 'exam': return Activity;
            case 'vaccine': return Syringe;
            case 'message': return MessageSquare;
            case 'review': return Star;
            case 'medication': return Pill;
            default: return Clock;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'appointment': return 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400';
            case 'triage': return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
            case 'prescription': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
            case 'exam': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
            case 'vaccine': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'message': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
            case 'review': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'medication': return 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400';
            default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
        }
    };

    const formatTime = (timestamp: string) => {
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ptBR });
        } catch {
            return timestamp;
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {showHeader && (
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-cyan-600" />
                        Atividade Recente
                    </h3>
                </div>
            )}

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {activities.slice(0, limit).map((activity, index) => {
                    const Icon = getActivityIcon(activity.type);
                    const colorClass = getActivityColor(activity.type);

                    return (
                        <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            {activity.link ? (
                                <Link
                                    href={activity.link}
                                    className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white truncate">
                                            {activity.title}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {activity.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                            {formatTime(activity.timestamp)}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </div>
                                </Link>
                            ) : (
                                <div className="flex items-center gap-4 p-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white truncate">
                                            {activity.title}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {activity.description}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                        {formatTime(activity.timestamp)}
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {activities.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma atividade recente</p>
                </div>
            )}
        </div>
    );
}

export default RecentActivity;
