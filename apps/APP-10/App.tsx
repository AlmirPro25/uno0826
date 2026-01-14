
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bot, ShieldCheck, FileArchive, Maximize2, Minimize2, RotateCw, Globe, Layout, Lock, Terminal as TerminalIcon, Zap, Play, Power, AlertTriangle, Eye, XCircle, RefreshCw, Wand2, PanelLeft, ChevronRight, Command, CheckCircle2, Sparkles, Undo, Redo, Activity, X, Stethoscope, Folder } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { PreviewFrame } from './components/PreviewFrame';
import { LocalPreview } from './components/LocalPreview';
import { CodeEditor, CodeEditorHandle } from './components/CodeEditor';
import { TabbedTerminal } from './components/TabbedTerminal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ScorePanel } from './components/ScorePanel';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { SettingsModal } from './components/SettingsModal';
import { WorkspaceSelector } from './components/WorkspaceSelector';
import { generateInterfaceStream, refineAndStructureProject, cleanResponse, ToolExecutor, resetChatSession, getAutoFixSuggestion } from './services/gemini';
import { evaluateCode, autoRefineCode } from './services/excellence';
import * as Memory from './services/memory';
import { ProcessManagerService } from './services/processManager';
import { WebContainerService } from './services/webcontainer';
import { RuntimeService, isLocalMode, getRuntimeBridge, canRunWebContainer, isBackendOnline } from './services/runtimeBridge';
import { formatCode } from './services/formatter';
import { DEFAULT_PLACEHOLDER_HTML, MODELS } from './constants';
import { Message, VirtualFile, Attachment } from './types';
import { parseVirtualFiles, updateVirtualFile, filesToWebContainerTree, normalizePath } from './utils/fileSystem';
import { useStore } from './store';
import { FileIcon } from './components/FileExplorer';
// @ts-ignore
import JSZip from 'jszip';
import { Terminal as XTerm } from 'xterm';
// @ts-ignore
import { Toaster, toast } from 'sonner';

