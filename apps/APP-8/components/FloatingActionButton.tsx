import React, { useState, useRef, useEffect } from 'react';
import { MicIcon, StopIcon, ScreenIcon, BrainIcon, HistoryIcon, SettingsIcon, SparklesIcon } from './Icons';

interface FloatingActionButtonProps {
  isSessionActive: boolean;
  isThinkingMode: boolean;
  onToggleSession: () => void;
  onCaptureScreen: () => void;
  onToggleThinkingMode: () => void;
  onToggleHistory: () => void;
  onToggleSettings?: () => void;
  onToggleMemory?: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  isSessionActive, 
  isThinkingMode,
  onToggleSession, 
  onCaptureScreen,
  onToggleThinkingMode,
  onToggleHistory,
  onToggleSettings,
  onToggleMemory
}) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 });
  const fabRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (fabRef.current) {
        isDragging.current = true;
        dragStart.current = {
            x: e.clientX - fabRef.current.offsetLeft,
            y: e.clientY - fabRef.current.offsetTop,
        };
        fabRef.current.style.transition = 'none'; // Disable transition while dragging
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !fabRef.current) return;
    e.preventDefault();
    
    let newX = e.clientX - dragStart.current.x;
    let newY = e.clientY - dragStart.current.y;

    // Clamp position within viewport
    const fabWidth = fabRef.current.offsetWidth;
    const fabHeight = fabRef.current.offsetHeight;
    newX = Math.max(0, Math.min(newX, window.innerWidth - fabWidth));
    newY = Math.max(0, Math.min(newY, window.innerHeight - fabHeight));
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    if (isDragging.current && fabRef.current) {
        isDragging.current = false;
        fabRef.current.style.transition = 'all 0.3s ease-in-out';
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
        ref={fabRef}
        className="fixed z-50 flex items-center gap-4 cursor-grab active:cursor-grabbing"
        style={{ left: position.x, top: position.y, touchAction: 'none' }}
        onMouseDown={handleMouseDown}
    >
        {!isThinkingMode && (
          <>
            <button
                title="Configurações de Personalidade"
                onClick={onToggleSettings}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50 ring-purple-500 shadow-lg"
            >
                <SettingsIcon className="w-7 h-7" />
            </button>
            <button
                title="Sistema de Memória"
                onClick={onToggleMemory}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50 ring-purple-500 shadow-lg"
            >
                <SparklesIcon className="w-7 h-7" />
            </button>
            <button
                title="Histórico de Conversas"
                onClick={onToggleHistory}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50 ring-purple-500 shadow-lg"
            >
                <HistoryIcon className="w-7 h-7" />
            </button>
          </>
        )}
        {isSessionActive && !isThinkingMode && (
          <>
            <button
                title="Activate Thinking Mode"
                onClick={onToggleThinkingMode}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-teal-600 text-white hover:bg-teal-500 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50 ring-teal-500 shadow-lg"
            >
                <BrainIcon className="w-7 h-7" />
            </button>
            <button
                title="Capture Screen for Analysis (Ctrl+P)"
                onClick={onCaptureScreen}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50 ring-purple-500 shadow-lg"
            >
                <ScreenIcon className="w-7 h-7" />
            </button>
          </>
        )}
        <button
            title={isSessionActive ? "Stop Session" : "Start Live Session"}
            onClick={onToggleSession}
            disabled={isThinkingMode}
            className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50
            ${isSessionActive
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50 scale-110 ring-purple-500'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
            }
            ${isThinkingMode ? 'cursor-not-allowed bg-gray-600' : ''}`}
        >
            {isSessionActive ? <StopIcon className="w-10 h-10" /> : <MicIcon className="w-10 h-10" />}
            {isSessionActive && !isThinkingMode && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 border-2 border-purple-600 rounded-full animate-pulse"></span>
            )}
        </button>
    </div>
  );
};

export default FloatingActionButton;