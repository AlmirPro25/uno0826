import { useState, useRef, useCallback, useEffect } from 'react';

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

interface ConsultationSummary {
    chiefComplaint: string;
    historyOfPresentIllness: string;
    physicalExamFindings: string;
    assessment: string[];
    plan: string[];
    prescriptions: string[];
    followUp: string;
}

interface UseConsultationAIReturn {
    isConnected: boolean;
    isListening: boolean;
    isProcessing: boolean;
    transcript: TranscriptEntry[];
    suggestions: AISuggestion[];
    summary: ConsultationSummary | null;
    error: string | null;
    connect: () => Promise<void>;
    disconnect: () => void;
    toggleListening: () => void;
    generateSummary: () => Promise<void>;
    clearTranscript: () => void;
    dismissSuggestion: (id: string) => void;
}

const GEMINI_MODEL = 'gemini-2.5-flash-preview-native-audio-dialog';
const GEMINI_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

export function useConsultationAI(apiKey: string): UseConsultationAIReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
    const [summary, setSummary] = useState<ConsultationSummary | null>(null);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const currentTextRef = useRef<string>('');

    const systemInstruction = `Você é um assistente médico de IA integrado a uma teleconsulta em tempo real.

SUAS FUNÇÕES:
1. TRANSCREVER a conversa entre médico e paciente
2. IDENTIFICAR sintomas, queixas e informações clínicas relevantes
3. SUGERIR possíveis diagnósticos (CID-10) baseados nos sintomas
4. ALERTAR sobre red flags ou sinais de gravidade
5. SUGERIR exames complementares quando apropriado
6. AUXILIAR na prescrição com dosagens padrão

FORMATO DE RESPOSTA:
- Para transcrição: [TRANSCRIPT] Médico: "texto" ou Paciente: "texto"
- Para sugestões de diagnóstico: [DIAGNOSIS] CID: código - Nome | Confiança: X%
- Para alertas: [ALERT] Descrição do alerta
- Para sugestões de exame: [EXAM] Nome do exame - Justificativa
- Para sugestões de medicação: [MEDICATION] Medicamento - Dose - Posologia

REGRAS:
- Seja discreto e não interrompa a consulta
- Só sugira quando tiver informações suficientes
- Priorize segurança do paciente
- Nunca faça diagnóstico definitivo, apenas sugestões
- Use linguagem técnica médica
- Mantenha confidencialidade`;

    const connect = useCallback(async () => {
        if (!apiKey) {
            setError('API Key não configurada');
            return;
        }

        try {
            setError(null);
            setIsProcessing(true);

            // Initialize WebSocket
            const ws = new WebSocket(`${GEMINI_WS_URL}?key=${apiKey}`);
            wsRef.current = ws;

            ws.onopen = () => {
                // Send setup message
                const setupMessage = {
                    setup: {
                        model: `models/${GEMINI_MODEL}`,
                        generationConfig: {
                            responseModalities: ['TEXT'],
                            temperature: 0.3,
                        },
                        systemInstruction: {
                            parts: [{ text: systemInstruction }]
                        }
                    }
                };
                ws.send(JSON.stringify(setupMessage));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.setupComplete) {
                        setIsConnected(true);
                        setIsProcessing(false);
                        return;
                    }

                    // Process AI response
                    if (data.serverContent?.modelTurn?.parts) {
                        for (const part of data.serverContent.modelTurn.parts) {
                            if (part.text) {
                                processAIResponse(part.text);
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };

            ws.onerror = (e) => {
                console.error('WebSocket error:', e);
                setError('Erro na conexão com a IA');
                setIsConnected(false);
                setIsProcessing(false);
            };

            ws.onclose = () => {
                setIsConnected(false);
                setIsListening(false);
            };

        } catch (e) {
            console.error('Connection error:', e);
            setError('Falha ao conectar com a IA');
            setIsProcessing(false);
        }
    }, [apiKey]);

    const processAIResponse = useCallback((text: string) => {
        const lines = text.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Parse transcript
            if (trimmed.startsWith('[TRANSCRIPT]')) {
                const content = trimmed.replace('[TRANSCRIPT]', '').trim();
                const speaker = content.toLowerCase().startsWith('médico') ? 'doctor' : 'patient';
                const textContent = content.replace(/^(Médico|Paciente):\s*"?/i, '').replace(/"$/, '');
                
                setTranscript(prev => [...prev, {
                    id: `t-${Date.now()}`,
                    speaker,
                    text: textContent,
                    timestamp: new Date()
                }]);
            }
            // Parse diagnosis suggestion
            else if (trimmed.startsWith('[DIAGNOSIS]')) {
                const content = trimmed.replace('[DIAGNOSIS]', '').trim();
                const match = content.match(/CID:\s*([A-Z]\d+(?:\.\d+)?)\s*-\s*(.+?)(?:\s*\|\s*Confiança:\s*(\d+)%)?$/i);
                
                if (match) {
                    setSuggestions(prev => [...prev, {
                        id: `s-${Date.now()}`,
                        type: 'cid',
                        title: `${match[1]} - ${match[2]}`,
                        description: `Hipótese diagnóstica baseada nos sintomas relatados`,
                        confidence: match[3] ? parseInt(match[3]) : undefined,
                        timestamp: new Date()
                    }]);
                }
            }
            // Parse alert
            else if (trimmed.startsWith('[ALERT]')) {
                const content = trimmed.replace('[ALERT]', '').trim();
                setSuggestions(prev => [...prev, {
                    id: `s-${Date.now()}`,
                    type: 'alert',
                    title: 'Alerta Clínico',
                    description: content,
                    timestamp: new Date()
                }]);
            }
            // Parse exam suggestion
            else if (trimmed.startsWith('[EXAM]')) {
                const content = trimmed.replace('[EXAM]', '').trim();
                const [exam, justification] = content.split(' - ');
                setSuggestions(prev => [...prev, {
                    id: `s-${Date.now()}`,
                    type: 'exam',
                    title: exam || content,
                    description: justification || 'Exame sugerido para investigação',
                    timestamp: new Date()
                }]);
            }
            // Parse medication suggestion
            else if (trimmed.startsWith('[MEDICATION]')) {
                const content = trimmed.replace('[MEDICATION]', '').trim();
                setSuggestions(prev => [...prev, {
                    id: `s-${Date.now()}`,
                    type: 'medication',
                    title: content.split(' - ')[0] || content,
                    description: content,
                    timestamp: new Date()
                }]);
            }
        }
    }, []);

    const startAudioCapture = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            mediaStreamRef.current = stream;

            audioContextRef.current = new AudioContext({ sampleRate: 16000 });
            const source = audioContextRef.current.createMediaStreamSource(stream);
            const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
                
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmData = new Int16Array(inputData.length);
                
                for (let i = 0; i < inputData.length; i++) {
                    pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
                }

                const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
                
                wsRef.current.send(JSON.stringify({
                    realtimeInput: {
                        mediaChunks: [{
                            mimeType: 'audio/pcm;rate=16000',
                            data: base64Audio
                        }]
                    }
                }));
            };

            source.connect(processor);
            processor.connect(audioContextRef.current.destination);
            setIsListening(true);

        } catch (e) {
            console.error('Audio capture error:', e);
            setError('Erro ao capturar áudio');
        }
    }, []);

    const stopAudioCapture = useCallback(() => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        setIsListening(false);
    }, []);

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopAudioCapture();
        } else {
            startAudioCapture();
        }
    }, [isListening, startAudioCapture, stopAudioCapture]);

    const disconnect = useCallback(() => {
        stopAudioCapture();
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, [stopAudioCapture]);

    const generateSummary = useCallback(async () => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        
        setIsProcessing(true);
        
        const transcriptText = transcript
            .map(t => `${t.speaker === 'doctor' ? 'Médico' : 'Paciente'}: ${t.text}`)
            .join('\n');

        const summaryPrompt = `Com base na transcrição da consulta abaixo, gere um resumo estruturado no formato JSON:

TRANSCRIÇÃO:
${transcriptText}

Responda APENAS com JSON válido no formato:
{
    "chiefComplaint": "queixa principal",
    "historyOfPresentIllness": "história da doença atual",
    "physicalExamFindings": "achados do exame físico mencionados",
    "assessment": ["diagnóstico 1", "diagnóstico 2"],
    "plan": ["conduta 1", "conduta 2"],
    "prescriptions": ["prescrição 1", "prescrição 2"],
    "followUp": "orientações de retorno"
}`;

        wsRef.current.send(JSON.stringify({
            clientContent: {
                turns: [{
                    role: 'user',
                    parts: [{ text: summaryPrompt }]
                }],
                turnComplete: true
            }
        }));

        // Wait for response (simplified - in production use proper async handling)
        setTimeout(() => setIsProcessing(false), 3000);
    }, [transcript]);

    const clearTranscript = useCallback(() => {
        setTranscript([]);
        setSuggestions([]);
        setSummary(null);
    }, []);

    const dismissSuggestion = useCallback((id: string) => {
        setSuggestions(prev => prev.filter(s => s.id !== id));
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        isConnected,
        isListening,
        isProcessing,
        transcript,
        suggestions,
        summary,
        error,
        connect,
        disconnect,
        toggleListening,
        generateSummary,
        clearTranscript,
        dismissSuggestion
    };
}
