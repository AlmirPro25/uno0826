


import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { AppPhase, AppMode } from '@/store/useAppStore';
import { useAppStore } from '@/store/useAppStore';
import { v4 as uuidv4 } from 'uuid';
import CompactAISelector from './CompactAISelector';
import { ApiKeyModal } from './ApiKeyModal';
import { ApiKeysManagerModal } from './ApiKeysManagerModal';
import { UsageStatus } from './UsageStatus';
import { ApiKeyManager } from '../services/ApiKeyManager';
import { useMobileDetection } from '@/hooks/useMobileDetection';

// Add this at the top of the file to fix SpeechRecognition errors.
interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: () => void;
  onend: () => void;
  onerror: (event: any) => void;
  onresult: (event: any) => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64 data
  preview: string; // data URL for images, or a placeholder icon for others
}

export interface AttachmentFile {
    mimeType: string;
    data: string; // base64 data
}


// --- Reusable Dropdown Components ---
const Dropdown: React.FC<React.PropsWithChildren<{
  buttonIcon: string;
  buttonText: string;
  disabled?: boolean;
}>> = ({ buttonIcon, buttonText, children, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div className="relative inline-block text-left" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 focus:ring-sky-400 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-600 hover:bg-slate-500 text-slate-200"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <i className={`${buttonIcon} w-3.5 h-3.5`}></i>
        <span className="hidden sm:inline">{buttonText}</span>
        <i className="fa-solid fa-chevron-down fa-xs -mr-1 ml-1 h-3 w-3 text-slate-400" />
      </button>
      <div
        className={`origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-slate-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 transition-all duration-100 ease-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
        role="menu"
        aria-orientation="vertical"
      >
        <div className="py-1" role="none" onClick={() => setIsOpen(false)}>
          {children}
        </div>
      </div>
    </div>
  );
};

const DropdownItem: React.FC<{
    onClick?: () => void;
    disabled?: boolean;
    showSpinner?: boolean;
    iconClass: string;
    text: string;
    badgeCount?: number;
}> = ({ onClick, disabled, showSpinner, text, iconClass, badgeCount }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled || showSpinner}
            className="w-full text-left flex items-center justify-between gap-3 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-600 hover:text-sky-300 disabled:text-slate-500 disabled:bg-transparent disabled:cursor-not-allowed transition-colors group"
            role="menuitem"
        >
            <div className="flex items-center gap-3">
              {showSpinner ? (
                   <svg className="animate-spin h-4 w-4 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
              ) : (
                  <i className={`${iconClass} w-4 h-4 text-slate-400 group-hover:text-sky-400 transition-colors`}></i>
              )}
              <span>{text}</span>
            </div>
            {badgeCount && badgeCount > 0 ? (
                <span className="px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">{badgeCount}</span>
            ) : null}
        </button>
    );
};

// --- CommandBar Main Component ---

// 🚀 SELETOR DE MODO DE GERAÇÃO (Single Shot / Auto / Enterprise)
const GenerationModeToggle: React.FC = () => {
  const { generationMode, setGenerationMode } = useAppStore();
  
  const modes = [
    { 
      value: 'single' as const, 
      label: '1x', 
      icon: '⚡',
      color: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
      inactiveColor: 'bg-slate-600 hover:bg-slate-500',
      description: 'Single Shot - Tudo em 1 chamada (código coeso)'
    },
    { 
      value: 'auto' as const, 
      label: 'Auto', 
      icon: '🔄',
      color: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      inactiveColor: 'bg-slate-600 hover:bg-slate-500',
      description: 'Auto - Sistema decide baseado na complexidade'
    },
    { 
      value: 'enterprise' as const, 
      label: '5x', 
      icon: '🏢',
      color: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
      inactiveColor: 'bg-slate-600 hover:bg-slate-500',
      description: 'Enterprise - 5 chamadas especializadas'
    }
  ];

  const currentMode = modes.find(m => m.value === generationMode) || modes[1];

  return (
    <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg p-0.5">
      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => setGenerationMode(mode.value)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-800 ${
            generationMode === mode.value 
              ? `${mode.color} text-white shadow-sm` 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-600/50'
          }`}
          title={mode.description}
        >
          <span>{mode.icon}</span>
          <span className="hidden sm:inline">{mode.label}</span>
        </button>
      ))}
    </div>
  );
};

