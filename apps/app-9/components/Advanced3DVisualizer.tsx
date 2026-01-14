import React, { useRef, useEffect, useState } from 'react';
import { NetworkArchitecture, Layer } from '../types';

interface Advanced3DVisualizerProps {
  architecture: NetworkArchitecture;
  isAnimating?: boolean;
}

interface Node3D {
  id: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  layer: string;
  activation?: number;
  type: string;
}

interface Connection3D {
  from: Node3D;
  to: Node3D;
  weight: number;
  opacity: number;
}

export const Advanced3DVisualizer: React.FC<Advanced3DVisualizerProps> = ({ 
  architecture, 
  isAnimating = false 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node3D[]>([]);
  const [connections, setConnections] = useState<Connection3D[]>([]);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<Node3D | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | 'flow' | 'matrix'>('3d');
  const animationRef = useRef<number>();

  // Cores por tipo de camada
  const layerColors = {
    'Input': '#4F46E5',
    'Dense': '#059669',
    'Conv2D': '#DC2626',
    'LSTM': '#7C2D12',
    'Dropout': '#6B7280',
    'BatchNormalization': '#F59E0B',
    'MaxPooling2D': '#8B5CF6',
    'GlobalAveragePooling2D': '#EC4899',
    'Embedding': '#10B981',
    'Flatten': '#6366F1',
    'default': '#374151'
  };

  // Gerar nodes 3D baseados na arquitetura
  const generateNodes = () => {
    const newNodes: Node3D[] = [];
    const layers = architecture.layers;
    const maxNeurons = Math.max(...layers.map(l => l.neurons || l.shape?.[0] || 1));
    
    layers.forEach((layer, layerIndex) => {
      const neurons = layer.neurons || layer.shape?.[0] || 1;
      const displayNeurons = Math.min(neurons, 20); // Limitar visualização
      
      for (let i = 0; i < displayNeurons; i++) {
        const angle = (i / displayNeurons) * Math.PI * 2;
        const radius = Math.min(neurons / 10, 3);
        
        newNodes.push({
          id: `${layer.name}_${i}`,
          x: layerIndex * 4,
          y: Math.cos(angle) * radius,
          z: Math.sin(angle) * radius,
          radius: Math.log(neurons + 1) * 0.3 + 0.2,
          color: layerColors[layer.type as keyof typeof layerColors] || layerColors.default,
          layer: layer.name,
          activation: Math.random(), // Simulação de ativação
          type: layer.type
        });
      }
    });
    
    setNodes(newNodes);
  };

  // Gerar conexões entre camadas
  const generateConnections = () => {
    const newConnections: Connection3D[] = [];
    const layers = architecture.layers;
    
    layers.forEach((layer, layerIndex) => {
      if (layer.inputs.length > 0) {
        const currentLayerNodes = nodes.filter(n => n.layer === layer.name);
        
        layer.inputs.forEach(inputLayerName => {
          const inputLayerNodes = nodes.filter(n => n.layer === inputLayerName);
          
          // Conectar alguns nodes (não todos para não poluir)
          const maxConnections = Math.min(currentLayerNodes.length, inputLayerNodes.length, 5);
          
          for (let i = 0; i < maxConnections; i++) {
            const fromNode = inputLayerNodes[i % inputLayerNodes.length];
            const toNode = currentLayerNodes[i % currentLayerNodes.length];
            
            if (fromNode && toNode) {
              newConnections.push({
                from: fromNode,
                to: toNode,
                weight: Math.random() * 2 - 1, // Peso entre -1 e 1
                opacity: 0.3 + Math.random() * 0.4
              });
            }
          }
        });
      }
    });
    
    setConnections(newConnections);
  };

  // Projeção 3D para 2D
  const project3D = (x: number, y: number, z: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 50 * zoom;
    
    // Rotação
    const cosX = Math.cos(rotation.x);
    const sinX = Math.sin(rotation.x);
    const cosY = Math.cos(rotation.y);
    const sinY = Math.sin(rotation.y);
    
    // Aplicar rotações
    const rotatedY = y * cosX - z * sinX;
    const rotatedZ = y * sinX + z * cosX;
    const rotatedX = x * cosY - rotatedZ * sinY;
    const finalZ = x * sinY + rotatedZ * cosY;
    
    // Perspectiva
    const perspective = 1000;
    const projectedX = (rotatedX * perspective) / (perspective + finalZ);
    const projectedY = (rotatedY * perspective) / (perspective + finalZ);
    
    return {
      x: centerX + projectedX * scale,
      y: centerY + projectedY * scale,
      z: finalZ
    };
  };

  // Renderizar no canvas
  const render = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Gradiente de fundo
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    gradient.addColorStop(0, '#1F2937');
    gradient.addColorStop(1, '#111827');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Ordenar nodes por profundidade (z)
    const projectedNodes = nodes.map(node => ({
      ...node,
      projected: project3D(node.x, node.y, node.z)
    })).sort((a, b) => b.projected.z - a.projected.z);
    
    // Renderizar conexões
    connections.forEach(conn => {
      const fromProj = project3D(conn.from.x, conn.from.y, conn.from.z);
      const toProj = project3D(conn.to.x, conn.to.y, conn.to.z);
      
      ctx.beginPath();
      ctx.moveTo(fromProj.x, fromProj.y);
      ctx.lineTo(toProj.x, toProj.y);
      
      // Cor baseada no peso
      const intensity = Math.abs(conn.weight);
      const color = conn.weight > 0 ? `rgba(34, 197, 94, ${intensity * conn.opacity})` : `rgba(239, 68, 68, ${intensity * conn.opacity})`;
      ctx.strokeStyle = color;
      ctx.lineWidth = intensity * 2 + 0.5;
      ctx.stroke();
    });
    
    // Renderizar nodes
    projectedNodes.forEach(node => {
      const { x, y, z } = node.projected;
      
      // Tamanho baseado na profundidade
      const depthScale = Math.max(0.3, 1 - z / 1000);
      const radius = node.radius * 20 * depthScale;
      
      // Glow effect
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
      glowGradient.addColorStop(0, node.color + '80');
      glowGradient.addColorStop(1, node.color + '00');
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Node principal
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Ativação (pulsação)
      if (isAnimating && node.activation > 0.7) {
        const pulseRadius = radius * (1 + Math.sin(Date.now() * 0.01) * 0.3);
        ctx.strokeStyle = node.color + '80';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Highlight se selecionado
      if (selectedNode?.id === node.id) {
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    
    // Informações da camada selecionada
    if (selectedNode) {
      const layer = architecture.layers.find(l => l.name === selectedNode.layer);
      if (layer) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(10, 10, 250, 120);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px monospace';
        ctx.fillText(`Layer: ${layer.name}`, 20, 30);
        ctx.fillText(`Type: ${layer.type}`, 20, 50);
        ctx.fillText(`Neurons: ${layer.neurons || 'N/A'}`, 20, 70);
        ctx.fillText(`Activation: ${layer.activation || 'N/A'}`, 20, 90);
        ctx.fillText(`Shape: [${layer.shape?.join(', ') || 'N/A'}]`, 20, 110);
      }
    }
  };

  // Animação
  const animate = () => {
    if (isAnimating) {
      setRotation(prev => ({
        x: prev.x + 0.005,
        y: prev.y + 0.003
      }));
    }
    render();
    animationRef.current = requestAnimationFrame(animate);
  };

  // Event handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.buttons === 1) { // Mouse pressionado
      const deltaX = e.movementX * 0.01;
      const deltaY = e.movementY * 0.01;
      
      setRotation(prev => ({
        x: prev.x + deltaY,
        y: prev.y + deltaX
      }));
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(3, prev * delta)));
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Encontrar node clicado
    const clickedNode = nodes.find(node => {
      const projected = project3D(node.x, node.y, node.z);
      const distance = Math.sqrt(
        Math.pow(projected.x - clickX, 2) + Math.pow(projected.y - clickY, 2)
      );
      return distance < node.radius * 20;
    });
    
    setSelectedNode(clickedNode || null);
  };

  // Effects
  useEffect(() => {
    generateNodes();
  }, [architecture]);

  useEffect(() => {
    if (nodes.length > 0) {
      generateConnections();
    }
  }, [nodes]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, connections, rotation, zoom, selectedNode, isAnimating]);

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Controles */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={() => setViewMode('3d')}
          className={`px-3 py-1 text-xs rounded ${viewMode === '3d' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          3D View
        </button>
        <button
          onClick={() => setViewMode('flow')}
          className={`px-3 py-1 text-xs rounded ${viewMode === 'flow' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Flow View
        </button>
        <button
          onClick={() => setViewMode('matrix')}
          className={`px-3 py-1 text-xs rounded ${viewMode === 'matrix' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Matrix View
        </button>
      </div>

      {/* Informações */}
      <div className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-xs text-white">
        <div>Layers: {architecture.layers.length}</div>
        <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
        <div>Nodes: {nodes.length}</div>
        <div>Connections: {connections.length}</div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        onClick={handleClick}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Legenda */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-xs text-white">
        <div className="font-semibold mb-2">Layer Types:</div>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(layerColors).slice(0, -1).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span>{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Instruções */}
      <div className="absolute bottom-4 right-4 z-10 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-xs text-white">
        <div>🖱️ Drag to rotate</div>
        <div>🔍 Scroll to zoom</div>
        <div>👆 Click nodes for info</div>
      </div>
    </div>
  );
};