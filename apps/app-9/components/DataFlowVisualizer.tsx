import React, { useRef, useEffect, useState } from 'react';
import { NetworkArchitecture } from '../types';

interface DataFlowVisualizerProps {
  architecture: NetworkArchitecture;
  isActive?: boolean;
}

interface DataPacket {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  size: number;
  speed: number;
  layer: string;
  data: number[];
}

interface LayerNode {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  neurons: number;
  isActive: boolean;
  activationLevel: number;
}

export const DataFlowVisualizer: React.FC<DataFlowVisualizerProps> = ({ 
  architecture, 
  isActive = false 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layerNodes, setLayerNodes] = useState<LayerNode[]>([]);
  const [dataPackets, setDataPackets] = useState<DataPacket[]>([]);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const animationRef = useRef<number>();

  // Cores para diferentes tipos de dados
  const dataColors = {
    'input': '#3B82F6',
    'hidden': '#10B981',
    'output': '#F59E0B',
    'gradient': '#EF4444',
    'activation': '#8B5CF6'
  };

  // Gerar layout das camadas
  const generateLayerLayout = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const layers = architecture.layers;
    const spacing = canvas.width / (layers.length + 1);
    const centerY = canvas.height / 2;

    const newLayerNodes: LayerNode[] = layers.map((layer, index) => {
      const neurons = layer.neurons || layer.shape?.[0] || 1;
      const height = Math.min(Math.max(neurons * 2, 40), 200);
      
      return {
        name: layer.name,
        x: spacing * (index + 1),
        y: centerY,
        width: 80,
        height,
        type: layer.type,
        neurons,
        isActive: false,
        activationLevel: 0
      };
    });

    setLayerNodes(newLayerNodes);
  };

  // Criar pacote de dados
  const createDataPacket = (fromLayer: number, toLayer: number, dataType: string) => {
    if (!layerNodes[fromLayer] || !layerNodes[toLayer]) return null;

    const from = layerNodes[fromLayer];
    const to = layerNodes[toLayer];
    
    // Gerar dados sintéticos
    const dataSize = Math.min(from.neurons, 10);
    const data = Array.from({ length: dataSize }, () => Math.random());

    return {
      id: `packet_${Date.now()}_${Math.random()}`,
      x: from.x + from.width / 2,
      y: from.y,
      targetX: to.x - to.width / 2,
      targetY: to.y,
      color: dataColors[dataType as keyof typeof dataColors] || dataColors.hidden,
      size: Math.log(dataSize + 1) * 3 + 5,
      speed: 2 * speed,
      layer: to.name,
      data
    };
  };

  // Simular forward pass
  const simulateForwardPass = () => {
    if (!isPlaying || layerNodes.length === 0) return;

    // Ativar camada atual
    setLayerNodes(prev => prev.map((layer, index) => ({
      ...layer,
      isActive: index === currentLayer,
      activationLevel: index === currentLayer ? 1 : Math.max(0, layer.activationLevel - 0.1)
    })));

    // Criar pacote de dados
    if (currentLayer < layerNodes.length - 1) {
      const packet = createDataPacket(currentLayer, currentLayer + 1, 'hidden');
      if (packet) {
        setDataPackets(prev => [...prev, packet]);
      }
    }

    // Avançar para próxima camada
    setTimeout(() => {
      setCurrentLayer(prev => (prev + 1) % layerNodes.length);
    }, 1000 / speed);
  };

  // Atualizar posições dos pacotes
  const updateDataPackets = () => {
    setDataPackets(prev => prev.map(packet => {
      const dx = packet.targetX - packet.x;
      const dy = packet.targetY - packet.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < packet.speed) {
        // Chegou ao destino
        return null;
      }

      // Mover em direção ao alvo
      const moveX = (dx / distance) * packet.speed;
      const moveY = (dy / distance) * packet.speed;

      return {
        ...packet,
        x: packet.x + moveX,
        y: packet.y + moveY
      };
    }).filter(Boolean) as DataPacket[]);
  };

  // Renderizar
  const render = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fundo com grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Renderizar conexões entre camadas
    for (let i = 0; i < layerNodes.length - 1; i++) {
      const from = layerNodes[i];
      const to = layerNodes[i + 1];

      ctx.beginPath();
      ctx.moveTo(from.x + from.width, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = from.isActive ? '#10B981' : '#4B5563';
      ctx.lineWidth = from.isActive ? 3 : 1;
      ctx.stroke();

      // Seta
      const arrowSize = 10;
      const angle = Math.atan2(to.y - from.y, to.x - (from.x + from.width));
      const arrowX = to.x - arrowSize;
      const arrowY = to.y;

      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = from.isActive ? '#10B981' : '#4B5563';
      ctx.fill();
    }

    // Renderizar camadas
    layerNodes.forEach((layer, index) => {
      const x = layer.x - layer.width / 2;
      const y = layer.y - layer.height / 2;

      // Fundo da camada
      const gradient = ctx.createLinearGradient(x, y, x, y + layer.height);
      if (layer.isActive) {
        gradient.addColorStop(0, '#10B981');
        gradient.addColorStop(1, '#059669');
      } else {
        gradient.addColorStop(0, '#4B5563');
        gradient.addColorStop(1, '#374151');
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, layer.width, layer.height);

      // Borda
      ctx.strokeStyle = layer.isActive ? '#34D399' : '#6B7280';
      ctx.lineWidth = layer.isActive ? 3 : 1;
      ctx.strokeRect(x, y, layer.width, layer.height);

      // Efeito de ativação
      if (layer.activationLevel > 0) {
        ctx.fillStyle = `rgba(52, 211, 153, ${layer.activationLevel * 0.3})`;
        ctx.fillRect(x - 5, y - 5, layer.width + 10, layer.height + 10);
      }

      // Texto da camada
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(layer.type, layer.x, layer.y - 10);
      ctx.fillText(`${layer.neurons}`, layer.x, layer.y + 5);

      // Visualização de neurônios
      if (layer.neurons <= 20) {
        const neuronSize = 3;
        const cols = Math.ceil(Math.sqrt(layer.neurons));
        const rows = Math.ceil(layer.neurons / cols);
        const spacing = Math.min(layer.width / cols, layer.height / rows) * 0.8;

        for (let i = 0; i < layer.neurons; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const neuronX = x + (col + 0.5) * (layer.width / cols);
          const neuronY = y + (row + 0.5) * (layer.height / rows);

          ctx.beginPath();
          ctx.arc(neuronX, neuronY, neuronSize, 0, Math.PI * 2);
          ctx.fillStyle = layer.isActive ? '#FBBF24' : '#9CA3AF';
          ctx.fill();
        }
      }

      // Índice da camada
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '10px monospace';
      ctx.fillText(`L${index}`, layer.x, y - 20);
    });

    // Renderizar pacotes de dados
    dataPackets.forEach(packet => {
      // Trilha do pacote
      ctx.beginPath();
      ctx.arc(packet.x, packet.y, packet.size + 5, 0, Math.PI * 2);
      ctx.fillStyle = packet.color + '20';
      ctx.fill();

      // Pacote principal
      ctx.beginPath();
      ctx.arc(packet.x, packet.y, packet.size, 0, Math.PI * 2);
      ctx.fillStyle = packet.color;
      ctx.fill();

      // Brilho
      ctx.beginPath();
      ctx.arc(packet.x - packet.size * 0.3, packet.y - packet.size * 0.3, packet.size * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF80';
      ctx.fill();

      // Dados (pequenos pontos)
      packet.data.forEach((value, index) => {
        const angle = (index / packet.data.length) * Math.PI * 2;
        const radius = packet.size * 0.7;
        const dotX = packet.x + Math.cos(angle) * radius;
        const dotY = packet.y + Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.arc(dotX, dotY, value * 2 + 1, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      });
    });

    // Informações de debug
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Current Layer: ${currentLayer}`, 10, 20);
    ctx.fillText(`Packets: ${dataPackets.length}`, 10, 40);
    ctx.fillText(`Speed: ${speed}x`, 10, 60);
  };

  // Loop de animação
  const animate = () => {
    updateDataPackets();
    render();
    animationRef.current = requestAnimationFrame(animate);
  };

  // Effects
  useEffect(() => {
    generateLayerLayout();
  }, [architecture]);

  useEffect(() => {
    if (isPlaying) {
      simulateForwardPass();
    }
  }, [currentLayer, isPlaying, layerNodes]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [layerNodes, dataPackets, currentLayer]);

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Controles */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`px-3 py-1 text-xs rounded flex items-center gap-1 ${
            isPlaying ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          }`}
        >
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
        
        <button
          onClick={() => setCurrentLayer(0)}
          className="px-3 py-1 text-xs rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
        >
          🔄 Reset
        </button>

        <div className="flex items-center gap-2 bg-gray-700 rounded px-2 py-1">
          <span className="text-xs text-gray-300">Speed:</span>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.5"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-16"
          />
          <span className="text-xs text-gray-300">{speed}x</span>
        </div>
      </div>

      {/* Legenda */}
      <div className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-xs text-white">
        <div className="font-semibold mb-2">Data Flow:</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Input Data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Hidden Layer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Output</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Progress Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentLayer + 1) / layerNodes.length) * 100}%` }}
          />
        </div>
        <div className="text-xs text-gray-400 mt-1 text-center">
          Forward Pass Progress: {currentLayer + 1} / {layerNodes.length}
        </div>
      </div>
    </div>
  );
};