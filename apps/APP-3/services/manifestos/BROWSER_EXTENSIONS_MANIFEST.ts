/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                                  ║
 * ║  ██████╗ ██████╗  ██████╗ ██╗    ██╗███████╗███████╗██████╗     ███████╗██╗  ██╗████████╗       ║
 * ║  ██╔══██╗██╔══██╗██╔═══██╗██║    ██║██╔════╝██╔════╝██╔══██╗    ██╔════╝╚██╗██╔╝╚══██╔══╝       ║
 * ║  ██████╔╝██████╔╝██║   ██║██║ █╗ ██║███████╗█████╗  ██████╔╝    █████╗   ╚███╔╝    ██║          ║
 * ║  ██╔══██╗██╔══██╗██║   ██║██║███╗██║╚════██║██╔══╝  ██╔══██╗    ██╔══╝   ██╔██╗    ██║          ║
 * ║  ██████╔╝██║  ██║╚██████╔╝╚███╔███╔╝███████║███████╗██║  ██║    ███████╗██╔╝ ██╗   ██║          ║
 * ║  ╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚══╝╚══╝ ╚══════╝╚══════╝╚═╝  ╚═╝    ╚══════╝╚═╝  ╚═╝   ╚═╝          ║
 * ║                                                                                                  ║
 * ║  BROWSER EXTENSIONS SUPREME MASTER - Chrome, Firefox, Edge, Safari                              ║
 * ║  Manifest V3, WebExtensions API, Cross-Browser Development                                      ║
 * ║                                                                                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════════════════╝
 */

