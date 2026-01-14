import React from 'react';
import type { Layer } from '../types';

interface LayerActivationDisplayProps {
  layer: Layer;
  activations: number[];
  isActive: boolean;
}

export const LayerActivationDisplay: React.FC<LayerActivationDisplayProps> = ({
  layer,
  activations,
  isActive
}) => {
  const maxActivations = 12; // Limite para visualização
  const displayActivations = activations.slice(0, maxActivations);
  const hasMore = activations.length > maxActivations;

  const getActivationColor = (value: number) => {
    const intensity = Math.abs(value);
    const hue = value >= 0 ? '120' : '0'; // Verde para positivo, vermelho para negativo
    return `hsla(${hue}, 70%, 50%, ${Math.min(intensity, 1)})`;
  };

  const getActivationSize = (value: number) => {
    return 4 + Math.abs(value) * 8; // Tamanho baseado na intensidade
  };

  if (!isActive || activations.length === 0) {
    return null;
  }

  return (
    <div className="absolute -right-32 top-0 bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-600 p-3 text-white text-xs min-w-28 z-10">
      <div className="font-semibold mb-2">{layer.name}</div>
      <div className="space-y-1">
        <div className="text-gray-400">Ativações:</div>
        <div className="grid grid-cols-3 gap-1">
          {displayActivations.map((activation, index) => (
            <div key={index} className="flex items-center space-x-1">
              <div
                className="rounded-full border border-gray-500"
                style={{
                  width: `${getActivationSize(activation)}px`,
                  height: `${getActivationSize(activation)}px`,
                  backgroundColor: getActivationColor(activation)
                }}
              />
              <span className="text-xs">{activation.toFixed(2)}</span>
            </div>
          ))}
        </div>
        {hasMore && (
          <div className="text-gray-500 text-center">
            +{activations.length - maxActivations} mais
          </div>
        )}
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div>Média: {(activations.reduce((a, b) => a + b, 0) / activations.length).toFixed(3)}</div>
          <div>Max: {Math.max(...activations).toFixed(3)}</div>
          <div>Min: {Math.min(...activations).toFixed(3)}</div>
        </div>
      </div>
    </div>
  );
};
