import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Heart, Thermometer, Activity, Wind,
    TrendingUp, TrendingDown, Minus, AlertTriangle,
    Clock, Plus, X
} from 'lucide-react';

interface VitalSign {
    id: string;
    type: 'heart_rate' | 'blood_pressure' | 'temperature' | 'oxygen' | 'respiratory';
    value: string;
    unit: string;
    timestamp: Date;
    status: 'normal' | 'warning' | 'critical';
    trend?: 'up' | 'down' | 'stable';
}

interface PatientVitalsProps {
    patientId?: string;
    patientName?: string;
    compact?: boolean;
    editable?: boolean;
    onAddVital?: (vital: Partial<VitalSign>) => void;
}

export function PatientVitals({ 
    patientName = 'Paciente',
    compact = false, 
    editable = false,
    onAddVital 
}: PatientVitalsProps) {
    const [vitals, setVitals] = useState<VitalSign[]>([
        { id: '1', type: 'heart_rate', value: '78', unit: 'bpm', timestamp: new Date(), status: 'normal', trend: 'stable' },
        { id: '2', type: 'blood_pressure', value: '120/80', unit: 'mmHg', timestamp: new Date(), status: 'normal', trend: 'stable' },
        { id: '3', type: 'temperature', value: '36.5', unit: '°C', timestamp: new Date(), status: 'normal', trend: 'stable' },
        { id: '4', type: 'oxygen', value: '98', unit: '%', timestamp: new Date(), status: 'normal', trend: 'up' },
        { id: '5', type: 'respiratory', value: '16', unit: 'rpm', timestamp: new Date(), status: 'normal', trend: 'stable' },
    ]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newVital, setNewVital] = useState({ type: 'heart_rate', value: '' });

    const getVitalConfig = (type: string) => {
        switch (type) {
            case 'heart_rate':
                return { 
                    label: 'Freq. Cardíaca', 
                    icon: Heart, 
                    color: 'text-red-500',
                    bgColor: 'bg-red-100 dark:bg-red-900/30',
                    normalRange: '60-100 bpm'
                };
            case 'blood_pressure':
                return { 
                    label: 'Pressão Arterial', 
                    icon: Activity, 
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
                    normalRange: '120/80 mmHg'
                };
            case 'temperature':
                return { 
                    label: 'Temperatura', 
                    icon: Thermometer, 
                    color: 'text-orange-500',
                    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
                    normalRange: '36-37.5 °C'
                };
            case 'oxygen':
                return { 
                    label: 'Saturação O₂', 
                    icon: Wind, 
                    color: 'text-cyan-500',
                    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
                    normalRange: '95-100%'
                };
            case 'respiratory':
                return { 
                    label: 'Freq. Respiratória', 
                    icon: Wind, 
                    color: 'text-emerald-500',
                    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
                    normalRange: '12-20 rpm'
                };
            default:
                return { 
                    label: 'Vital', 
                    icon: Activity, 
                    color: 'text-gray-500',
                    bgColor: 'bg-gray-100 dark:bg-gray-700',
                    normalRange: '-'
                };
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'critical': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
            case 'warning': return 'border-amber-500 bg-amber-50 dark:bg-amber-900/20';
            default: return 'border-gray-200 dark:border-gray-700';
        }
    };

    const getTrendIcon = (trend?: string) => {
        switch (trend) {
            case 'up': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
            case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
            default: return <Minus className="w-4 h-4 text-gray-400" />;
        }
    };

    const addVital = () => {
        if (!newVital.value) return;
        
        const vital: VitalSign = {
            id: Date.now().toString(),
            type: newVital.type as VitalSign['type'],
            value: newVital.value,
            unit: getVitalConfig(newVital.type).normalRange.split(' ').pop() || '',
            timestamp: new Date(),
            status: 'normal',
            trend: 'stable'
        };
        
        setVitals(prev => prev.map(v => v.type === vital.type ? vital : v));
        setShowAddModal(false);
        setNewVital({ type: 'heart_rate', value: '' });
        onAddVital?.(vital);
    };

    const criticalCount = vitals.filter(v => v.status === 'critical').length;
    const warningCount = vitals.filter(v => v.status === 'warning').length;

    if (compact) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        Sinais Vitais
                    </h3>
                    {(criticalCount > 0 || warningCount > 0) && (
                        <div className="flex items-center gap-1">
                            <AlertTriangle className={`w-4 h-4 ${criticalCount > 0 ? 'text-red-500' : 'text-amber-500'}`} />
                            <span className="text-xs font-medium text-gray-500">
                                {criticalCount > 0 ? `${criticalCount} crítico` : `${warningCount} alerta`}
                            </span>
                        </div>
                    )}
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                    {vitals.map(vital => {
                        const config = getVitalConfig(vital.type);
                        const Icon = config.icon;
                        return (
                            <div 
                                key={vital.id}
                                className={`p-2 rounded-lg text-center ${config.bgColor}`}
                            >
                                <Icon className={`w-4 h-4 mx-auto mb-1 ${config.color}`} />
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {vital.value}
                                </p>
                                <p className="text-xs text-gray-500">{vital.unit}</p>
                            </div>
                        );
                    })}
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
                                <Heart className="w-5 h-5 text-red-500" />
                                Sinais Vitais - {patientName}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Última atualização: {vitals[0]?.timestamp.toLocaleTimeString('pt-BR')}
                            </p>
                        </div>
                        {editable && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-medium transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Registrar
                            </button>
                        )}
                    </div>

                    {/* Alerts */}
                    {(criticalCount > 0 || warningCount > 0) && (
                        <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 ${
                            criticalCount > 0 
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
                                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                        }`}>
                            <AlertTriangle className="w-5 h-5" />
                            <span className="text-sm font-medium">
                                {criticalCount > 0 
                                    ? `${criticalCount} sinal(is) vital(is) em estado crítico!`
                                    : `${warningCount} sinal(is) vital(is) fora do normal`}
                            </span>
                        </div>
                    )}
                </div>

                {/* Vitals Grid */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vitals.map(vital => {
                        const config = getVitalConfig(vital.type);
                        const Icon = config.icon;
                        
                        return (
                            <motion.div
                                key={vital.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-xl border-2 ${getStatusColor(vital.status)}`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bgColor}`}>
                                        <Icon className={`w-5 h-5 ${config.color}`} />
                                    </div>
                                    {getTrendIcon(vital.trend)}
                                </div>
                                
                                <p className="text-sm text-gray-500 mb-1">{config.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {vital.value}
                                    </p>
                                    <p className="text-sm text-gray-500">{vital.unit}</p>
                                </div>
                                
                                <p className="text-xs text-gray-400 mt-2">
                                    Normal: {config.normalRange}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Add Vital Modal */}
            {showAddModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowAddModal(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Registrar Sinal Vital
                            </h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tipo
                                </label>
                                <select
                                    value={newVital.type}
                                    onChange={e => setNewVital(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="heart_rate">Frequência Cardíaca</option>
                                    <option value="blood_pressure">Pressão Arterial</option>
                                    <option value="temperature">Temperatura</option>
                                    <option value="oxygen">Saturação O₂</option>
                                    <option value="respiratory">Frequência Respiratória</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Valor
                                </label>
                                <input
                                    type="text"
                                    value={newVital.value}
                                    onChange={e => setNewVital(prev => ({ ...prev, value: e.target.value }))}
                                    placeholder={newVital.type === 'blood_pressure' ? '120/80' : '0'}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <button
                                onClick={addVital}
                                disabled={!newVital.value}
                                className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors"
                            >
                                Registrar
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </>
    );
}

export default PatientVitals;
