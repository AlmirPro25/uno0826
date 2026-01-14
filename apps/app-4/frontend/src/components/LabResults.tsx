import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    TestTube, ChevronDown, ChevronUp, Download,
    AlertTriangle, CheckCircle, Clock, Calendar,
    TrendingUp, TrendingDown, Minus, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ResultStatus = 'normal' | 'low' | 'high' | 'critical';

interface LabTest {
    id: number;
    name: string;
    value: number;
    unit: string;
    referenceMin: number;
    referenceMax: number;
    status: ResultStatus;
    previousValue?: number;
}

interface LabResult {
    id: number;
    examName: string;
    category: string;
    date: Date;
    laboratory: string;
    doctor?: string;
    status: 'pending' | 'ready' | 'reviewed';
    tests: LabTest[];
    pdfUrl?: string;
}

interface LabResultsProps {
    results: LabResult[];
    compact?: boolean;
    onDownload?: (resultId: number) => void;
    onViewDetails?: (resultId: number) => void;
}

const statusConfig: Record<ResultStatus, { color: string; bgColor: string; label: string }> = {
    normal: { color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Normal' },
    low: { color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', label: 'Baixo' },
    high: { color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', label: 'Alto' },
    critical: { color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', label: 'Crítico' }
};

export function LabResults({ results, compact = false, onDownload, onViewDetails }: LabResultsProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const getOverallStatus = (tests: LabTest[]): ResultStatus => {
        if (tests.some(t => t.status === 'critical')) return 'critical';
        if (tests.some(t => t.status === 'high' || t.status === 'low')) return 'high';
        return 'normal';
    };

    const getTrend = (current: number, previous?: number) => {
        if (!previous) return null;
        const diff = ((current - previous) / previous) * 100;
        if (diff > 5) return 'up';
        if (diff < -5) return 'down';
        return 'stable';
    };

    if (compact) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <TestTube className="w-5 h-5 text-purple-600" />
                        Exames Recentes
                    </h3>
                    <span className="text-xs text-gray-500">{results.length} resultado(s)</span>
                </div>
                <div className="space-y-2">
                    {results.slice(0, 3).map(result => {
                        const overallStatus = getOverallStatus(result.tests);
                        const statusCfg = statusConfig[overallStatus];
                        return (
                            <div 
                                key={result.id}
                                onClick={() => onViewDetails?.(result.id)}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                            >
                                <div className={`w-2 h-8 rounded-full ${statusCfg.bgColor}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {result.examName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {format(new Date(result.date), "dd/MM/yyyy")}
                                    </p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${statusCfg.bgColor} ${statusCfg.color}`}>
                                    {result.tests.filter(t => t.status !== 'normal').length || '✓'}
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
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <TestTube className="w-5 h-5 text-purple-600" />
                    Resultados de Exames
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    {results.length} exame(s) disponível(is)
                </p>
            </div>

            {/* Results List */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <TestTube className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum resultado de exame disponível</p>
                    </div>
                ) : (
                    results.map(result => {
                        const isExpanded = expandedId === result.id;
                        const overallStatus = getOverallStatus(result.tests);
                        const statusCfg = statusConfig[overallStatus];
                        const abnormalCount = result.tests.filter(t => t.status !== 'normal').length;

                        return (
                            <div key={result.id}>
                                {/* Result Header */}
                                <div 
                                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : result.id)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${statusCfg.bgColor}`}>
                                            <TestTube className={`w-6 h-6 ${statusCfg.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                                    {result.examName}
                                                </h4>
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${statusCfg.bgColor} ${statusCfg.color}`}>
                                                    {abnormalCount > 0 ? `${abnormalCount} alterado(s)` : 'Normal'}
                                                </span>
                                                {result.status === 'pending' && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                        Pendente
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {format(new Date(result.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FileText className="w-4 h-4" />
                                                    {result.laboratory}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {result.pdfUrl && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDownload?.(result.id);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </button>
                                            )}
                                            {isExpanded ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Tests */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 pb-4">
                                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="text-xs text-gray-500 uppercase tracking-wider">
                                                                <th className="px-4 py-3 text-left">Exame</th>
                                                                <th className="px-4 py-3 text-center">Resultado</th>
                                                                <th className="px-4 py-3 text-center">Referência</th>
                                                                <th className="px-4 py-3 text-center">Status</th>
                                                                <th className="px-4 py-3 text-center">Tendência</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                                            {result.tests.map(test => {
                                                                const testStatus = statusConfig[test.status];
                                                                const trend = getTrend(test.value, test.previousValue);
                                                                
                                                                return (
                                                                    <tr key={test.id} className="text-sm">
                                                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                                            {test.name}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center">
                                                                            <span className={`font-semibold ${testStatus.color}`}>
                                                                                {test.value}
                                                                            </span>
                                                                            <span className="text-gray-500 ml-1">{test.unit}</span>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center text-gray-500">
                                                                            {test.referenceMin} - {test.referenceMax} {test.unit}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center">
                                                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${testStatus.bgColor} ${testStatus.color}`}>
                                                                                {test.status === 'normal' ? (
                                                                                    <CheckCircle className="w-3 h-3" />
                                                                                ) : (
                                                                                    <AlertTriangle className="w-3 h-3" />
                                                                                )}
                                                                                {testStatus.label}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center">
                                                                            {trend === 'up' && (
                                                                                <TrendingUp className="w-4 h-4 text-rose-500 mx-auto" />
                                                                            )}
                                                                            {trend === 'down' && (
                                                                                <TrendingDown className="w-4 h-4 text-emerald-500 mx-auto" />
                                                                            )}
                                                                            {trend === 'stable' && (
                                                                                <Minus className="w-4 h-4 text-gray-400 mx-auto" />
                                                                            )}
                                                                            {!trend && (
                                                                                <span className="text-gray-400">-</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Doctor Notes */}
                                                {result.doctor && (
                                                    <div className="mt-4 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                                                        <p className="text-sm text-cyan-700 dark:text-cyan-300">
                                                            <span className="font-medium">Médico solicitante:</span> {result.doctor}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default LabResults;
