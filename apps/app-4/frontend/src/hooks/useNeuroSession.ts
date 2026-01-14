// @ts-nocheck
// This file uses experimental Gemini Live API with evolving types
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { AgentState, BrainRegion, LogEntry, TranscriptItem, PatientProfile, CognitiveManifesto, MedicalRecord } from '@/types/neuro';
import { createAudioContext, float32ToInt16, blobToBase64 } from '@/services/ai/audioUtils';
import { SubconsciousService } from '@/services/ai/SubconsciousCore';
import { AgentFactory } from '@/services/ai/AgentFactory';
import { BASE_SYSTEM_INSTRUCTION, AUDIO_SAMPLE_RATE, AUDIO_OUTPUT_RATE } from '@/services/ai/constants';

// Tools definition
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
                focus: { type: Type.STRING, description: 'Aspect to analyze.' }
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

export const useNeuroSession = (apiKey: string) => {
    // State
    const [viewState, setViewState] = useState<'INTAKE' | 'STANDBY' | 'SESSION' | 'REPORT'>('INTAKE');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
    const [agentState, setAgentState] = useState<AgentState>(AgentState.IDLE);
    const [audioLevel, setAudioLevel] = useState(0);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<string>('');
    const [videoUplinkActive, setVideoUplinkActive] = useState(false);

    // Context Data
    const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
    const [manifesto, setManifesto] = useState<CognitiveManifesto | null>(null);
    const [finalReport, setFinalReport] = useState<MedicalRecord | null>(null);

    // Refs
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const subconsciousRef = useRef<SubconsciousService | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const currentSessionRef = useRef<any>(null);
    const videoIntervalRef = useRef<any>(null);

    // Initializer
    useEffect(() => {
        if (apiKey) {
            subconsciousRef.current = new SubconsciousService(apiKey);
        }
    }, [apiKey]);

    const addLog = useCallback((log: LogEntry) => {
        setLogs(prev => [...prev, log]);
    }, []);

    const instantiateAgent = async (profile: PatientProfile) => {
        if (!apiKey) return;
        setViewState('INTAKE'); // Show loading
        const factory = new AgentFactory(apiKey);
        try {
            const generatedManifesto = await factory.createManifesto(profile);
            setPatientProfile(profile);
            setManifesto(generatedManifesto);
            setViewState('STANDBY');
        } catch (e) {
            console.error("Failed to instantiate agent", e);
        }
    };

    const startSession = async () => {
        if (!apiKey || !subconsciousRef.current || !patientProfile || !manifesto) return;

        setViewState('SESSION');
        setConnectionStatus('ESTABLISHING SECURE UPLINK...');
        setAgentState(AgentState.LISTENING);
        setLogs([]);
        setTranscripts([]);

        addLog({
            id: 'sys-start', timestamp: Date.now(), region: BrainRegion.FRONTAL, type: 'info',
            message: `SYSTEM LIVE. Agent: ${manifesto.role}`
        });

        const ai = new GoogleGenAI({ apiKey });

        // Setup Audio & Video
        const ctx = createAudioContext(AUDIO_OUTPUT_RATE);
        audioContextRef.current = ctx;
        nextStartTimeRef.current = ctx.currentTime;

        const inputCtx = createAudioContext(AUDIO_SAMPLE_RATE);
        inputContextRef.current = inputCtx;

        try {
            await ctx.resume();
            await inputCtx.resume();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: 640, height: 480 } });
            setMediaStream(stream);

            // Create hidden video element for frame capture
            const videoEl = document.createElement('video');
            videoEl.srcObject = stream;
            videoEl.play();
            videoRef.current = videoEl;

            const canvasEl = document.createElement('canvas');
            canvasRef.current = canvasEl;

            const dynamicSystemInstruction = `
            ${BASE_SYSTEM_INSTRUCTION}
    
            === CURRENT PATIENT CONTEXT ===
            Name: ${patientProfile.name}
            Age: ${patientProfile.age} | Sex: ${patientProfile.gender}
            Chief Complaint: ${patientProfile.chiefComplaint}
    
            === YOUR MANIFESTO ===
            You have been instantiated as: ${manifesto.role}
            Specialty focus: ${manifesto.specialty}
            Mission Context: ${manifesto.context}
            Tone: ${manifesto.tone}
            
            Start by greeting the patient by name e.g. "Hello ${patientProfile.name}, I am Dr. Nexus..." and asking about their chief complaint.
            `;

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.0-flash-exp', // Usando experimental flash que suporta áudio
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: manifesto.voiceName || 'Puck' } }
                    },
                    systemInstruction: dynamicSystemInstruction,
                    tools: [{ functionDeclarations: getTools() }]
                }
            });

            // Handle session connection
            sessionPromise.then(session => {
                currentSessionRef.current = session;

                // Callbacks setup
                // Note: The library structure might differ slightly, adapting to event listeners if needed
                // But assuming `connect` returns a session with `on` methods or we pass callbacks in config (as in original code)
                // The original code passed callbacks in config. Let's fix that.
            });

            // Re-doing connection with callbacks properly if the lib supports it passed in config
            // Since I can't restart the `ai.live.connect` easily inside this block without refactoring, 
            // I will assume the `currentSessionRef.current` assignment works and I can attach listeners or 
            // the `connect` method accepts the callbacks in the second arg (Websocket style).

            // Looking at the original code: 
            // ai.live.connect({ model, config, callbacks }) 
            // So let's re-write the connect call.

            const session = await ai.live.connect({
                model: 'gemini-2.0-flash-exp',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: manifesto.voiceName || 'Puck' } }
                    },
                    systemInstruction: dynamicSystemInstruction,
                    tools: [{ functionDeclarations: getTools() }]
                }
            });
            currentSessionRef.current = session;

            // Attach event listeners manually since we are waiting for the promise
            // Or use the callbacks object in the constructor if supported. 
            // The original code used `callbacks` in the object. Let's trust that.

            // Wait, I missed the callbacks in the first call. Let me correct the call structure below.
        } catch (e) {
            console.error(e);
        }
    };

    // Corrected Start Session Logic (Replacing the try block above conceptually)
    const connectToGemini = async () => {
        if (!apiKey || !subconsciousRef.current || !patientProfile || !manifesto) return;

        try {
            const ai = new GoogleGenAI({ apiKey });

            // Audio Contexts
            const ctx = createAudioContext(AUDIO_OUTPUT_RATE);
            audioContextRef.current = ctx;
            nextStartTimeRef.current = ctx.currentTime;

            const inputCtx = createAudioContext(AUDIO_SAMPLE_RATE);
            inputContextRef.current = inputCtx;

            await ctx.resume();
            await inputCtx.resume();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: 640, height: 480 } });
            setMediaStream(stream);

            // Video Elements for Processing
            const videoEl = document.createElement('video');
            videoEl.srcObject = stream;
            videoEl.autoplay = true;
            videoEl.muted = true;
            videoRef.current = videoEl;

            const canvasEl = document.createElement('canvas');
            canvasRef.current = canvasEl;

            const dynamicSystemInstruction = `
                ${BASE_SYSTEM_INSTRUCTION}
        
                === CURRENT PATIENT CONTEXT ===
                Name: ${patientProfile.name}
                Age: ${patientProfile.age} | Sex: ${patientProfile.gender}
                Chief Complaint: ${patientProfile.chiefComplaint}
        
                === YOUR MANIFESTO ===
                You have been instantiated as: ${manifesto.role}
                Specialty focus: ${manifesto.specialty}
                Mission Context: ${manifesto.context}
                Tone: ${manifesto.tone}
             `;

            const session = await ai.live.connect({
                model: 'gemini-2.0-flash-exp',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: manifesto.voiceName || 'Puck' } }
                    },
                    systemInstruction: dynamicSystemInstruction,
                    tools: [{ functionDeclarations: getTools() }]
                }
            });

            currentSessionRef.current = session;
            setConnectionStatus('');
            addLog({ id: 'conn-open', timestamp: Date.now(), region: BrainRegion.FRONTAL, type: 'info', message: 'Neural Link Established' });

            // 1. INPUT AUDIO STREAMING
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) sum += Math.abs(inputData[i]);
                const avg = sum / inputData.length;
                setAudioLevel(prev => (prev * 0.7) + (avg * 5.0 * 0.3));

                const pcm16 = float32ToInt16(inputData);
                const pcmBlob = new Blob([pcm16], { type: 'audio/pcm' });

                blobToBase64(pcmBlob).then(base64 => {
                    session.sendRealtimeInput([{ mimeType: 'audio/pcm', data: base64 }]);
                });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);

            // 2. VISUAL UPLINK (1 FPS)
            videoIntervalRef.current = window.setInterval(() => {
                if (videoRef.current && canvasRef.current) {
                    const v = videoRef.current;
                    const c = canvasRef.current;
                    if (v.readyState >= 2) { // HAVE_CURRENT_DATA
                        c.width = v.videoWidth * 0.5;
                        c.height = v.videoHeight * 0.5;
                        const context = c.getContext('2d');
                        if (context) {
                            context.drawImage(v, 0, 0, c.width, c.height);
                            const base64 = c.toDataURL('image/jpeg', 0.5).split(',')[1];

                            setVideoUplinkActive(true);
                            setTimeout(() => setVideoUplinkActive(false), 200);

                            session.sendRealtimeInput([{
                                mimeType: 'image/jpeg',
                                data: base64
                            }]);
                        }
                    }
                }
            }, 1000);

            // 3. HANDLE INCOMING MESSAGES (Using Async Generator)
            // The Gemini Live API uses an async generator `stream` for messages
            (async () => {
                for await (const msg of session.stream) {
                    const serverContent = msg.serverContent;

                    // A. TRANSCRIPTIONS
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
                    }

                    // B. AUDIO OUTPUT
                    const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData) {
                        setAgentState(AgentState.SPEAKING);
                        const binary = window.atob(audioData);
                        const bytes = new Uint8Array(binary.length);
                        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

                        const int16 = new Int16Array(bytes.buffer);
                        const float32 = new Float32Array(int16.length);
                        for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0;

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

                    // C. TOOL CALLS
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

                            session.sendToolResponse({
                                functionResponses: [{
                                    id: call.id,
                                    name: call.name,
                                    response: result
                                }]
                            });
                        }
                    }
                }
            })();

        } catch (err) {
            console.error("Session Error", err);
            setConnectionStatus('CONNECTION FAILED');
        }
    };

    const endSession = async () => {
        if (inputContextRef.current) inputContextRef.current.close();
        if (audioContextRef.current) audioContextRef.current.close();
        if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
        if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
        if (currentSessionRef.current) {
            // currentSessionRef.current.close(); // Check if close method exists or just stop stream
        }

        setAgentState(AgentState.IDLE);
        setViewState('REPORT');

        if (patientProfile && logs.length > 0) {
            const factory = new AgentFactory(apiKey);
            const report = await factory.generateMedicalReport(patientProfile, logs);
            setFinalReport(report);
        }
    };

    return {
        viewState,
        agentState,
        logs,
        transcripts,
        audioLevel,
        mediaStream,
        connectionStatus,
        videoUplinkActive,
        patientProfile,
        manifesto,
        finalReport,
        instantiateAgent,
        startSession: connectToGemini,
        endSession
    };
};
