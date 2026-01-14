import React from 'react';
import EditorTabManager from './EditorTabManager';
import NewEditorModal from './NewEditorModal';
import { HtmlEditor } from './HtmlEditor';
import { type EditorTab, type TechStack } from '@/types/ProjectStructure';
import { stackTemplates } from '@/config/stackTemplates';
import type { editor } from 'monaco-editor';
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';

interface MultiEditorLayoutProps {
  // Editor Tabs
  editorTabs: EditorTab[];
  activeEditorId: string;
  onTabSelect: (tabId: string) => void;
  onTabCreate: () => void;
  onTabClose: (tabId: string) => void;
  onTabRename: (tabId: string, newName: string) => void;
  onTabReorder: (fromIndex: number, toIndex: number) => void;
  onCopyCode?: () => void;
  
  // Editor Content
  onEditorContentChange: (tabId: string, content: string) => void;
  editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>;
  onEditorMount: (editorInstance: editor.IStandaloneCodeEditor, monacoInstance: typeof monacoEditor) => void;
  onCursorPositionChange?: (lineContent: string | null) => void;
  onSelectionChange?: (hasSelection: boolean) => void;
  
  // New Editor Modal
  isNewEditorModalOpen: boolean;
  onNewEditorModalClose: () => void;
  onNewEditorCreate: (name: string, stack: TechStack, aiSpecialist: 'general' | 'frontend' | 'backend') => void;
  isCreatingEditor?: boolean;
  
  // Editor State
  isEditorBlocked?: boolean;
  isStreaming?: boolean;
  streamingAutoScroll?: boolean;
  onStreamingComplete?: () => void;
  
  // AI Specialist
  activeAiSpecialist?: 'general' | 'frontend' | 'backend';
  onAiSpecialistChange?: (specialist: 'general' | 'frontend' | 'backend') => void;
  isAiLoading?: boolean;
  isAiPanelVisible?: boolean;
  onToggleAiPanel?: () => void;
}

const MultiEditorLayout: React.FC<MultiEditorLayoutProps> = ({
  editorTabs,
  activeEditorId,
  onTabSelect,
  onTabCreate,
  onTabClose,
  onTabRename,
  onTabReorder,
  onCopyCode,
  onEditorContentChange,
  editorRef,
  onEditorMount,
  onCursorPositionChange,
  onSelectionChange,
  isNewEditorModalOpen,
  onNewEditorModalClose,
  onNewEditorCreate,
  isCreatingEditor = false,
  isEditorBlocked = false,
  isStreaming = false,
  streamingAutoScroll = true,
  onStreamingComplete,
  activeAiSpecialist,
  onAiSpecialistChange,
  isAiLoading = false,
  isAiPanelVisible = true,
  onToggleAiPanel
}) => {
  const activeTab = editorTabs.find(tab => tab.id === activeEditorId);
  const currentStack = activeTab?.stack;

  const handleEditorChange = (newValue: string | undefined) => {
    if (activeTab && newValue !== undefined) {
      onEditorContentChange(activeTab.id, newValue);
    }
  };

  // Se não há abas, mostrar estado vazio
  if (editorTabs.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center bg-slate-800 rounded-md">
          <div className="text-center">
            <i className="fa-solid fa-code text-4xl text-slate-600 mb-4"></i>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Nenhum editor aberto</h3>
            <p className="text-slate-400 mb-4">Crie um novo editor para começar a desenvolver</p>
            <button
              onClick={onTabCreate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <i className="fa-solid fa-plus"></i>
              Criar Primeiro Editor
            </button>
          </div>
        </div>
        
        <NewEditorModal
          isOpen={isNewEditorModalOpen}
          onClose={onNewEditorModalClose}
          onCreate={onNewEditorCreate}
          isCreating={isCreatingEditor}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Manager */}
      <EditorTabManager
        tabs={editorTabs}
        activeTabId={activeEditorId}
        onTabSelect={onTabSelect}
        onTabCreate={onTabCreate}
        onTabClose={onTabClose}
        onTabRename={onTabRename}
        onTabReorder={onTabReorder}
        onCopyCode={onCopyCode}
        isCreatingTab={isCreatingEditor}
      />

      {/* Editor Area - Sem Header */}
      <div className="flex-1 flex flex-col bg-slate-800 rounded-md overflow-hidden relative">



        {/* Editor - Ocupa toda a área */}
        <div className="flex-1">
          {activeTab && (
            <HtmlEditor
              value={activeTab.content}
              onChange={handleEditorChange}
              editorRef={editorRef}
              onMount={onEditorMount}
              onCursorPositionChange={onCursorPositionChange}
              onSelectionChange={onSelectionChange}
              isEditorBlocked={isEditorBlocked}
              editorId={activeTab.id}
              isStreaming={isStreaming}
              streamingAutoScroll={streamingAutoScroll}
              onStreamingComplete={onStreamingComplete}
            />
          )}
        </div>
      </div>

      {/* New Editor Modal */}
      <NewEditorModal
        isOpen={isNewEditorModalOpen}
        onClose={onNewEditorModalClose}
        onCreate={onNewEditorCreate}
        isCreating={isCreatingEditor}
      />
    </div>
  );
};

export default MultiEditorLayout;