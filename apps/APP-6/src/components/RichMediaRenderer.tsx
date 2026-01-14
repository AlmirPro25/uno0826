/**
 * 🎨 RICH MEDIA RENDERER
 * Renderiza fotos, vídeos, links e produtos de forma rica no chat
 */

import React, { useState } from 'react';

interface MediaItem {
  type: 'image' | 'video' | 'link' | 'product';
  src?: string;
  url?: string;
  title?: string;
  description?: string;
  price?: string;
  thumbnail?: string;
}

interface RichMediaRendererProps {
  items: MediaItem[];
  layout?: 'grid' | 'list' | 'carousel';
}

export const RichMediaRenderer: React.FC<RichMediaRendererProps> = ({ 
  items, 
  layout = 'grid' 
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!items || items.length === 0) return null;

  const renderImage = (item: MediaItem, index: number) => (
    <div 
      key={index}
      className="relative group cursor-pointer overflow-hidden rounded-lg border border-border-color hover:border-blue-500 transition-all"
      onClick={() => setSelectedImage(item.src || item.thumbnail || '')}
    >
      <img 
        src={item.src || item.thumbnail} 
        alt={item.title || 'Imagem'}
        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ESem imagem%3C/text%3E%3C/svg%3E';
        }}
      />
      {item.title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <p className="text-white text-sm font-medium truncate">{item.title}</p>
        </div>
      )}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-black/60 backdrop-blur-sm rounded-full p-2">
          <i className="fa-solid fa-expand text-white text-xs"></i>
        </div>
      </div>
    </div>
  );

  const renderVideo = (item: MediaItem, index: number) => (
    <div key={index} className="relative rounded-lg overflow-hidden border border-border-color">
      <video 
        src={item.src} 
        controls 
        className="w-full max-h-96 bg-black"
        poster={item.thumbnail}
      >
        Seu navegador não suporta vídeo.
      </video>
      {item.title && (
        <div className="p-3 bg-bg-secondary">
          <p className="text-text-primary font-medium">{item.title}</p>
          {item.description && (
            <p className="text-text-secondary text-sm mt-1">{item.description}</p>
          )}
        </div>
      )}
    </div>
  );

  const renderLink = (item: MediaItem, index: number) => (
    <a
      key={index}
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-4 rounded-lg border border-border-color hover:border-blue-500 hover:bg-bg-tertiary transition-all group"
    >
      {item.thumbnail && (
        <img 
          src={item.thumbnail} 
          alt={item.title || 'Link'}
          className="w-20 h-20 object-cover rounded flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="text-text-primary font-medium group-hover:text-blue-400 transition-colors truncate">
          {item.title || item.url}
        </h4>
        {item.description && (
          <p className="text-text-secondary text-sm mt-1 line-clamp-2">{item.description}</p>
        )}
        <p className="text-text-tertiary text-xs mt-2 truncate flex items-center gap-1">
          <i className="fa-solid fa-link"></i>
          {item.url}
        </p>
      </div>
      <i className="fa-solid fa-arrow-up-right-from-square text-text-tertiary group-hover:text-blue-400 transition-colors"></i>
    </a>
  );

  const renderProduct = (item: MediaItem, index: number) => (
    <div 
      key={index}
      className="flex flex-col rounded-lg border border-border-color hover:border-green-500 hover:shadow-lg transition-all overflow-hidden bg-bg-secondary group"
    >
      {item.thumbnail && (
        <div className="relative overflow-hidden bg-bg-tertiary">
          <img 
            src={item.thumbnail} 
            alt={item.title || 'Produto'}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EProduto%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col">
        <h4 className="text-text-primary font-medium line-clamp-2 mb-2 group-hover:text-green-400 transition-colors">
          {item.title}
        </h4>
        {item.description && (
          <p className="text-text-secondary text-sm line-clamp-2 mb-3">{item.description}</p>
        )}
        <div className="mt-auto">
          {item.price && (
            <p className="text-green-400 text-xl font-bold mb-3">{item.price}</p>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
            >
              Ver Produto <i className="fa-solid fa-arrow-right ml-2"></i>
            </a>
          )}
        </div>
      </div>
    </div>
  );

  const renderItem = (item: MediaItem, index: number) => {
    switch (item.type) {
      case 'image':
        return renderImage(item, index);
      case 'video':
        return renderVideo(item, index);
      case 'link':
        return renderLink(item, index);
      case 'product':
        return renderProduct(item, index);
      default:
        return null;
    }
  };

  return (
    <>
      <div className={`
        ${layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : ''}
        ${layout === 'list' ? 'flex flex-col gap-3' : ''}
        ${layout === 'carousel' ? 'flex gap-4 overflow-x-auto pb-4' : ''}
        mt-4
      `}>
        {items.map((item, index) => renderItem(item, index))}
      </div>

      {/* Modal de visualização de imagem */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
          <img 
            src={selectedImage} 
            alt="Visualização"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default RichMediaRenderer;
