// components/ResponsiveEditor.tsx
import React, { useRef, useEffect, useState } from 'react';
import { HtmlEditor } from '@/components/HtmlEditor';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { useAppStore } from '@/store/useAppStore';
import type { editor } from 'monaco-editor';

interface ResponsiveEditorProps {
  htmlCode: string;
  onHtmlCodeChange: (code: string) => void;
  onEditorDidMount: (editor: editor.IStandaloneCodeEditor, monaco: any) => void;
  onCursorPositionChange: (lineContent: string | null) => void;
  isBlocked: boolean;
}

export const ResponsiveEditor: React.FC<ResponsiveEditorProps> = ({
  htmlCode,
  onHtmlCodeChange,
  onEditorDidMount,
  onCursorPositionChange,
  isBlocked,
}) => {
  const { isMobile, isTablet, orientation, screenSize } = useMobileDetection();
  const [showMobileToolbar, setShowMobileToolbar] = useState(false);
  const [fontSize, setFontSize] = useState(isMobile ? 12 : 14);
  const editorRef = useRef<any>(null);
  
  // Store actions
  const { openTechStackModal } = useAppStore();

  // Configurações específicas para mobile
  const mobileEditorOptions = {
    fontSize: fontSize,
    lineHeight: fontSize + 4,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on' as const,
    lineNumbers: isMobile ? 'off' as const : 'on' as const,
    folding: !isMobile,
    glyphMargin: !isMobile,
    lineDecorationsWidth: isMobile ? 0 : 10,
    lineNumbersMinChars: isMobile ? 0 : 3,
    renderLineHighlight: isMobile ? 'none' as const : 'line' as const,
    scrollbar: {
      vertical: 'auto' as const,
      horizontal: 'auto' as const,
      verticalScrollbarSize: isMobile ? 8 : 14,
      horizontalScrollbarSize: isMobile ? 8 : 14,
    },
    overviewRulerLanes: isMobile ? 0 : 3,
    hideCursorInOverviewRuler: isMobile,
    overviewRulerBorder: !isMobile,
    automaticLayout: true,
  };

  // Mobile Toolbar Component
  const MobileToolbar = () => (
    <div className="bg-slate-800 border-b border-slate-700 p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFontSize(Math.max(10, fontSize - 1))}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs"
          >
            A-
          </button>
          <span className="text-xs text-slate-400">{fontSize}px</span>
          <button
            onClick={() => setFontSize(Math.min(18, fontSize + 1))}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs"
          >
            A+
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // Inserir template HTML básico
              const template = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meu Site</title>
</head>
<body>
    <h1>Olá Mundo!</h1>
</body>
</html>`;
              onHtmlCodeChange(template);
            }}
            className="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs"
          >
            Template
          </button>
          
          <button
            onClick={() => setShowMobileToolbar(false)}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
      </div>

      {/* Quick Insert Buttons */}
      <div className="mt-2 flex flex-wrap gap-1">
        {[
          { label: 'div', code: '<div></div>' },
          { label: 'p', code: '<p></p>' },
          { label: 'h1', code: '<h1></h1>' },
          { label: 'img', code: '<img src="" alt="">' },
          { label: 'a', code: '<a href=""></a>' },
          { label: 'button', code: '<button></button>' },
        ].map((tag) => (
          <button
            key={tag.label}
            onClick={() => {
              // Inserir tag na posição do cursor
              const currentCode = htmlCode;
              const newCode = currentCode + '\n' + tag.code;
              onHtmlCodeChange(newCode);
            }}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs"
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Desktop Toolbar - Restaurada */}
      {!isMobile && (
        <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700 p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-code text-blue-400"></i>
              <span className="text-sm font-medium text-slate-200">Editor de Código</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  openTechStackModal();
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                title="Escolher tecnologias (React, Vue, Python, etc.)"
              >
                <i className="fa-solid fa-layer-group"></i>
                <span>Tecnologias</span>
              </button>
              
              <button
                onClick={() => {
                  const newWindow = window.open('', '_blank');
                  if (newWindow) {
                    newWindow.document.write(htmlCode);
                    newWindow.document.close();
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
                title="Abrir código em nova aba"
              >
                <i className="fa-solid fa-external-link-alt"></i>
                <span>Nova Aba</span>
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(htmlCode);
                  console.log('Código copiado!');
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
                title="Copiar código"
              >
                <i className="fa-solid fa-copy"></i>
                <span>Copiar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Toolbar Toggle */}
      {isMobile && (
        <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700 p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-code text-blue-400"></i>
              <span className="text-sm font-medium text-slate-200">Editor</span>
            </div>
            
            <button
              onClick={() => setShowMobileToolbar(!showMobileToolbar)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs transition-colors"
            >
              <i className="fa-solid fa-tools mr-1"></i>
              Ferramentas
            </button>
          </div>
        </div>
      )}

      {/* Mobile Toolbar */}
      {isMobile && showMobileToolbar && <MobileToolbar />}

      {/* Editor */}
      <div className="flex-grow relative">
        {isBlocked && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="bg-slate-800 rounded-lg p-4 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-slate-300">IA gerando código...</p>
            </div>
          </div>
        )}

        <HtmlEditor
          value={htmlCode}
          onChange={onHtmlCodeChange}
          editorRef={editorRef}
          onMount={onEditorDidMount}
          onCursorPositionChange={onCursorPositionChange}
          isEditorBlocked={isBlocked}
        />
      </div>

      {/* Mobile Status Bar */}
      {isMobile && (
        <div className="flex-shrink-0 bg-slate-800 border-t border-slate-700 px-3 py-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>HTML • {htmlCode.length} chars</span>
            <span>{orientation === 'portrait' ? '📱' : '📱↻'}</span>
          </div>
        </div>
      )}
    </div>
  );
};