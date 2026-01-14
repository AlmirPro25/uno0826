import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Search, X, ChevronRight, AlertTriangle, CheckCircle,
    Thermometer, HeartPulse, Stethoscope, Pill, Calendar, Loader2,
    Sparkles, ArrowRight, Clock, MapPin
} from 'lucide-react';
import Link from 'next/link';

interface Symptom {
    id: string;
    name: string;
    category: string;
    severity: 'low' | 'medium' | 'high';
}

interface AnalysisResult {
    possibleConditions: { name: string; probability: number; severity: string }[];
    recommendedSpecialty: string;
    urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
    recommendations: string[];
    shouldSeekCare: boolean;
}

const symptomCategories = [
    { id: 'head', name: 'Cabeça', icon: '🧠' },
    { id: 'chest', name: 'Peito', icon: '💗' },
    { id: 'stomach', name: 'Abdômen', icon: '🫃' },
    { id: 'limbs', name: 'Membros', icon: '💪' },
    { id: 'skin', name: 'Pele', icon: '🖐️' },
    { id: 'general', name: 'Geral', icon: '🏥' },
];

const commonSymptoms: Symptom[] = [
    { id: 's1', name: 'Dor de cabeça', category: 'head', severity: 'low' },
    { id: 's2', name: 'Tontura', category: 'head', severity: 'medium' },
    { id: 's3', name: 'Visão turva', category: 'head', severity: 'high' },
    { id: 's4', name: 'Dor no peito', category: 'chest', severity: 'high' },
    { id: 's5', name: 'Falta de ar', category: 'chest', severity: 'high' },
    { id: 's6', name: 'Palpitações', category: 'chest', severity: 'medium' },
    { id: 's7', name: 'Dor abdominal', category: 'stomach', severity: 'medium' },
    { id: 's8', name: 'Náusea', category: 'stomach', severity: 'low' },
    { id: 's9', name: 'Vômito', category: 'stomach', severity: 'medium' },
    { id: 's10', name: 'Diarreia', category: 'stomach', severity: 'low' },
    { id: 's11', name: 'Dor nas articulações', category: 'limbs', severity: 'low' },
    { id: 's12', name: 'Inchaço', category: 'limbs', severity: 'medium' },
    { id: 's13', name: 'Fraqueza muscular', category: 'limbs', severity: 'medium' },
    { id: 's14', name: 'Erupção cutânea', category: 'skin', severity: 'low' },
    { id: 's15', name: 'Coceira intensa', category: 'skin', severity: 'low' },
    { id: 's16', name: 'Febre', category: 'general', severity: 'medium' },
    { id: 's17', name: 'Fadiga', category: 'general', severity: 'low' },
    { id: 's18', name: 'Perda de apetite', category: 'general', severity: 'low' },
    { id: 's19', name: 'Calafrios', category: 'general', severity: 'medium' },
    { id: 's20', name: 'Suor noturno', category: 'general', severity: 'medium' },
];

interface SymptomCheckerProps {
    onClose?: () => void;
    compact?: boolean;
}

