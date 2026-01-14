import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { Mic, MicOff, Power, RefreshCw, Database, Video, VideoOff, MessageSquare, Activity } from 'lucide-react';
import { createPcmBlob, decodeAudioData, base64ToUint8Array, AUDIO_INPUT_SAMPLE_RATE, AUDIO_OUTPUT_SAMPLE_RATE, arrayBufferToBase64 } from '../utils/audioUtils';
import { MessageLog } from '../types';

interface Props {
    onSessionEnd: (transcript: string) => void;
}

// Current public Multimodal Live API model
const DOCTOR_MODEL = "gemini-2.5-flash-native-audio-preview-09-2025";

// Tool: Dokingo / Internal DB
const searchDokingoFunc: FunctionDeclaration = {
    name: 'searchMedicalDatabase',
    description: 'Pesquisa no Dokingo (banco de dados médicos) por definições, protocolos, medicamentos e validação de sintomas.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            query: { type: Type.STRING, description: 'Termo médico ou sintoma a ser investigado.' }
        },
        required: ['query']
    }
};

const DoctorInterface: React.FC<Props> = ({ onSessionEnd }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [messages, setMessages] = useState<MessageLog[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [toolUsage, setToolUsage] = useState<string | null>(null);

    // Refs to track state in callbacks (avoid stale closures)
    const isConnectedRef = useRef(false);
    const isMicOnRef = useRef(true);

    // Keep refs in sync with state
    useEffect(() => { isConnectedRef.current = isConnected; }, [isConnected]);
    useEffect(() => { isMicOnRef.current = isMicOn; }, [isMicOn]);

    // Refs for Audio/Video
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);

    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const transcriptRef = useRef<string>("");
    const videoIntervalRef = useRef<number | null>(null);

    // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas');
        }
    }, []);

    // Send Video Frames Logic
    const startVideoTransmission = () => {
        if (videoIntervalRef.current) window.clearInterval(videoIntervalRef.current);

        videoIntervalRef.current = window.setInterval(async () => {
            if (!videoRef.current || !sessionPromiseRef.current || !isConnectedRef.current) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!canvas) return;

            // Draw frame to canvas (resized for performance)
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to base64
            const base64Data = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];

            sessionPromiseRef.current.then(session => {
                try {
                    // Double check connection state before sending
                    if (isConnectedRef.current) {
                        session.sendRealtimeInput({
                            media: {
                                mimeType: 'image/jpeg',
                                data: base64Data
                            }
                        });
                    }
                } catch (e) {
                    console.warn("Frame drop", e);
                }
            });
        }, 1000); // 1 FPS is enough for medical observation
    };

    const connectToGemini = async () => {
        const apiKey = localStorage.getItem('gemini_api_key') || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            alert("API Key not found! Please configure it in settings.");
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey });

            // Audio Setup
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: AUDIO_INPUT_SAMPLE_RATE });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: AUDIO_OUTPUT_SAMPLE_RATE });

            // Media Stream (Audio + Video)
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: { width: 640, height: 480 }
            });
            audioStreamRef.current = stream;

            // Attach video to local preview
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            const config = {
                model: DOCTOR_MODEL,
                config: {
                    responseModalities: [Modality.AUDIO],
                    systemInstruction: `
              Você é a Enfermeira Chefe 'Sarah', uma IA visual e auditiva avançada do Hospital MediCore.
              
              SUAS CAPACIDADES:
              1. **Visão:** Você ESTÁ VENDO o paciente pela câmera. Observe sinais físicos (palidez, suor, dor, ferimentos visíveis). Comente sobre o que vê. Ex: "Estou vendo que você está tocando a cabeça, dói muito?".
              2. **Pesquisa Inteligente:** Você não confia cegamente. Se o paciente diz algo estranho, use a ferramenta 'searchMedicalDatabase' para validar.
              3. **Empatia Realista:** Aja como um humano. Faça pausas, murmure "hm-hum" enquanto ouve.
              
              FLUXO:
              - Cumprimente e diga que está analisando os sinais vitais visuais.
              - Pergunte o que sente.
              - Cruze dados visuais + relato + pesquisa.
              - Ao final, avise que vai gerar o relatório para o médico humano.
            `,
                    tools: [{ functionDeclarations: [searchDokingoFunc] }],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                }
            };

            const sessionPromise = ai.live.connect({
                ...config,
                callbacks: {
                    onopen: () => {
                        console.log("Connection Opened");
                        setIsConnected(true);
                        setMessages([{ role: 'model', text: "Conexão estabelecida. Câmera e Áudio ativos.", timestamp: new Date() }]);

                        // Add slight delay to ensure socket is ready
                        setTimeout(() => {
                            startAudioInput();
                            startVideoTransmission();
                        }, 500);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        handleServerMessage(message, sessionPromise);
                    },
                    onclose: () => {
                        console.log("Closed");
                        cleanup();
                    },
                    onerror: (e: any) => {
                        console.error("Error", e);
                        cleanup();
                    }
                }
            });

            sessionPromiseRef.current = sessionPromise;

        } catch (err) {
            console.error("Connection failed", err);
            alert("Erro ao acessar câmera/microfone ou conectar com a IA. Verifique permissões e API Key.");
        }
    };

    const cleanup = () => {
        setIsConnected(false);
        setIsSpeaking(false);
        if (videoIntervalRef.current) window.clearInterval(videoIntervalRef.current);

        // Safely stop tracks
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
        }

        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        if (inputAudioContextRef.current) {
            inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }

        if (outputAudioContextRef.current) {
            outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }
    };

    const startAudioInput = () => {
        if (!inputAudioContextRef.current || !audioStreamRef.current || !sessionPromiseRef.current) return;
        const ctx = inputAudioContextRef.current;

        // Resume context if suspended (browser autoplay policy)
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const source = ctx.createMediaStreamSource(audioStreamRef.current);
        const processor = ctx.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (e) => {
            // Use refs to get current state (avoid stale closure)
            if (!isMicOnRef.current || !isConnectedRef.current) return;

            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createPcmBlob(inputData);

            sessionPromiseRef.current?.then(session => {
                try {
                    if (isConnectedRef.current) {
                        session.sendRealtimeInput({ media: pcmBlob });
                    }
                } catch (err) {
                    console.warn("Audio drop", err);
                }
            });
        };

        source.connect(processor);
        processor.connect(ctx.destination);
        processorRef.current = processor;
    };

    const handleDisconnect = () => {
        // Build transcript from messages if ref is empty
        let transcript = transcriptRef.current;
        if (!transcript.trim() && messages.length > 0) {
            transcript = messages.map(m => 
                `${m.role === 'user' ? 'Paciente' : 'Sarah (IA)'}: ${m.text}`
            ).join('\n');
        }
        onSessionEnd(transcript);
        sessionPromiseRef.current?.then(session => session.close());
        cleanup();
    };

    const handleServerMessage = async (message: LiveServerMessage, sessionPromise: Promise<any>) => {
        // Get transcriptions from the correct paths
        const inputTrans = (message.serverContent as any)?.inputTranscription?.text;
        const outputTrans = (message.serverContent as any)?.outputTranscription?.text;

        if (inputTrans) {
            transcriptRef.current += `Paciente: ${inputTrans}\n`;
            setMessages(prev => [...prev, { role: 'user', text: inputTrans, timestamp: new Date() }]);
        }

        // AI speech output (text) - only add when turn is complete
        if (message.serverContent?.turnComplete && outputTrans) {
            transcriptRef.current += `Sarah (IA): ${outputTrans}\n`;
            setMessages(prev => [...prev, { role: 'model', text: outputTrans, timestamp: new Date() }]);
        }

        // Tool Execution
        if (message.toolCall?.functionCalls) {
            for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'searchMedicalDatabase') {
                    const query = (fc.args as any).query;
                    setToolUsage(`Consultando bases para: "${query}"`);

                    await new Promise(r => setTimeout(r, 1000)); // Simulating API latency
                    const result = `[Dokingo DB] Resultado para ${query}: Sintomas compatíveis com virose sazonal, mas requer exclusão de dengue se houver dor retro-orbital.`;
                    setToolUsage(null);

                    sessionPromise.then(session => {
                        session.sendToolResponse({
                            functionResponses: {
                                id: fc.id,
                                name: fc.name,
                                response: { result }
                            }
                        });
                    });
                }
            }
        }

        // Audio Output
        const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (audioData && outputAudioContextRef.current) {
            setIsSpeaking(true);
            const ctx = outputAudioContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

            try {
                const buffer = await decodeAudioData(base64ToUint8Array(audioData), ctx, AUDIO_OUTPUT_SAMPLE_RATE);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);

                source.addEventListener('ended', () => {
                    sourcesRef.current.delete(source);
                    if (sourcesRef.current.size === 0) setIsSpeaking(false);
                });

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
            } catch (e) { console.error(e); }
        }
    };

    const chatEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- RENDER ---
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-120px)] max-h-[800px] bg-slate-900 rounded-2xl p-2 shadow-2xl overflow-hidden border border-slate-800">

            {/* LEFT PANEL: VISUAL INTERFACE */}
            <div className="flex flex-col gap-2 h-full relative min-h-0 overflow-hidden">

                {/* Avatar Area (REPLACED WITH PULSING AI CORE) */}
                <div className="flex-1 min-h-0 relative rounded-xl overflow-hidden shadow-lg bg-black group flex flex-col items-center justify-center p-4 border border-white/5">

                    {/* The "AI Core" Visualization */}
                    <div className={`relative transition-all duration-500 ease-in-out transform ${isSpeaking ? 'scale-110' : 'scale-100'}`}>
                        {/* Outer Glow Ring */}
                        <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 transition-colors duration-300 ${isSpeaking ? 'bg-cyan-500' : 'bg-slate-700'}`} />

                        {/* Main Orb Container */}
                        <div className={`relative w-24 h-24 rounded-full flex items-center justify-center border-4 backdrop-blur-sm z-10 transition-all duration-300 ${isSpeaking
                            ? 'border-cyan-400 bg-cyan-950/30'
                            : 'border-slate-700 bg-slate-900/50'
                            }`}>
                            {/* Inner Pulse */}
                            <Activity
                                className={`w-10 h-10 transition-all duration-100 ${isSpeaking
                                    ? 'text-cyan-300 animate-pulse drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]'
                                    : 'text-slate-600'
                                    }`}
                                strokeWidth={1.5}
                            />
                        </div>

                        {/* Orbiting Particles */}
                        <div className={`absolute inset-0 rounded-full border border-cyan-500/20 w-32 h-32 -mr-4 -mt-4 animate-spin-slow ${isSpeaking ? 'opacity-100' : 'opacity-0'}`} />
                    </div>

                    <div className="mt-6 text-center z-10">
                        <div className="text-cyan-400 font-mono text-[10px] tracking-[0.2em] mb-1 uppercase opacity-80">
                            {isSpeaking ? 'Transmitindo...' : isConnected ? 'Monitorando...' : 'Offline'}
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-wide">
                            SARAH AI
                        </h3>
                    </div>

                    {/* Tool Overlay */}
                    {toolUsage && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-amber-400 px-3 py-1.5 rounded-lg backdrop-blur-md border border-amber-500/30 text-xs flex items-center gap-2 animate-fade-in-up z-20 whitespace-nowrap">
                            <Database className="w-3 h-3 animate-spin" />
                            <span>{toolUsage}</span>
                        </div>
                    )}

                    {/* Background Effects */}
                    <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent opacity-50" />
                    <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                </div>

                {/* VISÃO DUPLA (PACIENTE + CONTROLES) */}
                <div className="flex gap-3 h-28 shrink-0">
                    {/* User Video Feed */}
                    <div className="flex-1 relative bg-black rounded-xl overflow-hidden border border-slate-700 shadow-lg">
                        <video
                            ref={videoRef}
                            className={`w-full h-full object-cover transform scale-x-[-1] ${!isVideoOn && 'opacity-0'}`}
                            muted
                            playsInline
                            autoPlay
                        />
                        {!isVideoOn && (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                                <VideoOff />
                            </div>
                        )}
                        <div className="absolute bottom-1 right-2 bg-black/50 px-1.5 py-0.5 rounded text-[9px] text-white font-mono">
                            VOCÊ
                        </div>
                    </div>

                    {/* Controls Grid */}
                    <div className="w-24 flex flex-col gap-2">
                        <button
                            onClick={() => setIsMicOn(!isMicOn)}
                            className={`flex-1 rounded-xl transition-all flex items-center justify-center ${isMicOn ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                        >
                            {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
                        </button>
                        <button
                            onClick={() => setIsVideoOn(!isVideoOn)}
                            className={`flex-1 rounded-xl transition-all flex items-center justify-center ${isVideoOn ? 'bg-slate-700 text-white' : 'bg-red-900/50 text-red-400'}`}
                        >
                            {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
                        </button>
                    </div>
                </div>

                {/* Main Action Button (Full Width) */}
                {!isConnected ? (
                    <button onClick={connectToGemini} className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 shrink-0">
                        <Power className="w-5 h-5" /> INICIAR SESSÃO
                    </button>
                ) : (
                    <button onClick={handleDisconnect} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 shrink-0">
                        <RefreshCw className="w-5 h-5" /> FINALIZAR ATENDIMENTO
                    </button>
                )}

            </div>

            {/* RIGHT PANEL: CHAT LOG */}
            <div className="hidden lg:flex flex-col bg-slate-800/30 rounded-xl border border-slate-700/50 backdrop-blur-xl overflow-hidden relative h-full max-h-full">
                <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <h3 className="text-cyan-400 font-bold flex items-center gap-2 text-sm">
                        <MessageSquare className="w-4 h-4" /> REGISTRO CLÍNICO
                    </h3>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500/50"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500/50"></div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {messages.length === 0 && (
                        <div className="text-center mt-20 opacity-30">
                            <div className="w-12 h-12 border-4 border-t-cyan-500 border-r-transparent border-b-cyan-500 border-l-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-slate-400 font-mono text-xs">AGUARDANDO...</p>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                            <span className="text-[9px] text-slate-500 mb-1 font-mono uppercase">
                                {msg.role === 'user' ? 'Paciente' : 'AI'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className={`max-w-[90%] p-3 rounded-xl backdrop-blur-sm border shadow-md text-sm ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border-cyan-500/30 text-cyan-100 rounded-tr-none'
                                : 'bg-white/5 border-white/10 text-slate-300 rounded-tl-none'
                                }`}>
                                <p className="leading-relaxed">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <div className="p-1.5 text-center text-[9px] text-slate-600 border-t border-white/5 bg-black/20">
                    MEDICORE SYSTEMS INC • SECURE LOG
                </div>
            </div>

            <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; opacity: 0; }
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; opacity: 0; transform: translateY(10px) translateX(-50%); }
        @keyframes fadeIn { to { opacity: 1; } }
        @keyframes fadeInUp { to { opacity: 1; transform: translateY(0) translateX(-50%); } }
        /* Custom Scrollbar for Chat */
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>
        </div>
    );
};

export default DoctorInterface;
