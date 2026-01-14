import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    TrendingUp, Calendar, CheckCircle, 
    Activity, Droplets, Moon, Footprints,
    ChevronLeft, ChevronRight, Award
} from 'lucide-react';
import { getCheckInHistory, getMyProfile } from '@/api/health-profile';

interface DayProgress {
    date: Date;
    completed: number;
    total: number;
    goals: {
        water: boolean;
        steps: boolean;
        sleep: boolean;
        meals: boolean;
    };
}

interface WeeklyProgressProps {
    compact?: boolean;
}

export function WeeklyProgress({ compact = false }: WeeklyProgressProps) {
    const [weekOffset, setWeekOffset] = useState(0);
    const [weekData, setWeekData] = useState<DayProgress[]>([]);
    const [targets, setTargets] = useState({ water: 2000, steps: 10000, sleep: 8 });

    useEffect(() => {
        loadData();
    }, [weekOffset]);

    const loadData = async () => {
        try {
            // Load profile for targets
            const profile = await getMyProfile();
            const newTargets = {
                water: profile.water_target_ml || 2000,
                steps: profile.steps_target || 10000,
                sleep: profile.sleep_target_hours || 8
            };
            setTargets(newTargets);

            // Load check-in history
            const history = await getCheckInHistory(14);
            
            // Generate week data
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));

            const data = Array.from({ length: 7 }, (_, i) => {
                const date = new Date(startOfWeek);
                date.setDate(startOfWeek.getDate() + i);
                const isPast = date <= today;
                
                // Find check-in for this date
                const checkIn = history.find(h => {
                    const checkInDate = new Date(h.date);
                    return checkInDate.toDateString() === date.toDateString();
                });

                const goals = {
                    water: checkIn ? checkIn.water_ml >= newTargets.water * 0.8 : false,
                    steps: checkIn ? checkIn.steps >= newTargets.steps * 0.8 : false,
                    sleep: checkIn ? checkIn.sleep_hours >= newTargets.sleep * 0.8 : false,
                    meals: checkIn ? checkIn.meals_count >= 3 : false,
                };

                const completed = Object.values(goals).filter(Boolean).length;

                return {
                    date,
                    completed: isPast ? completed : 0,
                    total: 4,
                    goals
                };
            });

            setWeekData(data);
        } catch (error) {
            console.error('Error loading weekly progress:', error);
            // Generate empty week data
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
            
            setWeekData(Array.from({ length: 7 }, (_, i) => {
                const date = new Date(startOfWeek);
                date.setDate(startOfWeek.getDate() + i);
                return {
                    date,
                    completed: 0,
                    total: 4,
                    goals: { water: false, steps: false, sleep: false, meals: false }
                };
            }));
        }
    };
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    const totalCompleted = weekData.reduce((acc, day) => acc + day.completed, 0);
    const totalPossible = weekData.filter(d => d.date <= new Date()).length * 4;
    const weekPercentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    const perfectDays = weekData.filter(d => d.completed === d.total && d.date <= new Date()).length;

    const getWeekRange = () => {
        const start = weekData[0].date;
        const end = weekData[6].date;
        return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
    };

    if (compact) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        Progresso Semanal
                    </h3>
                    <span className="text-lg font-bold text-emerald-600">{weekPercentage}%</span>
                </div>
                
                <div className="flex gap-1">
                    {weekData.map((day, i) => {
                        const percentage = (day.completed / day.total) * 100;
                        const isToday = day.date.toDateString() === new Date().toDateString();
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div 
                                    className={`w-full h-8 rounded-lg relative overflow-hidden ${
                                        isToday ? 'ring-2 ring-cyan-500' : ''
                                    } bg-gray-100 dark:bg-gray-700`}
                                >
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${percentage}%` }}
                                        className={`absolute bottom-0 w-full ${
                                            percentage === 100 ? 'bg-emerald-500' :
                                            percentage >= 50 ? 'bg-cyan-500' :
                                            percentage > 0 ? 'bg-amber-500' : 'bg-gray-300'
                                        }`}
                                    />
                                </div>
                                <span className={`text-xs ${isToday ? 'font-bold text-cyan-600' : 'text-gray-500'}`}>
                                    {weekDays[i][0]}
                                </span>
                            </div>
                        );
                    })}
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
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                            Progresso Semanal
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Acompanhe suas metas ao longo da semana
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setWeekOffset(prev => prev - 1)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[100px] text-center">
                            {getWeekRange()}
                        </span>
                        <button
                            onClick={() => setWeekOffset(prev => Math.min(prev + 1, 0))}
                            disabled={weekOffset >= 0}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Week Stats */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                        <p className="text-2xl font-bold text-emerald-600">{weekPercentage}%</p>
                        <p className="text-xs text-emerald-600">Conclusão</p>
                    </div>
                    <div className="text-center p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
                        <p className="text-2xl font-bold text-cyan-600">{totalCompleted}/{totalPossible}</p>
                        <p className="text-xs text-cyan-600">Metas</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                        <p className="text-2xl font-bold text-amber-600">{perfectDays}</p>
                        <p className="text-xs text-amber-600">Dias Perfeitos</p>
                    </div>
                </div>
            </div>

            {/* Week Grid */}
            <div className="p-4">
                <div className="grid grid-cols-7 gap-2">
                    {weekData.map((day, i) => {
                        const isToday = day.date.toDateString() === new Date().toDateString();
                        const isFuture = day.date > new Date();
                        const isPerfect = day.completed === day.total && !isFuture;

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`p-3 rounded-xl text-center ${
                                    isToday ? 'bg-cyan-50 dark:bg-cyan-900/20 ring-2 ring-cyan-500' :
                                    isPerfect ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                                    isFuture ? 'bg-gray-50 dark:bg-gray-700/30 opacity-50' :
                                    'bg-gray-50 dark:bg-gray-700/50'
                                }`}
                            >
                                <p className={`text-xs font-medium mb-1 ${
                                    isToday ? 'text-cyan-600' : 'text-gray-500'
                                }`}>
                                    {weekDays[i]}
                                </p>
                                <p className={`text-lg font-bold mb-2 ${
                                    isToday ? 'text-cyan-700 dark:text-cyan-400' : 
                                    'text-gray-900 dark:text-white'
                                }`}>
                                    {day.date.getDate()}
                                </p>
                                
                                {isPerfect ? (
                                    <Award className="w-6 h-6 mx-auto text-emerald-500" />
                                ) : (
                                    <div className="grid grid-cols-2 gap-1">
                                        <div className={`w-4 h-4 rounded-full mx-auto ${
                                            day.goals.water ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'
                                        }`}>
                                            {day.goals.water && <Droplets className="w-4 h-4 text-white p-0.5" />}
                                        </div>
                                        <div className={`w-4 h-4 rounded-full mx-auto ${
                                            day.goals.steps ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-600'
                                        }`}>
                                            {day.goals.steps && <Footprints className="w-4 h-4 text-white p-0.5" />}
                                        </div>
                                        <div className={`w-4 h-4 rounded-full mx-auto ${
                                            day.goals.sleep ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-600'
                                        }`}>
                                            {day.goals.sleep && <Moon className="w-4 h-4 text-white p-0.5" />}
                                        </div>
                                        <div className={`w-4 h-4 rounded-full mx-auto ${
                                            day.goals.meals ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-600'
                                        }`}>
                                            {day.goals.meals && <CheckCircle className="w-4 h-4 text-white p-0.5" />}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="px-4 pb-4">
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>Água</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span>Passos</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-indigo-500" />
                        <span>Sono</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span>Refeições</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WeeklyProgress;
