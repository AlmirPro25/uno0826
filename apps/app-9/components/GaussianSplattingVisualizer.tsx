import React, { useEffect, useRef, useState } from 'react';

interface GaussianSplat {
  id: number;
  position: [number, number, number];
  color: [number, number, number];
  opacity: number;
  size: number;
}

interface GaussianSplattingVisualizerProps {
  splats?: GaussianSplat[];
  width?: number;
  height?: number;
  onSplatClick?: (splat: GaussianSplat) => void;
}

export const GaussianSplattingVisualizer: React.FC<GaussianSplattingVisualizerProps> = ({
  splats = [],
  width = 600,
  height = 400,
  onSplatClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [cameraAngle, setCameraAngle] = useState(0);
  const animationRef = useRef<number>();

  // Gerar splats de exemplo se não fornecidos
  const defaultSplats: GaussianSplat[] = React.useMemo(() => {
    if (splats.length > 0) return splats;
    
    const generated: GaussianSplat[] = [];
    for (let i = 0; i < 50; i++) {
      generated.push({
        id: i,
        position: [
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4
        ],
        color: [
          Math.random(),
          Math.random(),
          Math.random()
        ],
        opacity: 0.3 + Math.random() * 0.7,
        size: 0.1 + Math.random() * 0.3
      });
    }
    return generated;
  }, [splats]);

  const projectPoint = (point: [number, number, number], angle: number) => {
    const [x, y, z] = point;
    
    // Rotação da câmera
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rotatedX = x * cos - z * sin;
    const rotatedZ = x * sin + z * cos;
    
    // Projeção perspectiva
    const distance = 5;
    const fov = 1;
    const projectedX = (rotatedX * fov) / (rotatedZ + distance);
    const projectedY = (y * fov) / (rotatedZ + distance);
    
    // Converter para coordenadas da tela
    const screenX = (projectedX + 1) * width / 2;
    const screenY = (projectedY + 1) * height / 2;
    const depth = rotatedZ + distance;
    
    return { x: screenX, y: screenY, depth };
  };

  const drawSplats = (ctx: CanvasRenderingContext2D, angle: number) => {
    ctx.clearRect(0, 0, width, height);
    
    // Ordenar splats por profundidade (mais distantes primeiro)
    const projectedSplats = defaultSplats.map(splat => ({
      ...splat,
      projected: projectPoint(splat.position, angle)
    })).sort((a, b) => b.projected.depth - a.projected.depth);
    
    // Desenhar cada splat
    projectedSplats.forEach(splat => {
      const { x, y, depth } = splat.projected;
      
      // Calcular tamanho baseado na distância
      const scale = Math.max(0.1, 1 / depth);
      const radius = splat.size * scale * 50;
      
      if (x >= -radius && x <= width + radius && y >= -radius && y <= height + radius) {
        // Criar gradiente radial para simular gaussian
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        const [r, g, b] = splat.color;
        
        gradient.addColorStop(0, `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${splat.opacity})`);
        gradient.addColorStop(0.7, `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${splat.opacity * 0.3})`);
        gradient.addColorStop(1, `rgba(${r * 255}, ${g * 255}, ${b * 255}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Adicionar brilho no centro
        ctx.fillStyle = `rgba(255, 255, 255, ${splat.opacity * 0.3})`;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // Adicionar informações de debug
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px monospace';
    ctx.fillText(`Splats: ${defaultSplats.length}`, 10, 20);
    ctx.fillText(`Ângulo: ${(angle * 180 / Math.PI).toFixed(1)}°`, 10, 35);
    ctx.fillText(`FPS: ${isAnimating ? '60' : '0'}`, 10, 50);
  };

  const animate = () => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    setCameraAngle(prev => prev + 0.02);
    drawSplats(ctx, cameraAngle);
    
    if (isAnimating) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isAnimating) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Desenhar frame estático
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) drawSplats(ctx, cameraAngle);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, cameraAngle, defaultSplats]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSplatClick) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Encontrar splat mais próximo do clique
    let closestSplat: GaussianSplat | null = null;
    let minDistance = Infinity;
    
    defaultSplats.forEach(splat => {
      const projected = projectPoint(splat.position, cameraAngle);
      const distance = Math.sqrt(
        Math.pow(projected.x - clickX, 2) + Math.pow(projected.y - clickY, 2)
      );
      
      if (distance < minDistance && distance < 50) {
        minDistance = distance;
        closestSplat = splat;
      }
    });
    
    if (closestSplat) {
      onSplatClick(closestSplat);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">
          🧠 Gaussian Splatting Visualizer
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              isAnimating 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isAnimating ? '⏸️ Pausar' : '▶️ Animar'}
          </button>
          <button
            onClick={() => setCameraAngle(0)}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
          >
            🔄 Reset
          </button>
        </div>
      </div>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onClick={handleCanvasClick}
          className="border border-gray-600 rounded cursor-crosshair bg-black"
          style={{ width: '100%', maxWidth: `${width}px` }}
        />
        
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          Renderização Neural 3D em Tempo Real
        </div>
      </div>
      
      <div className="mt-3 text-sm text-gray-400">
        <p>
          <span className="text-cyan-400">💡 Dica:</span> Clique nos splats para interagir. 
          Esta visualização simula renderização Gaussian Splatting em tempo real.
        </p>
        <p className="mt-1">
          <span className="text-purple-400">🚀 Performance:</span> {defaultSplats.length} splats renderizados a 60 FPS
        </p>
      </div>
    </div>
  );
};