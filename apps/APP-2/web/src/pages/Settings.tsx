import { useState } from 'react';
import { useP2PStore } from '@/stores/p2pStore';
import { KernelSettings } from '@/components/KernelSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  SettingsIcon, 
  UserIcon, 
  NetworkIcon, 
  ShieldIcon,
  DatabaseIcon,
  KeyIcon,
  SaveIcon,
  ArrowLeftIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'network' | 'security' | 'kernel' | 'storage';

interface SettingsProps {
  onBack?: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const { localPeerId, apiStatus } = useP2PStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('kernel');
  const [nickname, setNickname] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSaveProfile = () => {
    // Save to local storage or backend
    localStorage.setItem('nexus_nickname', nickname);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'kernel', label: 'Prost-QS', icon: <NetworkIcon size={18} /> },
    { id: 'profile', label: 'Perfil', icon: <UserIcon size={18} /> },
    { id: 'network', label: 'Rede', icon: <NetworkIcon size={18} /> },
    { id: 'security', label: 'Segurança', icon: <ShieldIcon size={18} /> },
    { id: 'storage', label: 'Armazenamento', icon: <DatabaseIcon size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-nexus-black text-nexus-accent-green p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={onBack || (() => window.location.hash = '')} 
            className="mr-4 p-2 hover:bg-nexus-grey rounded"
          >
            <ArrowLeftIcon size={20} />
          </button>
          <h1 className="text-2xl font-bold flex items-center">
            <SettingsIcon className="mr-2" size={28} />
            Configurações
          </h1>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <nav className="w-48 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors",
                  activeTab === tab.id
                    ? "bg-nexus-accent-green text-nexus-black"
                    : "text-nexus-light-grey hover:bg-nexus-grey"
                )}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'kernel' && <KernelSettings />}

            {activeTab === 'profile' && (
              <div className="bg-nexus-carbon border border-nexus-grey rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <UserIcon className="mr-2" size={24} />
                  Perfil Local
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-nexus-muted-foreground mb-2">
                      Peer ID
                    </label>
                    <div className="p-3 bg-nexus-grey rounded font-mono text-xs text-nexus-accent-amber break-all">
                      {localPeerId || 'Carregando...'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-nexus-muted-foreground mb-2">
                      Apelido (visível para outros peers)
                    </label>
                    <Input
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Seu apelido na rede"
                      className="bg-nexus-grey border-nexus-accent-green"
                    />
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    className="bg-nexus-accent-green hover:bg-nexus-success-green text-nexus-black"
                  >
                    <SaveIcon className="mr-2" size={18} />
                    {saved ? 'Salvo!' : 'Salvar Perfil'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'network' && (
              <div className="bg-nexus-carbon border border-nexus-grey rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <NetworkIcon className="mr-2" size={24} />
                  Configurações de Rede
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-nexus-muted-foreground mb-2">
                      Endereços de Escuta
                    </label>
                    <div className="p-3 bg-nexus-grey rounded space-y-1">
                      {apiStatus?.listen_addrs?.map((addr: string, i: number) => (
                        <div key={i} className="font-mono text-xs text-nexus-light-grey">
                          {addr}
                        </div>
                      )) || <span className="text-nexus-muted-foreground">Carregando...</span>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-nexus-muted-foreground mb-2">
                      Versão do Nó
                    </label>
                    <div className="p-3 bg-nexus-grey rounded text-nexus-accent-amber">
                      {apiStatus?.version || '0.1.0-alpha'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-nexus-muted-foreground mb-2">
                      Uptime
                    </label>
                    <div className="p-3 bg-nexus-grey rounded text-nexus-light-grey">
                      {apiStatus?.uptime_seconds 
                        ? `${Math.floor(apiStatus.uptime_seconds / 60)} minutos`
                        : 'Carregando...'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-nexus-carbon border border-nexus-grey rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <ShieldIcon className="mr-2" size={24} />
                  Segurança
                </h2>

                <div className="space-y-4">
                  <div className="p-4 bg-nexus-grey rounded-lg">
                    <div className="flex items-center mb-2">
                      <KeyIcon className="text-nexus-accent-green mr-2" size={18} />
                      <span className="font-medium">Identidade Criptográfica</span>
                    </div>
                    <p className="text-sm text-nexus-muted-foreground">
                      Sua identidade é baseada em um par de chaves Ed25519 armazenado localmente
                      e protegido por senha. Ninguém além de você tem acesso à sua chave privada.
                    </p>
                  </div>

                  <div className="p-4 bg-nexus-grey rounded-lg">
                    <div className="flex items-center mb-2">
                      <ShieldIcon className="text-nexus-accent-green mr-2" size={18} />
                      <span className="font-medium">Criptografia de Transporte</span>
                    </div>
                    <p className="text-sm text-nexus-muted-foreground">
                      Toda comunicação P2P usa TLS/Noise para criptografia de ponta a ponta.
                      Chamadas WebRTC usam DTLS/SRTP.
                    </p>
                  </div>

                  <div className="p-4 bg-nexus-grey rounded-lg">
                    <div className="flex items-center mb-2">
                      <DatabaseIcon className="text-nexus-accent-green mr-2" size={18} />
                      <span className="font-medium">Banco de Dados Criptografado</span>
                    </div>
                    <p className="text-sm text-nexus-muted-foreground">
                      Seus dados locais são armazenados em SQLite com SQLCipher,
                      criptografados com AES-256.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="bg-nexus-carbon border border-nexus-grey rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <DatabaseIcon className="mr-2" size={24} />
                  Armazenamento
                </h2>

                <div className="space-y-4">
                  <div className="p-4 bg-nexus-grey rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Banco de Dados Local</span>
                      <span className="text-nexus-accent-amber">SQLite + SQLCipher</span>
                    </div>
                    <p className="text-sm text-nexus-muted-foreground">
                      Mensagens, peers e configurações são armazenados localmente.
                    </p>
                  </div>

                  <div className="p-4 bg-nexus-grey rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Arquivos Compartilhados</span>
                      <span className="text-nexus-accent-amber">Swarm Chunks</span>
                    </div>
                    <p className="text-sm text-nexus-muted-foreground">
                      Arquivos são divididos em chunks e distribuídos pela rede P2P.
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full border-red-500 text-red-400 hover:bg-red-500/20"
                  >
                    Limpar Cache Local
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Alias for new App.tsx
export { Settings as SettingsPage };
