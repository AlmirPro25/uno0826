import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Activity, Thermometer, Droplets, Moon, Footprints,
    TrendingUp, TrendingDown, Minus, Calendar, Plus, X,
    AlertTriangle, CheckCircle, Target, Zap, Phone, MapPin,
    Shield, Brain, Sparkles
} from 'lucide-react';
import { getHealthSummary, getMetrics, recordMetric, getCheckInHistory } from '@/api/health-profile';

interface HealthMetric {
    id: string;
    name: string;
    value: number;
    unit: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    trend: 'up' | 'down' | 'stable';
    target?: { min: number; max: number };
    history: { date: string; value: number }[];
}

interface HealthDashboardProps {
    onClose?: () => void;
    compact?: boolean;
}

const calculateHealthScore = (metrics: HealthMetric[]): number => {
    let score = 100;
    metrics.forEach(metric => {
        if (metric.target) {
            if (metric.value < metric.target.min) {
                score -= Math.min(20, (metric.target.min - metric.value) * 2);
            } else if (metric.value > metric.target.max) {
                score -= Math.min(20, (metric.value - metric.target.max) * 2);
            }
        }
    });
    return Math.max(0, Math.min(100, Math.round(score)));
};

const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
};

const getScoreGradient = (score: number): string => {
    if (score >= 80) return 'from-emerald-500 to-teal-500';
    if (score >= 60) return 'from-yellow-500 to-amber-500';
    if (score >= 40) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-rose-600';
};


