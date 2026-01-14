import React, { useEffect, useRef, useState } from 'react';
import { Camera, Mic, MicOff, Video, VideoOff, PhoneOff, RotateCcw, AlertTriangle, Disc, CheckCircle, Clock, Flame, Award, Heart, Activity } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { GEMINI_API_KEY, LIVE_MODEL, SYSTEM_INSTRUCTION_LIVE } from '../constants';
import { useAppContext } from '../context/AppContext';

// --- Audio Helpers ---
function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const LiveSession: React.FC = () => {
  const { userProfile, activePlan, history, todayStats, logWorkout, heartRate, isHeartDeviceConnected, connectHeartDevice, disconnectHeartDevice, playSound } = useAppContext();
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  
  // Session Stats
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0); // seconds
  const [showSummary, setShowSummary] = useState(false);
  const [summaryStats, setSummaryStats] = useState({ duration: 0, calories: 0, xp: 0 });

  // HTML Elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Audio State
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Gemini Session State
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const videoIntervalRef = useRef<number | null>(null);
  const visualizerAnimationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  
  // Data Tracking
  const lastSentHR = useRef<number>(0);
  const hrReadingsRef = useRef<number[]>([]);

  // Initialize Connection
  const startSession = async () => {
    try {
      playSound('on');
      setError(null);
      setShowSummary(false);
      hrReadingsRef.current = []; // Reset HR history
      
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      
      // 1. Setup Audio Output
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;
      
      // Setup Analyser for visualization (Listening to output)
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // 2. Setup Media Stream (Input)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: cameraFacingMode
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // 3. Build Rich Context for Gemini
      const todayName = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
      const todaysPlan = activePlan?.days.find(d => d.day.toLowerCase().includes(todayName.split('-')[0].toLowerCase()));
      const lastAnalysis = history[0];

      let contextPrompt = `\n--- CONTEXTO ATUAL ---`;
      contextPrompt += `\nUsuário: ${userProfile.name}. Objetivo: ${userProfile.goal}.`;
      
      if (todaysPlan) {
        contextPrompt += `\nHOJE (${todayName}) O PLANO É: ${todaysPlan.focus}. Detalhes: ${todaysPlan.workout}.`;
      } else {
        contextPrompt += `\nHoje é ${todayName}. Não há plano específico, pergunte o que o usuário quer treinar.`;
      }

      if (lastAnalysis) {
        contextPrompt += `\nMEMÓRIA RECENTE: Análise de ${lastAnalysis.type} às ${new Date(lastAnalysis.timestamp).toLocaleTimeString()}.`;
        contextPrompt += `\nResultado: ${lastAnalysis.summary}.`;
      }
      
      if (isHeartDeviceConnected) {
          contextPrompt += `\nTELEMETRIA: Monitor cardíaco conectado. Você receberá dados de BPM.`;
      }

      const fullInstruction = `${SYSTEM_INSTRUCTION_LIVE}\n${contextPrompt}`;

      // 4. Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: fullInstruction,
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Connected");
            setActive(true);
            setSessionStartTime(Date.now());
            startVisualizer();
            
            // Proactive Kickoff: Force the model to start the session immediately
            // Cast 's' to any to bypass missing 'send' property definition in current SDK types
            sessionPromise.then((s: any) => {
              // Using s.send() instead of sendRealtimeInput for text content
              if (s.send) {
                s.send({
                  role: 'user',
                  parts: [{ text: "SISTEMA: Conexão estabelecida. Inicie a sessão imediatamente cumprimentando o usuário pelo nome, informando o treino de hoje (se houver) e pedindo para ele se posicionar na frente da câmera para checagem visual." }]
                });
              }
            });

            // Start Timer
            timerIntervalRef.current = window.setInterval(() => {
                setSessionDuration(prev => prev + 1);
            }, 1000);
            
            // Start Audio Input Streaming
            const inputCtx = new AudioContextClass({ sampleRate: 16000 });
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              if (!micOn) return; 
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = floatTo16BitPCM(inputData);
              const base64Data = arrayBufferToBase64(pcm16);
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: {
                    mimeType: 'audio/pcm;rate=16000',
                    data: base64Data
                  }
                });
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
            
            inputSourceRef.current = source;
            processorRef.current = processor;

            // Start Video Frame Streaming
            const FRAME_RATE = 1; 
            videoIntervalRef.current = window.setInterval(() => {
              if (!camOn || !videoRef.current || !canvasRef.current) return;
              
              const ctx = canvasRef.current.getContext('2d');
              if (!ctx) return;

              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
              ctx.drawImage(videoRef.current, 0, 0);

              const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: {
                    mimeType: 'image/jpeg',
                    data: base64Data
                  }
                });
              });

            }, 1000 / FRAME_RATE);
          },
          onmessage: async (msg: LiveServerMessage) => {
             // Handle Audio Output
             const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData) {
               const audioBytes = base64ToUint8Array(audioData);
               const int16 = new Int16Array(audioBytes.buffer);
               const float32 = new Float32Array(int16.length);
               for(let i=0; i<int16.length; i++) {
                 float32[i] = int16[i] / 32768.0;
               }
               
               const buffer = audioCtx.createBuffer(1, float32.length, 24000);
               buffer.getChannelData(0).set(float32);

               const source = audioCtx.createBufferSource();
               source.buffer = buffer;
               source.connect(analyser); 
               analyser.connect(audioCtx.destination);
               
               const currentTime = audioCtx.currentTime;
               const startTime = Math.max(currentTime, nextStartTimeRef.current);
               source.start(startTime);
               nextStartTimeRef.current = startTime + buffer.duration;
             }
          },
          onclose: () => {
            console.log("Session Closed");
            handleSessionEnd();
          },
          onerror: (err) => {
            console.error("Session Error", err);
            setError("Erro na conexão.");
            cleanupResources();
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error(err);
      setError("Falha ao iniciar.");
    }
  };

  // --- Real-time Heart Rate Injection & Tracking ---
  useEffect(() => {
    if (active && heartRate && sessionRef.current) {
        // Track history for calculation
        hrReadingsRef.current.push(heartRate);

        // Threshold check: Only send if changed by more than 5 bpm or crossed a zone threshold
        const diff = Math.abs(heartRate - lastSentHR.current);
        const critical = heartRate > 165 || (lastSentHR.current > 165 && heartRate <= 165);
        
        // Send updates every ~5-10s normally, or immediately if critical
        if (diff >= 5 || critical) {
            sessionRef.current.then((session: any) => {
                console.log(`Sending Telemetry: ${heartRate} bpm`);
                // Using session.send() for text content injection
                if (session.send) {
                  session.send({
                    role: 'user',
                    parts: [{ text: `TELEMETRY: HR ${heartRate} bpm` }]
                  });
                }
                lastSentHR.current = heartRate;
            }).catch(() => {});
        }
    }
  }, [heartRate, active]);

  const cleanupResources = () => {
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      if (inputSourceRef.current) {
        inputSourceRef.current.disconnect();
        inputSourceRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
        videoIntervalRef.current = null;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (visualizerAnimationFrameRef.current) {
        cancelAnimationFrame(visualizerAnimationFrameRef.current);
      }
      
      // Stop tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
  }

  const handleSessionEnd = () => {
    // Determine stats
    const finalDurationSeconds = sessionDuration;
    const minutes = Math.ceil(finalDurationSeconds / 60);
    
    // Calculate Average Heart Rate
    const readings = hrReadingsRef.current;
    const avgHeartRate = readings.length > 0 
        ? readings.reduce((a, b) => a + b, 0) / readings.length 
        : 0;

    // Estimate calories based on average HR if available, else time
    // Standard calc: Calories/min ≈ (HR x 0.6309 + Weight x 0.1988 + Age x 0.2017 - 55.0969) / 4.184
    let estimatedCalories = minutes * 7; // fallback
    
    if (avgHeartRate > 60) {
         // More accurate calculation using average HR
         // Using simplified formula for demo: METs approx.
         estimatedCalories = minutes * (avgHeartRate * 0.08); 
    } else if (heartRate && heartRate > 80) {
        // Fallback to last known HR if history is weird
        estimatedCalories = minutes * (heartRate * 0.08); 
    }
    
    // XP calculation
    const gainedXp = minutes * 10;

    setSummaryStats({
        duration: minutes,
        calories: Math.floor(estimatedCalories),
        xp: gainedXp
    });

    if (minutes > 0) {
        logWorkout(minutes, Math.floor(estimatedCalories));
        setShowSummary(true);
    }
    
    setActive(false);
    cleanupResources();
    setSessionDuration(0);
    setSessionStartTime(null);
    hrReadingsRef.current = [];
  };

  const startVisualizer = () => {
    if (!visualizerCanvasRef.current || !analyserRef.current) return;
    const canvas = visualizerCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      visualizerAnimationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / dataArray.length) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i] / 2;
        ctx.fillStyle = `rgb(${barHeight + 100}, 50, 200)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  };

  const stopSession = () => {
    playSound('off');
    if (sessionRef.current) {
        sessionRef.current.then((s: any) => {
            if(s.close) s.close();
        }).catch(() => {
            // Force cleanup if close fails
            handleSessionEnd();
        });
    } else {
        handleSessionEnd();
    }
    nextStartTimeRef.current = 0;
  };

  const toggleCamera = () => {
    playSound('click');
    setCameraFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (active) {
      stopSession();
      setTimeout(startSession, 500);
    }
  };

  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, []);

  // Format Duration for UI
  const formatTime = (totalSeconds: number) => {
      const min = Math.floor(totalSeconds / 60);
      const sec = totalSeconds % 60;
      return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-black relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
      
      {/* Video Feed */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? 'scale-x-[-1]' : ''} ${showSummary ? 'blur-sm brightness-50' : ''}`}
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Audio Visualizer Overlay */}
      {active && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10 w-64 h-24 pointer-events-none opacity-80">
          <canvas ref={visualizerCanvasRef} width={256} height={100} className="w-full h-full" />
        </div>
      )}

      {/* Overlay UI */}
      <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start z-10">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${active ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
          <span className="font-mono text-xs text-white/80 uppercase">
            {active ? `AO VIVO • REC` : 'OFFLINE'}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
             {/* BLE Heart Rate Control - Moved to DeviceHub, just display here */}
             <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${isHeartDeviceConnected ? 'bg-red-900/80 border-red-500 text-white' : 'bg-slate-800/80 border-slate-600 text-slate-400'}`}>
                 {isHeartDeviceConnected ? <Activity size={14} className="animate-pulse" /> : <Heart size={14} />}
                 {isHeartDeviceConnected ? `${heartRate || '--'} BPM` : 'Sem Sensor'}
             </div>

             {active && (
                <div className="bg-red-900/50 border border-red-500/30 px-3 py-1 rounded-full text-white font-mono text-sm shadow-glow">
                    {formatTime(sessionDuration)}
                </div>
            )}
        </div>

        {error && (
          <div className="bg-red-500/90 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
             <AlertTriangle size={12} /> {error}
          </div>
        )}
      </div>

      {/* Summary Modal */}
      {showSummary && (
          <div className="absolute inset-0 flex items-center justify-center z-50 animate-fade-in-up">
              <div className="bg-slate-900/90 border border-emerald-500/50 p-8 rounded-3xl shadow-2xl backdrop-blur-xl max-w-sm w-full text-center">
                  <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/40">
                    <CheckCircle size={40} className="text-white" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-white mb-2">Sessão Finalizada</h2>
                  <p className="text-slate-400 mb-8">Dados sincronizados com o Neural Core.</p>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-slate-800 p-4 rounded-xl">
                          <Clock className="mx-auto text-blue-400 mb-2" size={20} />
                          <p className="text-xl font-bold text-white">{summaryStats.duration} <span className="text-xs font-normal">min</span></p>
                      </div>
                      <div className="bg-slate-800 p-4 rounded-xl">
                          <Flame className="mx-auto text-orange-400 mb-2" size={20} />
                          <p className="text-xl font-bold text-white">{summaryStats.calories} <span className="text-xs font-normal">kcal</span></p>
                      </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-4 rounded-xl border border-blue-500/30 mb-8 flex items-center justify-center gap-3">
                      <Award className="text-yellow-400" size={24} />
                      <span className="text-xl font-bold text-white">+{summaryStats.xp} XP</span>
                  </div>

                  <button 
                    onClick={() => { playSound('click'); setShowSummary(false); }}
                    className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                      Voltar ao Painel
                  </button>
              </div>
          </div>
      )}

      {/* Controls */}
      {!showSummary && (
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20">
            <div className="flex justify-center items-center gap-6">
            
            <button 
                onClick={() => { playSound('click'); setMicOn(!micOn); }}
                disabled={!active}
                className={`p-4 rounded-full backdrop-blur-md transition-all ${micOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/20 text-red-500'} ${!active ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {micOn ? <Mic size={24} /> : <MicOff size={24} />}
            </button>

            {!active ? (
                <button 
                onClick={startSession}
                className="p-6 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30 transition-all scale-100 hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                <Video size={32} />
                </button>
            ) : (
                <button 
                onClick={stopSession}
                className="p-6 rounded-full bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30 transition-all scale-100 hover:scale-105 active:scale-95"
                >
                <PhoneOff size={32} />
                </button>
            )}

            <button 
                onClick={toggleCamera}
                disabled={!active}
                className={`p-4 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all ${!active ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <RotateCcw size={24} />
            </button>
            </div>
        </div>
      )}

      {!active && !error && !showSummary && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-0">
          <div className="text-center max-w-md p-6">
            <h3 className="text-2xl font-bold text-white mb-2">Coach Nova</h3>
            <p className="text-slate-300 mb-6">Olá, {userProfile.name}.</p>
            {activePlan ? (
                 <div className="text-sm bg-emerald-900/30 border border-emerald-500/20 p-3 rounded mb-4 text-emerald-200">
                    <p className="font-bold mb-1">🎯 Protocolo Ativo</p>
                    <p>O Coach sabe sobre seu treino de hoje e seu histórico recente.</p>
                 </div>
            ) : (
                <p className="text-xs text-slate-500 mb-6">Pronto para focar em {userProfile.goal.replace('_', ' ')}?</p>
            )}
            
            <p className="text-xs text-slate-500 border border-slate-700 p-2 rounded">
              ⚠️ AVISO: O sistema oferece orientações gerais de bem-estar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};