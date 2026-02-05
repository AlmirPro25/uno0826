import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore, initialHtmlBase, textModelOptions } from '../store/useAppStore';
import { generateAiResponseStream } from '../services/GeminiService';
import { AttachmentFile } from '../types/global';
import { ModalOrchestrator } from '../components/ModalOrchestrator';
import { PanelOrchestrator } from '../components/PanelOrchestrator';
import { UniversalScoringSystem } from '../services/UniversalScoringSystem';
import { CommandBar } from '../components/CommandBar';
import { ResponsiveLayout } from '../components/ResponsiveLayout';
import { MobileCommandBarOptimized } from '../components/MobileCommandBarOptimized';
import { ResponsiveEditor } from '../components/ResponsiveEditor';
import { ResponsivePreview } from '../components/ResponsivePreview';
import { v4 as uuidv4 } from 'uuid';
import { marked } from 'marked';
import { HtmlPreview } from '../components/HtmlPreview';
import { HtmlEditor } from '../components/HtmlEditor';
import { useMobileDetection } from '../hooks/useMobileDetection';
import ContextualAiPanel from '../components/ContextualAiPanel';
import EvolutionTracker, { type EvolutionStep } from '../components/EvolutionTracker';
import ModelPlaygroundModal from '../components/ModelPlaygroundModal';
import BrainstormingModal from '../components/BrainstormingModal';
import ThemeCustomizerModal from '../components/ThemeCustomizerModal';
import ProjectTaskManager from '../components/ProjectTaskManager';
import { TechStackSelector } from '../components/TechStackSelector';
import { ColorPaletteSelector } from '../components/ColorPaletteSelector';
import SiteCriticModal from '../components/SiteCriticModal';
import ProjectSnapshotsModal from '../components/ProjectSnapshotsModal';
import AiCodeInsightModal from '../components/AiCodeInsightModal';
import AiErrorFallbackModal from '../components/AiErrorFallbackModal';
import TestSuggestionModal from '../components/TestSuggestionModal';
import { Spinner } from '@/components/Spinner';
import AiCodeDoctorModal from '@/components/AiCodeDoctorModal';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { PersonaSelector } from '@/components/PersonaSelector';
import { FloatingStatusIndicator } from '@/components/FloatingStatusIndicator';
import { ChatView } from '@/components/ChatView';
import GroundingSourcesDisplay from '@/components/GroundingSourcesDisplay';
import PreviewConsole, { type ConsoleMessage } from '@/components/PreviewConsole';
import AiResearchPanel from '@/components/AiResearchPanel';
import AIThinkingOverlay from '@/components/AIThinkingOverlay';
import { MiniPipelineIndicator, useMiniPipeline } from '../components/MiniPipelineIndicator';
import { useCanvasGodView } from '../hooks/useCanvasGodView';
import type { editor } from 'monaco-editor';
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import { JSX } from 'react';

import { backendTerminalService } from './services/BackendTerminalService';

// New Component: AutoCritiquePanel (inlined to avoid creating new files)
interface AutoCritiquePanelProps {
  critique: string;
  isLoading: boolean;
  onClose: () => void;
}

// 📊 COMPONENTE DE PONTUAÇÃO INTELIGENTE
interface ScorePanelProps {
  score: {
    performance: number;
    accessibility: number;
    responsiveness: number;
    codeQuality: number;
    userExperience: number;
    totalScore: number;
    improvements: string[];
    metrics: any;
  } | null;
  onClose: () => void;
}

