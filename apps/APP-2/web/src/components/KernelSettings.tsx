import { useState, useEffect } from 'react';
import { useKernelStore } from '@/stores/kernelStore';
import * as kernelApi from '@/services/kernel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  CloudIcon, 
  LinkIcon, 
  UnlinkIcon, 
  LogInIcon, 
  LogOutIcon,
  CrownIcon,
  CheckCircleIcon,
  XCircleIcon,
  Loader2Icon,
  ShieldIcon,
  ZapIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function KernelSettings() {
  const { 
    enabled, linked, kernelUrl, user, limits,
    setEnabled, setLinked, setKernelUrl, setUser, setLimits, reset 
  } = useKernelStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customUrl, setCustomUrl] = useState(kernelUrl);

  // Fetch status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const status = await kernelApi.getKernelStatus();
      setEnabled(status.enabled);
      setLinked(status.linked);
      if (status.kernel_url) setKernelUrl(status.kernel_url);
      
      if (status.enabled) {
        const planLimits = await kernelApi.getPlanLimits();
        setLimits(planLimits);
      }
    } catch (err) {
      console.error('Failed to fetch kernel status:', err);
    }
  };

  const handleEnable = async () => {
    setLoading(true);
    setError(null);
    try {
      await kernelApi.enableKernel(customUrl);
      setEnabled(true);
      setKernelUrl(customUrl);
      await fetchStatus();
    } catch (err) {
      setError('Falha ao habilitar integração');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    setError(null);
    try {
      await kernelApi.disableKernel();
      reset();
    } catch (err) {
      setError('Falha ao desabilitar integração');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await kernelApi.loginToKernel(email, password);
      setUser(response.user);
      setShowLogin(false);
      setEmail('');
      setPassword('');
      
      // Auto-link identity after login
      try {
        await kernelApi.linkIdentity();
        setLinked(true);
      } catch {
        // Link is optional
      }
      
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await kernelApi.logoutFromKernel();
      setUser(null);
      setLinked(false);
      await fetchStatus();
    } catch (err) {
      setError('Falha no logout');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { checkout_url } = await kernelApi.getCheckoutUrl();
      window.open(checkout_url, '_blank');
    } catch (err: any) {
      setError(err.message || 'Falha ao criar checkout');
    } finally {
      setLoading(false);
    }
  };

  const isPro = limits.video_calls && limits.max_peers < 0;

  return (
    <div className="bg-nexus-carbon border border-nexus-grey rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-nexus-accent-green flex items-center">
          <CloudIcon className="mr-2" size={24} />
          Integração Prost-QS
        </h2>
        {enabled && (
          <span className={cn(
            "px-2 py-1 rounded text-xs font-medium",
            linked ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
          )}>
            {linked ? "Vinculado" : "Não vinculado"}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Enable/Disable Toggle */}
      {!enabled ? (
        <div className="space-y-4">
          <p className="text-nexus-light-grey text-sm">
            Conecte seu nó Nexus ao kernel Prost-QS para desbloquear recursos premium,
            sincronizar perfil e obter telemetria avançada.
          </p>
          
          <div className="space-y-2">
            <label className="text-sm text-nexus-muted-foreground">URL do Kernel</label>
            <Input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://uno0826.onrender.com"
              className="bg-nexus-grey border-nexus-accent-green"
            />
          </div>

          <Button
            onClick={handleEnable}
            disabled={loading}
            className="w-full bg-nexus-accent-green hover:bg-nexus-success-green text-nexus-black"
          >
            {loading ? <Loader2Icon className="animate-spin mr-2" size={18} /> : <LinkIcon className="mr-2" size={18} />}
            Habilitar Integração
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 bg-nexus-grey rounded">
            <div className="flex items-center">
              <CheckCircleIcon className="text-green-400 mr-2" size={18} />
              <span className="text-nexus-light-grey text-sm">Conectado a {kernelUrl}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisable}
              disabled={loading}
              className="text-red-400 hover:text-red-300"
            >
              <UnlinkIcon size={16} />
            </Button>
          </div>

          {/* User Section */}
          {user ? (
            <div className="p-4 bg-nexus-grey rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-nexus-accent-amber font-medium">{user.name}</p>
                  <p className="text-nexus-muted-foreground text-sm">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={loading}
                  className="text-nexus-light-grey"
                >
                  <LogOutIcon size={16} className="mr-1" />
                  Sair
                </Button>
              </div>
              
              {/* Plan Badge */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center">
                  {isPro ? (
                    <CrownIcon className="text-yellow-400 mr-2" size={18} />
                  ) : (
                    <ShieldIcon className="text-nexus-light-grey mr-2" size={18} />
                  )}
                  <span className={cn(
                    "font-medium",
                    isPro ? "text-yellow-400" : "text-nexus-light-grey"
                  )}>
                    Plano {isPro ? "Pro" : "Free"}
                  </span>
                </div>
                {!isPro && (
                  <Button
                    size="sm"
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
                  >
                    <ZapIcon size={14} className="mr-1" />
                    Upgrade
                  </Button>
                )}
              </div>
            </div>
          ) : showLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-nexus-grey border-nexus-accent-green"
                required
              />
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-nexus-grey border-nexus-accent-green"
                required
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-nexus-accent-green hover:bg-nexus-success-green text-nexus-black"
                >
                  {loading ? <Loader2Icon className="animate-spin" size={18} /> : "Entrar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowLogin(false)}
                  className="border-nexus-grey"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <Button
              onClick={() => setShowLogin(true)}
              className="w-full bg-nexus-accent-amber hover:bg-yellow-500 text-nexus-black"
            >
              <LogInIcon className="mr-2" size={18} />
              Fazer Login no Kernel
            </Button>
          )}

          {/* Limits Display */}
          <div className="border-t border-nexus-grey pt-4">
            <h3 className="text-sm font-medium text-nexus-light-grey mb-3">Limites do Plano</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <LimitItem 
                label="Peers simultâneos" 
                value={limits.max_peers < 0 ? "∞" : limits.max_peers} 
                isPro={limits.max_peers < 0}
              />
              <LimitItem 
                label="Tamanho de arquivo" 
                value={limits.max_file_size_mb < 0 ? "∞" : `${limits.max_file_size_mb}MB`}
                isPro={limits.max_file_size_mb > 100}
              />
              <LimitItem 
                label="Comunidades" 
                value={limits.max_communities < 0 ? "∞" : limits.max_communities}
                isPro={limits.max_communities < 0}
              />
              <LimitItem 
                label="Histórico" 
                value={limits.history_days < 0 ? "∞" : `${limits.history_days} dias`}
                isPro={limits.history_days < 0}
              />
              <LimitItem 
                label="Chamadas de vídeo" 
                value={limits.video_calls ? "Sim" : "Não"}
                isPro={limits.video_calls}
                isBoolean
              />
              <LimitItem 
                label="Relay prioritário" 
                value={limits.priority_relay ? "Sim" : "Não"}
                isPro={limits.priority_relay}
                isBoolean
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LimitItem({ 
  label, 
  value, 
  isPro,
  isBoolean = false 
}: { 
  label: string; 
  value: string | number; 
  isPro: boolean;
  isBoolean?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-2 bg-nexus-black rounded">
      <span className="text-nexus-muted-foreground">{label}</span>
      <span className={cn(
        "font-medium",
        isPro ? "text-yellow-400" : "text-nexus-light-grey",
        isBoolean && !isPro && "text-red-400"
      )}>
        {isBoolean ? (
          isPro ? <CheckCircleIcon size={16} /> : <XCircleIcon size={16} />
        ) : (
          value
        )}
      </span>
    </div>
  );
}
