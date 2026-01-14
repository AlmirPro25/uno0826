import React, { useState, useEffect } from 'react';
import { Globe, ArrowLeft, ArrowRight, RotateCw, X, Plus, Camera, FileText, ExternalLink } from 'lucide-react';

interface BrowserInfo {
  url: string;
  title: string;
  tab_index: number;
  total_tabs: number;
}

export const BrowserControl: React.FC = () => {
  const [browserOpen, setBrowserOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [command, setCommand] = useState('');
  const [executing, setExecuting] = useState(false);

  const API_BASE = 'http://localhost:3001/api/browser';

  const checkBrowserStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/info`);
      const data = await response.json();
      
      if (data.status === 'ok') {
        setBrowserInfo(data);
        setBrowserOpen(true);
        setError(null);
      } else {
        setBrowserOpen(false);
        setBrowserInfo(null);
      }
    } catch (err) {
      setBrowserOpen(false);
      setBrowserInfo(null);
    }
  };

  useEffect(() => {
    checkBrowserStatus();
    const interval = setInterval(checkBrowserStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenBrowser = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headless: false })
      });
      const data = await response.json();
      
      if (data.status === 'ok') {
        setBrowserOpen(true);
        await checkBrowserStatus();
      } else {
        setError(data.message || 'Erro ao abrir navegador');
      }
    } catch (err: any) {
      setError('Erro ao conectar com o Executor. Certifique-se de que está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseBrowser = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/close`, { method: 'POST' });
      setBrowserOpen(false);
      setBrowserInfo(null);
    } catch (err: any) {
      setError('Erro ao fechar navegador');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = async () => {
    if (!url.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await response.json();
      
      if (data.status === 'ok') {
        await checkBrowserStatus();
      } else {
        setError(data.message || 'Erro ao navegar');
      }
    } catch (err: any) {
      setError('Erro ao navegar');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/back`, { method: 'POST' });
      await checkBrowserStatus();
    } catch (err: any) {
      setError('Erro ao voltar');
    } finally {
      setLoading(false);
    }
  };

  const handleForward = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/forward`, { method: 'POST' });
      await checkBrowserStatus();
    } catch (err: any) {
      setError('Erro ao avançar');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/refresh`, { method: 'POST' });
      await checkBrowserStatus();
    } catch (err: any) {
      setError('Erro ao atualizar');
    } finally {
      setLoading(false);
    }
  };

  const handleNewTab = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/new-tab`, { method: 'POST' });
      await checkBrowserStatus();
    } catch (err: any) {
      setError('Erro ao abrir nova aba');
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshot = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/screenshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_page: false })
      });
      const data = await response.json();
      
      if (data.status === 'ok') {
        alert(`Screenshot salvo: ${data.filename}`);
      }
    } catch (err: any) {
      setError('Erro ao capturar screenshot');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteCommand = async () => {
    if (!command.trim()) return;

    setExecuting(true);
    setError(null);
    try {
      // Interpreta comando simples
      const cmd = command.toLowerCase();
      
      if (cmd.includes('pesquisar') || cmd.includes('buscar')) {
        // Extrai termo de busca
        const searchTerm = command.replace(/pesquisar|buscar|por|no google/gi, '').trim();
        
        // Navega para Google
        await fetch(`${API_BASE}/navigate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'https://google.com' })
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Digita no campo de busca
        await fetch(`${API_BASE}/type`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            selector: 'input[name="q"]',
            text: searchTerm
          })
        });
        
        // Pressiona Enter
        await fetch(`${API_BASE}/press`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'Enter' })
        });
        
        setCommand('');
        await checkBrowserStatus();
      } else if (cmd.startsWith('abrir ') || cmd.startsWith('ir para ')) {
        // Extrai URL
        const urlToOpen = command.replace(/abrir|ir para/gi, '').trim();
        await fetch(`${API_BASE}/navigate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlToOpen })
        });
        setCommand('');
        await checkBrowserStatus();
      } else {
        setError('Comando não reconhecido. Tente: "pesquisar Python tutorial" ou "abrir youtube.com"');
      }
    } catch (err: any) {
      setError('Erro ao executar comando');
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
        </h2>
        
        <div className="flex items-center gap-2">
          {browserOpen ? (
            <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              ● Aberto
            </span>
          ) : (
            <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
              ○ Fechado
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Browser Info */}
      {browserOpen && browserInfo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-1">
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Página:</strong> {browserInfo.title || 'Sem título'}
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300 truncate">
            <strong>URL:</strong> {browserInfo.url}
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Abas:</strong> {browserInfo.total_tabs} (atual: {browserInfo.tab_index + 1})
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="space-y-3">
        {!browserOpen ? (
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
                Comando em linguagem natural:
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
                💡 Exemplos: "pesquisar Python tutorial", "abrir youtube.com", "ir para github.com"
              </p>
            </div>
          </>
        )}
      </div>

      {/* Help */}
      {!browserOpen && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            🚀 Recursos do Navegador:
          </h3>
          <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
            <li>• Navegação automatizada com Playwright</li>
            <li>• Controle por comandos em linguagem natural</li>
            <li>• Preenchimento automático de formulários</li>
            <li>• Extração de dados de páginas</li>
            <li>• Screenshots e exportação em PDF</li>
            <li>• Múltiplas abas simultâneas</li>
          </ul>
        </div>
      )}
    </div>
  );
};
