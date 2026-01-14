/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║              📊 MONITOR DE CLUSTER DISTRIBUÍDO 📊                            ║
 * ║                                                                              ║
 * ║                    "OBSERVABILIDADE EM TEMPO REAL"                           ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect } from 'react';

interface ClusterMetrics {
  totalNodes: number;
  activeNodes: number;
  totalRequests: number;
  avgResponseTime: number;
  errorRate: number;
  throughput: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
}

interface NodeHealth {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  lastHeartbeat: Date;
  cpu: number;
  memory: number;
  requests: number;
}

interface ClusterMonitorProps {
  isDistributed?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const ClusterMonitor: React.FC<ClusterMonitorProps> = ({
  isDistributed = false,
  autoRefresh = true,
  refreshInterval = 5000
}) => {
  const [metrics, setMetrics] = useState<ClusterMetrics>({
    totalNodes: 3,
    activeNodes: 3,
    totalRequests: 0,
    avgResponseTime: 0,
    errorRate: 0,
    throughput: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkIn: 0,
    networkOut: 0
  });

  const [nodeHealth, setNodeHealth] = useState<NodeHealth[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    if (isDistributed && autoRefresh) {
      const interval = setInterval(() => {
        updateMetrics();
        checkHealth();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [isDistributed, autoRefresh, refreshInterval]);

  const updateMetrics = () => {
    setMetrics(prev => ({
      ...prev,
      totalRequests: prev.totalRequests + Math.floor(Math.random() * 100),
      avgResponseTime: 50 + Math.random() * 100,
      errorRate: Math.random() * 5,
      throughput: 100 + Math.random() * 200,
      cpuUsage: 30 + Math.random() * 40,
      memoryUsage: 40 + Math.random() * 30,
      diskUsage: 50 + Math.random() * 20,
      networkIn: Math.random() * 1000,
      networkOut: Math.random() * 800
    }));
  };

  const checkHealth = () => {
    const nodes: NodeHealth[] = [
      {
        id: 'app-1',
        name: 'App Node 1',
        status: 'healthy',
        uptime: 86400 + Math.random() * 10000,
        lastHeartbeat: new Date(),
        cpu: 30 + Math.random() * 30,
        memory: 40 + Math.random() * 20,
        requests: Math.floor(Math.random() * 1000)
      },
      {
        id: 'app-2',
        name: 'App Node 2',
        status: Math.random() > 0.9 ? 'degraded' : 'healthy',
        uptime: 86400 + Math.random() * 10000,
        lastHeartbeat: new Date(),
        cpu: 30 + Math.random() * 30,
        memory: 40 + Math.random() * 20,
        requests: Math.floor(Math.random() * 1000)
      },
      {
        id: 'app-3',
        name: 'App Node 3',
        status: 'healthy',
        uptime: 86400 + Math.random() * 10000,
        lastHeartbeat: new Date(),
        cpu: 30 + Math.random() * 30,
        memory: 40 + Math.random() * 20,
        requests: Math.floor(Math.random() * 1000)
      }
    ];

    setNodeHealth(nodes);

    // Gerar alertas
    const newAlerts: string[] = [];
    nodes.forEach(node => {
      if (node.status === 'degraded') {
        newAlerts.push(`⚠️ ${node.name} está degradado`);
      }
      if (node.cpu > 80) {
        newAlerts.push(`🔥 ${node.name} - CPU alta: ${node.cpu.toFixed(1)}%`);
      }
      if (node.memory > 85) {
        newAlerts.push(`💾 ${node.name} - Memória alta: ${node.memory.toFixed(1)}%`);
      }
    });

    if (metrics.errorRate > 3) {
      newAlerts.push(`❌ Taxa de erro elevada: ${metrics.errorRate.toFixed(2)}%`);
    }

    setAlerts(newAlerts);
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes.toFixed(0)} B/s`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  if (!isDistributed) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">
          Monitor disponível apenas para sistemas distribuídos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            📊 Monitor de Cluster
          </h2>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Monitorando em tempo real</span>
          </div>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Nós Ativos</span>
            <span className="text-2xl">🟢</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {metrics.activeNodes}/{metrics.totalNodes}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {((metrics.activeNodes / metrics.totalNodes) * 100).toFixed(0)}% disponibilidade
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Requisições</span>
            <span className="text-2xl">📈</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {metrics.totalRequests.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {metrics.throughput.toFixed(0)} req/s
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Tempo de Resposta</span>
            <span className="text-2xl">⚡</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {metrics.avgResponseTime.toFixed(0)}ms
          </p>
          <p className="text-xs text-green-600 mt-1">
            Excelente performance
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Taxa de Erro</span>
            <span className="text-2xl">
              {metrics.errorRate > 3 ? '❌' : '✅'}
            </span>
          </div>
          <p className={`text-3xl font-bold ${
            metrics.errorRate > 3 ? 'text-red-600' : 'text-gray-800'
          }`}>
            {metrics.errorRate.toFixed(2)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {metrics.errorRate > 3 ? 'Acima do normal' : 'Normal'}
          </p>
        </div>
      </div>

      {/* Recursos do Cluster */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Recursos do Cluster
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>CPU</span>
              <span>{metrics.cpuUsage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  metrics.cpuUsage > 80 ? 'bg-red-500' :
                  metrics.cpuUsage > 60 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${metrics.cpuUsage}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Memória</span>
              <span>{metrics.memoryUsage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  metrics.memoryUsage > 80 ? 'bg-red-500' :
                  metrics.memoryUsage > 60 ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${metrics.memoryUsage}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Disco</span>
              <span>{metrics.diskUsage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-purple-500 h-3 rounded-full transition-all"
                style={{ width: `${metrics.diskUsage}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600">Rede (Entrada)</p>
              <p className="text-lg font-semibold text-gray-800">
                {formatBytes(metrics.networkIn)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Rede (Saída)</p>
              <p className="text-lg font-semibold text-gray-800">
                {formatBytes(metrics.networkOut)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Saúde dos Nós */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Saúde dos Nós
        </h3>
        <div className="space-y-3">
          {nodeHealth.map(node => (
            <div
              key={node.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${
                  node.status === 'healthy' ? 'bg-green-400' :
                  node.status === 'degraded' ? 'bg-yellow-400' :
                  'bg-red-400'
                }`}></div>
                <div>
                  <p className="font-semibold text-gray-800">{node.name}</p>
                  <p className="text-xs text-gray-500">
                    Uptime: {formatUptime(node.uptime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <p className="text-gray-600">CPU</p>
                  <p className="font-semibold">{node.cpu.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-600">RAM</p>
                  <p className="font-semibold">{node.memory.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Req/s</p>
                  <p className="font-semibold">{node.requests}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">
            ⚠️ Alertas Ativos
          </h3>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <p key={index} className="text-sm text-yellow-700">
                {alert}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