export function SymptomChecker({ onClose, compact = false }: SymptomCheckerProps) {
    const [step, setStep] = useState<'select' | 'duration' | 'analyzing' | 'result'>('select');
    const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [duration, setDuration] = useState<string>('');
    const [result, setResult] = useState<AnalysisResult | null>(null);


    const toggleSymptom = (symptom: Symptom) => {
        setSelectedSymptoms(prev => 
            prev.find(s => s.id === symptom.id)
                ? prev.filter(s => s.id !== symptom.id)
                : [...prev, symptom]
        );
    };

    const filteredSymptoms = commonSymptoms.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || s.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const analyzeSymptoms = useCallback(async () => {
        setStep('analyzing');
        
        // Simulate AI analysis
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        const hasHighSeverity = selectedSymptoms.some(s => s.severity === 'high');
        const hasMediumSeverity = selectedSymptoms.some(s => s.severity === 'medium');
        
        let urgencyLevel: 'low' | 'medium' | 'high' | 'emergency' = 'low';
        if (hasHighSeverity && selectedSymptoms.length >= 2) urgencyLevel = 'emergency';
        else if (hasHighSeverity) urgencyLevel = 'high';
        else if (hasMediumSeverity) urgencyLevel = 'medium';

        const conditions = [
            { name: 'Gripe comum', probability: 65, severity: 'Leve' },
            { name: 'Infecção viral', probability: 45, severity: 'Moderada' },
            { name: 'Estresse/Ansiedade', probability: 30, severity: 'Leve' },
        ];

        if (selectedSymptoms.find(s => s.category === 'chest')) {
            conditions.unshift({ name: 'Avaliação cardíaca recomendada', probability: 70, severity: 'Importante' });
        }

        const specialties: Record<string, string> = {
            head: 'Neurologia',
            chest: 'Cardiologia',
            stomach: 'Gastroenterologia',
            limbs: 'Ortopedia',
            skin: 'Dermatologia',
            general: 'Clínica Geral',
        };

        const mainCategory = selectedSymptoms[0]?.category || 'general';

        setResult({
            possibleConditions: conditions,
            recommendedSpecialty: specialties[mainCategory],
            urgencyLevel,
            recommendations: [
                'Mantenha-se hidratado',
                'Descanse adequadamente',
                urgencyLevel === 'emergency' ? 'Procure atendimento imediato' :
                urgencyLevel === 'high' ? 'Agende uma consulta em breve' :
                'Monitore os sintomas por 24-48h',
            ],
            shouldSeekCare: urgencyLevel !== 'low',
        });
        
        setStep('result');
    }, [selectedSymptoms]);

    const getUrgencyColor = (level: string) => {
        switch (level) {
            case 'emergency': return 'bg-red-500 text-white';
            case 'high': return 'bg-orange-500 text-white';
            case 'medium': return 'bg-yellow-500 text-black';
            default: return 'bg-green-500 text-white';
        }
    };

    const getUrgencyText = (level: string) => {
        switch (level) {
            case 'emergency': return 'Emergência - Procure atendimento imediato';
            case 'high': return 'Alta - Consulte um médico em breve';
            case 'medium': return 'Média - Monitore e agende consulta';
            default: return 'Baixa - Autocuidado recomendado';
        }
    };

    const reset = () => {
        setStep('select');
        setSelectedSymptoms([]);
        setSearchQuery('');
        setSelectedCategory(null);
        setDuration('');
        setResult(null);
    };

    if (compact) {
        return (
            <Link href="/ai/triage" className="block">
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-4 border border-purple-200 dark:border-purple-800 hover:border-purple-400 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Verificador de Sintomas</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Análise rápida com IA</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                </div>
            </Link>
        );
    }


    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900 dark:text-white">Verificador de Sintomas</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Análise inteligente com IA</p>
                        </div>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-6">
                <AnimatePresence mode="wait">
                    {/* Step 1: Select Symptoms */}
                    {step === 'select' && (
                        <motion.div
                            key="select"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Buscar sintomas..."
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {/* Categories */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                                        !selectedCategory 
                                            ? 'bg-purple-500 text-white' 
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                    }`}
                                >
                                    Todos
                                </button>
                                {symptomCategories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors flex items-center gap-1 ${
                                            selectedCategory === cat.id 
                                                ? 'bg-purple-500 text-white' 
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                        }`}
                                    >
                                        <span>{cat.icon}</span>
                                        {cat.name}
                                    </button>
                                ))}
                            </div>

                            {/* Selected Symptoms */}
                            {selectedSymptoms.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                    {selectedSymptoms.map(symptom => (
                                        <span
                                            key={symptom.id}
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500 text-white rounded-full text-sm"
                                        >
                                            {symptom.name}
                                            <button onClick={() => toggleSymptom(symptom)}>
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Symptoms List */}
                            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                                {filteredSymptoms.map(symptom => (
                                    <button
                                        key={symptom.id}
                                        onClick={() => toggleSymptom(symptom)}
                                        className={`p-3 rounded-xl text-left text-sm transition-colors ${
                                            selectedSymptoms.find(s => s.id === symptom.id)
                                                ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                                                : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:border-purple-300'
                                        }`}
                                    >
                                        <span className="font-medium text-gray-900 dark:text-white">{symptom.name}</span>
                                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                                            symptom.severity === 'high' ? 'bg-red-100 text-red-600' :
                                            symptom.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                            'bg-green-100 text-green-600'
                                        }`}>
                                            {symptom.severity === 'high' ? 'Alto' : symptom.severity === 'medium' ? 'Médio' : 'Baixo'}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Continue Button */}
                            <button
                                onClick={() => setStep('duration')}
                                disabled={selectedSymptoms.length === 0}
                                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                Continuar
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    )}


                    {/* Step 2: Duration */}
                    {step === 'duration' && (
                        <motion.div
                            key="duration"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="text-center">
                                <Clock className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Há quanto tempo você sente esses sintomas?
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {['Menos de 24h', '1-3 dias', '4-7 dias', 'Mais de 1 semana'].map(option => (
                                    <button
                                        key={option}
                                        onClick={() => setDuration(option)}
                                        className={`p-4 rounded-xl text-center transition-colors ${
                                            duration === option
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                                        }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep('select')}
                                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={analyzeSymptoms}
                                    disabled={!duration}
                                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Analisar
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Analyzing */}
                    {step === 'analyzing' && (
                        <motion.div
                            key="analyzing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-12"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                className="w-16 h-16 mx-auto mb-6"
                            >
                                <Brain className="w-16 h-16 text-purple-500" />
                            </motion.div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Analisando seus sintomas...
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                Nossa IA está processando as informações
                            </p>
                            <div className="flex justify-center gap-1 mt-4">
                                {[0, 1, 2].map(i => (
                                    <motion.div
                                        key={i}
                                        animate={{ scale: [1, 1.5, 1] }}
                                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                                        className="w-2 h-2 bg-purple-500 rounded-full"
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Results */}
                    {step === 'result' && result && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {/* Urgency Banner */}
                            <div className={`p-4 rounded-xl ${getUrgencyColor(result.urgencyLevel)}`}>
                                <div className="flex items-center gap-3">
                                    {result.urgencyLevel === 'emergency' || result.urgencyLevel === 'high' ? (
                                        <AlertTriangle className="w-6 h-6" />
                                    ) : (
                                        <CheckCircle className="w-6 h-6" />
                                    )}
                                    <div>
                                        <p className="font-semibold">Nível de Urgência</p>
                                        <p className="text-sm opacity-90">{getUrgencyText(result.urgencyLevel)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Possible Conditions */}
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Stethoscope className="w-5 h-5 text-purple-500" />
                                    Possíveis Condições
                                </h3>
                                <div className="space-y-2">
                                    {result.possibleConditions.map((condition, i) => (
                                        <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-gray-900 dark:text-white">{condition.name}</span>
                                                <span className="text-sm text-gray-500">{condition.probability}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${condition.probability}%` }}
                                                    className="bg-purple-500 h-2 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recommended Specialty */}
                            <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center">
                                        <Stethoscope className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Especialidade Recomendada</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{result.recommendedSpecialty}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Pill className="w-5 h-5 text-pink-500" />
                                    Recomendações
                                </h3>
                                <ul className="space-y-2">
                                    {result.recommendations.map((rec, i) => (
                                        <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                                            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={reset}
                                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Nova Análise
                                </button>
                                {result.shouldSeekCare && (
                                    <Link href="/ai/medicore" className="flex-1">
                                        <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 flex items-center justify-center gap-2">
                                            <Brain className="w-5 h-5" />
                                            Triagem Completa
                                        </button>
                                    </Link>
                                )}
                            </div>

                            {/* Disclaimer */}
                            <p className="text-xs text-gray-400 text-center">
                                ⚠️ Esta análise é apenas informativa e não substitui uma consulta médica profissional.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default SymptomChecker;
