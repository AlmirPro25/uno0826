/**
 * 🌐 WEB RESEARCH INDICATOR
 * 
 * Componente que mostra quando a pesquisa web foi usada
 * e quais fontes foram consultadas
 */

import React, { useState } from 'react';
import type { ResearchContext } from '../services/AIResearchBrain';

interface WebResearchIndicatorProps {
  researchContext: ResearchContext | null;
  isSearching?: boolean;
}

export const WebResearchIndicator: React.FC<WebResearchIndicatorProps> = ({
  researchContext,
  isSearching = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Se está pesquisando, mostrar indicador de loading
  if (isSearching) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
        <span className="text-sm text-blue-700 dark:text-blue-300">
          Pesquisando na internet...
        </span>
      </div>
    );
  }

  // Se não tem contexto de pesquisa, não mostrar nada
  if (!researchContext || researchContext.packets.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 overflow-hidden">
      {/* Header clicável */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-100/50 dark:hover:bg-emerald-800/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🌐</span>
          <span className="font-medium text-emerald-800 dark:text-emerald-200">
            Pesquisa Web
          </span>
          <span className="text-sm text-emerald-600 dark:text-emerald-400">
            ({researchContext.packets.length} resultados de {researchContext.sources.length} fontes)
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-emerald-600 dark:text-emerald-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Conteúdo expandido */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Fontes */}
          <div className="flex flex-wrap gap-2">
            {researchContext.sources.map((source, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-full"
              >
                {source}
              </span>
            ))}
          </div>

          {/* Resultados */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {researchContext.packets.slice(0, 5).map((packet, index) => (
              <div
                key={index}
                className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-emerald-100 dark:border-emerald-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {packet.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {packet.source} • {packet.type}
                    </p>
                  </div>
                  {packet.url && (
                    <a
                      href={packet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                      title="Abrir fonte"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {packet.summary}
                </p>
              </div>
            ))}
          </div>

          {/* Timestamp */}
          <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
            Pesquisado em: {new Date(researchContext.timestamp).toLocaleString('pt-BR')}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Badge simples para indicar que pesquisa foi usada
 */
export const WebResearchBadge: React.FC<{ sources: string[] }> = ({ sources }) => {
  if (sources.length === 0) return null;

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs">
      <span>🌐</span>
      <span>{sources.length} fonte{sources.length > 1 ? 's' : ''}</span>
    </div>
  );
};

export default WebResearchIndicator;
