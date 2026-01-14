import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, Calendar, Activity, TrendingUp, TrendingDown,
    Clock, CheckCircle, AlertTriangle, Stethoscope, Building2
} from 'lucide-react';

interface StatCard {
    id: string;
    title: string;
    value: number;
    change: number;
    changeType: 'increase' | 'decrease' | 'neutral';
    icon: React.ElementType;
    color: string;
    bgColor: string;
}

interface RealTimeStatsProps {
    refreshInterval?: number;
}

export function RealTimeStats({ refreshInterval = 30000 }: RealTimeStatsProps) {
    const [stats, setStats] = useState<StatCard[]>([
        {
            id: 'users_online',
            title: 'Usuários Online',
            value: 127,
            change: 12,
            changeType: 'increase',
            icon: Users,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10'
        },
        {
            id: 'appointments_today',
            title: 'Consultas Hoje',
            value: 48,
            change: 5,
            changeType: 'increase',
            icon: Calendar,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10'
        },
        {
            id: 'triages_pending',
            title: 'Triagens Pendentes',
            value: 15,
            change: -3,
            changeType: 'decrease',
            icon: Activity,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10'
        },
        {
            id: 'queue_waiting',
            title: 'Na Fila de Espera',
            value: 23,
            change: 2,
            changeType: 'increase',
            icon: Clock,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10'
        },
        {
            id: 'doctors_available',
            title: 'Médicos Disponíveis',
            value: 18,
            change: 0,
            changeType: 'neutral',
            icon: Stethoscope,
            color: 'text-cyan-500',
            bgColor: 'bg-cyan-500/10'
        },
        {
            id: 'clinics_active',
            title: 'Clínicas Ativas',
            value: 42,
            change: 1,
            changeType: 'increase',
            icon: Building2,
            color: 'text-pink-500',
            bgColor: 'bg-pink-500/10'
        }
    ]);

    const [lastUpdate, setLastUpdate] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            // Simulate real-time updates
            setStats(prev => prev.map(stat => ({
                ...stat,
                value: stat.value + Math.floor(Math.random() * 5) - 2,
                change: Math.floor(Math.random() * 10) - 5,
                changeType: Math.random() > 0.5 ? 'increase' : Math.random() > 0.5 ? 'decrease' : 'neutral'
            })));
            setLastUpdate(new Date());
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [refreshInterval]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Estatísticas em Tempo Real
                </h2>
                <span className="text-sm text-gray-500">
                    Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                    >
                        <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                        <div className="flex items-end justify-between mt-1">
                            <motion.span
                                key={stat.value}
                                initial={{ scale: 1.2 }}
                                animate={{ scale: 1 }}
                                className="text-2xl font-bold text-gray-900 dark:text-white"
                            >
                                {stat.value}
                            </motion.span>
                            <span className={`flex items-center text-xs ${
                                stat.changeType === 'increase' ? 'text-emerald-500' :
                                stat.changeType === 'decrease' ? 'text-red-500' :
                                'text-gray-400'
                            }`}>
                                {stat.changeType === 'increase' && <TrendingUp className="w-3 h-3 mr-0.5" />}
                                {stat.changeType === 'decrease' && <TrendingDown className="w-3 h-3 mr-0.5" />}
                                {stat.change > 0 ? '+' : ''}{stat.change}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Live Activity Feed */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Atividade Recente
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {[
                        { icon: CheckCircle, text: 'Consulta finalizada - Dr. João Silva', time: '2 min', color: 'text-emerald-500' },
                        { icon: Activity, text: 'Nova triagem recebida - Prioridade Alta', time: '5 min', color: 'text-amber-500' },
                        { icon: Users, text: 'Novo paciente cadastrado', time: '8 min', color: 'text-blue-500' },
                        { icon: Calendar, text: 'Consulta agendada - Dra. Maria Santos', time: '12 min', color: 'text-cyan-500' },
                        { icon: AlertTriangle, text: 'Triagem emergencial - Encaminhada', time: '15 min', color: 'text-red-500' },
                    ].map((activity, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                            <activity.icon className={`w-4 h-4 ${activity.color}`} />
                            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{activity.text}</span>
                            <span className="text-xs text-gray-400">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default RealTimeStats;
