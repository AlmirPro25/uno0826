/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    STARTER KIT MARKETPLACE - UI Component                     ║
 * ║                                                                               ║
 * ║              "Vendemos atalhos cognitivos, não templates"                    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Star,
  Download,
  Eye,
  Clock,
  Code,
  Shield,
  Accessibility,
  Zap,
  TrendingUp,
  Filter,
  Search,
  Grid,
  List,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  starterKitService,
  type StarterKit,
  type MarketplaceStats,
} from '@/services/StarterKitService';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface StarterKitMarketplaceProps {
  onSelectKit?: (kit: StarterKit) => void;
  showMyKits?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'recent' | 'quality' | 'downloads' | 'price';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export const StarterKitMarketplace: React.FC<StarterKitMarketplaceProps> = ({
  onSelectKit,
  showMyKits = false,
}) => {
  // Estado
  const [kits, setKits] = useState<StarterKit[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Paginação
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 12;

  // ═══════════════════════════════════════════════════════════════════════════
  // CARREGAR DADOS
  // ═══════════════════════════════════════════════════════════════════════════

  const loadKits = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const offset = reset ? 0 : (page - 1) * ITEMS_PER_PAGE;
      
      const newKits = showMyKits
        ? await starterKitService.listMyKits(ITEMS_PER_PAGE, offset)
        : await starterKitService.listPublicKits({
            limit: ITEMS_PER_PAGE,
            offset,
            category: selectedCategory || undefined,
          });

      if (reset) {
        setKits(newKits);
      } else {
        setKits(prev => [...prev, ...newKits]);
      }

      setHasMore(newKits.length === ITEMS_PER_PAGE);
    } catch (err) {
      setError('Erro ao carregar Starter Kits');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, showMyKits]);

  const loadStats = useCallback(async () => {
    const data = await starterKitService.getStats();
    setStats(data);
  }, []);

  useEffect(() => {
    loadKits(true);
    loadStats();
  }, [selectedCategory, showMyKits]);

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTRAR E ORDENAR
  // ═══════════════════════════════════════════════════════════════════════════

  const filteredKits = kits
    .filter(kit => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        kit.prompt.toLowerCase().includes(query) ||
        kit.metadata.category.toLowerCase().includes(query) ||
        kit.metadata.tags?.some(t => t.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'quality':
          return b.classification.quality_score - a.classification.quality_score;
        case 'downloads':
          return b.marketplace_status.downloads - a.marketplace_status.downloads;
        case 'price':
          return a.marketplace_status.price_usd - b.marketplace_status.price_usd;
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold">
              {showMyKits ? 'Meus Starter Kits' : 'Marketplace'}
            </h2>
          </div>
          
          {stats && (
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{stats.total_kits} kits</span>
              <span>{stats.public_kits} públicos</span>
              <span>Qualidade média: {stats.avg_quality.toFixed(0)}%</span>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          {/* Busca */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar kits..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                       focus:outline-none focus:border-purple-500 text-sm"
            />
          </div>

          {/* Categoria */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm
                     focus:outline-none focus:border-purple-500"
          >
            <option value="">Todas categorias</option>
            {stats?.by_category && Object.entries(stats.by_category).map(([cat, count]) => (
              <option key={cat} value={cat}>
                {cat} ({count})
              </option>
            ))}
          </select>

          {/* Ordenação */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm
                     focus:outline-none focus:border-purple-500"
          >
            <option value="recent">Mais recentes</option>
            <option value="quality">Maior qualidade</option>
            <option value="downloads">Mais baixados</option>
            <option value="price">Menor preço</option>
          </select>

          {/* View Mode */}
          <div className="flex border border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-purple-600' : 'bg-gray-800'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-purple-600' : 'bg-gray-800'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading && kits.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-400">
            <AlertCircle className="w-12 h-12 mb-2" />
            <p>{error}</p>
          </div>
        ) : filteredKits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Package className="w-12 h-12 mb-2" />
            <p>Nenhum Starter Kit encontrado</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'flex flex-col gap-3'
          }>
            {filteredKits.map(kit => (
              <StarterKitCard
                key={kit.id}
                kit={kit}
                viewMode={viewMode}
                onSelect={() => onSelectKit?.(kit)}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && !loading && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => {
                setPage(p => p + 1);
                loadKits();
              }}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Carregar mais
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CARD DO STARTER KIT
// ═══════════════════════════════════════════════════════════════════════════════

interface StarterKitCardProps {
  kit: StarterKit;
  viewMode: ViewMode;
  onSelect: () => void;
}

const StarterKitCard: React.FC<StarterKitCardProps> = ({ kit, viewMode, onSelect }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(kit.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const gradeColors: Record<string, string> = {
    A: 'bg-green-500',
    B: 'bg-blue-500',
    C: 'bg-yellow-500',
    D: 'bg-orange-500',
    F: 'bg-red-500',
  };

  const complexityColors: Record<string, string> = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    enterprise: 'text-red-400',
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={onSelect}
        className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700
                 hover:border-purple-500 cursor-pointer transition-colors"
      >
        {/* Grade Badge */}
        <div className={`w-12 h-12 ${gradeColors[kit.classification.grade]} rounded-lg
                       flex items-center justify-center text-xl font-bold`}>
          {kit.classification.grade}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{kit.prompt.slice(0, 60)}...</h3>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Code className="w-3 h-3" />
              {kit.metadata.category}
            </span>
            <span className={`flex items-center gap-1 ${complexityColors[kit.metadata.complexity]}`}>
              <Zap className="w-3 h-3" />
              {kit.metadata.complexity}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ~{kit.metadata.estimated_hours}h economizadas
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {kit.marketplace_status.views}
          </span>
          <span className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            {kit.marketplace_status.downloads}
          </span>
        </div>

        {/* Price */}
        <div className="text-right">
          {kit.marketplace_status.price_usd > 0 ? (
            <span className="text-lg font-bold text-green-400">
              ${kit.marketplace_status.price_usd.toFixed(0)}
            </span>
          ) : (
            <span className="text-lg font-bold text-purple-400">Grátis</span>
          )}
        </div>

        {/* Actions */}
        <button
          onClick={handleCopy}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>
    );
  }

  // Grid View
  return (
    <div
      onClick={onSelect}
      className="flex flex-col bg-gray-800 rounded-lg border border-gray-700
               hover:border-purple-500 cursor-pointer transition-colors overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-start justify-between mb-2">
          <div className={`px-2 py-1 ${gradeColors[kit.classification.grade]} rounded text-sm font-bold`}>
            Grade {kit.classification.grade}
          </div>
          {kit.marketplace_status.is_featured && (
            <div className="flex items-center gap-1 text-yellow-400 text-sm">
              <Sparkles className="w-4 h-4" />
              Featured
            </div>
          )}
        </div>
        <h3 className="font-medium line-clamp-2">{kit.prompt}</h3>
      </div>

      {/* Scores */}
      <div className="p-4 grid grid-cols-2 gap-2 text-sm">
        <ScoreBar
          icon={<Code className="w-4 h-4" />}
          label="Qualidade"
          value={kit.classification.quality_score}
        />
        <ScoreBar
          icon={<Shield className="w-4 h-4" />}
          label="Segurança"
          value={kit.classification.security_score}
        />
        <ScoreBar
          icon={<Accessibility className="w-4 h-4" />}
          label="Acessibilidade"
          value={kit.classification.accessibility_score}
        />
        <ScoreBar
          icon={<Zap className="w-4 h-4" />}
          label="Performance"
          value={kit.classification.performance_score}
        />
      </div>

      {/* Meta */}
      <div className="px-4 pb-2 flex flex-wrap gap-2">
        <span className="px-2 py-1 bg-gray-700 rounded text-xs">
          {kit.metadata.category}
        </span>
        <span className={`px-2 py-1 bg-gray-700 rounded text-xs ${complexityColors[kit.metadata.complexity]}`}>
          {kit.metadata.complexity}
        </span>
        <span className="px-2 py-1 bg-gray-700 rounded text-xs">
          ~{kit.metadata.estimated_hours}h
        </span>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {kit.marketplace_status.views}
          </span>
          <span className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            {kit.marketplace_status.downloads}
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            {kit.marketplace_status.stars}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {kit.marketplace_status.price_usd > 0 ? (
            <span className="text-lg font-bold text-green-400">
              ${kit.marketplace_status.price_usd.toFixed(0)}
            </span>
          ) : (
            <span className="font-bold text-purple-400">Grátis</span>
          )}
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCORE BAR
// ═══════════════════════════════════════════════════════════════════════════════

interface ScoreBarProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ icon, label, value }) => {
  const getColor = (v: number) => {
    if (v >= 80) return 'bg-green-500';
    if (v >= 60) return 'bg-yellow-500';
    if (v >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">{label}</span>
          <span>{value}%</span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getColor(value)} transition-all`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default StarterKitMarketplace;