export function HealthDashboard({ onClose, compact = false }: HealthDashboardProps) {
    const [metrics, setMetrics] = useState<HealthMetric[]>([
        { id: 'heart_rate', name: 'Frequência Cardíaca', value: 0, unit: 'bpm', icon: Heart, color: 'text-red-500', bgColor: 'bg-red-500/10', trend: 'stable', target: { min: 60, max: 100 }, history: [] },
        { id: 'blood_pressure', name: 'Pressão Arterial', value: 0, unit: 'mmHg', icon: Activity, color: 'text-blue-500', bgColor: 'bg-blue-500/10', trend: 'stable', target: { min: 90, max: 120 }, history: [] },
        { id: 'temperature', name: 'Temperatura', value: 36.5, unit: '°C', icon: Thermometer, color: 'text-orange-500', bgColor: 'bg-orange-500/10', trend: 'stable', target: { min: 36, max: 37.5 }, history: [] },
        { id: 'oxygen', name: 'Saturação O₂', value: 98, unit: '%', icon: Droplets, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', trend: 'stable', target: { min: 95, max: 100 }, history: [] },
        { id: 'sleep', name: 'Sono', value: 0, unit: 'horas', icon: Moon, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', trend: 'stable', target: { min: 7, max: 9 }, history: [] },
        { id: 'steps', name: 'Passos', value: 0, unit: 'passos', icon: Footprints, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', trend: 'stable', target: { min: 8000, max: 15000 }, history: [] },
    ]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedMetric, setSelectedMetric] = useState<HealthMetric | null>(null);
    const [newValue, setNewValue] = useState('');
    const [healthScore, setHealthScore] = useState(50);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load health summary
            const summary = await getHealthSummary();
            setHealthScore(summary.healthScore || 50);

            // Load check-in history for sleep and steps
            const checkIns = await getCheckInHistory(7);
            
            // Update metrics with real data
            setMetrics(prev => prev.map(m => {
                if (m.id === 'sleep') {
                    const history = checkIns.map(c => ({ date: c.date, value: c.sleep_hours || 0 }));
                    const latestValue = checkIns[0]?.sleep_hours || 0;
                    return { ...m, value: latestValue, history, trend: getTrend(history) };
                }
                if (m.id === 'steps') {
                    const history = checkIns.map(c => ({ date: c.date, value: c.steps || 0 }));
                    const latestValue = checkIns[0]?.steps || 0;
                    return { ...m, value: latestValue, history, trend: getTrend(history) };
                }
                if (m.id === 'heart_rate') {
                    const history = checkIns.filter(c => c.heart_rate).map(c => ({ date: c.date, value: c.heart_rate || 0 }));
                    const latestValue = checkIns.find(c => c.heart_rate)?.heart_rate || 72;
                    return { ...m, value: latestValue, history, trend: getTrend(history) };
                }
                if (m.id === 'blood_pressure') {
                    const history = checkIns.filter(c => c.blood_pressure_sys).map(c => ({ date: c.date, value: c.blood_pressure_sys || 0 }));
                    const latestValue = checkIns.find(c => c.blood_pressure_sys)?.blood_pressure_sys || 120;
                    return { ...m, value: latestValue, history, trend: getTrend(history) };
                }
                return m;
            }));
        } catch (error) {
            console.error('Error loading health data:', error);
        }
    };

    const getTrend = (history: { value: number }[]): 'up' | 'down' | 'stable' => {
        if (history.length < 2) return 'stable';
        const recent = history.slice(0, 3).reduce((a, b) => a + b.value, 0) / Math.min(3, history.length);
        const older = history.slice(3, 6).reduce((a, b) => a + b.value, 0) / Math.min(3, history.length - 3) || recent;
        if (recent > older * 1.05) return 'up';
        if (recent < older * 0.95) return 'down';
        return 'stable';
    };


    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
            case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
            default: return <Minus className="w-4 h-4 text-gray-400" />;
        }
    };

    const isInRange = (metric: HealthMetric): boolean => {
        if (!metric.target) return true;
        return metric.value >= metric.target.min && metric.value <= metric.target.max;
    };

    const handleAddReading = async () => {
        if (!selectedMetric || !newValue) return;
        
        const newVal = parseFloat(newValue);
        
        // Save to API
        try {
            await recordMetric({
                type: selectedMetric.id,
                value: newVal,
                unit: selectedMetric.unit,
                source: 'manual'
            });
        } catch (error) {
            console.error('Error saving metric:', error);
        }

        const updatedMetrics = metrics.map(m => {
            if (m.id === selectedMetric.id) {
                const newHistory = [...m.history, { date: new Date().toISOString().split('T')[0], value: newVal }];
                const lastValue = m.value;
                let trend: 'up' | 'down' | 'stable' = 'stable';
                if (newVal > lastValue) trend = 'up';
                else if (newVal < lastValue) trend = 'down';
                
                return { ...m, value: newVal, history: newHistory.slice(-7), trend };
            }
            return m;
        });
        
        setMetrics(updatedMetrics);
        setHealthScore(calculateHealthScore(updatedMetrics));
        setShowAddModal(false);
        setSelectedMetric(null);
        setNewValue('');
    };

    const renderMiniChart = (history: { date: string; value: number }[], color: string) => {
        const max = Math.max(...history.map(h => h.value));
        const min = Math.min(...history.map(h => h.value));
        const range = max - min || 1;
        
        return (
            <div className="flex items-end gap-1 h-12">
                {history.map((point, i) => {
                    const height = ((point.value - min) / range) * 100;
                    return (
                        <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(20, height)}%` }}
                            transition={{ delay: i * 0.05 }}
                            className={`w-2 rounded-full ${color.replace('text-', 'bg-')} opacity-70`}
                        />
                    );
                })}
            </div>
        );
    };

    if (compact) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-cyan-500" />
                        Saúde
                    </h3>
                    <div className={`text-2xl font-bold ${getScoreColor(healthScore)}`}>
                        {healthScore}
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {metrics.slice(0, 3).map(metric => (
                        <div key={metric.id} className={`p-2 rounded-lg ${metric.bgColor}`}>
                            <metric.icon className={`w-4 h-4 ${metric.color} mb-1`} />
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{metric.value}</p>
                            <p className="text-xs text-gray-500">{metric.unit}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }


    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white">Dashboard de Saúde</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Monitore seus sinais vitais</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                )}
            </div>

            <div className="p-6 space-y-6">
                {/* Health Score */}
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`relative p-6 rounded-2xl bg-gradient-to-br ${getScoreGradient(healthScore)} text-white overflow-hidden`}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="relative flex items-center justify-between">
                        <div>
                            <p className="text-white/80 text-sm font-medium">Índice de Saúde</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-5xl font-bold">{healthScore}</span>
                                <span className="text-white/80">/100</span>
                            </div>
                            <p className="text-white/70 text-sm mt-2">
                                {healthScore >= 80 ? '🎉 Excelente! Continue assim!' :
                                 healthScore >= 60 ? '👍 Bom, mas pode melhorar' :
                                 healthScore >= 40 ? '⚠️ Atenção necessária' :
                                 '🚨 Consulte um médico'}
                            </p>
                        </div>
                        <div className="w-24 h-24 rounded-full border-4 border-white/30 flex items-center justify-center">
                            <Shield className="w-10 h-10 text-white" />
                        </div>
                    </div>
                </motion.div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {metrics.map((metric, index) => (
                        <motion.div
                            key={metric.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => { setSelectedMetric(metric); setShowAddModal(true); }}
                            className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-lg ${
                                isInRange(metric) 
                                    ? 'border-gray-200 dark:border-gray-700 hover:border-cyan-500' 
                                    : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 rounded-xl ${metric.bgColor} flex items-center justify-center`}>
                                    <metric.icon className={`w-5 h-5 ${metric.color}`} />
                                </div>
                                <div className="flex items-center gap-1">
                                    {getTrendIcon(metric.trend)}
                                    {!isInRange(metric) && (
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    )}
                                </div>
                            </div>
                            
                            <p className="text-sm text-gray-500 dark:text-gray-400">{metric.name}</p>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {metric.value}
                                </span>
                                <span className="text-sm text-gray-500">{metric.unit}</span>
                            </div>
                            
                            {metric.target && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Meta: {metric.target.min}-{metric.target.max} {metric.unit}
                                </p>
                            )}
                            
                            <div className="mt-3">
                                {renderMiniChart(metric.history, metric.color)}
                            </div>
                        </motion.div>
                    ))}
                </div>


                {/* Quick Tips */}
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">Dicas de Saúde</h3>
                    </div>
                    <div className="space-y-2">
                        {healthScore < 80 && metrics.find(m => m.id === 'steps' && m.value < 8000) && (
                            <div className="flex items-start gap-2 text-sm">
                                <Footprints className="w-4 h-4 text-emerald-500 mt-0.5" />
                                <p className="text-gray-600 dark:text-gray-300">
                                    Tente caminhar mais! Meta: 8.000 passos/dia
                                </p>
                            </div>
                        )}
                        {metrics.find(m => m.id === 'sleep' && m.value < 7) && (
                            <div className="flex items-start gap-2 text-sm">
                                <Moon className="w-4 h-4 text-indigo-500 mt-0.5" />
                                <p className="text-gray-600 dark:text-gray-300">
                                    Durma pelo menos 7 horas por noite
                                </p>
                            </div>
                        )}
                        {healthScore >= 80 && (
                            <div className="flex items-start gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                                <p className="text-gray-600 dark:text-gray-300">
                                    Seus indicadores estão ótimos! Continue assim!
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add Reading Button */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-cyan-500 hover:text-cyan-500 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Adicionar Leitura
                </button>
            </div>

            {/* Add Reading Modal */}
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
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {selectedMetric ? `Atualizar ${selectedMetric.name}` : 'Adicionar Leitura'}
                                </h3>
                                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {!selectedMetric ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {metrics.map(metric => (
                                        <button
                                            key={metric.id}
                                            onClick={() => setSelectedMetric(metric)}
                                            className={`p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-cyan-500 transition-colors text-left`}
                                        >
                                            <metric.icon className={`w-6 h-6 ${metric.color} mb-2`} />
                                            <p className="font-medium text-gray-900 dark:text-white text-sm">{metric.name}</p>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className={`p-4 rounded-xl ${selectedMetric.bgColor} flex items-center gap-3`}>
                                        <selectedMetric.icon className={`w-8 h-8 ${selectedMetric.color}`} />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedMetric.name}</p>
                                            <p className="text-sm text-gray-500">Valor atual: {selectedMetric.value} {selectedMetric.unit}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Novo valor ({selectedMetric.unit})
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={newValue}
                                            onChange={e => setNewValue(e.target.value)}
                                            placeholder={`Ex: ${selectedMetric.value}`}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                        />
                                        {selectedMetric.target && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Faixa ideal: {selectedMetric.target.min} - {selectedMetric.target.max} {selectedMetric.unit}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => { setSelectedMetric(null); setNewValue(''); }}
                                            className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            Voltar
                                        </button>
                                        <button
                                            onClick={handleAddReading}
                                            disabled={!newValue}
                                            className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Salvar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default HealthDashboard;