interface CommandBarProps {
  appMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onSwitchToChat: () => void;
  onSend: (prompt: string, attachments?: AttachmentFile[], action?: 'GENERATE_CODE_FROM_PLAN' | 'REFINE_PLAN', forceFullStack?: boolean, arquitetaUnica?: boolean, artesaoMundos?: boolean) => void;
  onSendWithAntiSimulation?: (prompt: string, attachments?: AttachmentFile[], action?: 'GENERATE_CODE_FROM_PLAN' | 'REFINE_PLAN', forceFullStack?: boolean, arquitetaUnica?: boolean, artesaoMundos?: boolean) => void;
  onFetchUrl: (url: string) => void;
  isLoading: boolean;
  statusMessage: string | null;
  currentPhase: AppPhase;
  projectPlan: string | null;
  onCopyCode: () => void;
  hasInitScript: boolean;
  onCopyInitScript: () => void;
  textModelOptions: { id: string; name: string; isDefault?: boolean }[];
  selectedTextModel: string;
  onSelectedTextModelChange: (modelId: string) => void;
  onResetProject?: () => void;
  onFinalizeInteraction: () => void;
  canFinalizeInteraction: boolean;
  onLikeInteraction: () => void;
  onDislikeInteraction: () => void;
  currentInteractionUserFeedback: 'liked' | 'disliked' | null;
  canRateInteraction: boolean;
  onOpenBrainstormingModal: () => void;
  onOpenThemeCustomizerModal: () => void;
  onOpenTaskManager: () => void;
  handleRequestSiteCritique: () => void;
  canRequestSiteCritique: boolean;
  onUndoLastAiOperation: () => void;
  canUndoLastAiOperation: boolean;
  onSaveWipProject: () => void;
  onExportProject: () => void;
  canExportProject: boolean;
  onOpenSnapshotsModal: () => void;
  onOpenEvolutionTracker: () => void;
  onOpenAiCodeInsightModal: () => void;
  hasEditorSelection: boolean;
  onOpenAssetLibrary: () => void;
  onShareProject: () => void;
  onRequestTestSuggestions: () => void;
  canRequestTestSuggestions: boolean;
  onOpenAiCodeDoctorModal: () => void;
  canRequestAiCodeDoctor: boolean;
  onToggleConsole: () => void;
  consoleErrorCount: number;
  autoCritiqueResult: string | null;
  onApplyCritiqueRefinement: () => void;
  isLoadingCritique: boolean;
  // AI Specialist props
  activeAiSpecialist?: 'general' | 'frontend' | 'backend';
  onAiSpecialistChange?: (specialist: 'general' | 'frontend' | 'backend') => void;
  
  // Tech Stack Selector props
  onOpenTechStackSelector?: () => void;
  
  // Frontend/Backend Separation props
  onGenerateFrontendOnly?: (prompt: string) => void;
  onGenerateBackendOnly?: (prompt: string) => void;
  onConnectFrontendBackend?: () => void;
  onSaveFrontendCode?: () => void;
  onSaveBackendCode?: () => void;
  frontendCode?: string | null;
  backendCode?: string | null;
  hasSeparatedCodes?: boolean;
  isGeneratingFrontend?: boolean;
  isGeneratingBackend?: boolean;
  isConnectingFrontendBackend?: boolean;
}

