import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
    FileText, Save, Clock, Mic, MicOff,
    Sparkles, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';

interface ConsultationNotesProps {
    consultationId?: string;
    patientName?: string;
    onSave?: (notes: string) => void;
    initialNotes?: string;
    aiAssisted?: boolean;
}

export function ConsultationNotes({ 
    patientName = 'Paciente',
    onSave,
    initialNotes = '',
    aiAssisted = true
}: ConsultationNotesProps) {
    const [notes, setNotes] = useState(initialNotes);
    const [isRecording, setIsRecording] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-save every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (notes !== initialNotes) {
                handleSave(true);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [notes, initialNotes]);

    // Mock AI suggestions based on content
    useEffect(() => {
        if (aiAssisted && notes.length > 50) {
            const suggestions = [];
            if (notes.toLowerCase().includes('dor')) {
                suggestions.push('Considerar prescrição de analgésico');
                suggestions.push('Solicitar exames complementares');
            }
            if (notes.toLowerCase().includes('febre')) {
                suggestions.push('Verificar sinais de infecção');
                suggestions.push('Considerar hemograma completo');
            }
            if (notes.toLowerCase().includes('pressão')) {
                suggestions.push('Monitorar pressão arterial');
                suggestions.push('Avaliar necessidade de anti-hipertensivo');
            }
            setAiSuggestions(suggestions);
            setShowSuggestions(suggestions.length > 0);
        }
    }, [notes, aiAssisted]);

    const handleSave = async (auto = false) => {
        setIsSaving(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            onSave?.(notes);
            setLastSaved(new Date());
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            setIsRecording(false);
            // Simulate transcription
            setNotes(prev => prev + '\n\n[Transcrição de áudio]: Paciente relata melhora dos sintomas após início do tratamento.');
        } else {
            setIsRecording(true);
        }
    };

    const applySuggestion = (suggestion: string) => {
        setNotes(prev => prev + `\n\n📌 ${suggestion}`);
        setAiSuggestions(prev => prev.filter(s => s !== suggestion));
    };

    const templates = [
        { label: 'SOAP', template: '**S (Subjetivo):**\n\n**O (Objetivo):**\n\n**A (Avaliação):**\n\n**P (Plano):**\n' },
        { label: 'Anamnese', template: '**Queixa Principal:**\n\n**HDA:**\n\n**Antecedentes:**\n\n**Exame Físico:**\n\n**Hipótese Diagnóstica:**\n\n**Conduta:**\n' },
        { label: 'Retorno', template: '**Evolução desde última consulta:**\n\n**Medicações em uso:**\n\n**Exames realizados:**\n\n**Conduta atual:**\n' },
    ];

    const applyTemplate = (template: string) => {
        if (notes.trim() === '' || confirm('Isso substituirá o conteúdo atual. Continuar?')) {
            setNotes(template);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-cyan-600" />
                            Anotações da Consulta
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Paciente: {patientName}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {lastSaved && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Salvo às {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        <button
                            onClick={() => handleSave()}
                            disabled={isSaving}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                                saved 
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                            }`}
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : saved ? (
                                <CheckCircle className="w-4 h-4" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {saved ? 'Salvo!' : 'Salvar'}
                        </button>
                    </div>
                </div>

                {/* Templates */}
                <div className="flex gap-2 mt-3">
                    <span className="text-xs text-gray-500 py-1">Templates:</span>
                    {templates.map(t => (
                        <button
                            key={t.label}
                            onClick={() => applyTemplate(t.template)}
                            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Editor */}
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Digite suas anotações aqui...

Use os templates acima para estruturar suas notas ou comece a digitar livremente."
                    className="w-full h-80 p-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none"
                />

                {/* Recording Indicator */}
                {isRecording && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="w-2 h-2 bg-red-500 rounded-full"
                        />
                        <span className="text-sm font-medium">Gravando...</span>
                    </motion.div>
                )}
            </div>

            {/* AI Suggestions */}
            {aiAssisted && showSuggestions && aiSuggestions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
                            Sugestões da IA
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {aiSuggestions.map((suggestion, i) => (
                            <button
                                key={i}
                                onClick={() => applySuggestion(suggestion)}
                                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 rounded-lg text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                            >
                                + {suggestion}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleRecording}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                            isRecording
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                    >
                        {isRecording ? (
                            <>
                                <MicOff className="w-4 h-4" />
                                Parar
                            </>
                        ) : (
                            <>
                                <Mic className="w-4 h-4" />
                                Gravar
                            </>
                        )}
                    </button>
                </div>

                <div className="text-xs text-gray-400">
                    {notes.length} caracteres • Auto-save ativo
                </div>
            </div>
        </div>
    );
}

export default ConsultationNotes;