const ScorePanel: React.FC<ScorePanelProps> = ({ score, onClose }) => {
  if (!score) return null;

  const getScoreColor = (value: number) => {
    if (value >= 90) return 'text-green-500';
    if (value >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreEmoji = (value: number) => {
    if (value >= 90) return '🚀';
    if (value >= 70) return '⚡';
    return '🔧';
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4 shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          📊 Pontuação de Qualidade
          <span className={`text-2xl font-bold ${getScoreColor(score.totalScore)}`}>
            {score.totalScore}/100 {getScoreEmoji(score.totalScore)}
          </span>
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl font-bold">×</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="text-center">
          <div className={`text-xl font-bold ${getScoreColor(score.performance)}`}>{score.performance}</div>
          <div className="text-xs text-gray-600">🚀 Performance</div>
        </div>
        <div className="text-center">
          <div className={`text-xl font-bold ${getScoreColor(score.accessibility)}`}>{score.accessibility}</div>
          <div className="text-xs text-gray-600">♿ Acessibilidade</div>
        </div>
        <div className="text-center">
          <div className={`text-xl font-bold ${getScoreColor(score.responsiveness)}`}>{score.responsiveness}</div>
          <div className="text-xs text-gray-600">📱 Responsivo</div>
        </div>
        <div className="text-center">
          <div className={`text-xl font-bold ${getScoreColor(score.codeQuality)}`}>{score.codeQuality}</div>
          <div className="text-xs text-gray-600">🧹 Qualidade</div>
        </div>
        <div className="text-center">
          <div className={`text-xl font-bold ${getScoreColor(score.userExperience)}`}>{score.userExperience}</div>
          <div className="text-xs text-gray-600">🎨 UX/UI</div>
        </div>
      </div>

      {score.improvements.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <h4 className="font-semibold text-green-800 mb-2">✅ Melhorias Aplicadas:</h4>
          <div className="flex flex-wrap gap-1">
            {score.improvements.map((improvement, index) => (
              <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                {improvement}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AutoCritiquePanel: React.FC<AutoCritiquePanelProps> = ({ critique, isLoading, onClose }) => {
  const getHtmlCritique = () => {
    if (!critique) return '';
    try {
      const dirtyHtml = marked.parse(critique) as string;
      return dirtyHtml.replace(/<a href/g, '<a target="_blank" rel="noopener noreferrer" href');
    } catch (error) {
      console.error("Error parsing Markdown for critique:", error);
      return "<p>Erro ao renderizar a crítica.</p>";
    }
  };

  return (
    <div className="mx-2 my-1 p-3 bg-slate-800/90 backdrop-blur-sm border-t-4 border-amber-500 rounded-b-lg shadow-lg animate-fade-in-up" role="region" aria-labelledby="auto-critique-panel-title">
      <div className="flex justify-between items-center mb-2">
        <h3 id="auto-critique-panel-title" className="text-md font-semibold text-amber-300 flex items-center gap-2">
          <i className="fa-solid fa-microscope"></i>
          Auto-Avaliação da IA
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-amber-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
          aria-label="Ocultar painel de auto-avaliação"
        >
          <i className="fa-solid fa-times w-4 h-4"></i>
        </button>
      </div>

      <div className="prose prose-sm prose-invert max-w-none 
                         prose-headings:text-amber-300 prose-strong:text-slate-200 
                         prose-a:text-sky-400 hover:prose-a:text-sky-300
                         prose-code:text-rose-300 prose-code:bg-slate-900/50 prose-code:p-0.5 prose-code:rounded-sm prose-code:font-mono
                         prose-li:marker:text-amber-400 max-h-48 overflow-y-auto scrollbar-thin pr-2"
        dangerouslySetInnerHTML={{ __html: getHtmlCritique() }}
      />

      {isLoading && (
        <div className="text-xs text-amber-400 italic animate-pulse mt-2">
          IA está gerando uma nova avaliação...
        </div>
      )}

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};


export const App = (): JSX.Element => {
  // Pull state and actions from the Zustand store
  const store = useAppStore();

  // Mobile detection
  const { isMobile, isTablet, orientation } = useMobileDetection();

  // 🌟 THREE-PHASE PIPELINE - Mini indicador discreto
  const miniPipeline = useMiniPipeline();

  // 👁️ GOD VIEW - Visualização da colméia trabalhando
  const godView = useCanvasGodView();

  // 🌟 Detecta se o projeto é complexo e deve usar 3 fases
  const detectComplexProject = useCallback((prompt: string): boolean => {
    const complexKeywords = [
      'fintech', 'banco', 'bank', 'pagamento', 'payment', 'pix',
      'e-commerce', 'ecommerce', 'loja', 'marketplace', 'carrinho',
      'saas', 'enterprise', 'completo', 'complete', 'sistema completo',
      'fullstack', 'full-stack', 'full stack',
      'dashboard', 'admin', 'painel', 'crm', 'erp',
      'autenticação', 'authentication', 'login', 'cadastro',
      'api rest', 'backend', 'frontend e backend'
    ];
    const promptLower = prompt.toLowerCase();
    return complexKeywords.some(k => promptLower.includes(k));
  }, []);

  // Funções auxiliares para status específicos
  const startBackendGeneration = () => {
    setDetailedStatus('Backend', 'Inicialização', 'Analisando requisitos do backend...', 0, 30);
  };

  const startFrontendGeneration = () => {
    setDetailedStatus('Frontend', 'Inicialização', 'Projetando interface do usuário...', 0, 25);
  };
  const {
    // Destructure state needed for rendering
    appMode, htmlCode, isLoadingAi, isPreviewFullscreen, projectPlan, projectPlanSources,
    currentAppPhase, aiStatusMessage, selectedTextModel, loggedInteractions,
    currentInteractionUserFeedback, tasks, canUndoLastAiOperation, projectSnapshots,
    hasEditorSelection, isResearchPanelOpen, researchFindings, consoleErrorCount,
    // Streaming state
    isCodeStreaming, streamingEditorId, streamingAutoScroll, streamingSpeed,
    // Detailed status
    detailedStatus,
    isConsoleOpen, consoleMessages, isContextualAiPanelOpen, contextualAiTargetElementInfo,
    contextualAiCommand, contextualAiError, isLoadingContextualAi, contextualAiPanelPosition, contextualQuickActions,
    contextualAiAnalysisResults, isLoadingContextualAiAnalysis, isEvolutionTrackerOpen, evolutionTrackerProgress,
    isModelPlaygroundOpen, playgroundPrompt, baseModelPlaygroundOutput, finetunedModelPlaygroundOutput,
    isPlaygroundGenerating, isBrainstormingModalOpen, brainstormingTopic, brainstormingMode,
    brainstormingResults, isBrainstormingLoading, isThemeModalOpen, currentThemeDescription,
    currentThemeColors, isSuggestingColors, isApplyingTheme, isTaskManagerOpen,
    isSiteCriticModalOpen, siteCritiqueResults, isLoadingSiteCritique, isSnapshotsModalOpen,
    isAiCodeInsightModalOpen, selectedCodeForInsight, aiInsightResult, isLoadingAiInsight,
    currentInsightType, selectedCodeLanguageHint, isAiErrorFallbackModalOpen, lastFailedOperationDetails,
    isTestSuggestionModalOpen, testSuggestions, isLoadingTestSuggestions, isAiCodeDoctorModalOpen,
    aiCodeDoctorAnalysisResult, isLoadingAiCodeDoctor, aiCodeDoctorProblemRef, isApiKeyModalOpen,
    autoCritiqueResult, isLoadingCritique, currentScore,
    // Advanced Research & Color System
    designResearch, isColorPaletteSelectorOpen, selectedColorPalette,
    // Chat state
    handleToggleTask, handleRemoveTask, openSiteCriticModal, closeSiteCriticModal,
    openAiCodeInsightModal, closeAiCodeInsightModal, handleRequestCodeExplanation,
    handleRequestRefactoringSuggestion, openTestSuggestionModal, closeTestSuggestionModal,
    openAiCodeDoctorModal, closeAiCodeDoctorModal, setAiCodeDoctorProblem,
    handleAiCodeDoctorSubmit, triggerFallbackModal, closeAiErrorFallbackModal,
    openApiKeyModal, closeApiKeyModal,
    handleApplyCritiqueRefinement,
    // Advanced Research & Color System actions
    selectColorPalette, closeColorPaletteSelector, continueWithSelectedPalette, performAdvancedResearchAndShowPalettes,
    switchToChatMode, switchToEditorMode, handleNewChat, handleSelectChat, handleDeleteChat,
    handleRenameChat, handleSendMessage, setActiveChatFile, handleFileContentChange,
    executeTerminalCommand,
    // Streaming actions
    startCodeStreaming, stopCodeStreaming, setStreamingAutoScroll, setStreamingSpeed,
    // Status actions
    setDetailedStatus, clearDetailedStatus, updateStatusProgress,
    editorInteractionState, setEditorInteractionState,
    activeAiSpecialist, setActiveAiSpecialist,
    // Missing functions
    init, setHtmlCode, setAppMode, handleAiCommand, handleAiCommandWithAntiSimulation,
    handleFetchUrl, handleFinalizeInteraction, saveWipProject, handleExportProject,
    handleSaveSnapshot, handleContextualAiSubmit, handleApplyThemeColors,
    setSelectedTextModel, handleResetProject, handleLikeInteraction, handleDislikeInteraction,
    openContextualAiPanel, setConsoleMessages, setConsoleErrorCount, toggleConsole,
    setIsPreviewFullscreen, openBrainstormingModal, openThemeModal, openTaskManager,
    handleUndoLastAiOperation, openSnapshotsModal, toggleEvolutionTracker,
    generateFrontendOnly, generateBackendOnly, connectFrontendBackend,
    saveFrontendCode, saveBackendCode, frontendCode, backendCode,
    isGeneratingFrontend, isGeneratingBackend, isConnectingFrontendBackend,
    isGeneratingChatResponse, isTerminalBusy,
    chats, activeChatId, projectFiles, activeChatFile, handleAnalyzeElementWithAi,
    handleGenerateBrainstormIdeas, closeContextualAiPanel, setContextualAiCommand,
    handleContextualQuickAction, closeBrainstormingModal, setBrainstormingTopic,
    setBrainstormingMode, closeThemeModal, setCurrentThemeDescription, setCurrentThemeColors,
    handleSuggestThemeColors, closeTaskManager, handleAddTask, closeSnapshotsModal,
    handleLoadSnapshot, handleDeleteSnapshot, handleRenameSnapshot,
    // Multi-editor states (temporariamente desabilitado)
    // editorTabs, activeEditorId, isNewEditorModalOpen, isCreatingEditor,
    // createEditorTab, closeEditorTab, setActiveEditor, renameEditorTab,
    // reorderEditorTabs, updateEditorContent, markEditorDirty,
    // openNewEditorModal, closeNewEditorModal,
    isAiSpecialistPanelVisible, toggleAiSpecialistPanel,
    isAiThinkingVisible, toggleAiThinking,
    // Tech Stack Modal
    isTechStackModalOpen, openTechStackModal, closeTechStackModal, selectTechStack,
    // 🎭 Sistema de Personas
    availablePersonas, selectedPersona, isPersonaSelectorOpen, recommendedPersona, isGeneratingWithPersona,
    loadAvailablePersonas, selectPersona, togglePersonaSelector, generateWithSelectedPersona,
    recommendPersonaForCurrentPrompt, clearPersonaRecommendation
  } = store;

  // Refs remain in the component as they are tied to the DOM
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const debounceTimeoutRef = useRef<number | null>(null);

  // 🎭 Estado local para tipo de geração
  const [selectedGenerationType, setSelectedGenerationType] = useState<'fullstack' | 'frontend' | 'backend' | 'persona'>('fullstack');

  // Tech Stack Selector state agora vem do store

  // Granular UI state management - preparando para multi-editor
  const isAiGenerating = isLoadingAi || currentAppPhase === 'PERFORMING_RESEARCH';
  const isEditorBlocked = false; // 🚀 NUNCA BLOQUEAR O EDITOR - Manter dopamina dos usuários!
  const isUiDisabled = isLoadingContextualAi || isBrainstormingLoading ||
    isSuggestingColors || isApplyingTheme || isLoadingContextualAiAnalysis ||
    isLoadingSiteCritique || isLoadingAiInsight ||
    isLoadingTestSuggestions || isLoadingAiCodeDoctor || (isGeneratingChatResponse || false) ||
    (isTerminalBusy || false) || isLoadingCritique ||
    currentAppPhase === 'EXPORTING_PROJECT' || currentAppPhase === 'MANAGING_SNAPSHOTS' ||
    currentAppPhase === 'AI_FALLBACK_OPTIONS' ||
    currentAppPhase === 'SUGGESTING_TESTS' || currentAppPhase === 'AI_DEBUGGING';

  // Initialize store from localStorage on mount
  useEffect(() => {
    init();
  }, [init]);

  // 🎯 ATIVAR SISTEMA UNIVERSAL DE PONTUAÇÃO
  useEffect(() => {
    const activateUniversalScoring = async () => {
      try {
        // Ativar sistema de pontuação universal automaticamente
        console.log('🎯 Ativando Sistema Universal de Pontuação...');

        // Interceptar gerações de código para aplicar pontuação automática
        const originalHandleAiCommand = store.handleAiCommand;
        if (originalHandleAiCommand) {
          store.handleAiCommand = async (...args) => {
            const result = await originalHandleAiCommand.apply(store, args);

            // Aplicar pontuação após geração
            setTimeout(async () => {
              const currentCode = store.htmlCode;
              if (currentCode && currentCode.length > 100) {
                const score = await UniversalScoringSystem.evaluateCodeAfterGeneration(
                  currentCode,
                  'universal-mode'
                );
                const correctedCode = await UniversalScoringSystem.autoCorrectIfNeeded(
                  currentCode,
                  score
                );

                if (correctedCode !== currentCode) {
                  store.setHtmlCode(correctedCode);
                }
              }
            }, 500);

            return result;
          };
        }

        console.log('✅ Sistema Universal de Pontuação ativado com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao ativar Sistema Universal de Pontuação:', error);
      }
    };

    activateUniversalScoring();
  }, []);

  // Sincronização com multi-editor temporariamente desabilitada
  // useEffect(() => {
  //   const activeTab = editorTabs.find(tab => tab.id === activeEditorId);
  //   if (activeTab) {
  //     if (activeTab.content !== htmlCode && htmlCode !== initialHtmlBase) {
  //       updateEditorContent(activeTab.id, htmlCode);
  //     }
  //     else if (activeTab.content !== htmlCode) {
  //       setHtmlCode(activeTab.content);
  //     }
  //   }
  // }, [activeEditorId, editorTabs, htmlCode, setHtmlCode, updateEditorContent, initialHtmlBase]);

  const handleEditorDidMount = useCallback((editorInstance: editor.IStandaloneCodeEditor, monacoInstance: typeof monacoEditor) => {
    editorRef.current = editorInstance;

    // Criar referência global para o streaming
    (window as any).globalEditorRef = editorRef;
  }, []);

  const handleEditorCursorPositionChange = useCallback((lineContent: string | null) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = window.setTimeout(() => {
      if (previewIframeRef.current && lineContent) {
        const dataAidMatch = lineContent.match(/data-aid=["']([^"']+)["']/);
        if (dataAidMatch && dataAidMatch[1]) {
          previewIframeRef.current.contentWindow?.postMessage({
            source: 'ai-web-weaver-editor',
            type: 'highlightElement',
            dataAid: dataAidMatch[1]
          }, '*');
        }
      }
    }, 300);
  }, []);

  // Effect for handling messages from the preview iframe (clicks, console logs)
  useEffect(() => {
    const handleMessageFromPreview = (event: MessageEvent) => {
      if (event.data?.source !== 'ai-web-weaver-preview') return;

      if (event.data.type === 'elementClicked') {
        const { dataAid, tagName, outerHTML, clickX, clickY, iframeBoundingRect } = event.data;
        if (isUiDisabled) return;
        const position = iframeBoundingRect ? { top: iframeBoundingRect.top + clickY + 20, left: iframeBoundingRect.left + clickX + 20 } : null; // Simplified position logic
        openContextualAiPanel({ dataAid, tagName, outerHTML }, position);
      } else if (event.data.type === 'console') {
        const newMessage: ConsoleMessage = { ...event.data, id: uuidv4() };
        setConsoleMessages([...consoleMessages.slice(-100), newMessage]);
        if (newMessage.level === 'error') {
          setConsoleErrorCount(consoleErrorCount + 1);
          if (!isConsoleOpen) toggleConsole();
        }
      }
    };
    window.addEventListener('message', handleMessageFromPreview);
    return () => window.removeEventListener('message', handleMessageFromPreview);
  }, [isUiDisabled, openContextualAiPanel, consoleMessages, isConsoleOpen, consoleErrorCount, setConsoleMessages, setConsoleErrorCount, toggleConsole]);


  // Effect to check API key on mount
  useEffect(() => {
    // Importação dinâmica para evitar problemas de SSR
    import('../services/ApiKeyManager').then(({ ApiKeyManager }) => {
      const apiKey = ApiKeyManager.getKeyToUse();
      if (!apiKey) {
        console.warn("Chave da API Gemini não está configurada. Configure VITE_GEMINI_API_KEY no arquivo .env ou use o botão 'API Key' para configurar.");
        useAppStore.setState({ aiStatusMessage: "⚠️ API Key não configurada. Clique no botão 'API Key' para configurar." });
      }
    }).catch(error => {
      console.error('Erro ao carregar ApiKeyManager:', error);
    });
  }, []);

  const canFinalize = (currentAppPhase === 'CODE_GENERATED' || currentAppPhase === 'IDLE' || currentAppPhase === 'SUGGESTING_TESTS' || currentAppPhase === 'AI_DEBUGGING') && !isLoadingAi;
  const canRate = canFinalize;

  const handleCopyCode = () => {
    if (editorRef.current) {
      navigator.clipboard.writeText(editorRef.current.getValue());
      useAppStore.setState({ aiStatusMessage: 'Código copiado!' });
    }
  };

  const hasInitScript = useMemo(() => {
    if (!htmlCode) return false;
    return /<script [^>]*id=["']init-script-sh["'][^>]*>/i.test(htmlCode);
  }, [htmlCode]);

  const handleSwitchToChat = () => switchToChatMode(editorRef.current?.getValue() || htmlCode);
  const handleSwitchToEditor = () => {
    const reconstructedHtml = switchToEditorMode();
    setHtmlCode(reconstructedHtml);
    if (editorRef.current) {
      editorRef.current.setValue(reconstructedHtml);
    }
  };

  const handleCommandBarSend = async (prompt: string, attachments?: any[], action?: any, forceFullStack?: boolean, arquitetaUnica?: boolean, artesaoMundos?: boolean) => {
    // 🌟 DETECTAR SE DEVE USAR PIPELINE DE 3 FASES
    const isComplexProject = detectComplexProject(prompt);
    // 🌟 Pipeline só aparece quando código começa a ser gerado (após pesquisa)
    // A ativação será feita pelo GeminiService quando iniciar a geração de código
    if (isComplexProject && !action && (htmlCode === initialHtmlBase || !htmlCode.trim())) {
      console.log('🌟 Projeto complexo detectado! Pipeline será ativado na geração de código...');
      // miniPipeline será ativado pelo callback do GeminiService
    }

    // 🎭 VERIFICAR SE DEVE USAR PERSONA
    if (selectedGenerationType === 'persona') {
      if (!selectedPersona) {
        // Recomendar persona baseada no prompt
        recommendPersonaForCurrentPrompt(prompt);
        togglePersonaSelector();
        return;
      }

      // Gerar com a persona selecionada
      generateWithSelectedPersona(prompt, editorRef.current?.getValue() || htmlCode);
      return;
    }

    // 📱 DETECÇÃO AUTOMÁTICA DE APP MOBILE (integrada ao fluxo)
    let enhancedPrompt = prompt;
    if (!action && !projectPlan && (htmlCode === initialHtmlBase || !htmlCode.trim())) {
      try {
        const { mobileAppDetector } = await import('../services/MobileAppDetector');
        const intent = mobileAppDetector.detectMobileIntent(prompt);

        if (intent.isMobileApp && intent.confidence >= 70) {
          console.log('📱 App mobile detectado automaticamente!', intent);

          // Aprimorar prompt com requisitos mobile
          enhancedPrompt = `
🎯 APLICATIVO MOBILE ANDROID (WebView)

📱 App: ${intent.suggestedName}
📦 Package: ${intent.suggestedPackage}

🎨 REQUISITOS MOBILE OBRIGATÓRIOS:
- Design 100% responsivo e otimizado para telas pequenas (320px+)
- Interface touch-friendly (botões grandes 44px+, espaçamento adequado)
- Navegação mobile (bottom navigation ou drawer)
- Feedback visual para interações (ripple effects, animações)
- Suporte a gestos (swipe, long press, pull-to-refresh)
- Meta tags viewport configuradas
- Cores vibrantes e modernas
- Ícones grandes e claros (24px+)

🔌 FUNCIONALIDADES NATIVAS ANDROID:
- window.AndroidInterface.showToast(message) - Notificações toast
- window.AndroidInterface.vibrate(duration) - Vibração do dispositivo
- window.AndroidInterface.shareText(text) - Compartilhamento nativo

📐 LAYOUT MOBILE:
- Viewport: width=device-width, initial-scale=1.0, maximum-scale=1.0
- Orientação: Portrait (vertical) otimizado
- Safe areas para notch/barra de status
- Bottom navigation fixo ou floating action button
- Scroll suave e natural

🎨 DESIGN SYSTEM MOBILE:
- Material Design 3 ou iOS-like
- Cores primária e secundária bem definidas
- Tipografia legível (16px+ para texto, 14px+ para labels)
- Espaçamento consistente (8px grid system)
- Sombras e elevações sutis
- Bordas arredondadas (8px-16px)

⚡ PERFORMANCE MOBILE:
- HTML/CSS/JS otimizado e minificado
- Imagens responsivas e comprimidas
- Animações suaves (60fps, usar transform e opacity)
- Carregamento rápido (<3s)
- Funciona 100% offline

📱 PROMPT ORIGINAL:
${prompt}
`;

          console.log('✨ Prompt aprimorado para mobile:', enhancedPrompt);
        }
      } catch (error) {
        console.error('❌ Erro ao detectar app mobile:', error);
      }
    }

    // 🚨 PESQUISA DE PALETAS - SEMPRE para novos projetos quando Anti-Simulação está OFF
    // Anti-Simulação OFF = usuário quer controle manual = mostrar pesquisa + paletas
    const isNewProject = !projectPlan && !action;
    const isInitialCode = htmlCode === initialHtmlBase || !htmlCode.trim();

    if (isNewProject) {
      console.log('🎨 Anti-Simulação OFF + Novo projeto = Iniciando pesquisa de paletas...');
      // Resetar código para garantir fluxo limpo
      if (!isInitialCode) {
        console.log('🔄 Resetando código anterior para novo projeto...');
        setHtmlCode(initialHtmlBase);
      }
      performAdvancedResearchAndShowPalettes(enhancedPrompt);
      return;
    }

    // 🎯 SE JÁ EXISTE CÓDIGO E TEM PLANO, CONTINUAR EVOLUINDO
    if (htmlCode.trim() && !action && projectPlan) {
      handleAiCommand(enhancedPrompt, htmlCode, attachments, undefined, forceFullStack, arquitetaUnica, artesaoMundos);
      return;
    }

    // Detectar tipo de operação baseado no prompt
    const promptLower = enhancedPrompt.toLowerCase();

    if (promptLower.includes('backend') || promptLower.includes('api') || promptLower.includes('servidor') || promptLower.includes('banco de dados')) {
      startBackendGeneration();
    } else if (promptLower.includes('frontend') || promptLower.includes('interface') || promptLower.includes('ui') || promptLower.includes('componente')) {
      startFrontendGeneration();
    } else {
      setDetailedStatus('Geração de Código', 'Processamento', 'Analisando solicitação...', 10, 20);
    }

    handleAiCommand(enhancedPrompt, editorRef.current?.getValue() || htmlCode, attachments, action, forceFullStack, arquitetaUnica, artesaoMundos);
  };

  const handleCommandBarSendWithAntiSimulation = (prompt: string, attachments?: any[], action?: any, forceFullStack?: boolean, arquitetaUnica?: boolean, artesaoMundos?: boolean) => {
    // Usar sistema anti-simulação
    handleAiCommandWithAntiSimulation(prompt, editorRef.current?.getValue() || htmlCode, attachments, action, forceFullStack, arquitetaUnica, artesaoMundos);
  };
  const handleFetchUrlCommand = (url: string) => {
    handleFetchUrl(url, editorRef.current?.getValue() || htmlCode);
  }
  const handleFinalize = () => {
    clearDetailedStatus();
    handleFinalizeInteraction(editorRef.current?.getValue() || htmlCode);
  };
  const handleSaveWip = () => saveWipProject(editorRef.current?.getValue() || htmlCode);
  const handleExport = () => handleExportProject(editorRef.current?.getValue() || htmlCode);
  const handleSaveSnap = (name: string, desc?: string) => handleSaveSnapshot(name, desc, editorRef.current?.getValue() || htmlCode);
  const handleSiteCritique = () => {
    setDetailedStatus('Análise de Site', 'Crítica', 'Analisando qualidade do código...', 25, 15);
    openSiteCriticModal(editorRef.current?.getValue() || htmlCode);
  };
  const handleCodeInsight = () => {
    const selection = editorRef.current?.getSelection();
    const model = editorRef.current?.getModel();
    if (selection && !selection.isEmpty() && model) {
      const text = model.getValueInRange(selection);
      openAiCodeInsightModal(text, model.getLanguageId());
    }
  };
  const handleTestSuggestions = () => openTestSuggestionModal(editorRef.current?.getValue() || htmlCode);
  const handleOpenCodeDoctor = (problem?: string) => openAiCodeDoctorModal(problem);
  const handleSubmitContextual = async () => {
    const newCode = await handleContextualAiSubmit(editorRef.current?.getValue() || htmlCode);
    if (newCode) {
      setHtmlCode(newCode);
      if (editorRef.current) editorRef.current.setValue(newCode);
    }
  };

  const handleSelectTechStack = async (stack: any, specialist: any, fullStack?: { frontend: string | null; backend: string | null; styling: string | null }, projectName?: string) => {
    console.log('Stack selecionada:', stack, 'Especialista:', specialist, 'FullStack:', fullStack, 'ProjectName:', projectName);

    // Montar descrição da stack completa para feedback
    let stackDescription = '';
    if (fullStack) {
      const parts = [];
      if (fullStack.frontend) parts.push(`Frontend: ${fullStack.frontend}`);
      if (fullStack.backend) parts.push(`Backend: ${fullStack.backend}`);
      if (fullStack.styling) parts.push(`CSS: ${fullStack.styling}`);
      stackDescription = parts.join(' + ');
    }

    // Chamar a função original do store (cria aba no editor)
    selectTechStack(stack, specialist, fullStack);
    setActiveAiSpecialist(specialist);

    // 🏭 FACTORY TRIGGER: Se tiver FullStack/ProjectName, chama a fábrica real
    if (fullStack) {
      useAppStore.setState({
        aiStatusMessage: `🏭 Fábrica Ativada: Iniciando CLI para criar ${projectName || 'projeto'}...`,
        isLoadingAi: true,
        currentAppPhase: 'GENERATING_CODE_FROM_PLAN'
      });

      try {
        // Disparar comando para o backend
        await backendTerminalService.generateApp({
          prompt: `Projeto ${stackDescription}`,
          projectName: projectName || `project-${Date.now()}`,
          fullStack
        });

        useAppStore.setState({
          aiStatusMessage: `✅ Projeto criado no disco! Verifique o console para output da CLI.`,
          isLoadingAi: false,
          currentAppPhase: 'CODE_GENERATED'
        });
      } catch (error) {
        console.error('Erro na fábrica:', error);
        useAppStore.setState({
          aiStatusMessage: `❌ Erro na fábrica de software: ${error instanceof Error ? error.message : 'Falha desconhecida'}`,
          isLoadingAi: false,
          currentAppPhase: 'AI_ERROR_STATE'
        });
      }
    } else {
      // Feedback visual simples se for só seleção de template
      useAppStore.setState({
        aiStatusMessage: `✅ Template carregado: ${stackDescription || stack}.`,
        currentAppPhase: 'IDLE'
      });

      setTimeout(() => {
        useAppStore.setState({ aiStatusMessage: null });
      }, 4000);
    }
  };

  const handleOpenTechStackSelector = () => {
    openTechStackModal();
  };

  const handleApplyTheme = async () => {
    const newCode = await handleApplyThemeColors(editorRef.current?.getValue() || htmlCode);
    if (newCode) {
      setHtmlCode(newCode);
      if (editorRef.current) editorRef.current.setValue(newCode);
    }
  };


  return (
    <>
      <style>{`
        /* Interface refinements - selective blocking */
        .ui-disabled .command-bar-actions {
          pointer-events: none;
          opacity: 0.6;
        }
        
        .ai-generating .editor-content {
          /* Permite navegação mas bloqueia edição */
        }
        
        .ai-generating .editor-content .monaco-editor .view-lines {
          /* Mantém scroll e seleção funcionando */
          pointer-events: auto !important;
        }
        
        /* Research panel improvements */
        .research-panel-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          align-items: stretch;
        }
        
        .research-card {
          height: 180px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .research-card-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .text-sm { font-size: 0.75rem; }
          .text-xs { font-size: 0.625rem; }
          .p-1 { padding: 0.125rem; }
          .p-2 { padding: 0.25rem; }
          .gap-1 { gap: 0.125rem; }
        }
      `}</style>

      {/* 🌟 MINI PIPELINE INDICATOR - Aparece no topo quando gerando código */}
      {/* Será renderizado dentro do ResponsiveLayout, perto dos botões Desktop/Tablet/Mobile */}

      {appMode === 'editor' && (
        <ResponsiveLayout
          isPreviewFullscreen={isPreviewFullscreen}
          commandBar={
            (
              <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700 rounded-md">
                <CommandBar
                  appMode={appMode}
                  onModeChange={setAppMode}
                  onSwitchToChat={handleSwitchToChat}
                  onSend={handleCommandBarSend}
                  onSendWithAntiSimulation={handleCommandBarSendWithAntiSimulation}
                  onFetchUrl={handleFetchUrlCommand}
                  isLoading={isLoadingAi || isUiDisabled}
                  statusMessage={aiStatusMessage}
                  currentPhase={currentAppPhase}
                  projectPlan={projectPlan}
                  onOpenApiKeyModal={openApiKeyModal}
                  onCopyCode={handleCopyCode}
                  hasInitScript={hasInitScript}
                  onCopyInitScript={() => { }}
                  textModelOptions={textModelOptions}
                  selectedTextModel={selectedTextModel}
                  onSelectedTextModelChange={setSelectedTextModel}
                  onResetProject={handleResetProject}
                  onFinalizeInteraction={handleFinalize}
                  canFinalizeInteraction={canFinalize}
                  onLikeInteraction={handleLikeInteraction}
                  onDislikeInteraction={handleDislikeInteraction}
                  currentInteractionUserFeedback={currentInteractionUserFeedback}
                  canRateInteraction={canRate}
                  onOpenBrainstormingModal={openBrainstormingModal}
                  onOpenThemeCustomizerModal={openThemeModal}
                  onOpenTaskManager={openTaskManager}
                  handleRequestSiteCritique={handleSiteCritique}
                  canRequestSiteCritique={!!htmlCode && htmlCode !== initialHtmlBase}
                  onUndoLastAiOperation={handleUndoLastAiOperation}
                  canUndoLastAiOperation={canUndoLastAiOperation}
                  onSaveWipProject={handleSaveWip}
                  onExportProject={handleExport}
                  canExportProject={!!htmlCode && htmlCode !== initialHtmlBase}
                  onOpenSnapshotsModal={openSnapshotsModal}
                  onOpenEvolutionTracker={toggleEvolutionTracker}
                  onOpenAiCodeInsightModal={handleCodeInsight}
                  hasEditorSelection={hasEditorSelection}
                  onOpenAssetLibrary={() => alert("Biblioteca de Ativos (em breve!)")}
                  onShareProject={() => alert("Compartilhar Projeto (em breve!)")}
                  onRequestTestSuggestions={handleTestSuggestions}
                  canRequestTestSuggestions={!!htmlCode && htmlCode !== initialHtmlBase}
                  onOpenAiCodeDoctorModal={() => handleOpenCodeDoctor()}
                  canRequestAiCodeDoctor={!!htmlCode && htmlCode !== initialHtmlBase}
                  onToggleConsole={toggleConsole}
                  consoleErrorCount={consoleErrorCount}
                  autoCritiqueResult={autoCritiqueResult}
                  onApplyCritiqueRefinement={handleApplyCritiqueRefinement}
                  isLoadingCritique={isLoadingCritique}
                  activeAiSpecialist={activeAiSpecialist}
                  onAiSpecialistChange={setActiveAiSpecialist}
                  onOpenTechStackSelector={handleOpenTechStackSelector}
                  onGenerateFrontendOnly={(prompt) => generateFrontendOnly(prompt, editorRef.current?.getValue() || htmlCode)}
                  onGenerateBackendOnly={(prompt) => generateBackendOnly(prompt, frontendCode || undefined)}
                  onConnectFrontendBackend={() => connectFrontendBackend('Conectar frontend e backend')}
                  onSaveFrontendCode={saveFrontendCode}
                  onSaveBackendCode={saveBackendCode}
                  frontendCode={frontendCode}
                  backendCode={backendCode}
                  hasSeparatedCodes={!!(frontendCode && backendCode)}
                  isGeneratingFrontend={isGeneratingFrontend}
                  isGeneratingBackend={isGeneratingBackend}
                  isConnectingFrontendBackend={isConnectingFrontendBackend}
                  selectedGenerationType={selectedGenerationType}
                  onGenerationTypeChange={setSelectedGenerationType}
                />
              </div>
            )
          }
          leftPanel={
            <div className="flex flex-col h-full">
              {/* 🟡 Painel Amarelo Unificado (Score + Avaliação) */}
              {autoCritiqueResult && (
                <AutoCritiquePanel
                  critique={autoCritiqueResult}
                  isLoading={isLoadingCritique}
                  onClose={() => useAppStore.setState({ autoCritiqueResult: null })}
                />
              )}

              {/* Editor */}
              <div className="flex-1 min-h-0">
                <ResponsiveEditor
                  htmlCode={htmlCode}
                  onHtmlCodeChange={setHtmlCode}
                  onEditorDidMount={handleEditorDidMount}
                  onCursorPositionChange={handleEditorCursorPositionChange}
                  isBlocked={isEditorBlocked}
                />
              </div>
            </div>
          }
          rightPanel={
            <ResponsivePreview
              htmlCode={htmlCode}
              isFullscreen={isPreviewFullscreen}
              onToggleFullscreen={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
              previewIframeRef={previewIframeRef}
              // 🌟 Pipeline de 3 Fases
              pipelineVisible={miniPipeline.isVisible}
              pipelinePhase={miniPipeline.currentPhase}
              pipelinePhases={miniPipeline.phases}
              onPipelineClick={() => console.log('Pipeline clicked - TODO: abrir detalhes')}
              // 👁️ God View - Colméia trabalhando em tempo real
              isGenerating={isLoadingAi || currentAppPhase === 'PERFORMING_RESEARCH'}
              showGodView={godView.isVisible}
              godViewPhase={godView.phase}
              godViewProgress={godView.progress}
              godViewStatus={godView.status}
              godViewAgents={godView.agents}
              godViewMessages={godView.messages}
              godViewArtifacts={godView.artifacts}
              onToggleGodView={godView.toggle}
            />
          }
        >
          {/* Overlays e Status */}
          {detailedStatus && isAiThinkingVisible && (
            <AIThinkingOverlay
              status={detailedStatus}
              onCancel={() => {
                clearDetailedStatus();
              }}
            />
          )}



          {/* Painel de Status Frontend/Backend */}
          {(frontendCode || backendCode || isGeneratingFrontend || isGeneratingBackend) && (
            <div className="mx-2 my-1 p-3 bg-slate-800/90 backdrop-blur-sm border-t-4 border-blue-500 rounded-b-lg shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-semibold text-blue-300 flex items-center gap-2">
                  <i className="fa-solid fa-layer-group"></i>
                  Frontend/Backend Separado
                </h3>
                <button
                  onClick={() => useAppStore.setState({ frontendCode: null, backendCode: null })}
                  className="p-1 text-slate-400 hover:text-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  title="Limpar códigos separados"
                >
                  <i className="fa-solid fa-times w-4 h-4"></i>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg border-2 ${frontendCode ? 'border-green-500 bg-green-500/10' : 'border-slate-600 bg-slate-700/50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fa-solid fa-palette text-green-400"></i>
                    <span className="font-medium text-green-300">Frontend</span>
                    {isGeneratingFrontend && <Spinner className="text-green-400" />}
                  </div>
                  <div className="text-xs text-slate-300">
                    {isGeneratingFrontend ? 'Gerando...' : frontendCode ? '✅ Pronto' : '⏳ Não gerado'}
                  </div>
                </div>

                <div className={`p-3 rounded-lg border-2 ${backendCode ? 'border-orange-500 bg-orange-500/10' : 'border-slate-600 bg-slate-700/50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fa-solid fa-server text-orange-400"></i>
                    <span className="font-medium text-orange-300">Backend</span>
                    {isGeneratingBackend && <Spinner className="text-orange-400" />}
                  </div>
                  <div className="text-xs text-slate-300">
                    {isGeneratingBackend ? 'Gerando...' : backendCode ? '✅ Pronto' : '⏳ Não gerado'}
                  </div>
                </div>
              </div>

              {frontendCode && backendCode && !isConnectingFrontendBackend && (
                <div className="mt-3 text-center">
                  <button
                    onClick={() => connectFrontendBackend('Conectar frontend e backend')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center gap-2 mx-auto"
                  >
                    <i className="fa-solid fa-link"></i>
                    Conectar Frontend + Backend
                  </button>
                </div>
              )}

              {isConnectingFrontendBackend && (
                <div className="mt-3 text-center text-blue-300 text-sm flex items-center justify-center gap-2">
                  <Spinner className="text-blue-300" />
                  Conectando automaticamente...
                </div>
              )}
            </div>
          )}
        </ResponsiveLayout>
      )}

      {/* Chat Mode */}
      {appMode === 'chat' && (
        <div className={`h-screen w-screen bg-slate-900 flex flex-col overflow-hidden text-sm text-slate-100 transition-all duration-300 ${isUiDisabled ? 'ui-disabled' : ''}`}>
          <ChatView
            chats={chats}
            activeChatId={activeChatId}
            isGeneratingResponse={isGeneratingChatResponse}
            projectFiles={projectFiles}
            activeFile={activeChatFile}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
            onRenameChat={handleRenameChat}
            onSendMessage={handleSendMessage}
            onSwitchToEditor={handleSwitchToEditor}
            onSelectFile={setActiveChatFile}
            onFileContentChange={handleFileContentChange}
          />
        </div>
      )}

      {/* All Modals and Overlays */}
      {projectPlanSources && (
        <GroundingSourcesDisplay sources={projectPlanSources} />
      )}

      {isConsoleOpen && (
        <PreviewConsole
          messages={consoleMessages}
          onClose={toggleConsole}
          onClear={() => setConsoleMessages([])}
        />
      )}

      {isResearchPanelOpen && (
        <AiResearchPanel
          findings={researchFindings}
          onClose={() => useAppStore.setState({ isResearchPanelOpen: false })}
        />
      )}

      {isContextualAiPanelOpen && contextualAiTargetElementInfo && (
        <ContextualAiPanel
          targetElementInfo={contextualAiTargetElementInfo}
          command={contextualAiCommand}
          isLoading={isLoadingContextualAi}
          position={contextualAiPanelPosition}
          quickActions={contextualQuickActions}
          analysisResults={contextualAiAnalysisResults}
          isLoadingAnalysis={isLoadingContextualAiAnalysis}
          onClose={closeContextualAiPanel}
          onCommandChange={setContextualAiCommand}
          onQuickAction={handleContextualQuickAction}
          onSubmit={handleSubmitContextual}
          onAnalyzeElement={handleAnalyzeElementWithAi}
        />
      )}

      {isEvolutionTrackerOpen && (
        <EvolutionTracker
          progress={evolutionTrackerProgress}
          onClose={toggleEvolutionTracker}
        />
      )}

      {isModelPlaygroundOpen && (
        <ModelPlaygroundModal
          prompt={playgroundPrompt}
          baseModelOutput={baseModelPlaygroundOutput}
          finetunedModelOutput={finetunedModelPlaygroundOutput}
          isGenerating={isPlaygroundGenerating}
          onClose={() => useAppStore.setState({ isModelPlaygroundOpen: false })}
          onPromptChange={(prompt) => useAppStore.setState({ playgroundPrompt: prompt })}
          onGenerate={() => { }}
        />
      )}

      {isBrainstormingModalOpen && (
        <BrainstormingModal
          topic={brainstormingTopic}
          mode={brainstormingMode}
          results={brainstormingResults}
          isLoading={isBrainstormingLoading}
          onClose={closeBrainstormingModal}
          onTopicChange={setBrainstormingTopic}
          onModeChange={setBrainstormingMode}
          onGenerate={handleGenerateBrainstormIdeas}
        />
      )}

      {isThemeModalOpen && (
        <ThemeCustomizerModal
          description={currentThemeDescription}
          colors={currentThemeColors}
          isSuggestingColors={isSuggestingColors}
          isApplyingTheme={isApplyingTheme}
          onClose={closeThemeModal}
          onDescriptionChange={setCurrentThemeDescription}
          onColorsChange={setCurrentThemeColors}
          onSuggestColors={handleSuggestThemeColors}
          onApplyTheme={handleApplyTheme}
        />
      )}

      {isTaskManagerOpen && (
        <ProjectTaskManager
          tasks={tasks}
          onClose={closeTaskManager}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onRemoveTask={handleRemoveTask}
        />
      )}

      {isSiteCriticModalOpen && (
        <SiteCriticModal
          results={siteCritiqueResults}
          isLoading={isLoadingSiteCritique}
          onClose={closeSiteCriticModal}
        />
      )}

      {isSnapshotsModalOpen && (
        <ProjectSnapshotsModal
          snapshots={projectSnapshots}
          onClose={closeSnapshotsModal}
          onSave={handleSaveSnap}
          onLoad={handleLoadSnapshot}
          onDelete={handleDeleteSnapshot}
          onRename={handleRenameSnapshot}
        />
      )}

      {isAiCodeInsightModalOpen && (
        <AiCodeInsightModal
          selectedCode={selectedCodeForInsight}
          result={aiInsightResult}
          isLoading={isLoadingAiInsight}
          currentInsightType={currentInsightType}
          languageHint={selectedCodeLanguageHint}
          onClose={closeAiCodeInsightModal}
          onRequestExplanation={handleRequestCodeExplanation}
          onRequestRefactoring={handleRequestRefactoringSuggestion}
        />
      )}

      {isAiErrorFallbackModalOpen && (
        <AiErrorFallbackModal
          failedOperationDetails={lastFailedOperationDetails}
          onClose={closeAiErrorFallbackModal}
          onRetry={() => { }}
          onFallback={() => { }}
        />
      )}

      {isTestSuggestionModalOpen && (
        <TestSuggestionModal
          suggestions={testSuggestions}
          isLoading={isLoadingTestSuggestions}
          onClose={closeTestSuggestionModal}
        />
      )}

      {isAiCodeDoctorModalOpen && (
        <AiCodeDoctorModal
          analysisResult={aiCodeDoctorAnalysisResult}
          isLoading={isLoadingAiCodeDoctor}
          problemRef={aiCodeDoctorProblemRef}
          onClose={closeAiCodeDoctorModal}
          onProblemChange={setAiCodeDoctorProblem}
          onSubmit={handleAiCodeDoctorSubmit}
        />
      )}

      {/* Tech Stack Selector removido - usando o de baixo */}

      {/* Color Palette Selector */}
      {isColorPaletteSelectorOpen && designResearch && (
        <ColorPaletteSelector
          palettes={designResearch.colorPalettes}
          selectedPaletteId={selectedColorPalette?.id || null}
          onPaletteSelect={(paletteId) => {
            const palette = designResearch.colorPalettes.find(p => p.id === paletteId);
            if (palette) selectColorPalette(palette);
          }}
          onContinue={continueWithSelectedPalette}
        />
      )}

      {/* 🟡 Painel Amarelo Unificado Mobile (Score + Avaliação) */}
      {autoCritiqueResult && (
        <AutoCritiquePanel
          critique={autoCritiqueResult}
          isLoading={isLoadingCritique}
          onClose={() => useAppStore.setState({ autoCritiqueResult: null })}
        />
      )}

      {/* Painel de Status Frontend/Backend */}
      {(frontendCode || backendCode || isGeneratingFrontend || isGeneratingBackend) && (
        <div className="mx-2 my-1 p-3 bg-slate-800/90 backdrop-blur-sm border-t-4 border-blue-500 rounded-b-lg shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-semibold text-blue-300 flex items-center gap-2">
              <i className="fa-solid fa-layer-group"></i>
              Frontend/Backend Separado
            </h3>
            <button
              onClick={() => useAppStore.setState({ frontendCode: null, backendCode: null })}
              className="p-1 text-slate-400 hover:text-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              title="Limpar códigos separados"
            >
              <i className="fa-solid fa-times w-4 h-4"></i>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Frontend Status */}
            <div className={`p-3 rounded-lg border-2 ${frontendCode ? 'border-green-500 bg-green-500/10' : 'border-slate-600 bg-slate-700/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <i className="fa-solid fa-palette text-green-400"></i>
                <span className="font-medium text-green-300">Frontend</span>
                {isGeneratingFrontend && <Spinner className="text-green-400" />}
              </div>
              <div className="text-xs text-slate-300">
                {isGeneratingFrontend ? 'Gerando...' : frontendCode ? '✅ Pronto' : '⏳ Não gerado'}
              </div>
            </div>

            {/* Backend Status */}
            <div className={`p-3 rounded-lg border-2 ${backendCode ? 'border-orange-500 bg-orange-500/10' : 'border-slate-600 bg-slate-700/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <i className="fa-solid fa-server text-orange-400"></i>
                <span className="font-medium text-orange-300">Backend</span>
                {isGeneratingBackend && <Spinner className="text-orange-400" />}
              </div>
              <div className="text-xs text-slate-300">
                {isGeneratingBackend ? 'Gerando...' : backendCode ? '✅ Pronto' : '⏳ Não gerado'}
              </div>
            </div>
          </div>

          {/* Botão de Conexão */}
          {frontendCode && backendCode && !isConnectingFrontendBackend && (
            <div className="mt-3 text-center">
              <button
                onClick={() => connectFrontendBackend('Conectar frontend e backend')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center gap-2 mx-auto"
              >
                <i className="fa-solid fa-link"></i>
                Conectar Frontend + Backend
              </button>
            </div>
          )}

          {isConnectingFrontendBackend && (
            <div className="mt-3 text-center text-blue-300 text-sm flex items-center justify-center gap-2">
              <Spinner className="text-blue-300" />
              Conectando automaticamente...
            </div>
          )}
        </div>
      )}



      {projectPlanSources && projectPlanSources.length > 0 && (
        <GroundingSourcesDisplay sources={projectPlanSources} onClose={() => useAppStore.setState({ projectPlanSources: null })} />
      )}

      {isResearchPanelOpen && (
        <AiResearchPanel
          findings={researchFindings}
          onClose={() => useAppStore.setState({ isResearchPanelOpen: false })}
        />
      )}







      {/* CSS global para estados de UI */}
      <style>{`
        /* Estados granulares de UI */
        .ui-disabled {
          pointer-events: none;
          opacity: 0.8;
        }
        
        .ai-generating {
          /* Permitir navegação durante geração de IA */
        }
        
        .ai-generating .monaco-editor {
          pointer-events: auto !important;
        }
        
        .ai-generating .monaco-scrollable-element {
          pointer-events: auto !important;
        }
        
        /* Permitir scroll e seleção mesmo quando UI está desabilitada */
        .ui-disabled .monaco-editor .monaco-scrollable-element,
        .ui-disabled .monaco-editor .view-lines,
        .ui-disabled .research-panel-grid {
          pointer-events: auto !important;
        }
        
        /* Manter funcionalidade do painel de pesquisa */
        .ui-disabled .research-panel-grid::-webkit-scrollbar-thumb {
          pointer-events: auto !important;
        }
      `}</style>

      {/* All modals now get their props and handlers from the store */}
      {isContextualAiPanelOpen && (
        <ContextualAiPanel
          isOpen={isContextualAiPanelOpen}
          targetElementInfo={contextualAiTargetElementInfo}
          command={contextualAiCommand}
          onCommandChange={setContextualAiCommand}
          onSubmit={handleSubmitContextual}
          onClose={closeContextualAiPanel}
          isLoadingCommand={isLoadingContextualAi}
          errorMessage={contextualAiError}
          position={contextualAiPanelPosition}
          quickActions={contextualQuickActions}
          onQuickActionSelect={handleContextualQuickAction}
          onAnalyze={() => handleAnalyzeElementWithAi(editorRef.current?.getValue() || htmlCode)}
          analysisResults={contextualAiAnalysisResults}
          isLoadingAnalysis={isLoadingContextualAiAnalysis}
        />
      )}
      {isBrainstormingModalOpen && (
        <BrainstormingModal
          isOpen={isBrainstormingModalOpen}
          onClose={closeBrainstormingModal}
          topic={brainstormingTopic}
          onTopicChange={setBrainstormingTopic}
          mode={brainstormingMode}
          onModeChange={setBrainstormingMode}
          results={brainstormingResults}
          onGenerate={handleGenerateBrainstormIdeas}
          isLoading={isBrainstormingLoading}
        />
      )}

      {isThemeModalOpen && (
        <ThemeCustomizerModal
          isOpen={isThemeModalOpen}
          onClose={closeThemeModal}
          themeDescription={currentThemeDescription}
          onThemeDescriptionChange={setCurrentThemeDescription}
          themeColors={currentThemeColors}
          onThemeColorChange={(name, value) => setCurrentThemeColors({ ...currentThemeColors, [name]: value })}
          onSuggestColors={handleSuggestThemeColors}
          onApplyTheme={handleApplyTheme}
          isSuggesting={isSuggestingColors}
          isApplying={isApplyingTheme}
        />
      )}

      {isTaskManagerOpen && (
        <ProjectTaskManager
          isOpen={isTaskManagerOpen}
          onClose={closeTaskManager}
          tasks={tasks}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onRemoveTask={handleRemoveTask}
        />
      )}

      {isSiteCriticModalOpen && (
        <SiteCriticModal
          isOpen={isSiteCriticModalOpen}
          onClose={closeSiteCriticModal}
          results={siteCritiqueResults}
          isLoading={isLoadingSiteCritique}
        />
      )}

      {isAiCodeInsightModalOpen && (
        <AiCodeInsightModal
          isOpen={isAiCodeInsightModalOpen}
          onClose={closeAiCodeInsightModal}
          selectedCode={selectedCodeForInsight}
          result={aiInsightResult}
          isLoading={isLoadingAiInsight}
          insightType={currentInsightType}
          languageHint={selectedCodeLanguageHint}
          onRequestExplanation={handleRequestCodeExplanation}
          onRequestRefactoring={handleRequestRefactoringSuggestion}
        />
      )}

      {isTestSuggestionModalOpen && (
        <TestSuggestionModal
          isOpen={isTestSuggestionModalOpen}
          onClose={closeTestSuggestionModal}
          suggestions={testSuggestions}
          isLoading={isLoadingTestSuggestions}
        />
      )}

      {isAiCodeDoctorModalOpen && (
        <AiCodeDoctorModal
          isOpen={isAiCodeDoctorModalOpen}
          onClose={closeAiCodeDoctorModal}
          onSubmitAnalysis={handleAiCodeDoctorSubmit}
          analysisResult={aiCodeDoctorAnalysisResult}
          isLoading={isLoadingAiCodeDoctor}
          initialProblemDescription={aiCodeDoctorProblemRef}
        />
      )}

      {/* API Key Configuration Modal */}
      {isApiKeyModalOpen && (
        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          onClose={closeApiKeyModal}
          onKeyAdded={() => {
            closeApiKeyModal();
            // Recarregar a página ou atualizar o estado para usar a nova chave
            window.location.reload();
          }}
          showLimitReached={true}
        />
      )}

      {/* 🎭 Seletor de Personas de IA */}
      <PersonaSelector
        isOpen={isPersonaSelectorOpen}
        onClose={togglePersonaSelector}
        onSelectPersona={selectPersona}
        selectedPersona={selectedPersona}
        recommendedPersona={recommendedPersona}
      />

      {/* Tech Stack Selector */}
      <TechStackSelector
        isOpen={isTechStackModalOpen}
        onClose={closeTechStackModal}
        onSelectStack={handleSelectTechStack}
      />

      {/* Color Palette Selector */}
      {isColorPaletteSelectorOpen && designResearch && (
        <ColorPaletteSelector
          palettes={designResearch.colorPalettes}
          selectedPaletteId={selectedColorPalette?.id || null}
          onPaletteSelect={(paletteId) => {
            const palette = designResearch.colorPalettes.find(p => p.id === paletteId);
            if (palette) selectColorPalette(palette);
          }}
          onContinue={continueWithSelectedPalette}
        />
      )}

      {/* 🚀 Indicador de Status Flutuante - Não Bloqueia o Editor! */}
      <FloatingStatusIndicator
        isVisible={isLoadingAi || isGeneratingWithPersona || isLoadingCritique}
        message={
          isGeneratingWithPersona && selectedPersona
            ? `🎭 ${selectedPersona.name} trabalhando...`
            : isLoadingCritique
              ? '🔬 Avaliando qualidade do código...'
              : aiStatusMessage || 'Processando...'
        }
        progress={detailedStatus?.progress}
        type={
          currentAppPhase === 'AI_ERROR_STATE' ? 'error' :
            currentAppPhase === 'CODE_GENERATED' ? 'success' :
              'loading'
        }
      />
    </>
  );
};
