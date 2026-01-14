import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Target, Droplets, Footprints, Moon, Apple, 
    Plus, Check, Trophy, Flame
} from 'lucide-react';
import { getTodayCheckIn, getMyProfile, getCheckInHistory } from '@/api/health-profile';

interface Goal {
    id: string;
    name: string;
    icon: React.ElementType;
    current: number;
    target: number;
    unit: string;
    color: string;
}

interface HealthGoalsProps {
    compact?: boolean;
}

export function HealthGoals({ compact = false }: HealthGoalsProps) {
    const [goals, setGoals] = useState<Goal[]>([
        { id: 'water', name: 'Água', icon: Droplets, current: 0, target: 8, unit: 'copos', color: 'bg-blue-500' },
        { id: 'steps', name: 'Passos', icon: Footprints, current: 0, target: 10000, unit: 'passos', color: 'bg-emerald-500' },
        { id: 'sleep', name: 'Sono', icon: Moon, current: 0, target: 8, unit: 'horas', color: 'bg-indigo-500' },
        { id: 'meals', name: 'Refeições', icon: Apple, current: 0, target: 5, unit: 'refeições', color: 'bg-orange-500' },
    ]);

    const [streak, setStreak] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load profile for targets
            const profile = await getMyProfile();
            
            // Load today's check-in
            const todayCheckIn = await getTodayCheckIn();
            
            // Calculate streak from history
            const history = await getCheckInHistory(30);
            let currentStreak = 0;
            for (const checkIn of history) {
                if (checkIn.steps > 0 || checkIn.water_ml > 0 || checkIn.sleep_hours > 0) {
                    currentStreak++;
                } else {
                    break;
                }
            }
            setStreak(currentStreak);

            // Update goals with real data
            setGoals([
                { 
                    id: 'water', 
                    name: 'Água', 
                    icon: Droplets, 
                    current: Math.floor((todayCheckIn?.water_ml || 0) / 250), // Convert ml to glasses
                    target: Math.floor((profile.water_target_ml || 2000) / 250), 
                    unit: 'copos', 
                    color: 'bg-blue-500' 
                },
                { 
                    id: 'steps', 
                    name: 'Passos', 
                    icon: Footprints, 
                    current: todayCheckIn?.steps || 0, 
                    target: profile.steps_target || 10000, 
                    unit: 'passos', 
                    color: 'bg-emerald-500' 
                },
                { 
                    id: 'sleep', 
                    name: 'Sono', 
                    icon: Moon, 
                    current: Math.round(todayCheckIn?.sleep_hours || 0), 
                    target: profile.sleep_target_hours || 8, 
                    unit: 'horas', 
                    color: 'bg-indigo-500' 
                },
                { 
                    id: 'meals', 
                    name: 'Refeições', 
                    icon: Apple, 
                    current: todayCheckIn?.meals_count || 0, 
                    target: 5, 
                    unit: 'refeições', 
                    color: 'bg-orange-500' 
                },
            ]);
        } catch (error) {
            console.error('Error loading goals data:', error);
        }
    };

    const incrementGoal = (id: string) => {
        setGoals(prev => prev.map(g => 
            g.id === id ? { ...g, current: Math.min(g.current + 1, g.target * 2) } : g
        ));
    };

    const getProgress = (current: number, target: number) => {
        return Math.min((current / target) * 100, 100);
    };

    const completedGoals = goals.filter(g => g.current >= g.target).length;

    if (compact) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-cyan-600" />
                        Metas do Dia
                    </h3>
                    <div className="flex items-center gap-1 text-amber-500">
                        <Flame className="w-4 h-4" />
                        <span className="text-sm font-medium">{streak} dias</span>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    {goals.map(goal => {
                        const progress = getProgress(goal.current, goal.target);
                        const isComplete = progress >= 100;
                        return (
                            <div 
                                key={goal.id}
                                className={`flex-1 p-2 rounded-xl text-center ${
                                    isComplete ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-gray-50 dark:bg-gray-700/50'
                                }`}
                            >
                                <goal.icon className={`w-5 h-5 mx-auto mb-1 ${
                                    isComplete ? 'text-emerald-500' : 'text-gray-400'
                                }`} />
                                <div className="text-xs font-medium text-gray-900 dark:text-white">
                                    {goal.current}/{goal.target}
                                </div>
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
                            <Target className="w-5 h-5 text-cyan-600" />
                            Metas Diárias
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {completedGoals}/{goals.length} metas concluídas
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                        <Flame className="w-5 h-5 text-amber-500" />
                        <div>
                            <p className="text-lg font-bold text-amber-600">{streak}</p>
                            <p className="text-xs text-amber-500">dias seguidos</p>
                        </div>
                    </div>
                </div>

                {/* Overall Progress */}
                <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Progresso geral</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {Math.round(goals.reduce((acc, g) => acc + getProgress(g.current, g.target), 0) / goals.length)}%
                        </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${goals.reduce((acc, g) => acc + getProgress(g.current, g.target), 0) / goals.length}%` }}
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        />
                    </div>
                </div>
            </div>

            {/* Goals List */}
            <div className="p-4 space-y-4">
                {goals.map(goal => {
                    const progress = getProgress(goal.current, goal.target);
                    const isComplete = progress >= 100;
                    const Icon = goal.icon;

                    return (
                        <motion.div
                            key={goal.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl ${
                                isComplete 
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' 
                                    : 'bg-gray-50 dark:bg-gray-700/50'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    isComplete ? 'bg-emerald-500' : goal.color
                                }`}>
                                    {isComplete ? (
                                        <Check className="w-6 h-6 text-white" />
                                    ) : (
                                        <Icon className="w-6 h-6 text-white" />
                                    )}
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {goal.name}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {goal.current} / {goal.target} {goal.unit}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className={`h-full rounded-full ${
                                                isComplete ? 'bg-emerald-500' : goal.color
                                            }`}
                                        />
                                    </div>
                                </div>

                                {!isComplete && (
                                    <button
                                        onClick={() => incrementGoal(goal.id)}
                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                    >
                                        <Plus className="w-5 h-5 text-gray-500" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Achievement */}
            {completedGoals === goals.length && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                >
                    <div className="flex items-center gap-3">
                        <Trophy className="w-8 h-8" />
                        <div>
                            <p className="font-bold">Parabéns! 🎉</p>
                            <p className="text-sm text-amber-100">Você completou todas as metas de hoje!</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default HealthGoals;
