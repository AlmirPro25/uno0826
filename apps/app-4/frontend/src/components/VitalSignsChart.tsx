import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    Heart, Thermometer, Activity, Wind, Droplets,
    TrendingUp, TrendingDown, Minus, Calendar,
    ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type VitalType = 'heartRate' | 'bloodPressure' | 'temperature' | 'oxygenSaturation' | 'respiratoryRate';

interface VitalReading {
    id: number;
    type: VitalType;
    value: number;
    secondaryValue?: number; // For blood pressure (diastolic)
    timestamp: Date;
    notes?: string;
}

interface VitalSignsChartProps {
    readings: VitalReading[];
    selectedType?: VitalType;
    onTypeChange?: (type: VitalType) => void;
    compact?: boolean;
    daysToShow?: number;
}

const vitalConfig: Record<VitalType, {
    icon: any;
    label: string;
    unit: string;
    color: string;
    bgColor: string;
    normalRange: { min: number; max: number };
    warningRange: { min: number; max: number };
}> = {
    heartRate: {
        icon: Heart,
        label: 'Frequência Cardíaca',
        unit: 'bpm',
        color: 'text-rose-600',
        bgColor: 'bg-rose-100 dark:bg-rose-900/30',
        normalRange: { min: 60, max: 100 },
        warningRange: { min: 50, max: 120 }
    },
    bloodPressure: {
        icon: Activity,
        label: 'Pressão Arterial',
        unit: 'mmHg',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        normalRange: { min: 90, max: 120 }, // Systolic
        warningRange: { min: 80, max: 140 }
    },
    temperature: {
        icon: Thermometer,
        label: 'Temperatura',
        unit: '°C',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        normalRange: { min: 36, max: 37.5 },
        warningRange: { min: 35, max: 38.5 }
    },
    oxygenSaturation: {
        icon: Droplets,
        label: 'Saturação O₂',
        unit: '%',
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
        normalRange: { min: 95, max: 100 },
        warningRange: { min: 90, max: 100 }
    },
    respiratoryRate: {
        icon: Wind,
        label: 'Frequência Respiratória',
        unit: 'rpm',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        normalRange: { min: 12, max: 20 },
        warningRange: { min: 10, max: 25 }
    }
};

