import React, { useRef, useEffect, useState } from 'react';
import { NetworkArchitecture } from '../types';

interface WeightMatrixVisualizerProps {
  architecture: NetworkArchitecture;
}

interface WeightMatrix {
  layerName: string;
  weights: number[][];
  biases: number[];
  inputSize: number;
  outputSize: number;
}

export const WeightMatrixVisualizer: React.FC<WeightMatrixVisualizerProps> = ({ architecture }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [matrices, setMatrices] = useState<WeightMatrix[]>([]);
  const [selectedMatrix, setSelectedMatrix] = useState(0);
  const [hoveredCell, setHoveredCell] = useState<{row: number, col: number} | null>(null);
  const [colorScheme, setColorScheme] = useState<'viridis' | 'plasma' | 'coolwarm'>('viridis');
  const [showBiases, setShowBiases] = useState(true);
  const [zoom, setZoom] = useState(1);

  // Gerar matrizes de pesos sintéticas
  const generateWeightMatrices = () => {
    const newMatrices: WeightMatrix[] = [];
    
    architecture.layers.forEach((layer, index) => {
      if (layer.type === 'Dense' && layer.neurons) {
        const prevLayer = architecture.layers[index - 1];
        const inputSize = prevLayer?.neurons || prevLayer?.shape?.[0] || 784; // Default para MNIST
        const outputSize = layer.neurons;
        
        // Gerar pesos aleatórios (simulação)
        const weights: number[][] = [];
        for (let i = 0; i < inputSize; i++) {
          weights[i] = [];
          for (let j = 0; j < outputSize; j++) {
            // Inicialização Xavier/Glorot
            const limit = Math.sqrt(6 / (inputSize + outputSize));
            weights[i][j] = (Math.random() * 2 - 1) * limit;
          }
        }
        
        // Gerar biases
        const biases = Array.from({ length: outputSize }, () => Math.random() * 0.2 - 0.1);
        
        newMatrices.push({
          layerName: layer.name,
          weights,
          biases,
          inputSize,
          outputSize
        });
      }
    });
    
    setMatrices(newMatrices);
  };

  // Esquemas de cores
  const getColor = (value: number, scheme: string) => {
    // Normalizar valor para [0, 1]
    const normalized = Math.max(0, Math.min(1, (value + 1) / 2));
    
    switch (scheme) {
      case 'viridis':
        return viridisColor(normalized);
      case 'plasma':
        return plasmaColor(normalized);
      case 'coolwarm':
        return coolwarmColor(normalized);
      default:
        return viridisColor(normalized);
    }
  };

  const viridisColor = (t: number): string => {
    const r = Math.round(255 * (0.267004 + t * (0.127568 + t * (-0.24506 + t * 0.657010))));
    const g = Math.round(255 * (0.004874 + t * (0.221570 + t * (0.319340 + t * (-0.525960)))));
    const b = Math.round(255 * (0.329415 + t * (0.791663 + t * (-0.882202 + t * 0.746842))));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const plasmaColor = (t: number): string => {
    const r = Math.round(255 * (0.050383 + t * (0.796723 + t * (0.280271 + t * (-0.242654)))));
    const g = Math.round(255 * (0.029803 + t * (0.166383 + t * (0.477618 + t * (0.821444)))));
    const b = Math.round(255 * (0.527975 + t * (0.291582 + t * (-0.517648 + t * 0.434154))));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const coolwarmColor = (t: number): string => {
    const r = Math.round(255 * (0.230 + t * (0.299 + t * (0.754 + t * 0.498))));
    const g = Math.round(255 * (0.299 + t * (0.718 + t * (-0.827 + t * 0.330))));
    const b = Math.round(255 * (0.754 + t * (-0.827 + t * (0.330 + t * 0.226))));
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Renderizar matriz
  const render = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || matrices.length === 0) return;

    const matrix = matrices[selectedMatrix];
    if (!matrix) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calcular dimensões das células
    const padding = 40;
    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2 - (showBiases ? 30 : 0);
    
    const cellWidth = Math.max(2, Math.min(20, availableWidth / matrix.outputSize)) * zoom;
    const cellHeight = Math.max(2, Math.min(20, availableHeight / matrix.inputSize)) * zoom;
    
    const matrixWidth = cellWidth * matrix.outputSize;
    const matrixHeight = cellHeight * matrix.inputSize;
    
    const startX = (canvas.width - matrixWidth) / 2;
    const startY = (canvas.height - matrixHeight - (showBiases ? 30 : 0)) / 2;

    // Renderizar matriz de pesos
    for (let i = 0; i < matrix.inputSize; i++) {
      for (let j = 0; j < matrix.outputSize; j++) {
        const weight = matrix.weights[i][j];
        const x = startX + j * cellWidth;
        const y = startY + i * cellHeight;
        
        // Cor baseada no peso
        ctx.fillStyle = getColor(weight, colorScheme);
        ctx.fillRect(x, y, cellWidth, cellHeight);
        
        // Borda para células grandes
        if (cellWidth > 10 && cellHeight > 10) {
          ctx.strokeStyle = '#374151';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, cellWidth, cellHeight);
        }
        
        // Highlight célula sob o mouse
        if (hoveredCell && hoveredCell.row === i && hoveredCell.col === j) {
          ctx.strokeStyle = '#FBBF24';
          ctx.lineWidth = 2;
          ctx.strokeRect(x - 1, y - 1, cellWidth + 2, cellHeight + 2);
        }
      }
    }

    // Renderizar biases se habilitado
    if (showBiases) {
      const biasY = startY + matrixHeight + 10;
      const biasHeight = 20;
      
      for (let j = 0; j < matrix.outputSize; j++) {
        const bias = matrix.biases[j];
        const x = startX + j * cellWidth;
        
        ctx.fillStyle = getColor(bias, colorScheme);
        ctx.fillRect(x, biasY, cellWidth, biasHeight);
        
        if (cellWidth > 10) {
          ctx.strokeStyle = '#374151';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, biasY, cellWidth, biasHeight);
        }
      }
      
      // Label para biases
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('Biases:', startX - 10, biasY + 15);
    }

    // Labels dos eixos
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    
    // Label X (Output neurons)
    ctx.fillText(`Output Neurons (${matrix.outputSize})`, canvas.width / 2, canvas.height - 10);
    
    // Label Y (Input neurons)
    ctx.save();
    ctx.translate(15, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`Input Neurons (${matrix.inputSize})`, 0, 0);
    ctx.restore();

    // Título da matriz
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Weight Matrix: ${matrix.layerName}`, canvas.width / 2, 25);

    // Estatísticas
    const weights = matrix.weights.flat();
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const meanWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
    const stdWeight = Math.sqrt(weights.reduce((a, b) => a + Math.pow(b - meanWeight, 2), 0) / weights.length);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Min: ${minWeight.toFixed(4)}`, 10, canvas.height - 60);
    ctx.fillText(`Max: ${maxWeight.toFixed(4)}`, 10, canvas.height - 45);
    ctx.fillText(`Mean: ${meanWeight.toFixed(4)}`, 10, canvas.height - 30);
    ctx.fillText(`Std: ${stdWeight.toFixed(4)}`, 10, canvas.height - 15);

    // Informação da célula sob o mouse
    if (hoveredCell) {
      const weight = matrix.weights[hoveredCell.row][hoveredCell.col];
      const mouseInfo = `Weight[${hoveredCell.row}, ${hoveredCell.col}] = ${weight.toFixed(6)}`;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(canvas.width - 250, 10, 240, 30);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(mouseInfo, canvas.width - 245, 30);
    }
  };

  // Event handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || matrices.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const matrix = matrices[selectedMatrix];
    if (!matrix) return;

    // Calcular posição na matriz
    const padding = 40;
    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2 - (showBiases ? 30 : 0);
    
    const cellWidth = Math.max(2, Math.min(20, availableWidth / matrix.outputSize)) * zoom;
    const cellHeight = Math.max(2, Math.min(20, availableHeight / matrix.inputSize)) * zoom;
    
    const matrixWidth = cellWidth * matrix.outputSize;
    const matrixHeight = cellHeight * matrix.inputSize;
    
    const startX = (canvas.width - matrixWidth) / 2;
    const startY = (canvas.height - matrixHeight - (showBiases ? 30 : 0)) / 2;

    const col = Math.floor((mouseX - startX) / cellWidth);
    const row = Math.floor((mouseY - startY) / cellHeight);

    if (col >= 0 && col < matrix.outputSize && row >= 0 && row < matrix.inputSize) {
      setHoveredCell({ row, col });
    } else {
      setHoveredCell(null);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  };

  // Effects
  useEffect(() => {
    generateWeightMatrices();
  }, [architecture]);

  useEffect(() => {
    render();
  }, [matrices, selectedMatrix, hoveredCell, colorScheme, showBiases, zoom]);

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Controles */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
        {/* Seletor de matriz */}
        <select
          value={selectedMatrix}
          onChange={(e) => setSelectedMatrix(parseInt(e.target.value))}
          className="px-2 py-1 text-xs bg-gray-700 text-white rounded border border-gray-600"
        >
          {matrices.map((matrix, index) => (
            <option key={index} value={index}>
              {matrix.layerName} ({matrix.inputSize}×{matrix.outputSize})
            </option>
          ))}
        </select>

        {/* Esquema de cores */}
        <select
          value={colorScheme}
          onChange={(e) => setColorScheme(e.target.value as any)}
          className="px-2 py-1 text-xs bg-gray-700 text-white rounded border border-gray-600"
        >
          <option value="viridis">Viridis</option>
          <option value="plasma">Plasma</option>
          <option value="coolwarm">Cool-Warm</option>
        </select>

        {/* Toggle biases */}
        <label className="flex items-center gap-1 text-xs text-white">
          <input
            type="checkbox"
            checked={showBiases}
            onChange={(e) => setShowBiases(e.target.checked)}
            className="rounded"
          />
          Show Biases
        </label>

        {/* Zoom */}
        <div className="flex items-center gap-1 text-xs text-white">
          <span>Zoom:</span>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-16"
          />
          <span>{zoom.toFixed(1)}x</span>
        </div>
      </div>

      {/* Barra de cores */}
      <div className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur-sm rounded-lg p-3">
        <div className="text-xs text-white mb-2 text-center">Weight Scale</div>
        <div className="flex flex-col gap-1">
          {Array.from({ length: 10 }, (_, i) => {
            const value = (i / 9) * 2 - 1; // -1 to 1
            return (
              <div key={i} className="flex items-center gap-2">
                <div 
                  className="w-4 h-3 border border-gray-600"
                  style={{ backgroundColor: getColor(value, colorScheme) }}
                />
                <span className="text-xs text-white font-mono w-12">
                  {value.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Instruções */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/50 backdrop-blur-sm rounded-lg p-2 text-xs text-white">
        <div>🖱️ Hover for weight values</div>
        <div>🔍 Scroll to zoom</div>
        <div>🎨 Change color scheme above</div>
      </div>
    </div>
  );
};