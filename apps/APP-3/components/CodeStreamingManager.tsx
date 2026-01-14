import React, { useCallback, useRef, useState } from 'react';
import type { editor } from 'monaco-editor';

interface StreamingState {
  isActive: boolean;
  currentContent: string;
  autoScroll: boolean;
  speed: number; // characters per second
}

export interface StreamingControls {
  isStreaming: () => boolean;
  streamChunk: (chunk: string) => void;
  stopStreaming: () => void;
  completeStreaming: () => void;
  setAutoScroll: (enabled: boolean) => void;
  setSpeed: (speed: number) => void;
}

export const useCodeStreaming = (
  editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>
): StreamingControls => {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isActive: false,
    currentContent: '',
    autoScroll: true,
    speed: 50 // 50 chars per second
  });

  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChunksRef = useRef<string[]>([]);

  const isStreaming = useCallback(() => {
    return streamingState.isActive;
  }, [streamingState.isActive]);

  const autoScrollToBottom = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !streamingState.autoScroll) return;

    const model = editor.getModel();
    if (!model) return;

    const lineCount = model.getLineCount();
    editor.revealLine(lineCount, 1); // Smooth scroll to bottom
    
    // Posicionar cursor no final
    const lastLineLength = model.getLineLength(lineCount);
    editor.setPosition({ lineNumber: lineCount, column: lastLineLength + 1 });
  }, [editorRef, streamingState.autoScroll]);

  const processNextChunk = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || pendingChunksRef.current.length === 0) {
      return;
    }

    const chunk = pendingChunksRef.current.shift();
    if (!chunk) return;

    const currentValue = editor.getValue();
    const newValue = currentValue + chunk;
    
    editor.setValue(newValue);
    
    // Auto-scroll se habilitado
    if (streamingState.autoScroll) {
      setTimeout(autoScrollToBottom, 10);
    }

    setStreamingState(prev => ({
      ...prev,
      currentContent: newValue
    }));
  }, [editorRef, streamingState.autoScroll, autoScrollToBottom]);

  const streamChunk = useCallback((chunk: string) => {
    if (!streamingState.isActive) {
      // Iniciar streaming se não estiver ativo
      setStreamingState(prev => ({ ...prev, isActive: true }));
    }

    // Adicionar chunk à fila
    pendingChunksRef.current.push(chunk);

    // Iniciar processamento se não estiver rodando
    if (!streamingIntervalRef.current) {
      streamingIntervalRef.current = setInterval(() => {
        processNextChunk();
        
        // Parar se não há mais chunks
        if (pendingChunksRef.current.length === 0) {
          if (streamingIntervalRef.current) {
            clearInterval(streamingIntervalRef.current);
            streamingIntervalRef.current = null;
          }
        }
      }, 1000 / streamingState.speed); // Baseado na velocidade configurada
    }
  }, [streamingState.isActive, streamingState.speed, processNextChunk]);

  const stopStreaming = useCallback(() => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    
    pendingChunksRef.current = [];
    
    setStreamingState(prev => ({
      ...prev,
      isActive: false
    }));
  }, []);

  const completeStreaming = useCallback(() => {
    // Processar todos os chunks restantes imediatamente
    while (pendingChunksRef.current.length > 0) {
      processNextChunk();
    }
    
    stopStreaming();
  }, [processNextChunk, stopStreaming]);

  const setAutoScroll = useCallback((enabled: boolean) => {
    setStreamingState(prev => ({
      ...prev,
      autoScroll: enabled
    }));
  }, []);

  const setSpeed = useCallback((speed: number) => {
    setStreamingState(prev => ({
      ...prev,
      speed: Math.max(1, Math.min(200, speed)) // Limitar entre 1-200 chars/sec
    }));
  }, []);

  return {
    isStreaming,
    streamChunk,
    stopStreaming,
    completeStreaming,
    setAutoScroll,
    setSpeed
  };
};

interface StreamingControlsProps {
  isStreaming: boolean;
  onStop: () => void;
  onComplete: () => void;
  autoScroll: boolean;
  onAutoScrollChange: (enabled: boolean) => void;
}

export const StreamingControls: React.FC<StreamingControlsProps> = ({
  isStreaming,
  onStop,
  onComplete,
  autoScroll,
  onAutoScrollChange
}) => {
  if (!isStreaming) return null;

  return (
    <div className="absolute top-2 right-2 bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg shadow-lg z-20">
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <div className="animate-pulse w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="font-medium">Streaming</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => onAutoScrollChange(!autoScroll)}
            className={`p-1 rounded text-xs transition-colors ${
              autoScroll 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title={autoScroll ? 'Desabilitar auto-scroll' : 'Habilitar auto-scroll'}
          >
            <i className="fa-solid fa-arrows-up-down"></i>
          </button>
          
          <button
            onClick={onComplete}
            className="p-1 rounded text-xs bg-green-600 text-white hover:bg-green-700 transition-colors"
            title="Completar streaming imediatamente"
          >
            <i className="fa-solid fa-forward-fast"></i>
          </button>
          
          <button
            onClick={onStop}
            className="p-1 rounded text-xs bg-red-600 text-white hover:bg-red-700 transition-colors"
            title="Parar streaming"
          >
            <i className="fa-solid fa-stop"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default useCodeStreaming;