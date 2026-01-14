import React, { useState, useCallback } from 'react';
import type { Chat } from '@google/genai';
import { PromptForm } from './components/PromptForm';
import { OutputDisplay } from './components/OutputDisplay';
import { startChatSession, sendMessageToChat, translatePythonToJs } from './services/geminiService';
import { getFallbackResponse, isApiAvailable } from './services/fallbackService';
import type { GeminiResponse, SampleDataset } from './types';
import { Hero } from './components/Hero';
import { LoadingSpinner } from './components/LoadingSpinner';
import { DataVisualizer } from './components/DataVisualizer';
import { TemplateSelector } from './components/TemplateSelector';
import { ProjectHistory, saveToHistory } from './components/ProjectHistory';
import { PerformanceMetrics, recordMetric } from './components/PerformanceMetrics';
import { ShareManager } from './components/ShareManager';
import { SettingsManager } from './components/SettingsManager';
import { NotificationProvider, useCommonNotifications } from './components/NotificationSystem';
import { useKeyboardShortcuts, ShortcutHelp } from './hooks/useKeyboardShortcuts';
import { ApiStatusIndicator } from './components/ApiStatusIndicator';
import { ApiSetupGuide } from './components/ApiSetupGuide';
import { SystemStatus } from './components/SystemStatus';

