

import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { ChatSession, ChatMessage } from '@/store/useAppStore';
import type { ProjectFile } from '@/services/GeminiService';
import { marked } from 'marked';
import Editor, { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { IntegratedTerminal } from '@/components/IntegratedTerminal';
import { Resizer } from '@/components/ResizablePanel';
import { ProjectFileSystem } from '@/services/ProjectFileSystem';
import { IntegratedMaestro } from '@/services/IntegratedMaestro';
import { ProjectsModal } from '@/components/ProjectsModal';
import { GenerationModeInline } from '@/components/GenerationModeSelector';


interface ChatViewProps {
  chats: ChatSession[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onSendMessage: (prompt: string) => void;
  isGeneratingResponse: boolean;
  projectFiles: ProjectFile[];
  activeFile: string | null;
  onSelectFile: (path: string) => void;
  onFileContentChange: (path: string, newContent: string) => void;
  onSwitchToEditor: () => void;
  // Terminal removido
}

// Helper function to build a tree structure from a flat file list
const buildFileTree = (files: ProjectFile[]) => {
    const tree: any = {};
    files.forEach(file => {
        let currentLevel = tree;
        const pathParts = file.path.split('/');
        pathParts.forEach((part, index) => {
            if (index === pathParts.length - 1) {
                currentLevel[part] = file;
            } else {
                if (!currentLevel[part]) {
                    currentLevel[part] = {};
                }
                currentLevel = currentLevel[part];
            }
        });
    });
    return tree;
};

const getMonacoLanguage = (path: string) => {
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'js': case 'jsx': return 'javascript';
        case 'ts': case 'tsx': return 'typescript';
        case 'css': return 'css';
        case 'json': return 'json';
        case 'md': return 'markdown';
        case 'yml': case 'yaml': return 'yaml';
        case 'sh': return 'shell';
        case 'dockerfile': return 'dockerfile';
        default: return 'html';
    }
};

const getIconForFile = (path: string): { icon: string; color: string; } => {
    const extension = path.split('.').pop()?.toLowerCase();
    if (path.toLowerCase().includes('dockerfile')) return { icon: 'fa-brands fa-docker', color: 'text-sky-500' };
    switch (extension) {
        case 'html': return { icon: 'fa-brands fa-html5', color: 'text-orange-400' };
        case 'css': return { icon: 'fa-brands fa-css3-alt', color: 'text-blue-400' };
        case 'js': return { icon: 'fa-brands fa-js-square', color: 'text-yellow-400' };
        case 'jsx': return { icon: 'fa-brands fa-react', color: 'text-sky-400' };
        case 'ts':
        case 'tsx': return { icon: 'fa-solid fa-file-code', color: 'text-blue-500' }; // No official TS icon in FA free
        case 'json': return { icon: 'fa-solid fa-file-code', color: 'text-green-400' };
        case 'md': return { icon: 'fa-brands fa-markdown', color: 'text-slate-300' };
        case 'sh': return { icon: 'fa-solid fa-terminal', color: 'text-slate-400' };
        case 'yml':
        case 'yaml': return { icon: 'fa-solid fa-file-invoice', color: 'text-red-400' };
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg': return { icon: 'fa-regular fa-file-image', color: 'text-purple-400' };
        default: return { icon: 'fa-regular fa-file', color: 'text-slate-400' };
    }
};


const FileExplorerNode: React.FC<{
    name: string;
    node: any;
    currentPath: string;
    level: number;
    activeFile: string | null;
    onSelectFile: (path: string) => void;
}> = ({ name, node, currentPath, level, activeFile, onSelectFile }) => {
    const [isOpen, setIsOpen] = useState(true);
    const isFile = !!node.content;
    const path = currentPath ? `${currentPath}/${name}` : name;

    if (isFile) {
        const isSelected = activeFile === path;
        const { icon, color } = getIconForFile(path);
        return (
            <button
                onClick={() => onSelectFile(path)}
                className={`w-full text-left flex items-center gap-2 py-1 transition-colors ${isSelected ? 'bg-sky-500/20 text-sky-300' : 'text-slate-300 hover:bg-slate-700/50'}`}
                style={{ paddingLeft: `${level * 12 + 12}px` }}
            >
                <i className={`${icon} ${color} fa-sm w-4 text-center`}></i>
                <span className="truncate text-xs">{name}</span>
            </button>
        );
    }

    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left flex items-center gap-2 py-1 text-slate-300 hover:bg-slate-700/50"
                style={{ paddingLeft: `${level * 12 + 12}px` }}
            >
                <i className={`fa-solid ${isOpen ? 'fa-chevron-down' : 'fa-chevron-right'} fa-xs w-4 text-slate-500`}></i>
                <i className="fa-solid fa-folder fa-sm w-4 text-amber-400"></i>
                <span className="truncate text-xs font-semibold">{name}</span>
            </button>
            {isOpen && (
                <div>
                    {Object.entries(node).sort(([aName, aNode], [bName, bNode]) => {
                        const aIsFile = !!(aNode as any).content;
                        const bIsFile = !!(bNode as any).content;
                        if (aIsFile === bIsFile) return aName.localeCompare(bName);
                        return aIsFile ? 1 : -1;
                    }).map(([childName, childNode]) => (
                        <FileExplorerNode
                            key={childName}
                            name={childName}
                            node={childNode}
                            currentPath={path}
                            level={level + 1}
                            activeFile={activeFile}
                            onSelectFile={onSelectFile}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


// Simple markdown parsing for chat bubbles
const ParsedMarkdown: React.FC<{ content: string }> = React.memo(({ content }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const parsedHtml = useMemo(() => {
        try {
            const dirtyHtml = marked.parse(content, { gfm: true, breaks: true }) as string;
            return dirtyHtml.replace(/<a href/g, '<a target="_blank" rel="noopener noreferrer" href');
        } catch (e) {
            return `<p>Error parsing markdown</p>`;
        }
    }, [content]);

    useEffect(() => {
        if (!containerRef.current) return;

        const allCodeBlocks = containerRef.current.querySelectorAll('pre');
        allCodeBlocks.forEach(preEl => {
            // Check if the button is already there or if it's inside another pre
            if (preEl.closest('.code-block-wrapper')) return;

            const codeEl = preEl.querySelector('code');
            const codeToCopy = codeEl ? codeEl.innerText : '';

            const wrapper = document.createElement('div');
            wrapper.className = 'code-block-wrapper group relative';
            
            const button = document.createElement('button');
            button.innerHTML = '<i class="fa-solid fa-copy fa-xs mr-1.5"></i>Copiar';
            button.className = 'copy-code-btn absolute top-2 right-2 px-2 py-1 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-md text-xs font-medium transition-all opacity-0 group-hover:opacity-100 focus:opacity-100';
            
            button.onclick = () => {
                navigator.clipboard.writeText(codeToCopy).then(() => {
                    button.innerHTML = '<i class="fa-solid fa-check fa-xs mr-1.5"></i>Copiado!';
                    setTimeout(() => {
                        button.innerHTML = '<i class="fa-solid fa-copy fa-xs mr-1.5"></i>Copiar';
                    }, 2000);
                });
            };

            preEl.parentNode?.insertBefore(wrapper, preEl);
            wrapper.appendChild(preEl);
            wrapper.appendChild(button);
        });
    }, [parsedHtml]);

    return (
        <div 
          ref={containerRef}
          className="prose prose-sm prose-invert max-w-none 
                     prose-p:my-1 prose-headings:my-2 
                     prose-blockquote:border-sky-400 prose-blockquote:text-slate-300
                     prose-code:text-emerald-300 prose-code:bg-slate-800/70 prose-code:p-1 prose-code:rounded-sm prose-code:font-mono
                     prose-pre:bg-slate-900/70 prose-pre:p-3 prose-pre:rounded-md prose-pre:border prose-pre:border-slate-700
                     prose-li:marker:text-sky-400"
          dangerouslySetInnerHTML={{ __html: parsedHtml }} 
        />
    );
});


export const ChatView: React.FC<ChatViewProps> = ({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onSendMessage,
  isGeneratingResponse,
  projectFiles,
  activeFile,
  onSelectFile,
  onFileContentChange,
  onSwitchToEditor,
  // Terminal removido
}) => {
  const [prompt, setPrompt] = useState('');
  const activeChat = chats.find(c => c.id === activeChatId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  // Estados para integração com FileSystem
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [showProjectsModal, setShowProjectsModal] = useState(false);

  const fileTree = useMemo(() => buildFileTree(projectFiles), [projectFiles]);
  const activeFileContent = useMemo(() => projectFiles.find(f => f.path === activeFile)?.content ?? '', [projectFiles, activeFile]);

  // Garantir que sempre haja um arquivo ativo
  useEffect(() => {
    if (projectFiles.length > 0 && !activeFile) {
      // Se há arquivos mas nenhum ativo, selecionar o primeiro
      onSelectFile(projectFiles[0].path);
    } else if (projectFiles.length === 0) {
      // Se não há arquivos, criar um padrão
      const defaultContent = '<!DOCTYPE html>\n<html>\n<head>\n    <title>Meu Site</title>\n</head>\n<body>\n    <h1>Bem-vindo!</h1>\n</body>\n</html>';
      onFileContentChange('index.html', defaultContent);
      onSelectFile('index.html');
    }
  }, [projectFiles, activeFile, onSelectFile, onFileContentChange]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [prompt]);

  const handleSendMessageClick = () => {
    if (prompt.trim() && !isGeneratingResponse) {
      onSendMessage(prompt);
      setPrompt('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessageClick();
    }
  };

  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor, monacoInstance: Monaco) => {
    editorRef.current = editorInstance;
  };
  
  const handleStartRename = (chat: ChatSession) => {
    if (chat.id.startsWith('project_CHAT_')) return;
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const handleConfirmRename = (e: React.KeyboardEvent | React.FocusEvent) => {
      if (editingChatId && editingTitle.trim()) {
          onRenameChat(editingChatId, editingTitle.trim());
      }
      setEditingChatId(null);
      setEditingTitle('');
  };

  const sortedChats = useMemo(() => {
      return [...chats].sort((a, b) => {
          const aIsProject = a.id.startsWith('project_CHAT_');
          const bIsProject = b.id.startsWith('project_CHAT_');
          if (aIsProject && !bIsProject) return -1;
          if (!aIsProject && bIsProject) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [chats]);
  
  // Funções de integração com FileSystem
  const handleSaveProject = async () => {
    if (projectFiles.length === 0) {
      setActionMessage('❌ Nenhum arquivo para salvar');
      setTimeout(() => setActionMessage(null), 3000);
      return;
    }
    
    setIsSaving(true);
    setActionMessage('💾 Salvando projeto...');
    
    try {
      const projectName = activeChat?.title || 'Projeto AI Weaver';
      const project = await ProjectFileSystem.createProject(projectName, projectFiles);
      
      setCurrentProjectId(project.id);
      setActionMessage(`✅ Projeto salvo em: ${project.path}`);
      setTimeout(() => setActionMessage(null), 5000);
    } catch (error: any) {
      setActionMessage(`❌ Erro ao salvar: ${error.message}`);
      setTimeout(() => setActionMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleInstallApp = async () => {
    setIsInstalling(true);
    setActionMessage('📦 Instalando como app...');
    
    try {
      // Se não tem projeto salvo, salvar primeiro
      let projectId = currentProjectId;
      
      if (!projectId) {
        const projectName = activeChat?.title || 'Projeto AI Weaver';
        const project = await ProjectFileSystem.createProject(projectName, projectFiles);
        projectId = project.id;
        setCurrentProjectId(projectId);
      }
      
      // Instalar como app
      const result = await ProjectFileSystem.installAsApp(projectId);
      
      if (result.success) {
        setActionMessage(`✅ App instalado! ID: ${result.appId}`);
        setTimeout(() => setActionMessage(null), 5000);
      } else {
        setActionMessage(`❌ Erro ao instalar: ${result.error}`);
        setTimeout(() => setActionMessage(null), 5000);
      }
    } catch (error: any) {
      setActionMessage(`❌ Erro: ${error.message}`);
      setTimeout(() => setActionMessage(null), 5000);
    } finally {
      setIsInstalling(false);
    }
  };
  
  const handleOpenFolder = async () => {
    if (!currentProjectId) {
      setActionMessage('❌ Salve o projeto primeiro');
      setTimeout(() => setActionMessage(null), 3000);
      return;
    }
    
    setActionMessage('📁 Abrindo explorador...');
    
    try {
      const success = await ProjectFileSystem.openInExplorer(currentProjectId);
      
      if (success) {
        setActionMessage('✅ Explorador aberto');
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        setActionMessage('❌ Erro ao abrir explorador');
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (error: any) {
      setActionMessage(`❌ Erro: ${error.message}`);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };
  
  // IMPORTANTE: Todos os hooks devem ser chamados antes de qualquer return condicional
  const { isMobile } = useMobileDetection();
  
  // Estados para painéis redimensionáveis (Desktop)
  const [showTerminal, setShowTerminal] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(16.66);
  const [centerPanelWidth, setCenterPanelWidth] = useState(50);
  const [editorHeight, setEditorHeight] = useState(50);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingCenter, setIsResizingCenter] = useState(false);
  const [isResizingEditor, setIsResizingEditor] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calcular largura do painel direito
  const rightPanelWidth = 100 - leftPanelWidth - centerPanelWidth;
  
  // Handlers de resize
  const handleLeftResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingLeft(true);
  };
  
  const handleCenterResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingCenter(true);
  };
  
  const handleEditorResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingEditor(true);
  };
  
  // Effect para resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      
      if (isResizingLeft) {
        const x = e.clientX - rect.left;
        const newWidth = (x / rect.width) * 100;
        setLeftPanelWidth(Math.max(10, Math.min(30, newWidth)));
      }
      
      if (isResizingCenter) {
        const x = e.clientX - rect.left;
        const leftEdge = (leftPanelWidth / 100) * rect.width;
        const newWidth = ((x - leftEdge) / rect.width) * 100;
        setCenterPanelWidth(Math.max(30, Math.min(70, newWidth)));
      }
      
      if (isResizingEditor && showTerminal) {
        const editorContainer = containerRef.current.querySelector('.editor-terminal-container');
        if (editorContainer) {
          const editorRect = editorContainer.getBoundingClientRect();
          const y = e.clientY - editorRect.top;
          const newHeight = (y / editorRect.height) * 100;
          setEditorHeight(Math.max(20, Math.min(80, newHeight)));
        }
      }
    };
    
    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingCenter(false);
      setIsResizingEditor(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    
    if (isResizingLeft || isResizingCenter || isResizingEditor) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isResizingEditor ? 'row-resize' : 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingLeft, isResizingCenter, isResizingEditor, leftPanelWidth, showTerminal]);
  
  // Agora sim, podemos ter returns condicionais
  if (projectFiles.length === 0) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center text-slate-400 p-4">
            <i className="fa-solid fa-folder-open fa-3x mb-4"></i>
            <h2 className="text-xl font-medium text-slate-300">Nenhum Projeto Carregado</h2>
            <p>Volte para o modo 'Editor', gere um projeto, e então volte para o Chat para começar a refinar.</p>
             <button
                onClick={onSwitchToEditor}
                title="Voltar ao Editor Principal"
                className="mt-4 px-4 py-2 text-sm bg-sky-600 hover:bg-sky-500 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 flex items-center gap-1.5"
            >
                <i className="fa-solid fa-arrow-left fa-sm"></i>
                Voltar ao Editor
            </button>
        </div>
      );
  }

  // Layout Mobile - Vertical com proporções específicas
  if (isMobile) {
    return (
      <div className="h-full w-full bg-slate-900 flex flex-col overflow-hidden" 
           style={{ paddingTop: '4vh', paddingBottom: '0vh' }}>
        {/* 1. CONVERSAS E ARQUIVOS (15%) - NAVEGÁVEL */}
        <div className="h-[15vh] flex-shrink-0 bg-slate-800 border-b border-slate-700 flex">
          {/* Conversas - Metade esquerda */}
          <div className="w-1/2 border-r border-slate-700 flex flex-col">
            <div className="flex-shrink-0 p-2 border-b border-slate-600 bg-slate-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold text-slate-200">Conversas</h3>
                <button
                  onClick={onNewChat}
                  className="px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded"
                >
                  <i className="fa-solid fa-plus fa-xs mr-1"></i>
                  Novo
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-800">
              {sortedChats.length === 0 ? (
                <div className="p-2 text-center text-slate-500">
                  <p className="text-xs">Nenhuma conversa</p>
                </div>
              ) : (
                sortedChats.slice(0, 3).map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={`w-full text-left p-2 text-xs transition-colors border-b border-slate-700/50 ${activeChatId === chat.id ? 'bg-sky-500/20 text-sky-300' : 'text-slate-300 hover:bg-slate-700/50'}`}
                  >
                    <p className="truncate font-medium">{chat.title}</p>
                    <p className="truncate text-slate-500 text-[10px]">{new Date(chat.createdAt).toLocaleDateString()}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Arquivos - Metade direita */}
          <div className="w-1/2 flex flex-col">
            <div className="flex-shrink-0 p-2 border-b border-slate-600 bg-slate-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold text-slate-200">Arquivos</h3>
                <span className="text-xs text-slate-400 bg-slate-600 px-2 py-1 rounded">
                  {projectFiles.length}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-800">
              {projectFiles.length === 0 ? (
                <div className="p-3 text-center text-slate-500">
                  <i className="fa-solid fa-folder-open text-xl mb-2 block"></i>
                  <p className="text-xs">Nenhum arquivo</p>
                  <p className="text-xs text-slate-600 mt-1">Gere código no chat</p>
                </div>
              ) : (
                projectFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => onSelectFile(file.path)}
                    className={`w-full text-left p-2 text-xs transition-colors border-b border-slate-700/50 hover:bg-slate-700/50 ${
                      activeFile === file.path 
                        ? 'bg-orange-500/20 text-orange-300 border-l-3 border-orange-400' 
                        : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <i className={`fa-solid text-sm ${
                        file.path.endsWith('.html') ? 'fa-file-code text-orange-400' :
                        file.path.endsWith('.css') ? 'fa-file-code text-blue-400' :
                        file.path.endsWith('.js') ? 'fa-file-code text-yellow-400' :
                        file.path.endsWith('.json') ? 'fa-file-code text-green-400' :
                        'fa-file text-slate-400'
                      }`}></i>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{file.path.split('/').pop()}</p>
                        <p className="truncate text-slate-500 text-[10px]">{Math.round(file.content.length / 1024)}KB</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 2. EDITOR DE CÓDIGO (37%) */}
        <div className="h-[37vh] flex-shrink-0 bg-slate-800 border-b border-slate-700 flex flex-col">
          <div className="flex-shrink-0 bg-slate-800 text-slate-300 text-xs px-3 py-1.5 flex justify-between items-center border-b border-slate-700">
            <span className="font-semibold">
              <i className="fa-solid fa-file-code mr-2 text-sky-400"></i>
              {activeFile || 'index.html'}
            </span>
            <button
              onClick={onSwitchToEditor}
              className="px-2 py-1 text-xs bg-sky-600 hover:bg-sky-500 text-white rounded"
            >
              <i className="fa-solid fa-arrow-left mr-1"></i>
              Editor
            </button>
          </div>
          <div className="flex-1">
            <Editor
              path={activeFile || 'index.html'}
              value={activeFileContent || '<!DOCTYPE html>\n<html>\n<head>\n    <title>Meu Site</title>\n</head>\n<body>\n    <h1>Bem-vindo!</h1>\n</body>\n</html>'}
              onChange={(value) => {
                const currentFile = activeFile || 'index.html';
                onFileContentChange(currentFile, value || '');
              }}
              onMount={handleEditorDidMount}
              language={getMonacoLanguage(activeFile || 'index.html')}
              theme="vs-dark"
              options={{
                selectOnLineNumbers: true,
                lineNumbers: 'on',
                minimap: { enabled: false },
                automaticLayout: true,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                fontSize: 12,
                fontFamily: '"Fira Mono", "DejaVu Sans Mono", Menlo, Consolas, "Liberation Mono", Monaco, "Lucida Console", monospace',
              }}
            />
          </div>
        </div>

        {/* 3. CHAT (48%) */}
        <div className="flex-1 bg-slate-800 flex flex-col">
          {activeChat ? (
            <>
              {/* Header do Chat */}
              <div className="flex-shrink-0 p-2 border-b border-slate-700">
                <h2 className="text-sm font-semibold truncate text-slate-100">{activeChat.title}</h2>
              </div>
              
              {/* Input de Mensagem - FIXO NO TOPO */}
              <div className="flex-shrink-0 p-2 border-b border-slate-700 bg-slate-800">
                <div className="flex gap-2">
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 placeholder-slate-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    rows={1}
                    disabled={isGeneratingResponse}
                  />
                  {/* 🎛️ Seletor de Modo de Geração */}
                  <GenerationModeInline className="mr-1" />
                  
                  <button
                    onClick={handleSendMessageClick}
                    disabled={!prompt.trim() || isGeneratingResponse}
                    className="px-3 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    {isGeneratingResponse ? (
                      <i className="fa-solid fa-spinner animate-spin"></i>
                    ) : (
                      <i className="fa-solid fa-paper-plane"></i>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Mensagens - Área scrollável */}
              <div className="flex-1 p-2 overflow-y-auto space-y-2">
                {activeChat.messages.map((message, index) => (
                  <div key={index} className={`flex items-start gap-2 ${message.role === 'user' ? 'justify-end' : ''}`}>
                    {message.role === 'model' && <i className="fa-solid fa-robot text-sky-400 p-1 bg-slate-700 rounded-full text-xs"></i>}
                    <div className={`p-2 rounded-lg max-w-xs text-sm ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700'}`}>
                      {index === activeChat.messages.length - 1 && isGeneratingResponse ? (
                        <div className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-sky-300 rounded-full animate-pulse"></span>
                          <span className="w-1 h-1 bg-sky-300 rounded-full animate-pulse delay-150"></span>
                          <span className="w-1 h-1 bg-sky-300 rounded-full animate-pulse delay-300"></span>
                        </div>
                      ) : (
                        <ParsedMarkdown content={message.parts.map(p => p.text).join('')} />
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Action Buttons Mobile - No rodapé */}
              <div className="flex-shrink-0 px-2 py-1.5 border-t border-slate-700 bg-slate-800/50">
                <div className="flex gap-1 mb-1">
                  <button
                    onClick={() => setShowProjectsModal(true)}
                    className="flex-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center justify-center gap-1"
                  >
                    <i className="fa-solid fa-folder-tree fa-xs"></i>
                    Projetos
                  </button>
                  
                  <button
                    onClick={handleSaveProject}
                    disabled={isSaving || projectFiles.length === 0}
                    className="flex-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-500 disabled:bg-slate-600 text-white rounded flex items-center justify-center gap-1"
                  >
                    <i className={`fa-solid ${isSaving ? 'fa-spinner animate-spin' : 'fa-save'} fa-xs`}></i>
                    {currentProjectId ? 'Atualizar' : 'Salvar'}
                  </button>
                </div>
                
                <div className="flex gap-1">
                  <button
                    onClick={handleInstallApp}
                    disabled={isInstalling || projectFiles.length === 0}
                    className="flex-1 px-2 py-1 text-xs bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 text-white rounded flex items-center justify-center gap-1"
                  >
                    <i className={`fa-solid ${isInstalling ? 'fa-spinner animate-spin' : 'fa-box'} fa-xs`}></i>
                    Instalar
                  </button>
                  
                  <button
                    onClick={handleOpenFolder}
                    disabled={!currentProjectId}
                    className="flex-1 px-2 py-1 text-xs bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 text-white rounded flex items-center justify-center gap-1"
                  >
                    <i className="fa-solid fa-folder-open fa-xs"></i>
                    Pasta
                  </button>
                </div>
                
                {actionMessage && (
                  <div className="mt-1 px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded text-center">
                    {actionMessage}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <i className="fa-solid fa-comments text-2xl mb-2"></i>
                <p className="text-sm">Selecione uma conversa</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Layout Desktop - Com Terminal Integrado e Painéis Redimensionáveis
  // (Estados já declarados no início do componente)
  
  return (
    <div ref={containerRef} className="flex-grow flex overflow-hidden bg-slate-900 gap-0 p-1 h-full">
      {/* Leftmost Panel (Chat List + File Explorer) */}
      <div 
        className="bg-slate-800/80 rounded-md flex flex-col overflow-hidden"
        style={{ width: `${leftPanelWidth}%`, minWidth: '150px' }}
      >
        
        {/* Container for scrollable lists */}
        <div className="flex-grow flex flex-col min-h-0">

            {/* Top half: Chat List */}
            <div className="h-1/2 flex flex-col min-h-0">
                <div className="flex-shrink-0 p-2 border-b border-slate-700">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-semibold text-slate-200">Conversas</h3>
                        <button
                            onClick={onNewChat}
                            title="Iniciar Novo Chat"
                            className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500 flex items-center gap-1.5"
                        >
                            <i className="fa-solid fa-plus fa-xs"></i>
                            Novo
                        </button>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50">
                    {sortedChats.map(chat => (
                        <div key={chat.id}>
                          {editingChatId === chat.id ? (
                              <input
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onBlur={handleConfirmRename}
                                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmRename(e)}
                                  className="w-full bg-slate-600 text-slate-100 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  autoFocus
                              />
                          ) : (
                            <button
                                onClick={() => onSelectChat(chat.id)}
                                onDoubleClick={() => handleStartRename(chat)}
                                className={`w-full text-left p-2 text-xs transition-colors group relative ${activeChatId === chat.id ? 'bg-sky-500/20 text-sky-300' : 'text-slate-300 hover:bg-slate-700/50'}`}
                            >
                                <p className="truncate font-medium">{chat.title}</p>
                                <p className="truncate text-slate-400 text-[10px]">{new Date(chat.createdAt).toLocaleString()}</p>
                                {!chat.id.startsWith('project_CHAT_') && (
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                                      <button onClick={(e) => { e.stopPropagation(); handleStartRename(chat); }} className="p-1 hover:bg-slate-600 rounded"><i className="fa-solid fa-pencil fa-xs"></i></button>
                                      <button onClick={(e) => { e.stopPropagation(); if(window.confirm(`Excluir chat "${chat.title}"?`)) onDeleteChat(chat.id); }} className="p-1 hover:bg-slate-600 rounded"><i className="fa-solid fa-trash fa-xs"></i></button>
                                    </div>
                                )}
                            </button>
                          )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom half: File Explorer */}
            <div className="h-1/2 flex flex-col min-h-0 border-t-2 border-slate-700">
                <div className="flex-shrink-0 p-2 border-b border-slate-700">
                    <h3 className="text-xs font-semibold text-slate-200">Arquivos do Projeto</h3>
                </div>
                <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50">
                    {Object.entries(fileTree).sort(([aName, aNode], [bName, bNode]) => {
                        const aIsFile = !!(aNode as any).content;
                        const bIsFile = !!(bNode as any).content;
                        if (aIsFile === bIsFile) return aName.localeCompare(bName);
                        return aIsFile ? 1 : -1; // directories first
                    }).map(([name, node]) => (
                        <FileExplorerNode key={name} name={name} node={node} currentPath="" level={0} activeFile={activeFile} onSelectFile={onSelectFile} />
                    ))}
                </div>
            </div>

        </div>

        {/* Footer Button */}
        <div className="flex-shrink-0 p-2 border-t border-slate-700">
            <button
                onClick={onSwitchToEditor}
                title="Voltar ao Editor Principal"
                className="w-full px-3 py-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500 flex items-center justify-center gap-1.5"
            >
                <i className="fa-solid fa-arrow-left fa-sm"></i>
                Voltar ao Editor
            </button>
        </div>
      </div>
      
      {/* Resizer Left */}
      <Resizer direction="horizontal" onMouseDown={handleLeftResize} />

      {/* Center Panel (Code Editor + Terminal) */}
      <div 
        className="bg-slate-800/80 rounded-md flex flex-col overflow-hidden editor-terminal-container"
        style={{ width: `${centerPanelWidth}%`, minWidth: '300px' }}
      >
        {/* Header do Editor com Toggle Terminal */}
        <div className="flex-shrink-0 bg-slate-800 text-slate-300 text-xs px-3 py-1.5 flex justify-between items-center rounded-t-md border-b border-slate-700">
          <span className="font-semibold">
            <i className="fa-solid fa-file-code mr-2 text-sky-400"></i>
            {activeFile || 'index.html'}
          </span>
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors flex items-center gap-1.5"
            title={showTerminal ? 'Ocultar Terminal' : 'Mostrar Terminal'}
          >
            <i className={`fa-solid ${showTerminal ? 'fa-terminal-slash' : 'fa-terminal'} text-xs`}></i>
            <span>{showTerminal ? 'Ocultar' : 'Terminal'}</span>
          </button>
        </div>
        
        {/* Editor Monaco */}
        <div 
          className="min-h-0 border-b border-slate-700"
          style={{ height: showTerminal ? `${editorHeight}%` : '100%' }}
        >
          <Editor
            path={activeFile || 'index.html'}
            value={activeFileContent || '<!DOCTYPE html>\n<html>\n<head>\n    <title>Meu Site</title>\n</head>\n<body>\n    <h1>Bem-vindo!</h1>\n</body>\n</html>'}
            onChange={(value) => {
              const currentFile = activeFile || 'index.html';
              onFileContentChange(currentFile, value || '');
            }}
            onMount={handleEditorDidMount}
            language={getMonacoLanguage(activeFile || 'index.html')}
            theme="vs-dark"
            options={{
              selectOnLineNumbers: true,
              lineNumbers: 'on',
              minimap: { enabled: true },
              automaticLayout: true,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              fontSize: 14,
              fontFamily: '"Fira Mono", "DejaVu Sans Mono", Menlo, Consolas, "Liberation Mono", Monaco, "Lucida Console", monospace',
              padding: {
                top: 10,
                bottom: 10
              },
              folding: true,
              foldingHighlight: true,
              showFoldingControls: 'always',
              smoothScrolling: true,
              find: { addExtraSpaceOnTop: false },
              contextmenu: true,
              quickSuggestions: true,
              parameterHints: { enabled: true },
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: 'on',
              tabCompletion: 'on',
              wordBasedSuggestions: 'currentDocument'
            }}
          />
        </div>
        
        {/* Resizer Editor/Terminal */}
        {showTerminal && (
          <Resizer direction="vertical" onMouseDown={handleEditorResize} />
        )}
        
        {/* Terminal Integrado */}
        {showTerminal && (
          <div 
            className="min-h-0 overflow-hidden"
            style={{ height: `${100 - editorHeight}%` }}
          >
            <IntegratedTerminal 
              projectFiles={projectFiles.map(f => f.path)}
              onCommandExecuted={(command, output) => {
                console.log('Comando executado:', command);
                console.log('Output:', output);
              }}
            />
          </div>
        )}
      </div>
      
      {/* Resizer Center */}
      <Resizer direction="horizontal" onMouseDown={handleCenterResize} />

      {/* Rightmost Panel (Chat Messages) */}
      <div 
        className="bg-slate-800/80 rounded-md flex flex-col overflow-hidden"
        style={{ width: `${rightPanelWidth}%`, minWidth: '250px' }}
      >
        {activeChat ? (
            <>
                {/* Chat Header */}
                <div className="flex-shrink-0 p-3 border-b border-slate-700">
                    <h2 className="text-sm font-semibold truncate text-slate-100">{activeChat.title}</h2>
                </div>
                
                {/* Prompt Input - FIXO NO TOPO */}
                <div className="flex-shrink-0 p-3 border-b border-slate-700 bg-slate-800">
                   <div className="relative">
                      <textarea
                        ref={textareaRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Faça uma pergunta ou dê uma instrução..."
                        disabled={isGeneratingResponse}
                        className="w-full pl-3 pr-10 py-2 bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm resize-none scrollbar-thin"
                        rows={1}
                      />
                      <button
                        onClick={handleSendMessageClick}
                        disabled={isGeneratingResponse || !prompt.trim()}
                        className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 text-slate-300 hover:text-white hover:bg-sky-500 rounded-full disabled:text-slate-500 disabled:hover:bg-transparent transition-colors"
                        aria-label="Enviar mensagem"
                      >
                          <i className="fa-solid fa-paper-plane-top"></i>
                      </button>
                   </div>
                </div>
                
                {/* Messages - Área scrollável */}
                <div className="flex-grow p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50 space-y-4">
                    {activeChat.messages.map((message, index) => (
                      <div key={index} className={`flex items-start gap-2.5 ${message.role === 'user' ? 'justify-end' : ''}`}>
                          {message.role === 'model' && <i className="fa-solid fa-robot text-sky-400 p-2 bg-slate-700 rounded-full"></i>}
                          <div className={`p-3 rounded-lg max-w-sm ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700'}`}>
                            {index === activeChat.messages.length - 1 && isGeneratingResponse ? (
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-sky-300 rounded-full animate-pulse"></span>
                                    <span className="w-2 h-2 bg-sky-300 rounded-full animate-pulse delay-150"></span>
                                    <span className="w-2 h-2 bg-sky-300 rounded-full animate-pulse delay-300"></span>
                                </div>
                            ) : (
                                <ParsedMarkdown content={message.parts.map(p => p.text).join('')} />
                            )}
                            {message.suggestion && !isGeneratingResponse && (
                                <button 
                                    onClick={() => onSendMessage(message.suggestion!)}
                                    className="mt-2 text-xs bg-sky-500/30 hover:bg-sky-500/50 text-sky-200 px-2 py-1 rounded-md w-full text-left transition-colors"
                                >
                                    <i className="fa-solid fa-lightbulb-on mr-1.5"></i> {message.suggestion}
                                </button>
                            )}
                          </div>
                           {message.role === 'user' && <i className="fa-solid fa-user text-blue-400 p-2 bg-slate-700 rounded-full"></i>}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                
                {/* Action Buttons - No rodapé */}
                <div className="flex-shrink-0 px-3 py-2 border-t border-slate-700 bg-slate-800/50">
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setShowProjectsModal(true)}
                      className="flex-1 min-w-[100px] px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center justify-center gap-1.5"
                      title="Ver todos os projetos salvos"
                    >
                      <i className="fa-solid fa-folder-tree"></i>
                      Ver Projetos
                    </button>
                    
                    <button
                      onClick={handleSaveProject}
                      disabled={isSaving || projectFiles.length === 0}
                      className="flex-1 min-w-[100px] px-3 py-1.5 text-xs bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md transition-colors flex items-center justify-center gap-1.5"
                      title="Salvar projeto no HD"
                    >
                      <i className={`fa-solid ${isSaving ? 'fa-spinner animate-spin' : 'fa-save'}`}></i>
                      {currentProjectId ? 'Atualizar' : 'Salvar'}
                    </button>
                    
                    <button
                      onClick={handleInstallApp}
                      disabled={isInstalling || projectFiles.length === 0}
                      className="flex-1 min-w-[100px] px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md transition-colors flex items-center justify-center gap-1.5"
                      title="Instalar como app via CLI"
                    >
                      <i className={`fa-solid ${isInstalling ? 'fa-spinner animate-spin' : 'fa-box'}`}></i>
                      Instalar
                    </button>
                    
                    <button
                      onClick={handleOpenFolder}
                      disabled={!currentProjectId}
                      className="flex-1 min-w-[100px] px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md transition-colors flex items-center justify-center gap-1.5"
                      title="Abrir pasta no explorador"
                    >
                      <i className="fa-solid fa-folder-open"></i>
                      Abrir Pasta
                    </button>
                  </div>
                  
                  {/* Action Message */}
                  {actionMessage && (
                    <div className="mt-2 px-3 py-1.5 bg-slate-700 text-slate-200 text-xs rounded-md text-center">
                      {actionMessage}
                    </div>
                  )}
                </div>
            </>
        ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                <p>Selecione ou crie uma nova conversa.</p>
            </div>
        )}
      </div>
      
      {/* Projects Modal */}
      <ProjectsModal 
        isOpen={showProjectsModal} 
        onClose={() => setShowProjectsModal(false)} 
      />
    </div>
  );
};
