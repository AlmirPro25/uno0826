# 🚀 IMPLEMENTAÇÃO: Navegador Completo com Abas

**Guia prático para transformar screenshots em navegador real**

---

## 📦 PASSO 1: Instalar Dependências

```bash
# No diretório electron/
cd electron
npm install electron electron-builder

# Voltar para raiz
cd ..
```

---

## 🔧 PASSO 2: Criar Gerenciador de Abas

Crie o arquivo `electron/browserManager.js`:

```javascript
const { BrowserView } = require('electron');

class BrowserTabManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.tabs = new Map();
    this.activeTabId = null;
    this.tabCounter = 0;
  }

  /**
   * Criar nova aba
   */
  createTab(url = 'about:blank') {
    const tabId = `tab_${++this.tabCounter}_${Date.now()}`;
    
    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false
      }
    });

    // Configurar bounds (posição e tamanho)
    this.updateViewBounds(view);

    // Carregar URL
    view.webContents.loadURL(url);

    // Eventos
    view.webContents.on('did-start-loading', () => {
      console.log(`[${tabId}] Carregando: ${url}`);
    });

    view.webContents.on('did-finish-load', () => {
      const title = view.webContents.getTitle();
      console.log(`[${tabId}] Carregado: ${title}`);
      
      // Notificar frontend
      this.mainWindow.webContents.send('tab-updated', {
        tabId,
        title,
        url: view.webContents.getURL(),
        canGoBack: view.webContents.canGoBack(),
        canGoForward: view.webContents.canGoForward()
      });
    });

    view.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error(`[${tabId}] Erro ao carregar:`, errorDescription);
    });

    // Salvar aba
    this.tabs.set(tabId, {
      id: tabId,
      view,
      url,
      title: 'Nova Aba',
      createdAt: Date.now()
    });

    // Ativar aba
    this.switchTab(tabId);

    return {
      tabId,
      url,
      title: 'Nova Aba'
    };
  }

  /**
   * Trocar aba ativa
   */
  switchTab(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      console.error(`Aba ${tabId} não encontrada`);
      return false;
    }

    // Remover view anterior
    if (this.activeTabId) {
      const activeTab = this.tabs.get(this.activeTabId);
      if (activeTab) {
        this.mainWindow.removeBrowserView(activeTab.view);
      }
    }

    // Adicionar nova view
    this.mainWindow.setBrowserView(tab.view);
    this.updateViewBounds(tab.view);
    this.activeTabId = tabId;

    console.log(`Aba ativa: ${tabId}`);
    return true;
  }

  /**
   * Fechar aba
   */
  closeTab(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab) return false;

    // Destruir view
    tab.view.webContents.destroy();
    this.tabs.delete(tabId);

    // Se era a aba ativa, mudar para outra
    if (this.activeTabId === tabId) {
      const remainingTabs = Array.from(this.tabs.keys());
      if (remainingTabs.length > 0) {
        this.switchTab(remainingTabs[0]);
      } else {
        this.activeTabId = null;
        this.mainWindow.removeBrowserView(tab.view);
      }
    }

    console.log(`Aba fechada: ${tabId}`);
    return true;
  }

  /**
   * Navegar na aba ativa
   */
  navigate(url) {
    if (!this.activeTabId) {
      return this.createTab(url);
    }

    const tab = this.tabs.get(this.activeTabId);
    if (tab) {
      tab.view.webContents.loadURL(url);
      tab.url = url;
      return { tabId: this.activeTabId, url };
    }

    return null;
  }

  /**
   * Voltar
   */
  goBack() {
    if (!this.activeTabId) return false;
    const tab = this.tabs.get(this.activeTabId);
    if (tab && tab.view.webContents.canGoBack()) {
      tab.view.webContents.goBack();
      return true;
    }
    return false;
  }

  /**
   * Avançar
   */
  goForward() {
    if (!this.activeTabId) return false;
    const tab = this.tabs.get(this.activeTabId);
    if (tab && tab.view.webContents.canGoForward()) {
      tab.view.webContents.goForward();
      return true;
    }
    return false;
  }

  /**
   * Recarregar
   */
  reload() {
    if (!this.activeTabId) return false;
    const tab = this.tabs.get(this.activeTabId);
    if (tab) {
      tab.view.webContents.reload();
      return true;
    }
    return false;
  }

  /**
   * Atualizar posição e tamanho da view
   */
  updateViewBounds(view) {
    const bounds = this.mainWindow.getBounds();
    
    // Deixar espaço para:
    // - Barra de abas: 40px
    // - Barra de navegação: 50px
    // - Chat lateral: 400px (direita)
    
    view.setBounds({
      x: 0,
      y: 90,  // Espaço para barras
      width: bounds.width - 400,  // Deixar espaço para chat
      height: bounds.height - 90
    });
  }

  /**
   * Atualizar bounds de todas as abas
   */
  updateAllBounds() {
    this.tabs.forEach(tab => {
      this.updateViewBounds(tab.view);
    });
  }

  /**
   * Obter informações de todas as abas
   */
  getAllTabs() {
    return Array.from(this.tabs.values()).map(tab => ({
      id: tab.id,
      url: tab.url,
      title: tab.title,
      isActive: tab.id === this.activeTabId
    }));
  }

  /**
   * Obter aba ativa
   */
  getActiveTab() {
    if (!this.activeTabId) return null;
    const tab = this.tabs.get(this.activeTabId);
    return tab ? {
      id: tab.id,
      url: tab.url,
      title: tab.title
    } : null;
  }

  /**
   * Fechar todas as abas
   */
  closeAllTabs() {
    this.tabs.forEach((tab, tabId) => {
      this.closeTab(tabId);
    });
  }
}

module.exports = BrowserTabManager;
```

