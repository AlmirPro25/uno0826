import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Moon, Sun, Clock, TrendingUp, 
    Star, Zap, Coffee, ChevronLeft, ChevronRight
} from 'lucide-react';
import { getCheckInHistory, getTodayCheckIn, getMyProfile } from '@/api/health-profile';

interface SleepLog {
    id: string;
    date: Date;
    bedtime: string;
    wakeTime: string;
    duration: number; // in minutes
    quality: 1 | 2 | 3 | 4 | 5;
}

interface SleepTrackerProps {
    compact?: boolean;
    dailyGoal?: number; // in hours
}

export function SleepTracker({ compact = false, dailyGoal: propDailyGoal }: SleepTrackerProps) {
    const [weekOffset, setWeekOffset] = useState(0);
    const [dailyGoal, setDailyGoal] = useState(propDailyGoal || 8);
    const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
    const [lastNight, setLastNight] = useState<SleepLog | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load profile for daily goal
            const profile = await getMyProfile();
            if (profile.sleep_target_hours) {
                setDailyGoal(profile.sleep_target_hours);
            }

            // Load today's check-in for last night
            const todayCheckIn = await getTodayCheckIn();
            if (todayCheckIn && todayCheckIn.sleep_hours > 0) {
                setLastNight({
                    id: todayCheckIn.id.toString(),
                    date: new Date(),
                    bedtime: todayCheckIn.bed_time || '23:00',
                    wakeTime: todayCheckIn.woke_up_time || '07:00',
                    duration: todayCheckIn.sleep_hours * 60,
                    quality: (todayCheckIn.sleep_quality || 3) as 1 | 2 | 3 | 4 | 5
                });
            }

            // Load week history
            const history = await getCheckInHistory(7);
            const logs = history.filter(h => h.sleep_hours > 0).map(h => ({
                id: h.id.toString(),
                date: new Date(h.date),
                bedtime: h.bed_time || '23:00',
                wakeTime: h.woke_up_time || '07:00',
                duration: h.sleep_hours * 60,
                quality: (h.sleep_quality || 3) as 1 | 2 | 3 | 4 | 5
            }));
            
            if (logs.length > 0) {
                setSleepLogs(logs);
                if (!lastNight) {
                    setLastNight(logs[0]);
                }
            }
        } catch (error) {
            console.error('Error loading sleep data:', error);
        }
    };
    const avgDuration = sleepLogs.reduce((acc, log) => acc + log.duration, 0) / sleepLogs.length;
    const avgQuality = sleepLogs.reduce((acc, log) => acc + log.quality, 0) / sleepLogs.length;
    const goalMinutes = dailyGoal * 60;

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const getQualityLabel = (quality: number) => {
        if (quality >= 4.5) return 'Excelente';
        if (quality >= 3.5) return 'Bom';
        if (quality >= 2.5) return 'Regular';
        return 'Ruim';
    };

    const getQualityColor = (quality: number) => {
        if (quality >= 4) return 'text-emerald-500';
        if (quality >= 3) return 'text-cyan-500';
        if (quality >= 2) return 'text-amber-500';
        return 'text-red-500';
    };

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    if (compact) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Moon className="w-5 h-5 text-indigo-500" />
                        Sono
                    </h3>
                    <span className={`text-sm font-medium ${getQualityColor(lastNight?.quality || 0)}`}>
                        {getQualityLabel(lastNight?.quality || 0)}
                    </span>
                </div>
                
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatDuration(lastNight?.duration || 0)}
                        </p>
                        <p className="text-xs text-gray-500">última noite</p>
                    </div>
                    <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                                key={star}
                                className={`w-4 h-4 ${
                                    star <= (lastNight?.quality || 0) 
                                        ? 'text-amber-400 fill-amber-400' 
                                        : 'text-gray-300'
                                }`}
                            />
                        ))}
                    </div>
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
                            <Moon className="w-5 h-5 text-indigo-500" />
                            Acompanhamento do Sono
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Meta: {dailyGoal} horas por noite
                        </p>
                    </div>
                </div>
            </div>

            {/* Last Night Summary */}
            <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                <p className="text-sm text-gray-500 mb-2">Última noite</p>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-4xl font-bold text-gray-900 dark:text-white">
                            {formatDuration(lastNight?.duration || 0)}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <Moon className="w-4 h-4" />
                                {lastNight?.bedtime}
                            </span>
                            <span className="flex items-center gap-1">
                                <Sun className="w-4 h-4" />
                                {lastNight?.wakeTime}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map(star => (
                                <Star 
                                    key={star}
                                    className={`w-5 h-5 ${
                                        star <= (lastNight?.quality || 0) 
                                            ? 'text-amber-400 fill-amber-400' 
                                            : 'text-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                        <p className={`text-sm font-medium ${getQualityColor(lastNight?.quality || 0)}`}>
                            {getQualityLabel(lastNight?.quality || 0)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="p-4 grid grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-indigo-500" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatDuration(Math.round(avgDuration))}
                    </p>
                    <p className="text-xs text-gray-500">Média</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                    <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {Math.round((avgDuration / goalMinutes) * 100)}%
                    </p>
                    <p className="text-xs text-gray-500">Da meta</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                    <Star className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {avgQuality.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">Qualidade</p>
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
                    {sleepLogs.slice(0, 7).reverse().map((log, i) => {
                        const heightPercent = (log.duration / goalMinutes) * 100;
                        const dayIndex = log.date.getDay();
                        
                        return (
                            <div key={log.id} className="flex-1 flex flex-col items-center">
                                <div className="w-full h-24 bg-gray-100 dark:bg-gray-700 rounded-lg relative overflow-hidden">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${Math.min(heightPercent, 100)}%` }}
                                        className={`absolute bottom-0 w-full rounded-lg ${
                                            log.quality >= 4 ? 'bg-indigo-500' :
                                            log.quality >= 3 ? 'bg-indigo-400' :
                                            log.quality >= 2 ? 'bg-indigo-300' : 'bg-indigo-200'
                                        }`}
                                    />
                                    {/* Goal line */}
                                    <div 
                                        className="absolute w-full border-t-2 border-dashed border-emerald-500"
                                        style={{ bottom: '100%' }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{weekDays[dayIndex]}</p>
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {Math.floor(log.duration / 60)}h
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tips */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Dicas para melhorar o sono
                </h4>
                <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                        <Coffee className="w-4 h-4 text-amber-500 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-400">
                            Evite cafeína após as 14h
                        </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                        <Zap className="w-4 h-4 text-blue-500 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-400">
                            Reduza telas 1h antes de dormir
                        </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                        <Clock className="w-4 h-4 text-emerald-500 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-400">
                            Mantenha horários regulares
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SleepTracker;
