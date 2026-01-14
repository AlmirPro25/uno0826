/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║              🏗️ VISUALIZADOR DE ARQUITETURA DISTRIBUÍDA 🏗️                  ║
 * ║                                                                              ║
 * ║                    "VER A ARQUITETURA EM TEMPO REAL"                         ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect } from 'react';
import type { ArchitectureBlueprint } from '../../aurora-build/core/AuroraBuilder';

interface Node {
  id: string;
  name: string;
  type: 'app' | 'database' | 'loadbalancer' | 'cache' | 'queue';
  status: 'running' | 'stopped' | 'error';
  cpu: number;
  memory: number;
  connections: string[];
}

interface ArchitectureVisualizerProps {
  blueprint?: ArchitectureBlueprint;
  isDistributed?: boolean;
}

export const ArchitectureVisualizer: React.FC<ArchitectureVisualizerProps> = ({
  blueprint,
  isDistributed = false
}) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    if (blueprint && isDistributed) {
      generateNodesFromBlueprint(blueprint);
    }
  }, [blueprint, isDistributed]);

  const generateNodesFromBlueprint = (bp: ArchitectureBlueprint) => {
    const generatedNodes: Node[] = [];

    // Gerar nós de aplicação
    for (let i = 1; i <= 3; i++) {
      generatedNodes.push({
        id: `app-${i}`,
        name: `App Node ${i}`,
        type: 'app',
        status: 'running',
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        connections: [`db-${i}`, 'lb-1']
      });
    }

    // Gerar nós de banco de dados
    if (bp.architecture.backend?.database) {
      for (let i = 1; i <= 3; i++) {
        generatedNodes.push({
          id: `db-${i}`,
          name: `${bp.architecture.backend.database} ${i}`,
          type: 'database',
          status: 'running',
          cpu: Math.random() * 100,
          memory: Math.random() * 100,
          connections: i === 1 ? [] : [`db-1`]
        });
      }
    }

    // Gerar load balancer
    generatedNodes.push({
      id: 'lb-1',
      name: 'Load Balancer',
      type: 'loadbalancer',
      status: 'running',
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      connections: ['app-1', 'app-2', 'app-3']
    });

    setNodes(generatedNodes);
  };

  const getNodeColor = (type: Node['type']) => {
    switch (type) {
      case 'app': return 'bg-blue-500';
      case 'database': return 'bg-green-500';
      case 'loadbalancer': return 'bg-purple-500';
      case 'cache': return 'bg-orange-500';
      case 'queue': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getNodeIcon = (type: Node['type']) => {
    switch (type) {
      case 'app': return '🚀';
      case 'database': return '🗄️';
      case 'loadbalancer': return '⚖️';
      case 'cache': return '⚡';
      case 'queue': return '📬';
      default: return '📦';
    }
  };

  const getStatusColor = (status: Node['status']) => {
    switch (status) {
      case 'running': return 'bg-green-400';
      case 'stopped': return 'bg-gray-400';
      case 'error': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  if (!isDistributed || !blueprint) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">
          Visualizador disponível apenas para sistemas distribuídos
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          🏗️ Arquitetura Distribuída
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">{nodes.filter(n => n.status === 'running').length} nós ativos</span>
          </div>
        </div>
      </div>

      {/* Grid de Nós */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {nodes.map(node => (
          <div
            key={node.id}
            onClick={() => setSelectedNode(node)}
            className={`
              relative p-4 rounded-lg border-2 cursor-pointer transition-all
              ${selectedNode?.id === node.id ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}
            `}
          >
            {/* Status Indicator */}
            <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getStatusColor(node.status)}`}></div>

            {/* Node Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 ${getNodeColor(node.type)} rounded-lg flex items-center justify-center text-2xl`}>
                {getNodeIcon(node.type)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{node.name}</h3>
                <p className="text-xs text-gray-500">{node.id}</p>
              </div>
            </div>

            {/* Métricas */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>CPU</span>
                  <span>{node.cpu.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${node.cpu}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Memória</span>
                  <span>{node.memory.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${node.memory}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Conexões */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                {node.connections.length} conexões
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Detalhes do Nó Selecionado */}
      {selectedNode && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">
            Detalhes: {selectedNode.name}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">ID:</p>
              <p className="font-mono text-gray-800">{selectedNode.id}</p>
            </div>
            <div>
              <p className="text-gray-600">Tipo:</p>
              <p className="font-semibold text-gray-800">{selectedNode.type}</p>
            </div>
            <div>
              <p className="text-gray-600">Status:</p>
              <p className={`font-semibold ${
                selectedNode.status === 'running' ? 'text-green-600' :
                selectedNode.status === 'error' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {selectedNode.status}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Conexões:</p>
              <p className="font-semibold text-gray-800">{selectedNode.connections.length}</p>
            </div>
          </div>

          {selectedNode.connections.length > 0 && (
            <div className="mt-4">
              <p className="text-gray-600 text-sm mb-2">Conectado a:</p>
              <div className="flex flex-wrap gap-2">
                {selectedNode.connections.map(connId => (
                  <span
                    key={connId}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono"
                  >
                    {connId}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legenda */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Legenda</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">🚀</div>
            <span className="text-xs text-gray-600">Aplicação</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">🗄️</div>
            <span className="text-xs text-gray-600">Banco de Dados</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center">⚖️</div>
            <span className="text-xs text-gray-600">Load Balancer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-xs text-gray-600">Ativo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span className="text-xs text-gray-600">Erro</span>
          </div>
        </div>
      </div>
    </div>
  );
};