---

## 🖥️ PASSO 3: Atualizar Electron Main

Edite `electron/main.js`:

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const BrowserTabManager = require('./browserManager');

let mainWindow;
let tabManager;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  // Carregar app React
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Criar gerenciador de abas
  tabManager = new BrowserTabManager(mainWindow);

  // Atualizar bounds quando janela redimensionar
  mainWindow.on('resize', () => {
    tabManager.updateAllBounds();
  });
}

// ==================== IPC HANDLERS ====================

// Criar nova aba
ipcMain.handle('browser:create-tab', async (event, url) => {
  return tabManager.createTab(url);
});

// Trocar aba
ipcMain.handle('browser:switch-tab', async (event, tabId) => {
  return tabManager.switchTab(tabId);
});

// Fechar aba
ipcMain.handle('browser:close-tab', async (event, tabId) => {
  return tabManager.closeTab(tabId);
});

// Navegar
ipcMain.handle('browser:navigate', async (event, url) => {
  return tabManager.navigate(url);
});

// Voltar
ipcMain.handle('browser:go-back', async () => {
  return tabManager.goBack();
});

// Avançar
ipcMain.handle('browser:go-forward', async () => {
  return tabManager.goForward();
});

// Recarregar
ipcMain.handle('browser:reload', async () => {
  return tabManager.reload();
});

// Obter todas as abas
ipcMain.handle('browser:get-tabs', async () => {
  return tabManager.getAllTabs();
});

// Obter aba ativa
ipcMain.handle('browser:get-active-tab', async () => {
  return tabManager.getActiveTab();
});

// ==================== APP LIFECYCLE ====================

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (tabManager) {
    tabManager.closeAllTabs();
  }
});
```

---

## ⚛️ PASSO 4: Criar Hook React

Crie `src/hooks/useBrowser.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';

interface Tab {
  id: string;
  url: string;
  title: string;
  isActive: boolean;
}

