/**
 * 🌐 SMART BROWSER
 * Navegador inteligente com iframe e fallback
 */

import React, { useState } from 'react';

interface SmartBrowserProps {
  url: string;
  onError?: () => void;
}

export const SmartBrowser: React.FC<SmartBrowserProps> = ({ url, onError }) => {
  const [iframeError, setIframeError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sites que geralmente bloqueiam iframe
  const blockedSites = [
    'google.com',
    'facebook.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'youtube.com',
    'linkedin.com',
    'github.com'
  ];

  const isLikelyBlocked = blockedSites.some(site => url.includes(site));

  const handleIframeError = () => {
    setIframeError(true);
    setLoading(false);
    onError?.();
  };

  const handleIframeLoad = () => {
    setLoading(false);
  };

  if (isLikelyBlocked || iframeError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h3 className="text-xl font-bold text-white mb-4">
            Site Bloqueado
          </h3>
          <p className="text-gray-400 mb-6">
            Este site não permite ser exibido em iframe por questões de segurança.
          </p>
          
          <div className="space-y-3">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
            >
              🌐 Abrir em Nova Aba
            </a>
            
            <button
              onClick={() => {
                // Copiar URL para clipboard
                navigator.clipboard.writeText(url);
                alert('URL copiada para a área de transferência!');
              }}
              className="block w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              📋 Copiar URL
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-left">
            <p className="text-sm text-blue-300 mb-2">
              💡 <strong>Dica:</strong> Sites como Google, Facebook e YouTube bloqueiam iframe.
            </p>
            <p className="text-xs text-gray-400">
              Use "Abrir em Nova Aba" para acessar esses sites.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-400">Carregando...</p>
            <p className="text-sm text-gray-500 mt-2">{url}</p>
          </div>
        </div>
      )}
      
      <iframe
        src={url}
        className="w-full h-full border-0"
        onError={handleIframeError}
        onLoad={handleIframeLoad}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
        title="Browser"
      />
    </div>
  );
};

export default SmartBrowser;
