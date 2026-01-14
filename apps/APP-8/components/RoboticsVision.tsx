/**
 * 🤖 Robotics Vision Component
 * Interface para detecção avançada de objetos usando Gemini Robotics
 */

import React, { useState } from 'react';

type DetectType = '2D bounding boxes' | 'Points' | 'Segmentation masks';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

interface Point {
  x: number;
  y: number;
  label: string;
}

export function RoboticsVision() {
  const [detectType, setDetectType] = useState<DetectType>('2D bounding boxes');
  const [targetItems, setTargetItems] = useState('');
  const [enableThinking, setEnableThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDetect = async () => {
    if (!targetItems.trim()) {
      setError('Digite o que você quer detectar');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      let endpoint = '';
      
      if (detectType === '2D bounding boxes') {
        endpoint = '/api/robotics/detect-2d';
      } else if (detectType === 'Points') {
        endpoint = '/api/robotics/detect-points';
      } else {
        endpoint = '/api/robotics/detect-masks';
      }

      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetItems,
          maxItems: 20,
          enableThinking
        })
      });

      const data = await response.json();

      if (data.success) {
        setResults(data);
      } else {
        setError(data.error || 'Erro ao detectar objetos');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindAndClick = async () => {
    if (!targetItems.trim()) {
      setError('Digite o que você quer encontrar');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/robotics/find-and-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetItem: targetItems,
          detectType,
          enableThinking
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Clicado em "${data.label}" na posição (${data.clicked?.x}, ${data.clicked?.y})`);
      } else if (!data.found) {
        alert(`❌ "${targetItems}" não encontrado na tela`);
      } else {
        setError('Erro ao clicar no objeto');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-gray-900 rounded-lg">
      <h2 className="text-2xl font-bold text-purple-400">🤖 Robotics Vision</h2>
      
      {/* Tipo de Detecção */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-300">Tipo de Detecção:</label>
        <div className="flex gap-2">
          {(['2D bounding boxes', 'Points', 'Segmentation masks'] as DetectType[]).map((type) => (
            <button
              key={type}
              onClick={() => setDetectType(type)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                detectType === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              disabled={isLoading}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-300">
          O que você quer detectar?
        </label>
        <input
          type="text"
          value={targetItems}
          onChange={(e) => setTargetItems(e.target.value)}
          placeholder="Ex: buttons, icons, text fields"
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isLoading) {
              handleDetect();
            }
          }}
        />
      </div>

      {/* Thinking Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="thinking"
          checked={enableThinking}
          onChange={(e) => setEnableThinking(e.target.checked)}
          disabled={isLoading}
          className="w-4 h-4"
        />
        <label htmlFor="thinking" className="text-sm text-gray-300">
          Habilitar pensamento (mais lento, mas mais preciso)
        </label>
      </div>

      {/* Botões */}
      <div className="flex gap-3">
        <button
          onClick={handleDetect}
          disabled={isLoading || !targetItems.trim()}
          className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
        >
          {isLoading ? '🔄 Detectando...' : '🔍 Detectar'}
        </button>
        
        <button
          onClick={handleFindAndClick}
          disabled={isLoading || !targetItems.trim()}
          className="flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
        >
          {isLoading ? '🔄 Procurando...' : '🎯 Encontrar e Clicar'}
        </button>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          ❌ {error}
        </div>
      )}

      {/* Resultados */}
      {results && (
        <div className="flex flex-col gap-3 p-4 bg-gray-800 rounded-lg">
          <div className="text-lg font-semibold text-green-400">
            ✅ Detectados {results.count} objetos
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {detectType === '2D bounding boxes' && results.boxes?.map((box: BoundingBox, i: number) => (
              <div key={i} className="p-3 mb-2 bg-gray-700 rounded text-sm">
                <div className="font-semibold text-purple-300">{box.label}</div>
                <div className="text-gray-400 text-xs">
                  Position: ({(box.x * 100).toFixed(1)}%, {(box.y * 100).toFixed(1)}%)
                  <br />
                  Size: {(box.width * 100).toFixed(1)}% × {(box.height * 100).toFixed(1)}%
                </div>
              </div>
            ))}
            
            {detectType === 'Points' && results.points?.map((point: Point, i: number) => (
              <div key={i} className="p-3 mb-2 bg-gray-700 rounded text-sm">
                <div className="font-semibold text-purple-300">{point.label}</div>
                <div className="text-gray-400 text-xs">
                  Point: ({(point.x * 100).toFixed(1)}%, {(point.y * 100).toFixed(1)}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
