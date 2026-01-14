import React, { useState, useEffect } from 'react';

interface MetricData {
  timestamp: number;
  modelType: string;
  dataset: string;
  generationTime: number;
  codeLines: number;
  complexity: 'low' | 'medium' | 'high';
  hasUI: boolean;
  hasJS: boolean;
}

interface PerformanceMetricsProps {
  onClose: () => void;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ onClose }) => {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  useEffect(() => {
    const savedMetrics = localStorage.getItem('ai-creator-metrics');
    if (savedMetrics) {
      setMetrics(JSON.parse(savedMetrics));
    }
  }, []);

  const filterMetricsByTime = (metrics: MetricData[]) => {
    const now = Date.now();
    const ranges = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity
    };
    
    return metrics.filter(m => now - m.timestamp <= ranges[timeRange]);
  };

  const filteredMetrics = filterMetricsByTime(metrics);

  const stats = {
    totalProjects: filteredMetrics.length,
    avgGenerationTime: filteredMetrics.length > 0 
      ? Math.round(filteredMetrics.reduce((sum, m) => sum + m.generationTime, 0) / filteredMetrics.length)
      : 0,
    mostUsedDataset: filteredMetrics.length > 0
      ? filteredMetrics.reduce((acc, m) => {
          acc[m.dataset] = (acc[m.dataset] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      : {},
    complexityDistribution: filteredMetrics.reduce((acc, m) => {
      acc[m.complexity] = (acc[m.complexity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    uiGenerationRate: filteredMetrics.length > 0
      ? Math.round((filteredMetrics.filter(m => m.hasUI).length / filteredMetrics.length) * 100)
      : 0,
    jsGenerationRate: filteredMetrics.length > 0
      ? Math.round((filteredMetrics.filter(m => m.hasJS).length / filteredMetrics.length) * 100)
      : 0
  };

  const mostUsedDataset = Object.entries(stats.mostUsedDataset)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Métricas de Performance</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {(['7d', '30d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range === '7d' ? 'Últimos 7 dias' : range === '30d' ? 'Últimos 30 dias' : 'Todos'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Total de Projetos</h3>
            <p className="text-2xl font-bold text-white">{stats.totalProjects}</p>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Tempo Médio de Geração</h3>
            <p className="text-2xl font-bold text-white">{formatTime(stats.avgGenerationTime)}</p>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Dataset Mais Usado</h3>
            <p className="text-2xl font-bold text-white">{mostUsedDataset}</p>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Taxa de Geração UI</h3>
            <p className="text-2xl font-bold text-white">{stats.uiGenerationRate}%</p>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Taxa de Geração JS</h3>
            <p className="text-2xl font-bold text-white">{stats.jsGenerationRate}%</p>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Projetos Complexos</h3>
            <p className="text-2xl font-bold text-white">{stats.complexityDistribution.high || 0}</p>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Distribuição de Complexidade</h3>
          <div className="space-y-2">
            {Object.entries(stats.complexityDistribution).map(([complexity, count]) => {
              const percentage = stats.totalProjects > 0 ? (count / stats.totalProjects) * 100 : 0;
              const colors = {
                low: 'bg-green-500',
                medium: 'bg-yellow-500',
                high: 'bg-red-500'
              };
              
              return (
                <div key={complexity} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-gray-400 capitalize">{complexity}</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${colors[complexity as keyof typeof colors]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-300">{count} ({percentage.toFixed(1)}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {filteredMetrics.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            Nenhuma métrica disponível para o período selecionado
          </div>
        )}
      </div>
    </div>
  );
};

// Função utilitária para registrar métricas
export const recordMetric = (
  modelType: string,
  dataset: string,
  generationTime: number,
  codeLines: number,
  hasUI: boolean,
  hasJS: boolean
) => {
  const complexity: 'low' | 'medium' | 'high' = 
    codeLines < 100 ? 'low' : 
    codeLines < 300 ? 'medium' : 'high';

  const metric: MetricData = {
    timestamp: Date.now(),
    modelType,
    dataset,
    generationTime,
    codeLines,
    complexity,
    hasUI,
    hasJS
  };

  const savedMetrics = localStorage.getItem('ai-creator-metrics');
  const metrics: MetricData[] = savedMetrics ? JSON.parse(savedMetrics) : [];
  
  // Manter apenas os últimos 1000 registros
  const updatedMetrics = [metric, ...metrics].slice(0, 1000);
  
  localStorage.setItem('ai-creator-metrics', JSON.stringify(updatedMetrics));
};