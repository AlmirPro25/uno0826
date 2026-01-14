/**
 * 🖼️ SEARCH RESULTS WITH IMAGES
 * Componente para exibir resultados de busca com imagens no chat
 */

import React from 'react';

interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
  image?: string;
  source: string;
}

interface SearchResultsWithImagesProps {
  results: SearchResult[];
  query: string;
}

export const SearchResultsWithImages: React.FC<SearchResultsWithImagesProps> = ({ results, query }) => {
  if (results.length === 0) return null;

  return (
    <div className="space-y-3 my-4">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        🔍 Resultados para "{query}"
      </div>
      
      {results.map((result, index) => (
        <a
          key={index}
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block group bg-gray-50 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
        >
          <div className="flex gap-3">
            {/* Imagem */}
            {result.image && (
              <div className="flex-shrink-0">
                <img
                  src={result.image}
                  alt={result.title}
                  className="w-24 h-24 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              {/* Título */}
              <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:underline line-clamp-2 mb-1">
                {result.title}
              </h3>
              
              {/* Fonte */}
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                🌐 {result.source}
              </div>
              
              {/* Snippet */}
              {result.snippet && (
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                  {result.snippet}
                </p>
              )}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
};

export default SearchResultsWithImages;
