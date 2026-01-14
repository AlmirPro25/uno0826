import React, { useState } from 'react';
import InputSection from './components/InputSection';
import ResultSection from './components/ResultSection';
import ChatInterface from './components/ChatInterface';
import LiveMonitor from './components/LiveMonitor';
import { TriageInput, TriageOutput } from './types';
import { analyzeClinicalCase } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'triage' | 'knowledge' | 'live'>('triage');
  const [triageData, setTriageData] = useState<TriageOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill state for when transferring from Live Monitor
  const [prefilledText, setPrefilledText] = useState('');

  const handleTriageSubmit = async (inputData: TriageInput) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeClinicalCase(inputData);
      setTriageData(result);
    } catch (err) {
      setError("Falha ao processar o caso clínico. Por favor, tente novamente ou verifique a conexão.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLiveFinalize = (transcript: string) => {
    setPrefilledText(transcript);
    setActiveTab('triage');
  };

  const resetTriage = () => {
    setTriageData(null);
    setError(null);
    setPrefilledText('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Navbar */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              M
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">MCC-01</h1>
              <span className="text-xs text-slate-500 font-medium">Medical Cognitive Core</span>
            </div>
          </div>
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
            <button 
              onClick={() => setActiveTab('triage')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'triage' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Triagem Clássica
            </button>
            <button 
               onClick={() => setActiveTab('live')}
               className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center ${activeTab === 'live' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
            >
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              Ambient Monitor (Alpha)
            </button>
            <button 
               onClick={() => setActiveTab('knowledge')}
               className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'knowledge' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Knowledge
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm" role="alert">
            <p className="font-bold">Erro de Sistema</p>
            <p>{error}</p>
          </div>
        )}

        {activeTab === 'triage' && (
          <div className="space-y-6 animate-fade-in">
            {!triageData ? (
               <InputSection 
                  onSubmit={handleTriageSubmit} 
                  isLoading={loading} 
                  initialText={prefilledText}
               />
            ) : (
               <ResultSection data={triageData} onReset={resetTriage} />
            )}
          </div>
        )}

        {activeTab === 'live' && (
          <div className="animate-fade-in">
             <div className="mb-4 flex items-center justify-between">
                <div>
                   <h2 className="text-lg font-bold text-slate-800">Monitoramento Ambiente</h2>
                   <p className="text-sm text-slate-500">O sistema escuta, estrutura e analisa risco em tempo real. Não é necessário digitar.</p>
                </div>
                <div className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">Exp: Gemini 2.5 Flash</div>
             </div>
             <LiveMonitor onFinalize={handleLiveFinalize} />
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <ChatInterface />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
            <p>© 2025 MCC-01 Medical Cognitive Core. Versão Alpha 0.9.3 (Ambient Ready)</p>
            <div className="flex items-center space-x-4 mt-2 md:mt-0">
               <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-400 mr-1"></div> System Online</span>
               <span>•</span>
               <span>Powered by Gemini 3 Pro & Flash</span>
            </div>
          </div>
          <div className="mt-4 text-[10px] text-slate-300 text-center">
            Este software é uma demonstração técnica. Não possui certificação Anvisa/FDA para uso clínico real.
            Dados processados são efêmeros.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;