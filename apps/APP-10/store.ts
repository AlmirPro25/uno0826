
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Message, VirtualFile, Task, ExcellenceReport, ActiveFileAction } from './types';
import { DEFAULT_PLACEHOLDER_HTML, DEFAULT_MODEL } from './constants';
import { parseVirtualFiles, updateVirtualFile, deleteVirtualFile, renameVirtualPath } from './utils/fileSystem';
import { RuntimeService } from './services/runtimeBridge';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
}

interface AppState {
  // State
  currentCode: string;
  virtualFiles: VirtualFile[];
  activeFile: string | null;
  openFiles: string[];
  messages: Message[];
  isLoading: boolean;
  abortController: AbortController | null;
  selectedModel: string;
  isSidebarOpen: boolean;
  
  // Settings
  isSettingsOpen: boolean;
  apiKey: string | null;

  // Runtime state
  isWcBooted: boolean;
  wcUrl: string | null;
  wcError: string | null;
  tasks: Task[];
  
  // Editor View States (Cursor, Scroll)
  editorStates: Record<string, any>;
  
  // Excellence / Refinement State
  excellenceReport: ExcellenceReport | null;
  isRefining: boolean;
  
  // Real-time Agent State
  agentStatus: string | null;
  activeFileAction: ActiveFileAction | null;
  
  // Prompt History
  promptHistory: string[];
  
  // Global Loading States (Granular)
  loadingStates: {
    save: boolean;   // formatting/saving
    boot: boolean;   // launching/booting
    delete: boolean; // deletion operations
    export: boolean; // exporting/downloading
  };

