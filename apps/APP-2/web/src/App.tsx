import { useState, useEffect } from 'react';
import { Home, MessageCircle, Users, Bell, User, Settings, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CallOverlay } from '@/components/CallOverlay';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { ToastProvider } from '@/components/ui/Toast';

// Pages - import from barrel file
import { 
  FeedPage, 
  MessagesPage, 
  CommunityPage, 
  NotificationsPage, 
  ProfilePage, 
  SettingsPage 
} from '@/pages';

type Page = 'feed' | 'messages' | 'community' | 'notifications' | 'profile' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('feed');
  const [isOnline, setIsOnline] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if first time user
  useEffect(() => {
    const onboardingComplete = localStorage.getItem('nexus_onboarding_complete');
    if (!onboardingComplete) {
      setShowWelcome(true);
    }
    setIsLoading(false);
  }, []);

  // Check connection status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/v1/status');
        setIsOnline(res.ok);
      } catch {
        setIsOnline(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'feed' as Page, icon: Home, label: 'Feed' },
    { id: 'messages' as Page, icon: MessageCircle, label: 'Chat' },
    { id: 'community' as Page, icon: Users, label: 'Mesh' },
    { id: 'notifications' as Page, icon: Bell, label: 'Alertas' },
    { id: 'profile' as Page, icon: User, label: 'Perfil' },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d0d15] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center animate-pulse">
            <Zap size={32} className="text-black" />
          </div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Welcome screen for new users
  if (showWelcome) {
    return <WelcomeScreen onComplete={() => setShowWelcome(false)} />;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d0d15] to-[#0a0a0f] text-white font-sans">
        {/* Global Call Overlay */}
        <CallOverlay />

        {/* Connection Status */}
        <ConnectionStatus />

        {/* Cyberpunk grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 136, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 136, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-cyan-500/20">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
              <Zap size={18} className="text-black" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              NEXUS
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs",
              isOnline 
                ? "bg-emerald-500/20 text-emerald-400" 
                : "bg-red-500/20 text-red-400"
            )}>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full animate-pulse",
                isOnline ? "bg-emerald-400" : "bg-red-400"
              )} />
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <button 
              onClick={() => setCurrentPage('settings')}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Settings size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 pb-20 min-h-screen">
        {currentPage === 'feed' && <FeedPage />}
        {currentPage === 'messages' && <MessagesPage />}
        {currentPage === 'community' && <CommunityPage />}
        {currentPage === 'notifications' && <NotificationsPage />}
        {currentPage === 'profile' && <ProfilePage />}
        {currentPage === 'settings' && <SettingsPage onBack={() => setCurrentPage('profile')} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-cyan-500/20">
        <div className="max-w-lg mx-auto px-2">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                    isActive 
                      ? "text-cyan-400" 
                      : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-lg transition-all",
                    isActive && "bg-cyan-500/20"
                  )}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        {/* Safe area for iOS */}
        <div className="h-safe-area-inset-bottom bg-[#0a0a0f]" />
      </nav>
    </div>
    </ToastProvider>
  );
}

export default App;
