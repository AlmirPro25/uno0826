
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { MediaCaptureModal } from './components/MediaCaptureModal';
import { LibraryView } from './components/LibraryView';
import { ProjectsView } from './components/ProjectsView';
import { Header } from './components/Header';
import { InteractiveCodeBlock } from './components/InteractiveCodeBlock';
import { LiveTranscriptOverlay } from './components/LiveTranscriptOverlay';
import { GenerationOptionsModal, AspectRatio } from './components/GenerationOptionsModal';
import { ModelSettingsModal } from './components/ModelSettingsModal';
import { LibraryItemModal } from './components/LibraryItemModal';
import { LibrarySelectorModal } from './components/LibrarySelectorModal';
import { MetaPersonaModal } from './components/MetaPersonaModal';
import { ImageGalleryView } from './components/ImageGalleryView';
import { ImageViewerModal } from './components/ImageViewerModal';
import { DocumentGeneratorView } from './components/DocumentGeneratorView';
import { WhatsAppBusinessPanel } from './components/WhatsAppBusinessPanel';
import { WhatsAppAdminPanel } from './components/WhatsAppAdminPanel';
import { SecurityView } from './components/SecurityView';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { BrowserResultCard } from './components/BrowserResultCard';
import { Message, GeminiModel, Persona, Chat, Attachment, Project, LibraryItem, GenerationConfig, LibraryItemType } from './types';
import { GEMINI_MODELS, PERSONAS, DEFAULT_GENERATION_CONFIG } from './constants';
import { sendMessageToGemini, sendMessageWithGrounding, generateOrEditImage, generateImageWithImagen, generateVideoWithVeo, transcribeAudio, generateSpeech, LiveSessionManager } from './services/geminiService';
import { detectTechnicalContext, TechnicalCodeValidator } from './services/neuralArchitectService';
import { browseAndExtract, createBrowserSession, closeBrowserSession } from './services/browserService';
import { extractUrl } from './services/browserIntegrationService';
import { searchMultipleEngines } from './services/multiSearchService';
import { detectNavigationTask, executeNavigationTask } from './services/navigationAgentService';
import { safeLocalStorage } from './utils/storage';
import { dbService } from './services/databaseService';
import { backupService } from './services/backupService';

