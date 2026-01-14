import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { LayoutDashboard, Video, Search, Activity, Menu, X, BrainCircuit, History, UserCog, CalendarRange, MessageSquareText, Bluetooth } from 'lucide-react';
import { AppView } from './types';
import { Dashboard } from './components/Dashboard';
import { LiveSession } from './components/LiveSession';
import { AnalysisModule } from './components/AnalysisModule';
import { HistoryLog } from './components/HistoryLog';
import { ProfileSettings } from './components/ProfileSettings';
import { Planner } from './components/Planner';
import { NeuralChat } from './components/NeuralChat';
import { VoiceCommander } from './components/VoiceCommander';
import { DeviceHub } from './components/DeviceHub';
import { GEMINI_API_KEY } from './constants';
import { AppProvider, useAppContext } from './context/AppContext';

const AppContent: React.FC = () => {
  const { currentView, navigate, playSound } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  useEffect(() => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.length === 0) {
      setApiKeyMissing(true);
    }
  }, []);

  const NavButton = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => (
    <button
      onClick={() => {
        playSound('click');
        navigate(view);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 ${
        currentView === view
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  if (apiKeyMissing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-red-500/50 p-8 rounded-2xl max-w-md text-center">
          <Activity className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-white mb-2">Configuração Necessária</h1>
          <p className="text-slate-400">
            A chave de API do Gemini não foi detectada. Por favor, adicione sua chave ao ambiente para iniciar o sistema Nova.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <BrainCircuit size={24} className="text-white" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">NOVA</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-400">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div className="flex h-screen overflow-hidden">
        
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-8 hidden lg:flex">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BrainCircuit size={24} className="text-white" />
              </div>
              <span className="font-bold text-2xl text-white tracking-tight">NOVA</span>
            </div>

            <nav className="space-y-2 flex-1">
              <NavButton view={AppView.DASHBOARD} icon={LayoutDashboard} label="Painel Principal" />
              <NavButton view={AppView.PLANNER} icon={CalendarRange} label="Neuro-Planner" />
              <NavButton view={AppView.LIVE_SESSION} icon={Video} label="Treino Neural" />
              <NavButton view={AppView.CHAT} icon={MessageSquareText} label="Chat Tático" />
              <NavButton view={AppView.ANALYSIS} icon={Search} label="Bio Análise" />
              
              <div className="my-4 border-t border-slate-800/50"></div>
              
              <NavButton view={AppView.DEVICES} icon={Bluetooth} label="Sensores" />
              <NavButton view={AppView.HISTORY} icon={History} label="Memória" />
              <NavButton view={AppView.PROFILE} icon={UserCog} label="Calibragem" />
            </nav>

            <div className="pt-8">
              <div className="px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-300">SISTEMA ONLINE</span>
                </div>
                <p className="text-[10px] text-slate-500">Gemini 1.5 Pro • Low Latency</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto relative w-full">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto h-full">
            
            {currentView === AppView.DASHBOARD && <Dashboard />}
            
            {currentView === AppView.PLANNER && <Planner />}

            {currentView === AppView.LIVE_SESSION && (
              <div className="h-[calc(100vh-6rem)] lg:h-[calc(100vh-4rem)]">
                <LiveSession />
              </div>
            )}

            {currentView === AppView.CHAT && <NeuralChat />}
            
            {currentView === AppView.ANALYSIS && <AnalysisModule />}

            {currentView === AppView.DEVICES && <DeviceHub />}

            {currentView === AppView.HISTORY && <HistoryLog />}

            {currentView === AppView.PROFILE && <ProfileSettings />}
            
          </div>
        </main>
        
        {/* Global Components */}
        <VoiceCommander />

      </div>
      
      {/* Overlay for mobile sidebar */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);