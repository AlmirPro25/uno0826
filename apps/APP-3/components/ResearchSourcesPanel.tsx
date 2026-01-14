/**
 * 🌐 RESEARCH SOURCES PANEL - Painel Avançado de Fontes de Pesquisa
 * 
 * Componente completo para visualizar todas as fontes de pesquisa,
 * com filtros, estatísticas e detalhes de cada resultado.
 * 
 * @version 2.0.0
 * @author Sistema de Pesquisa Cognitiva
 */

import React, { useState, useMemo } from 'react';
import type { ResearchContext } from '../services/AIResearchBrain';
import type { KnowledgePacket } from '../services/WebResearchEngine';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface ResearchSourcesPanelProps {
  researchContext: ResearchContext | null;
  isSearching?: boolean;
  onClose?: () => void;
  variant?: 'modal' | 'panel' | 'inline';
}

interface SourceStats {
  name: string;
  count: number;
  avgRelevance: number;
  icon: string;
  color: string;
}

// ============================================================================
// CONFIGURAÇÃO DE ÍCONES E CORES POR FONTE
// ============================================================================

const SOURCE_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  'Wikipedia': { icon: '📚', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  'DuckDuckGo': { icon: '🦆', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  'Hacker News': { icon: '🔶', color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  'DEV.to': { icon: '👩‍💻', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  'ArXiv': { icon: '📄', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  'GitHub': { icon: '🐙', color: 'text-gray-800 dark:text-gray-200', bgColor: 'bg-gray-100 dark:bg-gray-800' },
  'Stack Overflow': { icon: '📝', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  'MDN Web Docs': { icon: '🌐', color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  'default': { icon: '🔗', color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' }
};

const TYPE_CONFIG: Record<string, { icon: string; label: string }> = {
  'wiki': { icon: '📖', label: 'Wiki' },
  'documentation': { icon: '📚', label: 'Docs' },
  'tutorial': { icon: '🎓', label: 'Tutorial' },
  'news': { icon: '📰', label: 'Notícia' },
  'paper': { icon: '📄', label: 'Paper' },
  'code': { icon: '💻', label: 'Código' },
  'forum': { icon: '💬', label: 'Fórum' },
  'article': { icon: '📝', label: 'Artigo' }
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ResearchSourcesPanel: React.FC<ResearchSourcesPanelProps> = ({
  researchContext,
  isSearching = false,
  onClose,
  variant = 'panel'
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'sources' | 'stats'>('all');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [expandedPacket, setExpandedPacket] = useState<string | null>(null);

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (!researchContext) return null;

    const sourceStats: SourceStats[] = [];
    const sourceMap = new Map<string, KnowledgePacket[]>();

    researchContext.packets.forEach(packet => {
      const existing = sourceMap.get(packet.source) || [];
      existing.push(packet);
      sourceMap.set(packet.source, existing);
    });

    sourceMap.forEach((packets, source) => {
      const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.default;
      sourceStats.push({
        name: source,
        count: packets.length,
        avgRelevance: packets.reduce((sum, p) => sum + p.relevanceScore, 0) / packets.length,
        icon: config.icon,
        color: config.color
      });
    });

    return {
      totalResults: researchContext.packets.length,
      totalSources: researchContext.sources.length,
      avgRelevance: researchContext.packets.reduce((sum, p) => sum + p.relevanceScore, 0) / researchContext.packets.length,
      bySource: sourceStats.sort((a, b) => b.count - a.count),
      byType: Object.entries(
        researchContext.packets.reduce((acc, p) => {
          acc[p.type] = (acc[p.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      )
    };
  }, [researchContext]);

  // Filtrar pacotes
  const filteredPackets = useMemo(() => {
    if (!researchContext) return [];
    if (!selectedSource) return researchContext.packets;
    return researchContext.packets.filter(p => p.source === selectedSource);
  }, [researchContext, selectedSource]);

  // Loading state
  if (isSearching) {
    return (
      <div className={`${variant === 'modal' ? 'fixed inset-0 bg-black/50 flex items-center justify-center z-50' : ''}`}>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl max-w-md w-full mx-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-emerald-200 dark:border-emerald-800 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pesquisando na Internet...
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Consultando Wikipedia, ArXiv, GitHub, Stack Overflow e mais...
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              {['📚', '🐙', '📄', '📝', '🦆'].map((emoji, i) => (
                <span 
                  key={i} 
                  className="text-2xl animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!researchContext || researchContext.packets.length === 0) {
    return null;
  }

  const getSourceConfig = (source: string) => SOURCE_CONFIG[source] || SOURCE_CONFIG.default;
  const getTypeConfig = (type: string) => TYPE_CONFIG[type] || { icon: '📄', label: type };

  return (
    <div className={`
      ${variant === 'modal' ? 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' : ''}
      ${variant === 'panel' ? 'w-full' : ''}
    `}>
      <div className={`
        bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden
        ${variant === 'modal' ? 'max-w-4xl w-full max-h-[90vh] flex flex-col' : ''}
        ${variant === 'panel' ? 'border border-gray-200 dark:border-gray-700' : ''}
        ${variant === 'inline' ? 'border border-emerald-200 dark:border-emerald-800' : ''}
      `}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌐</span>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Fontes de Pesquisa
                </h2>
                <p className="text-emerald-100 text-sm">
                  {stats?.totalResults} resultados de {stats?.totalSources} fontes
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {[
              { id: 'all', label: 'Todos', icon: '📋' },
              { id: 'sources', label: 'Por Fonte', icon: '🏷️' },
              { id: 'stats', label: 'Estatísticas', icon: '📊' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${activeTab === tab.id 
                    ? 'bg-white text-emerald-600' 
                    : 'bg-white/20 text-white hover:bg-white/30'}
                `}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Tab: Todos os Resultados */}
          {activeTab === 'all' && (
            <div className="space-y-3">
              {/* Filtro por fonte */}
              {selectedSource && (
                <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">
                    Filtrando por: <strong>{selectedSource}</strong>
                  </span>
                  <button
                    onClick={() => setSelectedSource(null)}
                    className="ml-auto text-emerald-600 hover:text-emerald-700 text-sm"
                  >
                    Limpar filtro
                  </button>
                </div>
              )}

              {/* Lista de resultados */}
              {filteredPackets.map((packet, index) => {
                const sourceConfig = getSourceConfig(packet.source);
                const typeConfig = getTypeConfig(packet.type);
                const isExpanded = expandedPacket === packet.id;

                return (
                  <div
                    key={packet.id || index}
                    className={`
                      border rounded-lg overflow-hidden transition-all
                      ${isExpanded 
                        ? 'border-emerald-300 dark:border-emerald-700 shadow-lg' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800'}
                    `}
                  >
                    {/* Header do resultado */}
                    <button
                      onClick={() => setExpandedPacket(isExpanded ? null : packet.id)}
                      className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {/* Ícone da fonte */}
                        <div className={`
                          w-10 h-10 rounded-lg flex items-center justify-center text-xl
                          ${sourceConfig.bgColor}
                        `}>
                          {sourceConfig.icon}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {packet.title}
                            </h3>
                            <span className={`
                              px-2 py-0.5 text-xs rounded-full
                              ${sourceConfig.bgColor} ${sourceConfig.color}
                            `}>
                              {packet.source}
                            </span>
                            <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                              {typeConfig.icon} {typeConfig.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {packet.summary}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                            <span>📊 {(packet.relevanceScore * 100).toFixed(0)}% relevância</span>
                            {packet.metadata.author && (
                              <span>👤 {packet.metadata.author}</span>
                            )}
                            {packet.metadata.date && (
                              <span>📅 {new Date(packet.metadata.date).toLocaleDateString('pt-BR')}</span>
                            )}
                          </div>
                        </div>

                        {/* Seta de expansão */}
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Conteúdo expandido */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="pt-4 space-y-4">
                          {/* Conteúdo completo */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              📝 Conteúdo
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                              {packet.content.slice(0, 1000)}
                              {packet.content.length > 1000 && '...'}
                            </p>
                          </div>

                          {/* Blocos de código */}
                          {packet.codeBlocks.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                💻 Código Encontrado
                              </h4>
                              {packet.codeBlocks.slice(0, 2).map((code, i) => (
                                <pre
                                  key={i}
                                  className="p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto mb-2"
                                >
                                  {code.slice(0, 500)}
                                </pre>
                              ))}
                            </div>
                          )}

                          {/* Link para fonte */}
                          {packet.url && (
                            <a
                              href={packet.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Abrir Fonte Original
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab: Por Fonte */}
          {activeTab === 'sources' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.bySource.map(source => {
                const config = getSourceConfig(source.name);
                return (
                  <button
                    key={source.name}
                    onClick={() => {
                      setSelectedSource(source.name);
                      setActiveTab('all');
                    }}
                    className={`
                      p-4 rounded-xl border-2 text-left transition-all hover:shadow-lg
                      ${config.bgColor} border-transparent hover:border-emerald-300
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{config.icon}</span>
                      <div>
                        <h3 className={`font-bold ${config.color}`}>
                          {source.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {source.count} resultado{source.count > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Relevância média</span>
                        <span>{(source.avgRelevance * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${source.avgRelevance * 100}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab: Estatísticas */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              {/* Cards de resumo */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
                  <div className="text-3xl font-bold text-emerald-600">{stats.totalResults}</div>
                  <div className="text-sm text-emerald-700 dark:text-emerald-300">Resultados</div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.totalSources}</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Fontes</div>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {(stats.avgRelevance * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">Relevância</div>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
                  <div className="text-3xl font-bold text-amber-600">{stats.byType.length}</div>
                  <div className="text-sm text-amber-700 dark:text-amber-300">Tipos</div>
                </div>
              </div>

              {/* Distribuição por tipo */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  📊 Distribuição por Tipo
                </h3>
                <div className="space-y-3">
                  {stats.byType.map(([type, count]) => {
                    const typeConfig = getTypeConfig(type);
                    const percentage = (count / stats.totalResults) * 100;
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700 dark:text-gray-300">
                            {typeConfig.icon} {typeConfig.label}
                          </span>
                          <span className="text-gray-500">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* APIs utilizadas */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  🔌 APIs Consultadas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['Wikipedia', 'DuckDuckGo', 'Hacker News', 'DEV.to', 'ArXiv', 'GitHub', 'Stack Overflow'].map(api => {
                    const isUsed = researchContext?.sources.includes(api);
                    const config = getSourceConfig(api);
                    return (
                      <div
                        key={api}
                        className={`
                          px-3 py-2 rounded-lg flex items-center gap-2 text-sm
                          ${isUsed 
                            ? `${config.bgColor} ${config.color}` 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}
                        `}
                      >
                        <span>{config.icon}</span>
                        <span>{api}</span>
                        {isUsed && <span className="text-emerald-500">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Pesquisa realizada em: {new Date(researchContext?.timestamp || '').toLocaleString('pt-BR')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearchSourcesPanel;
