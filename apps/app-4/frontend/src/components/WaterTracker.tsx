import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Droplets, Plus, Minus, Target, 
    TrendingUp, Clock, Award, RefreshCw
} from 'lucide-react';
import { getTodayCheckIn, createDailyCheckIn, recordMetric, getMyProfile } from '@/api/health-profile';

interface WaterLog {
    id: string;
    amount: number;
    time: Date;
}

interface WaterTrackerProps {
    compact?: boolean;
    dailyGoal?: number;
}

export function WaterTracker({ compact = false, dailyGoal: propDailyGoal }: WaterTrackerProps) {
    const [logs, setLogs] = useState<WaterLog[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [customAmount, setCustomAmount] = useState(250);
    const [dailyGoal, setDailyGoal] = useState(propDailyGoal || 2000);
    const [totalToday, setTotalToday] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load profile for daily goal
            const profile = await getMyProfile();
            if (profile.water_target_ml) {
                setDailyGoal(profile.water_target_ml);
            }

            // Load today's check-in
            const checkIn = await getTodayCheckIn();
            if (checkIn && checkIn.water_ml > 0) {
                setTotalToday(checkIn.water_ml);
            }
        } catch (error) {
            console.error('Error loading water data:', error);
        }
    };

    const totalFromLogs = logs.reduce((acc, log) => acc + log.amount, 0);
    const displayTotal = totalToday + totalFromLogs;
    const percentage = Math.min((displayTotal / dailyGoal) * 100, 100);
    const remaining = Math.max(dailyGoal - displayTotal, 0);
    const glassesCount = Math.floor(displayTotal / 250);

    const quickAmounts = [150, 200, 250, 300, 500];

    const addWater = async (amount: number) => {
        const newLog: WaterLog = {
            id: Date.now().toString(),
            amount,
            time: new Date()
        };
        setLogs(prev => [...prev, newLog]);
        setShowAddModal(false);

        // Save to API
        try {
            const newTotal = displayTotal + amount;
            await createDailyCheckIn({ water_ml: newTotal });
            await recordMetric({ type: 'water', value: amount, unit: 'ml', source: 'manual' });
        } catch (error) {
            console.error('Error saving water intake:', error);
        }
    };

    const removeLastLog = () => {
        setLogs(prev => prev.slice(0, -1));
    };

    const resetDay = async () => {
        setLogs([]);
        setTotalToday(0);
        try {
            await createDailyCheckIn({ water_ml: 0 });
        } catch (error) {
            console.error('Error resetting water:', error);
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    // Water wave animation
    const WaterWave = ({ level }: { level: number }) => (
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-2xl" style={{ height: `${level}%` }}>
            <motion.div
                animate={{ x: [0, -100, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-t from-cyan-500 to-cyan-400"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z' fill='%2306b6d4' fill-opacity='0.3'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundSize: '200% 100%'
                }}
            />
        </div>
    );

    if (compact) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Droplets className="w-5 h-5 text-cyan-500" />
                        Hidratação
                    </h3>
                    <span className="text-sm font-medium text-cyan-600">{displayTotal}ml</span>
                </div>
                
                <div className="relative h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full"
                    />
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{glassesCount} copos</span>
                    <button
                        onClick={() => addWater(250)}
                        className="flex items-center gap-1 px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-lg hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        250ml
                    </button>
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
                                <Droplets className="w-5 h-5 text-cyan-500" />
                                Controle de Hidratação
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Meta diária: {dailyGoal}ml
                            </p>
                        </div>
                        <button
                            onClick={resetDay}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
                            title="Resetar dia"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Water Bottle Visualization */}
                <div className="p-6">
                    <div className="flex gap-6">
                        {/* Bottle */}
                        <div className="relative w-32 h-48 bg-gray-100 dark:bg-gray-700 rounded-2xl overflow-hidden border-4 border-gray-200 dark:border-gray-600">
                            <WaterWave level={percentage} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center z-10">
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {Math.round(percentage)}%
                                    </p>
                                    <p className="text-sm text-gray-500">{displayTotal}ml</p>
                                </div>
                            </div>
                            {/* Measurement lines */}
                            {[25, 50, 75].map(line => (
                                <div 
                                    key={line}
                                    className="absolute left-0 right-0 border-t border-dashed border-gray-300 dark:border-gray-500"
                                    style={{ bottom: `${line}%` }}
                                >
                                    <span className="absolute -right-8 -top-2 text-xs text-gray-400">
                                        {(dailyGoal * line / 100)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Stats */}
                        <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
                                    <div className="flex items-center gap-2 text-cyan-600 mb-1">
                                        <Target className="w-4 h-4" />
                                        <span className="text-xs">Faltam</span>
                                    </div>
                                    <p className="text-lg font-bold text-cyan-700 dark:text-cyan-400">
                                        {remaining}ml
                                    </p>
                                </div>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                        <TrendingUp className="w-4 h-4" />
                                        <span className="text-xs">Copos</span>
                                    </div>
                                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                                        {glassesCount}
                                    </p>
                                </div>
                            </div>

                            {percentage >= 100 && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center gap-2"
                                >
                                    <Award className="w-5 h-5 text-amber-500" />
                                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                        Meta atingida! 🎉
                                    </span>
                                </motion.div>
                            )}

                            {/* Quick Add Buttons */}
                            <div>
                                <p className="text-xs text-gray-500 mb-2">Adicionar rápido:</p>
                                <div className="flex flex-wrap gap-2">
                                    {quickAmounts.map(amount => (
                                        <button
                                            key={amount}
                                            onClick={() => addWater(amount)}
                                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 text-gray-700 dark:text-gray-300 hover:text-cyan-700 dark:hover:text-cyan-400 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            {amount}ml
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Logs */}
                <div className="px-6 pb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Registro de hoje
                        </h4>
                        {logs.length > 0 && (
                            <button
                                onClick={removeLastLog}
                                className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                            >
                                <Minus className="w-3 h-3" />
                                Desfazer último
                            </button>
                        )}
                    </div>
                    
                    {logs.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                            Nenhum registro ainda. Comece a beber água!
                        </p>
                    ) : (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {[...logs].reverse().map((log, index) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                                >
                                    <div className="flex items-center gap-2">
                                        <Droplets className="w-4 h-4 text-cyan-500" />
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {log.amount}ml
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Clock className="w-3 h-3" />
                                        {formatTime(log.time)}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Amount Modal */}
            <AnimatePresence>
                {showAddModal && (
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
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-xs w-full"
                        >
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Quantidade personalizada
                            </h3>
                            
                            <div className="flex items-center justify-center gap-4 mb-6">
                                <button
                                    onClick={() => setCustomAmount(prev => Math.max(50, prev - 50))}
                                    className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    <Minus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                </button>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-cyan-600">{customAmount}</p>
                                    <p className="text-sm text-gray-500">ml</p>
                                </div>
                                <button
                                    onClick={() => setCustomAmount(prev => prev + 50)}
                                    className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>

                            <button
                                onClick={() => addWater(customAmount)}
                                className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-medium transition-colors"
                            >
                                Adicionar {customAmount}ml
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default WaterTracker;
