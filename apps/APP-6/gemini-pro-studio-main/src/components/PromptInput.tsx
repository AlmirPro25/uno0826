import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { Attachment } from '../types';
import { compressImage, getBase64SizeMB, formatSize } from '../utils/imageCompression';
import { speechRecognitionService, SpeechRecognitionService, RecognitionResult } from '../services/speechRecognitionService';
import { speechSynthesisService } from '../services/speechSynthesisService';

interface PromptInputProps {
  onSend: (prompt: string, attachments?: Attachment[]) => void;
  isLoading: boolean;
  onCameraClick: () => void;
  onTranscribe: (audioBase64: string) => void;
  onOpenLibrary: () => void;
  appendToPromptRef: React.MutableRefObject<(text: string) => void>;
  onWebSearch?: (query: string) => void;
  isSearchMode?: boolean;
  onToggleSearchMode?: () => void;
  isBrowserMode?: boolean;
  onToggleBrowserMode?: () => void;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const AttachmentPreview: React.FC<{ file: File, onRemove: () => void }> = ({ file, onRemove }) => {
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (file.type.startsWith('image/')) {
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [file]);

    return (
         <div className="relative bg-[color:var(--bg-secondary)] rounded-md p-1 text-xs flex items-center gap-1.5">
            {preview ? (
                <img src={preview} alt={file.name} className="w-8 h-8 rounded object-cover"/>
            ) : (
                <div className="w-8 h-8 bg-[color:var(--bg-tertiary)] rounded flex items-center justify-center">
                    <i className="fa-solid fa-file text-text-tertiary text-xs"></i>
                </div>
            )}
            <span className="truncate max-w-24 text-text-secondary">{file.name}</span>
            <button onClick={onRemove} className="absolute -top-1 -right-1 bg-bg-secondary rounded-full w-4 h-4 flex items-center justify-center text-text-tertiary hover:text-white hover:bg-red-500 transition-all">
                <i className="fa-solid fa-times text-[10px]"></i>
            </button>
        </div>
    );
};


export const PromptInput: React.FC<PromptInputProps> = ({ onSend, isLoading, onCameraClick, onTranscribe, onOpenLibrary, appendToPromptRef, onWebSearch, isSearchMode, onToggleSearchMode, isBrowserMode, onToggleBrowserMode }) => {
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    appendToPromptRef.current = (text: string) => {
        setPrompt(prev => prev ? `${prev}\n${text}` : text);
        textareaRef.current?.focus();
    };
  }, [appendToPromptRef]);

  const handleSendClick = async () => {
    if ((prompt.trim() || attachments.length > 0) && !isLoading) {
      setIsCompressing(true);
      
      try {
        const attachmentData: Attachment[] = await Promise.all(
          attachments.map(async (file) => {
            const base64 = await fileToBase64(file);
            
            // Comprime imagens automaticamente
            if (file.type.startsWith('image/')) {
              const originalSize = getBase64SizeMB(base64);
              
              // Só comprime se for maior que 2MB
              if (originalSize > 2) {
                const compressed = await compressImage(base64, file.type, {
                  maxWidth: 1920,
                  maxHeight: 1920,
                  quality: 0.85,
                  maxSizeMB: 5,
                });
                
                console.log(`Compressed ${file.name}: ${formatSize(originalSize)} → ${formatSize(compressed.compressedSize)}`);
                
                return {
                  name: file.name,
                  mimeType: compressed.mimeType,
                  data: compressed.data,
                };
              }
            }
            
            return {
              name: file.name,
              mimeType: file.type,
              data: base64,
            };
          })
        );
        
        onSend(prompt.trim(), attachmentData);
        setPrompt('');
        setAttachments([]);
      } catch (error) {
        console.error('Error processing attachments:', error);
      } finally {
        setIsCompressing(false);
      }
    }
  };
  
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendClick();
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Se não tem texto e não tem transcrição, volta ao tamanho mínimo
      if (!prompt && !interimTranscript) {
        textarea.style.height = '24px'; // minHeight definido no style
      } else {
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${scrollHeight}px`;
      }
    }
  }, [prompt, attachments, interimTranscript]);

  const startRecording = async () => {
    // Verifica suporte
    if (!speechRecognitionService || !SpeechRecognitionService.isSupported()) {
      setMicError("Reconhecimento de voz não suportado neste navegador");
      return;
    }

    try {
      setFinalTranscript('');
      setInterimTranscript('');
      
      // Carregar configuração de idioma salva
      const savedConfig = localStorage.getItem('voiceConfig');
      const language = savedConfig ? JSON.parse(savedConfig).language : 'pt-BR';

      await speechRecognitionService.startRecording(
        {
          language: language,
          continuous: true,
          interimResults: true,
          maxAlternatives: 1
        },
        (result: RecognitionResult) => {
          if (result.isFinal) {
            // Transcrição final - adiciona ao texto
            setFinalTranscript(prev => {
              const newText = prev + result.transcript + ' ';
              setPrompt(newText);
              return newText;
            });
            setInterimTranscript('');
          } else {
            // Transcrição temporária
            setInterimTranscript(result.transcript);
          }
        },
        (error: string) => {
          console.error("Erro no reconhecimento:", error);
          setMicError(error);
          setIsRecording(false);
        },
        () => {
          // Quando terminar
          setIsRecording(false);
          setInterimTranscript('');
        }
      );
      
      setIsRecording(true);
      setMicError(null);
    } catch (err) {
      console.error("Erro ao iniciar gravação:", err);
      setMicError("Erro ao iniciar reconhecimento de voz");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    speechRecognitionService.stopRecording();
    setIsRecording(false);
    setInterimTranscript('');
  };
  
  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };



  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
      e.target.value = '';
    }
  };
  
  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
    if (imageFiles.length > 0) {
      setAttachments(prev => [...prev, ...imageFiles]);
    }
  };

  // Paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        const imageFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith('image/')) {
            const file = items[i].getAsFile();
            if (file) imageFiles.push(file);
          }
        }
        if (imageFiles.length > 0) {
          setAttachments(prev => [...prev, ...imageFiles]);
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const charCount = prompt.length;
  const showCharCount = charCount > 500;

  return (
    <div 
      className={`bg-bg-tertiary border rounded-2xl flex flex-col shadow-xl transition-all relative ${
        isDragging ? 'border-blue-500 border-2 bg-blue-500/10' : 'border-border-color hover:border-[color:var(--border-hover)]'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 rounded-2xl pointer-events-none z-10">
            <div className="text-blue-400 text-lg font-semibold">
              <i className="fa-solid fa-cloud-arrow-up mr-2"></i>
              Solte os arquivos aqui
            </div>
          </div>
        )}
        {attachments.length > 0 && (
            <div className="px-3 pt-3 pb-2 flex flex-wrap gap-2 border-b border-border-color">
                {attachments.map((file, index) => (
                    <AttachmentPreview key={index} file={file} onRemove={() => removeAttachment(index)} />
                ))}
            </div>
        )}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,.txt,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"
      />
      {/* Text Input Row - Only Textarea */}
      <div className="px-3 pt-3 pb-2">
        <textarea
          ref={textareaRef}
          value={prompt + (interimTranscript ? ' ' + interimTranscript : '')}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isRecording 
              ? "Ouvindo... fale agora" 
              : isBrowserMode
                ? "🌐 Modo Navegação Ativo - Digite URL ou pesquisa..."
                : isSearchMode 
                  ? "🔍 Modo Pesquisa Ativo - Digite sua pesquisa..." 
                  : "Pergunte qualquer coisa..."
          }
          className="w-full bg-transparent text-text-primary placeholder-text-tertiary resize-none focus:outline-none max-h-[200px] overflow-y-auto text-[15px] leading-relaxed font-normal scrollbar-thin"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            letterSpacing: '0.01em',
            minHeight: '24px'
          }}
          rows={1}
          disabled={isLoading || isRecording}
        />
        {isRecording && (
          <div className="mt-2 flex items-center gap-2 text-xs text-purple-400">
            <div className="flex gap-1">
              <div className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span>Gravando áudio...</span>
          </div>
        )}
      </div>

      {/* Tools Row - Gemini Style (with Mic and Send) */}
      <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-[color:var(--border-color)]">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-[color:var(--bg-secondary)] rounded-lg transition-all duration-200" 
            title="Adicionar arquivos"
          >
            <i className="fa-solid fa-paperclip text-sm"></i>
          </button>
          <button 
            onClick={onCameraClick} 
            className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-[color:var(--bg-secondary)] rounded-lg transition-all duration-200" 
            title="Usar câmera"
          >
            <i className="fa-solid fa-camera text-sm"></i>
          </button>
          <button 
            onClick={onOpenLibrary} 
            className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-[color:var(--bg-secondary)] rounded-lg transition-all duration-200" 
            title="Biblioteca"
          >
            <i className="fa-solid fa-book-bookmark text-sm"></i>
          </button>
          {onToggleSearchMode && (
            <button 
              onClick={onToggleSearchMode} 
              className={`p-1.5 rounded-lg transition-all duration-200 ${
                isSearchMode 
                  ? 'text-blue-400 bg-blue-500/20 hover:bg-blue-500/30' 
                  : 'text-text-tertiary hover:text-blue-400 hover:bg-[color:var(--bg-secondary)]'
              }`}
              title={isSearchMode ? "Modo Pesquisa Ativo (clique para desativar)" : "Ativar Modo Pesquisa"}
            >
              <i className={`fa-solid fa-magnifying-glass text-sm ${isSearchMode ? 'fa-beat' : ''}`}></i>
            </button>
          )}
          {onToggleBrowserMode && (
            <button 
              onClick={onToggleBrowserMode} 
              className={`p-1.5 rounded-lg transition-all duration-200 relative group ${
                isBrowserMode 
                  ? 'text-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/30 shadow-lg shadow-emerald-500/20' 
                  : 'text-text-tertiary hover:text-emerald-400 hover:bg-[color:var(--bg-secondary)]'
              }`}
              title={isBrowserMode ? "Modo Navegação Ativo - Canvas aberto (clique para desativar)" : "Ativar Modo Navegação - Abre Canvas"}
            >
              <i className={`fa-solid fa-globe text-sm ${isBrowserMode ? 'fa-spin-pulse' : ''}`}></i>
              {isBrowserMode && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
              )}
              {isBrowserMode && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full"></span>
              )}
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {showCharCount && (
            <span className={`text-xs ${charCount > 2000 ? 'text-yellow-500' : 'text-text-tertiary'}`}>
              {charCount}
            </span>
          )}
          <button 
            onClick={handleMicClick} 
            className={`p-2 rounded-lg transition-all duration-200 ${
              isRecording 
                ? 'text-red-500 bg-red-500/10 animate-pulse' 
                : 'text-text-tertiary hover:text-text-primary hover:bg-[color:var(--bg-secondary)]'
            } ${micError ? 'text-yellow-500 cursor-not-allowed' : ''}`}
            title={micError || (isRecording ? "Parar gravação" : "Gravar áudio")}
          >
            <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'} text-base`}></i>
          </button>
          <button 
            onClick={handleSendClick} 
            disabled={isLoading || isCompressing || (!prompt.trim() && attachments.length === 0)} 
            className="w-9 h-9 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center disabled:from-gray-700 disabled:to-gray-700 disabled:text-text-tertiary hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 hover:scale-105 disabled:hover:scale-100 shadow-lg disabled:shadow-none"
          >
            {isCompressing ? (
              <i className="fa-solid fa-spinner fa-spin text-sm"></i>
            ) : (
              <i className="fa-solid fa-arrow-up text-sm"></i>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};