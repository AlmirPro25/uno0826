/**
 * SmartCamera - Câmera inteligente com reconhecimento facial
 * Envia frames para Gemini Live e detecta pessoas conhecidas
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface SmartCameraProps {
  onCameraStatus?: (status: string) => void;
  onFrameCapture?: (frameBase64: string) => void;
  sessionId?: number | null;
  sendToGemini?: boolean; // Se deve enviar frames para o Gemini Live
  enabled?: boolean; // Se a câmera deve estar ativa
}

interface DetectedPerson {
  name: string;
  isKnown: boolean;
  confidence: number;
  emotion?: string;
}

const SmartCamera: React.FC<SmartCameraProps> = ({ 
  onCameraStatus, 
  onFrameCapture,
  sessionId,
  sendToGemini = false,
  enabled = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const recognitionIntervalRef = useRef<number | null>(null);
  
  const [detectedPeople, setDetectedPeople] = useState<DetectedPerson[]>([]);
  const [isRecognizing, setIsRecognizing] = useState(false);

  // Captura frame da câmera
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.readyState < 2) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  }, []);

  // Reconhece pessoas no frame atual
  const recognizePeople = useCallback(async () => {
    if (!sessionId || isRecognizing) return;
    
    const frameBase64 = captureFrame();
    if (!frameBase64) return;

    setIsRecognizing(true);
    
    try {
      const blob = await fetch(`data:image/jpeg;base64,${frameBase64}`).then(r => r.blob());
      const formData = new FormData();
      formData.append('image', blob);
      formData.append('sessionId', sessionId.toString());

      const response = await fetch('http://localhost:3001/api/people/detect', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.people && data.people.length > 0) {
          setDetectedPeople(data.people);
          console.log('👤 Pessoas detectadas:', data.people);
        }
      }
    } catch (error) {
      console.error('Erro ao reconhecer pessoas:', error);
    } finally {
      setIsRecognizing(false);
    }
  }, [sessionId, captureFrame, isRecognizing]);

  // Drag and drop
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

  // Inicializa câmera
  useEffect(() => {
    if (!enabled) return; // Só acessa câmera se enabled=true
    
    const currentVideoRef = videoRef.current;
    onCameraStatus?.('📹 Acessando câmera...');
    
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      } 
    })
      .then(stream => {
        if (currentVideoRef) {
          currentVideoRef.srcObject = stream;
          onCameraStatus?.('✅ Câmera ativa');
          
          // Inicia reconhecimento facial a cada 5 segundos
          if (sessionId) {
            recognitionIntervalRef.current = window.setInterval(() => {
              recognizePeople();
            }, 5000);
          }
        }
      })
      .catch(err => {
        console.error("Camera Error:", err);
        onCameraStatus?.('❌ Erro na câmera');
      });
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current);
      }
      
      if (currentVideoRef?.srcObject) {
        (currentVideoRef.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    }
  }, [enabled, handleMouseMove, onCameraStatus, sessionId, recognizePeople]);

  // Envia frames para callback (Gemini Live)
  useEffect(() => {
    if (!sendToGemini || !onFrameCapture) return;

    const interval = setInterval(() => {
      const frame = captureFrame();
      if (frame) {
        onFrameCapture(frame);
      }
    }, 1000); // 1 frame por segundo

    return () => clearInterval(interval);
  }, [sendToGemini, onFrameCapture, captureFrame]);

  return (
    <div 
      ref={containerRef} 
      onMouseDown={handleMouseDown} 
      className="absolute bottom-28 right-4 w-64 h-64 z-40 rounded-2xl overflow-hidden shadow-2xl border-4 border-purple-500 cursor-grab bg-gray-900"
    >
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline
        className="w-full h-full object-cover transform scale-x-[-1]"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Overlay com pessoas detectadas */}
      {detectedPeople.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
          {detectedPeople.map((person, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${person.isKnown ? 'bg-green-400' : 'bg-yellow-400'}`} />
              <span className="text-white text-sm font-medium">
                {person.name}
              </span>
              {person.emotion && (
                <span className="text-gray-300 text-xs">
                  {person.emotion}
                </span>
              )}
              {person.isKnown && (
                <span className="text-green-400 text-xs">
                  ✓ Conhecido
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Indicador de reconhecimento */}
      {isRecognizing && (
        <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">
          🔍 Analisando...
        </div>
      )}
    </div>
  );
};

export default SmartCamera;