type ActiveView = 'chat' | 'library' | 'projects' | 'gallery' | 'documents' | 'whatsapp' | 'admin' | 'security';
type Theme = 'light' | 'dark';
type InteractiveTab = 'preview' | 'code';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
    require?: any;
    monaco?: any;
  }
}

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentChatId, setCurrentChatId] = useState<string>(() => `chat_${Date.now()}`);
  const [selectedModel, setSelectedModel] = useState<GeminiModel>(GEMINI_MODELS[1]);
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>('chat');
  const [theme, setTheme] = useState<Theme>('dark');
  const [isThinkingMode, setIsThinkingMode] = useState<boolean>(false);
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);
  const [isBrowserMode, setIsBrowserMode] = useState<boolean>(false);
  const [showCanvas, setShowCanvas] = useState<boolean>(false);
  const [canvasContent, setCanvasContent] = useState<any>(null);
  const [browserSession, setBrowserSession] = useState<string | null>(null);
  const [liveConversationState, setLiveConversationState] = useState<'idle' | 'connecting' | 'active'>('idle');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [generationTask, setGenerationTask] = useState<{ prompt: string; attachments?: Attachment[] } | null>(null);
  const [activeInteractiveCode, setActiveInteractiveCode] = useState<{ messageId: string; description: string; htmlCode: string } | null>(null);
  const [interactiveTab, setInteractiveTab] = useState<InteractiveTab>('preview');
  
  // New state for Projects and Library
  const [projects, setProjects] = useState<Project[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // State for new features
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [generationConfig, setGenerationConfig] = useState<GenerationConfig>(DEFAULT_GENERATION_CONFIG);
  const [isLibraryItemModalOpen, setIsLibraryItemModalOpen] = useState(false);
  const [editingLibraryItem, setEditingLibraryItem] = useState<LibraryItem | null>(null);
  const [isLibrarySelectorOpen, setIsLibrarySelectorOpen] = useState(false);
  const [isMetaPersonaModalOpen, setIsMetaPersonaModalOpen] = useState(false);
  const [generatedPersonas, setGeneratedPersonas] = useState<Persona[]>([]);
  const [viewerImage, setViewerImage] = useState<{ image: Attachment; prompt: string } | null>(null);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const appendToPromptRef = useRef<(text: string) => void>(() => {});


  const stopStreamingRef = useRef<() => void>(() => {});
  const liveSessionManagerRef = useRef<LiveSessionManager | null>(null);
  const interactivePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('proxaistudio-theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      (window as any).applyTheme(savedTheme);
    }
    
    // Carregar dados do IndexedDB
    loadDataFromDB();
  }, []);

  // Parar áudio ao mudar de view
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [activeView]);

  const loadDataFromDB = async () => {
    try {
      // Garantir que o IndexedDB está inicializado
      await dbService.init();
      
      console.log('💾 Carregando dados do IndexedDB...');
      
      // Tentar carregar do IndexedDB primeiro
      const [dbChats, dbProjects, dbLibrary] = await Promise.all([
        dbService.getAllChats(),
        dbService.getAllProjects(),
        dbService.getAllLibraryItems()
      ]);
      
      console.log(`📊 Dados carregados: ${dbChats.length} chats, ${dbProjects.length} projetos, ${dbLibrary.length} itens`);

      if (dbChats.length > 0) {
        setChatHistory(dbChats as any);
      } else {
        // Fallback para localStorage se IndexedDB estiver vazio
        const localChats = safeLocalStorage.getItem('proxChatHistory', []);
        if (localChats.length > 0) {
          setChatHistory(localChats);
          // Migrar para IndexedDB
          localChats.forEach(chat => dbService.saveChat(chat));
        }
      }

      if (dbProjects.length > 0) {
        setProjects(dbProjects as any);
      } else {
        const localProjects = safeLocalStorage.getItem('proxProjects', []);
        if (localProjects.length > 0) {
          setProjects(localProjects);
          localProjects.forEach(project => dbService.saveProject(project));
        }
      }

      if (dbLibrary.length > 0) {
        setLibraryItems(dbLibrary as any);
      } else {
        const localLibrary = safeLocalStorage.getItem('proxLibrary', []);
        if (localLibrary.length > 0) {
          setLibraryItems(localLibrary);
          localLibrary.forEach(item => dbService.saveLibraryItem(item));
        }
      }

      // Carregar personas salvas
      const dbPersonas = await dbService.getAllPersonas();
      if (dbPersonas.length > 0) {
        setGeneratedPersonas(dbPersonas as any);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do IndexedDB:', error);
      // Fallback para localStorage
      setChatHistory(safeLocalStorage.getItem('proxChatHistory', []));
      setProjects(safeLocalStorage.getItem('proxProjects', []));
      setLibraryItems(safeLocalStorage.getItem('proxLibrary', []));
    }
  };

  useEffect(() => {
    // Salvar no IndexedDB (principal)
    saveDataToDB();
    
    // Manter localStorage como backup
    safeLocalStorage.setItem('proxChatHistory', chatHistory);
    safeLocalStorage.setItem('proxProjects', projects);
    safeLocalStorage.setItem('proxLibrary', libraryItems);
  }, [chatHistory, projects, libraryItems]);

  const saveDataToDB = async () => {
    try {
      // Garantir que o IndexedDB está pronto
      await dbService.init();
      
      // Salvar chats
      for (const chat of chatHistory) {
        await dbService.saveChat({
          ...chat,
          updatedAt: Date.now()
        });
      }
      
      // Salvar projetos
      for (const project of projects) {
        await dbService.saveProject({
          ...project,
          updatedAt: Date.now()
        });
      }
      
      // Salvar biblioteca
      for (const item of libraryItems) {
        await dbService.saveLibraryItem({
          ...item,
          updatedAt: Date.now()
        });
      }
      
      console.log('✅ Dados salvos no IndexedDB');
    } catch (error) {
      console.error('❌ Erro ao salvar no IndexedDB:', error);
      // Tentar novamente após 1 segundo
      setTimeout(() => saveDataToDB(), 1000);
    }
  };
  
  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('proxaistudio-theme', newTheme);
    (window as any).applyTheme(newTheme);
  };

  const handleShowInteractiveCode = (message: Message) => {
    if (message.isInteractive && message.htmlCode) {
      setActiveInteractiveCode({
        messageId: message.id,
        description: message.content,
        htmlCode: message.htmlCode
      });
      setInteractiveTab('preview');
    }
  };

  const updateChatHistory = useCallback((finalMessages: Message[]) => {
    const firstUserMessage = finalMessages.find(m => m.role === 'user' && m.content);
    if (!firstUserMessage) return;

    const chatTitle = firstUserMessage.content.substring(0, 40) + (firstUserMessage.content.length > 40 ? '...' : '');
    
    // Project-specific chat history
    if (activeProjectId) {
      setProjects(prevProjects => prevProjects.map(p => {
        if (p.id === activeProjectId) {
          const chatIndex = p.chats.findIndex(c => c.id === currentChatId);
          if (chatIndex > -1) {
            p.chats[chatIndex] = { ...p.chats[chatIndex], messages: finalMessages, title: chatTitle, createdAt: Date.now(), generationConfig };
          } else {
            p.chats.push({ id: currentChatId, title: chatTitle, messages: finalMessages, createdAt: Date.now(), generationConfig });
          }
          p.chats.sort((a,b) => b.createdAt - a.createdAt);
        }
        return p;
      }));
    } else { // Global chat history
      setChatHistory(prev => {
        const existingChatIndex = prev.findIndex(c => c.id === currentChatId);
        if (existingChatIndex !== -1) {
          const updatedChat = { ...prev[existingChatIndex], messages: finalMessages, title: chatTitle, createdAt: Date.now(), generationConfig };
          return [updatedChat, ...prev.filter(c => c.id !== currentChatId)].sort((a, b) => b.createdAt - a.createdAt);
        } else {
          const newChat: Chat = { id: currentChatId, title: chatTitle, messages: finalMessages, createdAt: Date.now(), generationConfig };
          return [newChat, ...prev].sort((a, b) => b.createdAt - a.createdAt);
        }
      });
    }
  }, [currentChatId, activeProjectId, generationConfig]);


  // 🧠 NEURAL ARCHITECT: Validar código em respostas
  const validateCodeInResponse = (content: string) => {
    const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1];
      const code = match[2];
      
      const validation = TechnicalCodeValidator.validateCode(code, language);
      
      if (!validation.isValid || validation.suggestions.length > 0) {
        const report = TechnicalCodeValidator.generateQualityReport(code, language);
        console.log('🔍 Code Quality Report:\n', report);
        
        if (!validation.isValid) {
          console.warn(`⚠️ Código ${language} contém problemas:`, validation.issues);
        }
        if (validation.suggestions.length > 0) {
          console.info(`💡 Sugestões para ${language}:`, validation.suggestions);
        }
      }
    }
  };

  const executeSend = async (history: Message[]) => {
    if (isLoading) return;
    
    // 🔍 DETECÇÃO AUTOMÁTICA DE BUSCA EM MÚLTIPLOS BUSCADORES
    const lastMessage = history[history.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      const content = lastMessage.content.toLowerCase();
      
      // Palavras-chave de busca
      const searchKeywords = [
        'busque', 'buscar', 'procure', 'procurar', 
        'pesquise', 'pesquisar', 'encontre', 'encontrar',
        'search', 'find', 'look for', 'google'
      ];
      
      const isSearch = searchKeywords.some(keyword => content.includes(keyword));
      
      if (isSearch) {
        console.log('🔍 Busca detectada! Usando múltiplos buscadores...');
        
        // Extrair termo de busca
        let searchTerm = content;
        searchKeywords.forEach(keyword => {
          searchTerm = searchTerm.replace(new RegExp(keyword, 'gi'), '');
        });
        searchTerm = searchTerm
          .replace(/por|sobre|no|na|em|search|for|about|on|in/gi, '')
          .trim();
        
        // Usar busca em múltiplos buscadores
        await executeMultiSearch(searchTerm);
        return; // IMPORTANTE: Retornar aqui para não continuar com envio normal
      }
    }
    
    setIsLoading(true);
    
    const thinkingMessageId = `ai_${Date.now()}`;
    const abortController = new AbortController();
    stopStreamingRef.current = () => {
      abortController.abort();
      setIsLoading(false);
    };
    
    setMessages([...history, { id: thinkingMessageId, role: 'model', content: '', isLoading: true, isThinking: isThinkingMode }]);

    let fullJsonResponse = "";
    try {
        const stream = sendMessageToGemini(history, selectedModel, selectedPersona, isThinkingMode, generationConfig, abortController.signal);
        
        for await (const chunk of stream) {
            if (abortController.signal.aborted) break;
            fullJsonResponse += chunk;
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error('Error during Gemini API call:', error);
        setMessages([...history, { id: thinkingMessageId, role: 'model', content: '', error: errorMessage }]);
        setIsLoading(false);
        return;
    } 

    if (abortController.signal.aborted) {
        setMessages(prev => prev.map(m => m.id === thinkingMessageId ? {...m, isLoading: false, content: "*Geração interrompida.*"} : m));
        setIsLoading(false);
        return;
    }

    let finalAiMessage: Message;
    try {
        const parsedResponse = JSON.parse(fullJsonResponse);
        finalAiMessage = {
            id: thinkingMessageId,
            role: 'model',
            content: parsedResponse.response || "Sem conteúdo na resposta.",
            suggestedPrompts: parsedResponse.suggestions || [],
            isInteractive: parsedResponse.isInteractive || false,
            htmlCode: parsedResponse.htmlCode || undefined,
        };
        
        // 🧠 NEURAL ARCHITECT: Validar código automaticamente
        if (finalAiMessage.content.includes('```')) {
          validateCodeInResponse(finalAiMessage.content);
        }
        
        if (finalAiMessage.isInteractive && finalAiMessage.htmlCode) {
            handleShowInteractiveCode(finalAiMessage);
        }
    } catch (e) {
         console.error("Falha ao analisar a resposta JSON final:", fullJsonResponse);
         finalAiMessage = {
            id: thinkingMessageId, role: 'model', content: '',
            error: "Formato de resposta inválido recebido da API."
         };
    }
    
    const finalMessages = [...history, finalAiMessage];
    setMessages(finalMessages);
    updateChatHistory(finalMessages);
    setIsLoading(false);
  };
  
  // 🔍 BUSCA EM MÚLTIPLOS BUSCADORES (LINKS DIRETOS)
  const executeMultiSearch = async (query: string) => {
    if (isLoading) return;
    
    const userMessage: Message = { 
      id: `user_${Date.now()}`, 
      role: 'user', 
      content: query
    };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsLoading(true);

    const loadingMessageId = `ai_${Date.now()}`;
    
    setMessages([...newHistory, { 
      id: loadingMessageId, 
      role: 'model', 
      content: '🔍 **Gerando links de busca...**', 
      isLoading: true 
    }]);

    try {
      // Importar função de geração de links
      const { generateSearchLinks } = await import('./services/multiSearchService');
      
      // Gerar links de busca
      const searchLinks = generateSearchLinks(query);
      
      // Formatar resposta com links clicáveis
      let response = `✅ **Preparei ${searchLinks.length} buscadores para "${query}"**\n\n`;
      response += `🔍 Clique nos links abaixo para buscar:\n\n`;
      
      searchLinks.forEach((link, i) => {
        response += `**${i + 1}. ${link.source}**\n`;
        response += `   🔗 [Buscar no ${link.source}](${link.url})\n`;
        response += `   💡 ${link.source === 'Startpage' ? 'Usa resultados do Google!' : link.snippet}\n\n`;
      });
      
      response += `\n💡 **Dica:** Clique em qualquer link acima para abrir a busca em uma nova aba!\n`;
      response += `\n🎯 **Recomendado:** Comece pelo Startpage (resultados do Google sem bloqueio)`;
      
      const finalMessage: Message = {
        id: loadingMessageId,
        role: 'model',
        content: response,
      };

      const finalMessages = [...newHistory, finalMessage];
      setMessages(finalMessages);
      updateChatHistory(finalMessages);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao gerar links";
      console.error('Erro ao gerar links:', error);
      setMessages([...newHistory, { 
        id: loadingMessageId, 
        role: 'model', 
        content: `❌ **Erro ao gerar links de busca**\n\n${errorMessage}` 
      }]);
    }
    
    setIsLoading(false);
  };

  const executeSendWithGrounding = async (history: Message[], groundingTool: 'googleSearch' | 'googleMaps') => {
    if (isLoading) return;
    setIsLoading(true);
    
    const thinkingMessageId = `ai_${Date.now()}`;
    setMessages([...history, { id: thinkingMessageId, role: 'model', content: '', isLoading: true }]);

    try {
      const userLocation = null; // Could be enhanced with geolocation API
      const { content, sources } = await sendMessageWithGrounding(
        history,
        selectedModel,
        selectedPersona,
        groundingTool,
        userLocation
      );

      const finalAiMessage: Message = {
        id: thinkingMessageId,
        role: 'model',
        content: content || "Sem conteúdo na resposta.",
        sources: sources,
      };

      const finalMessages = [...history, finalAiMessage];
      setMessages(finalMessages);
      updateChatHistory(finalMessages);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error('Error during grounded API call:', error);
      setMessages([...history, { id: thinkingMessageId, role: 'model', content: '', error: errorMessage }]);
    }
    
    setIsLoading(false);
  };

  const handleImageEdit = async (prompt: string, attachments: Attachment[]) => {
    if (isLoading) return;
    setIsLoading(true);

    const userMessage: Message = { id: `user_${Date.now()}`, role: 'user', content: prompt, attachments };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);

    const thinkingMessageId = `ai_${Date.now()}`;
    setMessages([...newHistory, { id: thinkingMessageId, role: 'model', content: '', isLoading: true }]);

    try {
      const generatedImage = await generateOrEditImage(prompt, attachments, selectedModel.id);
      
      const finalAiMessage: Message = {
        id: thinkingMessageId,
        role: 'model',
        content: 'Imagem gerada com sucesso!',
        attachments: [generatedImage],
      };

      const finalMessages = [...newHistory, finalAiMessage];
      setMessages(finalMessages);
      updateChatHistory(finalMessages);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao gerar imagem";
      console.error('Error generating image:', error);
      setMessages([...newHistory, { id: thinkingMessageId, role: 'model', content: '', error: errorMessage }]);
    }

    setIsLoading(false);
  };

  const handleIntelligentNavigation = async (userIntent: string) => {
    const userMessage: Message = { 
      id: `user_${Date.now()}`, 
      role: 'user', 
      content: userIntent
    };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsLoading(true);

    const loadingMessageId = `ai_${Date.now()}`;
    
    setMessages([...newHistory, { 
      id: loadingMessageId, 
      role: 'model', 
      content: '🤖 **Agente de Navegação**\n\n🧠 Analisando comando...', 
      isLoading: true 
    }]);

    try {
      // 🤖 AGENTE INTELIGENTE - Detectar tarefa
      const task = detectNavigationTask(userIntent);
      
      if (task) {
        console.log('🤖 Tarefa detectada:', task.type);
        
        setMessages(prev => prev.map(m => 
          m.id === loadingMessageId 
            ? { ...m, content: `🤖 **Agente de Navegação**\n\n✅ Tarefa: ${task.type}\n🔄 Executando...` }
            : m
        ));

        // Executar tarefa
        const result = await executeNavigationTask(task);

        // Exibir resultado
        const resultMessage: Message = {
          id: loadingMessageId,
          role: 'model',
          content: `✅ **${result.message}**\n\n${result.success ? '🎉 Tarefa concluída!' : '❌ Erro na execução'}`,
          products: result.data?.products || result.data,
        };

        const finalMessages = [...newHistory, resultMessage];
        setMessages(finalMessages);
        updateChatHistory(finalMessages);
        setIsLoading(false);
        return;
      }

      // Se não detectou tarefa, continua com navegação normal
      setMessages(prev => prev.map(m => 
        m.id === loadingMessageId 
          ? { ...m, content: '🤖 **Navegação Inteligente**\n\n🧠 Analisando e gerando URLs...' }
          : m
      ));

      // Detecção rápida de sites conhecidos (antes do Gemini)
      const quickSites: { [key: string]: string } = {
        'g1': 'https://g1.globo.com/',
        'globo': 'https://www.globo.com/',
        'uol': 'https://www.uol.com.br/',
        'terra': 'https://www.terra.com.br/',
        'r7': 'https://www.r7.com/',
        'estadao': 'https://www.estadao.com.br/',
        'folha': 'https://www.folha.uol.com.br/',
        'youtube': 'https://www.youtube.com/',
        'github': 'https://github.com/',
        'stackoverflow': 'https://stackoverflow.com/',
        'reddit': 'https://www.reddit.com/',
        'wikipedia': 'https://pt.wikipedia.org/',
        'mercadolivre': 'https://www.mercadolivre.com.br/',
        'mercado livre': 'https://www.mercadolivre.com.br/',
        'olx': 'https://www.olx.com.br/',
        'amazon': 'https://www.amazon.com.br/',
      };

      // Verificar se é um comando direto para um site
      const lowerIntent = userIntent.toLowerCase();
      let quickUrl = null;
      
      for (const [keyword, url] of Object.entries(quickSites)) {
        if (lowerIntent.includes(keyword) && 
            (lowerIntent.includes('entra') || lowerIntent.includes('vai') || 
             lowerIntent.includes('abre') || lowerIntent.includes('acessa'))) {
          quickUrl = url;
          break;
        }
      }

      // Se encontrou URL rápida, usa direto
      if (quickUrl) {
        setMessages(prev => prev.map(m => 
          m.id === loadingMessageId 
            ? { ...m, content: `🤖 **Navegação Direta**\n\n🌐 Indo para: ${quickUrl}` }
            : m
        ));

        // Criar sessão se não existir
        if (!browserSession) {
          const session = await createBrowserSession();
          setBrowserSession(session.sessionId);
        }

        // Navegar direto
        const result = await browseAndExtract(quickUrl);

        // Atualizar Canvas
        setCanvasContent({
          url: result.navigation.url,
          title: result.content.title,
          liveUrl: result.navigation.url,
          screenshot: result.screenshot,
          content: result.content,
        });
        setShowCanvas(true);

        const successMessage: Message = {
          id: loadingMessageId,
          role: 'model',
          content: `✅ **Navegação Concluída!**\n\n🌐 **Site**: ${result.navigation.url}\n📄 **Página**: ${result.content.title}\n\n👉 **Veja o site funcionando no Canvas ao lado!**`,
        };

        const finalMessages = [...newHistory, successMessage];
        setMessages(finalMessages);
        updateChatHistory(finalMessages);
        setIsLoading(false);
        return;
      }

      // Se não encontrou URL rápida, usa Gemini
      setMessages(prev => prev.map(m => 
        m.id === loadingMessageId 
          ? { ...m, content: '🤖 **Navegação Inteligente**\n\n🧠 Gemini gerando URLs...' }
          : m
      ));

      const urlPrompt = `Você é PROX AI, um assistente de navegação inteligente.

Use CHAIN OF THOUGHT (CoT) - Pense passo a passo antes de decidir!

INTENÇÃO DO USUÁRIO:
"${userIntent}"

PASSO 1 - ANÁLISE DA INTENÇÃO:
Pense: O que o usuário REALMENTE quer?
- É uma busca geral? (use Startpage + DuckDuckGo)
- É e-commerce? (use lojas + buscadores)
- É informação específica? (use sites especializados)
- É notícia? (use portais + buscadores)

PASSO 2 - SELEÇÃO DE FONTES:
Pense: Quais são as MELHORES fontes para isso?
- Priorize sites que funcionam bem (Startpage, DuckDuckGo, Bing)
- Combine buscadores + sites específicos
- Gere 2-4 URLs para cobertura completa

PASSO 3 - DECISÃO:
Com base na análise, decida as URLs ideais.

REGRAS IMPORTANTES:
1. Se o usuário mencionar um SITE ESPECÍFICO (ex: "entra g1", "vai pro youtube", "abre github"), vá DIRETO para esse site
2. Se for uma BUSCA (ex: "busque por", "procure", "pesquise"), use site de busca apropriado
3. Priorize sites que funcionam bem em iframe
4. Retorne em formato JSON

SITES BRASILEIROS POPULARES:
- G1: https://g1.globo.com/ (notícias)
- UOL: https://www.uol.com.br/ (portal)
- Globo: https://www.globo.com/ (portal)
- Terra: https://www.terra.com.br/ (portal)
- R7: https://www.r7.com/ (notícias)
- Estadão: https://www.estadao.com.br/ (notícias)
- Folha: https://www.folha.uol.com.br/ (notícias)
- Mercado Livre: https://www.mercadolivre.com.br/
- OLX: https://www.olx.com.br/
- Americanas: https://www.americanas.com.br/

SITES INTERNACIONAIS:
- Wikipedia: https://pt.wikipedia.org/ (funciona bem)
- GitHub: https://github.com/ (funciona bem)
- Stack Overflow: https://stackoverflow.com/ (funciona bem)
- MDN: https://developer.mozilla.org/ (funciona bem)
- Reddit: https://www.reddit.com/ (funciona bem)
- Medium: https://medium.com/ (funciona bem)

SITES DE BUSCA QUE FUNCIONAM (em ordem de preferência):
1. DuckDuckGo: https://duckduckgo.com/?q= (rápido e confiável)
2. Startpage: https://www.startpage.com/do/search?q= (USA RESULTADOS DO GOOGLE sem bloqueio!)
3. Bing: https://www.bing.com/search?q= (muito bom)
4. Brave Search: https://search.brave.com/search?q= (privacidade)
5. Ecosia: https://www.ecosia.org/search?q= (sustentável)

IMPORTANTE PARA BUSCAS:
- NUNCA use Google diretamente (bloqueia Playwright)
- Para resultados do Google: use Startpage (proxy do Google que funciona!)
- Combine múltiplos buscadores: DuckDuckGo + Startpage + Bing
- Gere MÚLTIPLAS URLs (2-4) para pesquisas abrangentes
- Combine buscadores + sites específicos para resultados completos

ESTRATÉGIA RECOMENDADA:
Para buscas gerais, use esta combinação:
1. Startpage (resultados do Google)
2. DuckDuckGo (resultados independentes)
3. Site específico relacionado (Wikipedia, Stack Overflow, etc.)

EXEMPLOS DE INTERPRETAÇÃO:
- "entra g1" → https://g1.globo.com/
- "vai pro youtube" → https://www.youtube.com/
- "abre github" → https://github.com/
- "busque por Python" → [
    "https://www.startpage.com/do/search?q=Python",
    "https://www.bing.com/search?q=Python",
    "https://stackoverflow.com/search?q=Python"
  ]
- "notebooks Black Friday" → [
    "https://www.startpage.com/do/search?q=notebooks+black+friday",
    "https://www.mercadolivre.com.br/ofertas?q=notebooks",
    "https://www.amazon.com.br/s?k=notebooks"
  ]
- "notícias sobre tecnologia" → [
    "https://www.startpage.com/do/search?q=notícias+tecnologia",
    "https://g1.globo.com/tecnologia/",
    "https://www.bing.com/search?q=notícias+tecnologia"
  ]

FORMATO DE RESPOSTA (JSON):
{
  "urls": [
    {
      "url": "URL completa",
      "site": "Nome do site",
      "description": "O que buscar neste site"
    }
  ],
  "primaryUrl": "URL principal para navegar primeiro"
}

RESPONDA APENAS COM O JSON, SEM TEXTO ADICIONAL.`;

      // Criar mensagem temporária para o Gemini
      const tempMessage: Message = {
        id: `temp_${Date.now()}`,
        role: 'user',
        content: urlPrompt
      };

      let urlResponse = '';
      for await (const chunk of sendMessageToGemini([tempMessage], selectedModel, PERSONAS[0], false, DEFAULT_GENERATION_CONFIG)) {
        urlResponse += chunk;
      }
      
      // Extrair JSON da resposta
      const jsonMatch = urlResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Gemini não retornou JSON válido');
      }

      let urlData;
      try {
        urlData = JSON.parse(jsonMatch[0]);
      } catch (e) {
        throw new Error('Erro ao parsear JSON do Gemini');
      }

      // Validar estrutura do JSON
      if (!urlData || typeof urlData !== 'object') {
        throw new Error('JSON inválido retornado pelo Gemini');
      }

      // Extrair lista de URLs para navegar
      let urlsToVisit: string[] = [];
      
      if (urlData.urls && Array.isArray(urlData.urls) && urlData.urls.length > 0) {
        urlsToVisit = urlData.urls.map((u: any) => u.url).filter((url: string) => url);
      } else if (urlData.primaryUrl) {
        urlsToVisit = [urlData.primaryUrl];
      }

      // Se ainda não tem URLs, usar fallback
      if (urlsToVisit.length === 0) {
        const searchQuery = encodeURIComponent(userIntent.replace(/busque|procure|pesquise|encontre|por|sobre|no|na/gi, '').trim());
        urlsToVisit = [`https://www.startpage.com/do/search?q=${searchQuery}`];
        urlData = {
          urls: [{
            url: urlsToVisit[0],
            site: 'Startpage',
            description: `Buscar por: ${userIntent}`
          }],
          primaryUrl: urlsToVisit[0]
        };
      }

      // Limitar a 4 URLs para não demorar muito
      urlsToVisit = urlsToVisit.slice(0, 4);

      setMessages(prev => prev.map(m => 
        m.id === loadingMessageId 
          ? { ...m, content: `🤖 **Navegação Inteligente**\n\n✅ ${urlsToVisit.length} URLs geradas\n🌐 Navegando em múltiplos sites...` }
          : m
      ));

      // Criar sessão se não existir
      if (!browserSession) {
        const session = await createBrowserSession();
        setBrowserSession(session.sessionId);
      }

      // Navegar em todas as URLs e coletar resultados
      const allResults = [];
      for (let i = 0; i < urlsToVisit.length; i++) {
        const url = urlsToVisit[i];
        
        setMessages(prev => prev.map(m => 
          m.id === loadingMessageId 
            ? { ...m, content: `🤖 **Navegação Inteligente**\n\n✅ ${urlsToVisit.length} URLs geradas\n🌐 Navegando ${i + 1}/${urlsToVisit.length}: ${url}` }
            : m
        ));

        try {
          const result = await browseAndExtract(url);
          allResults.push({
            url: result.navigation.url,
            title: result.content.title,
            text: result.content.text.substring(0, 2000), // Limitar texto
            images: result.content.images.slice(0, 5),
            links: result.content.links.slice(0, 10),
            screenshot: result.screenshot,
          });
        } catch (error) {
          console.warn(`Erro ao navegar em ${url}:`, error);
          // Continua com as próximas URLs
        }
      }

      if (allResults.length === 0) {
        throw new Error('Não foi possível navegar em nenhuma URL');
      }

      // Usar o primeiro resultado para o Canvas
      const primaryResult = allResults[0];

      setMessages(prev => prev.map(m => 
        m.id === loadingMessageId 
          ? { ...m, content: `🤖 **Navegação Inteligente**\n\n✅ ${allResults.length} páginas carregadas\n🧠 Gemini analisando todo o conteúdo...` }
          : m
      ));

      // Análise inteligente com CHAIN OF THOUGHT (CoT)
      const analysisPrompt = `Você é PROX AI, um assistente de navegação inteligente e prestativo.

SUA IDENTIDADE:
- Nome: PROX AI
- Função: Assistente de Navegação e Pesquisa Inteligente
- Personalidade: Amigável, eficiente, direto e útil
- Objetivo: Ajudar o usuário a encontrar exatamente o que precisa

USE CHAIN OF THOUGHT (CoT) - PENSE PASSO A PASSO:

PASSO 1 - COMPREENSÃO:
Pense: O que o usuário queria saber com "${userIntent}"?
Qual é a necessidade real por trás da pergunta?

PASSO 2 - ANÁLISE DOS DADOS:
Você navegou em ${allResults.length} páginas. Pense:
- Quais informações são mais relevantes?
- Há produtos? Preços? Informações técnicas?
- O que é realmente útil para o usuário?

PASSO 3 - SÍNTESE:
Pense: Como posso resumir isso de forma clara e útil?
- Seja específico, não genérico
- Use dados concretos
- Fale de forma amigável

PASSO 4 - RECOMENDAÇÃO:
Pense: O que o usuário deve fazer com essa informação?
- Dê uma recomendação prática
- Seja prestativo e útil

SUA MISSÃO AGORA:
Analisar ${allResults.length} páginas web que você navegou e extrair as informações mais úteis.

INTENÇÃO DO USUÁRIO:
"${userIntent}"

CONTEÚDO DAS ${allResults.length} PÁGINAS QUE VOCÊ NAVEGOU:

${allResults.map((r, i) => `
=== PÁGINA ${i + 1}: ${r.title} ===
URL: ${r.url}
Conteúdo: ${r.text.substring(0, 1500)}...

Imagens encontradas: ${r.images.length}
${r.images.slice(0, 3).map((img: any, j: number) => `${j + 1}. ${img.alt || img.src}`).join('\n')}
`).join('\n\n')}

COMO VOCÊ DEVE ANALISAR:
1. 🎯 Identifique o que o usuário REALMENTE quer saber
2. 📊 Extraia dados estruturados (produtos, preços, informações)
3. ✨ Destaque os pontos mais importantes
4. 💡 Dê uma recomendação útil e prática
5. 🗣️ Seja conversacional e amigável no resumo

FORMATO DE RESPOSTA (JSON):
{
  "thinking": "SEU RACIOCÍNIO CoT: Explique brevemente como você pensou (1-2 frases sobre sua análise)",
  "summary": "Resumo amigável e direto do que você encontrou (fale como PROX AI, use 'Encontrei...', 'Descobri...', etc.)",
  "products": [
    {
      "name": "Nome do produto/informação",
      "price": "Preço (se houver)",
      "description": "Descrição útil",
      "image": "URL da melhor imagem"
    }
  ],
  "highlights": [
    "Ponto importante 1 (seja específico)",
    "Ponto importante 2 (com dados concretos)",
    "Ponto importante 3 (útil para decisão)"
  ],
  "recommendation": "Sua recomendação como PROX AI (seja prestativo e prático)"
}

IMPORTANTE:
- No "summary", fale em primeira pessoa como PROX AI
- Seja específico e útil, não genérico
- Se encontrou produtos, liste os melhores
- Se encontrou informações, resuma o essencial
- Sempre dê uma recomendação prática

RESPONDA APENAS COM O JSON, SEM TEXTO ADICIONAL.`;

      const analysisMessage: Message = {
        id: `temp_analysis_${Date.now()}`,
        role: 'user',
        content: analysisPrompt
      };

      let analysisResponse = '';
      for await (const chunk of sendMessageToGemini([analysisMessage], selectedModel, PERSONAS[0], false, DEFAULT_GENERATION_CONFIG)) {
        analysisResponse += chunk;
      }

      // Extrair JSON da análise
      let analysis = null;
      try {
        const jsonMatch = analysisResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn('Erro ao parsear análise:', e);
      }

      // Atualizar Canvas com análise de múltiplas fontes
      setCanvasContent({
        url: primaryResult.url,
        title: `Pesquisa: ${userIntent}`,
        liveUrl: primaryResult.url,
        screenshot: primaryResult.screenshot,
        content: {
          title: primaryResult.title,
          url: primaryResult.url,
          text: allResults.map(r => r.text).join('\n\n'),
          images: allResults.flatMap(r => r.images),
          links: allResults.flatMap(r => r.links),
          metadata: {}
        },
        generatedUrls: urlData.urls,
        analysis: analysis, // Análise inteligente de todas as páginas
        multipleResults: allResults, // Todos os resultados
      });
      setShowCanvas(true);

      // Formatar URLs geradas
      const urlsList = urlData.urls && Array.isArray(urlData.urls) && urlData.urls.length > 0
        ? urlData.urls.map((u: any) => `• ${u.site || 'Site'}: ${u.description || u.url}`).join('\n')
        : `• ${urlsToVisit[0]}`;

      // Formatar mensagem com análise
      let responseContent = `✅ **Navegação Concluída!**\n\n🎯 **URLs Visitadas:** ${allResults.length}\n${allResults.map((r, i) => `${i + 1}. ${r.title}`).join('\n')}\n\n`;

      if (analysis) {
        if (analysis.thinking) {
          responseContent += `💭 **Raciocínio:**\n${analysis.thinking}\n\n`;
        }
        
        if (analysis.summary) {
          responseContent += `🧠 **Análise Inteligente:**\n${analysis.summary}\n\n`;
        }
        
        if (analysis.products && analysis.products.length > 0) {
          responseContent += `🛍️ **Produtos Encontrados:** ${analysis.products.length}\n\n`;
        }

        if (analysis.highlights && analysis.highlights.length > 0) {
          responseContent += `✨ **Destaques:**\n${analysis.highlights.map((h: string) => `• ${h}`).join('\n')}\n\n`;
        }

        if (analysis.recommendation) {
          responseContent += `💡 **Recomendação:** ${analysis.recommendation}\n\n`;
        }
      }

      responseContent += `👉 **Veja o resultado completo no Canvas ao lado!**`;

      const successMessage: Message = {
        id: loadingMessageId,
        role: 'model',
        content: responseContent,
      };

      const finalMessages = [...newHistory, successMessage];
      setMessages(finalMessages);
      updateChatHistory(finalMessages);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro na navegação inteligente";
      console.error('Error in intelligent navigation:', error);
      setMessages([...newHistory, { 
        id: loadingMessageId, 
        role: 'model', 
        content: `❌ **Erro na Navegação Inteligente**\n\n${errorMessage}\n\n💡 **Dica**: Tente ser mais específico ou forneça uma URL direta.`, 
        error: errorMessage 
      }]);
    }

    setIsLoading(false);
  };

  const handleBrowserNavigation = async (prompt: string) => {
    setActiveInteractiveCode(null);
    
    // Extrair URL do prompt
    const url = extractUrl(prompt);
    
    // Se não tem URL explícita, usar agentes inteligentes
    if (!url) {
      await handleIntelligentNavigation(prompt);
      return;
    }
    
    const userMessage: Message = { 
      id: `user_${Date.now()}`, 
      role: 'user', 
      content: prompt
    };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsLoading(true);

    const loadingMessageId = `ai_${Date.now()}`;
    setMessages([...newHistory, { 
      id: loadingMessageId, 
      role: 'model', 
      content: `🌐 Navegando para ${url}...\n📡 Conectando ao Playwright...\n🔄 Carregando página...\n📸 Capturando screenshot...\n📝 Extraindo conteúdo...`, 
      isLoading: true 
    }]);

    try {
      // Criar sessão se não existir
      if (!browserSession) {
        const session = await createBrowserSession();
        setBrowserSession(session.sessionId);
      }

      // Navegar e extrair
      const result = await browseAndExtract(url);

      // Atualizar Canvas
      setCanvasContent({
        url: result.navigation.url,
        title: result.content.title,
        screenshot: result.screenshot,
        content: result.content,
      });
      setShowCanvas(true);

      // Mensagem de sucesso
      const successMessage: Message = {
        id: loadingMessageId,
        role: 'model',
        content: `✅ **Navegação concluída!**\n\n📄 **Página**: ${result.content.title}\n🔗 **URL**: ${result.navigation.url}\n📝 **Conteúdo**: ${result.content.text.length} caracteres\n🔗 **Links**: ${result.content.links.length}\n🖼️ **Imagens**: ${result.content.images.length}\n\n👉 **Veja o resultado no Canvas ao lado!**`,
      };

      const finalMessages = [...newHistory, successMessage];
      setMessages(finalMessages);
      updateChatHistory(finalMessages);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao navegar";
      console.error('Error navigating:', error);
      setMessages([...newHistory, { 
        id: loadingMessageId, 
        role: 'model', 
        content: `❌ Erro ao navegar para ${url}\n\n${errorMessage}`, 
        error: errorMessage 
      }]);
    }

    setIsLoading(false);
  };

  const handleWebSearch = async (query: string) => {
    setActiveInteractiveCode(null);
    
    const userMessage: Message = { 
      id: `user_${Date.now()}`, 
      role: 'user', 
      content: query
    };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsLoading(true);

    const thinkingMessageId = `ai_${Date.now()}`;
    setMessages([...newHistory, { 
      id: thinkingMessageId, 
      role: 'model', 
      content: '🔍 Pesquisa inteligente ativada...\n🎯 Detectando tipo de pesquisa...\n🌐 Buscando nas melhores fontes...\n🧠 Analisando resultados...', 
      isLoading: true 
    }]);

    try {
      // Importar o novo serviço
      const { generateEnhancedResponse } = await import('./services/enhancedSearchService');
      
      const response = await generateEnhancedResponse(
        query,
        selectedPersona.prompt
      );

      const finalAiMessage: Message = {
        id: thinkingMessageId,
        role: 'model',
        content: response,
      };

      const finalMessages = [...newHistory, finalAiMessage];
      setMessages(finalMessages);
      updateChatHistory(finalMessages);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao realizar pesquisa";
      console.error('Error searching web:', error);
      setMessages([...newHistory, { 
        id: thinkingMessageId, 
        role: 'model', 
        content: '', 
        error: errorMessage 
      }]);
    }

    setIsLoading(false);
  };

  const handleSend = async (prompt: string, attachments?: Attachment[]) => {
    setActiveInteractiveCode(null);
    
    // ========== MODO NAVEGAÇÃO ATIVO ==========
    if (isBrowserMode) {
      await handleBrowserNavigation(prompt);
      return;
    }
    
    // Se modo de pesquisa está ativo, usa pesquisa web
    if (isSearchMode) {
      await handleWebSearch(prompt);
      return;
    }
    
    // Se é modelo de imagem E tem anexos, trata como edição
    const isImageModel = selectedModel.id === 'gemini-2.5-flash-image' || selectedModel.id === 'gemini-2.0-flash-exp';
    if (isImageModel && attachments && attachments.length > 0) {
        await handleImageEdit(prompt, attachments);
        return;
    }

    if ((selectedModel.type === 'image' || selectedModel.type === 'video') && !isLoading) {
      setGenerationTask({ prompt, attachments });
      setIsOptionsModalOpen(true);
      return;
    }
    
    let contextPrompt = prompt;
    if (activeProjectId) {
      const project = projects.find(p => p.id === activeProjectId);
      if (project && project.files.length > 0) {
        const fileContext = project.files.map(f => `\n--- FILE: ${f.path} ---\n${f.content}`).join('\n');
        contextPrompt = `CONTEXT: I am working on a project with the following files:\n${fileContext}\n\nTASK: ${prompt}`;
      }
    }

    const userMessage: Message = { id: `user_${Date.now()}`, role: 'user', content: contextPrompt, attachments };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);

    // Grounding logic as before
    const lowerCasePrompt = prompt.toLowerCase();
    const searchKeywords = ['who is', 'what is', 'latest', 'news', 'search for', 'find information on'];
    const mapsKeywords = ['nearby', 'restaurants near', 'directions to', 'where is', 'map of'];
    let groundingTool: 'googleSearch' | 'googleMaps' | null = null;
    if (searchKeywords.some(kw => lowerCasePrompt.includes(kw))) groundingTool = 'googleSearch';
    else if (mapsKeywords.some(kw => lowerCasePrompt.includes(kw))) groundingTool = 'googleMaps';

    if (groundingTool) {
      await executeSendWithGrounding(newHistory, groundingTool);
    } else {
      await executeSend(newHistory);
    }
  };

  const handleStartGeneration = async (options: { aspectRatio: AspectRatio }) => {
    if (!generationTask || isLoading) return;
    setIsOptionsModalOpen(false);
    setIsLoading(true);

    const { prompt, attachments } = generationTask;
    const userMessage: Message = { id: `user_${Date.now()}`, role: 'user', content: prompt, attachments };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);

    const generationMessageId = `ai_${Date.now()}`;

    if (selectedModel.type === 'video') {
      setMessages([...newHistory, { 
        id: generationMessageId, 
        role: 'model', 
        content: 'Gerando vídeo...', 
        videoState: 'generating',
        generationProgress: 'Iniciando geração de vídeo...'
      }]);

      try {
        const imageAttachment = attachments?.find(a => a.mimeType.startsWith('image/'));
        const videoUri = await generateVideoWithVeo(
          prompt,
          options.aspectRatio as '16:9' | '9:16',
          imageAttachment,
          (progress) => {
            setMessages(prev => prev.map(m => 
              m.id === generationMessageId 
                ? { ...m, generationProgress: progress }
                : m
            ));
          }
        );

        const finalMessage: Message = {
          id: generationMessageId,
          role: 'model',
          content: 'Vídeo gerado com sucesso!',
          videoState: 'completed',
          videoUri: videoUri,
        };

        const finalMessages = [...newHistory, finalMessage];
        setMessages(finalMessages);
        updateChatHistory(finalMessages);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro ao gerar vídeo";
        console.error('Error generating video:', error);
        setMessages(prev => prev.map(m => 
          m.id === generationMessageId 
            ? { ...m, videoState: 'failed', error: errorMessage }
            : m
        ));
      }
    } else if (selectedModel.type === 'image') {
      setMessages([...newHistory, { id: generationMessageId, role: 'model', content: '', isLoading: true }]);

      try {
        let generatedImage: Attachment;
        
        if (selectedModel.id === 'imagen-4.0-generate-001') {
          generatedImage = await generateImageWithImagen(prompt, options.aspectRatio);
        } else {
          generatedImage = await generateOrEditImage(prompt, attachments, selectedModel.id);
        }

        const finalMessage: Message = {
          id: generationMessageId,
          role: 'model',
          content: 'Imagem gerada com sucesso!',
          attachments: [generatedImage],
        };

        const finalMessages = [...newHistory, finalMessage];
        setMessages(finalMessages);
        updateChatHistory(finalMessages);

        // Salvar imagem no IndexedDB
        try {
          await dbService.saveImage({
            id: `img_${Date.now()}`,
            prompt: prompt,
            imageData: generatedImage.data,
            mimeType: generatedImage.mimeType,
            createdAt: Date.now(),
            metadata: {
              model: selectedModel.id,
              aspectRatio: options.aspectRatio
            }
          });
          console.log('✅ Imagem salva no IndexedDB');
        } catch (dbError) {
          console.error('Erro ao salvar imagem no IndexedDB:', dbError);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro ao gerar imagem";
        console.error('Error generating image:', error);
        setMessages([...newHistory, { id: generationMessageId, role: 'model', content: '', error: errorMessage }]);
      }
    }

    setIsLoading(false);
    setGenerationTask(null);
  };
  
  const handleNewChat = useCallback(() => {
    setMessages([]);
    setActiveInteractiveCode(null);
    setCurrentChatId(`chat_${Date.now()}`);
    setGenerationConfig(DEFAULT_GENERATION_CONFIG); // Reset config for new chat
    setActiveView('chat');
    if (activeProjectId) {
      // If in a project, the new chat belongs to the project.
      // The UI will just clear the messages, ready for a new conversation.
    } else {
      setActiveProjectId(null); // Ensure we are in global context
    }
  }, [activeProjectId]);
  
  const handleSelectChat = useCallback((chatId: string) => {
    let selectedChat: Chat | undefined;
    if (activeProjectId) {
        selectedChat = projects.find(p => p.id === activeProjectId)?.chats.find(c => c.id === chatId);
    } else {
        selectedChat = chatHistory.find(chat => chat.id === chatId);
    }

    if (selectedChat) {
      setCurrentChatId(selectedChat.id);
      setMessages(selectedChat.messages);
      setGenerationConfig(selectedChat.generationConfig || DEFAULT_GENERATION_CONFIG);
      const lastMessage = selectedChat.messages[selectedChat.messages.length - 1];
      if (lastMessage?.isInteractive && lastMessage.htmlCode) {
        handleShowInteractiveCode(lastMessage);
      } else {
        setActiveInteractiveCode(null);
      }
      setActiveView('chat');
    }
  }, [chatHistory, projects, activeProjectId]);
  
  const handleRegenerate = useCallback(async () => {
    if (isLoading || messages.length < 2) return;
    
    // Find last user message index (reverse search)
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }
    
    if (lastUserMessageIndex === -1) return;

    const historyUpToLastUser = messages.slice(0, lastUserMessageIndex + 1);
    
    // Check if grounding was used
    const lastAiMessage = messages[messages.length - 1];
    if (lastAiMessage.sources && lastAiMessage.sources.length > 0) {
      const groundingTool = lastAiMessage.sources[0].type === 'web' ? 'googleSearch' : 'googleMaps';
      await executeSendWithGrounding(historyUpToLastUser, groundingTool);
    } else {
      await executeSend(historyUpToLastUser);
    }
  }, [messages, isLoading, executeSend, executeSendWithGrounding]);
  const handleEditPrompt = useCallback(async (messageId: string, newContent: string) => {
    if (isLoading) return;

    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || messages[messageIndex].role !== 'user') return;

    const updatedMessage = { ...messages[messageIndex], content: newContent, isEdited: true };
    const newHistory = [...messages.slice(0, messageIndex), updatedMessage];
    setMessages(newHistory);

    await executeSend(newHistory);
  }, [messages, isLoading, executeSend]);
  const handleLiveConversation = async () => {
    if (liveConversationState === 'idle') {
      setLiveConversationState('connecting');
      setLiveTranscript('');

      try {
        const manager = new LiveSessionManager();
        liveSessionManagerRef.current = manager;

        await manager.startSession({
          onOpen: () => {
            setLiveConversationState('active');
          },
          onMessage: (message) => {
            console.log('Live message:', message);
          },
          onError: (error) => {
            console.error('Live session error:', error);
            setLiveConversationState('idle');
            setLiveTranscript('Erro na conexão. Tente novamente.');
          },
          onClose: () => {
            setLiveConversationState('idle');
            setLiveTranscript('');
          },
          onTranscription: (text, isFinal) => {
            if (isFinal && text) {
              setLiveTranscript(prev => prev + ' ' + text);
            } else if (text) {
              setLiveTranscript(text);
            }
          }
        });
      } catch (error) {
        console.error('Failed to start live session:', error);
        setLiveConversationState('idle');
        setLiveTranscript('Falha ao iniciar conversa ao vivo.');
      }
    } else {
      // Stop the session
      if (liveSessionManagerRef.current) {
        await liveSessionManagerRef.current.closeSession();
        liveSessionManagerRef.current = null;
      }
      setLiveConversationState('idle');
      setLiveTranscript('');
    }
  };
  const handleTranscribe = async (audioBase64: string) => {
    try {
      const transcription = await transcribeAudio(audioBase64);
      return transcription;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  };
  const handleTextToSpeech = async (text: string): Promise<string> => {
    try {
      const audioData = await generateSpeech(text);
      return audioData;
    } catch (error) {
      console.error('TTS error:', error);
      throw error;
    }
  };
  const handleDeleteChat = useCallback((chatId: string) => {
    if (activeProjectId) {
      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return { ...p, chats: p.chats.filter(c => c.id !== chatId) };
        }
        return p;
      }));
    } else {
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    }
    
    if (chatId === currentChatId) {
      handleNewChat();
    }
  }, [currentChatId, handleNewChat, activeProjectId]);
  const handleUpdateChatTitle = useCallback((chatId: string, newTitle: string) => {
    if (activeProjectId) {
      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            chats: p.chats.map(c => c.id === chatId ? { ...c, title: newTitle } : c)
          };
        }
        return p;
      }));
    } else {
      setChatHistory(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      ));
    }
  }, [activeProjectId]);
  const handleImageCapture = (attachments: Attachment[]) => {
    // Envia as imagens capturadas diretamente para o chat
    if (attachments.length > 0) {
      const prompt = `[${attachments.length} imagem(ns) anexada(s)]`;
      handleSend(prompt, attachments);
    }
    setIsCameraOpen(false);
  };
  const handleCloseInteractiveCode = () => setActiveInteractiveCode(null);
  const handleFullScreen = () => {
    if (interactivePanelRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        interactivePanelRef.current.requestFullscreen();
      }
    }
  };
  const handleOpenInNewTab = () => {
    if (activeInteractiveCode) {
      const blob = new Blob([activeInteractiveCode.htmlCode], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  };

  // Project and Library handlers
  const handleCreateProject = () => {
    const projectName = prompt('Nome do projeto:');
    if (!projectName) return;

    const newProject: Project = {
      id: `project_${Date.now()}`,
      name: projectName,
      description: '',
      chats: [],
      files: [],
      libraryItems: [],
      createdAt: Date.now(),
    };

    setProjects(prev => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setActiveView('chat');
    handleNewChat();
  };

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setActiveView('chat');
    
    const project = projects.find(p => p.id === projectId);
    if (project && project.chats.length > 0) {
      const latestChat = project.chats[0];
      handleSelectChat(latestChat.id);
    } else {
      handleNewChat();
    }
  };

  const handleExitProject = () => {
    setActiveProjectId(null);
    setActiveView('chat');
    handleNewChat();
  };

  // Library Item CRUD
  const handleSaveLibraryItem = (item: LibraryItem) => {
    setLibraryItems(prev => {
      const index = prev.findIndex(i => i.id === item.id);
      if (index > -1) {
        const newItems = [...prev];
        newItems[index] = item;
        return newItems;
      }
      return [item, ...prev];
    });
    setIsLibraryItemModalOpen(false);
    setEditingLibraryItem(null);
  };

  const handleOpenLibraryItemModal = (item: LibraryItem | null) => {
    setEditingLibraryItem(item);
    setIsLibraryItemModalOpen(true);
  };

  const handleDeleteLibraryItem = (itemId: string) => {
    setLibraryItems(prev => prev.filter(i => i.id !== itemId));
  };

  // Meta-Persona handlers
  const handleSelectGeneratedPersona = async (persona: Persona) => {
    setSelectedPersona(persona);
    setGeneratedPersonas(prev => {
      const exists = prev.find(p => p.id === persona.id);
      if (!exists) {
        return [persona, ...prev];
      }
      return prev;
    });

    // Salvar persona no IndexedDB
    try {
      await dbService.savePersona({
        id: persona.id,
        name: persona.name,
        description: (persona as any).description || persona.prompt,
        systemPrompt: (persona as any).systemPrompt || persona.prompt,
        createdAt: Date.now()
      });
      console.log('✅ Persona salva no IndexedDB');
    } catch (error) {
      console.error('Erro ao salvar persona:', error);
    }
  };

  const getConversationContext = (): string[] => {
    return messages
      .filter(m => m.content && !m.isLoading && !m.error)
      .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.substring(0, 200)}`)
      .slice(-10); // Last 10 messages
  };

  // Gallery handlers
  const handleImageClick = (image: Attachment, prompt: string) => {
    setViewerImage({ image, prompt });
  };

  const handleDownloadImage = (image: Attachment) => {
    const link = document.createElement('a');
    link.href = `data:${image.mimeType};base64,${image.data}`;
    link.download = image.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUseAsReference = (image: Attachment) => {
    // Volta para o chat e adiciona a imagem como anexo
    setActiveView('chat');
    // Aqui você pode implementar lógica para adicionar ao input
    // Por enquanto, apenas mostra uma mensagem
    console.log('Using image as reference:', image.name);
  };

  const handleEditImage = (image: Attachment, prompt: string) => {
    // Seleciona modelo de edição e volta para o chat
    const editModel = GEMINI_MODELS.find(m => m.id === 'gemini-2.0-flash-exp') || GEMINI_MODELS[2];
    setSelectedModel(editModel);
    setActiveView('chat');
    // Adiciona imagem e prompt de edição
    handleSend(`Edite esta imagem: ${prompt}`, [image]);
  };

  // Coleta todas as mensagens de todos os chats para a galeria
  const getAllMessages = (): Message[] => {
    const allMessages: Message[] = [...messages];
    
    // Adiciona mensagens do histórico global
    chatHistory.forEach(chat => {
      allMessages.push(...chat.messages);
    });
    
    // Adiciona mensagens dos projetos
    projects.forEach(project => {
      project.chats.forEach(chat => {
        allMessages.push(...chat.messages);
      });
    });
    
    return allMessages;
  };


  const renderActiveView = () => {
    const activeProject = projects.find(p => p.id === activeProjectId);

    switch(activeView) {
      case 'library': 
        return <LibraryView items={libraryItems} onEditItem={handleOpenLibraryItemModal} onDeleteItem={handleDeleteLibraryItem} onNewItem={() => handleOpenLibraryItemModal(null)} />;
      case 'projects': 
        return <ProjectsView projects={projects} onCreateProject={handleCreateProject} onSelectProject={handleSelectProject} />;
      case 'gallery':
        return (
          <ImageGalleryView
            chatHistory={getAllMessages()}
            onImageClick={handleImageClick}
            onDownload={handleDownloadImage}
            onUseAsReference={handleUseAsReference}
          />
        );
      case 'documents':
        return <DocumentGeneratorView />;
      case 'whatsapp':
        return <WhatsAppBusinessPanel />;
      case 'admin':
        return <WhatsAppAdminPanel />;
      case 'security':
        return <SecurityView />;
      case 'chat':
      default:
        return (
          <ChatView
            messages={messages} isLoading={isLoading} onSend={handleSend}
            onStop={stopStreamingRef.current} onCameraClick={() => setIsCameraOpen(true)}
            onRegenerate={handleRegenerate}
            onEditPrompt={handleEditPrompt}
            onTranscribe={handleTranscribe} onTextToSpeech={handleTextToSpeech}
            onShowInteractiveCode={handleShowInteractiveCode}
            theme={theme}
            projectName={activeProject?.name}
            onOpenLibrary={() => setIsLibrarySelectorOpen(true)}
            appendToPromptRef={appendToPromptRef}
            isThinkingMode={isThinkingMode}
            selectedPersona={selectedPersona}
            onWebSearch={handleWebSearch}
            onOpenVoiceSettings={() => setIsVoiceSettingsOpen(true)}
            isSearchMode={isSearchMode}
            onToggleSearchMode={() => setIsSearchMode(!isSearchMode)}
            isBrowserMode={isBrowserMode}
            onToggleBrowserMode={() => {
              setIsBrowserMode(!isBrowserMode);
              setShowCanvas(!isBrowserMode); // Abre/fecha Canvas junto
            }}
          />
        );
    }
  };

  const TabButton: React.FC<{ tab: InteractiveTab; text: string }> = ({ tab, text }) => (
    <button
      onClick={() => setInteractiveTab(tab)}
      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${interactiveTab === tab ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary/50'}`}
    >
      {text}
    </button>
  );

  const currentChats = activeProjectId ? projects.find(p => p.id === activeProjectId)?.chats || [] : chatHistory;

  return (
    <div className="flex h-screen w-full bg-bg-primary text-text-primary">
      {liveConversationState !== 'idle' && (
        <LiveTranscriptOverlay 
            state={liveConversationState} 
            transcript={liveTranscript} 
            onClose={handleLiveConversation} 
        />
      )}
      <Sidebar
        isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onNewChat={handleNewChat} chatHistory={currentChats}
        currentChatId={currentChatId} onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat} onUpdateChatTitle={handleUpdateChatTitle}
        onSelectLibrary={() => setActiveView('library')}
        onSelectProjects={() => setActiveView('projects')}
        onSelectGallery={() => setActiveView('gallery')}
        onSelectDocuments={() => setActiveView('documents')}
        onSelectWhatsApp={() => setActiveView('whatsapp')}
        onSelectAdmin={() => setActiveView('admin')}
        onSelectSecurity={() => setActiveView('security')}
        // Project props
        activeProjectId={activeProjectId}
        onExitProject={handleExitProject}
        projectFiles={projects.find(p => p.id === activeProjectId)?.files || []}
      />
      <main className="flex-1 flex flex-col transition-all duration-300 min-w-0 h-full overflow-hidden">
        <Header 
            selectedModel={selectedModel} setSelectedModel={setSelectedModel}
            selectedPersona={selectedPersona} setSelectedPersona={setSelectedPersona}
            theme={theme} onToggleTheme={handleToggleTheme}
            isThinkingMode={isThinkingMode} onToggleThinkingMode={() => setIsThinkingMode(!isThinkingMode)}
            liveConversationState={liveConversationState} onLiveConversationClick={handleLiveConversation}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenMetaPersona={() => setIsMetaPersonaModalOpen(true)}
            generatedPersonas={generatedPersonas}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <div className="flex-1 flex overflow-hidden">
            <div className={`transition-all duration-300 ${showCanvas && canvasContent && !activeInteractiveCode ? 'w-[30%]' : activeInteractiveCode ? 'w-1/2' : 'w-full'}`}>
                {renderActiveView()}
            </div>
            {activeInteractiveCode && (
                <div ref={interactivePanelRef} className="w-1/2 h-full flex flex-col p-2 border-l border-border-color bg-bg-primary">
                  <div className="flex flex-col h-full rounded-xl bg-bg-secondary border border-border-color shadow-lg overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-color flex-shrink-0">
                          <div className="flex items-center gap-1 p-0.5 bg-bg-primary rounded-lg">
                              <TabButton tab="preview" text="Pré-visualização" />
                              <TabButton tab="code" text="Código" />
                          </div>
                          <div className="flex items-center gap-1 text-text-secondary">
                              <button onClick={handleOpenInNewTab} data-tooltip="Abrir em nova aba" className="w-8 h-8 rounded-md hover:bg-bg-tertiary transition-colors"><i className="fa-solid fa-arrow-up-right-from-square"></i></button>
                              <button onClick={handleFullScreen} data-tooltip="Tela cheia" className="w-8 h-8 rounded-md hover:bg-bg-tertiary transition-colors"><i className="fa-solid fa-expand"></i></button>
                              <button onClick={handleCloseInteractiveCode} data-tooltip="Fechar" className="w-8 h-8 rounded-md hover:bg-bg-tertiary transition-colors"><i className="fa-solid fa-xmark"></i></button>
                          </div>
                      </div>
                      <InteractiveCodeBlock
                          htmlCode={activeInteractiveCode.htmlCode}
                          theme={theme}
                          activeView={interactiveTab}
                      />
                  </div>
                </div>
            )}
            {showCanvas && canvasContent && !activeInteractiveCode && (
                <div className="w-[70%] h-full flex flex-col p-2 border-l border-border-color bg-bg-primary">
                  <div className="flex flex-col h-full rounded-xl bg-bg-secondary border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-transparent flex-shrink-0">
                          <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                              <h2 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                                  <i className="fa-solid fa-globe"></i>
                                  Canvas - Navegação
                              </h2>
                          </div>
                          <button 
                              onClick={() => {
                                  setShowCanvas(false);
                                  setIsBrowserMode(false);
                              }} 
                              className="w-8 h-8 rounded-md hover:bg-red-500/20 hover:text-red-400 transition-all text-text-tertiary"
                              title="Fechar Canvas e desativar modo navegação"
                          >
                              <i className="fa-solid fa-xmark"></i>
                          </button>
                      </div>
                      <div className="flex-1 overflow-auto p-4">
                          <BrowserResultCard
                              type="webpage"
                              data={canvasContent}
                          />
                      </div>
                  </div>
                </div>
            )}
        </div>
      </main>
      {isOptionsModalOpen && generationTask && (
        <GenerationOptionsModal
            model={selectedModel}
            onClose={() => { setIsOptionsModalOpen(false); setGenerationTask(null); }}
            onSubmit={handleStartGeneration}
        />
      )}
      {isSettingsModalOpen && (
        <ModelSettingsModal
          config={generationConfig}
          onSave={setGenerationConfig}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}
      {isLibraryItemModalOpen && (
        <LibraryItemModal
          item={editingLibraryItem}
          onSave={handleSaveLibraryItem}
          onClose={() => { setIsLibraryItemModalOpen(false); setEditingLibraryItem(null); }}
        />
      )}
      {isLibrarySelectorOpen && (
        <LibrarySelectorModal
          items={libraryItems}
          onSelect={(item) => {
            if (appendToPromptRef.current) {
               appendToPromptRef.current(typeof item.content === 'string' ? item.content : JSON.stringify(item.content, null, 2));
            }
            setIsLibrarySelectorOpen(false);
          }}
          onClose={() => setIsLibrarySelectorOpen(false)}
        />
      )}
      {isCameraOpen && <MediaCaptureModal onClose={() => setIsCameraOpen(false)} onCapture={handleImageCapture} />}
      {isMetaPersonaModalOpen && (
        <MetaPersonaModal
          onClose={() => setIsMetaPersonaModalOpen(false)}
          onSelectPersona={handleSelectGeneratedPersona}
          conversationContext={getConversationContext()}
        />
      )}
      {viewerImage && (
        <ImageViewerModal
          image={viewerImage.image}
          prompt={viewerImage.prompt}
          onClose={() => setViewerImage(null)}
          onDownload={handleDownloadImage}
          onUseAsReference={handleUseAsReference}
          onEdit={handleEditImage}
        />
      )}
      <VoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
      />
    </div>
  );
};

export default App;