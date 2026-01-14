/**
 * 📂 Workspace Selector Component
 * Permite selecionar uma pasta do sistema como workspace (estilo VS Code)
 */

import React, { useState, useEffect } from 'react';
import { Folder, FolderOpen, Clock, ChevronRight, Plus, RefreshCw, X } from 'lucide-react';

interface RecentWorkspace {
  path: string;
  name: string;
  lastOpened: number;
}

interface WorkspaceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  currentWorkspace: string | null;
}

const API_URL = 'http://localhost:3001';

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentWorkspace
}) => {
  const [recentWorkspaces, setRecentWorkspaces] = useState<RecentWorkspace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customPath, setCustomPath] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadRecentWorkspaces();
    }
  }, [isOpen]);

  const loadRecentWorkspaces = async () => {
    try {
      const res = await fetch(`${API_URL}/api/workspace/recent`);
      const data = await res.json();
      if (data.success) {
        setRecentWorkspaces(data.workspaces);
      }
    } catch (e) {
      console.error('Failed to load recent workspaces', e);
    }
  };

  const handleBrowse = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/workspace/browse`, { method: 'POST' });
      const data = await res.json();
      
      if (data.success && data.path) {
        await selectWorkspace(data.path);
      }
    } catch (e) {
      console.error('Browse failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  const selectWorkspace = async (wsPath: string) => {
    setIsLoading(true);
    try {
      // Definir como workspace atual
      const res = await fetch(`${API_URL}/api/workspace/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: wsPath })
      });
      const data = await res.json();
      
      if (data.success) {
        // Adicionar aos recentes
        await fetch(`${API_URL}/api/workspace/recent/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: wsPath })
        });
        
        onSelect(wsPath);
        onClose();
      }
    } catch (e) {
      console.error('Failed to select workspace', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomPath = async () => {
    if (customPath.trim()) {
      await selectWorkspace(customPath.trim());
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1e2e] border border-slate-700 rounded-xl shadow-2xl w-[600px] max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-6 h-6 text-indigo-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Open Folder</h2>
              <p className="text-xs text-slate-400">Select a workspace folder for your project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Current Workspace */}
          {currentWorkspace && (
            <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <div className="flex items-center gap-2 text-xs text-indigo-400 mb-1">
                <Folder className="w-3.5 h-3.5" />
                <span>Current Workspace</span>
              </div>
              <p className="text-sm text-white font-mono truncate">{currentWorkspace}</p>
            </div>
          )}

          {/* Browse Button */}
          <button
            onClick={handleBrowse}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-lg transition-colors"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <FolderOpen className="w-5 h-5" />
            )}
            <span className="font-medium">Browse for Folder...</span>
          </button>

          {/* Custom Path Input */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Or enter path manually:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="C:\Users\...\my-project"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                onKeyDown={(e) => e.key === 'Enter' && handleCustomPath()}
              />
              <button
                onClick={handleCustomPath}
                disabled={!customPath.trim() || isLoading}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors"
              >
                Open
              </button>
            </div>
          </div>

          {/* Recent Workspaces */}
          {recentWorkspaces.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Recent Workspaces</span>
              </div>
              
              <div className="space-y-1">
                {recentWorkspaces.map((ws, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectWorkspace(ws.path)}
                    disabled={isLoading}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-lg transition-colors group text-left"
                  >
                    <Folder className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{ws.name}</p>
                      <p className="text-xs text-slate-500 truncate font-mono">{ws.path}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-500">{formatDate(ws.lastOpened)}</span>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* New Project Hint */}
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-start gap-3">
              <Plus className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-medium">Create New Project</p>
                <p className="text-xs text-slate-400 mt-1">
                  Select an empty folder or create a new one. The AI agent will set up your project there with real files.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
