import React from 'react';
import { type EditorTab, type TechStack } from '@/types/ProjectStructure';
import { stackTemplates } from '@/config/stackTemplates';

interface EditorTabManagerProps {
  tabs: EditorTab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabCreate: () => void;
  onTabClose: (tabId: string) => void;
  onTabRename: (tabId: string, newName: string) => void;
  onTabReorder: (fromIndex: number, toIndex: number) => void;
  isCreatingTab?: boolean;
  onCopyCode?: () => void;
}

const EditorTabManager: React.FC<EditorTabManagerProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabCreate,
  onTabClose,
  onTabRename,
  onTabReorder,
  isCreatingTab = false,
  onCopyCode
}) => {
  const [editingTabId, setEditingTabId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const [draggedTab, setDraggedTab] = React.useState<string | null>(null);

  const handleTabDoubleClick = (tab: EditorTab) => {
    setEditingTabId(tab.id);
    setEditingName(tab.name);
  };

  const handleNameSubmit = (tabId: string) => {
    if (editingName.trim()) {
      onTabRename(tabId, editingName.trim());
    }
    setEditingTabId(null);
    setEditingName('');
  };

  const handleNameKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    if (e.key === 'Enter') {
      handleNameSubmit(tabId);
    } else if (e.key === 'Escape') {
      setEditingTabId(null);
      setEditingName('');
    }
  };

  const getStackIcon = (stack: TechStack): string => {
    return stackTemplates[stack]?.icon || 'fa-solid fa-file-code';
  };

  const getStackColor = (stack: TechStack): string => {
    const template = stackTemplates[stack];
    if (!template) return 'text-slate-400';

    switch (template.category) {
      case 'frontend': return 'text-green-400';
      case 'backend': return 'text-purple-400';
      case 'fullstack': return 'text-blue-400';
      default: return 'text-slate-400';
    }
  };

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    if (draggedTab && draggedTab !== targetTabId) {
      const fromIndex = tabs.findIndex(tab => tab.id === draggedTab);
      const toIndex = tabs.findIndex(tab => tab.id === targetTabId);
      onTabReorder(fromIndex, toIndex);
    }
    setDraggedTab(null);
  };

  return (
    <div className="flex items-center bg-slate-800 border-b border-slate-700 overflow-x-auto scrollbar-thin">
      {/* Tabs */}
      <div className="flex items-center min-w-0 flex-1">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`group relative flex items-center gap-2 px-3 py-2 border-r border-slate-700 cursor-pointer transition-all duration-200 min-w-0 max-w-40 ${tab.id === activeTabId
              ? 'bg-slate-700 border-b-2 border-blue-500'
              : 'hover:bg-slate-700/50'
              } ${draggedTab === tab.id ? 'opacity-50' : ''}`}
            onClick={() => onTabSelect(tab.id)}
            onDoubleClick={() => handleTabDoubleClick(tab)}
            draggable
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, tab.id)}
          >
            {/* Stack Icon */}
            <i className={`${getStackIcon(tab.stack)} ${getStackColor(tab.stack)} text-sm flex-shrink-0`}></i>

            {/* Tab Name */}
            {editingTabId === tab.id ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleNameSubmit(tab.id)}
                onKeyDown={(e) => handleNameKeyDown(e, tab.id)}
                className="bg-slate-600 text-white text-sm px-2 py-1 rounded border-none outline-none focus:ring-1 focus:ring-blue-500 min-w-0 flex-1"
                autoFocus
              />
            ) : (
              <span className="text-sm font-medium text-slate-200 truncate min-w-0 flex-1">
                {tab.name}
              </span>
            )}

            {/* Dirty Indicator */}
            {tab.isDirty && (
              <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" title="Alterações não salvas"></div>
            )}

            {/* AI Specialist Indicator */}
            {tab.aiSpecialist !== 'general' && (
              <div className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${tab.aiSpecialist === 'frontend'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-purple-500/20 text-purple-400'
                }`}>
                {tab.aiSpecialist === 'frontend' ? 'FE' : 'BE'}
              </div>
            )}

            {/* Close Button */}
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-600 rounded transition-all duration-200 flex-shrink-0"
                title="Fechar aba"
              >
                <i className="fa-solid fa-times text-xs text-slate-400 hover:text-red-400"></i>
              </button>
            )}

            {/* Active Tab Indicator */}
            {tab.id === activeTabId && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center border-l border-slate-700 pl-2">
        {/* Copy Code Button */}
        <button
          onClick={onCopyCode}
          disabled={!onCopyCode}
          className="flex items-center gap-1 px-2 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Copiar código da aba ativa"
        >
          <i className="fa-solid fa-copy text-sm"></i>
          <span className="text-xs font-medium hidden xl:inline">Copiar</span>
        </button>

        {/* New Tab Button */}
        <button
          onClick={onTabCreate}
          disabled={isCreatingTab}
          className="flex items-center gap-1 px-2 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Criar nova aba de código"
        >
          <i className={`fa-solid ${isCreatingTab ? 'fa-spinner fa-spin' : 'fa-plus'} text-sm`}></i>
          <span className="text-xs font-medium hidden xl:inline">Nova Aba</span>
        </button>
      </div>



      {/* CSS para scrollbar customizada */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          height: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(71, 85, 105, 0.3);
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 2px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }
      `}</style>
    </div>
  );
};

export default EditorTabManager;