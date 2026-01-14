// ============================================================================
// NeuroClinic AI - Médico Virtual Integrado ao MediSync
// Versão: 3.0.0 | Integração com Triagem + Gemini Live
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import { Loader2, Brain, Mic, MicOff, Video, VideoOff, Activity, AlertTriangle, ArrowRight, CheckCircle, XCircle, Star, Phone, MessageCircle, Zap, Heart, Clock, User } from 'lucide-react';
import { getTriageReport, TriageReport } from '@/api/triage';
import { MatchResult } from '@/api/match';

// ============================================================================
// TYPES
// ============================================================================

enum AgentState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR'
}

interface TranscriptItem {
  id: string;
  source: 'USER' | 'AGENT' | 'SYSTEM';
  text: string;
  timestamp: number;
}

interface MedicalRecord {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string[];
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  specialty: string;
}

// ============================================================================
// GEMINI LIVE CONFIG
// ============================================================================

const GEMINI_LIVE_MODEL = 'gemini-2.5-flash-preview-native-audio-dialog';
const GEMINI_API_KEY = typeof window !== 'undefined' 
  ? localStorage.getItem('gemini_api_key') || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
  : '';

// Map Manchester priority to risk level
const mapPriorityToRisk = (priority?: string): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' => {
  if (!priority) return 'MODERATE';
  const p = priority.toLowerCase();
  if (p.includes('vermelho') || p.includes('emergency')) return 'CRITICAL';
  if (p.includes('laranja') || p.includes('very_urgent')) return 'HIGH';
  if (p.includes('amarelo') || p.includes('urgent')) return 'MODERATE';
  return 'LOW';
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NeuroClinicPage() {
  const router = useRouter();
  const { triage_id } = router.query;
  const { user, isAuthenticated, loading: authLoading } = useAuthStore();

  // States
  const [viewState, setViewState] = useState<'LOADING' | 'NO_TRIAGE' | 'READY' | 'SESSION' | 'REPORT'>('LOADING');
  const [triageData, setTriageData] = useState<TriageReport | null>(null);
  const [agentState, setAgentState] = useState<AgentState>(AgentState.IDLE);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [finalReport, setFinalReport] = useState<MedicalRecord | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  // Automatic Match States
  const [matchingDoctor, setMatchingDoctor] = useState(false);
  const [matchStatus, setMatchStatus] = useState<'idle' | 'searching' | 'found' | 'no_match' | 'error'>('idle');
  const [matchedDoctor, setMatchedDoctor] = useState<MatchResult | null>(null);
  const [matchId, setMatchId] = useState<number | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // ============================================================================
  // LOAD TRIAGE DATA
  // ============================================================================

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const loadTriageData = async () => {
      if (triage_id) {
        try {
          const data = await getTriageReport(Number(triage_id));
          setTriageData(data);
          setViewState('READY');
        } catch (err) {
          console.error('Failed to load triage:', err);
          setViewState('NO_TRIAGE');
        }
      } else {
        // Check for recent triage
        try {
          const res = await axiosInstance.get('/triage-reports/my-reports');
          const reports = res.data || [];
          const recent = reports.find((r: any) => 
            r.status === 'pending' || r.status === 'in_review'
          );
          if (recent) {
            setTriageData(recent);
            setViewState('READY');
          } else {
            setViewState('NO_TRIAGE');
          }
        } catch {
          setViewState('NO_TRIAGE');
        }
      }
    };

    if (!authLoading && isAuthenticated) {
      loadTriageData();
    }
  }, [authLoading, isAuthenticated, triage_id, router]);

  // ============================================================================
  // GEMINI LIVE CONNECTION
  // ============================================================================

  const connectToGeminiLive = useCallback(async () => {
    if (!GEMINI_API_KEY) {
      setError('API Key do Gemini não configurada. Vá em Configurações para adicionar.');
      setAgentState(AgentState.ERROR);
      return;
    }

    setAgentState(AgentState.CONNECTING);

    try {
      // Get media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: 640, height: 480 }
      });
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Create WebSocket connection to Gemini Live
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        
        // Send setup message with system instruction
        const systemInstruction = buildSystemInstruction();
        
        ws.send(JSON.stringify({
          setup: {
            model: `models/${GEMINI_LIVE_MODEL}`,
            generationConfig: {
              responseModalities: ['AUDIO', 'TEXT'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: 'Puck'
                  }
                }
              }
            },
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            }
          }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleGeminiMessage(data);
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Erro na conexão com Gemini Live');
        setAgentState(AgentState.ERROR);
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        if (agentState !== AgentState.IDLE) {
          setAgentState(AgentState.IDLE);
        }
      };

      // Setup audio processing
      setupAudioProcessing(stream, ws);

    } catch (err: any) {
      console.error('Failed to connect:', err);
      setError(err.message || 'Erro ao conectar. Verifique permissões de câmera/microfone.');
      setAgentState(AgentState.ERROR);
    }
  }, [triageData, agentState]);

  const buildSystemInstruction = () => {
    const patientInfo = triageData ? `
DADOS DO PACIENTE (da triagem prévia):
- Nome: ${user?.fullName || triageData.patient?.full_name || 'Paciente'}
- Queixa Principal: ${triageData.patient_complaint || 'Não informado'}
- História da Doença Atual: ${triageData.history_of_present_illness || 'Não disponível'}
- Classificação de Risco: ${triageData.priority || 'Não classificado'}
- Especialidade recomendada: ${triageData.recommended_specialty || 'Clínica Geral'}
- Hipóteses Diagnósticas: ${triageData.suspected_diagnosis || 'Não informado'}
- Justificativa: ${triageData.reasoning || 'Não informado'}
` : '';

    return `
Você é o Dr. Nexus, um médico virtual especializado do sistema MediSync NeuroClinic.

${patientInfo}

SUAS DIRETRIZES:
1. Você JÁ TEM os dados da triagem prévia. NÃO peça nome, idade ou sintomas novamente.
2. Comece cumprimentando o paciente pelo nome e confirmando os sintomas da triagem.
3. Faça perguntas de aprofundamento sobre os sintomas (duração, intensidade, fatores de melhora/piora).
4. Seja empático, profissional e objetivo.
5. Use linguagem acessível, evitando jargões médicos complexos.
6. Se identificar sinais de emergência, oriente procurar atendimento presencial imediatamente.
7. Ao final, forneça orientações e recomende próximos passos.

IMPORTANTE:
- Você NÃO diagnostica definitivamente. Você orienta e encaminha.
- Sempre recomende avaliação presencial para casos que necessitem.
- Mantenha a conversa focada e produtiva.

Comece a consulta agora, cumprimentando o paciente e confirmando os dados da triagem.
`;
  };

  const handleGeminiMessage = (data: any) => {
    // Handle setup complete
    if (data.setupComplete) {
      setAgentState(AgentState.LISTENING);
      addTranscript('SYSTEM', 'Conexão estabelecida. Dr. Nexus está pronto.');
      return;
    }

    // Handle server content (agent response)
    if (data.serverContent) {
      const parts = data.serverContent.modelTurn?.parts || [];
      
      for (const part of parts) {
        if (part.text) {
          addTranscript('AGENT', part.text);
          setAgentState(AgentState.SPEAKING);
        }
        if (part.inlineData?.mimeType?.startsWith('audio/')) {
          // Play audio response
          playAudioResponse(part.inlineData.data);
        }
      }

      if (data.serverContent.turnComplete) {
        setAgentState(AgentState.LISTENING);
      }
    }

    // Handle tool calls (if any)
    if (data.toolCall) {
      setAgentState(AgentState.THINKING);
      addTranscript('SYSTEM', `Consultando: ${data.toolCall.functionCalls?.[0]?.name || 'base de dados'}`);
    }
  };

  const setupAudioProcessing = (stream: MediaStream, ws: WebSocket) => {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (ws.readyState === WebSocket.OPEN && audioEnabled) {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = convertToPCM16(inputData);
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));

        ws.send(JSON.stringify({
          realtimeInput: {
            mediaChunks: [{
              mimeType: 'audio/pcm;rate=16000',
              data: base64Audio
            }]
          }
        }));
      }
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
  };

  const convertToPCM16 = (float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  };

  const playAudioResponse = async (base64Audio: string) => {
    try {
      const audioData = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
      const audioContext = new AudioContext({ sampleRate: 24000 });
      
      // Convert PCM to AudioBuffer
      const float32 = new Float32Array(audioData.length / 2);
      const dataView = new DataView(audioData.buffer);
      for (let i = 0; i < float32.length; i++) {
        float32[i] = dataView.getInt16(i * 2, true) / 32768;
      }

      const audioBuffer = audioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (err) {
      console.error('Failed to play audio:', err);
    }
  };

  const addTranscript = (source: 'USER' | 'AGENT' | 'SYSTEM', text: string) => {
    setTranscripts(prev => [...prev, {
      id: Date.now().toString(),
      source,
      text,
      timestamp: Date.now()
    }]);
  };

  // ============================================================================
  // SESSION CONTROLS
  // ============================================================================

  const startSession = () => {
    setViewState('SESSION');
    setTranscripts([]);
    connectToGeminiLive();
  };

  const endSession = async () => {
    // Close connections
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    setAgentState(AgentState.IDLE);
    setIsGeneratingReport(true);
    setViewState('REPORT');

    // Generate report from conversation
    await generateReport();
  };

  const generateReport = async () => {
    const conversationText = transcripts
      .filter(t => t.source !== 'SYSTEM')
      .map(t => `${t.source === 'USER' ? 'Paciente' : 'Dr. Nexus'}: ${t.text}`)
      .join('\n');

    const prompt = `
Baseado na seguinte consulta médica virtual, gere um prontuário SOAP:

DADOS DA TRIAGEM PRÉVIA:
${triageData ? `
- Queixa: ${triageData.patient_complaint}
- História: ${triageData.history_of_present_illness}
- Risco: ${triageData.priority}
- Especialidade: ${triageData.recommended_specialty}
- Hipóteses: ${triageData.suspected_diagnosis}
` : 'Não disponível'}

TRANSCRIÇÃO DA CONSULTA:
${conversationText || 'Consulta não realizada ou sem transcrição.'}

Retorne APENAS JSON válido:
{
  "subjective": "Queixas e história relatada pelo paciente",
  "objective": "Achados objetivos da consulta virtual",
  "assessment": "Avaliação e hipóteses diagnósticas",
  "plan": ["Recomendação 1", "Recomendação 2"],
  "riskLevel": "LOW|MODERATE|HIGH|CRITICAL",
  "specialty": "Especialidade recomendada"
}
`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        }
      );

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        const report = JSON.parse(text);
        setFinalReport(report);

        // Update triage report with consultation data
        if (triageData?.id) {
          await axiosInstance.put(`/triage-reports/${triageData.id}/status`, {
            status: 'reviewed',
            doctor_notes: report.assessment,
            recommendations: report.plan
          });
        }

        // AUTOMATIC MATCH: Find real doctor based on all collected data
        await findAndConnectRealDoctor(report);
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
      const fallbackReport = {
        subjective: triageData?.patient_complaint || 'Não informado',
        objective: 'Consulta virtual realizada',
        assessment: triageData?.reasoning || 'Avaliação pendente',
        plan: ['Agendar consulta presencial', 'Retornar se piora'],
        riskLevel: mapPriorityToRisk(triageData?.priority),
        specialty: triageData?.recommended_specialty || 'Clínica Geral'
      };
      setFinalReport(fallbackReport);
      
      // Still try to find a doctor even with fallback report
      await findAndConnectRealDoctor(fallbackReport);
    }

    setIsGeneratingReport(false);
  };

  // AUTOMATIC MATCH: Find real doctor and connect
  const findAndConnectRealDoctor = async (report: MedicalRecord) => {
    setMatchingDoctor(true);
    setMatchStatus('searching');

    try {
      // Build match request from all collected data
      const matchRequest = {
        message: triageData?.patient_complaint || report.subjective,
        symptoms: report.subjective.split(',').map(s => s.trim()),
        duration: 'Informado na consulta',
        severity: report.riskLevel === 'CRITICAL' ? 10 : report.riskLevel === 'HIGH' ? 8 : report.riskLevel === 'MODERATE' ? 5 : 3,
        prefer_telemedicine: true,
        triage_report_id: triageData?.id,
        // Use classification from triage + virtual consultation
        classification: {
          chief_complaint: triageData?.patient_complaint || report.subjective,
          symptoms: triageData?.suspected_diagnosis ? JSON.parse(triageData.suspected_diagnosis) : [],
          urgency_level: report.riskLevel === 'CRITICAL' ? 'IMMEDIATE' : report.riskLevel === 'HIGH' ? 'TODAY' : 'WEEK',
          risk_level: report.riskLevel,
          suggested_specialties: [report.specialty, triageData?.recommended_specialty].filter(Boolean),
          can_be_remote: true,
          requires_exam_first: false,
          reasoning: report.assessment
        }
      };

      // Call match API
      const matchResponse = await axiosInstance.post('/match/find', matchRequest);
      const matches = matchResponse.data?.matches || [];

      if (matches.length > 0) {
        const bestMatch = matches[0];
        setMatchedDoctor(bestMatch);
        setMatchStatus('found');

        // Auto-create the match record
        const createMatchResponse = await axiosInstance.post('/match/start', matchRequest);
        setMatchId(createMatchResponse.data?.match_id);
      } else {
        setMatchStatus('no_match');
      }
    } catch (err) {
      console.error('Failed to find doctor match:', err);
      setMatchStatus('error');
    }

    setMatchingDoctor(false);
  };

  const connectWithDoctor = async () => {
    if (!matchedDoctor || !matchId) return;

    try {
      // Accept the match
      await axiosInstance.post(`/match/${matchId}/accept`);
      
      // Redirect to chat/video with the matched doctor
      if (matchedDoctor.can_start_now) {
        router.push(`/video-call/new?doctorId=${matchedDoctor.doctor.id}&matchId=${matchId}`);
      } else {
        router.push(`/chat?recipientId=${matchedDoctor.doctor.id}&matchId=${matchId}`);
      }
    } catch (err) {
      console.error('Failed to connect with doctor:', err);
    }
  };

  const toggleAudio = () => setAudioEnabled(!audioEnabled);
  const toggleVideo = () => {
    setVideoEnabled(!videoEnabled);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !videoEnabled;
      });
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (authLoading || viewState === 'LOADING') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando dados da triagem...</p>
        </div>
      </div>
    );
  }

  const riskColors: Record<string, string> = {
    'LOW': 'text-emerald-400 bg-emerald-500/20 border-emerald-500',
    'MODERATE': 'text-yellow-400 bg-yellow-500/20 border-yellow-500',
    'HIGH': 'text-orange-500 bg-orange-500/20 border-orange-500',
    'CRITICAL': 'text-red-500 bg-red-500/20 border-red-500 animate-pulse'
  };

  return (
    <>
      <Head>
        <title>NeuroClinic AI | MediSync</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        
        {/* Header */}
        <header className="p-4 border-b border-cyan-900/50 bg-slate-900/80 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-700 rounded-lg transition"
              title="Voltar"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <div className={`w-3 h-3 rounded-full ${
              agentState === AgentState.LISTENING ? 'bg-green-500 animate-pulse' :
              agentState === AgentState.SPEAKING ? 'bg-cyan-500 animate-pulse' :
              agentState === AgentState.CONNECTING ? 'bg-yellow-500 animate-pulse' :
              agentState === AgentState.ERROR ? 'bg-red-500' :
              'bg-slate-500'
            }`} />
            <h1 className="text-xl font-bold tracking-widest">
              <span className="text-cyan-400">NEURO</span>
              <span className="text-white">CLINIC</span>
            </h1>
            <span className="text-xs text-slate-500">v3.0 | Médico Virtual</span>
          </div>

          {viewState === 'SESSION' && (
            <button
              onClick={endSession}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Finalizar Consulta
            </button>
          )}
        </header>

        {/* Main Content */}
        <main className="p-6">

          {/* NO TRIAGE VIEW */}
          {viewState === 'NO_TRIAGE' && (
            <div className="max-w-2xl mx-auto text-center py-12">
              <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Triagem Necessária</h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Para consultar com o Dr. Nexus, você precisa primeiro fazer uma triagem. 
                Isso nos ajuda a entender melhor seus sintomas e preparar o médico virtual.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                <button
                  onClick={() => router.push('/ai/medicore')}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white p-4 rounded-xl transition flex flex-col items-center gap-2"
                >
                  <Mic className="w-8 h-8" />
                  <span className="font-bold">MediCore Live</span>
                  <span className="text-xs text-cyan-200">Triagem por voz com Sarah AI</span>
                </button>
                
                <button
                  onClick={() => router.push('/ai/triage')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white p-4 rounded-xl transition flex flex-col items-center gap-2"
                >
                  <Brain className="w-8 h-8" />
                  <span className="font-bold">Triagem Inteligente</span>
                  <span className="text-xs text-purple-200">Triagem por texto/imagem</span>
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-8">
                Após a triagem, você será direcionado automaticamente para o Dr. Nexus.
              </p>
            </div>
          )}

          {/* READY VIEW - Show triage summary */}
          {viewState === 'READY' && triageData && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-slate-800/50 border border-cyan-800 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-cyan-400">Dados da Triagem</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${riskColors[mapPriorityToRisk(triageData.priority)]}`}>
                    {triageData.priority || 'MODERADO'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-xs text-slate-400 uppercase">Paciente</label>
                    <p className="text-white font-medium">{user?.fullName || triageData.patient?.full_name || 'Paciente'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase">Especialidade Recomendada</label>
                    <p className="text-cyan-400 font-medium">{triageData.recommended_specialty || 'Clínica Geral'}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs text-slate-400 uppercase">Queixa Principal</label>
                  <p className="text-white">{triageData.patient_complaint || 'Não informado'}</p>
                </div>

                <div className="mb-4">
                  <label className="text-xs text-slate-400 uppercase">História da Doença Atual</label>
                  <p className="text-slate-300 text-sm">{triageData.history_of_present_illness || 'Não disponível'}</p>
                </div>

                <div className="mb-4">
                  <label className="text-xs text-slate-400 uppercase">Hipóteses Diagnósticas</label>
                  <p className="text-slate-300 text-sm">{triageData.suspected_diagnosis || 'Não informado'}</p>
                </div>

                {triageData.reasoning && (
                  <div className="mb-4">
                    <label className="text-xs text-slate-400 uppercase">Justificativa da Classificação</label>
                    <p className="text-slate-300 text-sm">{triageData.reasoning}</p>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border border-cyan-700 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Dr. Nexus está pronto</h3>
                <p className="text-slate-400 mb-6 text-sm">
                  O médico virtual já recebeu seus dados da triagem e está preparado para a consulta.
                </p>

                <button
                  onClick={startSession}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-8 py-4 rounded-xl font-bold text-lg transition flex items-center gap-3 mx-auto"
                >
                  <Video className="w-6 h-6" />
                  Iniciar Consulta com Dr. Nexus
                  <ArrowRight className="w-5 h-5" />
                </button>

                <p className="text-xs text-slate-500 mt-4">
                  Certifique-se de que sua câmera e microfone estão funcionando.
                </p>
              </div>
            </div>
          )}

          {/* SESSION VIEW */}
          {viewState === 'SESSION' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
              
              {/* Video Panel */}
              <div className="lg:col-span-2 bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700 flex flex-col">
                <div className="flex-1 relative bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Agent State Overlay */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-2 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      agentState === AgentState.LISTENING ? 'bg-green-500 animate-pulse' :
                      agentState === AgentState.SPEAKING ? 'bg-cyan-500 animate-pulse' :
                      agentState === AgentState.THINKING ? 'bg-yellow-500 animate-pulse' :
                      'bg-slate-500'
                    }`} />
                    <span className="text-xs text-white font-mono">
                      {agentState === AgentState.LISTENING ? 'OUVINDO' :
                       agentState === AgentState.SPEAKING ? 'FALANDO' :
                       agentState === AgentState.THINKING ? 'PENSANDO' :
                       agentState === AgentState.CONNECTING ? 'CONECTANDO...' :
                       agentState === AgentState.ERROR ? 'ERRO' :
                       'AGUARDANDO'}
                    </span>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                      <div className="text-center p-6">
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-400 mb-4">{error}</p>
                        <button
                          onClick={() => { setError(null); connectToGeminiLive(); }}
                          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg"
                        >
                          Tentar Novamente
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="p-4 bg-slate-900 flex justify-center gap-4">
                  <button
                    onClick={toggleAudio}
                    className={`p-3 rounded-full transition ${audioEnabled ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-500'}`}
                  >
                    {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full transition ${videoEnabled ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-500'}`}
                  >
                    {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={endSession}
                    className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-full font-bold transition"
                  >
                    Encerrar
                  </button>
                </div>
              </div>

              {/* Transcript Panel */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 flex flex-col">
                <div className="p-4 border-b border-slate-700">
                  <h3 className="font-bold text-cyan-400">Transcrição da Sessão</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {transcripts.length === 0 && (
                    <p className="text-slate-500 text-sm text-center py-8">
                      A transcrição aparecerá aqui...
                    </p>
                  )}
                  {transcripts.map(t => (
                    <div
                      key={t.id}
                      className={`p-3 rounded-lg ${
                        t.source === 'USER' ? 'bg-blue-900/30 border-l-2 border-blue-500' :
                        t.source === 'AGENT' ? 'bg-cyan-900/30 border-l-2 border-cyan-500' :
                        'bg-slate-700/30 border-l-2 border-slate-500'
                      }`}
                    >
                      <div className="text-xs text-slate-400 mb-1">
                        {t.source === 'USER' ? 'Você' : t.source === 'AGENT' ? 'Dr. Nexus' : 'Sistema'}
                      </div>
                      <p className="text-sm text-white">{t.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* REPORT VIEW - With Automatic Doctor Match */}
          {viewState === 'REPORT' && (
            <div className="max-w-4xl mx-auto">
              {/* Loading State */}
              {(isGeneratingReport || matchingDoctor) && (
                <div className="text-center py-12">
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500/30 animate-ping" />
                    <div className="absolute inset-2 rounded-full border-4 border-cyan-500/50 animate-pulse" />
                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      {matchingDoctor ? (
                        <Heart className="w-8 h-8 text-white animate-pulse" />
                      ) : (
                        <Brain className="w-8 h-8 text-white" />
                      )}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {matchingDoctor ? 'Encontrando seu médico ideal...' : 'Analisando consulta...'}
                  </h3>
                  <p className="text-slate-400">
                    {matchingDoctor 
                      ? 'Usando IA para fazer o match perfeito com base em todos os seus dados'
                      : 'Gerando prontuário e preparando match automático'}
                  </p>
                </div>
              )}

              {/* Match Found - Main View */}
              {!isGeneratingReport && !matchingDoctor && matchStatus === 'found' && matchedDoctor && (
                <div className="space-y-6">
                  {/* Success Header */}
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Match Encontrado! 🎯</h2>
                    <p className="text-slate-400">
                      Baseado na sua triagem e consulta virtual, encontramos o médico ideal
                    </p>
                  </div>

                  {/* Matched Doctor Card */}
                  <div className="bg-gradient-to-br from-cyan-900/50 to-purple-900/50 border-2 border-cyan-500 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-cyan-500 text-white px-4 py-1 rounded-bl-xl text-sm font-bold flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      {matchedDoctor.match_score.toFixed(0)}% Match
                    </div>

                    <div className="flex items-start gap-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
                        {matchedDoctor.doctor.fullName.charAt(0)}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-1">
                          {matchedDoctor.doctor.fullName}
                        </h3>
                        <p className="text-cyan-400 font-medium text-lg mb-3">
                          {matchedDoctor.doctor.specialty || finalReport?.specialty || 'Clínica Geral'}
                        </p>

                        {/* Match Reasons */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {matchedDoctor.match_reasons.map((reason, i) => (
                            <span key={i} className="px-3 py-1 bg-white/10 text-cyan-300 text-sm rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {reason}
                            </span>
                          ))}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 text-sm">
                          {matchedDoctor.doctor_profile?.average_rating && (
                            <span className="flex items-center gap-1 text-yellow-400">
                              <Star className="w-4 h-4 fill-current" />
                              {matchedDoctor.doctor_profile.average_rating.toFixed(1)}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-4 h-4" />
                            {matchedDoctor.can_start_now ? 'Disponível agora' : `~${matchedDoctor.estimated_wait_time} min`}
                          </span>
                          <span className="text-emerald-400 font-bold">
                            R$ {matchedDoctor.price.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {matchedDoctor.can_start_now && (
                        <button
                          onClick={connectWithDoctor}
                          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white p-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02]"
                        >
                          <Video className="w-6 h-6" />
                          Iniciar Consulta Agora
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/chat?recipientId=${matchedDoctor.doctor.id}`)}
                        className={`${matchedDoctor.can_start_now ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500'} text-white p-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all`}
                      >
                        <MessageCircle className="w-6 h-6" />
                        {matchedDoctor.can_start_now ? 'Enviar Mensagem' : 'Conectar via Chat'}
                      </button>
                    </div>
                  </div>

                  {/* Consultation Summary (Collapsed) */}
                  {finalReport && (
                    <details className="bg-slate-800/50 border border-slate-700 rounded-xl">
                      <summary className="p-4 cursor-pointer text-slate-300 hover:text-white flex items-center justify-between">
                        <span className="font-medium">Ver resumo da consulta virtual</span>
                        <ArrowRight className="w-4 h-4 transform transition-transform" />
                      </summary>
                      <div className="p-4 pt-0 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">Queixa:</span>
                          <p className="text-slate-300">{finalReport.subjective}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Avaliação:</span>
                          <p className="text-slate-300">{finalReport.assessment}</p>
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              )}

              {/* No Match Found */}
              {!isGeneratingReport && !matchingDoctor && matchStatus === 'no_match' && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-10 h-10 text-yellow-500" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Nenhum médico disponível no momento</h2>
                  <p className="text-slate-400 mb-6">
                    Não encontramos médicos disponíveis para {finalReport?.specialty || 'sua especialidade'} agora.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => router.push(`/clinics?specialty=${encodeURIComponent(finalReport?.specialty || '')}`)}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-medium"
                    >
                      Buscar Clínicas Próximas
                    </button>
                    <button
                      onClick={() => router.push('/paciente/book-appointment')}
                      className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-medium"
                    >
                      Agendar Manualmente
                    </button>
                  </div>
                </div>
              )}

              {/* Error State */}
              {!isGeneratingReport && !matchingDoctor && matchStatus === 'error' && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Erro ao buscar médico</h2>
                  <p className="text-slate-400 mb-6">Tivemos um problema. Tente novamente.</p>
                  <button
                    onClick={() => finalReport && findAndConnectRealDoctor(finalReport)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-medium"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
