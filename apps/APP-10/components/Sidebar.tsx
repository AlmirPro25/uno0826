
import React, { useState } from 'react';
import { MessageSquare, FolderTree, GitBranch, Settings, User, Layers, ListTodo } from 'lucide-react';
import { ChatInterface } from './ChatInterface';
import { FileExplorer } from './FileExplorer';
import { GitManager } from './GitManager';
import { TaskManager } from './TaskManager';
import { Attachment } from '../types';
import { useStore } from '../store';

interface SidebarProps {
  onSendMessage: (msg: string, attachments: Attachment[]) => void;
  onClearChat: () => void;
  onResetAll: () => void;
  onCreateFile: (path: string) => void;
  className?: string;
}

type Tab = 'chat' | 'files' | 'git' | 'tasks';

export const Sidebar: React.FC<SidebarProps> = ({
  onSendMessage,
  onClearChat,
  onResetAll,
  onCreateFile,
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const { toggleSettings } = useStore();

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <ChatInterface 
            onSendMessage={onSendMessage}
            onClearChat={onClearChat}
            onResetAll={onResetAll}
            className="h-full"
          />
        );
      case 'files':
        return (
          <FileExplorer 
            onCreateFile={onCreateFile}
          />
        );
      case 'git':
        return <GitManager />;
      case 'tasks':
        return <TaskManager />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-row h-full bg-[#0c0c0e] ${className}`}>
      
      {/* ACTIVITY BAR (VS Code Style) */}
      <div className="w-12 flex-shrink-0 flex flex-col items-center py-4 bg-[#09090b] border-r border-[#27272a] gap-6 z-20 select-none">
          {/* Activity Icons */}
          <div className="flex flex-col gap-4 w-full items-center">
            <button 
                onClick={() => setActiveTab('chat')}
                className={`group relative flex justify-center w-full py-1 transition-all duration-200 ${activeTab === 'chat' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                title="AI Chat & Commands"
            >
                <MessageSquare className="w-6 h-6 stroke-[1.5px]" />
                {activeTab === 'chat' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-indigo-400 rounded-r-full"></div>}
            </button>
            
            <button 
                onClick={() => setActiveTab('files')}
                className={`group relative flex justify-center w-full py-1 transition-all duration-200 ${activeTab === 'files' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                title="Project Explorer"
            >
                <FolderTree className="w-6 h-6 stroke-[1.5px]" />
                {activeTab === 'files' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-indigo-400 rounded-r-full"></div>}
            </button>

            <button 
                onClick={() => setActiveTab('tasks')}
                className={`group relative flex justify-center w-full py-1 transition-all duration-200 ${activeTab === 'tasks' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                title="Task Manager"
            >
                <ListTodo className="w-6 h-6 stroke-[1.5px]" />
                {activeTab === 'tasks' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-indigo-400 rounded-r-full"></div>}
            </button>

            <button 
                onClick={() => setActiveTab('git')}
                className={`group relative flex justify-center w-full py-1 transition-all duration-200 ${activeTab === 'git' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                title="Source Control"
            >
                <GitBranch className="w-6 h-6 stroke-[1.5px]" />
                {activeTab === 'git' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-indigo-400 rounded-r-full"></div>}
            </button>
          </div>

          <div className="flex-1"></div>

          {/* Bottom Icons */}
          <button className="p-2 text-slate-600 hover:text-slate-400 transition-colors" title="User Profile">
            <User className="w-5 h-5 stroke-[1.5px]" />
          </button>
          <button 
            onClick={toggleSettings}
            className="p-2 text-slate-600 hover:text-slate-400 transition-colors" 
            title="Global Settings"
          >
            <Settings className="w-5 h-5 stroke-[1.5px]" />
          </button>
      </div>

      {/* SIDEBAR CONTENT PANEL */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0c0c0e] border-r border-slate-800/50">
        <div className="flex-1 overflow-hidden relative">
           {renderContent()}
        </div>
      </div>
    </div>
  );
};
