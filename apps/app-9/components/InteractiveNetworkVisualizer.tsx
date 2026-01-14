import React, { useState, useCallback, useMemo } from 'react';
import type { NetworkArchitecture } from '../types';
import { NetworkVisualizer } from './NetworkVisualizer';
import { DataInputSimulator } from './DataInputSimulator';
import { LayerActivationDisplay } from './LayerActivationDisplay';

interface InteractiveNetworkVisualizerProps {
  architecture: NetworkArchitecture;
}

export const InteractiveNetworkVisualizer: React.FC<InteractiveNetworkVisualizerProps> = ({
  architecture
}) => {
  const [inputData, setInputData] = useState<number[]>([]);
  const [layerActivations, setLayerActivations] = useState<Map<string, number[]>>(new Map());
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [showInputSimulator, setShowInputSimulator] = useState(false);

  const inputLayer = useMemo(() => {
    return architecture.layers.find(layer => layer.type === 'Input');
  }, [architecture.layers]);

  // Simula o forward pass através da rede
  const simulateForwardPass = useCallback((data: number[]) => {
    const activations = new Map<string, number[]>();
    let currentActivation = data;

    architecture.layers.forEach((layer, index) => {
      if (layer.type === 'Input') {
        activations.set(layer.name, currentActivation);
        return;
      }

      // Simula ativações baseadas no tipo de camada
      let nextActivation: number[] = [];
      
      if (layer.type === 'Dense') {
        const outputSize = layer.neurons || layer.shape?.[0] || 64;
        nextActivation = Array.from({ length: outputSize }, () => {
          // Simula uma transformação linear + ativação
          const sum = currentActivation.reduce((acc, val, i) => 
            acc + val * (Math.random() * 2 - 1), 0
          );
          
          // Aplica função de ativação (simulada)
          switch (layer.activation) {
            case 'relu':
              return Math.max(0, sum);
            case 'sigmoid':
              return 1 / (1 + Math.exp(-sum));
            case 'tanh':
              return Math.tanh(sum);
            default:
              return sum; // linear
          }
        });
      } else {
        // Para outros tipos de camada, mantém o tamanho similar
        nextActivation = currentActivation.map(val => 
          Math.random() * 2 - 1 + val * 0.1
        );
      }

      activations.set(layer.name, nextActivation);
      currentActivation = nextActivation;
    });

    setLayerActivations(activations);
  }, [architecture.layers]);

  const handleDataInput = useCallback((data: number[]) => {
    setInputData(data);
    simulateForwardPass(data);
  }, [simulateForwardPass]);

  const handleLayerHover = useCallback((layerName: string | null) => {
    setActiveLayer(layerName);
  }, []);

  return (
    <div className="relative w-full">
      {/* Visualizador principal */}
      <div className="relative">
        <NetworkVisualizer 
          architecture={architecture}
          onLayerHover={handleLayerHover}
        />
        
        {/* Displays de ativação para cada camada */}
        {architecture.layers.map(layer => (
          <LayerActivationDisplay
            key={layer.name}
            layer={layer}
            activations={layerActivations.get(layer.name) || []}
            isActive={activeLayer === layer.name}
          />
        ))}
      </div>

      {/* Controle do simulador de entrada */}
      <div className="absolute top-3 right-20">
        <button
          onClick={() => setShowInputSimulator(!showInputSimulator)}
          className="px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          {showInputSimulator ? 'Ocultar' : 'Simular'} Entrada
        </button>
      </div>

      {/* Simulador de entrada */}
      {showInputSimulator && inputLayer && (
        <div className="absolute top-16 right-3 w-80">
          <DataInputSimulator
            inputLayer={inputLayer}
            onDataInput={handleDataInput}
          />
        </div>
      )}

      {/* Painel de informações em tempo real */}
      {inputData.length > 0 && (
        <div className="absolute bottom-20 left-3 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-3 text-white text-xs">
          <div className="font-semibold mb-2">Dados Atuais</div>
          <div className="space-y-1">
            <div>Entrada: [{inputData.slice(0, 3).map(v => v.toFixed(2)).join(', ')}...]</div>
            <div>Camadas Ativas: {layerActivations.size}</div>
            <div>Última Atualização: {new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      )}
    </div>
  );
};
