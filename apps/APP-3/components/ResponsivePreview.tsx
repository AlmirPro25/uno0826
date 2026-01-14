// components/ResponsivePreview.tsx
import React, { useState, useRef } from 'react';
import { HtmlPreview } from '@/components/HtmlPreview';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { MiniPipelineIndicator, useMiniPipeline, type MiniPipelinePhaseState } from './MiniPipelineIndicator';
import { CanvasGodView, type CanvasAgent, type CanvasMessage, type CanvasArtifact } from './GodView/CanvasGodView';
import type { PipelineMode, PipelinePhase } from '../services/PipelineEvents';

interface ResponsivePreviewProps {
  htmlCode: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  previewIframeRef: React.RefObject<HTMLIFrameElement>;
  // 🌟 Pipeline Enterprise (3-5 Fases)
  pipelineVisible?: boolean;
  pipelinePhase?: number;
  pipelineMode?: PipelineMode;
  pipelinePhases?: MiniPipelinePhaseState[];
  onPipelineClick?: () => void;
  // 👁️ God View - Visualização da Colméia
  isGenerating?: boolean;
  showGodView?: boolean;
  godViewPhase?: string;
  godViewProgress?: number;
  godViewStatus?: string;
  godViewAgents?: CanvasAgent[];
  godViewMessages?: CanvasMessage[];
  godViewArtifacts?: CanvasArtifact[];
  onToggleGodView?: () => void;
}