export function VitalSignsChart({ 
    readings, 
    selectedType = 'heartRate',
    onTypeChange,
    compact = false,
    daysToShow = 7
}: VitalSignsChartProps) {
    const [activeType, setActiveType] = useState<VitalType>(selectedType);
    const [dateOffset, setDateOffset] = useState(0);

    const config = vitalConfig[activeType];
    const Icon = config.icon;

    // Filter readings by type and date range
    const filteredReadings = useMemo(() => {
        const endDate = endOfDay(subDays(new Date(), dateOffset));
        const startDate = startOfDay(subDays(endDate, daysToShow - 1));

        return readings
            .filter(r => r.type === activeType)
            .filter(r => isWithinInterval(new Date(r.timestamp), { start: startDate, end: endDate }))
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [readings, activeType, dateOffset, daysToShow]);

    // Calculate statistics
    const stats = useMemo(() => {
        if (filteredReadings.length === 0) return null;

        const values = filteredReadings.map(r => r.value);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const latest = filteredReadings[filteredReadings.length - 1];
        
        // Calculate trend
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (filteredReadings.length >= 2) {
            const recent = values.slice(-3);
            const older = values.slice(0, 3);
            const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
            const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
            const diff = recentAvg - olderAvg;
            if (diff > 2) trend = 'up';
            else if (diff < -2) trend = 'down';
        }

        return { avg, min, max, latest, trend };
    }, [filteredReadings]);

    // Generate chart data
    const chartData = useMemo(() => {
        const endDate = endOfDay(subDays(new Date(), dateOffset));
        const days: { date: Date; readings: VitalReading[] }[] = [];

        for (let i = daysToShow - 1; i >= 0; i--) {
            const date = subDays(endDate, i);
            const dayReadings = filteredReadings.filter(r => 
                format(new Date(r.timestamp), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
            );
            days.push({ date, readings: dayReadings });
        }

        return days;
    }, [filteredReadings, dateOffset, daysToShow]);

    // Calculate chart dimensions
    const maxValue = stats ? Math.max(stats.max, config.warningRange.max) : config.warningRange.max;
    const minValue = stats ? Math.min(stats.min, config.warningRange.min) : config.warningRange.min;
    const range = maxValue - minValue;

    const getYPosition = (value: number) => {
        return 100 - ((value - minValue) / range) * 100;
    };

    const getStatus = (value: number) => {
        if (value >= config.normalRange.min && value <= config.normalRange.max) return 'normal';
        if (value >= config.warningRange.min && value <= config.warningRange.max) return 'warning';
        return 'critical';
    };

    const handleTypeChange = (type: VitalType) => {
        setActiveType(type);
        onTypeChange?.(type);
    };

    if (compact) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${config.bgColor}`}>
                            <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {config.label}
                        </span>
                    </div>
                    {stats && (
                        <div className="flex items-center gap-1">
                            {stats.trend === 'up' && <TrendingUp className="w-4 h-4 text-rose-500" />}
                            {stats.trend === 'down' && <TrendingDown className="w-4 h-4 text-emerald-500" />}
                            {stats.trend === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
                        </div>
                    )}
                </div>
                
                {stats ? (
                    <div className="flex items-end justify-between">
                        <div>
                            <p className={`text-2xl font-bold ${config.color}`}>
                                {activeType === 'bloodPressure' && stats.latest.secondaryValue
                                    ? `${stats.latest.value}/${stats.latest.secondaryValue}`
                                    : stats.latest.value.toFixed(activeType === 'temperature' ? 1 : 0)
                                }
                            </p>
                            <p className="text-xs text-gray-500">{config.unit}</p>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                            <p>Média: {stats.avg.toFixed(1)}</p>
                            <p>Min: {stats.min} / Max: {stats.max}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">Sem dados</p>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-cyan-600" />
                        Sinais Vitais
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setDateOffset(dateOffset + daysToShow)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-400" />
                        </button>
                        <span className="text-sm text-gray-500">
                            {format(subDays(new Date(), dateOffset + daysToShow - 1), "dd/MM", { locale: ptBR })} - {format(subDays(new Date(), dateOffset), "dd/MM", { locale: ptBR })}
                        </span>
                        <button
                            onClick={() => setDateOffset(Math.max(0, dateOffset - daysToShow))}
                            disabled={dateOffset === 0}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Type Selector */}
                <div className="flex flex-wrap gap-2">
                    {Object.entries(vitalConfig).map(([type, cfg]) => {
                        const TypeIcon = cfg.icon;
                        const typeReadings = readings.filter(r => r.type === type);
                        return (
                            <button
                                key={type}
                                onClick={() => handleTypeChange(type as VitalType)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                    activeType === type
                                        ? `${cfg.bgColor} ${cfg.color}`
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                <TypeIcon className="w-4 h-4" />
                                {cfg.label}
                                {typeReadings.length > 0 && (
                                    <span className="opacity-70">({typeReadings.length})</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Último</p>
                            <p className={`text-xl font-bold ${config.color}`}>
                                {activeType === 'bloodPressure' && stats.latest.secondaryValue
                                    ? `${stats.latest.value}/${stats.latest.secondaryValue}`
                                    : stats.latest.value.toFixed(activeType === 'temperature' ? 1 : 0)
                                }
                                <span className="text-xs font-normal text-gray-500 ml-1">{config.unit}</span>
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Média</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {stats.avg.toFixed(1)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Min / Max</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {stats.min} / {stats.max}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Tendência</p>
                            <div className="flex items-center gap-2">
                                {stats.trend === 'up' && (
                                    <>
                                        <TrendingUp className="w-5 h-5 text-rose-500" />
                                        <span className="text-rose-600 font-medium">Subindo</span>
                                    </>
                                )}
                                {stats.trend === 'down' && (
                                    <>
                                        <TrendingDown className="w-5 h-5 text-emerald-500" />
                                        <span className="text-emerald-600 font-medium">Descendo</span>
                                    </>
                                )}
                                {stats.trend === 'stable' && (
                                    <>
                                        <Minus className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-600 font-medium">Estável</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="p-4">
                {filteredReadings.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Icon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma leitura neste período</p>
                    </div>
                ) : (
                    <div className="relative h-64">
                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500">
                            <span>{maxValue}</span>
                            <span>{((maxValue + minValue) / 2).toFixed(0)}</span>
                            <span>{minValue}</span>
                        </div>

                        {/* Chart area */}
                        <div className="ml-14 h-full relative">
                            {/* Normal range background */}
                            <div 
                                className="absolute left-0 right-0 bg-emerald-50 dark:bg-emerald-900/10"
                                style={{
                                    top: `${getYPosition(config.normalRange.max)}%`,
                                    height: `${getYPosition(config.normalRange.min) - getYPosition(config.normalRange.max)}%`
                                }}
                            />

                            {/* Grid lines */}
                            <div className="absolute inset-0">
                                {[0, 25, 50, 75, 100].map(y => (
                                    <div 
                                        key={y}
                                        className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-700"
                                        style={{ top: `${y}%` }}
                                    />
                                ))}
                            </div>

                            {/* Data points and lines */}
                            <svg className="absolute inset-0 w-full h-full overflow-visible">
                                {/* Line connecting points */}
                                {filteredReadings.length > 1 && (
                                    <motion.path
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 1 }}
                                        d={filteredReadings.map((reading, i) => {
                                            const x = (i / (filteredReadings.length - 1)) * 100;
                                            const y = getYPosition(reading.value);
                                            return `${i === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                                        }).join(' ')}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className={config.color}
                                    />
                                )}

                                {/* Data points */}
                                {filteredReadings.map((reading, i) => {
                                    const x = filteredReadings.length === 1 ? 50 : (i / (filteredReadings.length - 1)) * 100;
                                    const y = getYPosition(reading.value);
                                    const status = getStatus(reading.value);

                                    return (
                                        <motion.g
                                            key={reading.id}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <circle
                                                cx={`${x}%`}
                                                cy={`${y}%`}
                                                r="6"
                                                className={`fill-white dark:fill-gray-800 stroke-2 ${
                                                    status === 'normal' ? 'stroke-emerald-500' :
                                                    status === 'warning' ? 'stroke-amber-500' :
                                                    'stroke-red-500'
                                                }`}
                                            />
                                            <circle
                                                cx={`${x}%`}
                                                cy={`${y}%`}
                                                r="3"
                                                className={
                                                    status === 'normal' ? 'fill-emerald-500' :
                                                    status === 'warning' ? 'fill-amber-500' :
                                                    'fill-red-500'
                                                }
                                            />
                                        </motion.g>
                                    );
                                })}
                            </svg>

                            {/* X-axis labels */}
                            <div className="absolute bottom-0 left-0 right-0 flex justify-between transform translate-y-6 text-xs text-gray-500">
                                {chartData.map((day, i) => (
                                    <span key={i} className="text-center">
                                        {format(day.date, 'dd/MM')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className="mt-8 flex items-center justify-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-gray-500">Normal ({config.normalRange.min}-{config.normalRange.max})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-gray-500">Atenção</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-gray-500">Crítico</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VitalSignsChart;
