import React, { useState, useRef, useEffect } from 'react';
import { 
    Brain, 
    Mic, 
    MicOff, 
    Power, 
    PowerOff,
    AlertTriangle,
    Stethoscope,
    Pill,
    FileText,
    TestTube,
    X,
    ChevronDown,
    ChevronUp,
    Clock,
    Sparkles,
    Loader2,
    Copy,
    Check,
    Volume2,
    VolumeX
} from 'lucide-react';

interface TranscriptEntry {
    id: string;
    speaker: 'doctor' | 'patient' | 'ai';
    text: string;
    timestamp: Date;
}

interface AISuggestion {
    id: string;
    type: 'diagnosis' | 'cid' | 'medication' | 'exam' | 'alert';
    title: string;
    description: string;
    confidence?: number;
    timestamp: Date;
}

interface AIAssistantPanelProps {
    isConnected: boolean;
    isListening: boolean;
    isProcessing: boolean;
    transcript: TranscriptEntry[];
    suggestions: AISuggestion[];
    error: string | null;
    onConnect: () => void;
    onDisconnect: () => void;
    onToggleListening: () => void;
    onGenerateSummary: () => void;
    onDismissSuggestion: (id: string) => void;
    onClearTranscript: () => void;
}

export function AIAssistantPanel({
    isConnected,
    isListening,
    isProcessing,
    transcript,
    suggestions,
    error,
    onConnect,
    onDisconnect,
    onToggleListening,
    onGenerateSummary,
    onDismissSuggestion,
    onClearTranscript
}: AIAssistantPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [activeTab, setActiveTab] = useState<'transcript' | 'suggestions'>('transcript');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll transcript
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const getSuggestionIcon = (type: AISuggestion['type']) => {
        switch (type) {
            case 'diagnosis':
            case 'cid':
                return <Stethoscope className="w-4 h-4" />;
            case 'medication':
                return <Pill className="w-4 h-4" />;
            case 'exam':
                return <TestTube className="w-4 h-4" />;
            case 'alert':
                return <AlertTriangle className="w-4 h-4" />;
            default:
                return <Brain className="w-4 h-4" />;
        }
    };

    const getSuggestionColor = (type: AISuggestion['type']) => {
        switch (type) {
            case 'alert':
                return 'bg-red-500/20 border-red-500/30 text-red-200';
            case 'cid':
            case 'diagnosis':
                return 'bg-blue-500/20 border-blue-500/30 text-blue-200';
            case 'medication':
                return 'bg-purple-500/20 border-purple-500/30 text-purple-200';
            case 'exam':
                return 'bg-amber-500/20 border-amber-500/30 text-amber-200';
            default:
                return 'bg-gray-500/20 border-gray-500/30 text-gray-200';
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const alertCount = suggestions.filter(s => s.type === 'alert').length;

    return (
        <div className={`bg-gray-900/95 backdrop-blur-md border-l border-gray-800 flex flex-col transition-all duration-300 ${isExpanded ? 'w-96' : 'w-14'}`}>
            {/* Header */}
            <div className="p-3 border-b border-gray-800 flex items-center justify-between">
                <div className={`flex items-center gap-2 ${!isExpanded && 'hidden'}`}>
                    <div className={`p-1.5 rounded-lg ${isConnected ? 'bg-emerald-500/20' : 'bg-gray-700'}`}>
                        <Brain className={`w-5 h-5 ${isConnected ? 'text-emerald-400' : 'text-gray-400'}`} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">IA Assistente</h3>
                        <p className="text-xs text-gray-400">
                            {isConnected ? (isListening ? 'Escutando...' : 'Conectado') : 'Desconectado'}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-1">
                    {isExpanded && alertCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                            {alertCount} alerta{alertCount > 1 ? 's' : ''}
                        </span>
                    )}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        {isExpanded ? <ChevronDown className="w-4 h-4 rotate-90" /> : <ChevronUp className="w-4 h-4 -rotate-90" />}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <>
                    {/* Controls */}
                    <div className="p-3 border-b border-gray-800 flex items-center gap-2">
                        {!isConnected ? (
                            <button
                                onClick={onConnect}
                                disabled={isProcessing}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Power className="w-4 h-4" />
                                )}
                                {isProcessing ? 'Conectando...' : 'Ativar IA'}
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={onToggleListening}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isListening 
                                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                                >
                                    {isListening ? (
                                        <>
                                            <MicOff className="w-4 h-4" />
                                            Pausar
                                        </>
                                    ) : (
                                        <>
                                            <Mic className="w-4 h-4" />
                                            Escutar
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={onDisconnect}
                                    className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                                    title="Desconectar IA"
                                >
                                    <PowerOff className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mx-3 mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-xs">
                            {error}
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex border-b border-gray-800">
                        <button
                            onClick={() => setActiveTab('transcript')}
                            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                                activeTab === 'transcript'
                                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Transcrição
                        </button>
                        <button
                            onClick={() => setActiveTab('suggestions')}
                            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors relative ${
                                activeTab === 'suggestions'
                                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Sugestões
                            {suggestions.length > 0 && (
                                <span className="absolute top-1 right-2 w-2 h-2 bg-cyan-400 rounded-full" />
                            )}
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {activeTab === 'transcript' ? (
                            transcript.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-8">
                                    <Volume2 className="w-8 h-8 mb-2 opacity-50" />
                                    <p className="text-sm">Nenhuma transcrição ainda</p>
                                    <p className="text-xs mt-1">Ative a IA e comece a consulta</p>
                                </div>
                            ) : (
                                <>
                                    {transcript.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className={`p-2 rounded-lg text-sm ${
                                                entry.speaker === 'doctor'
                                                    ? 'bg-blue-500/10 border border-blue-500/20'
                                                    : 'bg-gray-800 border border-gray-700'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-xs font-medium ${
                                                    entry.speaker === 'doctor' ? 'text-blue-400' : 'text-gray-400'
                                                }`}>
                                                    {entry.speaker === 'doctor' ? 'Médico' : 'Paciente'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {formatTime(entry.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-gray-200">{entry.text}</p>
                                        </div>
                                    ))}
                                    <div ref={transcriptEndRef} />
                                </>
                            )
                        ) : (
                            suggestions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-8">
                                    <Sparkles className="w-8 h-8 mb-2 opacity-50" />
                                    <p className="text-sm">Nenhuma sugestão ainda</p>
                                    <p className="text-xs mt-1">A IA analisará a conversa</p>
                                </div>
                            ) : (
                                suggestions.map((suggestion) => (
                                    <div
                                        key={suggestion.id}
                                        className={`p-3 rounded-lg border ${getSuggestionColor(suggestion.type)}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                {getSuggestionIcon(suggestion.type)}
                                                <span className="font-medium text-sm">{suggestion.title}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => copyToClipboard(suggestion.title, suggestion.id)}
                                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                                    title="Copiar"
                                                >
                                                    {copiedId === suggestion.id ? (
                                                        <Check className="w-3 h-3 text-emerald-400" />
                                                    ) : (
                                                        <Copy className="w-3 h-3" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => onDismissSuggestion(suggestion.id)}
                                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                                    title="Dispensar"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs mt-1 opacity-80">{suggestion.description}</p>
                                        {suggestion.confidence && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-current rounded-full"
                                                        style={{ width: `${suggestion.confidence}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs">{suggestion.confidence}%</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )
                        )}
                    </div>

                    {/* Footer Actions */}
                    {isConnected && transcript.length > 0 && (
                        <div className="p-3 border-t border-gray-800 flex gap-2">
                            <button
                                onClick={onGenerateSummary}
                                disabled={isProcessing}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <FileText className="w-4 h-4" />
                                )}
                                Gerar Prontuário
                            </button>
                            <button
                                onClick={onClearTranscript}
                                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
                            >
                                Limpar
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Collapsed state indicator */}
            {!isExpanded && isConnected && (
                <div className="flex-1 flex flex-col items-center py-4 gap-3">
                    <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                    {alertCount > 0 && (
                        <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                            <span className="text-xs text-red-400 font-bold">{alertCount}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
