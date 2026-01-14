import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Users, Calendar, Star, TrendingUp,
    Clock, CheckCircle, FileText, Pill,
    Activity, Award
} from 'lucide-react';

interface DoctorStatsProps {
    compact?: boolean;
    period?: '7d' | '30d' | '90d' | '1y';
}

export function DoctorStats({ compact = false, period = '30d' }: DoctorStatsProps) {
    const [selectedPeriod, setSelectedPeriod] = useState(period);

    // Mock stats data
    const stats = {
        '7d': {
            patients: 28,
            patientsChange: 12,
            consultations: 32,
            consultationsChange: 8,
            rating: 4.9,
            ratingChange: 0.1,
            completionRate: 96,
            avgDuration: 25,
            prescriptions: 18,
            records: 32,
            triages: 15
        },
        '30d': {
            patients: 124,
            patientsChange: 15,
            consultations: 156,
            consultationsChange: 12,
            rating: 4.8,
            ratingChange: 0.2,
            completionRate: 94,
            avgDuration: 28,
            prescriptions: 89,
            records: 156,
            triages: 67
        },
        '90d': {
            patients: 342,
            patientsChange: 18,
            consultations: 428,
            consultationsChange: 10,
            rating: 4.8,
            ratingChange: 0.1,
            completionRate: 93,
            avgDuration: 27,
            prescriptions: 245,
            records: 428,
            triages: 189
        },
        '1y': {
            patients: 1250,
            patientsChange: 22,
            consultations: 1580,
            consultationsChange: 15,
            rating: 4.7,
            ratingChange: 0.3,
            completionRate: 92,
            avgDuration: 26,
            prescriptions: 920,
            records: 1580,
            triages: 720
        }
    };

    const currentStats = stats[selectedPeriod];

    const mainStats = [
        { 
            label: 'Pacientes', 
            value: currentStats.patients, 
            change: currentStats.patientsChange,
            icon: Users, 
            color: 'text-cyan-500',
            bgColor: 'bg-cyan-100 dark:bg-cyan-900/30'
        },
        { 
            label: 'Consultas', 
            value: currentStats.consultations, 
            change: currentStats.consultationsChange,
            icon: Calendar, 
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
        },
        { 
            label: 'Avaliação', 
            value: currentStats.rating.toFixed(1), 
            change: currentStats.ratingChange,
            icon: Star, 
            color: 'text-amber-500',
            bgColor: 'bg-amber-100 dark:bg-amber-900/30',
            suffix: '/5'
        },
        { 
            label: 'Taxa Conclusão', 
            value: currentStats.completionRate, 
            change: 2,
            icon: CheckCircle, 
            color: 'text-purple-500',
            bgColor: 'bg-purple-100 dark:bg-purple-900/30',
            suffix: '%'
        },
    ];

    const secondaryStats = [
        { label: 'Tempo Médio', value: `${currentStats.avgDuration}min`, icon: Clock },
        { label: 'Receitas', value: currentStats.prescriptions, icon: Pill },
        { label: 'Prontuários', value: currentStats.records, icon: FileText },
        { label: 'Triagens', value: currentStats.triages, icon: Activity },
    ];

    if (compact) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-cyan-600" />
                        Estatísticas
                    </h3>
                    <select
                        value={selectedPeriod}
                        onChange={e => setSelectedPeriod(e.target.value as typeof selectedPeriod)}
                        className="text-xs bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-2 py-1"
                    >
                        <option value="7d">7 dias</option>
                        <option value="30d">30 dias</option>
                        <option value="90d">90 dias</option>
                        <option value="1y">1 ano</option>
                    </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    {mainStats.slice(0, 4).map((stat, i) => (
                        <div key={i} className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stat.value}{stat.suffix || ''}
                            </p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-cyan-600" />
                            Suas Estatísticas
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Acompanhe seu desempenho
                        </p>
                    </div>
                    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        {(['7d', '30d', '90d', '1y'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setSelectedPeriod(p)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    selectedPeriod === p
                                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                {p === '1y' ? '1 ano' : p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Stats */}
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {mainStats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50"
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.bgColor}`}>
                                <Icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stat.value}{stat.suffix || ''}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                                <p className="text-sm text-gray-500">{stat.label}</p>
                                <span className="text-xs text-emerald-500 flex items-center gap-0.5">
                                    <TrendingUp className="w-3 h-3" />
                                    +{stat.change}%
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Secondary Stats */}
            <div className="px-6 pb-6">
                <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    {secondaryStats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div key={i} className="text-center">
                                <Icon className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {stat.value}
                                </p>
                                <p className="text-xs text-gray-500">{stat.label}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Achievement */}
            <div className="px-6 pb-6">
                <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                            Top 10% dos médicos
                        </p>
                        <p className="text-sm text-gray-500">
                            Sua avaliação está acima da média da plataforma
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DoctorStats;
