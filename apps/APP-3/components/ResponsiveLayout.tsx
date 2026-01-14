// components/ResponsiveLayout.tsx
import React, { useState } from 'react';
import { useMobileDetection } from '@/hooks/useMobileDetection';


interface ResponsiveLayoutProps {
  children: React.ReactNode;
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  commandBar: React.ReactNode;
  isPreviewFullscreen: boolean;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  leftPanel,
  rightPanel,
  commandBar,
  isPreviewFullscreen,
}) => {
  const { isMobile, isTablet, orientation } = useMobileDetection();
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // Layout Desktop (>= 1024px) - Layout original restaurado
  if (!isMobile && !isTablet) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col overflow-hidden text-sm text-slate-100">
        {/* Main Content - Layout original lado a lado */}
        <main className="flex-grow flex flex-row overflow-hidden gap-1 p-1">
          {/* Left Panel: Editor com CommandBar */}
          <div className={`flex flex-col gap-1 ${isPreviewFullscreen ? 'hidden' : 'w-2/5'}`}>
            {/* Command Bar apenas para o editor */}
            <div className="flex-shrink-0">
              {commandBar}
            </div>
            {leftPanel}
          </div>

          {/* Right Panel: Preview ocupando altura total */}
          <div className={`flex flex-col gap-1 ${isPreviewFullscreen ? 'w-full' : 'w-3/5'}`}>
            {rightPanel}
          </div>
        </main>

        {children}
      </div>
    );
  }

  // Layout Tablet (768px - 1023px)
  if (isTablet) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col overflow-hidden text-sm text-slate-100">
        {/* Command Bar - Compacto para tablet */}
        <div className="flex-shrink-0">
          {commandBar}
        </div>

        {/* Tabs para alternar entre Editor e Preview */}
        <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                activeTab === 'editor'
                  ? 'bg-slate-700 text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <i className="fa-solid fa-code mr-2"></i>
              Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'bg-slate-700 text-green-400 border-b-2 border-green-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <i className="fa-solid fa-eye mr-2"></i>
              Preview
            </button>
          </div>
        </div>

        {/* Content */}
        <main className="flex-grow overflow-hidden">
          {activeTab === 'editor' ? (
            <div className="h-full flex flex-col gap-1 p-1">
              {leftPanel}
            </div>
          ) : (
            <div className="h-full flex flex-col gap-1 p-1">
              {rightPanel}
            </div>
          )}
        </main>

        {children}
      </div>
    );
  }

  // Layout Mobile SIMPLES (< 768px) - Sistema original + margens de segurança

  // Layout normal para modo editor
  return (
    <div className="h-screen w-screen bg-slate-900 flex flex-col overflow-y-auto text-sm text-slate-100" 
         style={{ paddingTop: '4vh', paddingBottom: '0vh' }}>
      {/* 1. COMMAND BAR (TOPO) */}
      <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center justify-between p-2 border-b border-slate-700">
          <h1 className="text-sm font-semibold text-slate-200">AI Web Weaver</h1>
        </div>
        {commandBar}
      </div>

      {/* 2. EDITOR (MEIO) */}
      <div className="flex-1 min-h-0 border-b border-slate-700">
        {leftPanel}
      </div>

      {/* 3. PREVIEW (EMBAIXO) */}
      <div className="flex-1 min-h-0">
        {rightPanel}
      </div>

      {children}
    </div>
  );
};