export const CommandBar: React.FC<CommandBarProps> = (props) => {
  const { isMobile } = useMobileDetection();
  
  const [prompt, setPrompt] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [useAntiSimulation, setUseAntiSimulation] = useState<boolean>(true);
  const [forceFullStack, setForceFullStack] = useState<boolean>(false);
  const [arquitetaUnica, setArquitetaUnica] = useState<boolean>(false);
  const [artesaoMundos, setArtesaoMundos] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState<boolean>(false);
  const [showLimitReached, setShowLimitReached] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const promptBeforeRecordingRef = useRef<string>('');
  const stopRecordingTimeoutRef = useRef<number | null>(null);
  
  const handleAiSubmit = (e?: React.FormEvent<HTMLFormElement>, action?: 'GENERATE_CODE_FROM_PLAN' | 'REFINE_PLAN') => {
    e?.preventDefault();
    if ((prompt.trim() || attachments.length > 0 || action) && !props.isLoading) {
        // Verificar se pode fazer geração
        const canGenerate = ApiKeyManager.canGenerate();
        if (!canGenerate.allowed) {
          setShowLimitReached(true);
          setIsApiKeyModalOpen(true);
          return;
        }

        const attachmentFiles: AttachmentFile[] = attachments.map(att => ({
            mimeType: att.type,
            data: att.data
        }));
        
        // Usar sistema anti-simulação se ativado e disponível
        if (useAntiSimulation && props.onSendWithAntiSimulation) {
          props.onSendWithAntiSimulation(prompt, attachmentFiles, action, forceFullStack, arquitetaUnica, artesaoMundos);
        } else {
          props.onSend(prompt, attachmentFiles, action, forceFullStack, arquitetaUnica, artesaoMundos);
        }
        
        setPrompt('');
        setAttachments([]);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    }
  };


  const handleUrlFetchSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (urlInput.trim() && !props.isLoading) {
      props.onFetchUrl(urlInput);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [prompt]);

  const fileToAttachment = (file: File): Promise<Attachment> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const base64Data = dataUrl.split(',')[1];
        let preview = '';
        if (file.type.startsWith('image/')) {
          preview = dataUrl;
        } else if (file.type === 'application/pdf') {
          preview = 'pdf'; // Placeholder for PDF icon
        } else {
          preview = 'file'; // Generic file icon
        }
        resolve({
          id: uuidv4(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64Data,
          preview,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newAttachments = await Promise.all(Array.from(files).map(fileToAttachment));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const handlePaste = useCallback(async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          event.preventDefault();
          const newAttachment = await fileToAttachment(file);
          setAttachments(prev => [...prev, newAttachment]);
        }
      }
    }
  }, []);

  const handleMicClick = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      if (stopRecordingTimeoutRef.current) {
        clearTimeout(stopRecordingTimeoutRef.current);
        stopRecordingTimeoutRef.current = null;
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta a API de Reconhecimento de Voz.");
      return;
    }

    promptBeforeRecordingRef.current = prompt;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'pt-BR';
    recognitionRef.current.interimResults = true;
    recognitionRef.current.continuous = true;

    recognitionRef.current.onstart = () => setIsRecording(true);

    recognitionRef.current.onend = () => {
      setIsRecording(false);
      if (stopRecordingTimeoutRef.current) {
        clearTimeout(stopRecordingTimeoutRef.current);
        stopRecordingTimeoutRef.current = null;
      }
    };

    recognitionRef.current.onerror = (e) => {
      console.error("Erro no reconhecimento de voz:", e);
      setIsRecording(false);
    };

    const stopAfterSilence = () => {
        if (stopRecordingTimeoutRef.current) clearTimeout(stopRecordingTimeoutRef.current);
        stopRecordingTimeoutRef.current = window.setTimeout(() => {
            recognitionRef.current?.stop();
        }, 30000);
    };

    recognitionRef.current.onresult = (event) => {
        stopAfterSilence(); // Reset the timer on any result.
        const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');

        const baseText = promptBeforeRecordingRef.current;
        const separator = baseText && !baseText.endsWith(' ') ? ' ' : '';
        setPrompt(baseText + separator + transcript);
    };

    recognitionRef.current.start();
    stopAfterSilence();
  };


  const getAiPlaceholderText = () => {
    if (props.isLoading) {
      switch (props.currentPhase) {
        case 'PERFORMING_RESEARCH':
          return "🔍 IA pesquisando tendências e referências de mercado...";
        case 'GENERATING_FRONTEND':
          return "🎨 CHAMADA API 1/5: Gerando Frontend exclusivo com streaming...";
        case 'GENERATING_BACKEND':
          return "⚙️ CHAMADA API 2/5: Gerando Backend exclusivo integrado...";
        case 'GENERATING_CODE_FROM_PLAN':
          return "📚 CHAMADA API 3/5: Gerando documentação completa...";
        case 'AWAITING_CODE_MODIFICATION':
          return "✨ IA refinando e otimizando o código...";
        default:
          return "🧠 IA processando sua solicitação...";
      }
    }
    
    // Indicadores para geração separada
    if (props.isGeneratingFrontend) return "🎨 IA DEDICADA: Gerando frontend com 100% de foco...";
    if (props.isGeneratingBackend) return "⚙️ IA DEDICADA: Gerando backend com 100% de foco...";
    if (props.isConnectingFrontendBackend) return "🔗 IA conectando frontend e backend automaticamente...";
    if (props.isLoadingCritique) return "🔬 CHAMADA API 5/5: Auto-avaliação final em andamento...";
    if (isRecording) return "🎙️ Ouvindo sua instrução...";
    if (props.autoCritiqueResult) return "✅ Melhorias sugeridas pela IA - aplique ou dê novas instruções...";
    if (props.currentPhase === 'PLAN_DISPLAYED') return "📋 Plano pronto! Gere código, refine o plano ou adicione detalhes...";
    if (props.projectPlan) return "🛠️ Projeto ativo - modifique, refine ou adicione funcionalidades...";
    if (artesaoMundos) return "🎮 ARTESÃO DE MUNDOS ATIVO - Jogos 3D com Three.js + WebGL + Áudio";
    if (arquitetaUnica) return "🏗️ ARQUITETA ÚNICA ATIVA - App completo em 2 arquivos: index.js + index.html";
    if (forceFullStack) return "🚀 MODO FULLSTACK ATIVO - 5 Chamadas API: Frontend→Backend→Docs→Imagens→Avaliação";
    return "💡 Descreva seu projeto, anexe referências ou use comandos de voz...";
  };

  const selectedModel = props.textModelOptions.find(m => m.id === props.selectedTextModel);

  return (
    <div className={`${isMobile ? 'p-1' : 'p-2'} bg-slate-800 border-b border-slate-700 flex flex-col ${isMobile ? 'gap-1' : 'gap-2'}`}>
      <div className={`flex items-start ${isMobile ? 'gap-1' : 'gap-2'}`}>
        <form onSubmit={handleAiSubmit} className="flex-grow flex flex-col gap-2">
          <div className="flex-grow relative group bg-slate-700 border border-slate-600 rounded-lg focus-within:ring-2 focus-within:ring-sky-500">
            <div className="flex items-start p-2">
              <i className="fa-solid fa-wand-magic-sparkles text-sky-400 mt-2.5 ml-1 mr-2 group-focus-within:animate-pulse"></i>
              <textarea
                id="command-bar-input"
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAiSubmit();
                  }
                }}
                placeholder={isMobile ? "O que você quer criar?" : getAiPlaceholderText()}
                disabled={props.isLoading}
                className={`w-full bg-transparent text-slate-100 placeholder-slate-400 focus:outline-none ${isMobile ? 'text-xs' : 'text-sm'} resize-none scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50`}
                rows={1}
                style={{ minHeight: isMobile ? '32px' : '44px' }}
              />
              <div className="flex items-center self-start mt-1.5 space-x-1">
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={props.isLoading}
                  title={isRecording ? "Parar Gravação" : "Gravar Comando de Voz"}
                  className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 focus:ring-sky-400 disabled:opacity-50 ${isRecording ? 'bg-red-500/80 text-white animate-pulse' : 'text-slate-400 hover:bg-slate-600'}`}
                >
                  <i className="fa-solid fa-microphone w-4 h-4"></i>
                </button>
                 <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={props.isLoading}
                  title="Anexar Arquivos"
                  className="p-2 text-slate-400 hover:bg-slate-600 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 focus:ring-sky-400 disabled:opacity-50"
                >
                  <i className="fa-solid fa-paperclip w-4 h-4"></i>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*,application/pdf" className="hidden" />
                <button
                  type="submit"
                  disabled={props.isLoading || (!prompt.trim() && attachments.length === 0)}
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-slate-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-150 ease-in-out flex items-center gap-1.5 text-sm"
                >
                  <i className="fa-solid fa-paper-plane w-4 h-4"></i>
                </button>
              </div>
            </div>
            {attachments.length > 0 && (
              <div className="px-3 pb-2 flex flex-wrap gap-2 border-t border-slate-600/50 pt-2">
                {attachments.map(att => (
                  <div key={att.id} className="bg-slate-600 rounded-full pl-2 pr-1 py-1 flex items-center gap-2 text-xs text-slate-200 animate-fade-in-up">
                    {att.preview === 'pdf' ? <i className="fa-solid fa-file-pdf text-red-400"></i> : att.preview === 'file' ? <i className="fa-solid fa-file"></i> : <img src={att.preview} alt={att.name} className="w-5 h-5 rounded-sm object-cover" />}
                    <span className="truncate max-w-[120px]">{att.name}</span>
                    <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="w-4 h-4 bg-slate-500 hover:bg-red-500 rounded-full text-white flex items-center justify-center transition-colors">
                      <i className="fa-solid fa-times fa-xs"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {props.autoCritiqueResult && !props.isLoading ? (
            <button 
              onClick={props.onApplyCritiqueRefinement}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 flex items-center gap-1.5"
              style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i> Aplicar Melhorias da IA
            </button>
        ) : props.projectPlan && !props.isLoading ? (
          <div className="flex items-center gap-2">
             <span className="text-xs font-semibold text-slate-300">Plano:</span>
            <button 
              onClick={() => handleAiSubmit(undefined, 'GENERATE_CODE_FROM_PLAN')}
              disabled={props.isLoading}
              className="px-2.5 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-slate-500 disabled:opacity-70 flex items-center gap-1.5"
            >
              <i className="fa-solid fa-bolt"></i> Gerar Código
            </button>
             <button 
              onClick={() => handleAiSubmit(undefined, 'REFINE_PLAN')}
              disabled={props.isLoading || !prompt.trim()}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-500 disabled:opacity-70 flex items-center gap-1.5"
            >
              <i className="fa-solid fa-lightbulb"></i> Refinar Plano
            </button>
          </div>
        ) : null}

        {props.isLoadingCritique && (
            <div className="flex items-center gap-1.5 text-xs text-amber-300">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Avaliando...</span>
            </div>
        )}



        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sistema Anti-Simulação Toggle */}
          <button
            onClick={() => setUseAntiSimulation(!useAntiSimulation)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
              useAntiSimulation 
                ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500' 
                : 'bg-slate-600 hover:bg-slate-500 text-slate-200 focus:ring-slate-400'
            }`}
            title={useAntiSimulation ? 'Sistema Anti-Simulação ATIVO - Gera código 100% funcional' : 'Sistema Anti-Simulação INATIVO - Modo tradicional'}
          >
            <i className={`fa-solid fa-shield-halved ${useAntiSimulation ? 'text-white' : 'text-slate-300'}`}></i>
            <span>Anti-Simulação</span>
            <div className={`w-2 h-2 rounded-full ${useAntiSimulation ? 'bg-green-300' : 'bg-slate-400'}`}></div>
          </button>

          {/* Modo FullStack Toggle */}
          <button
            onClick={() => setForceFullStack(!forceFullStack)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
              forceFullStack 
                ? 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500' 
                : 'bg-slate-600 hover:bg-slate-500 text-slate-200 focus:ring-slate-400'
            }`}
            title={forceFullStack ? 'MODO FULLSTACK ATIVO - Frontend→Backend com streaming' : 'Modo FullStack INATIVO - Geração normal'}
          >
            <i className={`fa-solid fa-layer-group ${forceFullStack ? 'text-white' : 'text-slate-300'}`}></i>
            <span>FullStack</span>
            <div className={`w-2 h-2 rounded-full ${forceFullStack ? 'bg-purple-300' : 'bg-slate-400'}`}></div>
          </button>

          {/* Arquiteta Única Toggle */}
          <button
            onClick={() => setArquitetaUnica(!arquitetaUnica)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
              arquitetaUnica 
                ? 'bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500' 
                : 'bg-slate-600 hover:bg-slate-500 text-slate-200 focus:ring-slate-400'
            }`}
            title={arquitetaUnica ? 'ARQUITETA ÚNICA ATIVA - 2 arquivos: index.js + index.html' : 'Arquiteta Única INATIVA - Modo normal'}
          >
            <i className={`fa-solid fa-cube ${arquitetaUnica ? 'text-white' : 'text-slate-300'}`}></i>
            <span>Arquiteta</span>
            <div className={`w-2 h-2 rounded-full ${arquitetaUnica ? 'bg-orange-300' : 'bg-slate-400'}`}></div>
          </button>

          {/* Artesão de Mundos 3D Toggle */}
          <button
            onClick={() => setArtesaoMundos(!artesaoMundos)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
              artesaoMundos 
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-500' 
                : 'bg-slate-600 hover:bg-slate-500 text-slate-200 focus:ring-slate-400'
            }`}
            title={artesaoMundos ? 'ARTESÃO DE MUNDOS ATIVO - Jogos 3D com Three.js + WebGL' : 'Artesão de Mundos INATIVO - Modo normal'}
          >
            <i className={`fa-solid fa-gamepad ${artesaoMundos ? 'text-white' : 'text-slate-300'}`}></i>
            <span>Artesão</span>
            <div className={`w-2 h-2 rounded-full ${artesaoMundos ? 'bg-cyan-300' : 'bg-slate-400'}`}></div>
          </button>

          {/* 🚀 SELETOR DE MODO DE GERAÇÃO (Single Shot / Enterprise) */}
          <GenerationModeToggle />

          {/* Geração Separada Frontend/Backend */}
          <Dropdown buttonIcon="fa-solid fa-layer-group" buttonText="Frontend/Backend">
            <DropdownItem 
              onClick={() => {
                if (prompt.trim()) {
                  props.onGenerateFrontendOnly?.(prompt);
                  setPrompt('');
                }
              }} 
              disabled={!prompt.trim() || props.isLoading}
              iconClass="fa-solid fa-palette" 
              text="Gerar Apenas Frontend" 
            />
            <DropdownItem 
              onClick={() => {
                if (prompt.trim()) {
                  props.onGenerateBackendOnly?.(prompt);
                  setPrompt('');
                }
              }} 
              disabled={!prompt.trim() || props.isLoading}
              iconClass="fa-solid fa-server" 
              text="Gerar Apenas Backend" 
            />
            <hr className="border-slate-600 my-1"/>
            <DropdownItem 
              onClick={props.onConnectFrontendBackend} 
              disabled={!props.hasSeparatedCodes || props.isLoading}
              iconClass="fa-solid fa-link" 
              text="Conectar Frontend + Backend" 
            />
            <DropdownItem 
              onClick={props.onSaveFrontendCode} 
              disabled={!props.frontendCode}
              iconClass="fa-solid fa-save" 
              text="Salvar Frontend" 
            />
            <DropdownItem 
              onClick={props.onSaveBackendCode} 
              disabled={!props.backendCode}
              iconClass="fa-solid fa-save" 
              text="Salvar Backend" 
            />
          </Dropdown>

          <Dropdown buttonIcon="fa-solid fa-bars" buttonText="Arquivo">
            <DropdownItem onClick={props.onResetProject} iconClass="fa-solid fa-file" text="Novo Projeto" />
            <DropdownItem onClick={props.onOpenTechStackSelector} iconClass="fa-solid fa-layer-group" text="Stack de Tecnologia" />
            <hr className="border-slate-600 my-1"/>
            <DropdownItem onClick={props.onSaveWipProject} iconClass="fa-solid fa-save" text="Salvar Trabalho" />
            <DropdownItem onClick={props.onOpenSnapshotsModal} iconClass="fa-solid fa-layer-group" text="Snapshots (Local)" />
            <DropdownItem onClick={props.onUndoLastAiOperation} disabled={!props.canUndoLastAiOperation} iconClass="fa-solid fa-rotate-left" text="Desfazer Operação IA" />
            <hr className="border-slate-600 my-1"/>
            <DropdownItem onClick={props.onExportProject} disabled={!props.canExportProject} iconClass="fa-solid fa-file-zipper" text="Exportar como .zip" />
            <DropdownItem 
              onClick={async () => {
                if (!props.canExportProject) return;
                try {
                  // Importar dinamicamente
                  const { androidWebViewGenerator } = await import('@/services/AndroidWebViewGenerator');
                  const { mobileAppDetector } = await import('@/services/MobileAppDetector');
                  
                  // Pegar HTML do editor
                  const htmlContent = (window as any).globalEditorRef?.current?.getValue() || '';
                  if (!htmlContent) {
                    alert('Nenhum código para exportar');
                    return;
                  }
                  
                  // Detectar nome do app
                  const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i);
                  const appName = titleMatch ? titleMatch[1] : 'MeuApp';
                  
                  // Gerar package name
                  const packageName = `com.app.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
                  
                  // Configurar projeto
                  const config = {
                    appName,
                    packageName,
                    versionName: '1.0.0',
                    versionCode: 1,
                    minSdk: 24,
                    targetSdk: 34,
                    htmlContent,
                    enableJavaScript: true,
                    enableGeolocation: false,
                    enableCamera: false,
                    orientation: 'sensor' as const,
                    fullscreen: false
                  };
                  
                  // Gerar e baixar
                  const project = await androidWebViewGenerator.generateAndroidProject(config);
                  await androidWebViewGenerator.exportAsZip(project, appName);
                  
                  alert(`✅ Projeto Android "${appName}" exportado com sucesso!\n\n📱 Abra o arquivo ZIP no Android Studio para compilar.`);
                } catch (error) {
                  console.error('Erro ao exportar Android:', error);
                  alert('Erro ao exportar projeto Android. Veja o console para detalhes.');
                }
              }} 
              disabled={!props.canExportProject} 
              iconClass="fa-brands fa-android" 
              text="Exportar Android (.zip)" 
            />
             {props.hasInitScript && (
              <DropdownItem onClick={props.onCopyInitScript} iconClass="fa-solid fa-terminal" text="Copiar Script Init" />
            )}
          </Dropdown>

           <Dropdown buttonIcon="fa-solid fa-wrench" buttonText="Ferramentas IA">
              <DropdownItem onClick={props.onOpenBrainstormingModal} iconClass="fa-solid fa-lightbulb" text="Brainstorming IA" />
              <DropdownItem onClick={props.onOpenThemeCustomizerModal} iconClass="fa-solid fa-palette" text="Customizador de Tema" />
              <DropdownItem onClick={props.handleRequestSiteCritique} disabled={!props.canRequestSiteCritique} iconClass="fa-solid fa-magnifying-glass-chart" text="Crítica de Site IA" />
              <DropdownItem onClick={props.onOpenAiCodeInsightModal} disabled={!props.hasEditorSelection} iconClass="fa-solid fa-wand-magic-sparkles" text="Code Insight IA" />
              <DropdownItem onClick={props.onRequestTestSuggestions} disabled={!props.canRequestTestSuggestions} iconClass="fa-solid fa-vial-circle-check" text="Sugerir Testes" />
              <DropdownItem onClick={props.onOpenAiCodeDoctorModal} disabled={!props.canRequestAiCodeDoctor} iconClass="fa-solid fa-user-doctor" text="Depurador IA" />
              <hr className="border-slate-600 my-1"/>
              <DropdownItem onClick={() => setIsApiKeysModalOpen(true)} iconClass="fa-solid fa-key" text="🔑 Gerenciar API Keys" />
           </Dropdown>

           <Dropdown
              buttonIcon="fa-solid fa-microchip"
              buttonText={selectedModel?.name.split(' (')[0] || 'Modelo'}
              disabled={props.isLoading}
            >
              {props.textModelOptions.map(model => (
                <DropdownItem
                  key={model.id}
                  onClick={() => props.onSelectedTextModelChange(model.id)}
                  iconClass={props.selectedTextModel === model.id ? 'fa-solid fa-check-circle text-sky-400' : 'fa-regular fa-circle text-slate-400'}
                  text={model.name}
                  disabled={props.isLoading}
                />
              ))}
            </Dropdown>

            {/* AI Specialist Selector */}
            {props.activeAiSpecialist && props.onAiSpecialistChange && (
              <CompactAISelector
                activeSpecialist={props.activeAiSpecialist}
                onSpecialistChange={props.onAiSpecialistChange}
                isLoading={props.isLoading}
              />
            )}
           
          {/* Standalone Buttons */}
          <div className="flex items-center gap-2">
            {/* Status de Uso da API */}
            <UsageStatus onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)} />
            
            {/* Botão de teste temporário */}
            <button
              onClick={() => {
                console.log('🧪 Teste: Abrindo modal de API Key');
                setIsApiKeyModalOpen(true);
              }}
              className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-md hover:bg-yellow-700 transition-colors"
              title="Teste: Abrir modal API Key"
            >
              🔑 Teste
            </button>
            <button 
              onClick={props.onSwitchToChat} 
              title="Mudar para Modo Chat IA" 
              className="px-2.5 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 focus:ring-sky-400 flex items-center gap-1.5"
            >
               <i className="fa-solid fa-comments"></i>
               <span className="hidden sm:inline">Chat</span>
            </button>
            <button 
              onClick={props.onOpenTaskManager} 
              title="Gerenciador de Tarefas" 
              className="px-2.5 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 focus:ring-sky-400 flex items-center gap-1.5"
            >
               <i className="fa-solid fa-list-check"></i>
            </button>
            <button 
              onClick={props.onOpenEvolutionTracker} 
              title="Evolução do Projeto" 
              className="px-2.5 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 focus:ring-sky-400 flex items-center gap-1.5"
            >
               <i className="fa-solid fa-route"></i>
            </button>
             <button 
              onClick={props.onToggleConsole} 
              title="Alternar Console do Preview" 
              className="px-2.5 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 focus:ring-sky-400 flex items-center gap-1.5 relative"
            >
               <i className="fa-solid fa-terminal"></i>
               {props.consoleErrorCount > 0 && (
                 <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-slate-800">{props.consoleErrorCount > 9 ? '9+' : props.consoleErrorCount}</span>
               )}
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-400 mt-1 truncate">
        {props.statusMessage}
      </div>

      {/* Modal de API Key */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => {
          setIsApiKeyModalOpen(false);
          setShowLimitReached(false);
        }}
        onKeyAdded={() => {
          // Atualizar interface após adicionar chave
          setShowLimitReached(false);
        }}
        showLimitReached={showLimitReached}
      />

      {/* Modal de Gerenciamento de API Keys */}
      <ApiKeysManagerModal
        isOpen={isApiKeysModalOpen}
        onClose={() => setIsApiKeysModalOpen(false)}
      />
    </div>
  );
};