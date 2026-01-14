/**
 * 🎨 Robotics Overlay Component
 * Mostra bounding boxes e detecções na tela em tempo real
 */

import React, { useState, useEffect } from 'react';

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

interface RoboticsOverlayProps {
  enabled: boolean;
  targetItems?: string;
  detectType?: '2D bounding boxes' | 'Points';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function RoboticsOverlay({
  enabled,
  targetItems = 'buttons',
  detectType = '2D bounding boxes',
  autoRefresh = false,
  refreshInterval = 5000
}: RoboticsOverlayProps) {
  const [boxes, setBoxes] = useState<BoundingBox[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectElements = async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      if (detectType === '2D bounding boxes') {
        const response = await fetch('http://localhost:3001/api/robotics/detect-2d', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetItems,
            maxItems: 20,
            enableThinking: false
          })
        });

        const data = await response.json();
        if (data.success) {
          setBoxes(data.boxes);
        }
      } else {
        const response = await fetch('http://localhost:3001/api/robotics/detect-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetItems,
            maxItems: 20,
            enableThinking: false
          })
        });

        const data = await response.json();
        if (data.success) {
          setPoints(data.points);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (enabled) {
      detectElements();
    } else {
      setBoxes([]);
      setPoints([]);
    }
  }, [enabled, targetItems, detectType]);

  useEffect(() => {
    if (enabled && autoRefresh) {
      const interval = setInterval(detectElements, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [enabled, autoRefresh, refreshInterval]);

  if (!enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Bounding Boxes */}
      {detectType === '2D bounding boxes' && boxes.map((box, i) => (
        <div
          key={i}
          className="absolute border-2 border-purple-500 bg-purple-500/10 pointer-events-auto cursor-pointer hover:bg-purple-500/20 transition-colors"
          style={{
            left: `${box.x * 100}%`,
            top: `${box.y * 100}%`,
            width: `${box.width * 100}%`,
            height: `${box.height * 100}%`,
          }}
          title={box.label}
        >
          <div className="absolute -top-6 left-0 bg-purple-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {box.label}
          </div>
        </div>
      ))}

      {/* Points */}
      {detectType === 'Points' && points.map((point, i) => (
        <div
          key={i}
          className="absolute pointer-events-auto"
          style={{
            left: `${point.x * 100}%`,
            top: `${point.y * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="w-4 h-4 bg-teal-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {point.label}
          </div>
        </div>
      ))}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute top-4 right-4 bg-gray-900/90 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Detectando...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute top-4 right-4 bg-red-900/90 text-white px-4 py-2 rounded-lg">
          ❌ {error}
        </div>
      )}

      {/* Stats */}
      {!isLoading && !error && (boxes.length > 0 || points.length > 0) && (
        <div className="absolute bottom-4 right-4 bg-gray-900/90 text-white px-4 py-2 rounded-lg">
          🤖 {detectType === '2D bounding boxes' ? boxes.length : points.length} elementos detectados
        </div>
      )}
    </div>
  );
}
