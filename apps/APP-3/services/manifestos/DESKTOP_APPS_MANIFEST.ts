/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                                  ║
 * ║  ██████╗ ███████╗███████╗██╗  ██╗████████╗ ██████╗ ██████╗      █████╗ ██████╗ ██████╗ ███████╗  ║
 * ║  ██╔══██╗██╔════╝██╔════╝██║ ██╔╝╚══██╔══╝██╔═══██╗██╔══██╗    ██╔══██╗██╔══██╗██╔══██╗██╔════╝  ║
 * ║  ██║  ██║█████╗  ███████╗█████╔╝    ██║   ██║   ██║██████╔╝    ███████║██████╔╝██████╔╝███████╗  ║
 * ║  ██║  ██║██╔══╝  ╚════██║██╔═██╗    ██║   ██║   ██║██╔═══╝     ██╔══██║██╔═══╝ ██╔═══╝ ╚════██║  ║
 * ║  ██████╔╝███████╗███████║██║  ██╗   ██║   ╚██████╔╝██║         ██║  ██║██║     ██║     ███████║  ║
 * ║  ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝         ╚═╝  ╚═╝╚═╝     ╚═╝     ╚══════╝  ║
 * ║                                                                                                  ║
 * ║  DESKTOP APPS SUPREME MASTER - Electron, Tauri, Cross-Platform Development                      ║
 * ║  Windows, macOS, Linux - Native Features with Web Technologies                                  ║
 * ║                                                                                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════════════════╝
 */

