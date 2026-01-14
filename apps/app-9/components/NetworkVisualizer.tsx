import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { Layer, NetworkArchitecture } from '../types';
import { PlusIcon, MinusIcon, ResetIcon, CopyIcon } from './icons/Icons';

// Interfaces para animações e interatividade
interface DataParticle {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  path: string;
  speed: number;
  color: string;
}

interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  content: string[];
  title: string;
}

interface NetworkVisualizerProps {
  architecture: NetworkArchitecture;
  onLayerHover?: (layerName: string | null) => void;
}

const MAX_NODES_TO_DISPLAY = 12;
const NODE_RADIUS = 8;
const ANIMATION_DURATION = 2000; // ms
const PARTICLE_COUNT = 1; // Reduzido de 3 para 1
const MAX_PARTICLES_TOTAL = 20; // Limite máximo de partículas

// Estruturas de dados para o novo layout híbrido
interface VisualNode {
  id: string;
  cx: number;
  cy: number;
}

interface NodeColumn {
  type: 'nodes';
  layer: Layer;
  nodes: VisualNode[];
  isTruncated: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayerBlock {
  type: 'block';
  layer: Layer;
  x: number;
  y: number;
  width: number;
  height: number;
}

type LayoutItem = NodeColumn | LayerBlock;

interface VisualEdge {
  id: string;
  path: string;
}

interface LayerLabel {
    id: string;
    x: number;
    y: number;
    text: string;
}

const LAYER_COLORS: { [key: string]: { fill: string; stroke: string; } } = {
  'Input':        { fill: 'hsla(262, 77%, 70%, 0.3)', stroke: 'hsla(262, 77%, 70%, 1)' },
  'Dense':        { fill: 'hsla(217, 89%, 61%, 0.3)', stroke: 'hsla(217, 89%, 61%, 1)' },
  'Conv2D':       { fill: 'hsla(145, 63%, 49%, 0.3)', stroke: 'hsla(145, 63%, 49%, 1)' },
  'MaxPooling2D': { fill: 'hsla(215, 28%, 17%, 0.5)', stroke: 'hsla(215, 28%, 35%, 1)' },
  'Flatten':      { fill: 'hsla(27, 96%, 54%, 0.3)', stroke: 'hsla(27, 96%, 54%, 1)' },
  'Dropout':      { fill: 'hsla(0, 84%, 60%, 0.3)',  stroke: 'hsla(0, 84%, 60%, 1)'  },
  'Concatenate':  { fill: 'hsla(53, 97%, 50%, 0.3)', stroke: 'hsla(53, 97%, 50%, 1)'},
  'Embedding':    { fill: 'hsla(328, 94%, 55%, 0.3)', stroke: 'hsla(328, 94%, 55%, 1)'},
  'TextVectorization': { fill: 'hsla(187, 86%, 47%, 0.3)', stroke: 'hsla(187, 86%, 47%, 1)'},
  'GlobalAveragePooling': { fill: 'hsla(215, 28%, 17%, 0.5)', stroke: 'hsla(215, 28%, 35%, 1)'},
  '(Pre-treinado)': { fill: 'hsla(108, 62%, 50%, 0.3)', stroke: 'hsla(108, 62%, 50%, 1)'},
  'default':      { fill: 'hsla(262, 85%, 55%, 0.3)', stroke: 'hsla(262, 85%, 55%, 1)' }
};

const getLayerColor = (layerType: string) => {
    if (LAYER_COLORS[layerType]) return LAYER_COLORS[layerType];
    const key = Object.keys(LAYER_COLORS).find(k => layerType.includes(k)) || 'default';
    return LAYER_COLORS[key];
};

const getLayerDetails = (layer: Layer) => {
    return [
        layer.neurons ? `Neurônios: ${layer.neurons}` : '',
        layer.filters ? `Filtros: ${layer.filters}` : '',
        layer.shape ? `Formato Saída: ${layer.shape.join('×')}` : '',
        layer.activation && layer.activation !== 'linear' ? `Ativação: ${layer.activation}` : '',
        layer.rate ? `Taxa Dropout: ${layer.rate}` : '',
        layer.kernel_size ? `Kernel: ${layer.kernel_size.join('×')}` : '',
        layer.pool_size ? `Pool: ${layer.pool_size.join('×')}` : '',
        layer.max_tokens ? `Vocabulário: ${layer.max_tokens}` : '',
        layer.output_dim ? `Dim Saída: ${layer.output_dim}` : '',
        layer.output_sequence_length ? `Comp Sequência: ${layer.output_sequence_length}` : '',
    ].filter(Boolean);
}

const getNeuronCount = (layer: Layer): number => {
    if (layer.neurons) return layer.neurons;
    if (layer.shape && layer.shape.length > 0) {
      // Para camadas de entrada, o número de neurônios é o produto das dimensões da forma.
      return layer.shape.reduce((a, b) => a * b, 1);
    }
    return 0;
};

const isExpandable = (layer: Layer): boolean => {
    return ['Dense', 'Input'].includes(layer.type) && getNeuronCount(layer) > 0;
};


const calculateLayout = (layers: Layer[], viewWidth: number, viewHeight: number): { items: LayoutItem[], edges: VisualEdge[], labels: LayerLabel[] } => {
  if (!layers || layers.length === 0) return { items: [], edges: [], labels: [] };

  const nodeMap = new Map<string, Layer & { children: string[], level: number }>();
  layers.forEach(layer => {
    nodeMap.set(layer.name, { ...layer, children: [], level: -1 });
  });

  layers.forEach(layer => {
    if (layer.inputs) {
      layer.inputs.forEach(inputName => {
        if (nodeMap.has(inputName)) {
            nodeMap.get(inputName)!.children.push(layer.name);
        }
      });
    }
  });

  const levels: string[][] = [];
  let currentLevelNodes = layers.filter(l => !l.inputs || l.inputs.length === 0);

  while (currentLevelNodes.length > 0) {
    levels.push(currentLevelNodes.map(n => n.name));
    
    currentLevelNodes.forEach(node => {
        const nodeData = nodeMap.get(node.name);
        if(nodeData) nodeData.level = levels.length - 1;
    });

    const nextLevelNodesMap = new Map<string, Layer>();
    currentLevelNodes.forEach(node => {
      const nodeData = nodeMap.get(node.name);
      if (nodeData) {
        nodeData.children.forEach(childName => {
          const childNode = nodeMap.get(childName);
          if (childNode && !nextLevelNodesMap.has(childName) && childNode.inputs.every(input => nodeMap.get(input)!.level !== -1)) {
            nextLevelNodesMap.set(childName, childNode);
          }
        });
      }
    });
    currentLevelNodes = Array.from(nextLevelNodesMap.values());
  }

  const HORIZONTAL_SPACING = 180;
  const VERTICAL_SPACING = 40;
  const NODE_VERTICAL_SPACING = NODE_RADIUS * 3;
  const BLOCK_WIDTH = 140;

  // FIX: Corrected the type for preliminaryItems. `Omit<LayoutItem, 'x' | 'y'>` was too restrictive as `Omit` on a union type only considers common properties. The new type `Omit<NodeColumn, 'x' | 'y'> | Omit<LayerBlock, 'x' | 'y'>` correctly represents the two possible shapes of items before positional properties are added.
  const preliminaryItems = new Map<string, Omit<NodeColumn, 'x' | 'y'> | Omit<LayerBlock, 'x' | 'y'>>();
  layers.forEach(layer => {
    if (isExpandable(layer)) {
      const neuronCount = getNeuronCount(layer);
      const displayCount = Math.min(neuronCount, MAX_NODES_TO_DISPLAY);
      const nodes: VisualNode[] = Array.from({ length: displayCount }, (_, i) => ({
        id: `${layer.name}_${i}`, cx: 0, cy: 0
      }));
      preliminaryItems.set(layer.name, {
        type: 'nodes', layer, nodes, isTruncated: neuronCount > MAX_NODES_TO_DISPLAY,
        width: NODE_RADIUS * 2,
        height: (displayCount - 1) * NODE_VERTICAL_SPACING + NODE_RADIUS * 2,
      });
    } else {
      const details = getLayerDetails(layer);
      const height = 50 + details.length * 16 + 5;
      preliminaryItems.set(layer.name, {
        type: 'block', layer, width: BLOCK_WIDTH, height
      });
    }
  });
  
  const positionedItems = new Map<string, LayoutItem>();
  const finalLabels: LayerLabel[] = [];
  const totalWidth = (levels.length - 1) * HORIZONTAL_SPACING;
  let currentX = (viewWidth - totalWidth) / 2;

  levels.forEach((levelNodes, levelIndex) => {
    const columnItems = levelNodes.map(name => preliminaryItems.get(name)!);
    const columnHeight = columnItems.reduce((sum, item) => sum + item.height, 0) + Math.max(0, columnItems.length - 1) * VERTICAL_SPACING;
    let currentY = (viewHeight - columnHeight) / 2;

    const firstItem = columnItems.length > 0 ? columnItems[0] : null;
    if(firstItem) {
        finalLabels.push({
            id: `label_${levelIndex}`,
            x: currentX + firstItem.width / 2,
            y: currentY - 40,
            text: `Camada ${levelIndex + 1}`
        });
    }

    columnItems.forEach(item => {
      const positionedItem = { ...item, x: currentX, y: currentY } as LayoutItem;
      if (positionedItem.type === 'nodes') {
        positionedItem.nodes.forEach((node, i) => {
          node.cx = positionedItem.x + NODE_RADIUS;
          node.cy = positionedItem.y + i * NODE_VERTICAL_SPACING + NODE_RADIUS;
        });
      }
      positionedItems.set(item.layer.name, positionedItem);
      currentY += item.height + VERTICAL_SPACING;
    });
    currentX += HORIZONTAL_SPACING;
  });
  
  const finalEdges: VisualEdge[] = [];
  positionedItems.forEach(childItem => {
    childItem.layer.inputs?.forEach(inputName => {
      const parentItem = positionedItems.get(inputName);
      if (!parentItem) return;

      if (parentItem.type === 'nodes' && childItem.type === 'nodes') {
        parentItem.nodes.forEach(parentNode => {
          childItem.nodes.forEach(childNode => {
            finalEdges.push({
              id: `${parentNode.id}-${childNode.id}`,
              path: `M ${parentNode.cx} ${parentNode.cy} L ${childNode.cx} ${childNode.cy}`
            });
          });
        });
      } else if (parentItem.type === 'block' && childItem.type === 'nodes') {
        const fromX = parentItem.x + parentItem.width;
        const fromY = parentItem.y + parentItem.height / 2;
        childItem.nodes.forEach(childNode => {
          finalEdges.push({
            id: `${parentItem.layer.name}-${childNode.id}`,
            path: `M ${fromX} ${fromY} C ${fromX + HORIZONTAL_SPACING / 2} ${fromY}, ${childNode.cx - HORIZONTAL_SPACING / 2} ${childNode.cy}, ${childNode.cx} ${childNode.cy}`
          });
        });
      } else if (parentItem.type === 'nodes' && childItem.type === 'block') {
        const toX = childItem.x;
        const toY = childItem.y + childItem.height / 2;
        parentItem.nodes.forEach(parentNode => {
          finalEdges.push({
            id: `${parentNode.id}-${childItem.layer.name}`,
            path: `M ${parentNode.cx} ${parentNode.cy} C ${parentNode.cx + HORIZONTAL_SPACING / 2} ${parentNode.cy}, ${toX - HORIZONTAL_SPACING / 2} ${toY}, ${toX} ${toY}`
          });
        });
      } else if (parentItem.type === 'block' && childItem.type === 'block') {
        const fromX = parentItem.x + parentItem.width;
        const fromY = parentItem.y + parentItem.height / 2;
        const toX = childItem.x;
        const toY = childItem.y + childItem.height / 2;
        finalEdges.push({
          id: `${parentItem.layer.name}-${childItem.layer.name}`,
          path: `M ${fromX} ${fromY} C ${fromX + HORIZONTAL_SPACING / 2} ${fromY}, ${toX - HORIZONTAL_SPACING / 2} ${toY}, ${toX} ${toY}`
        });
      }
    });
  });
  
    // Melhora os rótulos das camadas
    if (finalLabels.length > 0) {
        finalLabels[0].text = 'Entrada';
        if (finalLabels.length > 1) {
            finalLabels[finalLabels.length - 1].text = 'Saída';
        }
        for (let i = 1; i < finalLabels.length - 1; i++) {
            finalLabels[i].text = `Camada Oculta ${i}`;
        }
    }


  return { items: Array.from(positionedItems.values()), edges: finalEdges, labels: finalLabels };
};

export const NetworkVisualizer: React.FC<NetworkVisualizerProps> = ({ architecture, onLayerHover }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({ width: 800, height: 600 });
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const isPanning = useRef(false);
  const startPoint = useRef({ x: 0, y: 0 });
  
  // Estados para animações e interatividade
  const [particles, setParticles] = useState<DataParticle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1); // 0.5x a 3x
  const [performanceMode, setPerformanceMode] = useState(true); // Modo leve por padrão
  const [showSettings, setShowSettings] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipData>({ visible: false, x: 0, y: 0, content: [], title: '' });
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);
  const animationRef = useRef<number>();
  const frameCount = useRef<number>(0);

  const { items, edges, labels } = useMemo(() => {
    return calculateLayout(architecture.layers, viewBox.width, viewBox.height);
  }, [architecture.layers, viewBox.width, viewBox.height]);
  
   useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setViewBox({ width, height });
      }
    });

    if (svgRef.current?.parentElement) {
      resizeObserver.observe(svgRef.current.parentElement);
    }
    
    return () => resizeObserver.disconnect();
  }, []);
  
  useEffect(() => {
    resetTransform();
  }, [architecture]);


  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const { k, x, y } = transform;
    const zoomFactor = 1.1;
    const newK = e.deltaY < 0 ? k * zoomFactor : k / zoomFactor;
    const clampedK = Math.max(0.2, Math.min(newK, 3));
    const newX = point.x - (point.x - x) * (clampedK / k);
    const newY = point.y - (point.y - y) * (clampedK / k);
    setTransform({ k: clampedK, x: newX, y: newY });
  }, [transform]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isPanning.current = true;
    startPoint.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    if (svgRef.current) svgRef.current.style.cursor = 'grabbing';
  }, [transform.x, transform.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    e.preventDefault();
    setTransform(t => ({ ...t, x: e.clientX - startPoint.current.x, y: e.clientY - startPoint.current.y }));
  }, []);

  const handleMouseUpOrLeave = useCallback(() => {
    isPanning.current = false;
    if (svgRef.current) svgRef.current.style.cursor = 'grab';
  }, []);
  
  const zoom = useCallback((direction: 'in' | 'out') => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const point = { x: rect.width / 2, y: rect.height / 2 };
    const { k, x, y } = transform;
    const zoomFactor = 1.3;
    const newK = direction === 'in' ? k * zoomFactor : k / zoomFactor;
    const clampedK = Math.max(0.2, Math.min(newK, 3));
    const newX = point.x - (point.x - x) * (clampedK / k);
    const newY = point.y - (point.y - y) * (clampedK / k);
    setTransform({ k: clampedK, x: newX, y: newY });
  }, [transform]);

  const resetTransform = useCallback(() => {
    setTransform({ k: 1, x: 0, y: 0 });
  }, []);
  
  const handleCopy = useCallback(() => {
    const jsonString = JSON.stringify(architecture, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [architecture]);

  // Função para criar partículas de dados (otimizada)
  const createDataParticles = useCallback(() => {
    const newParticles: DataParticle[] = [];
    const colors = ['#8B5CF6', '#06B6D4', '#10B981'];
    
    // Limita o número de edges para performance
    const limitedEdges = edges.slice(0, performanceMode ? 10 : edges.length);
    
    limitedEdges.forEach((edge, edgeIndex) => {
      // Só cria partículas se não exceder o limite
      if (newParticles.length >= MAX_PARTICLES_TOTAL) return;
      
      const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathElement.setAttribute('d', edge.path);
      
      newParticles.push({
        id: `${edge.id}_particle`,
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        progress: Math.random() * 0.3, // Posição inicial aleatória
        path: edge.path,
        speed: performanceMode ? 1 : 0.8 + Math.random() * 0.4,
        color: colors[edgeIndex % colors.length]
      });
    });
    
    setParticles(newParticles);
  }, [edges, performanceMode]);

  // Função para animar partículas
  const animateParticles = useCallback(() => {
    setParticles(prevParticles => 
      prevParticles.map(particle => {
        const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathElement.setAttribute('d', particle.path);
        const pathLength = pathElement.getTotalLength();
        
        let newProgress = particle.progress + (particle.speed / 100) * animationSpeed;
        if (newProgress > 1) newProgress = 0; // Loop
        
        const point = pathElement.getPointAtLength(newProgress * pathLength);
        
        return {
          ...particle,
          progress: newProgress,
          x: point.x,
          y: point.y
        };
      })
    );
  }, [animationSpeed]);

  // Função para iniciar/parar animação
  const toggleAnimation = useCallback(() => {
    if (isAnimating) {
      setIsAnimating(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      setIsAnimating(true);
      createDataParticles();
    }
  }, [isAnimating, createDataParticles]);

  // Loop de animação com throttling
  useEffect(() => {
    if (isAnimating) {
      const animate = () => {
        frameCount.current++;
        
        // Throttling: atualiza apenas a cada 2-3 frames no modo performance
        const skipFrames = performanceMode ? 2 : 1;
        if (frameCount.current % skipFrames === 0) {
          animateParticles();
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, animateParticles, performanceMode]);

  // Função para mostrar tooltip
  const showTooltip = useCallback((event: React.MouseEvent, layer: Layer) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const details = getLayerDetails(layer);
    const neuronCount = getNeuronCount(layer);
    
    const content = [
      `Tipo: ${layer.type}`,
      neuronCount > 0 ? `Neurônios: ${neuronCount}` : '',
      ...details,
      layer.inputs?.length ? `Entradas: ${layer.inputs.join(', ')}` : ''
    ].filter(Boolean);
    
    setTooltip({
      visible: true,
      x: event.clientX - rect.left + 10,
      y: event.clientY - rect.top - 10,
      content,
      title: layer.name
    });
    setHoveredLayer(layer.name);
    onLayerHover?.(layer.name);
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
    setHoveredLayer(null);
    onLayerHover?.(null);
  }, [onLayerHover]);

  const nodeColors = LAYER_COLORS['Dense'];

  return (
    <div className="relative w-full min-h-[500px] flex items-center justify-center bg-gray-900 rounded-b-xl overflow-hidden">
       <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        style={{ cursor: 'grab' }}
        className="rounded-b-xl"
      >
        <defs>
          {/* Gradientes para as conexões */}
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(192, 132, 252, 0.1)" />
            <stop offset="50%" stopColor="rgba(192, 132, 252, 0.4)" />
            <stop offset="100%" stopColor="rgba(192, 132, 252, 0.1)" />
          </linearGradient>
          
          {/* Filtros para efeitos de brilho */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {/* Conexões da rede com gradiente */}
          {edges.map((edge, index) => (
             <path 
               key={edge.id} 
               d={edge.path} 
               fill="none" 
               stroke={isAnimating ? "url(#connectionGradient)" : "rgba(192, 132, 252, 0.2)"} 
               strokeWidth={isAnimating ? "1.5" : "1"}
               className="transition-all duration-300"
               filter={isAnimating ? "url(#glow)" : "none"}
             />
          ))}
          
          {/* Partículas animadas (otimizadas) */}
          {particles.map(particle => (
            <g key={particle.id}>
              {/* Trilha da partícula - só no modo normal */}
              {!performanceMode && (
                <circle
                  cx={particle.x}
                  cy={particle.y}
                  r="6"
                  fill={particle.color}
                  opacity="0.2"
                  className="animate-ping"
                />
              )}
              {/* Partícula principal */}
              <circle
                cx={particle.x}
                cy={particle.y}
                r={performanceMode ? "2" : "3"}
                fill={particle.color}
                opacity="0.8"
                filter={performanceMode ? "none" : "url(#glow)"}
              >
                {!performanceMode && (
                  <>
                    <animate
                      attributeName="r"
                      values="2;4;2"
                      dur={`${2 / animationSpeed}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.6;1;0.6"
                      dur={`${1.5 / animationSpeed}s`}
                      repeatCount="indefinite"
                    />
                  </>
                )}
              </circle>
            </g>
          ))}
          
          {/* Labels das camadas */}
          {labels.map(label => (
            <text 
              key={label.id} 
              x={label.x} 
              y={label.y} 
              textAnchor="middle" 
              fontWeight="bold" 
              fontSize="14px" 
              fill="#FFFFFF" 
              className="select-none"
            >
              {label.text}
            </text>
          ))}
          
          {/* Renderização das camadas */}
          {items.map(item => {
              if(item.type === 'nodes') {
                  return (
                      <g key={item.layer.name}>
                        {item.nodes.map(node => (
                            <circle 
                              key={node.id} 
                              cx={node.cx} 
                              cy={node.cy} 
                              r={NODE_RADIUS} 
                              fill={hoveredLayer === item.layer.name ? nodeColors.stroke : nodeColors.fill} 
                              stroke={nodeColors.stroke} 
                              strokeWidth={hoveredLayer === item.layer.name ? "2.5" : "1.5"}
                              className="transition-all duration-200 cursor-pointer"
                              onMouseEnter={(e) => showTooltip(e, item.layer)}
                              onMouseLeave={hideTooltip}
                            />
                        ))}
                        {item.isTruncated && (
                            <text x={item.x + NODE_RADIUS} y={item.y + item.height + 20} textAnchor="middle" fontSize="11px" fill="#D1D5DB" className="select-none">...</text>
                        )}
                      </g>
                  )
              }
              // Render as block
              const colors = getLayerColor(item.layer.type);
              const details = getLayerDetails(item.layer);
              const isHovered = hoveredLayer === item.layer.name;
              
              return (
                <g key={item.layer.name} transform={`translate(${item.x}, ${item.y})`}>
                  <rect 
                    width={item.width} 
                    height={item.height} 
                    rx="8" 
                    ry="8" 
                    fill={isHovered ? colors.stroke + '20' : colors.fill} 
                    stroke={colors.stroke} 
                    strokeWidth={isHovered ? "2.5" : "1.5"}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={(e) => showTooltip(e, item.layer)}
                    onMouseLeave={hideTooltip}
                  />
                  <text x={item.width/2} y="25" textAnchor="middle" fontWeight="bold" fontSize="14px" fill="#FFFFFF" className="select-none pointer-events-none">{item.layer.type}</text>
                  <line x1="10" y1="38" x2={item.width - 10} y2="38" stroke={colors.stroke} strokeWidth="0.5" opacity="0.5" className="pointer-events-none" />
                  {details.map((detail, index) => (
                      <text key={index} x={item.width/2} y={55 + index * 16} textAnchor="middle" fontSize="11px" fill="#D1D5DB" className="select-none pointer-events-none">{detail}</text>
                  ))}
                </g>
              );
          })}
        </g>
       </svg>
      {/* Controles de zoom e animação */}
      <div className="absolute top-3 right-3 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 flex flex-col items-center shadow-lg">
        <button onClick={() => zoom('in')} title="Ampliar" className="p-2 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-t-md"><PlusIcon className="w-5 h-5" /></button>
        <button onClick={() => zoom('out')} title="Reduzir" className="p-2 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"><MinusIcon className="w-5 h-5" /></button>
        <div className="w-full h-px bg-gray-700"></div>
        <button onClick={resetTransform} title="Redefinir Visualização" className="p-2 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"><ResetIcon className="w-5 h-5" /></button>
        <div className="w-full h-px bg-gray-700"></div>
        <button 
          onClick={toggleAnimation} 
          title={isAnimating ? "Parar Animação" : "Iniciar Animação de Fluxo"} 
          className={`p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-b-md ${
            isAnimating ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            {isAnimating ? (
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            )}
          </svg>
        </button>
      </div>
      
      {/* Painel de configurações */}
      <div className="absolute top-3 left-3 flex space-x-2">
        <button
          onClick={() => setShowSettings(!showSettings)}
          title="Configurações"
          className="p-2 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>
        
        {showSettings && (
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700 p-4 text-white text-sm min-w-64">
            <div className="font-semibold mb-3">Configurações de Animação</div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs">Modo Performance:</span>
                <button
                  onClick={() => setPerformanceMode(!performanceMode)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    performanceMode 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {performanceMode ? 'Leve' : 'Normal'}
                </button>
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Velocidade: {animationSpeed.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="3"
                  step="0.1"
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.2x</span>
                  <span>3x</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs">Partículas ativas:</span>
                <span className="text-xs text-gray-400">{particles.length}/{MAX_PARTICLES_TOTAL}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs">Status:</span>
                <span className={`text-xs ${isAnimating ? 'text-green-400' : 'text-gray-400'}`}>
                  {isAnimating ? 'Ativo' : 'Pausado'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="absolute top-3 right-52">
        <button
            onClick={handleCopy}
            title="Copiar JSON da Arquitetura"
            className="flex items-center space-x-2 px-3 py-1.5 text-xs font-semibold text-white bg-gray-800/50 backdrop-blur-sm rounded-md border border-gray-700 hover:bg-gray-700/80 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transition-all duration-200"
          >
            <CopyIcon className="w-4 h-4" />
            <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
        </button>
      </div>
      
      {/* Tooltip interativo */}
      {tooltip.visible && (
        <div 
          className="absolute z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-3 max-w-xs pointer-events-none"
          style={{ 
            left: tooltip.x, 
            top: tooltip.y,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="text-white font-semibold text-sm mb-2">{tooltip.title}</div>
          <div className="space-y-1">
            {tooltip.content.map((line, index) => (
              <div key={index} className="text-gray-300 text-xs">{line}</div>
            ))}
          </div>
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
      
      {/* Painel de informações da rede */}
      <div className="absolute bottom-3 left-3 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-3 text-white text-xs">
        <div className="font-semibold mb-2">Estatísticas da Rede</div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Camadas:</span>
            <span className="text-blue-400">{architecture.layers.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Parâmetros:</span>
            <span className="text-green-400">
              {architecture.layers.reduce((sum, layer) => sum + (layer.neurons || 0), 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Conexões:</span>
            <span className="text-purple-400">{edges.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Partículas:</span>
            <span className="text-yellow-400">{particles.length}</span>
          </div>
          {isAnimating && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400">Simulando fluxo ({animationSpeed.toFixed(1)}x)</span>
              </div>
            </div>
          )}
          {hoveredLayer && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="text-cyan-400">📍 {hoveredLayer}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};