import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import BrainHUD from './components/BrainHUD';
import IntakeTerminal from './components/IntakeTerminal';
import SessionReport from './components/SessionReport';
import { BrainRegion, AgentState, LogEntry, CognitiveManifesto, PatientProfile, MedicalRecord, TranscriptItem } from './types';
import { BASE_SYSTEM_INSTRUCTION, AUDIO_SAMPLE_RATE, AUDIO_OUTPUT_RATE } from './constants';
import { createAudioContext, float32ToInt16, blobToBase64 } from './services/audioUtils';
import { SubconsciousService } from './services/subconscious';
import { AgentFactory } from './services/agentFactory';

const App: React.FC = () => {
  // STATE
  const [apiKey, setApiKey] = useState(process.env.API_KEY || '');
  const [viewState, setViewState] = useState<'INTAKE' | 'STANDBY' | 'SESSION' | 'REPORT'>('INTAKE');
  
  // Data for the session
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [agentState, setAgentState] = useState<AgentState>(AgentState.IDLE);
  const [audioLevel, setAudioLevel] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [videoUplinkActive, setVideoUplinkActive] = useState(false); // Visual feedback for frame sent
  
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [manifesto, setManifesto] = useState<CognitiveManifesto | null>(null);
  const [finalReport, setFinalReport] = useState<MedicalRecord | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // REFS
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const subconsciousRef = useRef<SubconsciousService | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentSessionRef = useRef<any>(null);
  const videoIntervalRef = useRef<number | null>(null);

  // LOGGING HELPER
  const addLog = useCallback((log: LogEntry) => {
    setLogs(prev => [...prev, log]);
  }, []);

  // INITIALIZE SUBCONSCIOUS
  useEffect(() => {
    if (apiKey) {
      subconsciousRef.current = new SubconsciousService(apiKey);
    }
  }, [apiKey]);

  // HANDLER: INSTANTIATION (Goes to STANDBY now)
  const handleInstantiate = (profile: PatientProfile, generatedManifesto: CognitiveManifesto) => {
      setPatientProfile(profile);
      setManifesto(generatedManifesto);
      setViewState('STANDBY'); 
  };

  // HANDLER: START CONNECTION (User Gesture Required)
  const initiateNeuralLink = () => {
      if (patientProfile && manifesto) {
          startSession(patientProfile, manifesto);
      }
  };

  // TOOL DEFINITIONS (The Nervous System)
  const getTools = (): FunctionDeclaration[] => [
    {
      name: 'consult_medical_database',
      description: 'Use for clinical research. Input detailed medical queries.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: { type: Type.STRING, description: 'Medical query.' }
        },
        required: ['query']
      }
    },
    {
      name: 'fast_symptom_triage',
      description: 'Run triage protocol on symptoms.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          symptoms: { type: Type.STRING }
        },
        required: ['symptoms']
      }
    },
    {
        name: 'analyze_visual_input',
        description: 'Analyze specific details in the current camera view.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                focus: { type: Type.STRING, description: 'Aspect to analyze.'}
            }
        }
    },
    {
        name: 'check_drug_interactions',
        description: 'Check for contraindications/interactions between drugs and conditions. Safety protocol.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                medication: { type: Type.STRING },
                condition: { type: Type.STRING }
            },
            required: ['medication', 'condition']
        }
    }
  ];

  // FILE UPLOAD HANDLER
  const handleFileUpload = async (file: File) => {
      if (!currentSessionRef.current) return;
      
      const reader = new FileReader();
      reader.onload = () => {
          const base64Data = (reader.result as string).split(',')[1];
          const mimeType = file.type;
          
          addLog({
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              region: BrainRegion.FRONTAL,
              type: 'info',
              message: `Ingesting Data: ${file.name}`
          });

          currentSessionRef.current?.sendRealtimeInput([{
              mimeType: mimeType,
              data: base64Data
          }]);
      };
      reader.readAsDataURL(file);
  };

  // CONNECT LIVE SESSION
  const startSession = async (profile: PatientProfile, agentManifesto: CognitiveManifesto) => {
    if (!apiKey || !subconsciousRef.current) return;
    
    setViewState('SESSION');
    setConnectionStatus('ESTABLISHING SECURE UPLINK...');
    setAgentState(AgentState.LISTENING);
    setLogs([]); 
    setTranscripts([]);
    
    addLog({
        id: 'sys-start', timestamp: Date.now(), region: BrainRegion.FRONTAL, type: 'info', 
        message: `SYSTEM LIVE. Agent: ${agentManifesto.role}` 
    });

    const ai = new GoogleGenAI({ apiKey });
    
    // Setup Audio & Video
    const ctx = createAudioContext(AUDIO_OUTPUT_RATE);
    audioContextRef.current = ctx;
    nextStartTimeRef.current = ctx.currentTime;

    const inputCtx = createAudioContext(AUDIO_SAMPLE_RATE);
    inputContextRef.current = inputCtx;
    
    try {
        // CRITICAL: RESUME CONTEXTS WITHIN USER GESTURE
        await ctx.resume();
        await inputCtx.resume();

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: 640, height: 480 } });
        setMediaStream(stream);
        
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
        }

        const dynamicSystemInstruction = `
        ${BASE_SYSTEM_INSTRUCTION}

        === CURRENT PATIENT CONTEXT ===
        Name: ${profile.name}
        Age: ${profile.age} | Sex: ${profile.gender}
        Chief Complaint: ${profile.chiefComplaint}

        === YOUR MANIFESTO ===
        You have been instantiated as: ${agentManifesto.role}
        Specialty focus: ${agentManifesto.specialty}
        Mission Context: ${agentManifesto.context}
        Tone: ${agentManifesto.tone}
        
        Start by greeting the patient by name and asking about their chief complaint.
        `;

        const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: { model: "google-provided-model" },
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: agentManifesto.voiceName || 'Puck' } }
            },
            systemInstruction: dynamicSystemInstruction,
            tools: [{ functionDeclarations: getTools() }]
        },
        callbacks: {
            onopen: () => {
                setConnectionStatus(''); 
                addLog({ id: 'conn-open', timestamp: Date.now(), region: BrainRegion.FRONTAL, type: 'info', message: 'Neural Link Established' });
            
                // PROCESS INPUT AUDIO
                const source = inputCtx.createMediaStreamSource(stream);
                const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                
                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    let sum = 0;
                    for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
                    const avg = sum / inputData.length;
                    setAudioLevel(prev => (prev * 0.7) + (avg * 5.0 * 0.3)); 

                    const pcm16 = float32ToInt16(inputData);
                    const pcmBlob = new Blob([pcm16], { type: 'audio/pcm' });
                    
                    blobToBase64(pcmBlob).then(base64 => {
                        sessionPromise.then(session => session.sendRealtimeInput({ media: { mimeType: 'audio/pcm', data: base64 } }));
                    });
                };

                source.connect(processor);
                processor.connect(inputCtx.destination);

                // START VISUAL STREAM (1 FPS)
                videoIntervalRef.current = window.setInterval(() => {
                    if (videoRef.current && canvasRef.current) {
                        const v = videoRef.current;
                        const c = canvasRef.current;
                        if (v.readyState === 4) {
                            c.width = v.videoWidth * 0.5;
                            c.height = v.videoHeight * 0.5;
                            const context = c.getContext('2d');
                            if (context) {
                                context.drawImage(v, 0, 0, c.width, c.height);
                                const base64 = c.toDataURL('image/jpeg', 0.5).split(',')[1];
                                
                                // FLASH UPLINK INDICATOR
                                setVideoUplinkActive(true);
                                setTimeout(() => setVideoUplinkActive(false), 200);

                                sessionPromise.then(session => {
                                    session.sendRealtimeInput({ 
                                        media: { mimeType: 'image/jpeg', data: base64 } 
                                    });
                                });
                            }
                        }
                    }
                }, 1000); 
            },
            onmessage: async (msg: LiveServerMessage) => {
                const serverContent = msg.serverContent;
                // TRANSCRIPTIONS
                if (serverContent) {
                    if (serverContent.modelTurn) {
                        const parts = serverContent.modelTurn.parts;
                        for (const part of parts) {
                            if (part.text) {
                                setTranscripts(prev => [...prev, {
                                    id: crypto.randomUUID(),
                                    source: 'AGENT',
                                    text: part.text,
                                    isFinal: true,
                                    timestamp: Date.now()
                                }]);
                            }
                        }
                    }
                    if (serverContent.inputTranscription) {
                        const text = serverContent.inputTranscription.text;
                        if (text) {
                            setTranscripts(prev => {
                                const newId = crypto.randomUUID();
                                return [...prev, {
                                    id: newId,
                                    source: 'USER',
                                    text: text,
                                    isFinal: false,
                                    timestamp: Date.now()
                                }];
                            });
                        }
                    }
                }

                // AUDIO OUTPUT
                const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (audioData) {
                    setAgentState(AgentState.SPEAKING);
                    const binary = window.atob(audioData);
                    const bytes = new Uint8Array(binary.length);
                    for(let i=0; i<binary.length; i++) bytes[i] = binary.charCodeAt(i);
                    
                    const int16 = new Int16Array(bytes.buffer);
                    const float32 = new Float32Array(int16.length);
                    for(let i=0; i<int16.length; i++) float32[i] = int16[i] / 32768.0;

                    const buffer = ctx.createBuffer(1, float32.length, AUDIO_OUTPUT_RATE);
                    buffer.getChannelData(0).set(float32);

                    const source = ctx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(ctx.destination);
                    
                    const startTime = Math.max(ctx.currentTime, nextStartTimeRef.current);
                    source.start(startTime);
                    nextStartTimeRef.current = startTime + buffer.duration;
                    
                    sourcesRef.current.add(source);
                    source.onended = () => {
                        sourcesRef.current.delete(source);
                        if (sourcesRef.current.size === 0) setAgentState(AgentState.LISTENING);
                    };
                }

                // TOOL CALLS
                if (msg.toolCall) {
                    setAgentState(AgentState.CONSULTING_SUBCONSCIOUS);
                    const toolCalls = msg.toolCall.functionCalls;
                    
                    for (const call of toolCalls) {
                        addLog({
                            id: call.id, timestamp: Date.now(), region: BrainRegion.FRONTAL, type: 'tool-call',
                            message: `Intention detected: ${call.name}`
                        });

                        let result = { result: 'Function failed' };

                        if (call.name === 'consult_medical_database') {
                            const args = call.args as any;
                            const response = await subconsciousRef.current?.consultMedicalDatabase(args.query, addLog);
                            result = { result: response || 'No data' };
                        } 
                        else if (call.name === 'fast_symptom_triage') {
                            const args = call.args as any;
                            const response = await subconsciousRef.current?.fastSymptomTriage(args.symptoms, addLog);
                            result = { result: response || 'Triage error' };
                        }
                        else if (call.name === 'analyze_visual_input') {
                            const args = call.args as any;
                            if (videoRef.current && canvasRef.current) {
                                const v = videoRef.current;
                                const c = canvasRef.current;
                                c.width = v.videoWidth;
                                c.height = v.videoHeight;
                                c.getContext('2d')?.drawImage(v, 0, 0);
                                const base64Img = c.toDataURL('image/jpeg').split(',')[1];
                                const response = await subconsciousRef.current?.analyzeVisualInput(base64Img, args.focus, addLog);
                                result = { result: response || 'Blind spot' };
                            } else {
                                result = { result: 'Camera unavailable' };
                            }
                        }
                        else if (call.name === 'check_drug_interactions') {
                            const args = call.args as any;
                            const response = await subconsciousRef.current?.checkDrugInteractions(args.medication, args.condition, addLog);
                            result = { result: response || 'Check failed' };
                        }

                        sessionPromise.then(session => session.sendToolResponse({
                            functionResponses: [{
                                id: call.id,
                                name: call.name,
                                response: result
                            }]
                        }));
                    }
                }
            },
            onclose: () => {
                setConnectionStatus('CONNECTION CLOSED');
            }
        }
        });
        
        sessionPromise.then(session => {
            currentSessionRef.current = session;
        });

    } catch (err) {
        console.error("Failed to start session:", err);
        setConnectionStatus('SYSTEM FAILURE: CHECK PERMISSIONS');
        setAgentState(AgentState.IDLE);
    }
  };

  const endSession = async () => {
    // Terminate Hardware
    if (inputContextRef.current) inputContextRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
    if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
        videoIntervalRef.current = null;
    }
    if (currentSessionRef.current) currentSessionRef.current.close();
    
    setAgentState(AgentState.IDLE);
    setIsGeneratingReport(true);
    setViewState('REPORT');

    if (patientProfile && logs.length > 0) {
        const factory = new AgentFactory(apiKey);
        const report = await factory.generateMedicalReport(patientProfile, logs);
        setFinalReport(report);
    } else {
        setFinalReport(null);
    }
    setIsGeneratingReport(false);
  };

  const resetSystem = () => {
      window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-cyan-50 font-sans overflow-hidden flex flex-col">
      
      {/* HEADER */}
      <header className="p-4 border-b border-cyan-900 bg-slate-900/50 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${viewState === 'SESSION' ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
            <h1 className="text-xl font-bold tracking-[0.2em] text-cyan-400">NEURO<span className="text-white">CLINIC</span></h1>
        </div>
        <div>
            {viewState === 'SESSION' && (
                 <button 
                    onClick={endSession}
                    className="bg-red-900/50 hover:bg-red-900 text-red-200 px-4 py-1 rounded text-xs border border-red-800 transition-colors uppercase tracking-wider"
                >
                    Finalize Session & Generate Record
                </button>
            )}
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="flex-grow relative flex items-center justify-center p-4">
        
        {/* VIEW: INTAKE */}
        {viewState === 'INTAKE' && (
             <IntakeTerminal onInstantiate={handleInstantiate} apiKey={apiKey} />
        )}

        {/* VIEW: STANDBY (MANIFESTO CONFIRMATION) */}
        {viewState === 'STANDBY' && manifesto && (
            <div className="max-w-xl w-full bg-slate-900 border border-cyan-500 p-8 rounded-lg shadow-[0_0_60px_rgba(6,182,212,0.15)] animate-[slideUp_0.3s_ease-out]">
                <h2 className="text-sm font-bold text-cyan-600 tracking-widest mb-4">AGENT MANIFESTO GENERATED</h2>
                <div className="space-y-4 border-l-2 border-cyan-800 pl-4 mb-8">
                    <div>
                        <div className="text-xs text-slate-500 uppercase">Designation</div>
                        <div className="text-2xl text-white font-bold">{manifesto.agentName}</div>
                        <div className="text-cyan-400 font-mono">{manifesto.role}</div>
                    </div>
                    <div>
                         <div className="text-xs text-slate-500 uppercase">Specialty Core</div>
                         <div className="text-slate-300">{manifesto.specialty}</div>
                    </div>
                    <div>
                         <div className="text-xs text-slate-500 uppercase">Voice Synthesis</div>
                         <div className="text-slate-300">{manifesto.voiceName} (Neural TTS)</div>
                    </div>
                </div>
                
                <button 
                    onClick={initiateNeuralLink}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded tracking-[0.2em] transition-all shadow-lg hover:shadow-cyan-500/50"
                >
                    ESTABLISH NEURAL LINK
                </button>
                <div className="text-center mt-3 text-[10px] text-slate-600 uppercase">
                    By connecting, you consent to real-time audio/visual analysis.
                </div>
            </div>
        )}

        {/* VIEW: SESSION (BRAIN HUD) */}
        {viewState === 'SESSION' && (
            connectionStatus ? (
                 <div className="flex flex-col items-center gap-4 animate-pulse">
                     <div className="w-12 h-12 border-4 border-t-cyan-500 border-r-transparent border-b-cyan-800 border-l-transparent rounded-full animate-spin"></div>
                     <div className="text-cyan-500 font-mono tracking-widest">{connectionStatus}</div>
                 </div>
            ) : (
                 <BrainHUD 
                    agentState={agentState} 
                    logs={logs} 
                    transcripts={transcripts}
                    audioLevel={audioLevel} 
                    videoStream={mediaStream}
                    videoUplinkActive={videoUplinkActive}
                    onFileUpload={handleFileUpload}
                 />
            )
        )}

        {/* VIEW: REPORT */}
        {viewState === 'REPORT' && (
            isGeneratingReport ? (
                <div className="flex flex-col items-center animate-pulse text-cyan-500">
                    <div className="text-2xl font-mono mb-2">CONSOLIDATING MEMORY...</div>
                    <div className="text-sm text-slate-400">WRITING CLINICAL SOAP NOTE</div>
                </div>
            ) : (
                <SessionReport report={finalReport} onReset={resetSystem} />
            )
        )}

        {/* HIDDEN VIDEO FOR AI SIGHT CAPTURE */}
        <div className="absolute top-4 right-4 z-0 w-1 h-1 overflow-hidden opacity-0 pointer-events-none">
             <video ref={videoRef} className="w-64 h-48" muted />
             <canvas ref={canvasRef} />
        </div>

      </main>

      {/* API KEY MODAL (First load only) */}
      {!apiKey && (
        <div className="fixed inset-0 bg-slate-950/95 z-[100] flex items-center justify-center">
            <div className="bg-slate-900 p-8 rounded-xl border border-cyan-700 max-w-md w-full">
                <h2 className="text-xl font-bold text-cyan-400 mb-4">SYSTEM INITIALIZATION</h2>
                <input 
                    type="password" 
                    placeholder="Gemini API Key"
                    className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-cyan-100 focus:border-cyan-500 outline-none"
                    onChange={(e) => setApiKey(e.target.value)}
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