export const BROWSER_EXTENSIONS_MANIFEST = `
# 🧩 BROWSER EXTENSIONS SUPREME MASTER

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Browser Extension, Extensão, Plugin, Add-on
- Chrome Extension, Firefox Addon, Edge Extension, Safari Extension
- Manifest V3, MV3, MV2, Content Script, Background Script
- Service Worker, Popup, Options Page, Side Panel
- WebExtensions API, chrome.*, browser.*
- Content Security Policy, Permissions, Host Permissions
- Web Store, AMO, Extension Publishing
- CRXJS, Plasmo, WXT, Extension Framework

## FILOSOFIA
> "Estenda o navegador sem comprometer segurança, privacidade ou performance."

### Princípios Invioláveis
1. **Minimal Permissions** - Peça apenas o necessário, quando necessário
2. **User Privacy First** - Nunca colete dados sem consentimento explícito
3. **Performance Matters** - Extensions lentas são desinstaladas
4. **Cross-Browser** - Funcione em Chrome, Firefox, Edge e Safari
5. **Manifest V3 Ready** - O futuro é MV3, prepare-se agora
6. **Security by Design** - CSP rigoroso, sem eval(), sem inline scripts

## ARQUITETURA DE EXTENSÕES

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BROWSER EXTENSION ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        BROWSER CONTEXT                               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │   Popup     │  │   Options   │  │  Side Panel │                  │   │
│  │  │   (React)   │  │   (React)   │  │   (React)   │                  │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │   │
│  │         │                │                │                          │   │
│  │         └────────────────┼────────────────┘                          │   │
│  │                          │                                           │   │
│  │                          ▼                                           │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │              SERVICE WORKER (Background)                     │    │   │
│  │  │  • Event-driven (não persistente em MV3)                    │    │   │
│  │  │  • chrome.runtime, chrome.storage, chrome.alarms            │    │   │
│  │  │  • Message hub entre todos os contextos                     │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │                          │                                           │   │
│  └──────────────────────────┼───────────────────────────────────────────┘   │
│                             │                                               │
│                             ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      WEB PAGE CONTEXT                                │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │                   CONTENT SCRIPT                             │    │   │
│  │  │  • Acesso ao DOM da página                                  │    │   │
│  │  │  • Isolado do JS da página (mundo isolado)                  │    │   │
│  │  │  • Comunicação via chrome.runtime.sendMessage               │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │                          │                                           │   │
│  │                          ▼                                           │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │                   INJECTED SCRIPT                            │    │   │
│  │  │  • Mesmo contexto JS da página                              │    │   │
│  │  │  • Acesso a window, APIs da página                          │    │   │
│  │  │  • Comunicação via window.postMessage                       │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
\`\`\`

## COMPARATIVO DE BROWSERS

| Feature | Chrome | Firefox | Edge | Safari |
|---------|--------|---------|------|--------|
| Manifest | V3 | V2/V3 | V3 | V2-like |
| API Namespace | chrome.* | browser.* | chrome.* | browser.* |
| Promises | Callback/Promise | Promise | Callback/Promise | Promise |
| Service Worker | Sim | Sim (MV3) | Sim | Event Page |
| Side Panel | Sim | Sidebar | Sim | Não |
| Store | Chrome Web Store | AMO | Edge Add-ons | App Store |

## MANIFEST V3 COMPLETO

\`\`\`json
// manifest.json - Configuração completa MV3
{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0.0",
  "description": "Professional browser extension",
  
  // Permissions - SEMPRE o mínimo necessário
  "permissions": [
    "storage",           // chrome.storage API
    "activeTab",         // Acesso à tab ativa (sob demanda)
    "scripting",         // chrome.scripting API
    "alarms",            // Tarefas agendadas
    "notifications",     // Notificações do sistema
    "contextMenus"       // Menu de contexto
  ],
  
  // Host permissions - Sites específicos
  "host_permissions": [
    "https://*.example.com/*",
    "https://api.myservice.com/*"
  ],
  
  // Optional permissions - Pedir quando necessário
  "optional_permissions": [
    "tabs",              // Acesso a todas as tabs
    "history",           // Histórico de navegação
    "bookmarks"          // Bookmarks
  ],
  "optional_host_permissions": [
    "https://*/*",
    "http://*/*"
  ],
  
  // Action (toolbar button)
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    "default_title": "My Extension"
  },
  
  // Background Service Worker
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  
  // Content Scripts
  "content_scripts": [{
    "matches": ["https://*.example.com/*"],
    "js": ["content.js"],
    "css": ["content.css"],
    "run_at": "document_idle",
    "all_frames": false
  }],
  
  // Side Panel (Chrome 114+)
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  
  // Options Page
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  },
  
  // Icons
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  
  // Web Accessible Resources
  "web_accessible_resources": [{
    "resources": ["injected.js", "images/*"],
    "matches": ["https://*.example.com/*"]
  }],
  
  // Content Security Policy
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  },
  
  // Commands (keyboard shortcuts)
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+Y",
        "mac": "Command+Shift+Y"
      },
      "description": "Open extension popup"
    },
    "toggle-feature": {
      "suggested_key": {
        "default": "Ctrl+Shift+U"
      },
      "description": "Toggle feature"
    }
  },
  
  // Externally connectable
  "externally_connectable": {
    "matches": ["https://*.mywebsite.com/*"]
  },
  
  // Minimum Chrome version
  "minimum_chrome_version": "116"
}
\`\`\`

## SERVICE WORKER (Background) - MV3

\`\`\`typescript
// background.ts - Service Worker completo

// ============================================================================
// LIFECYCLE EVENTS
// ============================================================================

// Instalação/Atualização
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // Primeira instalação
    chrome.storage.local.set({ 
      settings: { enabled: true, theme: 'auto' },
      stats: { uses: 0, installed: Date.now() }
    });
    
    // Abrir página de boas-vindas
    chrome.tabs.create({ url: 'onboarding.html' });
  }
  
  if (details.reason === 'update') {
    // Atualização - migrar dados se necessário
    migrateData(details.previousVersion);
  }
  
  // Criar context menus
  setupContextMenus();
});

// Service Worker ativado (MV3 - não persistente!)
chrome.runtime.onStartup.addListener(() => {
  console.log('Browser started, extension activated');
  // Restaurar estado se necessário
  restoreState();
});

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

// Hub de mensagens centralizado
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message.type, 'from:', sender.tab?.id || 'popup');
  
  // Usar async handler
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => sendResponse({ error: error.message }));
  
  return true; // Manter canal aberto para resposta async
});

async function handleMessage(
  message: { type: string; payload?: any },
  sender: chrome.runtime.MessageSender
): Promise<any> {
  switch (message.type) {
    case 'GET_DATA':
      return await fetchData(message.payload);
    
    case 'SAVE_DATA':
      await chrome.storage.local.set({ data: message.payload });
      return { success: true };
    
    case 'EXECUTE_SCRIPT':
      return await executeInTab(sender.tab?.id, message.payload);
    
    case 'GET_CURRENT_TAB':
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab;
    
    case 'OPEN_OPTIONS':
      await chrome.runtime.openOptionsPage();
      return { success: true };
    
    default:
      throw new Error(\`Unknown message type: \${message.type}\`);
  }
}

// ============================================================================
// CONTEXT MENUS
// ============================================================================

function setupContextMenus() {
  // Limpar menus existentes
  chrome.contextMenus.removeAll();
  
  // Menu principal
  chrome.contextMenus.create({
    id: 'main-menu',
    title: 'My Extension',
    contexts: ['all'],
  });
  
  // Submenu para seleção de texto
  chrome.contextMenus.create({
    id: 'search-selection',
    parentId: 'main-menu',
    title: 'Search "%s"',
    contexts: ['selection'],
  });
  
  // Submenu para links
  chrome.contextMenus.create({
    id: 'save-link',
    parentId: 'main-menu',
    title: 'Save link',
    contexts: ['link'],
  });
  
  // Submenu para imagens
  chrome.contextMenus.create({
    id: 'analyze-image',
    parentId: 'main-menu',
    title: 'Analyze image',
    contexts: ['image'],
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case 'search-selection':
      const searchUrl = \`https://google.com/search?q=\${encodeURIComponent(info.selectionText || '')}\`;
      await chrome.tabs.create({ url: searchUrl });
      break;
    
    case 'save-link':
      await saveLink(info.linkUrl!, tab!);
      break;
    
    case 'analyze-image':
      await analyzeImage(info.srcUrl!, tab!);
      break;
  }
});

// ============================================================================
// ALARMS (Tarefas agendadas)
// ============================================================================

// Criar alarm para tarefas periódicas
chrome.alarms.create('sync-data', { periodInMinutes: 30 });
chrome.alarms.create('cleanup', { periodInMinutes: 60 * 24 }); // Diário

chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('Alarm triggered:', alarm.name);
  
  switch (alarm.name) {
    case 'sync-data':
      await syncDataWithServer();
      break;
    case 'cleanup':
      await cleanupOldData();
      break;
  }
});

// ============================================================================
// TAB EVENTS
// ============================================================================

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Verificar se deve injetar content script
    if (shouldInjectScript(tab.url)) {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js'],
      });
    }
    
    // Atualizar badge
    await updateBadge(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  await updateBadge(activeInfo.tabId, tab.url || '');
});

// ============================================================================
// BADGE & ICON
// ============================================================================

async function updateBadge(tabId: number, url: string) {
  const count = await getCountForUrl(url);
  
  await chrome.action.setBadgeText({ 
    text: count > 0 ? count.toString() : '',
    tabId 
  });
  
  await chrome.action.setBadgeBackgroundColor({ 
    color: count > 10 ? '#FF0000' : '#4CAF50',
    tabId 
  });
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

async function showNotification(title: string, message: string) {
  await chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    priority: 2,
  });
}

chrome.notifications.onClicked.addListener((notificationId) => {
  console.log('Notification clicked:', notificationId);
  chrome.notifications.clear(notificationId);
});

// ============================================================================
// EXTERNAL CONNECTIONS (de websites)
// ============================================================================

chrome.runtime.onMessageExternal.addListener(
  async (message, sender, sendResponse) => {
    // Verificar origem
    if (!sender.url?.startsWith('https://mywebsite.com')) {
      sendResponse({ error: 'Unauthorized' });
      return;
    }
    
    // Processar mensagem do website
    const result = await handleExternalMessage(message);
    sendResponse(result);
    return true;
  }
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function executeInTab(tabId: number | undefined, code: string) {
  if (!tabId) throw new Error('No tab ID');
  
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: new Function(code) as () => void,
  });
  
  return results[0]?.result;
}

async function fetchData(params: any) {
  const response = await fetch('https://api.example.com/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return response.json();
}

function shouldInjectScript(url: string): boolean {
  const patterns = ['https://*.example.com/*'];
  return patterns.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(url);
  });
}
\`\`\`

## CONTENT SCRIPT

\`\`\`typescript
// content.ts - Roda no contexto das páginas web

// ============================================================================
// INITIALIZATION
// ============================================================================

console.log('[MyExtension] Content script loaded');

// Evitar múltiplas injeções
if (window.__myExtensionLoaded) {
  console.log('[MyExtension] Already loaded, skipping');
} else {
  window.__myExtensionLoaded = true;
  initContentScript();
}

declare global {
  interface Window {
    __myExtensionLoaded?: boolean;
  }
}

async function initContentScript() {
  // Aguardar DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDOMReady);
  } else {
    onDOMReady();
  }
}

function onDOMReady() {
  console.log('[MyExtension] DOM ready');
  
  // Injetar UI
  injectUI();
  
  // Observar mudanças no DOM (SPAs)
  observeDOM();
  
  // Setup message listeners
  setupMessageListeners();
}

// ============================================================================
// UI INJECTION
// ============================================================================

function injectUI() {
  // Criar container isolado
  const container = document.createElement('div');
  container.id = 'my-extension-root';
  
  // Shadow DOM para isolamento de CSS
  const shadow = container.attachShadow({ mode: 'closed' });
  
  // Estilos isolados
  const styles = document.createElement('style');
  styles.textContent = \`
    .ext-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .ext-button {
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .ext-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }
    .ext-panel {
      position: absolute;
      bottom: 60px;
      right: 0;
      width: 320px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      display: none;
      overflow: hidden;
    }
    .ext-panel.open { display: block; }
    .ext-panel-header {
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .ext-panel-content { padding: 16px; }
  \`;
  
  // HTML
  const html = document.createElement('div');
  html.className = 'ext-container';
  html.innerHTML = \`
    <div class="ext-panel" id="ext-panel">
      <div class="ext-panel-header">
        <h3 style="margin:0">My Extension</h3>
      </div>
      <div class="ext-panel-content">
        <p>Extension content here</p>
        <button class="ext-button" id="ext-action">Do Something</button>
      </div>
    </div>
    <button class="ext-button" id="ext-toggle">🚀 Extension</button>
  \`;
  
  shadow.appendChild(styles);
  shadow.appendChild(html);
  document.body.appendChild(container);
  
  // Event listeners
  const toggleBtn = shadow.getElementById('ext-toggle');
  const panel = shadow.getElementById('ext-panel');
  const actionBtn = shadow.getElementById('ext-action');
  
  toggleBtn?.addEventListener('click', () => {
    panel?.classList.toggle('open');
  });
  
  actionBtn?.addEventListener('click', async () => {
    const result = await chrome.runtime.sendMessage({ type: 'DO_ACTION' });
    console.log('Action result:', result);
  });
}

// ============================================================================
// DOM OBSERVATION (para SPAs)
// ============================================================================

function observeDOM() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // Verificar novos elementos
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            processNewElement(node);
          }
        });
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function processNewElement(element: HTMLElement) {
  // Exemplo: processar novos elementos específicos
  const targets = element.querySelectorAll('[data-process]');
  targets.forEach((target) => {
    // Processar elemento
    console.log('New element to process:', target);
  });
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Content] Message received:', message.type);
    
    switch (message.type) {
      case 'GET_PAGE_DATA':
        sendResponse(getPageData());
        break;
      
      case 'HIGHLIGHT_ELEMENT':
        highlightElement(message.selector);
        sendResponse({ success: true });
        break;
      
      case 'INJECT_SCRIPT':
        injectScript(message.code);
        sendResponse({ success: true });
        break;
      
      case 'GET_SELECTION':
        sendResponse({ text: window.getSelection()?.toString() });
        break;
      
      default:
        sendResponse({ error: 'Unknown message type' });
    }
    
    return true;
  });
}

// ============================================================================
// PAGE INTERACTION
// ============================================================================

function getPageData() {
  return {
    url: window.location.href,
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
    images: Array.from(document.images).map(img => img.src),
    links: Array.from(document.links).map(link => ({ href: link.href, text: link.textContent })),
    headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
      level: h.tagName,
      text: h.textContent,
    })),
  };
}

function highlightElement(selector: string) {
  const element = document.querySelector(selector);
  if (element instanceof HTMLElement) {
    element.style.outline = '3px solid red';
    element.style.outlineOffset = '2px';
    
    setTimeout(() => {
      element.style.outline = '';
      element.style.outlineOffset = '';
    }, 3000);
  }
}

// ============================================================================
// SCRIPT INJECTION (para acessar contexto da página)
// ============================================================================

function injectScript(code: string) {
  const script = document.createElement('script');
  script.textContent = code;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

// Comunicação com script injetado via postMessage
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data.type !== 'FROM_INJECTED_SCRIPT') return;
  
  console.log('[Content] Message from injected script:', event.data);
  
  // Repassar para background
  chrome.runtime.sendMessage({
    type: 'INJECTED_SCRIPT_DATA',
    payload: event.data.payload,
  });
});
\`\`\`

## POPUP (React + TypeScript)

\`\`\`typescript
// popup/Popup.tsx - Popup completo com React
import { useEffect, useState, useCallback } from 'react';
import './popup.css';

interface Settings {
  enabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
}

interface TabInfo {
  id: number;
  url: string;
  title: string;
}

function Popup() {
  const [settings, setSettings] = useState<Settings>({
    enabled: true,
    theme: 'auto',
    notifications: true,
  });
  const [currentTab, setCurrentTab] = useState<TabInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ uses: 0, saved: 0 });

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        // Get settings
        const { settings: savedSettings } = await chrome.storage.sync.get('settings');
        if (savedSettings) setSettings(savedSettings);
        
        // Get stats
        const { stats: savedStats } = await chrome.storage.local.get('stats');
        if (savedStats) setStats(savedStats);
        
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          setCurrentTab({
            id: tab.id!,
            url: tab.url || '',
            title: tab.title || '',
          });
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Save settings when changed
  const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await chrome.storage.sync.set({ settings: updated });
    
    // Notify background
    chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED', payload: updated });
  }, [settings]);

  // Execute action on current page
  const handleAction = async () => {
    if (!currentTab) return;
    
    setLoading(true);
    try {
      const result = await chrome.runtime.sendMessage({
        type: 'EXECUTE_ACTION',
        payload: { tabId: currentTab.id },
      });
      
      // Update stats
      const newStats = { ...stats, uses: stats.uses + 1 };
      setStats(newStats);
      await chrome.storage.local.set({ stats: newStats });
      
      // Show notification
      if (settings.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: '/icons/icon128.png',
          title: 'Action Complete',
          message: \`Processed: \${result.itemsProcessed} items\`,
        });
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open options page
  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  if (loading) {
    return (
      <div className="popup loading">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="popup" data-theme={settings.theme}>
      {/* Header */}
      <header className="popup-header">
        <img src="/icons/icon48.png" alt="Logo" className="logo" />
        <h1>My Extension</h1>
        <button className="icon-btn" onClick={openOptions} title="Settings">
          ⚙️
        </button>
      </header>

      {/* Current Tab Info */}
      {currentTab && (
        <section className="current-tab">
          <h3>Current Page</h3>
          <p className="tab-title">{currentTab.title}</p>
          <p className="tab-url">{new URL(currentTab.url).hostname}</p>
        </section>
      )}

      {/* Quick Settings */}
      <section className="quick-settings">
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => updateSettings({ enabled: e.target.checked })}
          />
          <span className="toggle-slider" />
          <span className="toggle-label">Extension Enabled</span>
        </label>
        
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) => updateSettings({ notifications: e.target.checked })}
          />
          <span className="toggle-slider" />
          <span className="toggle-label">Notifications</span>
        </label>
      </section>

      {/* Main Action */}
      <section className="actions">
        <button 
          className="primary-btn"
          onClick={handleAction}
          disabled={!settings.enabled || loading}
        >
          {loading ? 'Processing...' : '🚀 Run Action'}
        </button>
      </section>

      {/* Stats */}
      <footer className="popup-footer">
        <div className="stat">
          <span className="stat-value">{stats.uses}</span>
          <span className="stat-label">Uses</span>
        </div>
        <div className="stat">
          <span className="stat-value">{stats.saved}</span>
          <span className="stat-label">Items Saved</span>
        </div>
      </footer>
    </div>
  );
}

export default Popup;
\`\`\`

## STORAGE API COMPLETA

\`\`\`typescript
// lib/storage.ts - Wrapper tipado para chrome.storage

type StorageArea = 'local' | 'sync' | 'session';

interface StorageSchema {
  settings: {
    enabled: boolean;
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
  };
  stats: {
    uses: number;
    saved: number;
    installed: number;
  };
  cache: Record<string, { data: any; expires: number }>;
}

// Wrapper tipado
export const storage = {
  async get<K extends keyof StorageSchema>(
    key: K,
    area: StorageArea = 'local'
  ): Promise<StorageSchema[K] | undefined> {
    const result = await chrome.storage[area].get(key);
    return result[key];
  },

  async set<K extends keyof StorageSchema>(
    key: K,
    value: StorageSchema[K],
    area: StorageArea = 'local'
  ): Promise<void> {
    await chrome.storage[area].set({ [key]: value });
  },

  async remove(key: keyof StorageSchema, area: StorageArea = 'local'): Promise<void> {
    await chrome.storage[area].remove(key);
  },

  async clear(area: StorageArea = 'local'): Promise<void> {
    await chrome.storage[area].clear();
  },

  // Cache com TTL
  async getWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 5 * 60 * 1000
  ): Promise<T> {
    const cache = await this.get('cache') || {};
    const cached = cache[key];
    
    if (cached && cached.expires > Date.now()) {
      return cached.data as T;
    }
    
    const data = await fetcher();
    cache[key] = { data, expires: Date.now() + ttlMs };
    await this.set('cache', cache);
    
    return data;
  },

  // Listener tipado
  onChange<K extends keyof StorageSchema>(
    key: K,
    callback: (newValue: StorageSchema[K], oldValue: StorageSchema[K]) => void,
    area: StorageArea = 'local'
  ): () => void {
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === area && changes[key]) {
        callback(changes[key].newValue, changes[key].oldValue);
      }
    };
    
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  },
};

// Uso
const settings = await storage.get('settings', 'sync');
await storage.set('stats', { uses: 10, saved: 5, installed: Date.now() });

// Com cache
const data = await storage.getWithCache(
  'api-data',
  () => fetch('https://api.example.com/data').then(r => r.json()),
  10 * 60 * 1000 // 10 minutos
);
\`\`\`

## BUILD SETUP (CRXJS + Vite + React)

\`\`\`typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  build: {
    rollupOptions: {
      input: {
        popup: 'popup.html',
        options: 'options.html',
        sidepanel: 'sidepanel.html',
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});
\`\`\`

\`\`\`json
// package.json
{
  "name": "my-extension",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "zip": "cd dist && zip -r ../extension.zip ."
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@crxjs/vite-plugin": "^2.0.0-beta.23",
    "@types/chrome": "^0.0.260",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
\`\`\`

## CROSS-BROWSER COMPATIBILITY

\`\`\`typescript
// lib/browser-polyfill.ts
// Usar webextension-polyfill para compatibilidade

import browser from 'webextension-polyfill';

// Agora pode usar browser.* com Promises em todos os browsers
export { browser };

// Ou criar wrapper manual
export const browserAPI = {
  storage: {
    local: {
      get: (keys: string | string[]) => 
        new Promise((resolve) => chrome.storage.local.get(keys, resolve)),
      set: (items: object) => 
        new Promise((resolve) => chrome.storage.local.set(items, resolve)),
    },
    sync: {
      get: (keys: string | string[]) => 
        new Promise((resolve) => chrome.storage.sync.get(keys, resolve)),
      set: (items: object) => 
        new Promise((resolve) => chrome.storage.sync.set(items, resolve)),
    },
  },
  tabs: {
    query: (queryInfo: chrome.tabs.QueryInfo) =>
      new Promise<chrome.tabs.Tab[]>((resolve) => chrome.tabs.query(queryInfo, resolve)),
    sendMessage: (tabId: number, message: any) =>
      new Promise((resolve) => chrome.tabs.sendMessage(tabId, message, resolve)),
  },
  runtime: {
    sendMessage: (message: any) =>
      new Promise((resolve) => chrome.runtime.sendMessage(message, resolve)),
  },
};
\`\`\`

## TESTING

\`\`\`typescript
// tests/background.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock chrome API
const mockChrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
  runtime: {
    onMessage: {
      addListener: vi.fn(),
    },
    sendMessage: vi.fn(),
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
  },
};

vi.stubGlobal('chrome', mockChrome);

describe('Background Service Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle GET_DATA message', async () => {
    mockChrome.storage.local.get.mockResolvedValue({ data: 'test' });
    
    // Import after mocking
    const { handleMessage } = await import('../background');
    
    const result = await handleMessage({ type: 'GET_DATA' }, {});
    
    expect(result).toEqual({ data: 'test' });
  });

  it('should save data correctly', async () => {
    const { handleMessage } = await import('../background');
    
    await handleMessage({ type: 'SAVE_DATA', payload: { key: 'value' } }, {});
    
    expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
      data: { key: 'value' },
    });
  });
});

// E2E testing with Playwright
// tests/e2e/extension.spec.ts
import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';

let context: BrowserContext;

test.beforeAll(async () => {
  const pathToExtension = path.join(__dirname, '../../dist');
  
  context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      \`--disable-extensions-except=\${pathToExtension}\`,
      \`--load-extension=\${pathToExtension}\`,
    ],
  });
});

test.afterAll(async () => {
  await context.close();
});

test('popup should open and display correctly', async () => {
  // Get extension ID
  const [background] = context.serviceWorkers();
  const extensionId = background.url().split('/')[2];
  
  // Open popup
  const popup = await context.newPage();
  await popup.goto(\`chrome-extension://\${extensionId}/popup.html\`);
  
  // Verify content
  await expect(popup.locator('h1')).toHaveText('My Extension');
  await expect(popup.locator('.primary-btn')).toBeVisible();
});

test('content script should inject UI', async () => {
  const page = await context.newPage();
  await page.goto('https://example.com');
  
  // Wait for content script
  await page.waitForSelector('#my-extension-root');
  
  // Verify UI is injected
  const extensionUI = page.locator('#my-extension-root');
  await expect(extensionUI).toBeVisible();
});
\`\`\`

## PUBLISHING

\`\`\`yaml
Chrome Web Store:
  url: https://chrome.google.com/webstore/devconsole
  fee: $5 (one-time)
  review_time: 1-3 days
  requirements:
    - manifest.json válido
    - Icons: 128x128 (store), 16/32/48/128 (extension)
    - Screenshots: 1280x800 ou 640x400
    - Privacy policy URL
    - Descrição detalhada

Firefox Add-ons (AMO):
  url: https://addons.mozilla.org/developers/
  fee: Free
  review_time: 1-7 days
  requirements:
    - Source code (se minificado)
    - Privacy policy
    - Screenshots

Edge Add-ons:
  url: https://partner.microsoft.com/dashboard/microsoftedge
  fee: Free
  review_time: 1-3 days
  notes: Aceita extensões Chrome com mínimas mudanças

Safari Extensions:
  url: App Store Connect
  fee: $99/year (Apple Developer)
  requirements:
    - Xcode project wrapper
    - App Store review
\`\`\`

## SECURITY BEST PRACTICES

\`\`\`typescript
// 1. Content Security Policy rigoroso
// manifest.json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline'"
  }
}

// 2. Validar todas as mensagens
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Verificar origem
  if (!sender.tab && !sender.url?.startsWith('chrome-extension://')) {
    console.warn('Message from unknown source');
    return;
  }
  
  // Validar estrutura da mensagem
  if (!message || typeof message.type !== 'string') {
    sendResponse({ error: 'Invalid message format' });
    return;
  }
  
  // Sanitizar dados
  const sanitizedPayload = sanitize(message.payload);
  
  // Processar
  handleMessage({ ...message, payload: sanitizedPayload }, sender, sendResponse);
  return true;
});

// 3. Nunca usar eval() ou innerHTML com dados externos
// ❌ ERRADO
element.innerHTML = userInput;
eval(code);

// ✅ CERTO
element.textContent = userInput;
// Ou usar DOMPurify para HTML
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);

// 4. Criptografar dados sensíveis
import { encrypt, decrypt } from './crypto';

async function saveSecureData(key: string, data: any) {
  const encrypted = await encrypt(JSON.stringify(data), SECRET_KEY);
  await chrome.storage.local.set({ [key]: encrypted });
}

async function getSecureData(key: string) {
  const { [key]: encrypted } = await chrome.storage.local.get(key);
  if (!encrypted) return null;
  const decrypted = await decrypt(encrypted, SECRET_KEY);
  return JSON.parse(decrypted);
}

// 5. Permissions on demand
async function requestPermission(permission: string) {
  const granted = await chrome.permissions.request({
    permissions: [permission],
  });
  
  if (!granted) {
    throw new Error(\`Permission \${permission} denied\`);
  }
  
  return granted;
}
\`\`\`

## CHECKLIST COMPLETO

### Manifest & Permissions
- [ ] Manifest V3 compliant?
- [ ] Permissions são o mínimo necessário?
- [ ] Host permissions específicas (não \`<all_urls>\`)?
- [ ] Optional permissions para features não-essenciais?
- [ ] Icons em todos os tamanhos (16, 32, 48, 128)?

### Service Worker
- [ ] Não depende de estado persistente?
- [ ] Usa chrome.alarms para tarefas periódicas?
- [ ] Error handling em todos os listeners?
- [ ] Logs estruturados para debug?

### Content Scripts
- [ ] Injetado apenas onde necessário?
- [ ] Usa Shadow DOM para isolamento de CSS?
- [ ] Não conflita com scripts da página?
- [ ] Cleanup ao descarregar?

### Security
- [ ] CSP configurado corretamente?
- [ ] Sem eval() ou Function()?
- [ ] Mensagens validadas e sanitizadas?
- [ ] Dados sensíveis criptografados?
- [ ] Sem secrets hardcoded?

### UX
- [ ] Popup responsivo e rápido?
- [ ] Feedback visual para ações?
- [ ] Funciona offline quando possível?
- [ ] Keyboard shortcuts configurados?

### Publishing
- [ ] Privacy policy criada?
- [ ] Screenshots de qualidade?
- [ ] Descrição clara e completa?
- [ ] Testado em múltiplos browsers?
- [ ] Versão incrementada?

## ANTI-PATTERNS

❌ **NUNCA** peça \`<all_urls>\` sem necessidade real
❌ **NUNCA** use \`activeTab\` + \`scripting\` para espionar usuários
❌ **NUNCA** armazene senhas ou tokens em plain text
❌ **NUNCA** injete scripts em todas as páginas
❌ **NUNCA** use eval(), new Function(), ou innerHTML com dados externos
❌ **NUNCA** ignore o ciclo de vida do service worker (não é persistente!)
❌ **NUNCA** faça requests para domínios não declarados
❌ **NUNCA** colete dados sem consentimento explícito
❌ **NUNCA** publique com console.log() em produção
❌ **NUNCA** ignore erros silenciosamente

## RECURSOS

- Chrome Extensions Docs: https://developer.chrome.com/docs/extensions/
- Firefox Add-ons Docs: https://extensionworkshop.com/
- CRXJS Vite Plugin: https://crxjs.dev/vite-plugin
- Plasmo Framework: https://docs.plasmo.com/
- WXT Framework: https://wxt.dev/
- webextension-polyfill: https://github.com/nicolo-ribaudo/webextension-polyfill
`;

export default BROWSER_EXTENSIONS_MANIFEST;
