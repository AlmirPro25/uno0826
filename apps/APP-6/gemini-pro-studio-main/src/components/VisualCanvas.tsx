/**
 * 🎨 VISUAL CANVAS
 * Mini-canvas com imagens e blocos visuais no fundo das conversas
 */

import React, { useState } from 'react';
import { VisualContent, EnrichedSearchResult } from '../services/visualSearchEnhancer';

interface VisualCanvasProps {
  enrichedResult: EnrichedSearchResult;
  theme: 'light' | 'dark';
}

export const VisualCanvas: React.FC<VisualCanvasProps> = ({ enrichedResult, theme }) => {
  const [selectedImage, setSelectedImage] = useState<VisualContent | null>(null);
  const [imageError, setImageError] = useState<Set<string>>(new Set());

  const handleImageError = (url: string) => {
    setImageError(prev => new Set(prev).add(url));
  };

  const handleImageClick = (visual: VisualContent) => {
    setSelectedImage(visual);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  // Filtrar imagens com erro
  const validVisuals = enrichedResult.visualContent.filter(v => !imageError.has(v.url));

  if (validVisuals.length === 0) {
    return null;
  }

  return (
    <div className="visual-canvas-container my-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-images text-purple-400"></i>
          <span className="text-sm font-semibold text-text-secondary">
            Conteúdo Visual
          </span>
          <span className="text-xs text-text-tertiary">
            ({validVisuals.length} {validVisuals.length === 1 ? 'item' : 'itens'})
          </span>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
          {enrichedResult.theme}
        </span>
      </div>

      {/* Visual Content Grid */}
      <div className={`visual-canvas-grid layout-${enrichedResult.layout}`}>
        {validVisuals.map((visual, index) => (
          <VisualCard
            key={index}
            visual={visual}
            theme={theme}
            onClick={() => handleImageClick(visual)}
            onError={() => handleImageError(visual.url)}
          />
        ))}
      </div>

      {/* Modal de Imagem Ampliada */}
      {selectedImage && (
        <ImageModal
          visual={selectedImage}
          theme={theme}
          onClose={closeModal}
        />
      )}

      <style>{`
        .visual-canvas-grid {
          display: grid;
          gap: 12px;
          margin-top: 12px;
        }

        .layout-grid {
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        }

        .layout-masonry {
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          grid-auto-rows: 120px;
        }

        .layout-carousel {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          gap: 12px;
          padding-bottom: 8px;
        }

        .layout-carousel::-webkit-scrollbar {
          height: 6px;
        }

        .layout-carousel::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .layout-carousel::-webkit-scrollbar-thumb {
          background: rgba(147, 51, 234, 0.5);
          border-radius: 3px;
        }

        .layout-timeline {
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          padding-left: 24px;
        }

        .layout-timeline::before {
          content: '';
          position: absolute;
          left: 8px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, #9333ea, #3b82f6);
        }
      `}</style>
    </div>
  );
};

interface VisualCardProps {
  visual: VisualContent;
  theme: 'light' | 'dark';
  onClick: () => void;
  onError: () => void;
}

const VisualCard: React.FC<VisualCardProps> = ({ visual, theme, onClick, onError }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className="visual-card group cursor-pointer"
      onClick={onClick}
    >
      <div className="visual-card-inner">
        {/* Loading Skeleton */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 animate-pulse rounded-lg" />
        )}

        {/* Image */}
        <img
          src={visual.thumbnail || visual.url}
          alt={visual.title}
          className={`visual-card-image ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={onError}
          loading="lazy"
        />

        {/* Overlay */}
        <div className="visual-card-overlay">
          <div className="visual-card-content">
            <h4 className="text-sm font-semibold text-white line-clamp-2">
              {visual.title}
            </h4>
            {visual.description && (
              <p className="text-xs text-gray-300 line-clamp-1 mt-1">
                {visual.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white">
                {visual.source}
              </span>
              {visual.metadata?.price && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/30 text-green-200 font-semibold">
                  {visual.metadata.price}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Type Icon */}
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <i className={`fa-solid ${getTypeIcon(visual.type)} text-white text-xs`}></i>
        </div>
      </div>

      <style>{`
        .visual-card {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: ${theme === 'dark' ? 'rgba(30, 30, 40, 0.5)' : 'rgba(240, 240, 245, 0.5)'};
          border: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          transition: all 0.3s ease;
        }

        .visual-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(147, 51, 234, 0.3);
          border-color: rgba(147, 51, 234, 0.5);
        }

        .visual-card-inner {
          position: relative;
          width: 100%;
          padding-bottom: 75%; /* 4:3 aspect ratio */
          overflow: hidden;
        }

        .visual-card-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: all 0.3s ease;
        }

        .group:hover .visual-card-image {
          transform: scale(1.05);
        }

        .visual-card-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
          padding: 12px;
          transform: translateY(100%);
          transition: transform 0.3s ease;
        }

        .group:hover .visual-card-overlay {
          transform: translateY(0);
        }

        .visual-card-content {
          color: white;
        }
      `}</style>
    </div>
  );
};

interface ImageModalProps {
  visual: VisualContent;
  theme: 'light' | 'dark';
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ visual, theme, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-[90vh] bg-bg-secondary rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
        >
          <i className="fa-solid fa-times"></i>
        </button>

        {/* Image */}
        <img
          src={visual.url}
          alt={visual.title}
          className="max-w-full max-h-[70vh] object-contain"
        />

        {/* Info */}
        <div className="p-6 bg-bg-tertiary">
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {visual.title}
          </h3>
          {visual.description && (
            <p className="text-sm text-text-secondary mb-3">
              {visual.description}
            </p>
          )}
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300">
              {visual.source}
            </span>
            {visual.metadata?.price && (
              <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-300 font-semibold">
                {visual.metadata.price}
              </span>
            )}
            {visual.metadata?.url && (
              <a
                href={visual.metadata.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
              >
                <i className="fa-solid fa-external-link mr-1"></i>
                Ver original
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function getTypeIcon(type: string): string {
  switch (type) {
    case 'image': return 'fa-image';
    case 'chart': return 'fa-chart-line';
    case 'map': return 'fa-map-location-dot';
    case 'video': return 'fa-video';
    case 'infographic': return 'fa-chart-pie';
    default: return 'fa-image';
  }
}

export default VisualCanvas;
