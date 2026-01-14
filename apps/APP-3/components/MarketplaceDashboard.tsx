/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    MARKETPLACE DASHBOARD - Analytics View                     ║
 * ║                                                                               ║
 * ║              Visualização de métricas e estatísticas do marketplace          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect } from 'react';
import {
  Package,
  TrendingUp,
  DollarSign,
  Users,
  Download,
  Eye,
  Star,
  Database,
  Brain,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { starterKitService, type MarketplaceStats } from '@/services/StarterKitService';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface DashboardProps {
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export const MarketplaceDashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [classifierStats, setClassifierStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // CARREGAR DADOS
  // ═══════════════════════════════════════════════════════════════════════════

  const loadStats = async () => {
    setLoading(true);
    try {
      const [marketStats, classStats] = await Promise.all([
        starterKitService.getStats(),
        starterKitService.getClassifierStats(),
      ]);
      setStats(marketStats);
      setClassifierStats(classStats);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    // Auto-refresh a cada 5 minutos
    const interval = setInterval(loadStats, 300000);
    return () => clearInterval(interval);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  if (loading && !stats) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Marketplace Dashboard</h2>
            <p className="text-sm text-gray-400">
              {lastUpdate && `Atualizado: ${lastUpdate.toLocaleTimeString()}`}
            </p>
          </div>
        </div>
        
        <button
          onClick={loadStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 
                   rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={<Package className="w-5 h-5" />}
          label="Total de Kits"
          value={stats?.total_kits || 0}
          color="purple"
        />
        <KPICard
          icon={<Eye className="w-5 h-5" />}
          label="Kits Públicos"
          value={stats?.public_kits || 0}
          color="blue"
        />
        <KPICard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Qualidade Média"
          value={`${(stats?.avg_quality || 0).toFixed(0)}%`}
          color="green"
        />
        <KPICard
          icon={<Database className="w-5 h-5" />}
          label="Amostras Training"
          value={stats?.training_samples || 0}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categorias */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-400" />
            Kits por Categoria
          </h3>
          
          {stats?.by_category && Object.keys(stats.by_category).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.by_category)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([category, count]) => (
                  <CategoryBar
                    key={category}
                    category={category}
                    count={count}
                    total={stats.total_kits}
                  />
                ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Nenhum kit ainda
            </div>
          )}
        </div>

        {/* Classifier Stats */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Classificador
          </h3>
          
          <div className="space-y-4">
            <StatItem
              label="Total Classificados"
              value={classifierStats?.total_classified as number || 0}
            />
            <StatItem
              label="Qualidade Média"
              value={`${((classifierStats?.avg_quality as number) || 0).toFixed(1)}%`}
            />
            <StatItem
              label="Regras Ativas"
              value={classifierStats?.rules_count as number || 0}
            />
            
            <div className="pt-4 border-t border-gray-700">
              <h4 className="text-sm text-gray-400 mb-2">Distribuição de Grades</h4>
              <div className="flex gap-2">
                {['A', 'B', 'C', 'D', 'F'].map(grade => (
                  <GradeBadge key={grade} grade={grade} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-6 border border-purple-500/30">
        <h3 className="text-lg font-bold text-white mb-2">💰 Valor Gerado</h3>
        <p className="text-gray-300 mb-4">
          Cada Starter Kit representa horas de desenvolvimento economizadas.
        </p>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              ~{((stats?.total_kits || 0) * 8).toLocaleString()}h
            </div>
            <div className="text-sm text-gray-400">Horas economizadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              ${((stats?.total_kits || 0) * 150).toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Valor estimado</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {stats?.training_samples || 0}
            </div>
            <div className="text-sm text-gray-400">Dados para AI</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ═══════════════════════════════════════════════════════════════════════════════

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: 'purple' | 'blue' | 'green' | 'orange';
}

const KPICard: React.FC<KPICardProps> = ({ icon, label, value, color }) => {
  const colors = {
    purple: 'bg-purple-600/20 text-purple-400 border-purple-500/30',
    blue: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
    green: 'bg-green-600/20 text-green-400 border-green-500/30',
    orange: 'bg-orange-600/20 text-orange-400 border-orange-500/30',
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
};

interface CategoryBarProps {
  category: string;
  count: number;
  total: number;
}

const CategoryBar: React.FC<CategoryBarProps> = ({ category, count, total }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300 capitalize">{category || 'general'}</span>
        <span className="text-gray-400">{count} ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface StatItemProps {
  label: string;
  value: number | string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-400">{label}</span>
    <span className="text-white font-medium">{value}</span>
  </div>
);

interface GradeBadgeProps {
  grade: string;
}

const GradeBadge: React.FC<GradeBadgeProps> = ({ grade }) => {
  const colors: Record<string, string> = {
    A: 'bg-green-500',
    B: 'bg-blue-500',
    C: 'bg-yellow-500',
    D: 'bg-orange-500',
    F: 'bg-red-500',
  };

  return (
    <div className={`w-8 h-8 ${colors[grade]} rounded flex items-center justify-center 
                    text-sm font-bold text-white`}>
      {grade}
    </div>
  );
};

export default MarketplaceDashboard;
