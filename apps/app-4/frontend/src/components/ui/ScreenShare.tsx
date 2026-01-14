/**
 * ScreenShare - Componente de Compartilhamento de Tela
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, 
  MonitorOff, 
  Maximize2, 
  Minimize2, 
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface ScreenShareProps {
  onStreamStart?: (stream: MediaStream) => void;
  onStreamEnd?: () => void;
  onError?: (error: string) => void;
}

export function ScreenShare({ onStreamStart, onStreamEnd, onError }: ScreenShareProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startScreenShare = useCallback(async () => {
    try {
      setError(null);
      
      // Solicitar compartilhamento de tela
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      setStream(mediaStream);
      setIsSharing(true);

      // Exibir preview
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Callback
      onStreamStart?.(mediaStream);

      // Listener para quando o usuário parar de compartilhar
      mediaStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao compartilhar tela';
      
      if (errorMessage.includes('Permission denied')) {
        setError('Permissão negada. Permita o compartilhamento de tela.');
      } else if (errorMessage.includes('NotAllowedError')) {
        setError('Compartilhamento cancelado pelo usuário.');
      } else {
        setError(errorMessage);
      }
      
      onError?.(errorMessage);
    }
  }, [onStreamStart, onError]);

  const stopScreenShare = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsSharing(false);
    onStreamEnd?.();
  }, [stream, onStreamEnd]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="relative">
      {/* Botão de Compartilhar */}
      <button
        onClick={isSharing ? stopScreenShare : startScreenShare}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          isSharing
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        {isSharing ? (
          <>
            <MonitorOff className="w-5 h-5" />
            Parar Compartilhamento
          </>
        ) : (
          <>
            <Monitor className="w-5 h-5" />
            Compartilhar Tela
          </>
        )}
      </button>

      {/* Erro */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 mt-2 p-3 bg-red-50 dark:bg-red-900/20 
                   text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}
    </div>
  );
}

// Preview do compartilhamento de tela
interface ScreenSharePreviewProps {
  stream: MediaStream | null;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onClose?: () => void;
}

export function ScreenSharePreview({ 
  stream, 
  isFullscreen = false, 
  onToggleFullscreen,
  onClose 
}: ScreenSharePreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative bg-black rounded-xl overflow-hidden ${
        isFullscreen 
          ? 'fixed inset-4 z-50' 
          : 'w-full aspect-video'
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain"
      />

      {/* Controles */}
      <div className="absolute top-2 right-2 flex gap-2">
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 bg-red-600/80 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Indicador */}
      <div className="absolute bottom-2 left-2 flex items-center gap-2 px-3 py-1.5 
                    bg-red-600 text-white rounded-full text-sm">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        Compartilhando tela
      </div>
    </motion.div>
  );
}

// Hook para gerenciar compartilhamento de tela
export function useScreenShare() {
  const [isSharing, setIsSharing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startSharing = useCallback(async () => {
    try {
      setError(null);
      
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      setStream(mediaStream);
      setIsSharing(true);

      // Listener para quando parar
      mediaStream.getVideoTracks()[0].addEventListener('ended', () => {
        setStream(null);
        setIsSharing(false);
      });

      return mediaStream;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      throw err;
    }
  }, []);

  const stopSharing = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsSharing(false);
  }, [stream]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return {
    isSharing,
    stream,
    error,
    startSharing,
    stopSharing
  };
}

// Componente de controles de videochamada com compartilhamento
interface VideoCallControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
}

export function VideoCallControls({
  isMuted,
  isVideoOff,
  isScreenSharing,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall
}: VideoCallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 p-4 bg-gray-900/90 rounded-xl">
      {/* Mute */}
      <button
        onClick={onToggleMute}
        className={`p-4 rounded-full transition-colors ${
          isMuted 
            ? 'bg-red-600 text-white' 
            : 'bg-gray-700 text-white hover:bg-gray-600'
        }`}
        title={isMuted ? 'Ativar microfone' : 'Desativar microfone'}
      >
        {isMuted ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {/* Vídeo */}
      <button
        onClick={onToggleVideo}
        className={`p-4 rounded-full transition-colors ${
          isVideoOff 
            ? 'bg-red-600 text-white' 
            : 'bg-gray-700 text-white hover:bg-gray-600'
        }`}
        title={isVideoOff ? 'Ativar câmera' : 'Desativar câmera'}
      >
        {isVideoOff ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>

      {/* Compartilhar Tela */}
      <button
        onClick={onToggleScreenShare}
        className={`p-4 rounded-full transition-colors ${
          isScreenSharing 
            ? 'bg-green-600 text-white' 
            : 'bg-gray-700 text-white hover:bg-gray-600'
        }`}
        title={isScreenSharing ? 'Parar compartilhamento' : 'Compartilhar tela'}
      >
        {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
      </button>

      {/* Encerrar */}
      <button
        onClick={onEndCall}
        className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
        title="Encerrar chamada"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
        </svg>
      </button>
    </div>
  );
}

export default ScreenShare;