interface BrowserAPI {
  createTab: (url: string) => Promise<Tab>;
  switchTab: (tabId: string) => Promise<boolean>;
  closeTab: (tabId: string) => Promise<boolean>;
  navigate: (url: string) => Promise<any>;
  goBack: () => Promise<boolean>;
  goForward: () => Promise<boolean>;
  reload: () => Promise<boolean>;
  getTabs: () => Promise<Tab[]>;
  getActiveTab: () => Promise<Tab | null>;
}

declare global {
  interface Window {
    electron?: {
      ipcRenderer: {
        invoke: (channel: string, ...args: any[]) => Promise<any>;
        on: (channel: string, callback: (...args: any[]) => void) => void;
        removeListener: (channel: string, callback: (...args: any[]) => void) => void;
      };
    };
  }
}

export const useBrowser = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Verificar se está rodando no Electron
    setIsElectron(!!window.electron);

    if (window.electron) {
      // Listener para atualizações de abas
      const handleTabUpdate = (event: any, data: any) => {
        console.log('Tab updated:', data);
        loadTabs();
      };

      window.electron.ipcRenderer.on('tab-updated', handleTabUpdate);

      // Carregar abas iniciais
      loadTabs();

      return () => {
        window.electron?.ipcRenderer.removeListener('tab-updated', handleTabUpdate);
      };
    }
  }, []);

  const loadTabs = useCallback(async () => {
    if (!window.electron) return;

    try {
      const allTabs = await window.electron.ipcRenderer.invoke('browser:get-tabs');
      const active = await window.electron.ipcRenderer.invoke('browser:get-active-tab');
      
      setTabs(allTabs);
      setActiveTab(active);
    } catch (error) {
      console.error('Erro ao carregar abas:', error);
    }
  }, []);

  const createTab = useCallback(async (url: string = 'about:blank') => {
    if (!window.electron) {
      // Fallback: abrir em nova janela
      window.open(url, '_blank');
      return null;
    }

    try {
      const tab = await window.electron.ipcRenderer.invoke('browser:create-tab', url);
      await loadTabs();
      return tab;
    } catch (error) {
      console.error('Erro ao criar aba:', error);
      return null;
    }
  }, [loadTabs]);

  const switchTab = useCallback(async (tabId: string) => {
    if (!window.electron) return false;

    try {
      const success = await window.electron.ipcRenderer.invoke('browser:switch-tab', tabId);
      if (success) {
        await loadTabs();
      }
      return success;
    } catch (error) {
      console.error('Erro ao trocar aba:', error);
      return false;
    }
  }, [loadTabs]);

  const closeTab = useCallback(async (tabId: string) => {
    if (!window.electron) return false;

    try {
      const success = await window.electron.ipcRenderer.invoke('browser:close-tab', tabId);
      if (success) {
        await loadTabs();
      }
      return success;
    } catch (error) {
      console.error('Erro ao fechar aba:', error);
      return false;
    }
  }, [loadTabs]);

  const navigate = useCallback(async (url: string) => {
    if (!window.electron) {
      window.location.href = url;
      return null;
    }

    try {
      const result = await window.electron.ipcRenderer.invoke('browser:navigate', url);
      await loadTabs();
      return result;
    } catch (error) {
      console.error('Erro ao navegar:', error);
      return null;
    }
  }, [loadTabs]);

  const goBack = useCallback(async () => {
    if (!window.electron) {
      window.history.back();
      return true;
    }

    try {
      return await window.electron.ipcRenderer.invoke('browser:go-back');
    } catch (error) {
      console.error('Erro ao voltar:', error);
      return false;
    }
  }, []);

  const goForward = useCallback(async () => {
    if (!window.electron) {
      window.history.forward();
      return true;
    }

    try {
      return await window.electron.ipcRenderer.invoke('browser:go-forward');
    } catch (error) {
      console.error('Erro ao avançar:', error);
      return false;
    }
  }, []);

  const reload = useCallback(async () => {
    if (!window.electron) {
      window.location.reload();
      return true;
    }

    try {
      return await window.electron.ipcRenderer.invoke('browser:reload');
    } catch (error) {
      console.error('Erro ao recarregar:', error);
      return false;
    }
  }, []);

  return {
    tabs,
    activeTab,
    isElectron,
    createTab,
    switchTab,
    closeTab,
    navigate,
    goBack,
    goForward,
    reload
  };
};
```

---

## 🎨 PASSO 5: Criar Componente de Abas

Crie `src/components/BrowserTabs.tsx`:

```tsx
import React, { useState } from 'react';
import { useBrowser } from '../hooks/useBrowser';

