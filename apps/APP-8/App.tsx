import React, { useState, useEffect } from 'react';
import UnifiedInterface from './components/UnifiedInterfaceWithMaestro';
import FloatingActionButton from './components/FloatingActionButton';
import ThinkingMode from './components/ThinkingMode';
import HistoryPanel from './components/HistoryPanel';
import PersonalitySettings from './components/PersonalitySettings';
import MemoryPanel from './components/MemoryPanel';
import ProactiveSuggestions from './components/ProactiveSuggestions';
// Serviços antigos removidos - agora usa backend SQLite3
// import { databaseService } from './services/databaseService';
// import { personalityService } from './services/personalityService';
// import { memoryService } from './services/memoryService';
// import { proactiveService } from './services/proactiveService';
// import { checkStorageHealth, cleanupStorage, formatSize } from './utils/storageUtils';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // FIX: Made aistudio optional to resolve declaration conflict.
    aistudio?: AIStudio;
    webkitAudioContext: typeof AudioContext;
  }
}

if (typeof window !== 'undefined' && !window.aistudio) {
    (window as any).aistudio = {
        hasSelectedApiKey: () => Promise.resolve(true),
        openSelectKey: () => Promise.resolve(),
    };
}


function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [apiKeySelected, setApiKeySelected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMemoryPanelOpen, setIsMemoryPanelOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        setIsLoading(true);
        
        // MIGRAÇÃO: Limpa localStorage antigo automaticamente
        console.log('🔄 Migrando para backend SQLite3...');
        try {
          // Tenta limpar dados antigos
          localStorage.removeItem('gemini-companion-db');
          localStorage.removeItem('long-term-memories');
          localStorage.removeItem('interaction-history');
          console.log('✅ localStorage antigo limpo');
        } catch (e) {
          console.warn('Aviso ao limpar localStorage:', e);
        }
        
        // Agora usa apenas o backend - não precisa mais do databaseService local
        const hasKey = await window.aistudio?.hasSelectedApiKey();
        setApiKeySelected(!!hasKey);
        
        console.log('✅ Sistema migrado para backend SQLite3');
      } catch (e: any) {
        console.error("Application initialization failed:", e);
        setError("Falha ao inicializar. Tente recarregar a página.");
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  // Global keyboard shortcut for screen capture
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('startCapture'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectKey = async () => {
    // FIX: Use optional chaining as aistudio can be undefined.
    await window.aistudio?.openSelectKey();
    setApiKeySelected(true);
  };
  
  const handleToggleSession = () => {
    if (!apiKeySelected) {
        handleSelectKey();
        return;
    }
    // If we're stopping the session, also exit thinking mode
    if(isSessionActive) {
      setIsThinkingMode(false);
    }
    setIsSessionActive(prev => !prev);
  };
  
  const handleCaptureScreen = () => {
    if (!apiKeySelected) {
        handleSelectKey();
        return;
    }
    // Dispatch event for UnifiedInterface to handle
    window.dispatchEvent(new CustomEvent('startCapture'));
  }
  
  const handleToggleThinkingMode = () => {
      setIsThinkingMode(prev => !prev);
  }
  
  const handleToggleHistoryPanel = () => {
      setIsHistoryPanelOpen(prev => !prev);
  }

  const handleToggleSettings = () => {
      setIsSettingsOpen(prev => !prev);
  }

  const handleToggleMemoryPanel = () => {
      setIsMemoryPanelOpen(prev => !prev);
  }

  const renderApiKeyPrompt = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4">
        <h2 className="text-2xl font-bold mb-4">API Key Required</h2>
        <p className="text-gray-400 mb-6 max-w-md text-center">
            To use the advanced features of this application, please select an API key.
            Your key is used to interact with Google's Gemini models. For more information on billing, please visit <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline hover:text-purple-300">our documentation</a>.
        </p>
        <button 
            onClick={handleSelectKey}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors duration-300"
        >
            Select API Key
        </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Erro de Inicialização</h2>
        <p className="text-gray-400 mb-6 max-w-md text-center">{error}</p>
        
        <div className="mb-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg max-w-md">
          <p className="text-sm text-blue-300 mb-2">
            ℹ️ O sistema foi migrado para backend SQLite3
          </p>
          <p className="text-xs text-gray-400">
            Não há mais limites de armazenamento!
          </p>
        </div>
        
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
        >
          Recarregar
        </button>
      </div>
    );
  }

  if (!apiKeySelected) {
      return renderApiKeyPrompt();
  }

  return (
    <div className="h-screen w-screen bg-gray-900 overflow-hidden relative">
        <main className="h-full w-full relative z-10">
          {isSessionActive ? (
             isThinkingMode ? <div className="w-full h-full bg-black/50 backdrop-blur-sm" /> : <UnifiedInterface />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-600">
                    Gemini Live Companion
                </h1>
                <p className="mt-4 text-lg text-gray-300 max-w-2xl">
                    Your personal AI partner. See your screen, hear your voice. Start a session to begin.
                </p>
            </div>
          )}
        </main>
        
        {isThinkingMode && <ThinkingMode onClose={handleToggleThinkingMode} />}
        
        <HistoryPanel isOpen={isHistoryPanelOpen} onClose={handleToggleHistoryPanel} />
        <PersonalitySettings isOpen={isSettingsOpen} onClose={handleToggleSettings} />
        <MemoryPanel isOpen={isMemoryPanelOpen} onClose={handleToggleMemoryPanel} />
        
        {isSessionActive && <ProactiveSuggestions />}
        
        <FloatingActionButton
            isSessionActive={isSessionActive}
            isThinkingMode={isThinkingMode}
            onToggleSession={handleToggleSession}
            onCaptureScreen={handleCaptureScreen}
            onToggleThinkingMode={handleToggleThinkingMode}
            onToggleHistory={handleToggleHistoryPanel}
            onToggleSettings={handleToggleSettings}
            onToggleMemory={handleToggleMemoryPanel}
        />
    </div>
  );
}

export default App;