
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileJson, 
  ChevronRight, 
  ChevronDown, 
  File, 
  Hash, 
  Code2, 
  FileImage, 
  Plus, 
  X, 
  AlertCircle, 
  Search, 
  MoreHorizontal, 
  Trash2, 
  Edit2, 
  FolderPlus,
  Package,
  Settings,
  GitBranch,
  LayoutTemplate,
  FileText,
  Coffee,
  Database,
  Lock,
  FileType,
  Terminal,
  Eye,
  PenLine,
  Cpu,
  Sigma
} from 'lucide-react';
import { VirtualFile } from '../types';
import { useStore } from '../store';
import { RuntimeService, isLocalMode } from '../services/runtimeBridge';
// @ts-ignore
import { toast } from 'sonner';

interface FileExplorerProps {
  onCreateFile: (path: string) => void;
}

const validatePath = (path: string): string | null => {
  if (!path.trim()) return "Name cannot be empty";
  if (/[\\:*?"<>|]/.test(path)) return "Invalid characters: \\ : * ? \" < > |";
  if (path.startsWith('/') || path.endsWith('/')) return "Cannot start or end with /";
  if (path.includes('..')) return "Relative paths (..) are not allowed";
  return null;
};

export const FileIcon = ({ name, isOpen }: { name: string, isOpen?: boolean }) => {
  if (isOpen !== undefined) {
    return isOpen ? 
      <FolderOpen className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" /> : 
      <Folder className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />;
  }
  
  const n = name.toLowerCase();

  // Specific Filenames
  if (n === 'package.json') return <Package className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />;
  if (n === 'tsconfig.json' || n === 'jsconfig.json') return <Settings className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />;
  if (n.startsWith('vite.config') || n.startsWith('next.config')) return <Settings className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />;
  if (n.startsWith('tailwind.config') || n.startsWith('postcss.config')) return <Hash className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />;
  if (n === '.gitignore' || n === '.gitattributes') return <GitBranch className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />;
  if (n === 'index.html') return <LayoutTemplate className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />;
  if (n === 'dockerfile') return <FileType className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />;
  if (n.startsWith('.env')) return <Lock className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />;
  
  // Extensions
  if (n.endsWith('.html')) return <Code2 className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />;
  if (n.endsWith('.css') || n.endsWith('.scss') || n.endsWith('.less')) return <Hash className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />;
  if (n.endsWith('.js') || n.endsWith('.mjs') || n.endsWith('.cjs')) return <FileCode className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />;
  if (n.endsWith('.jsx')) return <FileCode className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />;
  if (n.endsWith('.ts') || n.endsWith('.tsx')) return <FileCode className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />;
  if (n.endsWith('.json')) return <FileJson className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />;
  if (n.endsWith('.md') || n.endsWith('.txt')) return <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />;
  if (n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg') || n.endsWith('.svg') || n.endsWith('.ico') || n.endsWith('.webp')) return <FileImage className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />;
  if (n.endsWith('.java')) return <Coffee className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />;
  if (n.endsWith('.py')) return <FileCode className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />;
  if (n.endsWith('.sql')) return <Database className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />;
  if (n.endsWith('.sh') || n.endsWith('.bash')) return <Terminal className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />;
  if (n.endsWith('.yml') || n.endsWith('.yaml')) return <Settings className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />;
  if (n.endsWith('.tex')) return <Sigma className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />;
  
  return <File className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />;
};

const FileItem: React.FC<{
  file: VirtualFile;
  depth: number;
  activeFile: string | null;
  expandedPaths: Set<string>;
  allPaths: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (file: VirtualFile) => void;
  onRenameExpansion: (oldPath: string, newPath: string) => void;
}> = ({ file, depth, activeFile, expandedPaths, allPaths, onToggle, onSelect, onRenameExpansion }) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(file.name);
  const [isDragOver, setIsDragOver] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const dragExpandTimer = useRef<any>(null);

  const { deleteFile, renameFile, openConfirmation, activeFileAction } = useStore();
  const isOpen = expandedPaths.has(file.path);

  // Agent Activity Status for this file
  const isAgentActive = activeFileAction?.path === file.path;
  const activeType = activeFileAction?.type;

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select();
    }
  }, [isRenaming]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRenaming) return;
    if (file.isFolder) {
      onToggle(file.path);
    } else {
      onSelect(file);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    openConfirmation({
      title: 'Delete File',
      message: `Are you sure you want to permanently delete "${file.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () => {
        deleteFile(file.path);
        toast.success('File deleted');
      }
    });
  };

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(true);
    setRenameValue(file.name);
  };

  const handleRenameSubmit = () => {
      const trimmed = renameValue.trim();
      
      if (!trimmed || trimmed === file.name) {
          setIsRenaming(false);
          setRenameValue(file.name);
          return;
      }

      const error = validatePath(trimmed);
      if (error) {
          toast.error(error);
          renameInputRef.current?.focus();
          return;
      }

      const parentPath = file.path.substring(0, file.path.lastIndexOf('/'));
      const newPath = parentPath ? `${parentPath}/${trimmed}` : trimmed;

      if (allPaths.has(newPath)) {
          toast.error(`"${trimmed}" already exists in this location.`);
          renameInputRef.current?.focus();
          return;
      }

      renameFile(file.path, newPath);
      if (file.isFolder) {
          onRenameExpansion(file.path, newPath);
      }
      toast.success('Renamed successfully');
      setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleRenameSubmit();
      } else if (e.key === 'Escape') {
          setIsRenaming(false);
          setRenameValue(file.name);
      }
  };

  const handleDragStart = (e: React.DragEvent) => {
      if (file.path === 'index.html' || isRenaming) {
          e.preventDefault();
          return;
      }
      e.dataTransfer.setData('text/plain', file.path);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragOver) setIsDragOver(true);
      
      // Auto-expand folder on hover
      if (file.isFolder && !isOpen) {
          if (!dragExpandTimer.current) {
              dragExpandTimer.current = setTimeout(() => {
                  onToggle(file.path);
              }, 800); // 800ms hover to expand
          }
      }
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      
      if (dragExpandTimer.current) {
          clearTimeout(dragExpandTimer.current);
          dragExpandTimer.current = null;
      }
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      
      if (dragExpandTimer.current) {
          clearTimeout(dragExpandTimer.current);
          dragExpandTimer.current = null;
      }

      const sourcePath = e.dataTransfer.getData('text/plain');
      if (!sourcePath) return;

      let destFolder = file.path;
      if (!file.isFolder) {
          const lastSlash = file.path.lastIndexOf('/');
          destFolder = lastSlash !== -1 ? file.path.substring(0, lastSlash) : '';
      }

      if (sourcePath === destFolder || (destFolder !== '' && destFolder.startsWith(sourcePath + '/'))) {
          return;
      }
      
      const fileName = sourcePath.split('/').pop();
      const newPath = destFolder ? `${destFolder}/${fileName}` : fileName;

      if (newPath === sourcePath) return;

      if (allPaths.has(newPath)) {
          toast.error(`"${fileName}" already exists in destination.`);
          return;
      }

      renameFile(sourcePath, newPath);
      
      // Expand folder if we dropped ONTO a folder that was closed
      if (file.isFolder && !isOpen) {
          onToggle(file.path);
      }
      
      toast.success(`Moved to ${destFolder || 'root'}`);
  };

  const isSelected = activeFile === file.path;

  // Visual indicator styles based on agent action
  let itemBgClass = "";
  
  if (isDragOver) {
      itemBgClass = "bg-indigo-500/20 text-indigo-200 border-l-2 border-indigo-400";
  } else if (isAgentActive) {
      if (activeType === 'read') itemBgClass = "bg-yellow-500/20 text-yellow-200 border-l-2 border-yellow-500";
      if (activeType === 'write') itemBgClass = "bg-indigo-500/20 text-indigo-200 border-l-2 border-indigo-500";
      if (activeType === 'delete') itemBgClass = "bg-red-500/20 text-red-200 border-l-2 border-red-500";
  } else if (isSelected) {
      itemBgClass = "bg-[#37373d] text-white border-l-2 border-indigo-500";
  } else {
      itemBgClass = "text-slate-400 hover:text-slate-200 hover:bg-[#2a2d2e] border-l-2 border-transparent";
  }

  return (
    <div className="select-none font-medium text-[13px]">
      <div 
        draggable={!isRenaming && file.path !== 'index.html'}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          flex items-center gap-1.5 py-1 cursor-pointer transition-all duration-150 relative group
          ${itemBgClass}
        `}
        style={{ paddingLeft: `${depth * 12 + 14}px` }}
        onClick={handleClick}
      >
        {/* Background for tree hierarchy lines - handled visually above */}
        {depth > 0 && (
           <div className="absolute top-0 bottom-0 w-px bg-transparent group-hover:bg-slate-700/30 transition-colors" style={{ left: `${(depth - 1) * 12 + 19}px` }}></div>
        )}

        <span className="opacity-70 flex-shrink-0 w-4 flex justify-center transition-transform duration-100">
            {file.isFolder && (
                isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
            )}
        </span>
        
        <FileIcon name={file.name} isOpen={file.isFolder ? isOpen : undefined} />
        
        {isRenaming ? (
            <input 
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={handleRenameKeyDown}
                className="bg-[#121214] text-white text-[13px] px-1 py-0 rounded border border-indigo-500 outline-none w-full min-w-[50px] z-20"
                onClick={(e) => e.stopPropagation()}
            />
        ) : (
            <span className={`truncate ml-1 leading-none pb-0.5 flex-1 flex items-center gap-2`}>
                {file.name}
                {isAgentActive && activeType === 'read' && <Eye className="w-3 h-3 text-yellow-400 animate-pulse" />}
                {isAgentActive && activeType === 'write' && <PenLine className="w-3 h-3 text-indigo-400 animate-bounce" />}
                {isAgentActive && activeType === 'exec' && <Cpu className="w-3 h-3 text-green-400 animate-spin" />}
            </span>
        )}

        {!isRenaming && file.path !== 'index.html' && !isAgentActive && (
             <div className="hidden group-hover:flex items-center gap-1 mr-2">
                <button 
                    onClick={handleRenameClick}
                    className="p-1 text-slate-500 hover:text-indigo-300 transition-colors"
                    title="Rename"
                >
                    <Edit2 className="w-3 h-3" />
                </button>
                <button 
                    onClick={handleDelete}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
             </div>
        )}
      </div>

      {file.isFolder && isOpen && file.children && (
        <div className="relative animate-in slide-in-from-top-1 duration-150">
          <div 
            className="absolute w-px bg-slate-800/40 top-0 bottom-0" 
            style={{ left: `${depth * 12 + 20}px` }}
          />
          {file.children.map((child) => (
            <FileItem 
              key={child.path} 
              file={child} 
              depth={depth + 1} 
              activeFile={activeFile}
              expandedPaths={expandedPaths}
              allPaths={allPaths}
              onToggle={onToggle}
              onSelect={onSelect} 
              onRenameExpansion={onRenameExpansion}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const getAllItems = (nodes: VirtualFile[]): VirtualFile[] => {
    let items: VirtualFile[] = [];
    for (const node of nodes) {
        items.push(node);
        if (node.isFolder && node.children) {
            items = [...items, ...getAllItems(node.children)];
        }
    }
    return items;
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ onCreateFile }) => {
  const { virtualFiles, activeFile, setActiveFile, updateFileContent, currentCode, isWcBooted, renameFile } = useStore();

  const [creationType, setCreationType] = useState<'file' | 'folder' | null>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['src', 'src/components']));

  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allPaths = useMemo(() => {
    return new Set(getAllItems(virtualFiles).map(f => f.path));
  }, [virtualFiles]);

  useEffect(() => {
    if (creationType && inputRef.current) {
      inputRef.current.focus();
    } else {
        setError(null);
        setNewItemName('');
    }
  }, [creationType]);

  useEffect(() => {
    if (isSearchVisible && searchInputRef.current) {
        searchInputRef.current.focus();
    } else if (!isSearchVisible) {
        setSearchQuery('');
    }
  }, [isSearchVisible]);

  const toggleFolder = (path: string) => {
    setExpandedPaths(prev => {
        const next = new Set(prev);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        return next;
    });
  };

  const handleRenameExpansion = (oldPath: string, newPath: string) => {
    setExpandedPaths(prev => {
        const next = new Set<string>();
        prev.forEach(p => {
            if (p === oldPath) {
                next.add(newPath);
            } else if (p.startsWith(oldPath + '/')) {
                next.add(newPath + p.substring(oldPath.length));
            } else {
                next.add(p);
            }
        });
        return next;
    });
  };

  const getCurrentDirectory = () => {
    if (!activeFile) return '';
    const lastSlash = activeFile.lastIndexOf('/');
    return lastSlash !== -1 ? activeFile.substring(0, lastSlash + 1) : '';
  };

  const handleCreateFolder = (path: string) => {
    if (!path) return;
    const keepFile = `${path}/.keep`;
    if (currentCode.includes(`data-path="${keepFile}"`)) {
        toast.error(`Folder "${path}" already exists`);
        return;
    }
    updateFileContent(keepFile, '');
    toast.success(`Folder "${path}" created`);
    if (isWcBooted) RuntimeService.writeFile(keepFile, '');
    
    setExpandedPaths(prev => {
        const next = new Set(prev);
        const parts = path.split('/');
        let current = '';
        parts.forEach(part => {
            current = current ? `${current}/${part}` : part;
            next.add(current);
        });
        return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newItemName.trim();
    
    const validationError = validatePath(trimmedName);
    if (validationError) {
        setError(validationError);
        return;
    }

    if (allPaths.has(trimmedName)) {
         setError(`"${trimmedName}" already exists.`);
         return;
    }

    if (creationType === 'folder') {
      handleCreateFolder(trimmedName);
    } else {
      onCreateFile(trimmedName);
      const parent = trimmedName.substring(0, trimmedName.lastIndexOf('/'));
      if (parent) {
          setExpandedPaths(prev => new Set(prev).add(parent));
      }
    }
    
    setNewItemName('');
    setCreationType(null);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
        setCreationType(null);
        setNewItemName('');
        setError(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewItemName(e.target.value);
      if (error) setError(null);
  };

  const handleRootDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const sourcePath = e.dataTransfer.getData('text/plain');
      if (!sourcePath) return;
      
      const fileName = sourcePath.split('/').pop();
      if (!sourcePath.includes('/')) return;

      const newPath = fileName || sourcePath;
      if (allPaths.has(newPath)) {
          toast.error(`"${fileName}" already exists in root.`);
          return;
      }

      renameFile(sourcePath, newPath);
      toast.success(`Moved to root`);
  };

  const filteredItems = useMemo(() => {
      if (!searchQuery.trim()) return [];
      const all = getAllItems(virtualFiles);
      return all.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [virtualFiles, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e] select-none">
      <div className="px-4 py-3 flex items-center justify-between group shrink-0">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Explorer</span>
        
        <div className="flex items-center gap-0.5">
             <button 
                onClick={() => {
                    setIsSearchVisible(!isSearchVisible);
                    if (creationType) setCreationType(null);
                }} 
                className={`p-1 hover:bg-white/10 rounded transition-colors ${isSearchVisible ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white'}`}
                title="Search Files"
             >
                 <Search className="w-3.5 h-3.5" />
             </button>
             <button 
                onClick={() => {
                    setCreationType('file');
                    setNewItemName(getCurrentDirectory());
                    if (isSearchVisible) setIsSearchVisible(false);
                }} 
                className={`p-1 hover:bg-white/10 rounded transition-colors ${creationType === 'file' ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white'}`}
                title="New File"
             >
                 <Plus className="w-3.5 h-3.5" />
             </button>
             <button 
                onClick={() => {
                    setCreationType('folder');
                    setNewItemName(getCurrentDirectory());
                    if (isSearchVisible) setIsSearchVisible(false);
                }} 
                className={`p-1 hover:bg-white/10 rounded transition-colors ${creationType === 'folder' ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white'}`}
                title="New Folder"
             >
                 <FolderPlus className="w-3.5 h-3.5" />
             </button>
             <div className="w-px h-3 bg-slate-800 mx-1"></div>
             <button 
                className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                title="More Options"
             >
                <MoreHorizontal className="w-3.5 h-3.5" />
             </button>
        </div>
      </div>

      {isSearchVisible && (
        <div className="px-3 py-2 bg-[#121214] border-b border-slate-800/50 animate-in fade-in slide-in-from-top-1 duration-200">
             <div className="relative group">
                <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search files..."
                    className="w-full bg-[#18181b] border border-indigo-500/50 text-white text-xs px-2 py-1.5 rounded focus:outline-none focus:border-indigo-500 placeholder-slate-600 font-mono transition-colors pl-7"
                />
                <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-400 transition-colors" />
                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
             </div>
        </div>
      )}

      {creationType && (
        <div className="px-3 py-2 bg-[#121214] border-b border-slate-800/50 animate-in fade-in slide-in-from-top-1 duration-200">
            <form onSubmit={handleSubmit} className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={newItemName}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={creationType === 'folder' ? "folder/name" : "path/filename.ext"}
                    className={`w-full bg-[#18181b] border ${error ? 'border-red-500' : 'border-indigo-500/50'} text-white text-xs px-2 py-1.5 rounded focus:outline-none focus:border-indigo-500 placeholder-slate-600 font-mono transition-colors`}
                />
                {error && (
                    <div className="flex items-center gap-1 mt-1 px-1 text-red-400 text-[10px]">
                        <AlertCircle className="w-3 h-3" />
                        <span>{error}</span>
                    </div>
                )}
            </form>
        </div>
      )}

      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden py-1 custom-scrollbar"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleRootDrop}
      >
        {searchQuery ? (
             <div className="pb-4">
                {filteredItems.length === 0 ? (
                    <div className="p-4 text-xs text-slate-500 text-center">
                        No matching results.
                    </div>
                ) : (
                    filteredItems.map(item => (
                        <div 
                            key={item.path}
                            onClick={() => {
                                if (!item.isFolder) setActiveFile(item.path);
                            }}
                            className={`
                                px-4 py-1.5 cursor-pointer transition-colors
                                ${activeFile === item.path ? 'bg-[#37373d]' : 'hover:bg-[#2a2d2e]'}
                            `}
                        >
                            <div className="flex items-center gap-2 text-slate-200">
                                <FileIcon name={item.name} isOpen={item.isFolder ? false : undefined} />
                                <span className="text-xs font-medium truncate">{item.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono ml-6 truncate opacity-50">
                                {item.path}
                            </div>
                        </div>
                    ))
                )}
             </div>
        ) : (
             virtualFiles.length === 0 ? (
                <div className="p-6 text-xs text-slate-600 text-center italic flex flex-col items-center gap-2 mt-10">
                    <Folder className="w-8 h-8 opacity-20" />
                    <span>Empty Project</span>
                </div>
                ) : (
                <div className="pb-4">
                    {virtualFiles.map((file) => (
                    <FileItem 
                        key={file.path} 
                        file={file} 
                        depth={0} 
                        activeFile={activeFile}
                        expandedPaths={expandedPaths}
                        allPaths={allPaths}
                        onToggle={toggleFolder}
                        onSelect={(f) => setActiveFile(f.path)} 
                        onRenameExpansion={handleRenameExpansion}
                    />
                    ))}
                </div>
            )
        )}
      </div>
    </div>
  );
};
