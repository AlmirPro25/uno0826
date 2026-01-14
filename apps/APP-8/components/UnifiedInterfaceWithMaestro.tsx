/**
 * UnifiedInterface com Gemini Maestro
 * Versão melhorada que usa contexto dinâmico do backend
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { backendService } from '../services/backendService';
import { useDynamicContext } from '../hooks/useDynamicContext';
import { encode, decode, decodeAudioData, getAudioContext } from '../utils/audioUtils';
import { TranscriptionEntry } from '../types';
import { RobotIcon, UserIcon, BrainIcon, CloseIcon, SendIcon } from './Icons';
import PermissionGuide from './PermissionGuide';
import SmartCamera from './SmartCamera';

const createPcmBlob = (data: Float32Array): Blob => {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
};

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const UnifiedInterfaceWithMaestro: React.FC = () => {
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const [status, setStatus] = useState('Idle');
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  
  // 🎯 Estados para execução de comandos
  const [isExecutingCommand, setIsExecutingCommand] = useState(false);
  const [commandStatus, setCommandStatus] = useState('');
  const [executorConnected, setExecutorConnected] = useState(false);
  
  // 🎼 Hook do Gemini Maestro - Contexto Dinâmico
  const {
    systemInstruction,
    isLoading: isLoadingContext,
    error: contextError,
    addToContext,
    updateProfile,
    refresh: refreshContext
  } = useDynamicContext({
    enabled: true
    // refreshInterval desabilitado para evitar loops
  });
  
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  const isStartingSessionRef = useRef(false); // Previne múltiplas inicializações
  
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const frameIntervalRef = useRef<number | null>(null);
  const transcriptionsRef = useRef<TranscriptionEntry[]>([]);
  const cameraFrameIntervalRef = useRef<number | null>(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(scrollToBottom, [transcriptions]);

  // 🎯 Verifica conexão do Executor periodicamente
  useEffect(() => {
    const checkExecutor = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/executor/status');
        const data = await response.json();
        setExecutorConnected(data.connected);
      } catch (error) {
        setExecutorConnected(false);
      }
    };
    
    checkExecutor(); // Verifica imediatamente
    const interval = setInterval(checkExecutor, 5000); // Verifica a cada 5s
    return () => clearInterval(interval);
  }, []);

  // 🎯 Processa comandos do usuário via Maestro
  const processUserCommand = useCallback(async (userInput: string) => {
    try {
      setIsExecutingCommand(true);
      setCommandStatus('🤔 Analisando comando...');
      
      const response = await fetch('http://localhost:3001/api/live/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speaker: 'user',
          text: userInput,
          isUser: true
        })
      });
      
      const data = await response.json();
      
      if (data.isCommand) {
        if (data.executed) {
          setCommandStatus('✅ Comando executado!');
          // Adiciona resposta do sistema à conversa
          setTranscriptions(prev => [...prev, {
            id: Date.now() + 100,
            speaker: 'system',
            text: data.response
          }]);
        } else {
          setCommandStatus('❌ Falha ao executar');
          setTranscriptions(prev => [...prev, {
            id: Date.now() + 100,
            speaker: 'system',
            text: data.response
          }]);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao processar comando:', error);
      setCommandStatus('❌ Erro ao processar');
    } finally {
      setTimeout(() => {
        setIsExecutingCommand(false);
        setCommandStatus('');
      }, 2000);
    }
  }, []);
  
  useEffect(() => {
    transcriptionsRef.current = transcriptions;
  }, [transcriptions]);

  // Callback para enviar frames da câmera para o Gemini Live
  const handleCameraFrame = useCallback((frameBase64: string) => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then((session) => {
        session.sendRealtimeInput({
          media: { data: frameBase64, mimeType: 'image/jpeg' }
        });
      });
    }
  }, []);

  const cleanup = useCallback(async () => {
    if (sessionId && transcriptionsRef.current.length > 0) {
      const fullTranscript = transcriptionsRef.current.map(t => `${t.speaker}: ${t.text}`).join('\n');
      
      // Salva no backend
      try {
        await backendService.summarizeSession(sessionId);
        await backendService.extractFactsFromConversation(fullTranscript);
        await updateProfile(fullTranscript);
      } catch (e) {
        console.warn('Erro ao salvar sessão:', e);
      }
    }

    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
      sessionPromiseRef.current = null;
    }
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    if (screenVideoRef.current?.srcObject) {
      (screenVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    isStartingSessionRef.current = false; // Reset flag
    setTranscriptions([]);
    setSessionId(null);
  }, [sessionId]); // Removido updateProfile das dependências

  const requestPermissions = async () => {
    setShowPermissionGuide(false);
    setPermissionsGranted(true);
  };

  useEffect(() => {
    if (!permissionsGranted || isLoadingContext) {
      if (!permissionsGranted) {
        setShowPermissionGuide(true);
      }
      return;
    }

    const startSession = async () => {
      // Previne múltiplas inicializações simultâneas
      if (isStartingSessionRef.current || sessionPromiseRef.current) {
        console.log('⚠️ Sessão já está sendo iniciada ou já existe');
        return;
      }
      
      isStartingSessionRef.current = true;
      setStatus('🎼 Maestro preparando contexto...');
      setMediaError(null);
      
      try {
        // Cria sessão no backend
        const newSessionId = await backendService.createSession();
        setSessionId(newSessionId);
        
        // 🎼 Usa o System Instruction do Maestro
        console.log('🎼 System Instruction do Maestro:', systemInstruction.substring(0, 200) + '...');
        
        const apiKey = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
        if (!apiKey) {
          throw new Error('API Key não configurada. Configure VITE_API_KEY no .env.local');
        }
        const ai = new GoogleGenAI({ apiKey });
        
        setStatus('📺 Selecione a tela...');
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        if (screenVideoRef.current) screenVideoRef.current.srcObject = displayStream;

        setStatus('🎤 Acessando microfone...');
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const outputAudioContext = getAudioContext();
        const outputNode = outputAudioContext.createGain();
        outputNode.connect(outputAudioContext.destination);

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              setStatus('✅ Conectado com Maestro');
              const inputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
              const source = inputAudioContext.createMediaStreamSource(audioStream);
              const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createPcmBlob(inputData);
                sessionPromise.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContext.destination);

              // Streaming de vídeo
              const videoEl = screenVideoRef.current;
              if (videoEl) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const FRAME_RATE = 2;
                const JPEG_QUALITY = 0.7;

                frameIntervalRef.current = window.setInterval(() => {
                  if (videoEl.readyState >= 2 && ctx) {
                    canvas.width = videoEl.videoWidth;
                    canvas.height = videoEl.videoHeight;
                    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob(
                      async (blob) => {
                        if (blob) {
                          const base64Data = await blobToBase64(blob);
                          sessionPromise.then((session) => {
                            session.sendRealtimeInput({
                              media: { data: base64Data, mimeType: 'image/jpeg' }
                            });
                          });
                        }
                      },
                      'image/jpeg',
                      JPEG_QUALITY
                    );
                  }
                }, 1000 / FRAME_RATE);
              }
            },
            onmessage: async (message: LiveServerMessage) => {
              if (message.serverContent?.outputTranscription) {
                currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
              } else if (message.serverContent?.inputTranscription) {
                currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
              }

              if (message.serverContent?.turnComplete) {
                const userInput = currentInputTranscriptionRef.current.trim();
                const modelOutput = currentOutputTranscriptionRef.current.trim();
                
                if (newSessionId) {
                  if (userInput) {
                    await backendService.addMessage(newSessionId, 'user', userInput);
                    // 🎼 Adiciona ao contexto de curto prazo do Maestro
                    await addToContext(`User: ${userInput}`, 1.0);
                    
                    // 🎯 PROCESSA COMANDO VIA MAESTRO
                    await processUserCommand(userInput);
                  }
                  if (modelOutput) {
                    await backendService.addMessage(newSessionId, 'model', modelOutput);
                    await addToContext(`Assistant: ${modelOutput}`, 0.8);
                  }
                }

                setTranscriptions(prev => {
                  const newEntries: TranscriptionEntry[] = [];
                  if (userInput) newEntries.push({ id: Date.now(), speaker: 'user', text: userInput });
                  if (modelOutput) newEntries.push({ id: Date.now() + 1, speaker: 'model', text: modelOutput });
                  return newEntries.length > 0 ? [...prev, ...newEntries] : prev;
                });
                
                currentInputTranscriptionRef.current = '';
                currentOutputTranscriptionRef.current = '';
              }

              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio) {
                const ctx = getAudioContext();
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);
                source.addEventListener('ended', () => sourcesRef.current.delete(source));
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              }
            },
            onerror: (e: ErrorEvent) => setStatus('Error'),
            onclose: (e: CloseEvent) => setStatus('Closed'),
          },
          config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            // 🎼 System Instruction com detecção de comandos
            systemInstruction: `${systemInstruction}

🎯 ASSISTENTE COM CONTROLE DO COMPUTADOR

Você está vendo a tela do usuário em tempo real (2 frames/segundo).

IMPORTANTE: Quando o usuário pedir para você executar algo no computador:
- Responda confirmando a ação
- O sistema detectará automaticamente e executará
- Você verá o resultado na tela

EXEMPLOS:
- Usuário: "Abra o YouTube"
  → Você: "Claro! Abrindo o YouTube para você agora."
  → Sistema executa automaticamente

- Usuário: "Pesquise por Python tutorial"
  → Você: "Vou pesquisar tutoriais de Python para você!"
  → Sistema executa automaticamente

- Usuário: "O que tem na tela?"
  → Você: Descreve o que está vendo

Seja natural, útil e conversacional!`,
          },
        });
        sessionPromiseRef.current = sessionPromise;
        isStartingSessionRef.current = false; // Reset flag após sucesso
      } catch (error: any) {
        console.error('Erro ao iniciar sessão:', error);
        setStatus('Erro');
        isStartingSessionRef.current = false; // Reset flag após erro
        
        let errorMessage = 'Não foi possível acessar tela ou microfone.';
        
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Permissões negadas. Tente novamente e permita o acesso.';
        }
        
        setMediaError(errorMessage);
        setPermissionsGranted(false);
      }
    };
    
    startSession();
    return () => {
      cleanup();
    };
  }, [permissionsGranted, isLoadingContext]); // Removido dependências que causam loop
  
  const renderEntry = (entry: TranscriptionEntry) => (
    <div key={entry.id} className={`flex items-start gap-3 my-2 ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
      {entry.speaker !== 'user' && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          entry.speaker === 'model' ? 'bg-gray-700' : 
          entry.speaker === 'system' ? 'bg-purple-700' : 
          'bg-teal-600'
        }`}>
          {entry.speaker === 'model' ? <RobotIcon className="w-5 h-5 text-purple-400" /> : 
           entry.speaker === 'system' ? <span className="text-lg">🤖</span> :
           <BrainIcon className="w-5 h-5 text-white" />}
        </div>
      )}
      <div className={`max-w-xl p-3 rounded-2xl shadow-lg ${
        entry.speaker === 'user' ? 'bg-purple-600 rounded-br-none' : 
        entry.speaker === 'system' ? 'bg-purple-700/80 rounded-bl-none border border-purple-500' :
        'bg-gray-700 rounded-bl-none'
      }`}>
        {entry.speaker === 'system' && (
          <p className="text-xs font-semibold text-purple-300 mb-1">🎯 Maestro Executor</p>
        )}
        <div className="text-sm prose prose-invert prose-sm max-w-none break-words" dangerouslySetInnerHTML={{ __html: entry.text.replace(/\n/g, '<br />') }}></div>
      </div>
      {entry.speaker === 'user' && (
        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
          <UserIcon className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-full h-full bg-black">
      {showPermissionGuide && (
        <PermissionGuide 
          onClose={() => setShowPermissionGuide(false)} 
          onRequestPermissions={requestPermissions}
        />
      )}
      
      <video ref={screenVideoRef} autoPlay className="w-full h-full object-contain"></video>
      <SmartCamera 
        onCameraStatus={setStatus} 
        onFrameCapture={handleCameraFrame}
        sessionId={sessionId}
        sendToGemini={true}
        enabled={permissionsGranted}
      />
      
      <div className="absolute top-4 left-4 z-20 bg-black bg-opacity-50 px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-700">
        {isLoadingContext ? '🎼 Carregando Maestro...' : status}
      </div>
      
      {/* 🎯 Indicador de Executor */}
      <div className={`absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
        executorConnected 
          ? 'bg-green-900/70 text-green-300 border-green-700' 
          : 'bg-red-900/70 text-red-300 border-red-700'
      }`}>
        {executorConnected ? '✅ Executor Online' : '❌ Executor Offline'}
      </div>
      
      {/* 🎯 Indicador de Execução de Comando */}
      {isExecutingCommand && (
        <div className="absolute top-16 left-4 z-30 bg-purple-900/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-purple-500 flex items-center gap-2 animate-pulse">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
          <span className="text-sm font-semibold">{commandStatus}</span>
        </div>
      )}
      
      {contextError && (
        <div className="absolute top-4 right-48 z-20 bg-yellow-900/70 px-3 py-1.5 rounded-lg text-xs text-yellow-300 border border-yellow-700">
          ⚠️ Contexto limitado
        </div>
      )}

      <div className="absolute inset-0 z-20 flex flex-col justify-end p-4 pb-32 pointer-events-none">
        {mediaError ? (
          <div className="w-full max-w-2xl mx-auto bg-red-900/70 backdrop-blur-sm border border-red-700 text-red-300 p-4 rounded-lg text-center pointer-events-auto">
            <h3 className="font-bold text-lg mb-2">Erro de Acesso</h3>
            <p className="mb-3">{mediaError}</p>
            <button 
              onClick={() => {
                setMediaError(null);
                setShowPermissionGuide(true);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <div className="w-full max-w-2xl mx-auto space-y-4 overflow-y-auto h-full pr-2 flex flex-col justify-end">
            {transcriptions.map(renderEntry)}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedInterfaceWithMaestro;
