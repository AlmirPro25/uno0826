# 🌐 ELECTRON WEBVIEW EMBUTIDO

**Como usar Electron dentro do React (não como app separado)**

---

## 🎯 O QUE VOCÊ QUER

Você quer um **navegador embutido** no seu app React que:
- Roda localmente (Electron)
- Aparece em uma área específica da tela
- Não precisa ser app separado
- Funciona como um componente React

---

## ⚠️ PROBLEMA: Electron não funciona assim

**Electron NÃO pode rodar "dentro" do React web.**

Por quê?
- Electron é um **runtime desktop** (como um navegador standalone)
- React web roda no **navegador normal** (Chrome, Firefox, etc.)
- São ambientes completamente diferentes

---

## 💡 SOLUÇÕES POSSÍVEIS

### **OPÇÃO 1: Iframe (Simples mas limitado)**

✅ **Vantagens:**
- Funciona no navegador web
- Fácil de implementar
- Não precisa Electron

❌ **Desvantagens:**
- Muitos sites bloqueiam iframe (Google, Facebook, YouTube, etc.)
- Sem controle total do navegador
- Limitações de segurança

**Quando usar:** Sites simples que não bloqueiam iframe

---

### **OPÇÃO 2: Electron BrowserView (Recomendado)**

✅ **Vantagens:**
- Navegador completo e funcional
- Sem bloqueios
- Controle total

❌ **Desvantagens:**
- Precisa rodar como app Electron (não web)
- Usuário precisa instalar o app

**Quando usar:** App desktop profissional

---

### **OPÇÃO 3: Playwright Headless + Screenshots (Atual)**

✅ **Vantagens:**
- Funciona no navegador web
- Busca em múltiplos sites
- Extrai dados reais

❌ **Desvantagens:**
- Só mostra screenshots (não interativo)
- Não é navegador "de verdade"

**Quando usar:** Automação e extração de dados

---

## 🚀 SOLUÇÃO HÍBRIDA (MELHOR OPÇÃO)

**Combinar as 3 abordagens:**

```
┌─────────────────────────────────────────┐
│   APP REACT (Navegador Web)            │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │  IFRAME (Sites simples)         │  │
│   │  - Wikipedia                    │  │
│   │  - Sites que permitem iframe    │  │
│   └─────────────────────────────────┘  │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │  SCREENSHOTS (Busca massiva)    │  │
│   │  - Playwright headless          │  │
│   │  - Extração de dados            │  │
│   └─────────────────────────────────┘  │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │  BOTÃO: "Abrir no Electron"     │  │
│   │  - Abre app Electron separado   │  │
│   │  - Navegador completo           │  │
│   └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 📝 IMPLEMENTAÇÃO: Iframe Inteligente

### Componente React com Iframe:

```tsx
// src/components/SmartBrowser.tsx
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
    'linkedin.com'
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
                // Abrir no Electron (se disponível)
                if (window.electron) {
                  window.electron.openTab(url);
                } else {
                  alert('App Electron não está rodando. Execute: npm run electron');
                }
              }}
              className="block w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition"
            >
              ⚡ Abrir no Electron
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-400">Carregando...</p>
          </div>
        </div>
      )}
      
      <iframe
        src={url}
        className="w-full h-full border-0"
        onError={handleIframeError}
        onLoad={handleIframeLoad}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        title="Browser"
      />
    </div>
  );
};
```

---

## 🔗 Integração com Electron (Opcional)

### Detectar se Electron está disponível:

```typescript
// src/utils/electronDetector.ts
export function isElectronAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.electron;
}

export function openInElectron(url: string): boolean {
  if (isElectronAvailable()) {
    window.electron.openTab(url);
    return true;
  }
  return false;
}

// Tipos
declare global {
  interface Window {
    electron?: {
      openTab: (url: string) => Promise<void>;
      closeTab: (tabId: string) => Promise<void>;
      // ... outros métodos
    };
  }
}
```

---

## 🎨 Componente Completo: Navegador Híbrido

```tsx
// src/components/HybridBrowser.tsx
import React, { useState } from 'react';
import { SmartBrowser } from './SmartBrowser';
import { isElectronAvailable, openInElectron } from '../utils/electronDetector';

interface HybridBrowserProps {
  initialUrl?: string;
}

