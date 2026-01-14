/**
 * 🌐 Local Preview Component
 * Exibe o preview do servidor de desenvolvimento local
 * Funciona tanto com WebContainer quanto com servidor local real
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Loader2, RefreshCw, ExternalLink, Globe, AlertCircle, Wifi, WifiOff, Terminal, ChevronDown, ChevronUp, X, Smartphone, Monitor, Tablet } from 'lucide-react';

interface LocalPreviewProps {
  url: string | null;
  className?: string;
  reloadSignal?: number;
  isLocalMode?: boolean;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const VIEWPORT_SIZES: Record<ViewportSize, { width: string; icon: React.ReactNode; label: string }> = {
  desktop: { width: '100%', icon: <Monitor className="w-3.5 h-3.5" />, label: 'Desktop' },
  tablet: { width: '768px', icon: <Tablet className="w-3.5 h-3.5" />, label: 'Tablet' },
  mobile: { width: '375px', icon: <Smartphone className="w-3.5 h-3.5" />, label: 'Mobile' },
};

export const LocalPreview: React.FC<LocalPreviewProps> = ({ 
  url, 
  className = "",
  reloadSignal = 0,
  isLocalMode = false
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [retryCount, setRetryCount] = useState(0);
  const prevSignalRef = useRef(reloadSignal);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [showConsole, setShowConsole] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: string; message: string; time: string }>>([]);

  // Verificar se o servidor está respondendo
  const checkServerHealth = useCallback(async () => {
    if (!url) return false;
    
    try {
      // Tentar fazer um fetch para verificar se o servidor está vivo
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      // Tentar múltiplas portas comuns se a URL principal falhar
      // Priorizar portas do workspace (4xxx) antes das portas reservadas
      const urlObj = new URL(url);
      const portsToTry = [urlObj.port, '4173', '4174', '4175', '4000', '4001', '3000', '8080'];
      
      for (const port of portsToTry) {
        // Pular portas reservadas do sistema
        if (port === '5173' || port === '3001') continue;
        try {
          const testUrl = `${urlObj.protocol}//${urlObj.hostname}:${port}`;
          const response = await fetch(testUrl, { 
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          setConnectionStatus('connected');
          
          // Se encontrou em uma porta diferente, atualizar
          if (port !== urlObj.port && iframeRef.current) {
            console.log(`[LocalPreview] Server found on port ${port}`);
          }
          return true;
        } catch (e) {
          // Tentar próxima porta
          continue;
        }
      }
      
      clearTimeout(timeoutId);
      setConnectionStatus('disconnected');
      return false;
    } catch (e) {
      setConnectionStatus('disconnected');
      return false;
    }
  }, [url]);

  // Verificar saúde do servidor periodicamente
  useEffect(() => {
    if (url && isLocalMode) {
      checkServerHealth();
      
      // Verificar a cada 5 segundos
      checkIntervalRef.current = setInterval(() => {
        checkServerHealth();
      }, 5000);
      
      return () => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
      };
    }
  }, [url, isLocalMode, checkServerHealth]);

  // Reload quando o sinal mudar
  useEffect(() => {
    if (reloadSignal !== prevSignalRef.current && url) {
      prevSignalRef.current = reloadSignal;
      handleReload();
    }
  }, [reloadSignal, url]);

  // Reset loading state quando URL mudar
  useEffect(() => {
    if (url) {
      setIsLoading(true);
      setError(null);
      setRetryCount(0);
      setConnectionStatus('checking');
    }
  }, [url]);

  // Escutar mensagens do iframe (console logs)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'console') {
        const time = new Date().toLocaleTimeString();
        setConsoleLogs(prev => [...prev.slice(-99), { 
          type: event.data.level || 'log', 
          message: event.data.message,
          time 
        }]);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleReload = () => {
    if (iframeRef.current && url) {
      setIsLoading(true);
      setError(null);
      // Adicionar timestamp para forçar reload
      const separator = url.includes('?') ? '&' : '?';
      iframeRef.current.src = url + separator + '_t=' + Date.now();
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
    setConnectionStatus('connected');
    setRetryCount(0);
  };

  const handleError = () => {
    setIsLoading(false);
    
    // Auto-retry até 3 vezes
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        handleReload();
      }, 2000);
      return;
    }
    
    setError('Failed to load preview. Is the dev server running?');
    setConnectionStatus('disconnected');
  };

  const openExternal = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (!url) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-900 text-slate-400 ${className}`}>
        <Globe className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm">No server running</p>
        <p className="text-xs mt-1 opacity-60">Start the dev server to see preview</p>
      </div>
    );
  }

  return (
    <div className={`relative bg-white ${className}`}>
      {/* Toolbar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 backdrop-blur border-b border-slate-700">
        {/* Connection Status */}
        {connectionStatus === 'connected' ? (
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
        ) : connectionStatus === 'disconnected' ? (
          <WifiOff className="w-3.5 h-3.5 text-red-400" />
        ) : (
          <Loader2 className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
        )}
        
        <span className="text-xs text-slate-300 truncate flex-1 font-mono">{url}</span>
        
        {/* Viewport Switcher */}
        <div className="flex items-center gap-0.5 bg-slate-700/50 rounded p-0.5">
          {(Object.keys(VIEWPORT_SIZES) as ViewportSize[]).map((size) => (
            <button
              key={size}
              onClick={() => setViewport(size)}
              className={`p-1 rounded transition-colors ${
                viewport === size 
                  ? 'bg-indigo-500 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title={VIEWPORT_SIZES[size].label}
            >
              {VIEWPORT_SIZES[size].icon}
            </button>
          ))}
        </div>
        
        {/* Mode Badge */}
        {isLocalMode && (
          <span className="px-1.5 py-0.5 text-[9px] bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
            LOCAL
          </span>
        )}
        
        {/* Console Toggle */}
        <button
          onClick={() => setShowConsole(!showConsole)}
          className={`p-1 rounded transition-colors relative ${
            showConsole ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
          title="Toggle Console"
        >
          <Terminal className="w-3.5 h-3.5" />
          {consoleLogs.length > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center">
              {consoleLogs.length > 9 ? '9+' : consoleLogs.length}
            </span>
          )}
        </button>
        
        <button
          onClick={handleReload}
          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
          title="Reload"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
        
        <button
          onClick={openExternal}
          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
          title="Open in browser"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-5 pt-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <span className="text-sm text-slate-400">
              {retryCount > 0 ? `Retrying... (${retryCount}/3)` : 'Loading preview...'}
            </span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-5 pt-8">
          <div className="flex flex-col items-center gap-3 text-center px-4">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm text-slate-300">{error}</p>
            <div className="flex gap-2">
              <button
                onClick={handleReload}
                className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 rounded text-white transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={openExternal}
                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
              >
                Open External
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Iframe Container - com viewport responsivo */}
      <div className={`flex-1 flex items-start justify-center pt-10 pb-2 px-2 overflow-auto ${showConsole ? 'h-[60%]' : 'h-full'}`}>
        <iframe
          ref={iframeRef}
          src={url}
          title="Local Preview"
          style={{ 
            width: VIEWPORT_SIZES[viewport].width,
            maxWidth: '100%',
            height: viewport === 'desktop' ? '100%' : 'calc(100% - 16px)',
            transition: 'width 0.3s ease'
          }}
          className={`border-0 bg-white ${viewport !== 'desktop' ? 'rounded-lg shadow-2xl border border-slate-600' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
          allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; clipboard-read; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
        />
      </div>

      {/* Console Panel */}
      {showConsole && (
        <div className="h-[40%] bg-slate-900 border-t border-slate-700 flex flex-col">
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700">
            <span className="text-xs text-slate-400 font-medium">Console</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConsoleLogs([])}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowConsole(false)}
                className="p-0.5 hover:bg-white/10 rounded text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2 font-mono text-xs">
            {consoleLogs.length === 0 ? (
              <div className="text-slate-600 text-center py-4">No console output</div>
            ) : (
              consoleLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`py-0.5 px-2 rounded mb-0.5 ${
                    log.type === 'error' ? 'bg-red-500/10 text-red-400' :
                    log.type === 'warn' ? 'bg-yellow-500/10 text-yellow-400' :
                    'text-slate-400'
                  }`}
                >
                  <span className="text-slate-600 mr-2">{log.time}</span>
                  {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
