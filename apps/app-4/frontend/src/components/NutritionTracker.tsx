import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Apple, Coffee, UtensilsCrossed, Cookie,
    Plus, X, Check, Flame, Droplets,
    TrendingUp, Clock
} from 'lucide-react';
import { getTodayCheckIn, createDailyCheckIn, getMyProfile } from '@/api/health-profile';

interface Meal {
    id: string;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    name: string;
    calories: number;
    time: string;
    logged: boolean;
}

interface NutritionTrackerProps {
    compact?: boolean;
    dailyCalorieGoal?: number;
}

export function NutritionTracker({ compact = false, dailyCalorieGoal: propGoal }: NutritionTrackerProps) {
    const [dailyCalorieGoal, setDailyCalorieGoal] = useState(propGoal || 2000);
    const [meals, setMeals] = useState<Meal[]>([
        { id: '1', type: 'breakfast', name: 'Café da manhã', calories: 0, time: '07:30', logged: false },
        { id: '2', type: 'snack', name: 'Lanche manhã', calories: 0, time: '10:00', logged: false },
        { id: '3', type: 'lunch', name: 'Almoço', calories: 0, time: '12:30', logged: false },
        { id: '4', type: 'snack', name: 'Lanche tarde', calories: 0, time: '15:30', logged: false },
        { id: '5', type: 'dinner', name: 'Jantar', calories: 0, time: '19:30', logged: false },
    ]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const profile = await getMyProfile();
            if (profile.calories_target) {
                setDailyCalorieGoal(profile.calories_target);
            }

            const checkIn = await getTodayCheckIn();
            if (checkIn) {
                // Parse meals from check-in if available
                if (checkIn.meals_log) {
                    try {
                        const savedMeals = JSON.parse(checkIn.meals_log);
                        if (Array.isArray(savedMeals) && savedMeals.length > 0) {
                            setMeals(savedMeals);
                        }
                    } catch {
                        // Use default meals
                    }
                }
                // Update meals count
                if (checkIn.meals_count > 0 && checkIn.calories_consumed > 0) {
                    const avgCalPerMeal = Math.floor(checkIn.calories_consumed / checkIn.meals_count);
                    setMeals(prev => prev.map((m, i) => 
                        i < checkIn.meals_count 
                            ? { ...m, logged: true, calories: avgCalPerMeal }
                            : m
                    ));
                }
            }
        } catch (error) {
            console.error('Error loading nutrition data:', error);
        }
    };
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

    const totalCalories = meals.reduce((acc, m) => acc + m.calories, 0);
    const percentage = Math.min((totalCalories / dailyCalorieGoal) * 100, 100);
    const remaining = Math.max(dailyCalorieGoal - totalCalories, 0);
    const mealsLogged = meals.filter(m => m.logged).length;

    const getMealIcon = (type: string) => {
        switch (type) {
            case 'breakfast': return Coffee;
            case 'lunch': return UtensilsCrossed;
            case 'dinner': return UtensilsCrossed;
            case 'snack': return Cookie;
            default: return Apple;
        }
    };

    const getMealColor = (type: string) => {
        switch (type) {
            case 'breakfast': return 'bg-amber-500';
            case 'lunch': return 'bg-emerald-500';
            case 'dinner': return 'bg-indigo-500';
            case 'snack': return 'bg-pink-500';
            default: return 'bg-gray-500';
        }
    };

    const logMeal = async (id: string, calories: number) => {
        const updatedMeals = meals.map(m => 
            m.id === id ? { ...m, logged: true, calories } : m
        );
        setMeals(updatedMeals);
        setShowAddModal(false);
        setSelectedMeal(null);

        // Save to API
        try {
            const totalCalories = updatedMeals.reduce((acc, m) => acc + m.calories, 0);
            const mealsCount = updatedMeals.filter(m => m.logged).length;
            await createDailyCheckIn({ 
                calories_consumed: totalCalories,
                meals_count: mealsCount,
                meals_log: JSON.stringify(updatedMeals)
            });
        } catch (error) {
            console.error('Error saving meal:', error);
        }
    };

    if (compact) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Apple className="w-5 h-5 text-emerald-500" />
                        Nutrição
                    </h3>
                    <span className="text-sm font-medium text-emerald-600">
                        {mealsLogged}/{meals.length}
                    </span>
                </div>
                
                <div className="flex items-end justify-between mb-3">
                    <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {totalCalories}
                        </p>
                        <p className="text-xs text-gray-500">de {dailyCalorieGoal} kcal</p>
                    </div>
                    <div className="flex gap-1">
                        {meals.map(meal => {
                            const Icon = getMealIcon(meal.type);
                            return (
                                <div 
                                    key={meal.id}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                        meal.logged 
                                            ? getMealColor(meal.type) 
                                            : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                                >
                                    <Icon className={`w-3 h-3 ${meal.logged ? 'text-white' : 'text-gray-400'}`} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className={`h-full rounded-full ${
                            percentage > 100 ? 'bg-red-500' :
                            percentage > 80 ? 'bg-amber-500' :
                            'bg-emerald-500'
                        }`}
                    />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Apple className="w-5 h-5 text-emerald-500" />
                                Acompanhamento Nutricional
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Meta: {dailyCalorieGoal} kcal/dia
                            </p>
                        </div>
                    </div>
                </div>

                {/* Calorie Summary */}
                <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-gray-500">Consumido hoje</p>
                            <p className="text-4xl font-bold text-gray-900 dark:text-white">
                                {totalCalories}
                                <span className="text-lg font-normal text-gray-500 ml-1">kcal</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Restante</p>
                            <p className={`text-2xl font-bold ${
                                remaining > 0 ? 'text-emerald-600' : 'text-red-500'
                            }`}>
                                {remaining > 0 ? remaining : `+${Math.abs(remaining)}`}
                                <span className="text-sm font-normal ml-1">kcal</span>
                            </p>
                        </div>
                    </div>

                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(percentage, 100)}%` }}
                            className={`h-full rounded-full ${
                                percentage > 100 ? 'bg-red-500' :
                                percentage > 80 ? 'bg-amber-500' :
                                'bg-emerald-500'
                            }`}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        {Math.round(percentage)}% da meta diária
                    </p>
                </div>

                {/* Meals List */}
                <div className="p-4 space-y-3">
                    {meals.map(meal => {
                        const Icon = getMealIcon(meal.type);
                        return (
                            <motion.div
                                key={meal.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-xl flex items-center gap-4 ${
                                    meal.logged 
                                        ? 'bg-gray-50 dark:bg-gray-700/50' 
                                        : 'bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    meal.logged ? getMealColor(meal.type) : 'bg-gray-300 dark:bg-gray-600'
                                }`}>
                                    {meal.logged ? (
                                        <Icon className="w-6 h-6 text-white" />
                                    ) : (
                                        <Plus className="w-6 h-6 text-gray-500" />
                                    )}
                                </div>
                                
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {meal.name}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Clock className="w-3 h-3" />
                                        <span>{meal.time}</span>
                                        {meal.logged && (
                                            <>
                                                <span>•</span>
                                                <Flame className="w-3 h-3 text-orange-500" />
                                                <span>{meal.calories} kcal</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {meal.logged ? (
                                    <Check className="w-5 h-5 text-emerald-500" />
                                ) : (
                                    <button
                                        onClick={() => {
                                            setSelectedMeal(meal);
                                            setShowAddModal(true);
                                        }}
                                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Registrar
                                    </button>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Quick Stats */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 grid grid-cols-3 gap-4 text-center">
                    <div>
                        <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {totalCalories}
                        </p>
                        <p className="text-xs text-gray-500">Calorias</p>
                    </div>
                    <div>
                        <Droplets className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {mealsLogged}
                        </p>
                        <p className="text-xs text-gray-500">Refeições</p>
                    </div>
                    <div>
                        <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {Math.round(percentage)}%
                        </p>
                        <p className="text-xs text-gray-500">Meta</p>
                    </div>
                </div>
            </div>

            {/* Add Meal Modal */}
            <AnimatePresence>
                {showAddModal && selectedMeal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Registrar {selectedMeal.name}
                                </h3>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <p className="text-sm text-gray-500 mb-4">
                                Selecione as calorias aproximadas:
                            </p>

                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {[200, 300, 400, 500, 600, 700].map(cal => (
                                    <button
                                        key={cal}
                                        onClick={() => logMeal(selectedMeal.id, cal)}
                                        className="py-3 bg-gray-100 dark:bg-gray-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                                    >
                                        {cal} kcal
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => logMeal(selectedMeal.id, 450)}
                                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
                            >
                                Registrar Refeição
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default NutritionTracker;