const AppContent: React.FC = () => {
  const notifications = useCommonNotifications();
  const [prompt, setPrompt] = useState<string>('');
  const [generateUi, setGenerateUi] = useState<boolean>(false);
  const [generateJs, setGenerateJs] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<GeminiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Tecendo as vias neurais...');
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<SampleDataset>('none');
  const [showDataVisualizer, setShowDataVisualizer] = useState<boolean>(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState<boolean>(false);
  const [showProjectHistory, setShowProjectHistory] = useState<boolean>(false);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState<boolean>(false);
  const [showShareManager, setShowShareManager] = useState<boolean>(false);
  const [showSettingsManager, setShowSettingsManager] = useState<boolean>(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState<boolean>(false);
  const [showApiSetupGuide, setShowApiSetupGuide] = useState<boolean>(false);
  const [model, setModel] = useState<string>('gemini-2.5-flash');
  const [chatSession, setChatSession] = useState<Chat | null>(null);

  // State for hyperparameters
  const [learningRate, setLearningRate] = useState<string>('0.001');
  const [epochs, setEpochs] = useState<string>('10');
  const [batchSize, setBatchSize] = useState<string>('32');


  const constructInitialPrompt = () => {
    let finalPrompt = `**Hiperparâmetros Sugeridos:**
Taxa de Aprendizado: ${learningRate}
Épocas: ${epochs}
Tamanho do Lote: ${batchSize}

`;

    if (selectedDataset !== 'none') {
      finalPrompt += `**Conjunto de Dados Selecionado:** ${selectedDataset}\n\n`;
    }

    finalPrompt += `**PROMPT DO USUÁRIO:**\n${prompt}`;

    if (generateUi) {
      finalPrompt += "\n\n---\nINSTRUÇÃO ADICIONAL: Crie também uma interface de usuário completa para esta rede neural. A interface deve permitir que um usuário forneça uma entrada e veja a previsão do modelo. O código Python principal deve salvar o modelo treinado, e o código da UI deve carregá-lo e usá-lo.";
    }
    return finalPrompt;
  }

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Por favor, insira uma descrição para a IA que você deseja construir.');
      return;
    }
    
    const startTime = Date.now();
    setIsLoading(true);
    setLoadingMessage('Tecendo as vias neurais...');
    setError(null);
    setAiResponse(null);
    setChatSession(null); // Start a new session

    try {
      const newChat = startChatSession(model);
      setChatSession(newChat);
      const initialPrompt = constructInitialPrompt();
      let response = await sendMessageToChat(newChat, initialPrompt);

      if (generateJs) {
        setLoadingMessage('Traduzindo para TensorFlow.js...');
        const jsCode = await translatePythonToJs(response.pythonCode, response.explanation, prompt);
        response = { ...response, jsCode };
      }
      
      setAiResponse(response);
      
      // Salvar no histórico e analytics
      const generationTime = Date.now() - startTime;
      saveToHistory(prompt, response, selectedDataset, { learningRate, epochs, batchSize });
      recordMetric(
        model, 
        selectedDataset, 
        generationTime, 
        response.pythonCode?.split('\n').length || 0, 
        generateUi, 
        generateJs
      );
      
      // Notificação de sucesso
      notifications.projectGenerated(prompt.substring(0, 30) + '...');
      
    } catch (err) {
      console.error(err);
      const generationTime = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido. Verifique o console para mais detalhes.';
      
      // Tentar usar fallback se for erro de rede
      if (errorMessage.includes('conexão') || errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        setLoadingMessage('Usando modo offline...');
        
        const fallbackResponse = getFallbackResponse(prompt);
        if (fallbackResponse) {
          setAiResponse(fallbackResponse);
          notifications.warning(
            'Modo Offline Ativado',
            'A API está indisponível. Usando exemplo pré-configurado.'
          );
          
          // Salvar no histórico mesmo sendo fallback
          saveToHistory(prompt, fallbackResponse, selectedDataset, { learningRate, epochs, batchSize });
          return;
        }
      }
      
      setError(errorMessage);
      notifications.error('Erro na Geração', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, generateUi, generateJs, selectedDataset, learningRate, epochs, batchSize, model]);

  const handleRefine = useCallback(async (refinementPrompt: string) => {
    if (!chatSession) {
      setError('A sessão de chat não foi iniciada. Por favor, gere uma IA primeiro.');
      return;
    }
     if (!refinementPrompt.trim()) {
      setError('Por favor, insira um prompt de refinamento.');
      return;
    }

    setIsRefining(true);
    setError(null);

    try {
      const response = await sendMessageToChat(chatSession, refinementPrompt);
      let finalResponse = response;

      // Re-translate to JS if it was generated before
      if (aiResponse?.jsCode) {
         const jsCode = await translatePythonToJs(response.pythonCode, response.explanation, prompt);
         finalResponse = { ...response, jsCode };
      }

      setAiResponse(finalResponse);
    } catch (err)
 {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido durante o refinamento. Verifique o console.');
    } finally {
      setIsRefining(false);
    }
  }, [chatSession, aiResponse, prompt]);

  const handleSelectTemplate = (template: any) => {
    setPrompt(template.prompt);
    setSelectedDataset(template.dataset);
    setLearningRate(template.hyperparams.learningRate);
    setEpochs(template.hyperparams.epochs);
    setBatchSize(template.hyperparams.batchSize);
    setGenerateUi(template.generateUi);
    setShowTemplateSelector(false);
    notifications.templateApplied(template.name);
  };

  const handleLoadProject = (historyItem: any) => {
    setPrompt(historyItem.prompt);
    setAiResponse(historyItem.response);
    setSelectedDataset(historyItem.dataset);
    setLearningRate(historyItem.hyperparams.learningRate);
    setEpochs(historyItem.hyperparams.epochs);
    setBatchSize(historyItem.hyperparams.batchSize);
    setShowProjectHistory(false);
  };

  const handleSettingsChange = (settings: any) => {
    // Aplicar configurações
    setModel(settings.defaultModel);
    setSelectedDataset(settings.defaultDataset);
    notifications.settingsSaved();
  };

  // Configurar atalhos de teclado
  const shortcuts = [
    {
      key: 'Enter',
      ctrlKey: true,
      action: handleGenerate,
      description: 'Gerar IA'
    },
    {
      key: 't',
      ctrlKey: true,
      action: () => setShowTemplateSelector(true),
      description: 'Abrir Templates'
    },
    {
      key: 'h',
      ctrlKey: true,
      action: () => setShowProjectHistory(true),
      description: 'Abrir Histórico'
    },
    {
      key: 'm',
      ctrlKey: true,
      action: () => setShowPerformanceMetrics(true),
      description: 'Ver Métricas'
    },
    {
      key: 's',
      ctrlKey: true,
      shiftKey: true,
      action: () => setShowShareManager(true),
      description: 'Compartilhar Projeto'
    },
    {
      key: ',',
      ctrlKey: true,
      action: () => setShowSettingsManager(true),
      description: 'Configurações'
    },
    {
      key: '?',
      action: () => setShowShortcutHelp(true),
      description: 'Mostrar Ajuda'
    }
  ];

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="min-h-screen bg-gray-900 font-sans text-gray-200">
      {showDataVisualizer && selectedDataset !== 'none' && (
        <DataVisualizer dataset={selectedDataset} onClose={() => setShowDataVisualizer(false)} />
      )}
      {showTemplateSelector && (
        <TemplateSelector 
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplateSelector(false)} 
        />
      )}
      {showProjectHistory && (
        <ProjectHistory 
          onLoadProject={handleLoadProject}
          onClose={() => setShowProjectHistory(false)} 
        />
      )}
      {showPerformanceMetrics && (
        <PerformanceMetrics onClose={() => setShowPerformanceMetrics(false)} />
      )}
      {showShareManager && aiResponse && (
        <ShareManager 
          response={aiResponse}
          prompt={prompt}
          onClose={() => setShowShareManager(false)} 
        />
      )}
      {showSettingsManager && (
        <SettingsManager 
          onClose={() => setShowSettingsManager(false)}
          onSettingsChange={handleSettingsChange}
        />
      )}
      {showShortcutHelp && (
        <ShortcutHelp 
          shortcuts={shortcuts}
          onClose={() => setShowShortcutHelp(false)}
        />
      )}
      {showApiSetupGuide && (
        <ApiSetupGuide onClose={() => setShowApiSetupGuide(false)} />
      )}
      
      <SystemStatus />
      
      {/* Header com navegação */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-white">Criador de Redes Neurais <span className="text-purple-400">AI</span></h1>
              <ApiStatusIndicator />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                📋 Templates
              </button>
              <button
                onClick={() => setShowProjectHistory(true)}
                className="px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                📚 Histórico
              </button>
              <button
                onClick={() => setShowPerformanceMetrics(true)}
                className="px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                📊 Métricas
              </button>
              <button
                onClick={() => setShowShareManager(true)}
                disabled={!aiResponse}
                className="px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                🔗 Compartilhar
              </button>
              <button
                onClick={() => setShowSettingsManager(true)}
                className="px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                ⚙️ Configurações
              </button>
              <button
                onClick={() => setShowApiSetupGuide(true)}
                className="px-3 py-2 text-sm bg-blue-700 text-gray-300 rounded-lg hover:bg-blue-600 transition-colors"
                title="Configurar API Gemini"
              >
                🔧 Setup API
              </button>
              <button
                onClick={() => setShowShortcutHelp(true)}
                className="px-2 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                title="Atalhos de Teclado (Pressione ?)"
              >
                ⌨️
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <div className="sticky top-8 bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-2xl shadow-purple-500/10">
              <p className="text-gray-400 mb-6 text-sm">Descreva um modelo de IA, e eu irei gerar o código Python, uma explicação e uma visualização da rede.</p>
              <PromptForm
                prompt={prompt}
                setPrompt={setPrompt}
                onSubmit={handleGenerate}
                isLoading={isLoading}
                generateUi={generateUi}
                setGenerateUi={setGenerateUi}
                generateJs={generateJs}
                setGenerateJs={setGenerateJs}
                selectedDataset={selectedDataset}
                setSelectedDataset={setSelectedDataset}
                onVisualize={() => setShowDataVisualizer(true)}
                learningRate={learningRate}
                setLearningRate={setLearningRate}
                epochs={epochs}
                setEpochs={setEpochs}
                batchSize={batchSize}
                setBatchSize={setBatchSize}
                model={model}
                setModel={setModel}
              />
              {error && (
                <div className="mt-4 bg-red-900/50 border border-red-500 p-3 rounded-lg">
                  <p className="text-sm text-red-400 mb-2">{error}</p>
                  {(error.includes('conexão') || error.includes('autenticação') || error.includes('API_KEY')) && (
                    <button
                      onClick={() => setShowApiSetupGuide(true)}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                    >
                      🔧 Configurar API
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full min-h-[500px]">
                <LoadingSpinner />
                <p className="mt-4 text-lg text-purple-300 animate-pulse">{loadingMessage}</p>
                <p className="text-sm text-gray-400">Isso pode levar um momento.</p>
              </div>
            )}
            {!isLoading && !aiResponse && <Hero />}
            {aiResponse && (
              <OutputDisplay 
                response={aiResponse} 
                prompt={prompt} 
                onRefine={handleRefine}
                isRefining={isRefining}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
};

export default App;