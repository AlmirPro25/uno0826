import React from 'react';

interface ImageGenerationProgressProps {
  isGenerating: boolean;
  current: number;
  total: number;
  currentDescription?: string;
}

export const ImageGenerationProgress: React.FC<ImageGenerationProgressProps> = ({
  isGenerating,
  current,
  total,
  currentDescription
}) => {
  if (!isGenerating || total === 0) return null;

  const progress = (current / total) * 100;

  return (
    <div className="fixed top-4 right-4 bg-gray-900/95 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4 shadow-xl z-50 min-w-80">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-white font-semibold">Gerando Imagens IA</h3>
          <p className="text-gray-400 text-sm">{current}/{total} imagens</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Current Description */}
      {currentDescription && (
        <div className="bg-gray-800/50 rounded-md p-2">
          <p className="text-xs text-gray-300">
            <span className="text-purple-400 font-medium">Gerando:</span> {currentDescription.substring(0, 60)}...
          </p>
        </div>
      )}

      {/* Estimated Time */}
      <div className="text-xs text-gray-500 mt-2 text-center">
        Tempo estimado: ~{Math.round((total - current) * 12)}s restantes
      </div>
    </div>
  );
};