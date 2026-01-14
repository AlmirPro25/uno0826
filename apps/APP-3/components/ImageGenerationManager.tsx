import React, { useState, useCallback } from 'react';
import { useImageGeneration } from '../services/ImageGenerationService';
import { analyzeImageContent } from '../services/EnhancedGeminiService';

interface ImageGenerationManagerProps {
  htmlContent: string;
  onHtmlUpdate: (newHtml: string) => void;
  projectId?: string;
  className?: string;
}

interface GenerationStatus {
  isGenerating: boolean;
  progress: string;
  imagesGenerated: number;
  totalImages: number;
  estimatedTime: number;
  error?: string;
}

export const ImageGenerationManager: React.FC<ImageGenerationManagerProps> = ({
  htmlContent,
  onHtmlUpdate,
  projectId,
  className = ''
}) => {
  const { processImages, countPlaceholders, hasPlaceholders, getPreviewHtml } = useImageGeneration();
  
  const [status, setStatus] = useState<GenerationStatus>({
    isGenerating: false,
    progress: '',
    imagesGenerated: 0,
    totalImages: 0,
    estimatedTime: 0
  });

  // Analisar conteúdo atual
  const analysis = analyzeImageContent(htmlContent);

  const handleGenerateImages = useCallback(async () => {
    if (!analysis.hasImages) return;

    setStatus({
      isGenerating: true,
      progress: 'Iniciando geração de imagens...',
      imagesGenerated: 0,
      totalImages: analysis.placeholderCount,
      estimatedTime: analysis.estimatedGenerationTime
    });

    try {
      const result = await processImages(htmlContent, projectId);
      
      setStatus({
        isGenerating: false,
        progress: `✅ Concluído! ${result.imagesGenerated} imagens geradas`,
        imagesGenerated: result.imagesGenerated,
        totalImages: analysis.placeholderCount,
        estimatedTime: 0
      });

      onHtmlUpdate(result.htmlContent);

    } catch (error: any) {
      setStatus({
        isGenerating: false,
        progress: '',
        imagesGenerated: 0,
        totalImages: analysis.placeholderCount,
        estimatedTime: 0,
        error: error.message
      });
    }
  }, [htmlContent, projectId, analysis, processImages, onHtmlUpdate]);

  const handlePreviewMode = useCallback(() => {
    const previewHtml = getPreviewHtml(htmlContent);
    onHtmlUpdate(previewHtml);
  }, [htmlContent, getPreviewHtml, onHtmlUpdate]);

  if (!analysis.hasImages) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold">Geração de Imagens IA</h3>
            <p className="text-gray-400 text-sm">
              {analysis.placeholderCount} imagem{analysis.placeholderCount !== 1 ? 's' : ''} detectada{analysis.placeholderCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handlePreviewMode}
            disabled={status.isGenerating}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-md transition-colors disabled:opacity-50"
            data-aid="button-preview-mode"
          >
            Preview
          </button>
          
          <button
            onClick={handleGenerateImages}
            disabled={status.isGenerating}
            className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm rounded-md transition-all disabled:opacity-50 flex items-center space-x-2"
            data-aid="button-generate-images"
          >
            {status.isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Gerando...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Gerar Imagens</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {status.isGenerating && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{status.progress}</span>
            <span>{status.imagesGenerated}/{status.totalImages}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(status.imagesGenerated / status.totalImages) * 100}%` }}
            ></div>
          </div>
          {status.estimatedTime > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Tempo estimado: ~{Math.round(status.estimatedTime)}s
            </p>
          )}
        </div>
      )}

      {/* Error Display */}
      {status.error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-md p-3 mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-400 text-sm">{status.error}</span>
          </div>
        </div>
      )}

      {/* Image Descriptions Preview */}
      {analysis.descriptions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300">Imagens a serem geradas:</h4>
          <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
            {analysis.descriptions.map((desc, index) => (
              <div 
                key={index}
                className="bg-gray-800/50 rounded-md p-2 text-xs text-gray-400 border border-gray-700/50"
                data-aid={`image-description-${index}`}
              >
                <span className="text-purple-400 font-medium">#{index + 1}:</span> {desc}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Message */}
      {!status.isGenerating && status.imagesGenerated > 0 && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-md p-3 mt-4">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-400 text-sm">
              {status.imagesGenerated} imagem{status.imagesGenerated !== 1 ? 's' : ''} gerada{status.imagesGenerated !== 1 ? 's' : ''} com sucesso!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};