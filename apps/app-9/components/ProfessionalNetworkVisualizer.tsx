import React, { useState, useEffect } from 'react';
import { NetworkArchitecture } from '../types';
import { Advanced3DVisualizer } from './Advanced3DVisualizer';
import { DataFlowVisualizer } from './DataFlowVisualizer';
import { WeightMatrixVisualizer } from './WeightMatrixVisualizer';
import { InteractiveNetworkVisualizer } from './InteractiveNetworkVisualizer';

interface ProfessionalNetworkVisualizerProps {
  architecture: NetworkArchitecture;
}

type VisualizationMode = '3d' | 'flow' | 'matrix' | 'interactive' | 'comparison';

interface ViewSettings {
  showAnimations: boolean;
  showLabels: boolean;
  showConnections: boolean;
  colorScheme: 'default' | 'dark' | 'neon' | 'professional';
  layout: 'horizontal' | 'vertical' | 'circular';
}

export const ProfessionalNetworkVisualizer: React.FC<ProfessionalNetworkVisualizerProps> = ({ 
  architecture 
}) => {
  const [mode, setMode] = useState<VisualizationMode>('3d');
  const [settings, setSettings] = useState<ViewSettings>({
    showAnimations: true,
    showLabels: true,
    showConnections: true,
    colorScheme: 'professional',
    layout: 'horizontal'
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Estatísticas da arquitetura
  const stats = {
    totalLayers: architecture.layers.length,
    totalParams: architecture.layers.reduce((sum, layer) => {
      if (layer.type === 'Dense' && layer.neurons) {
        const prevLayer = architecture.layers[architecture.layers.indexOf(layer) - 1];
        const inputSize = prevLayer?.neurons || prevLayer?.shape?.[0] || 784;
        return sum + (inputSize * layer.neurons) + layer.neurons; // weights + biases
      }
      return sum;
    }, 0),
    complexity: architecture.layers.length > 10 ? 'High' : 
                architecture.layers.length > 5 ? 'Medium' : 'Low',
    hasConvLayers: architecture.layers.some(l => l.type.includes('Conv')),
    hasRecurrentLayers: architecture.layers.some(l => ['LSTM', 'GRU', 'RNN'].includes(l.type)),
    hasAttention: architecture.layers.some(l => l.type.includes('Attention'))
  };

  // Renderizar visualizador baseado no modo
  const renderVisualizer = () => {
    switch (mode) {
      case '3d':
        return <Advanced3DVisualizer architecture={architecture} isAnimating={settings.showAnimations} />;
      case 'flow':
        return <DataFlowVisualizer architecture={architecture} isActive={settings.showAnimations} />;
      case 'matrix':
        return <WeightMatrixVisualizer architecture={architecture} />;
      case 'interactive':
        return <InteractiveNetworkVisualizer architecture={architecture} />;
      case 'comparison':
        return (
          <div className="grid grid-cols-2 gap-2 h-full">
            <div className="border border-gray-600 rounded">
              <div className="text-xs text-center text-gray-400 p-1 bg-gray-800">3D View</div>
              <Advanced3DVisualizer architecture={architecture} isAnimating={false} />
            </div>
            <div className="border border-gray-600 rounded">
              <div className="text-xs text-center text-gray-400 p-1 bg-gray-800">Data Flow</div>
              <DataFlowVisualizer architecture={architecture} isActive={true} />
            </div>
          </div>
        );
      default:
        return <Advanced3DVisualizer architecture={architecture} isAnimating={settings.showAnimations} />;
    }
  };

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : 'w-full h-full'}`}>
      {/* Header com controles */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm border-b border-gray-700">
        <div className="flex items-center justify-between p-4">
          {/* Título e estatísticas */}
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-white">Neural Network Visualizer</h3>
            <div className="flex gap-4 text-xs text-gray-400">
              <span>Layers: {stats.totalLayers}</span>
              <span>Parameters: {stats.totalParams.toLocaleString()}</span>
              <span>Complexity: {stats.complexity}</span>
            </div>
          </div>

          {/* Controles principais */}
          <div className="flex items-center gap-2">
            {/* Seletor de modo */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              {[
                { key: '3d', label: '🎯 3D', title: '3D Interactive View' },
                { key: 'flow', label: '🌊 Flow', title: 'Data Flow Animation' },
                { key: 'matrix', label: '📊 Matrix', title: 'Weight Matrix View' },
                { key: 'interactive', label: '🔗 Graph', title: 'Interactive Graph' },
                { key: 'comparison', label: '⚖️ Compare', title: 'Side-by-side Comparison' }
              ].map(({ key, label, title }) => (
                <button
                  key={key}
                  onClick={() => setMode(key as VisualizationMode)}
                  className={`px-3 py-1 text-xs rounded transition-all ${
                    mode === key 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                  title={title}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Configurações */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Settings"
            >
              ⚙️
            </button>

            {/* Fullscreen */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? '🗗' : '🗖'}
            </button>
          </div>
        </div>

        {/* Painel de configurações */}
        {showSettings && (
          <div className="border-t border-gray-700 p-4 bg-gray-900/95">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {/* Animações */}
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={settings.showAnimations}
                  onChange={(e) => setSettings(prev => ({ ...prev, showAnimations: e.target.checked }))}
                  className="rounded"
                />
                Animations
              </label>

              {/* Labels */}
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={settings.showLabels}
                  onChange={(e) => setSettings(prev => ({ ...prev, showLabels: e.target.checked }))}
                  className="rounded"
                />
                Labels
              </label>

              {/* Conexões */}
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={settings.showConnections}
                  onChange={(e) => setSettings(prev => ({ ...prev, showConnections: e.target.checked }))}
                  className="rounded"
                />
                Connections
              </label>

              {/* Esquema de cores */}
              <select
                value={settings.colorScheme}
                onChange={(e) => setSettings(prev => ({ ...prev, colorScheme: e.target.value as any }))}
                className="px-2 py-1 bg-gray-800 text-white rounded border border-gray-600"
              >
                <option value="default">Default</option>
                <option value="dark">Dark</option>
                <option value="neon">Neon</option>
                <option value="professional">Professional</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Área principal do visualizador */}
      <div className="pt-16 h-full">
        {renderVisualizer()}
      </div>

      {/* Painel de informações lateral */}
      <div className="absolute right-4 top-20 bottom-4 w-64 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-xs text-white overflow-y-auto">
        <h4 className="font-semibold mb-3 text-purple-400">Architecture Details</h4>
        
        {/* Estatísticas gerais */}
        <div className="mb-4 space-y-2">
          <div className="flex justify-between">
            <span>Total Layers:</span>
            <span className="font-mono">{stats.totalLayers}</span>
          </div>
          <div className="flex justify-between">
            <span>Parameters:</span>
            <span className="font-mono">{stats.totalParams.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Complexity:</span>
            <span className={`font-mono ${
              stats.complexity === 'High' ? 'text-red-400' :
              stats.complexity === 'Medium' ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {stats.complexity}
            </span>
          </div>
        </div>

        {/* Características da arquitetura */}
        <div className="mb-4">
          <h5 className="font-semibold mb-2 text-gray-300">Features:</h5>
          <div className="space-y-1">
            <div className={`flex items-center gap-2 ${stats.hasConvLayers ? 'text-green-400' : 'text-gray-500'}`}>
              <span>{stats.hasConvLayers ? '✅' : '❌'}</span>
              <span>Convolutional Layers</span>
            </div>
            <div className={`flex items-center gap-2 ${stats.hasRecurrentLayers ? 'text-green-400' : 'text-gray-500'}`}>
              <span>{stats.hasRecurrentLayers ? '✅' : '❌'}</span>
              <span>Recurrent Layers</span>
            </div>
            <div className={`flex items-center gap-2 ${stats.hasAttention ? 'text-green-400' : 'text-gray-500'}`}>
              <span>{stats.hasAttention ? '✅' : '❌'}</span>
              <span>Attention Mechanism</span>
            </div>
          </div>
        </div>

        {/* Lista de camadas */}
        <div>
          <h5 className="font-semibold mb-2 text-gray-300">Layers:</h5>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {architecture.layers.map((layer, index) => (
              <div key={layer.name} className="bg-gray-800/50 rounded p-2">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-purple-300">L{index}</span>
                  <span className="text-xs text-gray-400">{layer.type}</span>
                </div>
                <div className="text-xs text-gray-300">{layer.name}</div>
                {layer.neurons && (
                  <div className="text-xs text-gray-400">Neurons: {layer.neurons}</div>
                )}
                {layer.shape && (
                  <div className="text-xs text-gray-400">Shape: [{layer.shape.join(', ')}]</div>
                )}
                {layer.activation && (
                  <div className="text-xs text-gray-400">Activation: {layer.activation}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Indicadores de performance */}
      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-xs text-white">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Rendering: Active</span>
          </div>
          <div>Mode: {mode.toUpperCase()}</div>
          <div>FPS: ~60</div>
        </div>
      </div>
    </div>
  );
};