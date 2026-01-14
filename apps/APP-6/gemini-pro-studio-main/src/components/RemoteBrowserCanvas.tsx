/**
 * 🖥️ REMOTE BROWSER CANVAS
 * Canvas interativo que espelha navegador Playwright do backend
 */

import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface RemoteBrowserCanvasProps {
  url?: string;
  onUrlChange?: (url: string) => void;
  onClose?: () => void;
}

export const RemoteBrowserCanvas: React.FC<RemoteBrowserCanvasProps> = ({
  url = 'https://www.google.com',
  onUrlChange,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [viewport, setViewport] = useState({ width: 1366, height: 768 });
  const [currentUrl, setCurrentUrl] = useState(url);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fps, setFps] = useState(0);
  
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());

  useEffect(() => {
    // Conectar ao backend
    const socket = io('http://localhost:3002', {
      transports: ['websocket'],
      reconnection: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Conectado ao backend');
      setIsConnected(true);

      // Criar sessão de navegador remoto
      socket.emit('browser:create', {
        url,
        viewport,
        fps: 10,
        headless: true
      }, (response: any) => {
        if (response.success) {
          console.log('✅ Sessão criada:', response);
          setViewport(response.viewport);
          setCurrentUrl(response.url);
          setIsLoading(false);
        } else {
          console.error('❌ Erro ao criar sessão:', response.error);
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('🔌 Desconectado do backend');
      setIsConnected(false);
    });

    // Receber frames
    socket.on('browser:frame', (data: ArrayBuffer) => {
      drawFrame(data);
      
      // Calcular FPS
      frameCountRef.current++;
      const now = Date.now();
      if (now - lastFpsUpdateRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }
    });

    // Receber metadados
    socket.on('browser:metadata', (metadata: any) => {
      console.log('📊 Metadados:', metadata);
      setCurrentUrl(metadata.url);
      if (onUrlChange) {
        onUrlChange(metadata.url);
      }
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, []);

  // Desenhar frame no canvas
  const drawFrame = async (data: ArrayBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      // Converter ArrayBuffer para Blob
      const blob = new Blob([data], { type: 'image/jpeg' });
      
      // Criar ImageBitmap (GPU-accelerated)
      const imageBitmap = await createImageBitmap(blob);
      
      // Desenhar no canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
      
      // Liberar memória
      imageBitmap.close();
    } catch (error) {
      console.error('❌ Erro ao desenhar frame:', error);
    }
  };

  // Converter coordenadas do canvas para viewport
  const toViewportCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const xCanvas = clientX - rect.left;
    const yCanvas = clientY - rect.top;

    const xReal = (xCanvas / canvas.width) * viewport.width;
    const yReal = (yCanvas / canvas.height) * viewport.height;

    return {
      x: Math.round(xReal),
      y: Math.round(yReal)
    };
  };

  // Enviar evento de input
  const sendInput = (inputEvent: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('browser:input', inputEvent);
    }
  };

  // Handlers de mouse
  const handlePointerMove = (e: React.PointerEvent) => {
    const coords = toViewportCoords(e.clientX, e.clientY);
    sendInput({
      inputType: 'mouse',
      event: 'move',
      x: coords.x,
      y: coords.y
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const coords = toViewportCoords(e.clientX, e.clientY);
    sendInput({
      inputType: 'mouse',
      event: 'down',
      x: coords.x,
      y: coords.y,
      button: e.button === 0 ? 'left' : e.button === 2 ? 'right' : 'middle'
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const coords = toViewportCoords(e.clientX, e.clientY);
    sendInput({
      inputType: 'mouse',
      event: 'up',
      x: coords.x,
      y: coords.y,
      button: e.button === 0 ? 'left' : e.button === 2 ? 'right' : 'middle'
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    const coords = toViewportCoords(e.clientX, e.clientY);
    sendInput({
      inputType: 'mouse',
      event: 'click',
      x: coords.x,
      y: coords.y,
      button: 'left'
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    sendInput({
      inputType: 'mouse',
      event: 'wheel',
      deltaX: e.deltaX,
      deltaY: e.deltaY
    });
  };

  // Handlers de teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    
    if (e.key.length === 1) {
      // Caractere único - usar type
      sendInput({
        inputType: 'keyboard',
        event: 'type',
        text: e.key
      });
    } else {
      // Tecla especial - usar press
      sendInput({
        inputType: 'keyboard',
        event: 'press',
        key: e.key
      });
    }
  };

  // Navegar para URL
  const handleNavigate = (newUrl: string) => {
    if (socketRef.current && isConnected) {
      setIsLoading(true);
      socketRef.current.emit('browser:navigate', newUrl, (response: any) => {
        if (response.success) {
          setCurrentUrl(response.url);
          setIsLoading(false);
        } else {
          console.error('❌ Erro ao navegar:', response.error);
          setIsLoading(false);
        }
      });
    }
  };

  return (
    <div className="remote-browser-container flex flex-col h-full bg-bg-secondary rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="browser-toolbar flex items-center gap-2 p-3 bg-bg-tertiary border-b border-border-color">
        {/* Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs text-text-tertiary">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
          {isConnected && (
            <span className="text-xs text-text-tertiary ml-2">
              {fps} FPS
            </span>
          )}
        </div>

        {/* URL Bar */}
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleNavigate(currentUrl);
              }
            }}
            className="flex-1 px-3 py-1.5 bg-bg-secondary text-text-primary text-sm rounded border border-border-color focus:outline-none focus:border-purple-500"
            placeholder="Digite uma URL..."
          />
          <button
            onClick={() => handleNavigate(currentUrl)}
            disabled={!isConnected || isLoading}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
          >
            {isLoading ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <i className="fa-solid fa-arrow-right"></i>
            )}
          </button>
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded transition-colors"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        )}
      </div>

      {/* Canvas */}
      <div className="browser-canvas-wrapper flex-1 relative bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="text-white text-center">
              <i className="fa-solid fa-spinner fa-spin text-4xl mb-3"></i>
              <p>Carregando...</p>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={viewport.width}
          height={viewport.height}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onClick={handleClick}
          onWheel={handleWheel}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          className="w-full h-full cursor-crosshair"
          style={{ outline: 'none' }}
        />
      </div>

      {/* Info Bar */}
      <div className="browser-info flex items-center justify-between px-3 py-2 bg-bg-tertiary border-t border-border-color text-xs text-text-tertiary">
        <span>
          <i className="fa-solid fa-desktop mr-2"></i>
          {viewport.width} x {viewport.height}
        </span>
        <span>
          <i className="fa-solid fa-mouse-pointer mr-2"></i>
          Clique e digite para interagir
        </span>
      </div>
    </div>
  );
};

export default RemoteBrowserCanvas;
