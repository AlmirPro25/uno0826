import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { geminiService } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
import { personalityService } from '../services/personalityService';
import { memoryService } from '../services/memoryService';
import { proactiveService } from '../services/proactiveService';
import { encode, decode, decodeAudioData, getAudioContext } from '../utils/audioUtils';
import { TranscriptionEntry } from '../types';
import { RobotIcon, UserIcon, BrainIcon, CloseIcon, SendIcon } from './Icons';
import PermissionGuide from './PermissionGuide';

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


const DraggablePiP = ({ onCameraStatus }: { onCameraStatus?: (status: string) => void }) => {
    const pipRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const offset = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          offset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          };
        }
        (e.target as HTMLElement).style.cursor = 'grabbing';
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;
        e.preventDefault();
        const parentRect = (containerRef.current.parentNode as HTMLElement).getBoundingClientRect();
        let newX = e.clientX - offset.current.x - parentRect.left;
        let newY = e.clientY - offset.current.y - parentRect.top;

        newX = Math.max(0, Math.min(newX, parentRect.width - containerRef.current.offsetWidth));
        newY = Math.max(0, Math.min(newY, parentRect.height - containerRef.current.offsetHeight));

        containerRef.current.style.left = `${newX}px`;
        containerRef.current.style.top = `${newY}px`;
    }, []);

    const handleMouseUp = (e: MouseEvent) => {
        isDragging.current = false;
        if (e.target instanceof HTMLElement) {
            e.target.style.cursor = 'grab';
        }
    };
    
    useEffect(() => {
        const currentPipRef = pipRef.current;
        onCameraStatus?.('📹 Acessando câmera...');
        
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                if (currentPipRef) {
                    currentPipRef.srcObject = stream;
                    onCameraStatus?.('✅ Conectado');
                }
            })
            .catch(err => {
                console.error("PiP Camera Error:", err);
                onCameraStatus?.('❌ Erro na câmera');
            });
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
             window.removeEventListener('mousemove', handleMouseMove);
             window.removeEventListener('mouseup', handleMouseUp);
             if (currentPipRef?.srcObject) {
                 (currentPipRef.srcObject as MediaStream).getTracks().forEach(track => track.stop());
             }
        }
    }, [handleMouseMove, onCameraStatus]);

    return (
        <div ref={containerRef} onMouseDown={handleMouseDown} className="absolute bottom-28 right-4 w-48 h-48 z-40 rounded-full overflow-hidden shadow-2xl border-4 border-purple-500 cursor-grab">
            <video ref={pipRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]"></video>
        </div>
    );
}