const App: React.FC = () => {
  // --- STORE HOOKS ---
  const {
    currentCode, setCurrentCode, updateFileContent,
    virtualFiles,
    activeFile, setActiveFile,
    openFiles, closeFile,
    messages, setMessages, addMessage,
    isLoading, setIsLoading,
    selectedModel, setSelectedModel,
    isSidebarOpen, toggleSidebar,
    isWcBooted, setWcBooted,
    wcUrl, setWcUrl,
    wcError, setWcError,
    excellenceReport, setExcellenceReport,
    isRefining, setIsRefining,
    loadingStates, setLoading,
    openConfirmation,
    renameFile,
    agentStatus, setAgentStatus,
    setActiveFileAction
  } = useStore();

  // --- LOCAL UI STATE ---
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [shellWriter, setShellWriter] = useState<WritableStreamDefaultWriter<string> | null>(null);
  const [shellProcess, setShellProcess] = useState<any>(null);
  const terminalRef = useRef<XTerm | null>(null);
  const editorRef = useRef<CodeEditorHandle>(null);
  const [isPreviewMode, setIsPreviewMode] = useState<'live' | 'static'>('static');
  
  // Workspace State (Local Mode)
  const [isWorkspaceSelectorOpen, setIsWorkspaceSelectorOpen] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<string | null>(null);

  // Auto-Reload State
  const [reloadSignal, setReloadSignal] = useState(0);
  const reloadDebounceRef = useRef<any>(null);

  // --- RESIZABLE LAYOUT STATE ---
  const [sidebarWidth, setSidebarWidth] = useState(280); 
  const [editorPercentage, setEditorPercentage] = useState(50);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(180);
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  
  const appContainerRef = useRef<HTMLDivElement>(null);
  const isResizingSidebar = useRef(false);
  const isResizingEditor = useRef(false);
  const isResizingBottom = useRef(false);
  
  // Load current workspace (Local Mode)
  useEffect(() => {
    if (isLocalMode) {
      import('./services/localRuntime').then(({ LocalRuntimeService }) => {
        LocalRuntimeService.getWorkspace().then(ws => {
          setCurrentWorkspace(ws.path);
        }).catch(() => {});
      });
    }
  }, []);
  
  // Auto-Boot Logic
  useEffect(() => {
    const t = setTimeout(() => {
        const state = useStore.getState();
        // Em modo local, sempre tenta conectar. Em WebContainer, precisa de crossOriginIsolated
        const canBoot = isLocalMode || window.crossOriginIsolated;
        if (canBoot && !state.isWcBooted && !loadingStates.boot && !state.wcError) {
            bootWebContainer();
        }
    }, 800);
    return () => clearTimeout(t);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S - Save/Format current file
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (activeFile) {
          toast.success(`Saved: ${activeFile}`);
        }
      }
      
      // Ctrl+B - Toggle sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      
      // Ctrl+` - Toggle terminal
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        setShowBottomPanel(prev => !prev);
      }
      
      // Ctrl+Shift+P - Command palette (focus chat)
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        // Focus no chat input
        const chatInput = document.querySelector('textarea[placeholder*="Ask Maestro"]') as HTMLTextAreaElement;
        if (chatInput) chatInput.focus();
      }
      
      // F5 - Reload preview
      if (e.key === 'F5' && !e.ctrlKey) {
        e.preventDefault();
        setReloadSignal(prev => prev + 1);
        toast.info('Preview reloaded');
      }
      
      // Escape - Close modals/panels
      if (e.key === 'Escape') {
        if (isFullScreen) {
          setIsFullScreen(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeFile, isFullScreen]);

  const getAllPaths = (files: VirtualFile[]): string[] => {
    let paths: string[] = [];
    files.forEach(f => {
        paths.push(f.path);
        if (f.children) {
            paths = [...paths, ...getAllPaths(f.children)];
        }
    });
    return paths;
  };

  const activeFileContent = useMemo(() => {
    if (!activeFile) return '';
    const findFile = (files: VirtualFile[]): VirtualFile | undefined => {
        for (const f of files) {
            if (f.path === activeFile) return f;
            if (f.children) {
                const found = findFile(f.children);
                if (found) return found;
            }
        }
    };
    return findFile(virtualFiles)?.content || '';
  }, [virtualFiles, activeFile]);

  const activeFileLanguage = useMemo(() => {
    if (!activeFile) return 'text';
    const findFile = (files: VirtualFile[]): VirtualFile | undefined => {
        for (const f of files) {
            if (f.path === activeFile) return f;
            if (f.children) {
                const found = findFile(f.children);
                if (found) return found;
            }
        }
    };
    return findFile(virtualFiles)?.language || 'text';
  }, [virtualFiles, activeFile]);

  // --- HELPER: Find file content ---
  const findFileContent = (files: VirtualFile[], path: string): string | null => {
    for (const f of files) {
      if (f.path === path) return f.content;
      if (f.children) {
        const found = findFileContent(f.children, path);
        if (found !== null) return found;
      }
    }
    return null;
  };

  // --- TOOL EXECUTOR IMPLEMENTATION ---
  const toolExecutor: ToolExecutor = {
      // === FILE OPERATIONS ===
      readFile: async (path) => {
          const cleanPath = normalizePath(path);
          setAgentStatus(`Reading ${cleanPath}`);
          setActiveFileAction({ type: 'read', path: cleanPath });
          
          const content = findFileContent(useStore.getState().virtualFiles, cleanPath);
          
          setActiveFileAction(null);
          setAgentStatus(null);
          return content ?? `File not found: ${cleanPath}`;
      },

      readMultipleFiles: async (paths) => {
        setAgentStatus(`Reading ${paths.length} files`);
        const state = useStore.getState();
        const results: string[] = [];
        
        for (const path of paths) {
            const cleanPath = normalizePath(path);
            const content = findFileContent(state.virtualFiles, cleanPath);
            results.push(content !== null 
                ? `--- ${cleanPath} ---\n${content}`
                : `--- ${cleanPath} (NOT FOUND) ---`
            );
        }
        setAgentStatus(null);
        return results.join('\n\n');
      },

      writeFile: async (path, content) => {
           const cleanPath = normalizePath(path);
           setAgentStatus(`Writing ${cleanPath}`);
           setActiveFileAction({ type: 'write', path: cleanPath });

           const state = useStore.getState();
           state.updateFileContent(cleanPath, content);
           if (state.isWcBooted) {
               await RuntimeService.writeFile(cleanPath, content);
           }
           state.setActiveFile(cleanPath);

           setActiveFileAction(null);
           setAgentStatus(null);
           return `OK: ${cleanPath}`;
      },

      writeMultipleFiles: async (files) => {
           setAgentStatus(`Writing ${files.length} files`);
           const state = useStore.getState();
           const written: string[] = [];
           
           // Auto-boot se necessário e temos package.json
           const hasPackageJson = files.some(f => normalizePath(f.path) === 'package.json');
           if (hasPackageJson && !state.isWcBooted) {
               setAgentStatus("⚡ Auto-booting runtime...");
               try {
                   await bootWebContainer();
                   await new Promise(r => setTimeout(r, 1500));
               } catch (e) {
                   console.warn("Auto-boot failed, continuing with file writes");
               }
           }
           
           // Atualizar state para pegar o status mais recente
           const currentState = useStore.getState();
           
           for (const file of files) {
               const cleanPath = normalizePath(file.path);
               setActiveFileAction({ type: 'write', path: cleanPath });
               
               currentState.updateFileContent(cleanPath, file.content);
               if (currentState.isWcBooted) {
                   await RuntimeService.writeFile(cleanPath, file.content);
               }
               written.push(cleanPath);
           }
           
           // Focus on main app file or last file written
           const mainFile = written.find(f => f.includes('App.jsx') || f.includes('App.tsx')) || written[written.length - 1];
           if (mainFile) {
               currentState.setActiveFile(mainFile);
           }

           setActiveFileAction(null);
           setAgentStatus(null);
           
           // Hint para o agente continuar com install e dev
           const hint = hasPackageJson 
               ? "\n💡 Hint: Now run install_package and run_command('npm run dev') to start the server."
               : "";
           
           return `OK: Wrote ${written.length} files:\n${written.map(f => `  - ${f}`).join('\n')}${hint}`;
      },

      deleteFile: async (path) => {
           const cleanPath = normalizePath(path);
           setAgentStatus(`Deleting ${cleanPath}`);
           setActiveFileAction({ type: 'delete', path: cleanPath });
           
           const state = useStore.getState();
           state.deleteFile(cleanPath);
           if (state.isWcBooted) {
               await RuntimeService.deleteFile(cleanPath);
           }
           
           setActiveFileAction(null);
           setAgentStatus(null);
           return `Deleted: ${cleanPath}`;
      },

      moveFile: async (source, destination) => {
           const cleanSource = normalizePath(source);
           const cleanDest = normalizePath(destination);
           setAgentStatus(`Moving ${cleanSource}`);
           
           const state = useStore.getState();
           state.renameFile(cleanSource, cleanDest);
           
           setAgentStatus(null);
           return `Moved: ${cleanSource} → ${cleanDest}`;
      },

      replaceString: async (path, search, replace) => {
           const cleanPath = normalizePath(path);
           setAgentStatus(`Patching ${cleanPath}`);
           setActiveFileAction({ type: 'write', path: cleanPath });
           
           const state = useStore.getState();
           const currentContent = findFileContent(state.virtualFiles, cleanPath);
           
           if (currentContent === null) {
               setAgentStatus(null);
               setActiveFileAction(null);
               return `Error: File not found: ${cleanPath}`;
           }

           if (!currentContent.includes(search)) {
               setAgentStatus(null);
               setActiveFileAction(null);
               return `Error: String not found in ${cleanPath}. Try format_file first.`;
           }
           
           const newContent = currentContent.replace(search, replace);
           state.updateFileContent(cleanPath, newContent);
           if (state.isWcBooted) {
               await RuntimeService.writeFile(cleanPath, newContent);
           }
           state.setActiveFile(cleanPath);

           setActiveFileAction(null);
           setAgentStatus(null);
           return `Patched: ${cleanPath}`;
      },

      searchFiles: async (query, path = '.') => {
           setAgentStatus(`Searching: ${query}`);
           const state = useStore.getState();
           
           const getAllFiles = (nodes: VirtualFile[]): VirtualFile[] => {
               let files: VirtualFile[] = [];
               nodes.forEach(node => {
                   if (node.isFolder && node.children) {
                       files = [...files, ...getAllFiles(node.children)];
                   } else if (!node.isFolder) {
                       files.push(node);
                   }
               });
               return files;
           };

           const allFiles = getAllFiles(state.virtualFiles);
           const regex = new RegExp(query, 'gi');
           const matches: string[] = [];

           for (const f of allFiles) {
               if (path !== '.' && !f.path.startsWith(path.replace(/^\.\//, ''))) continue;
               if (regex.test(f.content)) {
                    const lines = f.content.split('\n');
                    const matchLines: string[] = [];
                    lines.forEach((line, idx) => {
                        if (new RegExp(query, 'i').test(line)) {
                            matchLines.push(`  L${idx + 1}: ${line.trim().substring(0, 100)}`);
                        }
                    });
                    if (matchLines.length > 0) {
                        matches.push(`${f.path}:\n${matchLines.slice(0, 5).join('\n')}`);
                    }
               }
           }
           
           setAgentStatus(null);
           return matches.length > 0 ? matches.join('\n\n') : "No matches found.";
      },

      formatFile: async (path) => {
           const cleanPath = normalizePath(path);
           setAgentStatus(`Formatting ${cleanPath}`);
           const state = useStore.getState();
           const content = findFileContent(state.virtualFiles, cleanPath);
           
           if (content === null) {
               setAgentStatus(null);
               return `File not found: ${cleanPath}`;
           }

           try {
               const formatted = await formatCode(content, cleanPath);
               state.updateFileContent(cleanPath, formatted);
               if (state.isWcBooted) {
                   await RuntimeService.writeFile(cleanPath, formatted);
               }
               setAgentStatus(null);
               return `Formatted: ${cleanPath}`;
           } catch (e: any) {
               setAgentStatus(null);
               return `Format error: ${e.message}`;
           }
      },

      // === TERMINAL & PACKAGES ===
      runCommand: async (command, timeout = 60000) => {
          setAgentStatus(`$ ${command}`);
          Memory.addExecutionStep(`Run: ${command}`);
          const state = useStore.getState();
          
          // Detectar se é comando de longa duração (dev server, watch, etc)
          const isLongRunning = 
              command.includes('npm run dev') || 
              command.includes('npm start') ||
              command.includes('npm run watch') ||
              command.includes('vite') ||
              command.includes('--watch');
          
          // Para comandos de longa duração, usar o Process Manager
          if (isLongRunning && isLocalMode) {
              setAgentStatus("🔄 Starting managed process...");
              try {
                  const result = await ProcessManagerService.startProcess(command, {
                      name: command.includes('dev') ? 'Dev Server' : 'Background Process'
                  });
                  
                  if (result.success) {
                      if (result.reused) {
                          setAgentStatus(null);
                          return `✓ ${result.message || 'Reusing existing process'}\n📍 Port: ${result.process?.port || 'detecting...'}`;
                      }
                      
                      // Aguardar um pouco para detectar a porta
                      await new Promise(r => setTimeout(r, 3000));
                      
                      // Verificar se detectou porta
                      if (result.process?.id) {
                          const proc = await ProcessManagerService.getProcess(result.process.id);
                          if (proc?.port) {
                              setWcUrl(`http://localhost:${proc.port}`);
                              setIsPreviewMode('live');
                          }
                      }
                      
                      setAgentStatus(null);
                      return `✓ Process started: ${result.process?.name}\n📍 Port: ${result.process?.port || 'detecting...'}\n🔗 Process ID: ${result.process?.id}`;
                  } else {
                      setAgentStatus(null);
                      return `✗ Failed to start process: ${result.error}`;
                  }
              } catch (e: any) {
                  setAgentStatus(null);
                  return `✗ Error starting process: ${e.message}`;
              }
          }
          
          // Auto-boot runtime if not booted
          if (!state.isWcBooted) {
              setAgentStatus("⚡ Auto-booting runtime...");
              try {
                  await bootWebContainer();
                  // Wait a bit for boot to complete
                  await new Promise(r => setTimeout(r, 2000));
              } catch (e: any) {
                  setAgentStatus(null);
                  Memory.trackError(`Runtime boot failed: ${e.message}`, 'boot');
                  return `⚠️ Failed to auto-boot runtime: ${e.message}. Please click the Boot button manually.`;
              }
          }
          
          try {
              // Parse command properly
              const parts = command.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
              const cmd = parts[0];
              const args = parts.slice(1).map(a => a.replace(/^"|"$/g, ''));
              
              const result = await RuntimeService.exec(cmd, args, timeout);
              
              // Sync package.json if npm install was run
              if (command.includes('npm install') || command.includes('npm i')) {
                   try {
                       const newPkg = await RuntimeService.readFile('package.json');
                       state.updateFileContent('package.json', newPkg);
                   } catch (e) { /* ignore */ }
              }

              setAgentStatus(null);
              const output = result.output.trim();
              
              // Detectar erros e sugerir auto-fix
              if (result.exitCode !== 0 && output) {
                  Memory.trackError(output, command);
                  
                  // Tentar obter sugestão de auto-fix
                  const autoFix = await getAutoFixSuggestion(output);
                  if (autoFix) {
                      return `✗ Error:\n${output.substring(0, 500)}\n\n💡 AUTO-FIX SUGGESTION: ${autoFix}\nExecute this to fix the issue.`;
                  }
                  
                  return `✗ Error (exit ${result.exitCode}):\n${output.substring(0, 1000)}`;
              }
              
              Memory.markErrorFixed(command, 'success');
              return output || (result.exitCode === 0 ? "✓ Success" : `✗ Exit code: ${result.exitCode}`);
          } catch (e: any) {
              setAgentStatus(null);
              Memory.trackError(e.message, command);
              return `Error: ${e.message}`;
          }
      },

      runScript: async (script) => {
          setAgentStatus(`npm run ${script}`);
          const state = useStore.getState();
          
          // Auto-boot runtime if not booted
          if (!state.isWcBooted) {
              setAgentStatus("⚡ Auto-booting runtime...");
              try {
                  await bootWebContainer();
                  await new Promise(r => setTimeout(r, 2000));
              } catch (e: any) {
                  setAgentStatus(null);
                  return `⚠️ Failed to auto-boot runtime: ${e.message}`;
              }
          }
          
          try {
              const result = await RuntimeService.exec('npm', ['run', script], 120000);
              setAgentStatus(null);
              return result.output || (result.exitCode === 0 ? "✓ Success" : `✗ Failed`);
          } catch (e: any) {
              setAgentStatus(null);
              return `Error: ${e.message}`;
          }
      },

      installPackage: async (packages, dev) => {
          setAgentStatus(`📦 Installing: ${packages}`);
          Memory.addExecutionStep(`Install: ${packages}`);
          const state = useStore.getState();
          
          // Auto-boot runtime if not booted
          if (!state.isWcBooted) {
              setAgentStatus("⚡ Auto-booting runtime for package install...");
              try {
                  await bootWebContainer();
                  await new Promise(r => setTimeout(r, 2000));
              } catch (e: any) {
                  setAgentStatus(null);
                  return `⚠️ Failed to auto-boot runtime: ${e.message}. Please click the Boot button manually.`;
              }
          }
          
          try {
              setActiveFileAction({ type: 'exec', path: 'package.json' });
              const args = ['install', ...packages.split(' ').filter(Boolean)];
              if (dev) args.push('-D');
              
              let result = await RuntimeService.exec('npm', args, 120000);
              
              // Se falhou com ERESOLVE, tentar com --legacy-peer-deps
              if (result.exitCode !== 0 && result.output.includes('ERESOLVE')) {
                  setAgentStatus(`📦 Retrying with --legacy-peer-deps...`);
                  args.push('--legacy-peer-deps');
                  result = await RuntimeService.exec('npm', args, 120000);
              }
              
              // Sync package.json
              try {
                  const newPkg = await RuntimeService.readFile('package.json');
                  state.updateFileContent('package.json', newPkg);
              } catch (e) { /* ignore */ }

              setActiveFileAction(null);
              setAgentStatus(null);
              
              if (result.exitCode === 0) {
                  Memory.markErrorFixed(`install ${packages}`, 'success');
                  return `✓ Installed: ${packages}`;
              } else {
                  Memory.trackError(result.output, `npm install ${packages}`);
                  return `✗ Failed: ${result.output.substring(0, 500)}\n\n💡 Try: run_command("npm install ${packages} --force")`;
              }
          } catch (e: any) {
              setAgentStatus(null);
              setActiveFileAction(null);
              Memory.trackError(e.message, `install ${packages}`);
              return `Error: ${e.message}`;
          }
      },

      uninstallPackage: async (packages) => {
          setAgentStatus(`Removing: ${packages}`);
          const state = useStore.getState();
          if (!state.isWcBooted) {
              setAgentStatus(null);
              return "⚠️ RUNTIME NOT BOOTED: Cannot uninstall packages. User needs to boot the runtime first.";
          }
          
          try {
              const args = ['uninstall', ...packages.split(' ').filter(Boolean)];
              const result = await RuntimeService.exec('npm', args);
              
              // Sync package.json
              try {
                  const newPkg = await RuntimeService.readFile('package.json');
                  state.updateFileContent('package.json', newPkg);
              } catch (e) { /* ignore */ }

              setAgentStatus(null);
              return result.exitCode === 0 ? `✓ Removed: ${packages}` : `✗ Failed`;
          } catch (e: any) {
              setAgentStatus(null);
              return `Error: ${e.message}`;
          }
      },

      git: async (args) => {
          setAgentStatus(`git ${args}`);
          const state = useStore.getState();
          
          // Auto-boot runtime if not booted
          if (!state.isWcBooted) {
              setAgentStatus("⚡ Auto-booting runtime...");
              try {
                  await bootWebContainer();
                  await new Promise(r => setTimeout(r, 2000));
              } catch (e: any) {
                  setAgentStatus(null);
                  return `⚠️ Failed to auto-boot runtime: ${e.message}`;
              }
          }
          
          try {
              const gitArgs = args.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
              const result = await RuntimeService.exec('git', gitArgs.map(a => a.replace(/^"|"$/g, '')));
              setAgentStatus(null);
              return result.output || (result.exitCode === 0 ? "✓ Done" : `✗ Exit: ${result.exitCode}`);
          } catch (e: any) {
              setAgentStatus(null);
              return `Error: ${e.message}`;
          }
      },

      // === PROJECT MANAGEMENT ===
      addTask: async (text) => {
          useStore.getState().addTask(text);
          return `Task added: ${text}`;
      },

      completeTask: async (id) => {
          const state = useStore.getState();
          const task = state.tasks.find(t => t.id === id);
          if (!task) return "Task not found.";
          state.toggleTask(id);
          return `Task "${task.text}" marked ${!task.completed ? 'complete' : 'incomplete'}.`;
      },

      analyzeProject: async () => {
          setAgentStatus("Analyzing project...");
          const state = useStore.getState();
          const report = await evaluateCode(state.currentCode, state.selectedModel);
          state.setExcellenceReport(report);
          setAgentStatus(null);
          return `Score: ${report.score}/100\nCritique: ${report.critique}\nImprovements: ${report.improvements.join(', ')}`;
      },

      // === SYSTEM CONTROL ===
      clearWorkspace: async () => {
          setAgentStatus("🧹 Clearing workspace...");
          
          try {
            // Parar servidor se estiver rodando
            if (shellWriter) {
              await shellWriter.write('\x03'); // Ctrl+C
              await new Promise(r => setTimeout(r, 500));
            }
            
            // Parar todos os processos gerenciados
            await ProcessManagerService.stopAllProcesses();
            
            // Limpar arquivos virtuais (manter estrutura mínima)
            const emptyFiles: VirtualFile[] = [];
            useStore.getState().setVirtualFiles(emptyFiles);
            
            // Se em modo local, limpar workspace físico
            if (isLocalMode) {
              try {
                const res = await fetch('http://localhost:3001/api/exec', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    command: 'Get-ChildItem -Force | Where-Object { $_.Name -ne "node_modules" } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue',
                    timeout: 10000
                  })
                });
                await res.json();
              } catch (e) {
                console.warn('Failed to clear local workspace:', e);
              }
            }
            
            // Limpar URL do preview
            setWcUrl(null);
            setIsPreviewMode('static');
            
            // Limpar terminal
            terminalRef.current?.clear();
            terminalRef.current?.writeln('\x1b[32m🧹 Workspace cleared. Ready for new project.\x1b[0m');
            
            setAgentStatus(null);
            return "✅ Workspace cleared. Ready for new project.";
          } catch (e: any) {
            setAgentStatus(null);
            return `⚠️ Partial clear: ${e.message}`;
          }
      },

      resetProject: async () => {
          setAgentStatus("🔄 Resetting project...");
          
          // Parar processos
          if (shellProcess) {
            shellProcess.kill();
          }
          
          // Resetar sessão do chat e memória
          resetChatSession();
          
          // Resetar store (arquivos, mensagens, etc)
          useStore.getState().resetEverything();
          
          // Limpar estados locais
          setShellWriter(null);
          setShellProcess(null);
          setGlobalError(null);
          setIsPreviewMode('static');
          
          // Limpar terminal
          terminalRef.current?.clear();
          terminalRef.current?.writeln('\x1b[33m🔄 Project reset by AI agent\x1b[0m');
          
          setAgentStatus(null);
          return "✅ Project reset complete. All files cleared, container restarted.";
      },

      restartServer: async () => {
          setAgentStatus("🔄 Restarting server...");
          const state = useStore.getState();
          
          if (!state.isWcBooted) {
            setAgentStatus(null);
            return "⚠️ Runtime not booted. Cannot restart server.";
          }
          
          if (shellWriter) {
            // Ctrl+C para parar o servidor atual
            await shellWriter.write('\x03');
            await new Promise(r => setTimeout(r, 500));
            // Reiniciar
            await shellWriter.write('npm run dev\r');
            terminalRef.current?.writeln('\r\n\x1b[36m🔄 Restarting dev server...\x1b[0m');
          }
          
          setAgentStatus(null);
          return "✅ Server restart initiated.";
      },

      clearTerminal: async () => {
          terminalRef.current?.clear();
          terminalRef.current?.writeln('\x1b[32m✓ Terminal cleared\x1b[0m');
          return "✅ Terminal cleared.";
      },
      
      // === HEALTH CHECK & TESTING ===
      checkAppHealth: async () => {
          setAgentStatus("🔍 Checking app health...");
          const state = useStore.getState();
          
          const healthReport: string[] = ["## 🏥 App Health Report\n"];
          
          // 1. Verificar se runtime está ativo
          if (state.isWcBooted) {
              healthReport.push("✅ Runtime: Active");
          } else {
              healthReport.push("⚠️ Runtime: Not booted");
          }
          
          // 2. Verificar se servidor está rodando
          if (state.wcUrl) {
              healthReport.push(`✅ Server: Running at ${state.wcUrl}`);
              
              // Tentar fazer health check do servidor
              try {
                  const controller = new AbortController();
                  setTimeout(() => controller.abort(), 3000);
                  await fetch(state.wcUrl, { mode: 'no-cors', signal: controller.signal });
                  healthReport.push("✅ Server Response: OK");
              } catch (e) {
                  healthReport.push("⚠️ Server Response: Not responding (may still be starting)");
              }
          } else {
              healthReport.push("❌ Server: Not running");
              healthReport.push("💡 Suggestion: Run `npm run dev` to start the server");
          }
          
          // 3. Verificar arquivos essenciais
          const hasPackageJson = state.virtualFiles.some(f => f.path === 'package.json' || f.name === 'package.json');
          const hasAppFile = state.virtualFiles.some(f => 
              f.path?.includes('App.jsx') || f.path?.includes('App.tsx') ||
              f.name === 'App.jsx' || f.name === 'App.tsx'
          );
          const hasMainFile = state.virtualFiles.some(f => 
              f.path?.includes('main.jsx') || f.path?.includes('main.tsx') ||
              f.name === 'main.jsx' || f.name === 'main.tsx'
          );
          
          healthReport.push("\n### 📁 Essential Files:");
          healthReport.push(hasPackageJson ? "✅ package.json" : "❌ package.json (missing)");
          healthReport.push(hasAppFile ? "✅ App component" : "❌ App component (missing)");
          healthReport.push(hasMainFile ? "✅ Entry point (main)" : "❌ Entry point (missing)");
          
          // 4. Verificar erros pendentes
          const unfixedErrors = Memory.getUnfixedErrors();
          if (unfixedErrors.length > 0) {
              healthReport.push(`\n### ⚠️ Pending Errors: ${unfixedErrors.length}`);
              unfixedErrors.slice(0, 3).forEach(err => {
                  healthReport.push(`- ${err.error.substring(0, 100)}...`);
              });
          } else {
              healthReport.push("\n✅ No pending errors");
          }
          
          // 5. Sugestões
          healthReport.push("\n### 💡 Suggestions:");
          if (!state.isWcBooted) {
              healthReport.push("- Boot the runtime to enable terminal commands");
          }
          if (!state.wcUrl && hasPackageJson) {
              healthReport.push("- Run `install_package` then `run_command('npm run dev')`");
          }
          if (unfixedErrors.length > 0) {
              healthReport.push("- Check error log with `get_error_log` for details");
          }
          
          setAgentStatus(null);
          return healthReport.join("\n");
      },
      
      getErrorLog: async () => {
          const errors = Memory.getUnfixedErrors();
          const allErrors = Memory.getChangeLog().filter(c => c.action === 'Error');
          
          if (errors.length === 0 && allErrors.length === 0) {
              return "✅ No errors recorded in this session.";
          }
          
          const report: string[] = ["## 🐛 Error Log\n"];
          
          if (errors.length > 0) {
              report.push("### ⚠️ Unfixed Errors:");
              errors.forEach((err, i) => {
                  report.push(`\n**${i + 1}. ${err.context || 'Unknown context'}**`);
                  report.push(`\`\`\`\n${err.error.substring(0, 300)}\n\`\`\``);
                  report.push(`Attempts: ${err.fixAttempts}`);
              });
          }
          
          report.push("\n### 📊 Summary:");
          report.push(`- Total errors tracked: ${errors.length + allErrors.length}`);
          report.push(`- Unfixed: ${errors.length}`);
          report.push(`- Fixed: ${allErrors.length}`);
          
          return report.join("\n");
      },
      
      // === 🖥️ POWERSHELL PROCESS MANAGEMENT ===
      listProcesses: async () => {
          setAgentStatus("📊 Listing processes...");
          try {
              const processes = await ProcessManagerService.listProcesses();
              const { tabs } = await ProcessManagerService.listTerminals();
              
              if (processes.length === 0 && tabs.length === 0) {
                  setAgentStatus(null);
                  return "📊 No processes or terminals running.";
              }
              
              const report: string[] = ["## 📊 Running Processes & Terminals\n"];
              
              if (processes.length > 0) {
                  report.push("### 🔄 Processes:");
                  processes.forEach(p => {
                      const status = p.status === 'running' ? '🟢' : p.status === 'error' ? '🔴' : '⚪';
                      report.push(`${status} **${p.name}** (ID: \`${p.id}\`)`);
                      report.push(`   Command: \`${p.command}\``);
                      if (p.port) report.push(`   Port: ${p.port}`);
                      report.push(`   Status: ${p.status}`);
                  });
              }
              
              if (tabs.length > 0) {
                  report.push("\n### 🖥️ Terminal Tabs:");
                  tabs.forEach(t => {
                      const active = t.isActive ? '▶️' : '  ';
                      report.push(`${active} **${t.name}** (ID: \`${t.id}\`) - ${t.type}`);
                  });
              }
              
              setAgentStatus(null);
              return report.join("\n");
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Error listing processes: ${e.message}`;
          }
      },
      
      getSystemState: async () => {
          setAgentStatus("🧠 Getting system state...");
          try {
              const summary = await ProcessManagerService.getSystemSummary();
              setAgentStatus(null);
              return summary;
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Error getting system state: ${e.message}`;
          }
      },
      
      createTerminal: async (name?: string, cwd?: string) => {
          setAgentStatus("🖥️ Creating terminal...");
          try {
              const tab = await ProcessManagerService.createTerminal(name, 'shell', cwd);
              if (tab) {
                  setAgentStatus(null);
                  return `✅ Terminal created: **${tab.name}** (ID: \`${tab.id}\`)`;
              }
              setAgentStatus(null);
              return "❌ Failed to create terminal";
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Error creating terminal: ${e.message}`;
          }
      },
      
      closeTerminal: async (tabId: string) => {
          setAgentStatus("❌ Closing terminal...");
          try {
              const success = await ProcessManagerService.closeTerminal(tabId);
              setAgentStatus(null);
              return success ? `✅ Terminal \`${tabId}\` closed` : `❌ Failed to close terminal`;
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Error closing terminal: ${e.message}`;
          }
      },
      
      closeAllTerminals: async () => {
          setAgentStatus("🧹 Closing all terminals...");
          try {
              const closed = await ProcessManagerService.closeAllTerminals();
              setAgentStatus(null);
              return `✅ Closed ${closed} terminal(s)`;
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Error closing terminals: ${e.message}`;
          }
      },
      
      startProcess: async (command: string, name?: string, port?: number) => {
          setAgentStatus(`🚀 Starting: ${command}`);
          try {
              const result = await ProcessManagerService.startProcess(command, { name, port });
              
              if (result.success) {
                  // Se é um dev server, atualizar a URL do preview
                  if (result.process?.port && (command.includes('dev') || command.includes('start'))) {
                      setWcUrl(`http://localhost:${result.process.port}`);
                      setIsPreviewMode('live');
                  }
                  
                  setAgentStatus(null);
                  if (result.reused) {
                      return `♻️ Reusing existing process: **${result.process?.name}**\n📍 Port: ${result.process?.port || 'N/A'}\n🔗 ID: \`${result.process?.id}\``;
                  }
                  return `✅ Process started: **${result.process?.name}**\n📍 Port: ${result.process?.port || 'detecting...'}\n🔗 ID: \`${result.process?.id}\``;
              }
              
              setAgentStatus(null);
              return `❌ Failed to start process: ${result.error}`;
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Error starting process: ${e.message}`;
          }
      },
      
      stopProcess: async (processId: string) => {
          setAgentStatus("⏹️ Stopping process...");
          try {
              const success = await ProcessManagerService.stopProcess(processId);
              setAgentStatus(null);
              return success ? `✅ Process \`${processId}\` stopped` : `❌ Failed to stop process`;
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Error stopping process: ${e.message}`;
          }
      },
      
      stopAllProcesses: async () => {
          setAgentStatus("⏹️ Stopping all processes...");
          try {
              const stopped = await ProcessManagerService.stopAllProcesses();
              setAgentStatus(null);
              return `✅ Stopped ${stopped} process(es)`;
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Error stopping processes: ${e.message}`;
          }
      },
      
      killPort: async (port: number) => {
          setAgentStatus(`💀 Killing port ${port}...`);
          try {
              const success = await ProcessManagerService.killByPort(port);
              setAgentStatus(null);
              return success ? `✅ Port ${port} freed` : `❌ Failed to kill port ${port}`;
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Error killing port: ${e.message}`;
          }
      },
      
      getProcessOutput: async (processId: string, lines: number = 100) => {
          setAgentStatus("📜 Getting process output...");
          try {
              const output = await ProcessManagerService.getProcessOutput(processId, lines);
              setAgentStatus(null);
              return output || "(no output)";
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Error getting output: ${e.message}`;
          }
      },
      
      getLogs: async (lines?: number, level?: string, source?: string) => {
          setAgentStatus("📋 Getting logs...");
          try {
              const logs = await ProcessManagerService.getLogs({ lines, level, source });
              
              if (logs.length === 0) {
                  setAgentStatus(null);
                  return "📋 No logs found.";
              }
              
              const formatted = logs.map(l => {
                  const time = new Date(l.timestamp).toLocaleTimeString();
                  const levelIcon = l.level === 'error' ? '🔴' : l.level === 'warn' ? '🟡' : l.level === 'command' ? '💻' : '📝';
                  return `${levelIcon} [${time}] [${l.source}] ${l.message}`;
              }).join('\n');
              
              setAgentStatus(null);
              return `## 📋 System Logs (${logs.length} entries)\n\n${formatted}`;
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Error getting logs: ${e.message}`;
          }
      },
      
      systemReset: async () => {
          setAgentStatus("🔄 Resetting system...");
          try {
              const success = await ProcessManagerService.resetSystem();
              setAgentStatus(null);
              return success ? "✅ System reset complete. All processes stopped, all terminals closed." : "❌ Failed to reset system";
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Error resetting system: ${e.message}`;
          }
      },
      
      // === 🔍 ADVANCED DISCOVERY TOOLS (KIRO-INSPIRED) ===
      
      getDiagnostics: async (paths: string[]) => {
          setAgentStatus("🔬 Running diagnostics...");
          try {
              const state = useStore.getState();
              const results: string[] = [];
              
              for (const filePath of paths) {
                  const cleanPath = normalizePath(filePath);
                  const content = findFileContent(state.virtualFiles, cleanPath);
                  
                  if (!content) {
                      results.push(`❌ ${cleanPath}: File not found`);
                      continue;
                  }
                  
                  // Análise básica de erros TypeScript/JavaScript
                  const errors: string[] = [];
                  const lines = content.split('\n');
                  
                  lines.forEach((line, idx) => {
                      const lineNum = idx + 1;
                      // Detectar erros comuns
                      if (line.includes('console.log(') && !line.trim().startsWith('//')) {
                          // Não é erro, mas aviso
                      }
                      if (/\bconst\s+\w+\s*=\s*$/.test(line.trim())) {
                          errors.push(`L${lineNum}: Incomplete assignment`);
                      }
                      if (/\bfunction\s+\w+\s*\([^)]*$/.test(line) && !lines[idx + 1]?.includes(')')) {
                          errors.push(`L${lineNum}: Unclosed function parameters`);
                      }
                      if ((line.match(/\{/g) || []).length !== (line.match(/\}/g) || []).length) {
                          // Pode ser multi-linha, verificar contexto
                      }
                      if (line.includes('import ') && !line.includes(' from ') && !line.includes(';')) {
                          errors.push(`L${lineNum}: Incomplete import statement`);
                      }
                      // Detectar variáveis não usadas (simplificado)
                      const varMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=/);
                      if (varMatch) {
                          const varName = varMatch[1];
                          const restOfFile = lines.slice(idx + 1).join('\n');
                          if (!restOfFile.includes(varName) && !line.includes('export')) {
                              errors.push(`L${lineNum}: '${varName}' may be unused`);
                          }
                      }
                  });
                  
                  if (errors.length > 0) {
                      results.push(`⚠️ ${cleanPath}:\n${errors.map(e => `   ${e}`).join('\n')}`);
                  } else {
                      results.push(`✅ ${cleanPath}: No issues found`);
                  }
              }
              
              setAgentStatus(null);
              return results.join('\n\n');
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Diagnostics error: ${e.message}`;
          }
      },
      
      fileSearch: async (query: string, exclude?: string) => {
          setAgentStatus(`🔎 Searching files: ${query}`);
          try {
              const state = useStore.getState();
              const matches: string[] = [];
              
              const searchFiles = (files: VirtualFile[], pattern: RegExp) => {
                  for (const file of files) {
                      if (file.isFolder && file.children) {
                          searchFiles(file.children, pattern);
                      } else if (!file.isFolder) {
                          // Excluir node_modules por padrão
                          if (file.path.includes('node_modules')) continue;
                          if (exclude && new RegExp(exclude.replace(/\*/g, '.*')).test(file.path)) continue;
                          
                          if (pattern.test(file.name) || pattern.test(file.path)) {
                              matches.push(file.path);
                          }
                      }
                  }
              };
              
              // Criar regex fuzzy a partir da query
              const fuzzyPattern = new RegExp(query.split('').join('.*'), 'i');
              searchFiles(state.virtualFiles, fuzzyPattern);
              
              setAgentStatus(null);
              
              if (matches.length === 0) {
                  return `No files matching "${query}" found.`;
              }
              
              return `Found ${matches.length} file(s):\n${matches.slice(0, 10).map(m => `  📄 ${m}`).join('\n')}${matches.length > 10 ? `\n  ... and ${matches.length - 10} more` : ''}`;
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Search error: ${e.message}`;
          }
      },
      
      listDirectory: async (dirPath: string, depth: number = 1) => {
          setAgentStatus(`📂 Listing ${dirPath}`);
          try {
              const state = useStore.getState();
              const cleanPath = normalizePath(dirPath);
              
              const findDir = (files: VirtualFile[], targetPath: string): VirtualFile | null => {
                  for (const file of files) {
                      if (file.path === targetPath && file.isFolder) return file;
                      if (file.children) {
                          const found = findDir(file.children, targetPath);
                          if (found) return found;
                      }
                  }
                  return null;
              };
              
              const formatTree = (files: VirtualFile[], currentDepth: number, prefix: string = ''): string[] => {
                  if (currentDepth > depth) return [];
                  const lines: string[] = [];
                  
                  files.forEach((file, idx) => {
                      const isLast = idx === files.length - 1;
                      const connector = isLast ? '└── ' : '├── ';
                      const icon = file.isFolder ? '📁' : '📄';
                      lines.push(`${prefix}${connector}${icon} ${file.name}`);
                      
                      if (file.isFolder && file.children && currentDepth < depth) {
                          const newPrefix = prefix + (isLast ? '    ' : '│   ');
                          lines.push(...formatTree(file.children, currentDepth + 1, newPrefix));
                      }
                  });
                  
                  return lines;
              };
              
              let targetFiles: VirtualFile[];
              if (cleanPath === '.' || cleanPath === '' || cleanPath === '/') {
                  targetFiles = state.virtualFiles;
              } else {
                  const dir = findDir(state.virtualFiles, cleanPath);
                  if (!dir) {
                      setAgentStatus(null);
                      return `Directory not found: ${cleanPath}`;
                  }
                  targetFiles = dir.children || [];
              }
              
              const tree = formatTree(targetFiles, 1);
              setAgentStatus(null);
              
              return `📂 ${cleanPath || '.'}\n${tree.join('\n')}`;
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Error listing directory: ${e.message}`;
          }
      },
      
      appendFile: async (path: string, content: string) => {
          const cleanPath = normalizePath(path);
          setAgentStatus(`➕ Appending to ${cleanPath}`);
          
          try {
              const state = useStore.getState();
              const existingContent = findFileContent(state.virtualFiles, cleanPath);
              
              if (existingContent === null) {
                  setAgentStatus(null);
                  return `❌ File not found: ${cleanPath}. Use write_file to create it first.`;
              }
              
              // Adicionar newline se necessário
              const separator = existingContent.endsWith('\n') ? '' : '\n';
              const newContent = existingContent + separator + content;
              
              state.updateFileContent(cleanPath, newContent);
              if (state.isWcBooted) {
                  await RuntimeService.writeFile(cleanPath, newContent);
              }
              
              setAgentStatus(null);
              return `✅ Appended ${content.split('\n').length} lines to ${cleanPath}`;
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Error appending: ${e.message}`;
          }
      },
      
      webSearch: async (query: string) => {
          setAgentStatus(`🌐 Searching: ${query}`);
          try {
              // Usar DuckDuckGo Instant Answer API (não requer API key)
              const encodedQuery = encodeURIComponent(query);
              const response = await fetch(`https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1`);
              
              if (!response.ok) {
                  setAgentStatus(null);
                  return `❌ Search failed: ${response.statusText}`;
              }
              
              const data = await response.json();
              
              let results: string[] = [];
              
              if (data.Abstract) {
                  results.push(`📖 ${data.AbstractText}\n   Source: ${data.AbstractURL}`);
              }
              
              if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                  const topics = data.RelatedTopics.slice(0, 5);
                  topics.forEach((topic: any) => {
                      if (topic.Text) {
                          results.push(`• ${topic.Text.substring(0, 200)}${topic.Text.length > 200 ? '...' : ''}`);
                      }
                  });
              }
              
              setAgentStatus(null);
              
              if (results.length === 0) {
                  return `No instant results for "${query}". Try a more specific query or use web_fetch with a documentation URL.`;
              }
              
              return `🔍 Search results for "${query}":\n\n${results.join('\n\n')}`;
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Search error: ${e.message}`;
          }
      },
      
      webFetch: async (url: string, selector?: string) => {
          setAgentStatus(`📥 Fetching ${url}`);
          try {
              if (!url.startsWith('https://')) {
                  setAgentStatus(null);
                  return `❌ Only HTTPS URLs are allowed for security.`;
              }
              
              const response = await fetch(url);
              
              if (!response.ok) {
                  setAgentStatus(null);
                  return `❌ Fetch failed: ${response.status} ${response.statusText}`;
              }
              
              const contentType = response.headers.get('content-type') || '';
              
              if (contentType.includes('application/json')) {
                  const json = await response.json();
                  setAgentStatus(null);
                  return `📄 JSON from ${url}:\n\`\`\`json\n${JSON.stringify(json, null, 2).substring(0, 5000)}\n\`\`\``;
              }
              
              const text = await response.text();
              
              // Extrair texto limpo do HTML
              let content = text;
              if (contentType.includes('text/html')) {
                  // Remover scripts, styles, e tags HTML
                  content = text
                      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                      .replace(/<[^>]+>/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim();
              }
              
              setAgentStatus(null);
              
              // Limitar tamanho
              if (content.length > 8000) {
                  content = content.substring(0, 8000) + '\n\n[... truncated ...]';
              }
              
              return `📄 Content from ${url}:\n\n${content}`;
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Fetch error: ${e.message}`;
          }
      },
      
      grepSearch: async (pattern: string, include?: string, exclude?: string, caseSensitive: boolean = false) => {
          setAgentStatus(`🔍 Grep: ${pattern}`);
          try {
              const state = useStore.getState();
              const matches: string[] = [];
              const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
              
              const searchInFiles = (files: VirtualFile[]) => {
                  for (const file of files) {
                      if (file.isFolder && file.children) {
                          searchInFiles(file.children);
                          continue;
                      }
                      
                      if (file.isFolder) continue;
                      
                      // Filtros
                      if (file.path.includes('node_modules')) continue;
                      if (include) {
                          const includeRegex = new RegExp(include.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
                          if (!includeRegex.test(file.path)) continue;
                      }
                      if (exclude) {
                          const excludeRegex = new RegExp(exclude.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
                          if (excludeRegex.test(file.path)) continue;
                      }
                      
                      const lines = file.content.split('\n');
                      const fileMatches: string[] = [];
                      
                      lines.forEach((line, idx) => {
                          if (regex.test(line)) {
                              const lineNum = idx + 1;
                              const context = line.trim().substring(0, 100);
                              fileMatches.push(`  L${lineNum}: ${context}${line.length > 100 ? '...' : ''}`);
                          }
                          regex.lastIndex = 0; // Reset regex state
                      });
                      
                      if (fileMatches.length > 0) {
                          matches.push(`📄 ${file.path}:\n${fileMatches.slice(0, 5).join('\n')}${fileMatches.length > 5 ? `\n  ... +${fileMatches.length - 5} more matches` : ''}`);
                      }
                  }
              };
              
              searchInFiles(state.virtualFiles);
              
              setAgentStatus(null);
              
              if (matches.length === 0) {
                  return `No matches for pattern "${pattern}"`;
              }
              
              return `🔍 Grep results for "${pattern}":\n\n${matches.slice(0, 20).join('\n\n')}${matches.length > 20 ? `\n\n... and ${matches.length - 20} more files` : ''}`;
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Grep error: ${e.message}`;
          }
      },
      
      getFileInfo: async (path: string) => {
          const cleanPath = normalizePath(path);
          setAgentStatus(`📊 Getting info: ${cleanPath}`);
          
          try {
              const state = useStore.getState();
              const content = findFileContent(state.virtualFiles, cleanPath);
              
              if (content === null) {
                  setAgentStatus(null);
                  return `❌ File not found: ${cleanPath}`;
              }
              
              const lines = content.split('\n');
              const ext = cleanPath.split('.').pop() || '';
              const languageMap: Record<string, string> = {
                  'js': 'JavaScript', 'jsx': 'JavaScript (React)', 'ts': 'TypeScript', 'tsx': 'TypeScript (React)',
                  'json': 'JSON', 'html': 'HTML', 'css': 'CSS', 'scss': 'SCSS', 'md': 'Markdown',
                  'py': 'Python', 'go': 'Go', 'rs': 'Rust', 'java': 'Java'
              };
              
              const info = {
                  path: cleanPath,
                  size: `${(content.length / 1024).toFixed(2)} KB`,
                  lines: lines.length,
                  language: languageMap[ext] || ext.toUpperCase() || 'Unknown',
                  hasExports: content.includes('export '),
                  hasImports: content.includes('import '),
                  isComponent: /export\s+(default\s+)?function\s+\w+|export\s+(default\s+)?const\s+\w+\s*=/.test(content)
              };
              
              setAgentStatus(null);
              
              return `📊 File Info: ${cleanPath}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📏 Size: ${info.size}
📝 Lines: ${info.lines}
🔤 Language: ${info.language}
📤 Has Exports: ${info.hasExports ? 'Yes' : 'No'}
📥 Has Imports: ${info.hasImports ? 'Yes' : 'No'}
⚛️ Is Component: ${info.isComponent ? 'Yes' : 'No'}`;
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Error getting file info: ${e.message}`;
          }
      },
      
      diffFiles: async (file1: string, file2: string) => {
          setAgentStatus(`📝 Comparing ${file1} vs ${file2}`);
          
          try {
              const state = useStore.getState();
              const content1 = findFileContent(state.virtualFiles, normalizePath(file1));
              const content2 = findFileContent(state.virtualFiles, normalizePath(file2));
              
              if (content1 === null) {
                  setAgentStatus(null);
                  return `❌ File not found: ${file1}`;
              }
              if (content2 === null) {
                  setAgentStatus(null);
                  return `❌ File not found: ${file2}`;
              }
              
              const lines1 = content1.split('\n');
              const lines2 = content2.split('\n');
              
              const diffs: string[] = [];
              const maxLines = Math.max(lines1.length, lines2.length);
              
              for (let i = 0; i < maxLines; i++) {
                  const l1 = lines1[i];
                  const l2 = lines2[i];
                  
                  if (l1 !== l2) {
                      if (l1 === undefined) {
                          diffs.push(`L${i + 1}: + ${l2?.substring(0, 80) || '(empty)'}`);
                      } else if (l2 === undefined) {
                          diffs.push(`L${i + 1}: - ${l1?.substring(0, 80) || '(empty)'}`);
                      } else {
                          diffs.push(`L${i + 1}: - ${l1.substring(0, 80)}`);
                          diffs.push(`L${i + 1}: + ${l2.substring(0, 80)}`);
                      }
                  }
              }
              
              setAgentStatus(null);
              
              if (diffs.length === 0) {
                  return `✅ Files are identical`;
              }
              
              return `📝 Diff: ${file1} vs ${file2}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${diffs.slice(0, 50).join('\n')}${diffs.length > 50 ? `\n\n... and ${diffs.length - 50} more differences` : ''}`;
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Diff error: ${e.message}`;
          }
      },
      
      createSnapshot: async (name: string) => {
          setAgentStatus(`📸 Creating snapshot: ${name}`);
          
          try {
              const state = useStore.getState();
              const snapshot = {
                  name,
                  timestamp: Date.now(),
                  files: JSON.parse(JSON.stringify(state.virtualFiles))
              };
              
              // Salvar no localStorage
              const snapshots = JSON.parse(localStorage.getItem('aether_snapshots') || '[]');
              snapshots.push(snapshot);
              localStorage.setItem('aether_snapshots', JSON.stringify(snapshots));
              
              setAgentStatus(null);
              return `📸 Snapshot "${name}" created successfully. ${state.virtualFiles.length} files saved.`;
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Snapshot error: ${e.message}`;
          }
      },
      
      restoreSnapshot: async (name: string) => {
          setAgentStatus(`⏪ Restoring snapshot: ${name}`);
          
          try {
              const snapshots = JSON.parse(localStorage.getItem('aether_snapshots') || '[]');
              const snapshot = snapshots.find((s: any) => s.name === name);
              
              if (!snapshot) {
                  setAgentStatus(null);
                  return `❌ Snapshot "${name}" not found. Use list_snapshots to see available snapshots.`;
              }
              
              const state = useStore.getState();
              state.setVirtualFiles(snapshot.files);
              
              // Sync to runtime if booted
              if (state.isWcBooted) {
                  for (const file of snapshot.files) {
                      if (!file.isFolder && file.content) {
                          await RuntimeService.writeFile(file.path, file.content);
                      }
                  }
              }
              
              setAgentStatus(null);
              return `⏪ Snapshot "${name}" restored. ${snapshot.files.length} files recovered.`;
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Restore error: ${e.message}`;
          }
      },
      
      listSnapshots: async () => {
          setAgentStatus("📋 Listing snapshots...");
          
          try {
              const snapshots = JSON.parse(localStorage.getItem('aether_snapshots') || '[]');
              
              if (snapshots.length === 0) {
                  setAgentStatus(null);
                  return "📋 No snapshots found. Use create_snapshot to save the current state.";
              }
              
              const list = snapshots.map((s: any) => {
                  const date = new Date(s.timestamp).toLocaleString();
                  return `  📸 "${s.name}" - ${date} (${s.files?.length || 0} files)`;
              }).join('\n');
              
              setAgentStatus(null);
              return `📋 Available Snapshots:\n${list}`;
          } catch (e: any) {
              setAgentStatus(null);
              return `❌ Error listing snapshots: ${e.message}`;
          }
      }
  };

  const handleEditorChange = (newContent: string) => {
    if (!activeFile) return;
    updateFileContent(activeFile, newContent);
    if (isWcBooted) {
        RuntimeService.writeFile(activeFile, newContent);
        
        if (isPreviewMode === 'live') {
            if (reloadDebounceRef.current) clearTimeout(reloadDebounceRef.current);
            reloadDebounceRef.current = setTimeout(() => {
                setReloadSignal(prev => prev + 1);
            }, 2000);
        }
    }
  };

  const handleFormatCode = async () => {
    if (!activeFile || !activeFileContent || loadingStates.save) return;
    setLoading('save', true);
    try {
        const formatted = await formatCode(activeFileContent, activeFile);
        handleEditorChange(formatted);
        toast.success('Code formatted', { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> });
    } catch (e) {
        console.error("Formatting failed", e);
        toast.error('Formatting failed');
    } finally {
        setLoading('save', false);
    }
  };

  const handleAutoRefine = async () => {
      if (!excellenceReport || isRefining) return;
      
      openConfirmation({
          title: 'Auto-Refine Codebase',
          message: `This will automatically apply the recommended fixes from the Excellence Report. The AI will rewrite parts of the code. Continue?`,
          confirmLabel: 'Refine Now',
          variant: 'warning',
          onConfirm: async () => {
             setIsRefining(true);
             toast.info("Applying AI refinements...");
             try {
                 const newCode = await autoRefineCode(currentCode, excellenceReport, selectedModel);
                 setCurrentCode(newCode);
                 
                 if (isWcBooted) {
                     const files = parseVirtualFiles(newCode);
                     await RuntimeService.writeFiles(files);
                 }
                 
                 const newReport = await evaluateCode(newCode, selectedModel);
                 setExcellenceReport(newReport);
                 
                 toast.success("Codebase refined & upgraded!", { icon: <Sparkles className="w-4 h-4 text-purple-400"/> });
             } catch (e: any) {
                 toast.error("Refinement failed: " + e.message);
             } finally {
                 setIsRefining(false);
             }
          }
      });
  };

  // --- RUNTIME LOGIC (WebContainer or Local PowerShell) ---
  // 🔄 SISTEMA HÍBRIDO: Tenta Local primeiro, fallback para WebContainer
  const bootWebContainer = async () => {
      if (loadingStates.boot) return;
      
      setLoading('boot', true);
      setShowBottomPanel(true);
      setGlobalError(null);
      setWcError(null);
      
      try {
          terminalRef.current?.clear();
          
          // Verificar disponibilidade do backend local
          const backendOnline = await RuntimeService.checkBackend();
          const canUseWC = RuntimeService.canUseWebContainer();
          
          // Decidir modo: Local se backend online, senão WebContainer se disponível
          let useLocalMode = isLocalMode && backendOnline;
          
          // Se Local Mode configurado mas backend offline, tentar WebContainer
          if (isLocalMode && !backendOnline && canUseWC) {
              terminalRef.current?.writeln('\r\n\x1b[33m⚠️ Local backend offline, trying WebContainer fallback...\x1b[0m');
              useLocalMode = false;
              RuntimeService.setMode('webcontainer');
          } else if (isLocalMode && !backendOnline && !canUseWC) {
              throw new Error('ERR_NO_RUNTIME_AVAILABLE: Backend offline and WebContainer unavailable');
          }
          
          if (useLocalMode) {
              // 🖥️ LOCAL MODE - PowerShell Real
              terminalRef.current?.writeln('\r\n\x1b[33m⚡ Booting Local PowerShell Runtime...\x1b[0m');
              terminalRef.current?.writeln('\x1b[36m🖥️ Mode: LOCAL (Real PowerShell)\x1b[0m');
              
              const bridge = getRuntimeBridge();
              await bridge.boot();
              
              bridge.onServerReady?.((port, url) => {
                  terminalRef.current?.writeln(`\r\n\x1b[32m✔ Server Live at ${url}\x1b[0m`);
                  setWcUrl(url);
                  setIsPreviewMode('live');
                  toast.success('Dev Server Ready', { icon: <Zap className="w-4 h-4 text-yellow-400"/> });
              });
              
              const currentFilesState = useStore.getState().virtualFiles;
              await bridge.mount(currentFilesState);
              
              setWcBooted(true);
              terminalRef.current?.writeln('\x1b[32m✔ Files synced to local workspace.\x1b[0m');
              
              await startShell(currentFilesState);
          } else {
              // 🌐 WEBCONTAINER MODE - Sandbox
              terminalRef.current?.writeln('\r\n\x1b[33m⚡ Booting Aether Runtime Environment...\x1b[0m');
              terminalRef.current?.writeln('\x1b[36m🌐 Mode: WEBCONTAINER (Browser Sandbox)\x1b[0m');
              
              if (!window.crossOriginIsolated) {
                 terminalRef.current?.writeln('\x1b[33m⚠ Cross-Origin Isolation is missing. Attempting to use Service Worker polyfill...\x1b[0m');
              }

              const wc = await WebContainerService.boot();
              
              wc.on('server-ready', (port: number, url: string) => {
                  terminalRef.current?.writeln(`\r\n\x1b[32m✔ Server Live at ${url}\x1b[0m`);
                  setWcUrl(url);
                  setIsPreviewMode('live'); 
                  toast.success('Dev Server Ready', { icon: <Zap className="w-4 h-4 text-yellow-400"/> });
              });

              const currentFilesState = useStore.getState().virtualFiles;
              await WebContainerService.mount(currentFilesState);

              setWcBooted(true);
              terminalRef.current?.writeln('\x1b[32m✔ File System Mounted.\x1b[0m');
              
              await startShell(currentFilesState);
          }

      } catch (err: any) {
          console.error(err);
          let errorMsg = err.message || "Unknown runtime error";
          let userFriendlyMsg = "Runtime Boot Failed";
          let helpText = "";

          terminalRef.current?.writeln('\r\n\x1b[31m┌──────────────────────────────────────────────────┐\x1b[0m');
          terminalRef.current?.writeln('\x1b[31m│  CRITICAL RUNTIME ERROR                          │\x1b[0m');
          terminalRef.current?.writeln('\x1b[31m└──────────────────────────────────────────────────┘\x1b[0m');

          if (errorMsg.includes("ERR_NO_RUNTIME_AVAILABLE")) {
               userFriendlyMsg = "No Runtime Available";
               helpText = "Local backend is offline and WebContainer is blocked by your browser.";
               terminalRef.current?.writeln('\x1b[33m\r\n⚠️  No runtime available!\x1b[0m');
               terminalRef.current?.writeln('\x1b[36m\r\n💡 SOLUTIONS:\x1b[0m');
               terminalRef.current?.writeln('\x1b[37m   1. Start the local backend:\x1b[0m');
               terminalRef.current?.writeln('\x1b[32m      cd server && npm run dev\x1b[0m');
               terminalRef.current?.writeln('\x1b[37m   2. Or use Chrome for WebContainer support\x1b[0m');
               
               toast.error("No runtime available", {
                   description: "Start local backend or use Chrome",
                   duration: 10000
               });
          } else if (errorMsg.includes("ERR_SHARED_ARRAY_BUFFER_MISSING")) {
               userFriendlyMsg = "Cross-Origin Isolation Failed";
               helpText = "WebContainer requires SharedArrayBuffer which is blocked by your browser.";
               terminalRef.current?.writeln('\x1b[33m\r\n⚠️  SharedArrayBuffer is blocked by your browser.\x1b[0m');
               terminalRef.current?.writeln('\x1b[36m\r\n💡 SOLUTIONS:\x1b[0m');
               terminalRef.current?.writeln('\x1b[37m   1. Use Chrome instead of Edge (recommended)\x1b[0m');
               terminalRef.current?.writeln('\x1b[37m   2. Or enable LOCAL MODE for PowerShell execution:\x1b[0m');
               terminalRef.current?.writeln('\x1b[32m      cd server && npm run dev\x1b[0m');
               terminalRef.current?.writeln('\x1b[32m      Then restart with: VITE_LOCAL_MODE=true npm run dev\x1b[0m');
               terminalRef.current?.writeln('\x1b[37m   3. Or disable Tracking Prevention in Edge settings\x1b[0m');
               
               // Toast com ação
               toast.error("WebContainer blocked by browser", {
                   description: "Use Chrome or enable Local Mode",
                   duration: 10000,
                   action: {
                       label: "How to fix",
                       onClick: () => {
                           window.open("https://developer.chrome.com/blog/enabling-shared-array-buffer/", "_blank");
                       }
                   }
               });
          } else if (errorMsg.includes("ERR_NOT_SECURE_CONTEXT")) {
               userFriendlyMsg = "Insecure Context (HTTPS Required)";
               helpText = "WebContainer requires HTTPS. Use localhost or enable HTTPS.";
          } else if (errorMsg.includes("ERR_COOP_COEP_MISSING")) {
               userFriendlyMsg = "COOP/COEP Headers Missing";
               helpText = "The service worker failed to set required headers.";
          }
          
          setWcError(userFriendlyMsg);
          setGlobalError(userFriendlyMsg);
          if (!errorMsg.includes("ERR_SHARED_ARRAY_BUFFER_MISSING")) {
              toast.error("Runtime Boot Failed", { description: helpText });
          }
      } finally {
          setLoading('boot', false);
      }
  };

  const startShell = async (currentFiles: VirtualFile[]) => {
      // Usar o modo atual do RuntimeService
      const currentMode = RuntimeService.getCurrentMode();
      const useLocal = currentMode === 'local' || (isLocalMode && currentMode !== 'webcontainer');
      
      if (useLocal) {
          // 🖥️ LOCAL MODE - PowerShell Real via PTY
          terminalRef.current?.writeln('\r\n\x1b[35m> Connecting to PowerShell PTY...\x1b[0m\r\n');
          try {
              const bridge = getRuntimeBridge();
              
              // Obter dimensões do terminal
              const cols = terminalRef.current?.cols || 120;
              const rows = terminalRef.current?.rows || 30;
              
              const { inputWriter } = await bridge.startShell(
                  (data) => terminalRef.current?.write(data),
                  cols,
                  rows
              );
              setShellWriter(inputWriter);
              
              const hasPackageJson = currentFiles.some(f => f.name === 'package.json');
              if (hasPackageJson) {
                  terminalRef.current?.writeln('\x1b[36m📦 package.json detected. Auto-installing dependencies & starting dev server...\x1b[0m');
                  await inputWriter.write('npm install; npm run dev\r\n');
              }
          } catch (error: any) {
              terminalRef.current?.writeln(`\x1b[31m✖ Failed to start PowerShell: ${error.message}\x1b[0m`);
          }
      } else {
          // 🌐 WEBCONTAINER MODE - jsh
          terminalRef.current?.writeln('\r\n\x1b[35m> Starting Interactive Shell (jsh)...\x1b[0m\r\n');
          try {
              const { process, inputWriter } = await WebContainerService.startShell(
                  (data) => terminalRef.current?.write(data)
              );
              setShellWriter(inputWriter);
              setShellProcess(process);
              const hasPackageJson = currentFiles.some(f => f.name === 'package.json');
              
              if (hasPackageJson) {
                  terminalRef.current?.writeln('\x1b[36m📦 package.json detected. Auto-installing dependencies & starting dev server...\x1b[0m');
                  await inputWriter.write('npm install && npm run dev\r');
              }
          } catch (error: any) {
              terminalRef.current?.writeln(`\x1b[31m✖ Failed to start shell: ${error.message}\x1b[0m`);
          }
      }
  };

  // --- AI GENERATION (STREAMING HANDLER) ---
  const handleSendMessage = async (content: string, attachments: Attachment[] = []) => {
    const userMsg: Message = { 
        role: 'user', 
        content, 
        attachments,
        timestamp: Date.now() 
    };
    addMessage(userMsg);
    setGlobalError(null);

    const normalizedContent = content.trim().toLowerCase();
    
    // Comandos diretos de execução
    if (['run it', 'start server', 'npm run dev', 'start', 'run', 'execute', 'rodar', 'iniciar'].includes(normalizedContent) && attachments.length === 0) {
        if (!isWcBooted) {
            // Automatically boot if user asks to start
            addMessage({ role: 'model', content: "⚡ Iniciando runtime automaticamente...", timestamp: Date.now() });
            await bootWebContainer();
            return; 
        }
        if (shellWriter) {
            await shellWriter.write('npm install && npm run dev\r');
            addMessage({ role: 'model', content: "✅ Executando `npm install && npm run dev`...", timestamp: Date.now() });
            setShowBottomPanel(true);
            return;
        }
    }
    
    // Detectar pedidos de criação de projeto para pre-boot
    const creationKeywords = ['create', 'criar', 'make', 'build', 'fazer', 'desenvolver', 'app', 'aplicativo', 'projeto', 'project', 'website', 'site', 'página', 'page'];
    const isCreationRequest = creationKeywords.some(kw => normalizedContent.includes(kw));
    
    // Pre-boot runtime para pedidos de criação (em background)
    if (isCreationRequest && !isWcBooted && !loadingStates.boot) {
        // Boot em background enquanto a IA processa
        bootWebContainer().catch(() => {});
    }

    // Criar AbortController para permitir cancelamento
    const abortController = new AbortController();
    useStore.getState().setAbortController(abortController);
    
    setIsLoading(true);
    if (isWcBooted) terminalRef.current?.writeln('\r\n\x1b[35m🤖 Aether is thinking...\x1b[0m');

    addMessage({ role: 'model', content: "", timestamp: Date.now() });

    let promptWithContext = content;
    if (activeFile) {
        promptWithContext = `[User Attention: Currently viewing file: ${activeFile}]\n\n${content}`;
    }

    try {
      const stream = generateInterfaceStream(
        selectedModel,
        promptWithContext, 
        attachments,
        toolExecutor,
        abortController.signal
      );

      let fullText = "";

      for await (const chunk of stream) {
        // Verificar se foi cancelado
        if (abortController.signal.aborted) {
          break;
        }
        fullText += chunk;
        setMessages(prev => {
            const newHistory = [...prev];
            const lastMsg = newHistory[newHistory.length - 1];
            if (lastMsg.role === 'model') {
                lastMsg.content = fullText;
            }
            return newHistory;
        });
      }
      
      // Processar bundle se detectado na resposta
      if (!abortController.signal.aborted && fullText) {
        const { processBundleFromResponse } = await import('./services/gemini');
        const bundleResult = processBundleFromResponse(fullText);
        
        if (bundleResult.hasBundle && bundleResult.files.length > 0) {
          // Criar todos os arquivos do bundle
          const state = useStore.getState();
          
          for (const file of bundleResult.files) {
            state.updateFileContent(file.path, file.content);
            if (state.isWcBooted) {
              await RuntimeService.writeFile(file.path, file.content);
            }
          }
          
          // Atualizar mensagem com texto limpo
          setMessages(prev => {
            const newHistory = [...prev];
            const lastMsg = newHistory[newHistory.length - 1];
            if (lastMsg.role === 'model') {
              lastMsg.content = bundleResult.cleanText + 
                `\n\n📦 **Bundle Applied:** ${bundleResult.files.length} files created\n` +
                bundleResult.files.map(f => `  • ${f.path}`).join('\n');
            }
            return newHistory;
          });
          
          // Focar no primeiro arquivo criado
          if (bundleResult.files.length > 0) {
            state.setActiveFile(bundleResult.files[0].path);
          }
          
          toast.success(`Bundle applied: ${bundleResult.files.length} files created`);
          
          // Auto-instalar dependências se package.json foi criado
          const hasPackageJson = bundleResult.files.some(f => f.path === 'package.json');
          if (hasPackageJson) {
            // Auto-boot se necessário
            if (!state.isWcBooted) {
              terminalRef.current?.writeln('\r\n\x1b[33m⚡ Auto-booting runtime for bundle...\x1b[0m');
              await bootWebContainer();
              await new Promise(r => setTimeout(r, 2000));
            }
            
            // Agora instalar e rodar
            const currentState = useStore.getState();
            if (currentState.isWcBooted && shellWriter) {
              terminalRef.current?.writeln('\r\n\x1b[36m📦 Auto-installing dependencies & starting server...\x1b[0m');
              await shellWriter.write('npm install && npm run dev\r');
            }
          }
        } else {
          toast.success("Aether execution complete");
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Generation error:", error);
        const errorMessage = error.message || "Unknown Error";
        addMessage({ role: 'model', content: `\n\n❌ Error: ${errorMessage}`, timestamp: Date.now() });
        setGlobalError(errorMessage);
        toast.error("Generation failed");
      }
    } finally {
      setIsLoading(false);
      setIsRefining(false);
      setAgentStatus(null);
      useStore.getState().setAbortController(null);
    }
  };

  const handleFixError = () => {
      if (!globalError) return;
      const prompt = `I encountered this runtime error in my application:\n\n${globalError}\n\nPlease analyze the code and fix it.`;
      handleSendMessage(prompt);
  };

  const handleClearChat = () => {
    openConfirmation({
      title: 'Clear Chat History',
      message: 'Are you sure you want to clear all messages? This will remove the current conversation context.',
      confirmLabel: 'Clear History',
      variant: 'danger',
      onConfirm: () => {
         setMessages([]);
         toast.info("Chat history cleared");
      }
    });
  };

  const handleResetAll = () => {
    openConfirmation({
      title: 'Reset Completo',
      message: 'Isso vai apagar TUDO: arquivos, chat, container, memória do agente e histórico. Você vai começar do zero absoluto. Tem certeza?',
      confirmLabel: 'Resetar Tudo',
      variant: 'danger',
      onConfirm: () => {
         // Parar qualquer processo em andamento
         if (shellProcess) {
           shellProcess.kill();
         }
         
         // Resetar a sessão do chat e memória do agente (contexto da IA)
         resetChatSession();
         
         // Resetar o store (limpa tudo: arquivos, mensagens, tasks, etc)
         useStore.getState().resetEverything();
         
         // Limpar estados locais
         setShellWriter(null);
         setShellProcess(null);
         setGlobalError(null);
         setIsPreviewMode('static');
         
         // Limpar terminal
         terminalRef.current?.clear();
         terminalRef.current?.writeln('\x1b[33m🔄 Sistema resetado completamente!\x1b[0m');
         terminalRef.current?.writeln('\x1b[32m✓ Arquivos limpos\x1b[0m');
         terminalRef.current?.writeln('\x1b[32m✓ Chat limpo\x1b[0m');
         terminalRef.current?.writeln('\x1b[32m✓ Memória do agente limpa\x1b[0m');
         terminalRef.current?.writeln('\x1b[32m✓ Container resetado\x1b[0m');
         terminalRef.current?.writeln('\x1b[35m\nPronto para começar do zero!\x1b[0m');
         
         toast.success("Sistema resetado completamente!");
      }
    });
  };

  const handleSecureExport = async () => {
    setIsRefining(true);
    setGlobalError(null);
    try {
        const state = useStore.getState();
        const zip = new JSZip();
        
        const addFilesToZip = (files: VirtualFile[], prefix = '') => {
            files.forEach(file => {
                if (file.path === 'index.html') return; 
                if (file.isFolder && file.children) {
                    addFilesToZip(file.children);
                } else if (!file.isFolder) {
                     zip.file(file.path, file.content);
                }
            });
        };
        addFilesToZip(state.virtualFiles);

        const indexFile = state.virtualFiles.find(f => f.path === 'index.html');
        if (indexFile) {
             zip.file('index.html', indexFile.content);
        }

        const readmeContent = `# Aether Exported Project

## How to Run
1. Ensure you have Node.js installed.
2. Open this folder in your terminal.
3. Run \`npm install\` to install dependencies.
4. Run \`npm run dev\` to start the development server.
`;
        zip.file('README.md', readmeContent);

        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'aether-project.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Project exported to ZIP");
    } catch (error: any) {
        setGlobalError("Export failed: " + error.message);
        toast.error("Export failed");
    } finally {
        setIsRefining(false);
    }
  };

  const startResizeSidebar = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingSidebar.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const startResizeEditor = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingEditor.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };
  
  const startResizeBottom = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingBottom.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'row-resize';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!appContainerRef.current) return;
    const containerRect = appContainerRef.current.getBoundingClientRect();
    
    if (isResizingSidebar.current) {
      let newWidth = e.clientX - containerRect.left;
      if (newWidth < 200) newWidth = 200; 
      if (newWidth > containerRect.width * 0.4) newWidth = containerRect.width * 0.4;
      setSidebarWidth(newWidth);
    }

    if (isResizingEditor.current) {
      const availableWidth = containerRect.width - sidebarWidth;
      const editorWidthPx = e.clientX - containerRect.left - sidebarWidth;
      let percentage = (editorWidthPx / availableWidth) * 100;
      if (percentage < 10) percentage = 10;
      if (percentage > 90) percentage = 90;
      setEditorPercentage(percentage);
    }
    
    if (isResizingBottom.current) {
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight < 100) return;
        if (newHeight > window.innerHeight * 0.8) return;
        setBottomPanelHeight(newHeight);
    }
  };

  const handleMouseUp = () => {
    isResizingSidebar.current = false;
    isResizingEditor.current = false;
    isResizingBottom.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
  };

  const [previewKey, setPreviewKey] = useState(0);
  const handleRefresh = () => {
      if (wcUrl && isPreviewMode === 'live') {
           setReloadSignal(prev => prev + 1);
      } else {
          setPreviewKey(k => k + 1);
      }
  };

  const handleOpenFile = (path: string) => {
    const cleanPath = normalizePath(path);
    const allPaths = getAllPaths(virtualFiles);
    if (allPaths.includes(cleanPath)) {
        setActiveFile(cleanPath);
    } else {
        toast.warning(`File not found: ${cleanPath}`);
    }
  };

  const handleCreateFile = (path: string) => {
      if (!path) return;
      const cleanPath = normalizePath(path);
      // Check if regex match exists
      if (currentCode.includes(`data-path="${cleanPath}"`)) {
          toast.error(`File "${cleanPath}" already exists`);
          setActiveFile(cleanPath);
          return;
      }
      updateFileContent(cleanPath, '');
      setActiveFile(cleanPath);
      toast.success(`File "${cleanPath}" created`);
      if (isWcBooted) RuntimeService.writeFile(cleanPath, '');
  };

  return (
    <div className="h-full w-full bg-[#09090b] text-slate-200 flex flex-col overflow-hidden font-sans selection:bg-indigo-500/30">
      <Toaster theme="dark" position="bottom-right" />
      <ConfirmationDialog />
      <SettingsModal />
      
      {/* Workspace Selector (Local Mode) */}
      {isLocalMode && (
        <WorkspaceSelector
          isOpen={isWorkspaceSelectorOpen}
          onClose={() => setIsWorkspaceSelectorOpen(false)}
          onSelect={(path) => {
            setCurrentWorkspace(path);
            // Reboot para usar o novo workspace
            if (isWcBooted) {
              setWcBooted(false);
              setWcUrl(null);
              setTimeout(() => bootWebContainer(), 500);
            }
          }}
          currentWorkspace={currentWorkspace}
        />
      )}
      
      {/* HEADER */}
      <header className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-[#0c0c0e]/80 backdrop-blur-md shrink-0 z-30 select-none relative">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className={`p-1 rounded hover:bg-white/10 text-slate-400 transition-colors ${!isSidebarOpen ? 'text-indigo-400' : ''}`}
            title="Toggle Sidebar (Cmd+B)"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2.5 opacity-90">
             <div className="relative flex items-center justify-center w-5 h-5 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-sm shadow shadow-indigo-500/20">
                <Zap className="w-3 h-3 text-white fill-white/20" />
             </div>
             <h1 className="font-semibold text-sm tracking-tight text-slate-200">Aether <span className="text-white/30 font-light">Prime v5</span></h1>
          </div>
        </div>

        {/* AGENT STATUS PILL OR MODEL SELECTOR */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            {agentStatus ? (
                 <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-0.5 shadow-lg shadow-indigo-500/5 animate-in fade-in slide-in-from-top-1 duration-300">
                    <Activity className="w-3 h-3 text-indigo-400 animate-pulse" />
                    <span className="text-[11px] font-medium text-indigo-100">{agentStatus}</span>
                 </div>
            ) : (
                <div className="flex items-center gap-2 bg-[#18181b]/50 border border-white/5 rounded-md px-2 py-0.5 shadow-sm hover:border-white/10 transition-colors" title="Select AI Model">
                    <Bot className="w-3 h-3 text-indigo-400" />
                    <select 
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="bg-transparent text-[11px] text-slate-300 font-medium outline-none cursor-pointer appearance-none pr-1 text-center min-w-[140px]"
                    >
                        {MODELS.map(model => (
                            <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>

        <div className="flex items-center gap-3">
            {!window.crossOriginIsolated && (
                 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-400 font-medium" title="Reload required for WebContainers">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="hidden sm:inline">Limited Env</span>
                 </div>
            )}

            {/* Mode Indicator & Open Folder (Local Mode) */}
            {isLocalMode && (
                <>
                    <button
                        onClick={() => setIsWorkspaceSelectorOpen(true)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-[10px] font-medium transition-colors"
                        title={currentWorkspace || 'Open Folder'}
                    >
                        <Folder className="w-3 h-3" />
                        <span className="max-w-[120px] truncate">
                            {currentWorkspace ? currentWorkspace.split(/[/\\]/).pop() : 'Open Folder'}
                        </span>
                    </button>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-medium">
                        <TerminalIcon className="w-3 h-3" />
                        <span>PowerShell</span>
                    </div>
                </>
            )}

            <button 
                onClick={bootWebContainer}
                disabled={isWcBooted && !loadingStates.boot}
                title={isWcBooted ? "Runtime is active" : isLocalMode ? "Connect to Local Runtime" : "Start WebContainer Runtime"}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all border ${isWcBooted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-default' : 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent shadow shadow-indigo-500/20'}`}
            >
                {loadingStates.boot ? (
                    <RotateCw className="w-3 h-3 animate-spin" />
                ) : isWcBooted ? (
                    <Power className="w-3 h-3" />
                ) : (
                    <Play className="w-3 h-3 fill-current" />
                )}
                <span>{loadingStates.boot ? 'Booting...' : isWcBooted ? (isLocalMode ? 'Local Active' : 'Runtime Active') : 'Run Project'}</span>
            </button>

            <div className="h-3 w-px bg-white/10 mx-0"></div>

            <button 
                onClick={handleSecureExport}
                disabled={isRefining || isLoading}
                className="p-1.5 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors"
                title="Export Project to ZIP"
            >
                {isRefining ? <ShieldCheck className="w-4 h-4 animate-bounce" /> : <FileArchive className="w-4 h-4" />}
            </button>
            
            <button 
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors"
                title="Toggle Fullscreen"
            >
                {isFullScreen ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
            </button>
        </div>
      </header>

      {/* ERROR BANNER WITH AUTO-FIX */}
      {globalError && (
          <div className="bg-red-500/10 border-b border-red-500/20 text-red-200 px-4 py-2 text-xs flex items-center justify-between animate-in slide-in-from-top-2 shadow-lg relative z-40 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="font-medium">{globalError}</span>
              </div>
              <div className="flex items-center gap-3">
                  <button 
                      onClick={handleFixError}
                      className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 px-2 py-1 rounded text-red-100 transition-colors"
                  >
                      <Stethoscope className="w-3 h-3" />
                      <span>Fix with AI</span>
                  </button>
                  <button onClick={() => setGlobalError(null)} className="hover:text-white">
                    <XCircle className="w-4 h-4 opacity-60" />
                  </button>
              </div>
          </div>
      )}

      {/* MAIN WORKSPACE */}
      <div 
        ref={appContainerRef} 
        className="flex-1 flex overflow-hidden relative"
      >
        {/* 1. SIDEBAR */}
        <div 
            style={{ width: isFullScreen ? 0 : (isSidebarOpen ? sidebarWidth : 0) }} 
            className={`flex-shrink-0 flex flex-col min-w-0 relative h-full z-10 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] overflow-hidden ${isFullScreen || !isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <Sidebar 
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            onResetAll={handleResetAll}
            onCreateFile={handleCreateFile}
            className="w-full h-full"
          />
        </div>

        {!isFullScreen && isSidebarOpen && (
            <div 
                className={`resizer-vertical group hover:bg-indigo-500/50 ${isResizingSidebar.current ? 'bg-indigo-500' : 'bg-transparent'}`}
                onMouseDown={startResizeSidebar}
            />
        )}

        {/* CENTER (Editor) & RIGHT (Preview) */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative bg-[#1e1e1e]">
            
            <div className="flex-1 flex min-h-0 w-full">
                {/* 2. EDITOR */}
                <div 
                    style={{ width: isFullScreen ? 0 : `${editorPercentage}%` }} 
                    className={`flex flex-col min-w-0 h-full relative bg-[#1e1e1e] overflow-hidden ${isFullScreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                    {activeFile || openFiles.length > 0 ? (
                        <>
                            {/* Editor Tabs */}
                            <div className="h-9 bg-[#1e1e1e] flex items-center px-0 select-none shrink-0 border-b border-[#2b2b2b] overflow-x-auto custom-scrollbar">
                                <div className="flex-1 flex items-center min-w-0 overflow-x-auto no-scrollbar">
                                    {openFiles.map(filePath => {
                                        const isActive = filePath === activeFile;
                                        const fileName = filePath.split('/').pop() || filePath;
                                        return (
                                            <div 
                                                key={filePath}
                                                onClick={() => setActiveFile(filePath)}
                                                className={`
                                                    group px-3 py-2 text-xs font-mono min-w-[120px] max-w-[200px] flex items-center justify-between gap-2 border-r border-[#2b2b2b] cursor-pointer transition-all h-full
                                                    ${isActive 
                                                        ? 'bg-[#1e1e1e] text-indigo-100 border-t-2 border-t-indigo-500' 
                                                        : 'bg-[#2d2d2d] text-slate-500 border-t-2 border-t-transparent hover:bg-[#262626] hover:text-slate-300'}
                                                `}
                                                title={filePath}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <FileIcon name={fileName} />
                                                    <span className={`truncate ${isActive ? 'font-medium' : ''}`}>{fileName}</span>
                                                </div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); closeFile(filePath); }}
                                                    className={`opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-white/10 hover:text-white transition-all ${isActive ? 'opacity-100 text-slate-400' : 'text-slate-500'}`}
                                                >
                                                    <X className="w-3 h-3" /> 
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Right Side Actions (Sticky) */}
                                <div className="flex items-center h-full pr-2 gap-2 pl-2 bg-[#1e1e1e] shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.3)] shrink-0 z-10 border-l border-[#2b2b2b]">
                                    {/* SCORE PANEL INJECTED HERE */}
                                    {excellenceReport && (
                                        <ScorePanel 
                                            report={excellenceReport} 
                                            onAutoFix={handleAutoRefine}
                                            isFixing={isRefining}
                                        />
                                    )}
                                    
                                    <div className="h-3 w-px bg-white/10 mx-1"></div>

                                    <button 
                                        onClick={() => editorRef.current?.undo()}
                                        className="p-1.5 rounded hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                                        title="Undo (Ctrl+Z)"
                                    >
                                        <Undo className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                        onClick={() => editorRef.current?.redo()}
                                        className="p-1.5 rounded hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                                        title="Redo (Ctrl+Y)"
                                    >
                                        <Redo className="w-3.5 h-3.5" />
                                    </button>

                                    <div className="h-3 w-px bg-white/10 mx-1"></div>

                                    <button 
                                        onClick={handleFormatCode}
                                        disabled={loadingStates.save}
                                        title="Format Code (Ctrl+S)"
                                        className={`p-1.5 rounded hover:bg-white/10 transition-colors ${loadingStates.save ? 'text-indigo-400 animate-pulse' : 'text-slate-400 hover:text-indigo-300'}`}
                                    >
                                        <Wand2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            
                            {activeFile ? (
                                <div className="flex-1 relative overflow-hidden bg-[#1e1e1e]">
                                    <CodeEditor 
                                        ref={editorRef}
                                        code={activeFileContent} 
                                        language={activeFileLanguage}
                                        path={activeFile || undefined}
                                        onChange={handleEditorChange}
                                        onSave={() => {
                                            handleFormatCode();
                                            toast.success('File saved');
                                        }}
                                        className="w-full h-full" 
                                    />
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] text-slate-500">
                                    <div className="text-center space-y-2">
                                        <div className="w-16 h-16 mx-auto bg-[#252526] rounded-full flex items-center justify-center mb-4">
                                            <Bot className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="text-sm font-medium">No file is open.</p>
                                        <p className="text-xs opacity-60">Select a file from the explorer to start editing.</p>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <WelcomeScreen onCreateFile={() => handleCreateFile('new_file.js')} />
                    )}
                </div>

                {!isFullScreen && (
                    <div 
                        className={`resizer-vertical group hover:bg-indigo-500/50 ${isResizingEditor.current ? 'bg-indigo-500' : 'bg-[#27272a]'}`}
                        onMouseDown={startResizeEditor}
                    />
                )}

                {/* 3. PREVIEW */}
                <div className="flex-1 h-full min-w-0 bg-[#09090b] flex flex-col">
                    {/* Browser Bar */}
                    <div className="h-9 bg-[#0c0c0e] border-b border-[#1e1e20] flex items-center px-2 gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 px-2">
                             <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                             <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                             <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-1">
                            <button onClick={handleRefresh} title="Refresh Preview Frame" className="text-slate-500 hover:text-white transition-colors p-1 rounded hover:bg-white/5">
                                <RotateCw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 bg-[#000000]/50 h-6 rounded flex items-center px-3 gap-2 border border-white/5 mx-2 shadow-inner" title="Current Preview URL">
                            <Lock className="w-2.5 h-2.5 text-emerald-500" />
                            <span className="text-[10px] text-slate-400 font-mono truncate flex-1">
                                {isPreviewMode === 'live' && wcUrl 
                                    ? wcUrl 
                                    : `local://${activeFile || 'workspace'}`}
                            </span>
                        </div>

                        <div className="flex items-center bg-[#18181b] rounded p-0.5 border border-white/5">
                            <button 
                                onClick={() => setIsPreviewMode('static')}
                                title="Switch to Static HTML Preview"
                                className={`px-2 py-0.5 text-[10px] rounded-sm transition-all font-medium ${isPreviewMode === 'static' ? 'bg-[#27272a] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Static
                            </button>
                            <button 
                                onClick={() => {
                                    if(isWcBooted) setIsPreviewMode('live');
                                    else toast.warning("Boot WebContainer first for Live view");
                                }}
                                title="Switch to Live WebContainer Server"
                                className={`px-2 py-0.5 text-[10px] rounded-sm transition-all font-medium ${isPreviewMode === 'live' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'} ${!isWcBooted ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Live
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 relative w-full h-full overflow-hidden bg-white">
                        {isPreviewMode === 'live' && !wcUrl ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1e1e1e] text-slate-400 space-y-6">
                                <div className="relative">
                                    <div className="w-16 h-16 border-2 border-indigo-500/20 rounded-full animate-ping absolute inset-0"></div>
                                    <div className="w-16 h-16 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin relative z-10"></div>
                                </div>
                                <div className="text-center space-y-2">
                                    <span className="text-sm font-medium text-slate-300 block">
                                        {loadingStates.boot ? "Starting Dev Server..." : "Waiting for runtime..."}
                                    </span>
                                    <span className="text-xs text-slate-500 block max-w-xs mx-auto">
                                        Installing dependencies & configuring Vite environment...
                                    </span>
                                    {!loadingStates.boot && !isWcBooted && (
                                         <button 
                                            onClick={bootWebContainer}
                                            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-md transition-colors"
                                         >
                                            Manually Boot Container
                                         </button>
                                    )}
                                </div>
                            </div>
                        ) : isLocalMode && wcUrl ? (
                            /* Modo Local - usa LocalPreview com recursos extras */
                            <LocalPreview 
                                key={previewKey}
                                url={wcUrl}
                                reloadSignal={reloadSignal}
                                isLocalMode={true}
                                className="w-full h-full"
                            />
                        ) : (
                            /* Modo WebContainer ou Static */
                            <PreviewFrame 
                                key={previewKey} 
                                code={currentCode} 
                                url={isPreviewMode === 'live' ? wcUrl : null} 
                                reloadSignal={reloadSignal}
                                className="w-full h-full" 
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* 4. BOTTOM PANEL (TERMINAL) */}
            {showBottomPanel && !isFullScreen && (
                <>
                    <div 
                        className={`resizer-horizontal group hover:bg-indigo-500/50 ${isResizingBottom.current ? 'bg-indigo-500' : 'bg-[#27272a]'}`}
                        onMouseDown={startResizeBottom}
                    />
                    <div style={{ height: bottomPanelHeight }} className="shrink-0 bg-[#0c0c0e] flex flex-col border-t border-slate-800">
                         <TabbedTerminal 
                            terminalInstanceRef={terminalRef} 
                            onInput={(data) => {
                                if (shellWriter) {
                                    shellWriter.write(data).catch(() => {});
                                }
                            }} 
                            onResize={(cols, rows) => {
                                shellProcess?.resize({ cols, rows });
                            }}
                            onOpenFile={handleOpenFile}
                            className="w-full h-full"
                        />
                    </div>
                </>
            )}
            
            {/* Footer Status Bar */}
            <div className="h-6 bg-[#007acc] text-white flex items-center px-3 text-[10px] gap-3 select-none shrink-0 z-20 font-medium">
                 <button onClick={() => setShowBottomPanel(!showBottomPanel)} title="Toggle Terminal (Ctrl+`)" className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-0.5 rounded transition-colors">
                    <TerminalIcon className="w-3 h-3" />
                    <span>TERMINAL</span>
                 </button>
                 
                 <div className="flex items-center gap-1.5 px-2">
                    <div className={`w-2 h-2 rounded-full ${isWcBooted ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-slate-400'}`}></div>
                    <span className="opacity-90">{isWcBooted ? 'Runtime Active' : 'Runtime Offline'}</span>
                 </div>

                 {isLocalMode && (
                     <span className="flex items-center gap-1 bg-purple-500/30 px-2 py-0.5 rounded">
                         <Zap className="w-3 h-3" />
                         LOCAL MODE
                     </span>
                 )}

                 {wcUrl && (
                     <a 
                        href={wcUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:bg-white/10 px-2 py-0.5 rounded transition-colors"
                        title="Open in browser"
                     >
                         <Globe className="w-3 h-3" />
                         {wcUrl.replace('http://', '')}
                     </a>
                 )}

                 {wcError && (
                     <span className="flex items-center gap-1 text-red-100 bg-red-500/20 px-2 py-0.5 rounded">
                         <XCircle className="w-3 h-3" />
                         {wcError}
                     </span>
                 )}

                 {agentStatus && (
                     <span className="flex items-center gap-1 bg-indigo-500/30 px-2 py-0.5 rounded animate-pulse">
                         <Activity className="w-3 h-3" />
                         {agentStatus.length > 30 ? agentStatus.substring(0, 30) + '...' : agentStatus}
                     </span>
                 )}
                 
                 <div className="flex-1"></div>
                 
                 {/* Shortcuts hint */}
                 <span className="opacity-60 hover:opacity-100 cursor-help" title="Ctrl+S: Save | Ctrl+B: Sidebar | F5: Reload">
                    ⌨️ Shortcuts
                 </span>
                 
                 <span className="opacity-80 hover:opacity-100 cursor-pointer">UTF-8</span>
                 <span className="opacity-80 hover:opacity-100 cursor-pointer">{activeFileLanguage.toUpperCase()}</span>
                 <span className="opacity-80 hover:opacity-100 cursor-pointer flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {virtualFiles.length} files
                 </span>
            </div>

        </div>
      </div>
    </div>
  );
};

export default App;
