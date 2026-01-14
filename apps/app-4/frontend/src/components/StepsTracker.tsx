import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Footprints, Target, Flame, TrendingUp,
    ChevronLeft, ChevronRight, Award, Zap
} from 'lucide-react';
import { getCheckInHistory, getTodayCheckIn, getMyProfile, createDailyCheckIn, recordMetric } from '@/api/health-profile';

interface DaySteps {
    date: Date;
    steps: number;
    calories: number;
    distance: number; // in km
}

interface StepsTrackerProps {
    compact?: boolean;
    dailyGoal?: number;
}

export function StepsTracker({ compact = false, dailyGoal: propDailyGoal }: StepsTrackerProps) {
    const [weekOffset, setWeekOffset] = useState(0);
    const [dailyGoal, setDailyGoal] = useState(propDailyGoal || 10000);
    const [weekData, setWeekData] = useState<DaySteps[]>([]);
    const [today, setToday] = useState<DaySteps>({ date: new Date(), steps: 0, calories: 0, distance: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load profile for daily goal
            const profile = await getMyProfile();
            if (profile.steps_target) {
                setDailyGoal(profile.steps_target);
            }

            // Load today's check-in
            const todayCheckIn = await getTodayCheckIn();
            if (todayCheckIn) {
                setToday({
                    date: new Date(),
                    steps: todayCheckIn.steps || 0,
                    calories: todayCheckIn.calories_burned || 0,
                    distance: (todayCheckIn.steps || 0) * 0.0008 // ~0.8m per step
                });
            }

            // Load week history
            const history = await getCheckInHistory(7);
            const weekSteps = history.map(h => ({
                date: new Date(h.date),
                steps: h.steps || 0,
                calories: h.calories_burned || 0,
                distance: (h.steps || 0) * 0.0008
            }));
            
            if (weekSteps.length > 0) {
                setWeekData(weekSteps);
            }
        } catch (error) {
            console.error('Error loading steps data:', error);
        }
    };
    const percentage = Math.min((today.steps / dailyGoal) * 100, 100);
    const avgSteps = Math.round(weekData.reduce((acc, d) => acc + d.steps, 0) / weekData.length);
    const totalWeekSteps = weekData.reduce((acc, d) => acc + d.steps, 0);
    const daysGoalMet = weekData.filter(d => d.steps >= dailyGoal).length;

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const formatNumber = (num: number) => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    };

    if (compact) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Footprints className="w-5 h-5 text-emerald-500" />
                        Passos
                    </h3>
                    <span className="text-sm font-medium text-emerald-600">
                        {Math.round(percentage)}%
                    </span>
                </div>
                
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatNumber(today.steps)}
                        </p>
                        <p className="text-xs text-gray-500">de {formatNumber(dailyGoal)}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-500" />
                            {today.calories} cal
                        </span>
                        <span>{today.distance} km</span>
                    </div>
                </div>

                <div className="mt-3 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                    />
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
                            <Footprints className="w-5 h-5 text-emerald-500" />
                            Contador de Passos
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Meta diária: {formatNumber(dailyGoal)} passos
                        </p>
                    </div>
                </div>
            </div>

            {/* Today's Progress */}
            <div className="p-6">
                <div className="flex items-center gap-6">
                    {/* Circular Progress */}
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="none"
                                className="text-gray-100 dark:text-gray-700"
                            />
                            <motion.circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="url(#gradient)"
                                strokeWidth="12"
                                fill="none"
                                strokeLinecap="round"
                                initial={{ strokeDasharray: '0 352' }}
                                animate={{ strokeDasharray: `${(percentage / 100) * 352} 352` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#34d399" />
                                    <stop offset="100%" stopColor="#10b981" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Footprints className="w-6 h-6 text-emerald-500 mb-1" />
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatNumber(today.steps)}
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                                <div className="flex items-center gap-2 text-orange-600 mb-1">
                                    <Flame className="w-4 h-4" />
                                    <span className="text-xs">Calorias</span>
                                </div>
                                <p className="text-lg font-bold text-orange-700 dark:text-orange-400">
                                    {today.calories}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <div className="flex items-center gap-2 text-blue-600 mb-1">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="text-xs">Distância</span>
                                </div>
                                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                                    {today.distance} km
                                </p>
                            </div>
                        </div>

                        {percentage >= 100 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center gap-2"
                            >
                                <Award className="w-5 h-5 text-emerald-500" />
                                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                    Meta atingida! 🎉
                                </span>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Week Chart */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Últimos 7 dias
                    </h4>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setWeekOffset(prev => prev - 1)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                            onClick={() => setWeekOffset(prev => Math.min(prev + 1, 0))}
                            disabled={weekOffset >= 0}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    {weekData.slice(0, 7).reverse().map((day, i) => {
                        const heightPercent = (day.steps / dailyGoal) * 100;
                        const dayIndex = day.date.getDay();
                        const isGoalMet = day.steps >= dailyGoal;
                        
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center">
                                <div className="w-full h-20 bg-gray-100 dark:bg-gray-700 rounded-lg relative overflow-hidden">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${Math.min(heightPercent, 100)}%` }}
                                        className={`absolute bottom-0 w-full rounded-lg ${
                                            isGoalMet 
                                                ? 'bg-gradient-to-t from-emerald-500 to-emerald-400' 
                                                : 'bg-gradient-to-t from-gray-400 to-gray-300'
                                        }`}
                                    />
                                    {isGoalMet && (
                                        <div className="absolute top-1 left-1/2 -translate-x-1/2">
                                            <Zap className="w-3 h-3 text-amber-400" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{weekDays[dayIndex]}</p>
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {formatNumber(day.steps)}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Week Summary */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 grid grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-xs text-gray-500 mb-1">Total Semana</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatNumber(totalWeekSteps)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 mb-1">Média Diária</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatNumber(avgSteps)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 mb-1">Metas Batidas</p>
                    <p className="text-lg font-bold text-emerald-600">
                        {daysGoalMet}/7
                    </p>
                </div>
            </div>
        </div>
    );
}

export default StepsTracker;
