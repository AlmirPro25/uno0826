import React from 'react';
import { useImagePlaceholders } from '../hooks/useImagePlaceholders';

interface ImagePlaceholderIndicatorProps {
  htmlContent: string;
  className?: string;
}

export const ImagePlaceholderIndicator: React.FC<ImagePlaceholderIndicatorProps> = ({
  htmlContent,
  className = ''
}) => {
  const { hasPlaceholders, count, estimatedTime } = useImagePlaceholders(htmlContent);

  if (!hasPlaceholders) return null;

  return (
    <div className={`bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-3 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-md flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-white text-sm font-medium">
            🎨 {count} imagem{count !== 1 ? 's' : ''} será{count !== 1 ? 'ão' : ''} gerada{count !== 1 ? 's' : ''} automaticamente
          </p>
          <p className="text-gray-400 text-xs">
            Tempo estimado: ~{Math.round(estimatedTime / 60)}min {estimatedTime % 60}s
          </p>
        </div>
        <div className="text-purple-400 text-xs font-medium">
          AUTO
        </div>
      </div>
    </div>
  );
};