export const HybridBrowser: React.FC<HybridBrowserProps> = ({ initialUrl = '' }) => {
  const [url, setUrl] = useState(initialUrl);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [mode, setMode] = useState<'iframe' | 'screenshot' | 'electron'>('iframe');

  const handleNavigate = () => {
    if (!url.trim()) return;

    let fullUrl = url.trim();
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = 'https://' + fullUrl;
    }

    setCurrentUrl(fullUrl);
  };

  const handleOpenInElectron = () => {
    if (openInElectron(currentUrl)) {
      alert('Abrindo no Electron...');
    } else {
      alert('Electron não está disponível. Execute: npm run electron');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Barra de Navegação */}
      <div className="flex items-center gap-2 p-3 bg-gray-800 border-b border-gray-700">
        <button
          onClick={() => window.history.back()}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          title="Voltar"
        >
          ←
        </button>
        
        <button
          onClick={() => window.history.forward()}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          title="Avançar"
        >
          →
        </button>
        
        <button
          onClick={() => setCurrentUrl(currentUrl)}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          title="Recarregar"
        >
          ⟳
        </button>
        
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleNavigate()}
          placeholder="Digite uma URL..."
          className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
        />
        
        <button
          onClick={handleNavigate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white"
        >
          Ir
        </button>

        {isElectronAvailable() && (
          <button
            onClick={handleOpenInElectron}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-white"
            title="Abrir no Electron"
          >
            ⚡
          </button>
        )}
      </div>

      {/* Seletor de Modo */}
      <div className="flex gap-2 p-2 bg-gray-800 border-b border-gray-700">
        <button
          onClick={() => setMode('iframe')}
          className={`px-3 py-1 rounded ${
            mode === 'iframe' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          📱 Iframe
        </button>
        <button
          onClick={() => setMode('screenshot')}
          className={`px-3 py-1 rounded ${
            mode === 'screenshot' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          📸 Screenshot
        </button>
        {isElectronAvailable() && (
          <button
            onClick={() => setMode('electron')}
            className={`px-3 py-1 rounded ${
              mode === 'electron' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            ⚡ Electron
          </button>
        )}
      </div>

      {/* Área de Conteúdo */}
      <div className="flex-1 overflow-hidden">
        {mode === 'iframe' && currentUrl && (
          <SmartBrowser url={currentUrl} />
        )}

        {mode === 'screenshot' && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-4">📸</div>
              <p>Modo Screenshot</p>
              <p className="text-sm">Captura via Playwright</p>
            </div>
          </div>
        )}

        {mode === 'electron' && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <p>Modo Electron</p>
              <p className="text-sm">Navegador completo</p>
            </div>
          </div>
        )}

        {!currentUrl && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">🌐</div>
              <p className="text-xl mb-2">Navegador Híbrido</p>
              <p className="text-sm">Digite uma URL acima para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## 🚀 USO NO APP

```tsx
// src/App.tsx
import { HybridBrowser } from './components/HybridBrowser';

// No componente:
const [showBrowser, setShowBrowser] = useState(false);

// No JSX:
{showBrowser && (
  <div className="fixed inset-0 z-50 bg-black">
    <div className="flex h-full">
      {/* Navegador */}
      <div className="flex-1">
        <HybridBrowser initialUrl="https://google.com" />
      </div>
      
      {/* Chat lateral */}
      <div className="w-96 border-l border-gray-700">
        <ChatView {...chatProps} />
      </div>
    </div>
    
    <button
      onClick={() => setShowBrowser(false)}
      className="absolute top-4 right-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded"
    >
      Fechar
    </button>
  </div>
)}
```

---

## 📊 COMPARAÇÃO DAS OPÇÕES

| Recurso | Iframe | Screenshot | Electron |
|---------|--------|------------|----------|
| **Funciona no web** | ✅ | ✅ | ❌ |
| **Sites bloqueados** | ❌ | ✅ | ✅ |
| **Interativo** | ✅ | ❌ | ✅ |
| **Busca massiva** | ❌ | ✅ | ✅ |
| **Fácil de usar** | ✅ | ⚠️ | ⚠️ |
| **Performance** | ✅ | ⚠️ | ✅ |

---

## ✅ RECOMENDAÇÃO FINAL

**Use a abordagem híbrida:**

1. **Iframe** para sites simples (Wikipedia, blogs, etc.)
2. **Screenshot** para busca massiva e extração de dados
3. **Botão "Abrir no Electron"** para sites bloqueados

Assim você tem:
- ✅ Funciona no navegador web
- ✅ Busca massiva com Playwright
- ✅ Opção de navegador completo (Electron)
- ✅ Melhor experiência para o usuário

---

**Pronto para implementar!** 🚀
