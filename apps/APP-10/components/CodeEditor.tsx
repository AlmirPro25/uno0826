
import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';
import { useStore } from '../store';

export interface CodeEditorHandle {
  undo: () => void;
  redo: () => void;
}

interface CodeEditorProps {
  code: string;
  language: string;
  path?: string;
  onChange: (newCode: string) => void;
  onSave?: () => void;
  className?: string;
  readOnly?: boolean;
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(({ 
  code, 
  language,
  path, 
  onChange, 
  onSave,
  className = "",
  readOnly = false
}, ref) => {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const [isEditorMounted, setIsEditorMounted] = useState(false);
  
  // Use selectors to prevent unnecessary re-renders
  const saveEditorState = useStore(state => state.saveEditorState);
  const editorStates = useStore(state => state.editorStates);
  
  const previousPathRef = useRef<string | undefined>(path);

  useImperativeHandle(ref, () => ({
    undo: () => {
      editorRef.current?.trigger('keyboard', 'undo', null);
    },
    redo: () => {
      editorRef.current?.trigger('keyboard', 'redo', null);
    }
  }));

  // Define theme on mount
  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('aether-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#1e1e1e',
          'editor.lineHighlightBackground': '#2a2d2e',
          'editorLineNumber.foreground': '#6e7681',
          'editor.selectionBackground': '#3a3d41',
          'editor.inactiveSelectionBackground': '#3a3d4180',
        }
      });
      monaco.editor.setTheme('aether-dark');
    }
  }, [monaco]);

  // Handle Path Changes: Save old state, Restore new state
  useEffect(() => {
    if (!editorRef.current) return;

    // Only execute if the path has actually changed
    if (previousPathRef.current !== path) {
        
        // 1. Save state of the PREVIOUS path before switching
        if (previousPathRef.current) {
            const currentState = editorRef.current.saveViewState();
            if (currentState) {
                saveEditorState(previousPathRef.current, currentState);
            }
        }

        // 2. Restore state of the NEW path (or reset)
        if (path) {
            const savedState = editorStates[path];
            if (savedState) {
                // Restore cursor and scroll
                editorRef.current.restoreViewState(savedState);
                editorRef.current.focus();
            } else {
                // Reset to top if no history exists for this file
                editorRef.current.setScrollTop(0);
                editorRef.current.setPosition({ lineNumber: 1, column: 1 });
            }
        }

        // Update ref
        previousPathRef.current = path;
    }
  }, [path, editorStates, saveEditorState]);

  const handleEditorDidMount = (editor: any, monacoInstance: any) => {
    editorRef.current = editor;
    setIsEditorMounted(true);
    
    // Add Save Command (Ctrl+S / Cmd+S)
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, () => {
      if (onSave) onSave();
    });

    // Attempt to restore state on initial mount if path exists
    if (path && editorStates[path]) {
       editor.restoreViewState(editorStates[path]);
    }
  };

  const getMonacoLanguage = (lang: string) => {
    switch (lang) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'plaintext';
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
        {!isEditorMounted && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] z-10">
                <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
            </div>
        )}
        <Editor
            height="100%"
            width="100%"
            path={path}
            language={getMonacoLanguage(language)}
            value={code}
            theme="aether-dark"
            onChange={(value) => onChange(value || '')}
            onMount={handleEditorDidMount}
            options={{
                readOnly: readOnly,
                minimap: { enabled: true, scale: 0.75 },
                fontSize: 13,
                lineHeight: 24,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontLigatures: true,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                padding: { top: 16, bottom: 16 },
                renderLineHighlight: 'all',
                tabSize: 2,
                automaticLayout: true,
                suggest: {
                    showWords: false // Don't show arbitrary words in autocomplete
                }
            }}
        />
    </div>
  );
});

CodeEditor.displayName = "CodeEditor";
