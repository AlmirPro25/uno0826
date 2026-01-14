import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { Mic, MicOff, Power, RefreshCw, Database, Video, VideoOff, MessageSquare } from 'lucide-react';
import { createPcmBlob, decodeAudioData, base64ToUint8Array, AUDIO_INPUT_SAMPLE_RATE, AUDIO_OUTPUT_SAMPLE_RATE, arrayBufferToBase64 } from '../utils/audioUtils';
import AvatarDisplay from './AvatarDisplay';
import { MessageLog } from '../types';
import { generateNurseAvatar } from '../services/aiService';

interface Props {
  onSessionEnd: (transcript: string) => void;
}

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
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  // Refs for Audio/Video
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptRef = useRef<string>("");
  const videoIntervalRef = useRef<number | null>(null);

  // Initialize Avatar on Mount
  useEffect(() => {
    generateNurseAvatar().then(url => {
        if (url) setAvatarUrl(url);
        // If fail, we can have a default fallback or just wait
    });
  }, []);

  // Send Video Frames Logic
  const startVideoTransmission = () => {
    if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    
    videoIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || !sessionPromiseRef.current || !isConnected) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
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
                session.sendRealtimeInput({
                    media: {
                        mimeType: 'image/jpeg',
                        data: base64Data
                    }
                });
            } catch (e) {
                console.warn("Frame drop", e);
            }
        });
    }, 1000); // 1 FPS is enough for medical observation
  };

  const connectToGemini = async () => {
    if (!process.env.API_KEY) {
      alert("API Key not found!");
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
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
            startAudioInput();
            startVideoTransmission();
            setMessages([{ role: 'model', text: "Conexão estabelecida. Câmera e Áudio ativos.", timestamp: new Date() }]);
          },
          onmessage: async (message: LiveServerMessage) => {
            handleServerMessage(message, sessionPromise);
          },
          onclose: () => {
            console.log("Closed");
            cleanup();
          },
          onerror: (e) => {
            console.error("Error", e);
            cleanup();
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error("Connection failed", err);
      alert("Erro ao acessar câmera/microfone ou conectar com a IA.");
    }
  };

  const cleanup = () => {
    setIsConnected(false);
    setIsSpeaking(false);
    if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    
    processorRef.current?.disconnect();
    audioStreamRef.current?.getTracks().forEach(track => track.stop());
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
  };

  const startAudioInput = () => {
    if (!inputAudioContextRef.current || !audioStreamRef.current || !sessionPromiseRef.current) return;
    const ctx = inputAudioContextRef.current;
    const source = ctx.createMediaStreamSource(audioStreamRef.current);
    const processor = ctx.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      if (!isMicOn) return; 
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createPcmBlob(inputData);
      sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
    };

    source.connect(processor);
    processor.connect(ctx.destination);
    processorRef.current = processor;
  };

  const handleDisconnect = () => {
    onSessionEnd(transcriptRef.current);
    sessionPromiseRef.current?.then(session => session.close());
    cleanup();
  };

  const handleServerMessage = async (message: LiveServerMessage, sessionPromise: Promise<any>) => {
    const inputTrans = message.serverContent?.inputTranscription?.text;
    const outputTrans = message.serverContent?.outputTranscription?.text;

    if (inputTrans) {
      transcriptRef.current += `Paciente: ${inputTrans}\n`;
      setMessages(prev => [...prev, { role: 'user', text: inputTrans, timestamp: new Date() }]);
    }
    if (message.serverContent?.turnComplete && outputTrans) {
       transcriptRef.current += `Sarah (IA): ${outputTrans}\n`;
       setMessages(prev => [...prev, { role: 'model', text: outputTrans, timestamp: new Date() }]);
    }

    // Tool Execution
    if (message.toolCall) {
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[85vh] bg-slate-900 rounded-3xl p-4 lg:p-6 shadow-2xl overflow-hidden border border-slate-800">
      
      {/* LEFT PANEL: VISUAL INTERFACE */}
      <div className="flex flex-col space-y-4 h-full relative">
        
        {/* Avatar Area (AI) */}
        <div className="flex-1 relative rounded-2xl overflow-hidden shadow-lg bg-black group">
            <AvatarDisplay imageUrl={avatarUrl} isSpeaking={isSpeaking} />
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-cyan-500/30 text-cyan-400 text-xs font-mono flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`} />
                SARAH AI (NURSE-V3)
            </div>
            
            {/* Tool Overlay */}
            {toolUsage && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-amber-400 px-4 py-2 rounded-lg backdrop-blur-md border border-amber-500/30 text-sm flex items-center gap-2 animate-fade-in-up">
                    <Database className="w-4 h-4 animate-spin" />
                    <span>{toolUsage}</span>
                </div>
            )}
        </div>

        {/* User Video Feed (Self View) */}
        <div className="h-48 relative bg-black rounded-2xl overflow-hidden border border-slate-700 shadow-lg">
             <video 
                ref={videoRef} 
                className={`w-full h-full object-cover transform scale-x-[-1] ${!isVideoOn && 'opacity-0'}`} 
                muted 
                playsInline 
             />
             {!isVideoOn && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                    <VideoOff />
                </div>
             )}
             <div className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded text-[10px] text-white font-mono">
                VISÃO DO PACIENTE
             </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 bg-slate-800/50 p-4 rounded-2xl backdrop-blur border border-slate-700">
            <button onClick={() => setIsMicOn(!isMicOn)} className={`p-4 rounded-full transition-all ${isMicOn ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)]' : 'bg-slate-700 text-slate-400'}`}>
                {isMicOn ? <Mic /> : <MicOff />}
            </button>
            
            {!isConnected ? (
                <button onClick={connectToGemini} className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-full font-bold tracking-wide shadow-lg transition-all flex items-center gap-2">
                    <Power className="w-5 h-5" /> INICIAR TRIAGEM
                </button>
            ) : (
                <button onClick={handleDisconnect} className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold tracking-wide shadow-lg transition-all flex items-center gap-2 animate-pulse">
                    <RefreshCw className="w-5 h-5" /> FINALIZAR
                </button>
            )}

            <button onClick={() => setIsVideoOn(!isVideoOn)} className={`p-4 rounded-full transition-all ${isVideoOn ? 'bg-slate-600 text-white' : 'bg-red-900/50 text-red-400'}`}>
                {isVideoOn ? <Video /> : <VideoOff />}
            </button>
        </div>
      </div>

      {/* RIGHT PANEL: CHAT LOG (Design of Millions) */}
      <div className="hidden lg:flex flex-col bg-slate-800/30 rounded-2xl border border-slate-700/50 backdrop-blur-xl overflow-hidden relative">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
             <h3 className="text-cyan-400 font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> REGISTRO DE DADOS EM TEMPO REAL
             </h3>
             <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
             {messages.length === 0 && (
                <div className="text-center mt-20 opacity-30">
                    <div className="w-16 h-16 border-4 border-t-cyan-500 border-r-transparent border-b-cyan-500 border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 font-mono text-sm">AGUARDANDO INPUT DE VOZ...</p>
                </div>
             )}
             
             {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                    <span className="text-[10px] text-slate-500 mb-1 font-mono uppercase">
                        {msg.role === 'user' ? 'Paciente' : 'System_AI_Sarah'} • {msg.timestamp.toLocaleTimeString()}
                    </span>
                    <div className={`max-w-[85%] p-4 rounded-2xl backdrop-blur-sm border shadow-lg ${
                        msg.role === 'user' 
                        ? 'bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border-cyan-500/30 text-cyan-100 rounded-tr-none' 
                        : 'bg-white/5 border-white/10 text-slate-300 rounded-tl-none'
                    }`}>
                        <p className="leading-relaxed text-sm">{msg.text}</p>
                    </div>
                </div>
             ))}
             <div ref={chatEndRef} />
          </div>
          
          <div className="p-2 text-center text-[10px] text-slate-600 border-t border-white/5 bg-black/20">
             CRYPTOGRAPHICALLY SECURED SESSION • MEDICORE SYSTEMS INC.
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