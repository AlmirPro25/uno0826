import React, { useState, useEffect } from 'react';
import { Globe, ArrowLeft, ArrowRight, RotateCw, X, Plus, Camera, FileText, Zap, Wifi, WifiOff } from 'lucide-react';
import { useBrowserWebSocket } from '../hooks/useBrowserWebSocket';

interface BrowserInfo {
  url: string;
  title: string;
  tab_index: number;
  total_tabs: number;
}

/**
 * Controle de Navegador com WebSocket Direto
 * Conexão em tempo real com o Executor Python
 */
export const BrowserControlWebSocket: React.FC = () => {
  const { connected, connecting, error: wsError, sendCommand } = useBrowserWebSocket();
  
  const [browserOpen, setBrowserOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [command, setCommand] = useState('');
  const [executing, setExecuting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const checkBrowserStatus = async () => {
    if (!connected) return;
    
    try {
      const response = await sendCommand({ action: 'browser_info' });
      
      if (response.status === 'ok') {
        setBrowserInfo(response);
        setBrowserOpen(true);
        setError(null);
      } else {
        setBrowserOpen(false);
        setBrowserInfo(null);
      }
    } catch (err) {
      // Navegador não está aberto
      setBrowserOpen(false);
      setBrowserInfo(null);
    }
  };

  useEffect(() => {
    if (connected) {
      checkBrowserStatus();
      const interval = setInterval(checkBrowserStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [connected]);

  const handleOpenBrowser = async () => {
    setLoading(true);
    setError(null);
    addLog('Abrindo navegador...');
    
    try {
      const response = await sendCommand({
        action: 'browser_open',
        params: { headless: false }
      });
      
      if (response.status === 'ok') {
        setBrowserOpen(true);
        addLog('✅ Navegador aberto');
        await checkBrowserStatus();
      } else {
        setError(response.message || 'Erro ao abrir navegador');
        addLog('❌ Erro ao abrir navegador');
      }
    } catch (err: any) {
      setError(err.message);
      addLog('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseBrowser = async () => {
    setLoading(true);
    addLog('Fechando navegador...');
    
    try {
      await sendCommand({ action: 'browser_close' });
      setBrowserOpen(false);
      setBrowserInfo(null);
      addLog('✅ Navegador fechado');
    } catch (err: any) {
      setError('Erro ao fechar navegador');
      addLog('❌ Erro ao fechar');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = async () => {
    if (!url.trim()) return;
    
    setLoading(true);
    setError(null);
    addLog(`Navegando para ${url}...`);
    
    try {
      const response = await sendCommand({
        action: 'browser_goto',
        params: { url }
      });
      
      if (response.status === 'ok') {
        addLog(`✅ Página carregada: ${response.title}`);
        await checkBrowserStatus();
      } else {
        setError(response.message || 'Erro ao navegar');
        addLog('❌ Erro ao navegar');
      }
    } catch (err: any) {
      setError(err.message);
      addLog('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = async () => {
    setLoading(true);
    addLog('Voltando...');
    try {
      await sendCommand({ action: 'browser_back' });
      await checkBrowserStatus();
      addLog('✅ Voltou');
    } catch (err: any) {
      setError('Erro ao voltar');
      addLog('❌ Erro');
    } finally {
      setLoading(false);
    }
  };

  const handleForward = async () => {
    setLoading(true);
    addLog('Avançando...');
    try {
      await sendCommand({ action: 'browser_forward' });
      await checkBrowserStatus();
      addLog('✅ Avançou');
    } catch (err: any) {
      setError('Erro ao avançar');
      addLog('❌ Erro');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    addLog('Atualizando...');
    try {
      await sendCommand({ action: 'browser_refresh' });
      await checkBrowserStatus();
      addLog('✅ Atualizado');
    } catch (err: any) {
      setError('Erro ao atualizar');
      addLog('❌ Erro');
    } finally {
      setLoading(false);
    }
  };

  const handleNewTab = async () => {
    setLoading(true);
    addLog('Abrindo nova aba...');
    try {
      await sendCommand({ action: 'browser_new_tab' });
      await checkBrowserStatus();
      addLog('✅ Nova aba aberta');
    } catch (err: any) {
      setError('Erro ao abrir nova aba');
      addLog('❌ Erro');
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshot = async () => {
    setLoading(true);
    addLog('Capturando screenshot...');
    try {
      const response = await sendCommand({
        action: 'browser_screenshot',
        params: { full_page: false }
      });
      
      if (response.status === 'ok') {
        addLog(`✅ Screenshot: ${response.filename}`);
        alert(`Screenshot salvo: ${response.filename}`);
      }
    } catch (err: any) {
      setError('Erro ao capturar screenshot');
      addLog('❌ Erro');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteCommand = async () => {
    if (!command.trim()) return;

    setExecuting(true);
    setError(null);
    addLog(`Executando: ${command}`);
    
    try {
      const cmd = command.toLowerCase();
      
      if (cmd.includes('pesquisar') || cmd.includes('buscar')) {
        const searchTerm = command.replace(/pesquisar|buscar|por|no google/gi, '').trim();
        
        addLog('1. Navegando para Google...');
        await sendCommand({
          action: 'browser_goto',
          params: { url: 'https://google.com' }
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        addLog('2. Digitando busca...');
        await sendCommand({
          action: 'browser_type',
          params: { 
            selector: 'textarea[name="q"]',
            text: searchTerm
          }
        });
        
        addLog('3. Pressionando Enter...');
        await sendCommand({
          action: 'browser_press',
          params: { key: 'Enter' }
        });
        
        setCommand('');
        addLog('✅ Pesquisa concluída!');
        await checkBrowserStatus();
        
      } else if (cmd.startsWith('abrir ') || cmd.startsWith('ir para ')) {
        const urlToOpen = command.replace(/abrir|ir para/gi, '').trim();
        
        addLog(`Navegando para ${urlToOpen}...`);
        await sendCommand({
          action: 'browser_goto',
          params: { url: urlToOpen }
        });
        
        setCommand('');
        addLog('✅ Navegação concluída!');
        await checkBrowserStatus();
        
      } else {
        setError('Comando não reconhecido. Tente: "pesquisar Python" ou "abrir youtube.com"');
        addLog('❌ Comando não reconhecido');
      }
    } catch (err: any) {
      setError(err.message);
      addLog('❌ ' + err.message);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-600" />
          🌐 Navegador Web
          <Zap className="w-4 h-4 text-yellow-500" title="WebSocket Direto" />
        </h2>
        
        <div className="flex items-center gap-2">
          {/* WebSocket Status */}
          {connecting ? (
            <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1">
              <WifiOff className="w-3 h-3 animate-pulse" />
              Conectando...
            </span>
          ) : connected ? (
            <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              WS Conectado
            </span>
          ) : (
            <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center gap-1">
              <WifiOff className="w-3 h-3" />
              WS Desconectado
            </span>
          )}
          
          {/* Browser Status */}
          {browserOpen ? (
            <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              ● Navegador Aberto
            </span>
          ) : (
            <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
              ○ Navegador Fechado
            </span>
          )}
        </div>
      </div>

      {/* Errors */}
      {(error || wsError) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-800 dark:text-red-200">{error || wsError}</p>
        </div>
      )}

      {/* Browser Info */}
      {browserOpen && browserInfo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-1">
          <div className="text-sm text-blue-900 dark:text-blue-100 font-medium">
            {browserInfo.title || 'Sem título'}
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300 truncate">
            {browserInfo.url}
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300">
            Abas: {browserInfo.total_tabs} | Atual: {browserInfo.tab_index + 1}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="space-y-3">
        {!connected ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
              ⚠️ WebSocket desconectado. Certifique-se de que o Executor Python está rodando.
            </p>
            <code className="text-xs bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded">
              cd executor && python executor.py
            </code>
          </div>
        ) : !browserOpen ? (
          <button
            onClick={handleOpenBrowser}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
          >
            <Globe className="w-5 h-5" />
            {loading ? 'Abrindo...' : 'Abrir Navegador'}
          </button>
        ) : (
          <>
            {/* Navigation Bar */}
            <div className="flex gap-2">
              <button
                onClick={handleBack}
                disabled={loading}
                className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                title="Voltar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleForward}
                disabled={loading}
                className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                title="Avançar"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                title="Atualizar"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNavigate()}
                placeholder="Digite uma URL..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              
              <button
                onClick={handleNavigate}
                disabled={loading || !url.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                Ir
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleNewTab}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Nova Aba
              </button>
              <button
                onClick={handleScreenshot}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm"
              >
                <Camera className="w-4 h-4" />
                Screenshot
              </button>
              <button
                onClick={handleCloseBrowser}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              >
                <X className="w-4 h-4" />
                Fechar
              </button>
            </div>

            {/* Natural Language Command */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                ⚡ Comando em linguagem natural (tempo real):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleExecuteCommand()}
                  placeholder="Ex: pesquisar Python tutorial"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  disabled={executing}
                />
                <button
                  onClick={handleExecuteCommand}
                  disabled={executing || !command.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {executing ? 'Executando...' : 'Executar'}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 Exemplos: "pesquisar Python tutorial", "abrir youtube.com"
              </p>
            </div>

            {/* Logs */}
            {logs.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-1">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  📋 Logs:
                </div>
                {logs.map((log, i) => (
                  <div key={i} className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Help */}
      {!browserOpen && connected && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            ⚡ Controle em Tempo Real via WebSocket:
          </h3>
          <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
            <li>• Conexão direta com Executor Python</li>
            <li>• Resposta instantânea aos comandos</li>
            <li>• Sem latência do servidor Express</li>
            <li>• Logs em tempo real</li>
          </ul>
        </div>
      )}
    </div>
  );
};
