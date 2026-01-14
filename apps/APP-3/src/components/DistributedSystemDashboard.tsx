/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║              🌐 DASHBOARD DE SISTEMA DISTRIBUÍDO 🌐                          ║
 * ║                                                                              ║
 * ║         "VISUALIZAÇÃO + MONITORAMENTO EM UM SÓ LUGAR"                        ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState } from 'react';
import { ArchitectureVisualizer } from './ArchitectureVisualizer';
import { ClusterMonitor } from './ClusterMonitor';
import type { ArchitectureBlueprint } from '../../aurora-build/core/AuroraBuilder';

interface DistributedSystemDashboardProps {
  blueprint?: ArchitectureBlueprint;
  isDistributed?: boolean;
}

export const DistributedSystemDashboard: React.FC<DistributedSystemDashboardProps> = ({
  blueprint,
  isDistributed = false
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'monitoring'>('architecture');

  if (!isDistributed) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">🌐</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Sistema Distribuído Não Detectado
        </h3>
        <p className="text-gray-600 mb-4">
          Este dashboard está disponível apenas para sistemas distribuídos.
        </p>
        <p className="text-sm text-gray-500">
          Use palavras-chave como: "distribuído", "cluster", "alta disponibilidade"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              🌐 Sistema Distribuído
            </h1>
            <p className="text-blue-100">
              {blueprint?.projectName || 'Cluster Auto-Escalável'}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Cluster Operacional</span>
            </div>
            <p className="text-sm text-blue-100">
              {blueprint?.techStack?.join(' • ') || 'Go • CockroachDB • Nginx'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('architecture')}
              className={`
                px-6 py-4 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'architecture'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="flex items-center gap-2">
                <span>🏗️</span>
                <span>Arquitetura</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`
                px-6 py-4 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'monitoring'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="flex items-center gap-2">
                <span>📊</span>
                <span>Monitoramento</span>
              </span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'architecture' && (
            <ArchitectureVisualizer
              blueprint={blueprint}
              isDistributed={isDistributed}
            />
          )}
          {activeTab === 'monitoring' && (
            <ClusterMonitor
              isDistributed={isDistributed}
              autoRefresh={true}
              refreshInterval={5000}
            />
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
              🚀
            </div>
            <div>
              <p className="text-sm text-gray-600">Nós de Aplicação</p>
              <p className="text-2xl font-bold text-gray-800">3</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
              🗄️
            </div>
            <div>
              <p className="text-sm text-gray-600">Nós de Banco</p>
              <p className="text-2xl font-bold text-gray-800">3</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
              ⚖️
            </div>
            <div>
              <p className="text-sm text-gray-600">Load Balancers</p>
              <p className="text-2xl font-bold text-gray-800">1</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          ✨ Recursos do Sistema Distribuído
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              ✅
            </div>
            <div>
              <p className="font-semibold text-gray-800">Auto-Descoberta</p>
              <p className="text-sm text-gray-600">
                Nós se conectam automaticamente via Gossip Protocol
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              ✅
            </div>
            <div>
              <p className="font-semibold text-gray-800">Alta Disponibilidade</p>
              <p className="text-sm text-gray-600">
                Sem ponto único de falha, failover automático
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              ✅
            </div>
            <div>
              <p className="font-semibold text-gray-800">Escalabilidade Horizontal</p>
              <p className="text-sm text-gray-600">
                Adicione nós para aumentar capacidade
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              ✅
            </div>
            <div>
              <p className="font-semibold text-gray-800">Sincronização Automática</p>
              <p className="text-sm text-gray-600">
                Dados replicados em todos os nós (CRDT)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              ✅
            </div>
            <div>
              <p className="font-semibold text-gray-800">Balanceamento de Carga</p>
              <p className="text-sm text-gray-600">
                Distribuição automática de requisições
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              ✅
            </div>
            <div>
              <p className="font-semibold text-gray-800">Backup Automático</p>
              <p className="text-sm text-gray-600">
                Dados replicados entre nós automaticamente
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Como Adicionar Nós */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          💡 Como Adicionar Novos Nós
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>1. Copie o binário para a nova máquina</p>
          <p>2. Configure a variável JOIN_NODES apontando para um nó existente</p>
          <p>3. Execute: <code className="bg-blue-100 px-2 py-1 rounded font-mono">./app --node-name=node4 --join=192.168.1.10:7946</code></p>
          <p>4. O novo nó será descoberto automaticamente pelo cluster</p>
        </div>
      </div>
    </div>
  );
};