export const ResponsivePreview: React.FC<ResponsivePreviewProps> = ({
  htmlCode,
  isFullscreen,
  onToggleFullscreen,
  previewIframeRef,
  // 🌟 Pipeline Enterprise props
  pipelineVisible = false,
  pipelinePhase = 0,
  pipelineMode = 1,
  pipelinePhases = [],
  onPipelineClick,
  // 👁️ God View props
  isGenerating = false,
  showGodView,
  godViewPhase = 'Processando',
  godViewProgress = 0,
  godViewStatus = 'Analisando requisitos...',
  godViewAgents = [],
  godViewMessages = [],
  godViewArtifacts = [],
  onToggleGodView,
}) => {
  // Hook para gerenciar estado do pipeline automaticamente
  const miniPipeline = useMiniPipeline();
  const { isMobile, isTablet, orientation } = useMobileDetection();
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [showPreviewTools, setShowPreviewTools] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState<'portrait' | 'landscape'>('portrait');
  
  // 👁️ God View - Estado local para controlar visibilidade
  const [localShowGodView, setLocalShowGodView] = useState(false);
  const isGodViewVisible = showGodView !== undefined ? showGodView : (isGenerating && localShowGodView);
  
  // Auto-ativar God View quando começa a gerar
  React.useEffect(() => {
    if (isGenerating && !localShowGodView) {
      setLocalShowGodView(true);
    }
  }, [isGenerating]);
  
  const handleToggleGodView = () => {
    if (onToggleGodView) {
      onToggleGodView();
    } else {
      setLocalShowGodView(!localShowGodView);
    }
  };

  // Dimensões para diferentes modos de preview
  const previewDimensions = {
    mobile: {
      width: deviceOrientation === 'portrait' ? '375px' : '667px',
      height: deviceOrientation === 'portrait' ? '667px' : '375px'
    },
    tablet: {
      width: deviceOrientation === 'portrait' ? '768px' : '1024px',
      height: deviceOrientation === 'portrait' ? '1024px' : '768px'
    },
    desktop: { width: '100%', height: '100%' },
  };

  const currentDimensions = previewDimensions[previewMode];

  // Mobile Preview Toolbar
  const MobilePreviewToolbar = () => (
    <div className="bg-slate-800 border-b border-slate-700 p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-eye text-green-400"></i>
          <span className="text-sm font-medium text-slate-200">Preview</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview Mode Selector */}
          <select
            value={previewMode}
            onChange={(e) => setPreviewMode(e.target.value as any)}
            className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="mobile">📱 Mobile</option>
            <option value="tablet">📱 Tablet</option>
            <option value="desktop">🖥️ Desktop</option>
          </select>

          <button
            onClick={() => setShowPreviewTools(!showPreviewTools)}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs transition-colors"
          >
            <i className="fa-solid fa-tools"></i>
          </button>
        </div>
      </div>

      {/* Preview Tools */}
      {showPreviewTools && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => {
              if (previewIframeRef.current) {
                previewIframeRef.current.contentWindow?.location.reload();
              }
            }}
            className="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs"
          >
            <i className="fa-solid fa-refresh mr-1"></i>
            Reload
          </button>

          <button
            onClick={onToggleFullscreen}
            className="px-2 py-1 bg-purple-700 hover:bg-purple-600 text-white rounded text-xs"
          >
            <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'} mr-1`}></i>
            {isFullscreen ? 'Exit' : 'Full'}
          </button>

          <button
            onClick={() => {
              // Simular diferentes orientações
              const iframe = previewIframeRef.current;
              if (iframe) {
                const currentWidth = iframe.style.width;
                const currentHeight = iframe.style.height;
                iframe.style.width = currentHeight;
                iframe.style.height = currentWidth;
              }
            }}
            className="px-2 py-1 bg-orange-700 hover:bg-orange-600 text-white rounded text-xs"
          >
            <i className="fa-solid fa-rotate mr-1"></i>
            Rotate
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Mobile Preview Header */}
      {isMobile && <MobilePreviewToolbar />}

      {/* Desktop Preview Header - Com seletor de dispositivos */}
      {!isMobile && (
        <div className="flex-shrink-0 bg-slate-800 text-slate-300 text-xs px-3 py-1.5 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-4">
            <span className="font-semibold">
              <i className="fas fa-eye mr-2 text-green-400"></i>
              Preview Interativo
            </span>

            {/* Seletor de Dispositivos */}
            <div className="flex bg-slate-700 rounded-md overflow-hidden">
              {(['desktop', 'tablet', 'mobile'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPreviewMode(mode)}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${previewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-600'
                    }`}
                  title={`Simular ${mode === 'mobile' ? 'Celular' : mode === 'tablet' ? 'Tablet' : 'Desktop'}`}
                >
                  {mode === 'mobile' && '📱'}
                  {mode === 'tablet' && '📱'}
                  {mode === 'desktop' && '🖥️'}
                  <span className="ml-1">
                    {mode === 'mobile' ? 'Mobile' : mode === 'tablet' ? 'Tablet' : 'Desktop'}
                  </span>
                </button>
              ))}
            </div>

            {/* Indicador de tamanho atual */}
            {previewMode !== 'desktop' && (
              <span className="text-slate-400 text-xs">
                {previewMode === 'mobile'
                  ? `${deviceOrientation === 'portrait' ? '375×667' : '667×375'}px`
                  : `${deviceOrientation === 'portrait' ? '768×1024' : '1024×768'}px`
                }
              </span>
            )}

            {/* 🌟 Mini Pipeline Indicator - Enterprise Edition (3-5 fases) */}
            <MiniPipelineIndicator
              isVisible={miniPipeline.isVisible || pipelineVisible}
              currentPhase={miniPipeline.currentPhase || pipelinePhase || 1}
              mode={miniPipeline.mode || pipelineMode}
              phases={miniPipeline.phases.length > 0 ? miniPipeline.phases : pipelinePhases}
              onClick={onPipelineClick}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* 👁️ God View Toggle - Mostra quando está gerando */}
            {isGenerating && (
              <button
                onClick={handleToggleGodView}
                className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                  isGodViewVisible 
                    ? 'bg-purple-600 text-white' 
                    : 'hover:bg-slate-700 text-slate-300'
                }`}
                title={isGodViewVisible ? "Ver Preview" : "Ver Colméia Trabalhando"}
              >
                <span className="text-sm">🐝</span>
                <span className="text-xs">{isGodViewVisible ? 'Preview' : 'Colméia'}</span>
              </button>
            )}

            <button
              onClick={() => {
                if (previewIframeRef.current) {
                  previewIframeRef.current.contentWindow?.location.reload();
                }
              }}
              className="px-2 py-0.5 rounded hover:bg-slate-700 transition-colors"
              title="Recarregar Preview"
            >
              <i className="fa-solid fa-refresh"></i>
            </button>

            {/* Botão para rotacionar dispositivo simulado */}
            {previewMode !== 'desktop' && (
              <button
                onClick={() => {
                  setDeviceOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait');
                }}
                className="px-2 py-0.5 rounded hover:bg-slate-700 transition-colors"
                title={`Rotacionar para ${deviceOrientation === 'portrait' ? 'landscape' : 'portrait'}`}
              >
                <i className="fa-solid fa-rotate"></i>
              </button>
            )}

            <button
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Restaurar Visualização Dividida" : "Maximizar Preview"}
              className="px-2 py-0.5 rounded hover:bg-slate-700 transition-colors"
            >
              <i className={`fa-solid ${isFullscreen ? 'fa-minimize' : 'fa-expand'}`}></i>
            </button>
          </div>
        </div>
      )}

      {/* Preview Content - Com simulação de dispositivos e God View */}
      <div className="flex-grow overflow-hidden relative">
        {/* 👁️ GOD VIEW - Renderiza por cima quando ativo */}
        {isGodViewVisible && (
          <CanvasGodView
            isGenerating={isGenerating}
            currentPhase={godViewPhase}
            progress={godViewProgress}
            statusMessage={godViewStatus}
            agents={godViewAgents}
            messages={godViewMessages}
            artifacts={godViewArtifacts}
            onClose={handleToggleGodView}
          />
        )}

        {/* Preview normal - escondido quando God View está ativo */}
        <div className={isGodViewVisible ? 'hidden' : 'w-full h-full'}>
          {!isMobile && previewMode === 'desktop' ? (
            // Desktop: Preview ocupando toda a altura (modo normal)
            <div className="w-full h-full bg-white rounded-b-md overflow-hidden">
              <HtmlPreview
                htmlContent={htmlCode || ''}
                iframeRef={previewIframeRef}
              />
            </div>
          ) : !isMobile && previewMode !== 'desktop' ? (
          // Desktop: Simulação de dispositivos móveis
          <div className="flex items-center justify-center bg-slate-900 p-8 h-full">
            <div className="relative">
              {/* Device Frame */}
              <div
                className="bg-slate-800 rounded-lg p-4 shadow-2xl border-2 border-slate-700"
                style={{
                  width: `calc(${previewDimensions[previewMode].width} + 32px)`,
                  height: `calc(${previewDimensions[previewMode].height} + 32px)`,
                }}
              >
                {/* Device Screen */}
                <div
                  className="bg-white rounded overflow-hidden relative"
                  style={{
                    width: previewDimensions[previewMode].width,
                    height: previewDimensions[previewMode].height,
                  }}
                >
                  <HtmlPreview
                    htmlContent={htmlCode || ''}
                    iframeRef={previewIframeRef}
                  />

                  {/* Overlay com informações do dispositivo */}
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <span>
                      {previewMode === 'mobile'
                        ? `${deviceOrientation === 'portrait' ? '375×667' : '667×375'}`
                        : `${deviceOrientation === 'portrait' ? '768×1024' : '1024×768'}`
                      }
                    </span>
                    <span className="text-yellow-400">
                      {deviceOrientation === 'portrait' ? '📱' : '📱↻'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Device Label */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-600 flex items-center gap-2">
                  {previewMode === 'mobile' ? '📱 iPhone 12 Pro' : '📱 iPad Pro'}
                  <span className="text-blue-400">
                    {deviceOrientation === 'portrait' ? 'Portrait' : 'Landscape'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          // Mobile: Preview normal
          <div className="w-full h-full bg-white rounded-b-md overflow-hidden">
            <HtmlPreview
              htmlContent={htmlCode || ''}
              iframeRef={previewIframeRef}
            />
          </div>
        )}
        </div>
      </div>

      {/* Mobile Status Bar */}
      {isMobile && (
        <div className="flex-shrink-0 bg-slate-800 border-t border-slate-700 px-3 py-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Preview • {previewMode}</span>
            <span>{htmlCode ? '✅ Loaded' : '⏳ Empty'}</span>
          </div>
        </div>
      )}
    </div>
  );
};