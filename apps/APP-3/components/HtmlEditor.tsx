
import React, { useEffect } from 'react'; 
import Editor, { Monaco } from '@monaco-editor/react'; 
import type { editor } from 'monaco-editor';
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import { useCodeStreaming, StreamingControls } from './CodeStreamingManager'; 

interface HtmlEditorProps {
  value: string;
  onChange: (newValue: string | undefined) => void;
  editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>;
  onMount: (editorInstance: editor.IStandaloneCodeEditor, monacoInstance: typeof monacoEditor) => void;
  onCursorPositionChange?: (lineContent: string | null) => void; 
  onSelectionChange?: (hasSelection: boolean) => void;
  isEditorBlocked?: boolean;
  editorId?: string;
  // Novos props para streaming
  isStreaming?: boolean;
  onStreamChunk?: (chunk: string) => void;
  onStreamingComplete?: () => void;
  streamingAutoScroll?: boolean;
}

export const HtmlEditor: React.FC<HtmlEditorProps> = ({ 
  value, 
  onChange, 
  editorRef, 
  onMount, 
  onCursorPositionChange,
  onSelectionChange,
  isEditorBlocked = false,
  editorId,
  isStreaming = false,
  onStreamChunk,
  onStreamingComplete,
  streamingAutoScroll = true
}) => {
  
  // Hook para gerenciar streaming
  const {
    streamChunk,
    stopStreaming,
    completeStreaming,
    setAutoScroll,
    isStreaming: isCurrentlyStreaming
  } = useCodeStreaming(editorRef);
  
  const [autoScroll, setAutoScrollState] = React.useState(streamingAutoScroll);
  
  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor, monacoInstance: Monaco) => {
    onMount(editorInstance, monacoInstance as typeof monacoEditor); 
  };

  // Efeito para gerenciar streaming chunks
  React.useEffect(() => {
    if (onStreamChunk && isStreaming) {
      // Configurar callback para receber chunks
      const handleChunk = (chunk: string) => {
        streamChunk(chunk);
      };
      onStreamChunk(handleChunk);
    }
  }, [onStreamChunk, isStreaming, streamChunk]);

  // Efeito para auto-scroll
  React.useEffect(() => {
    setAutoScroll(autoScroll);
  }, [autoScroll, setAutoScroll]);

  const handleAutoScrollChange = (enabled: boolean) => {
    setAutoScrollState(enabled);
    setAutoScroll(enabled);
  };

  const handleStopStreaming = () => {
    stopStreaming();
    onStreamingComplete?.();
  };

  const handleCompleteStreaming = () => {
    completeStreaming();
    onStreamingComplete?.();
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const disposables: monacoEditor.IDisposable[] = [];

    if (onCursorPositionChange) {
      disposables.push(editor.onDidChangeCursorPosition(e => {
        const model = editor.getModel();
        if (model && e.position) {
          const lineContent = model.getLineContent(e.position.lineNumber);
          onCursorPositionChange(lineContent);
        } else {
          onCursorPositionChange(null);
        }
      }));
    }

    if (onSelectionChange) {
      disposables.push(editor.onDidChangeCursorSelection(e => {
        const selection = e.selection;
        onSelectionChange(!!selection && !selection.isEmpty());
      }));
      const currentSelection = editor.getSelection();
      onSelectionChange(!!currentSelection && !currentSelection.isEmpty());
    }
    
    return () => {
      disposables.forEach(d => d.dispose());
    };
  }, [editorRef, onCursorPositionChange, onSelectionChange]);

  return (
    <div 
      className={`w-full h-full rounded-b-md overflow-hidden relative ${isEditorBlocked ? 'editor-blocked' : ''}`}
      data-editor-id={editorId}
    > 
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Editor
          height="100%"
          width="100%"
          language="html"
          theme="vs-dark"
          value={value}
          onChange={isEditorBlocked ? undefined : onChange} // Bloqueia onChange quando necessário
          onMount={handleEditorDidMount}
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
            // Controle granular de interação
            readOnly: isEditorBlocked, // Bloqueia edição mas permite navegação
            contextmenu: !isEditorBlocked, // Desabilita menu de contexto quando bloqueado
            quickSuggestions: !isEditorBlocked,
            parameterHints: { enabled: !isEditorBlocked },
            suggestOnTriggerCharacters: !isEditorBlocked,
            acceptSuggestionOnEnter: isEditorBlocked ? 'off' : 'on',
            tabCompletion: isEditorBlocked ? 'off' : 'on',
            wordBasedSuggestions: isEditorBlocked ? 'off' : 'currentDocument',
            // Manter funcionalidades de navegação sempre ativas
            find: { addExtraSpaceOnTop: false },
            folding: true,
            foldingHighlight: true,
            showFoldingControls: 'always',
            smoothScrolling: true,
            cursorBlinking: isEditorBlocked ? 'solid' : 'blink',
            cursorStyle: isEditorBlocked ? 'line-thin' : 'line'
          }}
          aria-label="HTML Code Editor with Syntax Highlighting and Line Numbers"
        />
      </div>
      
      {/* Controles de streaming */}
      <StreamingControls
        isStreaming={isStreaming || isCurrentlyStreaming()}
        onStop={handleStopStreaming}
        onComplete={handleCompleteStreaming}
        autoScroll={autoScroll}
        onAutoScrollChange={handleAutoScrollChange}
      />

      {/* Overlay visual quando bloqueado (mas não durante streaming) */}
      {isEditorBlocked && !isStreaming && (
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[0.5px] pointer-events-none flex items-center justify-center">
          <div className="bg-slate-800/90 px-4 py-2 rounded-lg border border-slate-600 shadow-lg">
            <div className="flex items-center gap-2 text-slate-300">
              <div className="animate-spin">
                <i className="fa-solid fa-circle-notch text-purple-400"></i>
              </div>
              <span className="text-sm font-medium">IA processando...</span>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de streaming */}
      {isStreaming && (
        <div className="absolute top-2 left-2 bg-green-600/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg z-10">
          <div className="flex items-center gap-2 text-white text-xs font-medium">
            <div className="animate-pulse w-2 h-2 bg-white rounded-full"></div>
            <span>IA escrevendo código...</span>
          </div>
        </div>
      )}
      
      {/* Indicador de streaming mais visível */}
      {isStreaming && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 animate-pulse z-20"></div>
      )}
      
      {/* CSS para estados do editor */}
      <style>{`
        .editor-blocked .monaco-editor .view-lines {
          cursor: default !important;
        }
        
        .editor-blocked .monaco-editor .cursors-layer {
          opacity: 0.6;
        }
        
        /* Manter scroll funcional mesmo quando bloqueado */
        .editor-blocked .monaco-scrollable-element {
          pointer-events: auto !important;
        }
        
        .editor-blocked .monaco-scrollable-element .scrollbar {
          pointer-events: auto !important;
        }
        
        /* Permitir seleção de texto mesmo quando bloqueado */
        .editor-blocked .monaco-editor .view-lines .view-line {
          user-select: text !important;
          -webkit-user-select: text !important;
        }
      `}</style>
    </div>
  );
};