  // Confirmation State
  confirmation: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    variant: 'danger' | 'warning';
    onConfirm: () => void;
  };
  
  // Actions
  setCurrentCode: (code: string) => void;
  updateFileContent: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;
  setActiveFile: (path: string | null) => void;
  closeFile: (path: string) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  addMessage: (message: Message) => void;
  setIsLoading: (isLoading: boolean) => void;
  setAbortController: (controller: AbortController | null) => void;
  stopGeneration: () => void;
  setSelectedModel: (modelId: string) => void;
  toggleSidebar: () => void;
  setWcBooted: (booted: boolean) => void;
  setWcUrl: (url: string | null) => void;
  setWcError: (error: string | null) => void;
  
  // Settings Actions
  toggleSettings: () => void;
  setApiKey: (key: string) => void;

  // Agent State Actions
  setAgentStatus: (status: string | null) => void;
  setActiveFileAction: (action: ActiveFileAction | null) => void;
  
  // Task Actions
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  
  // Excellence Actions
  setExcellenceReport: (report: ExcellenceReport | null) => void;
  setIsRefining: (isRefining: boolean) => void;
  
  // Editor State Actions
  saveEditorState: (path: string, state: any) => void;
  
  // Loading Action
  setLoading: (key: keyof AppState['loadingStates'], value: boolean) => void;

  // Confirmation Actions
  openConfirmation: (options: ConfirmationOptions) => void;
  closeConfirmation: () => void;
  
  // Prompt History Actions
  addToPromptHistory: (prompt: string) => void;
  clearPromptHistory: () => void;
  
  // Reset Action
  resetEverything: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      currentCode: DEFAULT_PLACEHOLDER_HTML,
      virtualFiles: parseVirtualFiles(DEFAULT_PLACEHOLDER_HTML),
      activeFile: 'index.html',
      openFiles: ['index.html'],
      messages: [],
      isLoading: false,
      abortController: null,
      selectedModel: DEFAULT_MODEL,
      isSidebarOpen: true,
      
      isSettingsOpen: false,
      apiKey: null,

      // Runtime state (Not persisted via partialize, but defaults needed here)
      isWcBooted: false,
      wcUrl: null,
      wcError: null,
      tasks: [],
      editorStates: {},
      excellenceReport: null,
      isRefining: false,
      agentStatus: null,
      activeFileAction: null,
      promptHistory: [],
      
      loadingStates: {
        save: false,
        boot: false,
        delete: false,
        export: false
      },

      confirmation: {
        isOpen: false,
        title: '',
        message: '',
        confirmLabel: 'Confirm',
        variant: 'danger',
        onConfirm: () => {}
      },

      // Actions
      setCurrentCode: (code: string) => {
        const files = parseVirtualFiles(code);
        set({ currentCode: code, virtualFiles: files });
        
        // Clean up openFiles that don't exist anymore
        const state = get();
        const flatPaths = getAllPaths(files);
        const newOpenFiles = state.openFiles.filter(path => flatPaths.includes(path));
        
        let newActiveFile = state.activeFile;
        if (state.activeFile && !flatPaths.includes(state.activeFile)) {
            newActiveFile = newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null;
        }
        
        if (newOpenFiles.length !== state.openFiles.length || newActiveFile !== state.activeFile) {
            set({ openFiles: newOpenFiles, activeFile: newActiveFile });
        }
      },

      updateFileContent: (path: string, content: string) => {
        const state = get();
        const newCode = updateVirtualFile(state.currentCode, path, content);
        // This calls setCurrentCode internally to update virtualFiles
        get().setCurrentCode(newCode);
      },

      deleteFile: (path: string) => {
        const state = get();
        const newCode = deleteVirtualFile(state.currentCode, path);
        get().setCurrentCode(newCode);
        
        if (state.isWcBooted) {
            RuntimeService.deleteFile(path);
        }
      },

      renameFile: (oldPath: string, newPath: string) => {
          const state = get();
          
          // Update the Code
          const newCode = renameVirtualPath(state.currentCode, oldPath, newPath);
          
          // Update Open Files
          const newOpenFiles = state.openFiles.map(p => {
              if (p === oldPath) return newPath;
              if (p.startsWith(oldPath + '/')) return newPath + p.substring(oldPath.length);
              return p;
          });

          // Calculate new active file path if affected
          let newActiveFile = state.activeFile;
          if (state.activeFile) {
              if (state.activeFile === oldPath) {
                  newActiveFile = newPath;
              } else if (state.activeFile.startsWith(oldPath + '/')) {
                  newActiveFile = newPath + state.activeFile.substring(oldPath.length);
              }
          }

          // Update State
          set({ openFiles: newOpenFiles, activeFile: newActiveFile });
          get().setCurrentCode(newCode);

          // Sync with Runtime
          if (state.isWcBooted) {
              RuntimeService.rename(oldPath, newPath);
          }
      },

      setActiveFile: (path) => {
        set((state) => {
           if (!path) return { activeFile: null };
           const isOpen = state.openFiles.includes(path);
           const newOpenFiles = isOpen ? state.openFiles : [...state.openFiles, path];
           return { activeFile: path, openFiles: newOpenFiles };
        });
      },

      closeFile: (path) => {
        set((state) => {
            const newOpenFiles = state.openFiles.filter(p => p !== path);
            let newActiveFile = state.activeFile;
            
            // If closing active file, switch to neighbor
            if (state.activeFile === path) {
                const closedIndex = state.openFiles.indexOf(path);
                if (newOpenFiles.length > 0) {
                    // Prefer the one to the right, or the last one if we closed the last
                    const newIndex = Math.min(closedIndex, newOpenFiles.length - 1);
                    newActiveFile = newOpenFiles[newIndex];
                } else {
                    newActiveFile = null;
                }
            }
            return { openFiles: newOpenFiles, activeFile: newActiveFile };
        });
      },
      
      setMessages: (messagesOrFn) => {
        if (typeof messagesOrFn === 'function') {
          set((state) => ({ messages: messagesOrFn(state.messages) }));
        } else {
          set({ messages: messagesOrFn });
        }
      },

      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      
      setIsLoading: (isLoading) => set({ isLoading }),
      
      setAbortController: (controller) => set({ abortController: controller }),
      
      stopGeneration: () => {
        const state = get();
        if (state.abortController) {
          state.abortController.abort();
          set({ abortController: null, isLoading: false, agentStatus: null });
        }
      },
      
      setSelectedModel: (modelId) => set({ selectedModel: modelId }),
      
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      
      setWcBooted: (isWcBooted) => set({ isWcBooted }),
      
      setWcUrl: (wcUrl) => set({ wcUrl }),
      
      setWcError: (wcError) => set({ wcError }),

      toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
      
      setApiKey: (apiKey) => set({ apiKey }),

      setAgentStatus: (agentStatus) => set({ agentStatus }),
      
      setActiveFileAction: (activeFileAction) => set({ activeFileAction }),

      addTask: (text) => set((state) => ({
        tasks: [...state.tasks, { id: crypto.randomUUID(), text, completed: false }]
      })),

      toggleTask: (id) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      })),

      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      })),
      
      setExcellenceReport: (report) => set({ excellenceReport: report }),
      
      setIsRefining: (isRefining) => set({ isRefining }),
      
      saveEditorState: (path, state) => set((store) => ({
        editorStates: { ...store.editorStates, [path]: state }
      })),
      
      setLoading: (key, value) => set((state) => ({
        loadingStates: { ...state.loadingStates, [key]: value }
      })),

      openConfirmation: (options) => set({
        confirmation: {
          isOpen: true,
          title: options.title,
          message: options.message,
          confirmLabel: options.confirmLabel || 'Confirm',
          variant: options.variant || 'danger',
          onConfirm: options.onConfirm
        }
      }),
      
      closeConfirmation: () => set((state) => ({
        confirmation: { ...state.confirmation, isOpen: false }
      })),
      
      // Prompt History
      addToPromptHistory: (prompt: string) => set((state) => {
        // Evitar duplicatas consecutivas e limitar a 20 itens
        const history = state.promptHistory;
        if (history[0] === prompt) return state;
        return {
          promptHistory: [prompt, ...history.filter(p => p !== prompt)].slice(0, 20)
        };
      }),
      
      clearPromptHistory: () => set({ promptHistory: [] }),
      
      resetEverything: () => {
        // Parar qualquer geração em andamento
        const state = get();
        if (state.abortController) {
          state.abortController.abort();
        }
        
        // Resetar para estado inicial
        set({
          currentCode: DEFAULT_PLACEHOLDER_HTML,
          virtualFiles: parseVirtualFiles(DEFAULT_PLACEHOLDER_HTML),
          activeFile: 'index.html',
          openFiles: ['index.html'],
          messages: [],
          isLoading: false,
          abortController: null,
          tasks: [],
          editorStates: {},
          excellenceReport: null,
          isRefining: false,
          agentStatus: null,
          activeFileAction: null,
          isWcBooted: false,
          wcUrl: null,
          wcError: null,
        });
        
        // Limpar localStorage
        localStorage.removeItem('aether-storage-v1');
      },
    }),
    {
      name: 'aether-storage-v1', // Key in localStorage
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields to avoid runtime state issues
      partialize: (state) => ({
        currentCode: state.currentCode,
        virtualFiles: state.virtualFiles,
        messages: state.messages,
        tasks: state.tasks,
        selectedModel: state.selectedModel,
        isSidebarOpen: state.isSidebarOpen,
        editorStates: state.editorStates,
        openFiles: state.openFiles,
        activeFile: state.activeFile,
        apiKey: state.apiKey,
        promptHistory: state.promptHistory
      })
    }
  )
);

// Helper for internal logic
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