const UnifiedInterface: React.FC = () => {
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const [status, setStatus] = useState('Idle');
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropState, setCropState] = useState<{ image: string; rect: { x: number; y: number; width: number; height: number; } | null }>({ image: '', rect: null });
  const [analysisPrompt, setAnalysisPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const startPoint = useRef<{x:number, y:number} | null>(null);

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  const sessionIdRef = useRef<number | null>(null);
  
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const frameIntervalRef = useRef<number | null>(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(scrollToBottom, [transcriptions]);

  const handleStartCapture = useCallback(async () => {
    if (!screenVideoRef.current || isCropping) return;
    const video = screenVideoRef.current;
    video.pause();

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    setCropState({ image: canvas.toDataURL('image/jpeg'), rect: null });
    setIsCropping(true);
  }, [isCropping]);
  
  useEffect(() => {
    window.addEventListener('startCapture', handleStartCapture);
    return () => window.removeEventListener('startCapture', handleStartCapture);
  }, [handleStartCapture]);


  const transcriptionsRef = useRef<TranscriptionEntry[]>([]);
  
  useEffect(() => {
    transcriptionsRef.current = transcriptions;
  }, [transcriptions]);

  const cleanup = useCallback(async () => {
    // Summarize and save the session before cleaning up
    if (sessionIdRef.current && transcriptionsRef.current.length > 0) {
        const fullTranscript = transcriptionsRef.current.map(t => `${t.speaker}: ${t.text}`).join('\n');
        await databaseService.summarizeAndStoreSession(sessionIdRef.current, fullTranscript);
        
        // Tenta usar recursos de inteligência (não crítico se falhar)
        try {
          await memoryService.extractAndStoreFactsFromConversation(fullTranscript);
          personalityService.recordInteraction(fullTranscript, 'Session completed');
        } catch (e) {
          console.warn('Could not save intelligence data:', e);
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
    setTranscriptions([]);
    sessionIdRef.current = null;
  }, []);

  const requestPermissions = async () => {
    setShowPermissionGuide(false);
    setPermissionsGranted(true); // Marca como concedido para iniciar a sessão
  };

  useEffect(() => {
    if (!permissionsGranted) {
      setShowPermissionGuide(true);
      return;
    }

    const startSession = async () => {
      setStatus('Conectando...');
      setMediaError(null);
      try {
        sessionIdRef.current = await databaseService.createSession();
        
        // Obtém contexto de forma segura (pode falhar se localStorage cheio)
        let memoryContext = '';
        let personalityInstruction = 'You are a friendly and helpful AI companion who sees the user\'s screen. Help them with their tasks.';
        
        try {
          memoryContext = await memoryService.getContextForAI('Starting new session');
          const lastSummary = await databaseService.getLatestSummary();
          
          personalityInstruction = personalityService.generateSystemInstruction(
            lastSummary ? `PREVIOUS CONVERSATION: ${lastSummary}` : undefined
          );
          
          // Registra padrões de trabalho (não crítico)
          memoryService.analyzeWorkPatterns();
        } catch (e) {
          console.warn('Could not load intelligence features:', e);
          // Continua sem recursos avançados
        }
        
        const systemInstruction = memoryContext 
          ? `${personalityInstruction}\n\n${memoryContext}\n\nYou are seeing the user's screen in real-time. Help them with their tasks proactively when appropriate.`
          : personalityInstruction;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        setStatus('📺 Selecione a tela para compartilhar...');
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
              setStatus('Connected');
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

              // Start streaming video frames
              const videoEl = screenVideoRef.current;
              if (videoEl) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const FRAME_RATE = 2; // frames per second
                const JPEG_QUALITY = 0.7;
                let frameCount = 0;

                frameIntervalRef.current = window.setInterval(() => {
                    if (videoEl.readyState >= 2 && ctx) { // HAVE_CURRENT_DATA
                        canvas.width = videoEl.videoWidth;
                        canvas.height = videoEl.videoHeight;
                        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                        canvas.toBlob(
                            async (blob) => {
                                if (blob) {
                                    const base64Data = await blobToBase64(blob);
                                    
                                    // Envia para o Gemini
                                    sessionPromise.then((session) => {
                                      session.sendRealtimeInput({
                                        media: { data: base64Data, mimeType: 'image/jpeg' }
                                      });
                                    });
                                    
                                    // Análise proativa a cada 15 frames (30 segundos a 2fps)
                                    frameCount++;
                                    if (frameCount % 15 === 0 && proactiveService.isProactiveEnabled()) {
                                      const analysis = await proactiveService.analyzeScreenFrame(base64Data);
                                      if (analysis.suggestions.length > 0) {
                                        analysis.suggestions.forEach(suggestion => {
                                          proactiveService.addSuggestion(suggestion);
                                        });
                                      }
                                    }
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
                    
                    if (sessionIdRef.current) {
                        if(userInput) {
                          await databaseService.addMessage(sessionIdRef.current, 'user', userInput);
                          // Adiciona à memória de curto prazo (não crítico)
                          try {
                            memoryService.addToShortTerm(`User: ${userInput}`);
                          } catch (e) {
                            console.warn('Could not add to short term memory:', e);
                          }
                        }
                        if(modelOutput) {
                          await databaseService.addMessage(sessionIdRef.current, 'model', modelOutput);
                          try {
                            memoryService.addToShortTerm(`Assistant: ${modelOutput}`);
                          } catch (e) {
                            console.warn('Could not add to short term memory:', e);
                          }
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
            systemInstruction: systemInstruction,
          },
        });
        sessionPromiseRef.current = sessionPromise;
      } catch (error: any) {
        console.error('Session start error:', error);
        setStatus('Erro');
        
        let errorMessage = 'Não foi possível acessar tela ou microfone.';
        
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Você negou as permissões. Clique em "Tentar Novamente" e permita o acesso à tela, microfone e câmera.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Dispositivo não encontrado. Verifique se sua câmera e microfone estão conectados.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Dispositivo em uso. Feche outros programas (Zoom, Teams, etc.) e tente novamente.';
        } else if (error.message?.includes('Permission')) {
          errorMessage = 'Permissões necessárias não foram concedidas. Tente novamente e permita todos os acessos.';
        }
        
        setMediaError(errorMessage);
        setPermissionsGranted(false); // Reset para mostrar o guia novamente
      }
    };
    
    startSession();
    return () => {
        cleanup();
    };
  }, [cleanup, permissionsGranted]);
  
  const drawCropOverlay = useCallback(() => {
    const canvas = cropCanvasRef.current;
    if (!canvas || !cropState.image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw image scaled to canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (cropState.rect) {
            const { x, y, width, height } = cropState.rect;
            ctx.clearRect(x, y, width, height);
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);
        }
    }
    img.src = cropState.image;
  }, [cropState]);
  
  useEffect(() => {
      if (isCropping && cropCanvasRef.current) {
        const canvas = cropCanvasRef.current;
        const img = new Image();
        img.onload = () => {
            // Set canvas size to match the image to preserve aspect ratio
            canvas.width = img.width;
            canvas.height = img.height;
            // Style canvas to fit the window
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.objectFit = 'contain';
            drawCropOverlay();
        }
        img.src = cropState.image;
      }
  }, [isCropping, cropState.image, drawCropOverlay]);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if(!cropCanvasRef.current) return;
    const rect = cropCanvasRef.current.getBoundingClientRect();
    startPoint.current = { 
        x: e.clientX - rect.left, 
        y: e.clientY - rect.top 
    };
    setCropState(prev => ({ ...prev, rect: null }));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!startPoint.current || !cropCanvasRef.current) return;
    const rect = cropCanvasRef.current.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    const x = Math.min(startPoint.current.x, endX);
    const y = Math.min(startPoint.current.y, endY);
    const width = Math.abs(startPoint.current.x - endX);
    const height = Math.abs(startPoint.current.y - endY);
    setCropState(prev => ({ ...prev, rect: { x, y, width, height }}));
    drawCropOverlay();
  };

  const handleMouseUp = () => {
    startPoint.current = null;
  };

  const handleCancelCrop = () => {
    setIsCropping(false);
    setCropState({ image: '', rect: null });
    setAnalysisPrompt('');
    screenVideoRef.current?.play().catch(err => console.error("Error resuming video:", err));
  };
  
  const handleAnalyze = async () => {
    if (!cropState.rect || !analysisPrompt || !cropState.image || !cropCanvasRef.current) return;
    setIsAnalyzing(true);

    const { x, y, width, height } = cropState.rect;
    const tempCanvas = document.createElement('canvas');
    const sourceImage = new Image();
    
    sourceImage.onload = async () => {
        // Calculate scaling factor between displayed canvas and original image source
        const scaleX = sourceImage.width / cropCanvasRef.current!.clientWidth;
        const scaleY = sourceImage.height / cropCanvasRef.current!.clientHeight;

        tempCanvas.width = width * scaleX;
        tempCanvas.height = height * scaleY;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw the cropped portion of the original image to the new canvas
        tempCtx?.drawImage(sourceImage, x * scaleX, y * scaleY, width * scaleX, height * scaleY, 0, 0, tempCanvas.width, tempCanvas.height);
        
        const croppedImage = tempCanvas.toDataURL('image/jpeg');
        const base64Data = croppedImage.split(',')[1];
        const result = await geminiService.analyzeImageAndText(base64Data, 'image/jpeg', analysisPrompt);
        
        if(sessionIdRef.current) {
            await databaseService.addMessage(sessionIdRef.current, 'analysis', result);
        }

        setTranscriptions(prev => [...prev, { id: Date.now(), speaker: 'analysis', text: result }]);
        setIsAnalyzing(false);
        handleCancelCrop();
    };
    sourceImage.src = cropState.image;
  };
  
  const renderEntry = (entry: TranscriptionEntry) => (
    <div key={entry.id} className={`flex items-start gap-3 my-2 ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
        {entry.speaker !== 'user' && <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${entry.speaker === 'model' ? 'bg-gray-700' : 'bg-teal-600'}`}>
            {entry.speaker === 'model' ? <RobotIcon className="w-5 h-5 text-purple-400" /> : <BrainIcon className="w-5 h-5 text-white" />}
        </div>}
        <div className={`max-w-xl p-3 rounded-2xl shadow-lg ${entry.speaker === 'user' ? 'bg-purple-600 rounded-br-none' : `bg-gray-700 rounded-bl-none ${entry.speaker === 'analysis' ? 'border border-teal-500' : ''}`}`}>
            {entry.speaker === 'analysis' && <p className="text-sm font-semibold text-teal-300 mb-1">Screen Analysis:</p>}
            <div className="text-sm prose prose-invert prose-sm max-w-none break-words" dangerouslySetInnerHTML={{__html: entry.text.replace(/\n/g, '<br />') }}></div>
        </div>
        {entry.speaker === 'user' && <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0"><UserIcon className="w-5 h-5 text-white" /></div>}
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
      <DraggablePiP onCameraStatus={setStatus} />
      
      <div className="absolute top-4 left-4 z-20 bg-black bg-opacity-50 px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-700">{status}</div>

      <div className="absolute inset-0 z-20 flex flex-col justify-end p-4 pb-32 pointer-events-none">
        {mediaError ? <div className="w-full max-w-2xl mx-auto bg-red-900/70 backdrop-blur-sm border border-red-700 text-red-300 p-4 rounded-lg text-center pointer-events-auto">
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
            </div> : <div className="w-full max-w-2xl mx-auto space-y-4 overflow-y-auto h-full pr-2 flex flex-col justify-end">
                {transcriptions.map(renderEntry)}
                <div ref={chatEndRef} />
            </div>
        }
      </div>

      {isCropping && (
        <div className="fixed inset-0 z-50 cursor-crosshair bg-black/30 flex items-center justify-center">
            <canvas ref={cropCanvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} />
            <button onClick={handleCancelCrop} className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:text-purple-400 transition-colors z-10"><CloseIcon className="w-8 h-8" /></button>
            {cropState.rect && (
                <div className="absolute bg-gray-800 rounded-lg shadow-2xl p-4 border border-gray-700 flex items-center gap-2 z-10" style={{ transform: `translate(-50%, 10px)`, left: `${cropState.rect.x + cropState.rect.width / 2}px`, top: `${cropState.rect.y + cropState.rect.height}px` }}>
                    <input type="text" value={analysisPrompt} onChange={e => setAnalysisPrompt(e.target.value)} placeholder="Ask about selection..." className="bg-gray-700 text-white p-2 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none" autoFocus onKeyDown={e => e.key === 'Enter' && handleAnalyze()}/>
                    <button onClick={handleAnalyze} disabled={isAnalyzing || !analysisPrompt} className="text-purple-400 hover:text-purple-300 disabled:text-gray-500 disabled:cursor-not-allowed">
                        {isAnalyzing ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div> : <SendIcon className="w-6 h-6"/>}
                    </button>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default UnifiedInterface;