export const BrowserTabs: React.FC = () => {
  const {
    tabs,
    activeTab,
    isElectron,
    createTab,
    switchTab,
    closeTab,
    navigate,
    goBack,
    goForward,
    reload
  } = useBrowser();

  const [urlInput, setUrlInput] = useState('');

  if (!isElectron) {
    return (
      <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
        <p className="text-yellow-300">
          ⚠️ Navegador completo disponível apenas no app Electron.
          <br />
          Execute: <code className="bg-black/30 px-2 py-1 rounded">npm run electron</code>
        </p>
      </div>
    );
  }

  const handleNavigate = () => {
    if (!urlInput.trim()) return;

    let url = urlInput.trim();
    
    // Adicionar protocolo se necessário
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    navigate(url);
    setUrlInput('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Barra de Navegação */}
      <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
        <button
          onClick={goBack}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
          title="Voltar"
        >
          ←
        </button>
        <button
          onClick={goForward}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
          title="Avançar"
        >
          →
        </button>
        <button
          onClick={reload}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
          title="Recarregar"
        >
          ⟳
        </button>
        
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleNavigate()}
          placeholder={activeTab?.url || 'Digite uma URL...'}
          className="flex-1 px-3 py-1 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
        />
        
        <button
          onClick={handleNavigate}
          className="px-4 py-1 bg-blue-600 hover:bg-blue-500 rounded"
        >
          Ir
        </button>
      </div>

      {/* Abas */}
      <div className="flex items-center gap-1 p-1 bg-gray-800 border-b border-gray-700 overflow-x-auto">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`
              flex items-center gap-2 px-3 py-1 rounded-t cursor-pointer
              ${tab.isActive ? 'bg-gray-900 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
            `}
            onClick={() => switchTab(tab.id)}
          >
            <span className="text-sm truncate max-w-[150px]">
              {tab.title || 'Nova Aba'}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
        ))}
        
        <button
          onClick={() => createTab('about:blank')}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-t"
          title="Nova Aba"
        >
          +
        </button>
      </div>

      {/* Área do Navegador (BrowserView renderiza aqui) */}
      <div className="flex-1 bg-white">
        {tabs.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-2xl mb-4">🌐</p>
              <p>Nenhuma aba aberta</p>
              <button
                onClick={() => createTab('https://google.com')}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded"
              >
                Abrir Google
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## 🔗 PASSO 6: Integrar no App

Edite `src/App.tsx` para adicionar o navegador:

```typescript
import { BrowserTabs } from './components/BrowserTabs';

// No componente App, adicione:
const [showBrowser, setShowBrowser] = useState(false);

// No JSX:
{showBrowser && (
  <div className="fixed inset-0 z-50 bg-black">
    <div className="flex h-full">
      {/* Navegador */}
      <div className="flex-1">
        <BrowserTabs />
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
      Fechar Navegador
    </button>
  </div>
)}
```

---

## 🚀 PASSO 7: Testar

```bash
# Terminal 1: Iniciar backend
cd backend
npm start

# Terminal 2: Iniciar frontend
npm run dev

# Terminal 3: Iniciar Electron
npm run electron
```

---

## ✅ RESULTADO

Agora você tem:
- ✅ Navegador completo com abas
- ✅ Sites renderizados e interativos
- ✅ Controles de navegação (voltar, avançar, recarregar)
- ✅ Múltiplas abas simultâneas
- ✅ Integração com chat IA

**Próximo passo:** Integrar busca massiva para abrir resultados em abas!
