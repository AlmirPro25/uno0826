
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
import { HybridBrowser } from './components/HybridBrowser';
import { Message, GeminiModel, Persona, Chat, Attachment, Project, LibraryItem, GenerationConfig, LibraryItemType } from './types';
import { GEMINI_MODELS, PERSONAS, DEFAULT_GENERATION_CONFIG } from './constants';
import { sendMessageToGemini, sendMessageWithGrounding, generateOrEditImage, generateImageWithImagen, generateVideoWithVeo, transcribeAudio, generateSpeech, LiveSessionManager } from './services/geminiService';
import { detectTechnicalContext, TechnicalCodeValidator } from './services/neuralArchitectService';
import { browseAndExtract, createBrowserSession, closeBrowserSession } from './services/browserService';
import { extractUrl } from './services/browserIntegrationService';
import { searchMultipleEngines } from './services/multiSearchService';
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
  const [showHybridBrowser, setShowHybridBrowser] = useState<boolean>(false);
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
        
        // Usar busca massiva REAL
        await executeIntelligentSearch(searchTerm);
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
  
  // 🧠 SINTETIZAR RESULTADOS COM GEMINI
  const synthesizeSearchResults = async (
    query: string,
    searchData: any,
    queryType: 'products' | 'news' | 'general'
  ): Promise<string> => {
    const { GoogleGenAI } = await import("@google/genai");
    const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // Construir contexto baseado no tipo de busca
    let context = '';
    
    if (queryType === 'products' && searchData.products) {
      context = `**PRODUTOS ENCONTRADOS:**\n\n`;
      searchData.products.slice(0, 10).forEach((p: any, i: number) => {
        context += `${i + 1}. ${p.title}\n`;
        context += `   Preço: ${p.price}\n`;
        context += `   Loja: ${p.store}\n`;
        context += `   Link: ${p.url}\n\n`;
      });
      
      // Calcular estatísticas básicas
      const prices = searchData.products.map((p: any) => p.priceRaw || 0).filter((p: number) => p > 0);
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
        
        context += `\n**ANÁLISE DE PREÇOS:**\n`;
        context += `- Menor preço: R$ ${minPrice.toFixed(2)}\n`;
        context += `- Maior preço: R$ ${maxPrice.toFixed(2)}\n`;
        context += `- Preço médio: R$ ${avgPrice.toFixed(2)}\n`;
      }
    } else if (queryType === 'news' && searchData.results) {
      context = `**NOTÍCIAS ENCONTRADAS:**\n\n`;
      searchData.results.slice(0, 10).forEach((r: any, i: number) => {
        context += `${i + 1}. ${r.title}\n`;
        context += `   Fonte: ${r.source}\n`;
        context += `   Resumo: ${r.snippet}\n`;
        context += `   Link: ${r.url}\n\n`;
      });
    } else {
      context = `**RESULTADOS ENCONTRADOS:**\n\n`;
      searchData.results.slice(0, 10).forEach((r: any, i: number) => {
        context += `${i + 1}. ${r.title}\n`;
        context += `   Fonte: ${r.source}\n`;
        context += `   Resumo: ${r.snippet}\n`;
        context += `   Link: ${r.url}\n\n`;
      });
    }

    // Prompt para síntese natural
    const prompt = `Você é um assistente inteligente e conversacional. Analise os resultados de busca abaixo e crie uma resposta NATURAL, PROFISSIONAL e COM PERSONALIDADE.

**PERGUNTA DO USUÁRIO:**
"${query}"

**DADOS DA BUSCA:**
${context}

**INSTRUÇÕES IMPORTANTES:**

1. **TOM CONVERSACIONAL:**
   - Fale como um humano, não como um robô
   - Use expressões naturais: "Olha", "Encontrei", "Veja só"
   - Seja amigável mas profissional

2. **ESTRUTURA:**
   - Comece com uma introdução natural
   - Destaque os pontos mais importantes
   - Faça comparações e recomendações
   - Termine com uma sugestão ou pergunta

3. **PERSONALIDADE:**
   - Seja prestativo e proativo
   - Mostre entusiasmo quando apropriado
   - Use emojis com moderação (não exagere)
   - Seja específico e útil

4. **FORMATO:**
   - Use Markdown para formatação
   - Organize informações em seções claras
   - Cite fontes quando relevante
   - Inclua links importantes

**EXEMPLO DE BOA RESPOSTA (produtos):**
"Olha, encontrei algumas opções bem interessantes de iPhone 13 pra você! 

O melhor preço que achei foi **R$ 2.899** no Mercado Livre, que é cerca de 15% mais barato que a média do mercado. Se você prefere parcelar sem juros, a Amazon tem uma oferta boa por R$ 3.099 em 12x.

Aqui estão as 3 melhores ofertas que encontrei:

1. **Mercado Livre** - R$ 2.899 (melhor preço!)
2. **Amazon** - R$ 3.099 (12x sem juros)
3. **Magazine Luiza** - R$ 3.199 (frete grátis)

Todos são vendedores confiáveis e o produto é novo. Quer que eu busque mais informações sobre algum deles?"

**AGORA, CRIE SUA RESPOSTA NATURAL E CONVERSACIONAL:**`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
        config: {
          temperature: 0.8, // Mais criativo para tom natural
          topP: 0.95,
          maxOutputTokens: 2048
        }
      });

      return response.text;
    } catch (error) {
      console.error('❌ Erro ao sintetizar com Gemini:', error);
      // Fallback: retornar formatação básica
      return `Encontrei ${searchData.totalResults} resultados para "${query}".\n\nVeja os resultados abaixo.`;
    }
  };

  // 🚀 BUSCA VISUAL INTELIGENTE (NOVO SISTEMA UNIFICADO)
  const executeIntelligentSearch = async (query: string) => {
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
      content: '🔍👁️ **Busca Visual Inteligente**\n\n🌐 Navegando em sites e capturando screenshots...\n📸 Analisando páginas com visão multimodal...', 
      isLoading: true 
    }]);

    try {
      // ✅ USAR BUSCA VISUAL INTELIGENTE (NOVO!)
      const response = await fetch('http://localhost:3002/api/search/visual-intelligent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query,
          maxSites: 5, // 5 sites com navegação profunda
          timeout: 30000
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Busca visual falhou');
      }

      console.log(`✅ Busca visual concluída: ${data.stats.successfulSites} sites analisados`);
      console.log(`📸 Screenshots capturados: ${data.sites.length}`);
      console.log(`🧠 Resposta sintetizada com visão multimodal`);

      // Adicionar galeria de screenshots ao final da resposta
      let enhancedResponse = data.response;
      
      if (data.screenshots && data.screenshots.length > 0) {
        enhancedResponse += '\n\n---\n\n## 📸 Screenshots dos Sites Analisados\n\n';
        enhancedResponse += '*Clique nas imagens para ampliar*\n\n';
        
        data.screenshots.forEach((screenshot: any, index: number) => {
          enhancedResponse += `### ${index + 1}. ${screenshot.site}\n`;
          enhancedResponse += `🔗 [Visitar site](${screenshot.url})\n\n`;
          // Adicionar imagem em base64
          enhancedResponse += `![Screenshot ${screenshot.site}](data:${screenshot.mimeType};base64,${screenshot.data})\n\n`;
        });
      }

      // A resposta já vem sintetizada pelo Gemini com análise visual!
      const finalMessage: Message = {
        id: loadingMessageId,
        role: 'model',
        content: enhancedResponse, // Resposta com screenshots
        metadata: {
          intent: data.intent,
          sitesAnalyzed: data.stats.successfulSites,
          screenshotsCaptured: data.sites.length,
          duration: data.stats.duration,
          sites: data.sites.map((s: any) => ({
            name: s.name,
            url: s.url
          })),
          screenshots: data.screenshots // Guardar screenshots nos metadados também
        }
      };

      const finalMessages = [...newHistory, finalMessage];
      setMessages(finalMessages);
      updateChatHistory(finalMessages);

    } catch (error) {
      console.error('❌ Erro na busca:', error);
      
      const errorMessage: Message = {
        id: loadingMessageId,
        role: 'model',
        content: `❌ **Erro na busca**\n\nNão consegui buscar em múltiplos sites.\n\n**Possíveis causas:**\n- Backend não está rodando\n- Problema de conexão\n- Sites bloquearam a busca\n\n**Tente:**\n1. Verificar se o backend está rodando (\`npm start\` na pasta backend)\n2. Reformular a pergunta\n3. Aguardar alguns segundos e tentar novamente`
      };

      const finalMessages = [...newHistory, errorMessage];
      setMessages(finalMessages);
      updateChatHistory(finalMessages);
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

  // 🔥 NOVA FUNÇÃO: Busca Híbrida Inteligente (DESABILITADA - hybridSearch não implementado)
  /* const handleHybridSearch = async (userIntent: string) => {
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
      content: '🔥 **Busca Híbrida**\n\n⚡ Fase 1: Busca massiva em andamento...', 
      isLoading: true 
    }]);

    try {
      // Detectar se é busca de produtos
      const isProductQuery = /comprar|preço|quanto custa|valor|loja|oferta|promoção|desconto|barato/i.test(userIntent);
      
      setMessages(prev => prev.map(m => 
        m.id === loadingMessageId 
          ? { ...m, content: `🔥 **Busca Híbrida**\n\n${isProductQuery ? '🛒 Detectado: Busca de produtos' : '🔍 Detectado: Busca geral'}\n⚡ Iniciando busca massiva + navegação profunda...` }
          : m
      ));

      // Chamar busca híbrida
      const result = await hybridSearch(userIntent, {
        useDeepNavigation: true,
        deepCount: isProductQuery ? 3 : 2,
        massiveSites: 10,
      });

      // Verificar se a resposta é válida
      if (!result || !result.success) {
        throw new Error('Busca híbrida não retornou resultados válidos');
      }

      // Atualizar progresso (com verificações)
      if (result.massivePhase && result.deepPhase) {
        setMessages(prev => prev.map(m => 
          m.id === loadingMessageId 
            ? { ...m, content: `🔥 **Busca Híbrida**\n\n✅ Fase 1: ${result.massivePhase.results} resultados (${Math.round(result.massivePhase.duration / 1000)}s)\n🔍 Fase 2: ${result.deepPhase.results} navegações profundas (${Math.round(result.deepPhase.duration / 1000)}s)\n🧠 Analisando resultados...` }
            : m
        ));
      }

      // Formatar resposta
      let responseContent = `✅ **Busca Híbrida Concluída!**\n\n`;
      responseContent += `📊 **Estatísticas:**\n`;
      responseContent += `   • Total: ${result.totalResults || 0} resultados\n`;
      responseContent += `   • Produtos: ${result.totalProducts || 0}\n`;
      responseContent += `   • Links: ${result.totalLinks || 0}\n`;
      responseContent += `   • Duração: ${Math.round((result.duration || 0) / 1000)}s\n\n`;

      // Se tem produtos, mostrar comparação
      if (result.totalProducts > 0 && result.comparison && result.comparison.bestPrice) {
        responseContent += `💡 **Melhor Oferta:**\n`;
        responseContent += `   ${result.comparison.bestPrice.title}\n`;
        responseContent += `   💰 ${result.comparison.bestPrice.price}\n`;
        responseContent += `   🏪 ${result.comparison.bestPrice.store}\n`;
        responseContent += `   🔗 ${result.comparison.bestPrice.url}\n\n`;

        if (result.products && result.products.length > 0) {
          responseContent += `🛒 **Top 5 Produtos:**\n`;
          result.products.slice(0, 5).forEach((p: any, i: number) => {
            responseContent += `\n${i + 1}. **${p.title}**\n`;
            responseContent += `   💰 ${p.price} | 🏪 ${p.store}\n`;
            responseContent += `   🔗 ${p.url}\n`;
          });
        }
      } else if (result.totalLinks > 0 && result.links && result.links.length > 0) {
        responseContent += `🔗 **Top 5 Resultados:**\n`;
        result.links.slice(0, 5).forEach((l: any, i: number) => {
          responseContent += `\n${i + 1}. **${l.title}**\n`;
          responseContent += `   🌐 ${l.source}\n`;
          responseContent += `   🔗 ${l.url}\n`;
        });
      } else {
        responseContent += `⚠️ Nenhum resultado encontrado para esta busca.\n`;
      }

      const successMessage: Message = {
        id: loadingMessageId,
        role: 'model',
        content: responseContent,
        metadata: {
          searchResults: result.results,
          products: result.products,
          comparison: result.comparison,
        }
      };

      const finalMessages = [...newHistory, successMessage];
      setMessages(finalMessages);
      updateChatHistory(finalMessages);
      setIsLoading(false);

    } catch (error) {
      console.error('❌ Erro na busca híbrida:', error);
      const errorMessage: Message = {
        id: loadingMessageId,
        role: 'model',
        content: `❌ Erro na busca híbrida: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
      setMessages([...newHistory, errorMessage]);
      setIsLoading(false);
    }
  }; */

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
      content: '🔍 **Busca Massiva no Bing**\n\n🌐 Buscando em múltiplos sites...', 
      isLoading: true 
    }]);

    try {
      // Detecção rápida de sites conhecidos (antes da busca massiva)
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

      // 🚀 USAR BUSCA MASSIVA (Bing como padrão)
      setMessages(prev => prev.map(m => 
        m.id === loadingMessageId 
          ? { ...m, content: '🚀 **Busca Massiva no Bing**\n\n🌐 Buscando em 10 sites simultaneamente...' }
          : m
      ));

      // 🚀 BUSCA MASSIVA NO BING (padrão)
      const massiveSearchResponse = await fetch('http://localhost:3002/api/search/massive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userIntent,
          maxSites: 10,
          timeout: 60000
        })
      });

      if (!massiveSearchResponse.ok) {
        throw new Error(`Erro na busca massiva: ${massiveSearchResponse.statusText}`);
      }

      const massiveData = await massiveSearchResponse.json();
      
      if (!massiveData.success || !massiveData.results || massiveData.results.length === 0) {
        throw new Error('Busca massiva não retornou resultados');
      }

      console.log(`✅ Busca massiva: ${massiveData.results.length} resultados em ${massiveData.totalTime}ms`);

      // Verificar se tem produtos
      const hasProducts = massiveData.products && massiveData.products.length > 0;
      
      if (hasProducts) {
        // TEM PRODUTOS! Mostra direto sem navegar
        console.log(`🛍️ ${massiveData.products.length} produtos encontrados! Mostrando direto...`);
        
        setMessages(prev => prev.map(m => 
          m.id === loadingMessageId 
            ? { ...m, content: `🚀 **Busca Massiva Concluída!**\n\n✅ ${massiveData.totalProducts} produtos em ${massiveData.successfulSites} lojas\n💰 Processando preços...` }
            : m
        ));

        // Formatar mensagem com produtos
        const hasComparison = massiveData.comparison;
        let responseContent = `🛍️ **Busca de Produtos Concluída!**\n\n`;
        responseContent += `✅ **${massiveData.totalProducts} produtos encontrados** em ${massiveData.successfulSites} lojas\n\n`;
        
        if (hasComparison) {
          responseContent += `💰 **Melhor Preço:** ${hasComparison.cheapest.price} (${hasComparison.cheapest.store})\n`;
          responseContent += `💸 **Preço Médio:** R$ ${hasComparison.averagePrice}\n\n`;
          
          if (hasComparison.bestDeals && hasComparison.bestDeals.length > 0) {
            responseContent += `🏆 **Maior Economia:** ${hasComparison.bestDeals[0].savings} (${hasComparison.bestDeals[0].savingsPercent}% off)\n\n`;
          }
        }
        
        responseContent += `👇 **Veja os produtos abaixo com preços e links diretos!**`;

        const successMessage: Message = {
          id: loadingMessageId,
          role: 'model',
          content: responseContent,
          products: massiveData.products,
          comparison: hasComparison || undefined,
        };

        const finalMessages = [...newHistory, successMessage];
        setMessages(finalMessages);
        updateChatHistory(finalMessages);
        setIsLoading(false);
        return; // PARA AQUI! Não navega
      }

      // NÃO TEM PRODUTOS - Navegar normalmente
      console.log('⚠️ Sem produtos, navegando em URLs...');

      // Pegar top 5 URLs dos resultados
      const urlsToVisit = massiveData.results
        .slice(0, 5)
        .map((r: any) => r.url)
        .filter((url: string) => url);

      // Criar estrutura de dados compatível com o código existente
      const urlData = {
        urls: massiveData.results.slice(0, 5).map((r: any) => ({
          url: r.url,
          site: r.site,
          description: r.title || `Resultado de ${r.site}`
        })),
        primaryUrl: urlsToVisit[0]
      };

      setMessages(prev => prev.map(m => 
        m.id === loadingMessageId 
          ? { ...m, content: `🚀 **Busca Massiva Concluída!**\n\n✅ ${massiveData.results.length} sites buscados em ${massiveData.totalTime}ms\n🎯 Navegando nos top 5 resultados...` }
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

      // Formatar mensagem com análise (sem produtos, já foi tratado acima)
      let responseContent = `✅ **Navegação Concluída!**\n\n🎯 **URLs Visitadas:** ${allResults.length}\n${allResults.map((r, i) => `${i + 1}. ${r.title}`).join('\n')}\n\n`;

      if (analysis) {
        if (analysis.thinking) {
          responseContent += `💭 **Raciocínio:**\n${analysis.thinking}\n\n`;
        }
        
        if (analysis.summary) {
          responseContent += `🧠 **Análise Inteligente:**\n${analysis.summary}\n\n`;
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
      content: `🌐 Navegando para ${url}...\n🧠 Analisando com IA...\n📸 Capturando screenshot...\n🎨 Extraindo mídia rica...`, 
      isLoading: true 
    }]);

    try {
      // Usar novo endpoint inteligente
      const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3002';
      const apiKey = localStorage.getItem('gemini-api-key') || '';
      
      const response = await fetch(`${API_URL}/api/browser/navigate-smart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url, 
          userIntent: prompt,
          apiKey 
        })
      });

      if (!response.ok) {
        throw new Error('Erro na navegação');
      }

      const result = await response.json();

      // Atualizar Canvas com screenshot
      setCanvasContent({
        url: result.url,
        title: result.title,
        screenshot: result.screenshot,
        content: result.content,
        analysis: result.analysis
      });
      setShowCanvas(true);

      // Criar mensagem rica com análise IA
      let contentText = `✅ **Navegação concluída!**\n\n📄 **${result.title}**\n🔗 ${result.url}\n\n`;
      
      // Adicionar resumo IA se disponível
      const aiSummary = result.analysis?.summary || null;
      
      if (result.analysis?.keyPoints && result.analysis.keyPoints.length > 0) {
        contentText += `**📌 Pontos Principais:**\n`;
        result.analysis.keyPoints.forEach((point: string) => {
          contentText += `• ${point}\n`;
        });
        contentText += '\n';
      }

      if (result.analysis?.products && result.analysis.products.length > 0) {
        contentText += `**🛍️ Produtos Encontrados:** ${result.analysis.products.length}\n\n`;
      }

      if (result.analysis?.recommendation) {
        contentText += `**💡 Recomendação:** ${result.analysis.recommendation}\n\n`;
      }

      contentText += `👉 **Veja o Canvas ao lado para visualização completa!**`;

      const successMessage: Message = {
        id: loadingMessageId,
        role: 'model',
        content: contentText,
        aiSummary,
        richMedia: result.richMedia || []
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
            onOpenBrowser={() => setShowHybridBrowser(true)}
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

      {/* Navegador Híbrido (Modal Fullscreen) */}
      {showHybridBrowser && (
        <div className="fixed inset-0 z-50 bg-black">
          <HybridBrowser 
            initialUrl=""
            onClose={() => setShowHybridBrowser(false)}
          />
        </div>
      )}
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