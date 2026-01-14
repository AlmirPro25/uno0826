import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Stethoscope, Search, Plus, X, Check,
    AlertTriangle, Info, ChevronRight, Sparkles
} from 'lucide-react';

interface Diagnosis {
    code: string;
    name: string;
    category: string;
    severity: 'low' | 'medium' | 'high';
}

interface QuickDiagnosisProps {
    onSelect?: (diagnosis: Diagnosis) => void;
    selectedDiagnoses?: Diagnosis[];
    onRemove?: (code: string) => void;
}

export function QuickDiagnosis({ 
    onSelect, 
    selectedDiagnoses = [],
    onRemove 
}: QuickDiagnosisProps) {
    const [search, setSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Common diagnoses database (CID-10)
    const diagnoses: Diagnosis[] = [
        { code: 'J06.9', name: 'Infecção aguda das vias aéreas superiores', category: 'Respiratório', severity: 'low' },
        { code: 'J11', name: 'Influenza (gripe)', category: 'Respiratório', severity: 'medium' },
        { code: 'J18.9', name: 'Pneumonia não especificada', category: 'Respiratório', severity: 'high' },
        { code: 'K29.7', name: 'Gastrite não especificada', category: 'Digestivo', severity: 'low' },
        { code: 'K30', name: 'Dispepsia funcional', category: 'Digestivo', severity: 'low' },
        { code: 'N39.0', name: 'Infecção do trato urinário', category: 'Urinário', severity: 'medium' },
        { code: 'I10', name: 'Hipertensão essencial (primária)', category: 'Cardiovascular', severity: 'medium' },
        { code: 'E11', name: 'Diabetes mellitus tipo 2', category: 'Endócrino', severity: 'medium' },
        { code: 'M54.5', name: 'Dor lombar baixa', category: 'Musculoesquelético', severity: 'low' },
        { code: 'G43.9', name: 'Enxaqueca não especificada', category: 'Neurológico', severity: 'low' },
        { code: 'F32.9', name: 'Episódio depressivo não especificado', category: 'Mental', severity: 'medium' },
        { code: 'F41.1', name: 'Ansiedade generalizada', category: 'Mental', severity: 'medium' },
        { code: 'L30.9', name: 'Dermatite não especificada', category: 'Dermatológico', severity: 'low' },
        { code: 'H10.9', name: 'Conjuntivite não especificada', category: 'Oftalmológico', severity: 'low' },
        { code: 'R50.9', name: 'Febre não especificada', category: 'Sintomas', severity: 'low' },
        { code: 'R51', name: 'Cefaleia', category: 'Sintomas', severity: 'low' },
        { code: 'R10.4', name: 'Dor abdominal', category: 'Sintomas', severity: 'low' },
        { code: 'A09', name: 'Diarreia e gastroenterite', category: 'Infeccioso', severity: 'medium' },
    ];

    const filteredDiagnoses = diagnoses.filter(d => 
        !selectedDiagnoses.find(s => s.code === d.code) &&
        (d.name.toLowerCase().includes(search.toLowerCase()) ||
         d.code.toLowerCase().includes(search.toLowerCase()) ||
         d.category.toLowerCase().includes(search.toLowerCase()))
    );

    const recentDiagnoses = diagnoses.slice(0, 6);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            default: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
        }
    };

    const getSeverityLabel = (severity: string) => {
        switch (severity) {
            case 'high': return 'Alta';
            case 'medium': return 'Média';
            default: return 'Baixa';
        }
    };

    const handleSelect = (diagnosis: Diagnosis) => {
        onSelect?.(diagnosis);
        setSearch('');
        setShowSuggestions(false);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-cyan-600" />
                    Diagnóstico (CID-10)
                </h3>
            </div>

            {/* Search */}
            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Buscar por código CID ou descrição..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                </div>

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                    {showSuggestions && search && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-lg"
                        >
                            {filteredDiagnoses.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                    Nenhum diagnóstico encontrado
                                </div>
                            ) : (
                                filteredDiagnoses.map(diagnosis => (
                                    <button
                                        key={diagnosis.code}
                                        onClick={() => handleSelect(diagnosis)}
                                        className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left border-b border-gray-100 dark:border-gray-700 last:border-0"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm text-cyan-600 dark:text-cyan-400">
                                                    {diagnosis.code}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${getSeverityColor(diagnosis.severity)}`}>
                                                    {getSeverityLabel(diagnosis.severity)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-900 dark:text-white mt-1">
                                                {diagnosis.name}
                                            </p>
                                            <p className="text-xs text-gray-500">{diagnosis.category}</p>
                                        </div>
                                        <Plus className="w-5 h-5 text-gray-400" />
                                    </button>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Selected Diagnoses */}
            {selectedDiagnoses.length > 0 && (
                <div className="px-4 pb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Diagnósticos selecionados:
                    </p>
                    <div className="space-y-2">
                        {selectedDiagnoses.map(diagnosis => (
                            <motion.div
                                key={diagnosis.code}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl"
                            >
                                <Check className="w-5 h-5 text-cyan-600" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm text-cyan-700 dark:text-cyan-400">
                                            {diagnosis.code}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${getSeverityColor(diagnosis.severity)}`}>
                                            {getSeverityLabel(diagnosis.severity)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {diagnosis.name}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onRemove?.(diagnosis.code)}
                                    className="p-1 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded-lg"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Access */}
            {selectedDiagnoses.length === 0 && !search && (
                <div className="px-4 pb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Diagnósticos frequentes:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {recentDiagnoses.map(diagnosis => (
                            <button
                                key={diagnosis.code}
                                onClick={() => handleSelect(diagnosis)}
                                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
                            >
                                {diagnosis.code} - {diagnosis.name.substring(0, 20)}...
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-900/20">
                <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                        Selecione um ou mais diagnósticos CID-10 para incluir no prontuário do paciente.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default QuickDiagnosis;
