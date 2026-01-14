/**
 * 🌐 HYBRID BROWSER
 * Navegador híbrido: Iframe + Screenshot + Links externos
 */

import React, { useState } from 'react';
import { SmartBrowser } from './SmartBrowser';

interface HybridBrowserProps {
  initialUrl?: string;
  onClose?: () => void;
}

export const HybridBrowser: React.FC<HybridBrowserProps> = ({ 
  initialUrl = '', 
  onClose 
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [history, setHistory] = useState<string[]>(initialUrl ? [initialUrl] : []);
  const [historyIndex, setHistoryIndex] = useState(0);

  const handleNavigate = () => {
    if (!url.trim()) return;

    let fullUrl = url.trim();
    
    // Adicionar protocolo se necessário
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      // Se parece com domínio, adicionar https
      if (fullUrl.includes('.') && !fullUrl.includes(' ')) {
        fullUrl = 'https://' + fullUrl;
      } else {
        // Se não, buscar no Google
        fullUrl = `https://www.google.com/search?q=${encodeURIComponent(fullUrl)}`;
      }
    }

    setCurrentUrl(fullUrl);
    
    // Adicionar ao histórico
    const newHistory = [...history.slice(0, historyIndex + 1), fullUrl];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(history[newIndex]);
      setUrl(history[newIndex]);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(history[newIndex]);
      setUrl(history[newIndex]);
    }
  };

  const handleReload = () => {
    // Forçar reload adicionando timestamp
    if (currentUrl) {
      const separator = currentUrl.includes('?') ? '&' : '?';
      setCurrentUrl(`${currentUrl}${separator}_reload=${Date.now()}`);
    }
  };

  const handleHome = () => {
    const homeUrl = 'https://www.google.com';
    setUrl(homeUrl);
    setCurrentUrl(homeUrl);
    setHistory([...history, homeUrl]);
    setHistoryIndex(history.length);
  };

  // Atalhos populares
  const shortcuts = [
    { name: 'Google', url: 'https://www.google.com', icon: '🔍' },
    { name: 'Wikipedia', url: 'https://pt.wikipedia.org', icon: '📚' },
    { name: 'YouTube', url: 'https://www.youtube.com', icon: '▶️' },
    { name: 'GitHub', url: 'https://github.com', icon: '💻' },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Barra de Navegação */}
      <div className="flex items-center gap-2 p-3 bg-gray-800 border-b border-gray-700">
        <button
          onClick={handleBack}
          disabled={historyIndex === 0}
          className={`px-3 py-2 rounded ${
            historyIndex === 0
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
          title="Voltar"
        >
          ←
        </button>
        
        <button
          onClick={handleForward}
          disabled={historyIndex === history.length - 1}
          className={`px-3 py-2 rounded ${
            historyIndex === history.length - 1
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
          title="Avançar"
        >
          →
        </button>
        
        <button
          onClick={handleReload}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
          title="Recarregar"
        >
          ⟳
        </button>

        <button
          onClick={handleHome}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
          title="Página Inicial"
        >
          🏠
        </button>
        
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleNavigate()}
          placeholder="Digite uma URL ou busque algo..."
          className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
        
        <button
          onClick={handleNavigate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-medium"
        >
          Ir
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded text-white"
            title="Fechar Navegador"
          >
            ✕
          </button>
        )}
      </div>

      {/* Atalhos Rápidos */}
      {!currentUrl && (
        <div className="flex gap-2 p-2 bg-gray-800 border-b border-gray-700">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.name}
              onClick={() => {
                setUrl(shortcut.url);
                setCurrentUrl(shortcut.url);
                setHistory([...history, shortcut.url]);
                setHistoryIndex(history.length);
              }}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
            >
              {shortcut.icon} {shortcut.name}
            </button>
          ))}
        </div>
      )}

      {/* Área de Conteúdo */}
      <div className="flex-1 overflow-hidden">
        {currentUrl ? (
          <SmartBrowser url={currentUrl} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">🌐</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Navegador Híbrido
              </h2>
              <p className="text-gray-400 mb-6">
                Digite uma URL ou busque algo para começar
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {shortcuts.map((shortcut) => (
                  <button
                    key={shortcut.name}
                    onClick={() => {
                      setUrl(shortcut.url);
                      setCurrentUrl(shortcut.url);
                      setHistory([shortcut.url]);
                      setHistoryIndex(0);
                    }}
                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition"
                  >
                    <div className="text-2xl mb-1">{shortcut.icon}</div>
                    <div className="text-sm">{shortcut.name}</div>
                  </button>
                ))}
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-left">
                <p className="text-sm text-blue-300 mb-2">
                  💡 <strong>Dica:</strong> Este navegador usa iframe
                </p>
                <p className="text-xs text-gray-400">
                  Alguns sites podem bloquear a exibição. Nesse caso, use "Abrir em Nova Aba".
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barra de Status */}
      {currentUrl && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>🌐 {currentUrl}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Histórico: {historyIndex + 1}/{history.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HybridBrowser;