export const DESKTOP_APPS_MANIFEST = `
# 🖥️ DESKTOP APPS SUPREME MASTER

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Desktop App, Aplicativo Desktop, Native App
- Electron, Tauri, NW.js, Neutralino
- Cross-platform, Windows, macOS, Linux
- Native, System Tray, Notifications, Menu Bar
- Auto-update, Code Signing, Packaging, Installer
- IPC, Main Process, Renderer Process
- File System Access, Native APIs, Shell Integration

## FILOSOFIA
> "Web skills, native power. O melhor dos dois mundos."

### Princípios Invioláveis
1. **Security First** - Context isolation, no node integration in renderer
2. **Performance Matters** - Startup time, memory usage, responsiveness
3. **Native Feel** - Respeite as convenções de cada OS
4. **Offline First** - Desktop apps devem funcionar sem internet
5. **Auto-Update** - Mantenha usuários sempre atualizados
6. **Code Signing** - Assine seu app para distribuição confiável

## ARQUITETURA DESKTOP

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DESKTOP APP ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     MAIN PROCESS (Node.js/Rust)                      │   │
│  │  • Gerencia janelas                                                  │   │
│  │  • Acesso ao sistema de arquivos                                    │   │
│  │  • System tray, menus nativos                                       │   │
│  │  • Auto-update                                                       │   │
│  │  • IPC hub                                                           │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│                            IPC Bridge                                       │
│                                 │                                           │
│  ┌──────────────────────────────┴──────────────────────────────────────┐   │
│  │                    RENDERER PROCESS (Chromium/WebView)               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │   React     │  │    Vue      │  │   Svelte    │                  │   │
│  │  │   App       │  │    App      │  │    App      │                  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│  │                                                                      │   │
│  │  • UI/UX                                                             │   │
│  │  • Sem acesso direto ao sistema                                     │   │
│  │  • Comunicação via IPC                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        NATIVE LAYER                                  │   │
│  │  [File System] [Notifications] [Tray] [Clipboard] [Shell] [Dialog]  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
\`\`\`

## COMPARATIVO DETALHADO

| Feature | Electron | Tauri | Neutralino |
|---------|----------|-------|------------|
| Bundle Size | ~150MB | ~3-10MB | ~2MB |
| Memory Usage | ~100-300MB | ~30-80MB | ~20-50MB |
| Backend | Node.js | Rust | C++ |
| Webview | Chromium bundled | System WebView | System WebView |
| Startup Time | 2-5s | <1s | <1s |
| Maturity | Alta (2013) | Média (2019) | Baixa |
| Ecosystem | Enorme | Crescendo | Pequeno |
| Learning Curve | Baixa | Média (Rust) | Baixa |
| Best For | Apps complexos | Apps leves | Apps simples |

## TAURI 2.0 (Recomendado para novos projetos)

### Setup
\`\`\`bash
# Criar novo projeto Tauri 2.0
npm create tauri-app@latest my-app -- --template react-ts

# Ou adicionar a projeto existente
cd my-existing-app
npm install @tauri-apps/cli@next
npm run tauri init
\`\`\`

### Configuração Completa
\`\`\`json
// src-tauri/tauri.conf.json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "My App",
  "version": "1.0.0",
  "identifier": "com.mycompany.myapp",
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "My App",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false,
        "decorations": true,
        "transparent": false,
        "center": true
      }
    ],
    "security": {
      "csp": "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'"
    },
    "trayIcon": {
      "iconPath": "icons/tray.png",
      "iconAsTemplate": true
    }
  },
  "bundle": {
    "active": true,
    "targets": ["dmg", "nsis", "deb", "appimage"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": ""
    },
    "macOS": {
      "entitlements": null,
      "signingIdentity": null
    }
  },
  "plugins": {
    "updater": {
      "endpoints": ["https://releases.myapp.com/{{target}}/{{arch}}/{{current_version}}"],
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}
\`\`\`

### Rust Backend Completo
\`\`\`rust
// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, State};
use std::sync::Mutex;
use serde::{Deserialize, Serialize};

// Estado global da aplicação
struct AppState {
    counter: Mutex<i32>,
    config: Mutex<AppConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct AppConfig {
    theme: String,
    language: String,
    auto_save: bool,
}

// Comando simples
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to Tauri.", name)
}

// Comando com estado
#[tauri::command]
fn increment_counter(state: State<AppState>) -> i32 {
    let mut counter = state.counter.lock().unwrap();
    *counter += 1;
    *counter
}

// Comando async com Result
#[tauri::command]
async fn fetch_data(url: String) -> Result<String, String> {
    reqwest::get(&url)
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())
}

// Comando para ler arquivo
#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))
}

// Comando para salvar arquivo
#[tauri::command]
async fn save_file(path: String, content: String) -> Result<(), String> {
    tokio::fs::write(&path, &content)
        .await
        .map_err(|e| format!("Failed to save file: {}", e))
}

// Comando para configurações
#[tauri::command]
fn get_config(state: State<AppState>) -> AppConfig {
    state.config.lock().unwrap().clone()
}

#[tauri::command]
fn set_config(state: State<AppState>, config: AppConfig) {
    *state.config.lock().unwrap() = config;
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            counter: Mutex::new(0),
            config: Mutex::new(AppConfig {
                theme: "system".to_string(),
                language: "en".to_string(),
                auto_save: true,
            }),
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            increment_counter,
            fetch_data,
            read_file,
            save_file,
            get_config,
            set_config,
        ])
        .setup(|app| {
            // Setup inicial
            let window = app.get_webview_window("main").unwrap();
            
            // System tray
            #[cfg(desktop)]
            {
                use tauri::menu::{Menu, MenuItem};
                use tauri::tray::TrayIconBuilder;
                
                let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
                let menu = Menu::with_items(app, &[&quit])?;
                
                TrayIconBuilder::new()
                    .icon(app.default_window_icon().unwrap().clone())
                    .menu(&menu)
                    .on_menu_event(|app, event| {
                        if event.id.as_ref() == "quit" {
                            app.exit(0);
                        }
                    })
                    .build(app)?;
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
\`\`\`

### Frontend Integration (React + TypeScript)
\`\`\`typescript
// src/lib/tauri.ts
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { sendNotification } from '@tauri-apps/plugin-notification';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

// Tipagem para comandos
interface AppConfig {
  theme: 'light' | 'dark' | 'system';
  language: string;
  autoSave: boolean;
}

// Wrapper tipado para invoke
export const commands = {
  greet: (name: string) => invoke<string>('greet', { name }),
  incrementCounter: () => invoke<number>('increment_counter'),
  fetchData: (url: string) => invoke<string>('fetch_data', { url }),
  readFile: (path: string) => invoke<string>('read_file', { path }),
  saveFile: (path: string, content: string) => invoke<void>('save_file', { path, content }),
  getConfig: () => invoke<AppConfig>('get_config'),
  setConfig: (config: AppConfig) => invoke<void>('set_config', { config }),
};

// File operations
export async function openFile(): Promise<{ path: string; content: string } | null> {
  const selected = await open({
    multiple: false,
    filters: [
      { name: 'Text Files', extensions: ['txt', 'md', 'json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  
  if (!selected) return null;
  
  const content = await readTextFile(selected.path);
  return { path: selected.path, content };
}

export async function saveFileAs(content: string): Promise<string | null> {
  const path = await save({
    filters: [{ name: 'Text Files', extensions: ['txt', 'md'] }],
  });
  
  if (!path) return null;
  
  await writeTextFile(path, content);
  return path;
}

// Notifications
export async function notify(title: string, body: string) {
  await sendNotification({ title, body });
}

// Auto-update
export async function checkForUpdates(): Promise<boolean> {
  try {
    const update = await check();
    if (update?.available) {
      await update.downloadAndInstall();
      await relaunch();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Update check failed:', error);
    return false;
  }
}

// src/App.tsx
import { useState, useEffect } from 'react';
import { commands, openFile, saveFileAs, notify } from './lib/tauri';

function App() {
  const [content, setContent] = useState('');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    commands.getConfig().then(setConfig);
  }, []);

  const handleOpen = async () => {
    const result = await openFile();
    if (result) {
      setContent(result.content);
      setFilePath(result.path);
    }
  };

  const handleSave = async () => {
    if (filePath) {
      await commands.saveFile(filePath, content);
      await notify('Saved', 'File saved successfully!');
    } else {
      const path = await saveFileAs(content);
      if (path) setFilePath(path);
    }
  };

  return (
    <div className="app">
      <header>
        <button onClick={handleOpen}>Open</button>
        <button onClick={handleSave}>Save</button>
      </header>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start typing..."
      />
    </div>
  );
}
\`\`\`

## ELECTRON (Para apps complexos)

### Main Process Completo
\`\`\`typescript
// src/main/main.ts
import { app, BrowserWindow, ipcMain, Menu, Tray, dialog, shell, nativeTheme } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import fs from 'fs/promises';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // Mostrar quando pronto
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1a1a1a' : '#ffffff',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,      // OBRIGATÓRIO
      nodeIntegration: false,      // OBRIGATÓRIO
      sandbox: true,               // Recomendado
      webSecurity: true,
    },
  });

  // Mostrar quando pronto (evita flash branco)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Carregar app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Prevenir navegação externa
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://localhost') && !url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Menu nativo
function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu-open'),
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu-save'),
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// System Tray
function createTray() {
  tray = new Tray(path.join(__dirname, '../assets/tray-icon.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);
  
  tray.setToolTip('My App');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show();
  });
}

// IPC Handlers
function setupIPC() {
  // File operations
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [
        { name: 'Text Files', extensions: ['txt', 'md', 'json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    
    if (result.canceled || !result.filePaths[0]) return null;
    
    const content = await fs.readFile(result.filePaths[0], 'utf-8');
    return { path: result.filePaths[0], content };
  });

  ipcMain.handle('dialog:saveFile', async (_, content: string) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      filters: [{ name: 'Text Files', extensions: ['txt', 'md'] }],
    });
    
    if (result.canceled || !result.filePath) return null;
    
    await fs.writeFile(result.filePath, content, 'utf-8');
    return result.filePath;
  });

  ipcMain.handle('fs:readFile', async (_, filePath: string) => {
    return fs.readFile(filePath, 'utf-8');
  });

  ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
    await fs.writeFile(filePath, content, 'utf-8');
  });

  // App info
  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.handle('app:getPlatform', () => process.platform);
  
  // Theme
  ipcMain.handle('theme:get', () => nativeTheme.themeSource);
  ipcMain.handle('theme:set', (_, theme: 'light' | 'dark' | 'system') => {
    nativeTheme.themeSource = theme;
  });
}

// Auto-updater
function setupAutoUpdater() {
  autoUpdater.autoDownload = false;
  
  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-available', info);
  });
  
  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update-progress', progress);
  });
  
  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update-downloaded');
  });
  
  ipcMain.handle('updater:check', () => autoUpdater.checkForUpdates());
  ipcMain.handle('updater:download', () => autoUpdater.downloadUpdate());
  ipcMain.handle('updater:install', () => autoUpdater.quitAndInstall());
}

// App lifecycle
app.whenReady().then(async () => {
  createMenu();
  setupIPC();
  setupAutoUpdater();
  await createWindow();
  createTray();
  
  // Check for updates
  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdates();
  }
});

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
\`\`\`

### Preload Script (Security Bridge)
\`\`\`typescript
// src/preload/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Expor API segura para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (content: string) => ipcRenderer.invoke('dialog:saveFile', content),
  readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('fs:writeFile', path, content),
  
  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
  
  // Theme
  getTheme: () => ipcRenderer.invoke('theme:get'),
  setTheme: (theme: 'light' | 'dark' | 'system') => ipcRenderer.invoke('theme:set', theme),
  
  // Updater
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  
  // Event listeners
  onMenuOpen: (callback: () => void) => {
    ipcRenderer.on('menu-open', callback);
    return () => ipcRenderer.removeListener('menu-open', callback);
  },
  onMenuSave: (callback: () => void) => {
    ipcRenderer.on('menu-save', callback);
    return () => ipcRenderer.removeListener('menu-save', callback);
  },
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-available', (_, info) => callback(info));
  },
  onUpdateProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('update-progress', (_, progress) => callback(progress));
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', callback);
  },
});

// Tipagem para o renderer
declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<{ path: string; content: string } | null>;
      saveFile: (content: string) => Promise<string | null>;
      readFile: (path: string) => Promise<string>;
      writeFile: (path: string, content: string) => Promise<void>;
      getVersion: () => Promise<string>;
      getPlatform: () => Promise<NodeJS.Platform>;
      getTheme: () => Promise<'light' | 'dark' | 'system'>;
      setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
      checkForUpdates: () => Promise<void>;
      downloadUpdate: () => Promise<void>;
      installUpdate: () => Promise<void>;
      onMenuOpen: (callback: () => void) => () => void;
      onMenuSave: (callback: () => void) => () => void;
      onUpdateAvailable: (callback: (info: any) => void) => void;
      onUpdateProgress: (callback: (progress: any) => void) => void;
      onUpdateDownloaded: (callback: () => void) => void;
    };
  }
}
\`\`\`

## CODE SIGNING & DISTRIBUTION

### macOS
\`\`\`bash
# Requisitos:
# - Apple Developer Account ($99/ano)
# - Developer ID Application certificate
# - Developer ID Installer certificate

# Electron Builder config
# electron-builder.yml
mac:
  category: public.app-category.productivity
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  notarize:
    teamId: YOUR_TEAM_ID

# Notarização automática (requer credenciais)
export APPLE_ID=your@email.com
export APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
export APPLE_TEAM_ID=XXXXXXXXXX
\`\`\`

### Windows
\`\`\`yaml
# electron-builder.yml
win:
  target:
    - target: nsis
      arch: [x64, arm64]
  sign: ./sign.js
  certificateFile: ./cert.pfx
  certificatePassword: \${env.WIN_CSC_KEY_PASSWORD}

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
\`\`\`

### Linux
\`\`\`yaml
# electron-builder.yml
linux:
  target:
    - AppImage
    - deb
    - rpm
  category: Utility
  maintainer: your@email.com
\`\`\`

## CHECKLIST COMPLETO

### Security
- [ ] contextIsolation: true?
- [ ] nodeIntegration: false?
- [ ] sandbox: true?
- [ ] webSecurity: true?
- [ ] Preload script usa contextBridge?
- [ ] Sem eval() ou Function()?
- [ ] CSP configurado?

### Features
- [ ] Auto-update funcionando?
- [ ] Code signing configurado?
- [ ] System tray implementado?
- [ ] Menu nativo configurado?
- [ ] Deep links funcionando?
- [ ] Single instance lock?

### Distribution
- [ ] Installers para Windows (NSIS)?
- [ ] DMG para macOS?
- [ ] AppImage/deb/rpm para Linux?
- [ ] Notarização macOS?
- [ ] Assinatura Windows?

### UX
- [ ] Splash screen ou loading state?
- [ ] Tema claro/escuro?
- [ ] Atalhos de teclado?
- [ ] Drag & drop de arquivos?
- [ ] Offline support?

## ANTI-PATTERNS

❌ **NUNCA** desabilite contextIsolation (vulnerabilidade crítica)
❌ **NUNCA** use nodeIntegration: true no renderer
❌ **NUNCA** ignore code signing (usuários não confiarão)
❌ **NUNCA** exponha APIs do Node.js diretamente
❌ **NUNCA** use shell.openExternal sem validar URL
❌ **NUNCA** carregue conteúdo remoto sem CSP
❌ **NUNCA** armazene secrets no código
❌ **NUNCA** ignore atualizações de segurança do Electron

## RECURSOS

- Tauri Docs: https://tauri.app/
- Electron Docs: https://www.electronjs.org/docs
- Electron Builder: https://www.electron.build/
- Electron Forge: https://www.electronforge.io/
- Electron Security: https://www.electronjs.org/docs/latest/tutorial/security
`;

export default DESKTOP_APPS_MANIFEST;
