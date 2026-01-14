
import React, { useState, useEffect, useLayoutEffect } from 'react';

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  actionRequired?: boolean; // Se true, o usuário deve interagir com a UI para avançar
}

interface TourOverlayProps {
  steps: TourStep[];
  currentStepIndex: number;
  isOpen: boolean;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export const TourOverlay: React.FC<TourOverlayProps> = ({
  steps,
  currentStepIndex,
  isOpen,
  onNext,
  onPrev,
  onClose
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const step = steps[currentStepIndex];

  // Recalcula a posição do highlight quando o passo muda ou a janela redimensiona
  const updatePosition = () => {
    if (!step) return;
    const element = document.getElementById(step.targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      // Se o elemento não estiver totalmente visível, scrolla até ele
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetRect(null);
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true); // Captura scroll em qualquer container
      
      const timer = setTimeout(updatePosition, 500); 
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
        clearTimeout(timer);
      };
    }
  }, [currentStepIndex, isOpen, step?.targetId]);

  if (!isOpen || !step) return null;

  // Gera o path do recorte (Hole) para permitir cliques
  // Utiliza a técnica de polígono invertido para criar um buraco na div de backdrop
  const getClipPath = () => {
      if (!targetRect) return 'none';
      
      const { top, left, right, bottom } = targetRect;
      const x1 = left;
      const y1 = top;
      const x2 = right;
      const y2 = bottom;

      // Cria um caminho que cobre toda a tela MAS exclui o retângulo alvo
      // Isso faz com que a área do alvo seja "transparente" para eventos de mouse (pointer-events)
      return `polygon(
        0% 0%,
        0% 100%,
        ${x1}px 100%,
        ${x1}px ${y1}px,
        ${x2}px ${y1}px,
        ${x2}px ${y2}px,
        ${x1}px ${y2}px,
        ${x1}px 100%,
        100% 100%,
        100% 0%
      )`;
  };

  const renderCard = () => {
    if (!targetRect) return null;

    let top = 0;
    let left = 0;
    const offset = 20;
    const cardWidth = 320;

    // Lógica simples de posicionamento
    switch (step.position) {
      case 'right':
        top = targetRect.top;
        left = targetRect.right + offset;
        break;
      case 'left':
        top = targetRect.top;
        left = targetRect.left - cardWidth - offset;
        break;
      case 'bottom':
        top = targetRect.bottom + offset;
        left = targetRect.left;
        break;
      case 'top':
        top = targetRect.top - 200; 
        left = targetRect.left;
        break;
      case 'center':
        top = window.innerHeight / 2 - 100;
        left = window.innerWidth / 2 - 150;
        break;
    }

    // Ajustes de borda de tela
    if (left < 10) left = 10;
    if (left + cardWidth > window.innerWidth) left = window.innerWidth - cardWidth - 10;
    if (top < 10) top = 10;

    return (
      <div 
        className="fixed z-[9999] bg-slate-900/95 border border-cyan-500/50 text-white p-5 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.3)] backdrop-blur-md animate-fade-in-up transition-all duration-300"
        style={{ top, left, width: cardWidth }}
      >
        <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                Protocolo de Treinamento {currentStepIndex + 1}/{steps.length}
            </span>
        </div>
        
        <h3 className="font-bold text-lg text-white mb-2">{step.title}</h3>
        <p className="text-sm text-slate-300 leading-relaxed mb-4 font-light">
            {step.content}
        </p>

        <div className="flex justify-between items-center mt-2">
            <button 
                onClick={onClose} 
                className="text-xs text-slate-500 hover:text-white transition-colors"
            >
                Pular
            </button>
            <div className="flex gap-2">
                {currentStepIndex > 0 && (
                    <button 
                        onClick={onPrev}
                        className="px-3 py-1.5 rounded border border-slate-600 hover:bg-slate-800 text-xs font-medium transition-colors"
                    >
                        Anterior
                    </button>
                )}
                {!step.actionRequired ? (
                    <button 
                        onClick={onNext}
                        className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/50 transition-all hover:scale-105"
                    >
                        {currentStepIndex === steps.length - 1 ? 'Concluir' : 'Próximo'}
                    </button>
                ) : (
                    <span className="text-xs text-cyan-400 animate-pulse font-mono border border-cyan-900 bg-cyan-900/20 px-2 py-1 rounded flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                        Aguardando Interação...
                    </span>
                )}
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      
      {/* 1. Backdrop com Recorte (Clip-Path) */}
      {/* pointer-events-auto aqui garante que o usuário NÃO possa clicar fora do buraco */}
      <div 
        className="absolute inset-0 bg-slate-900/70 pointer-events-auto transition-all duration-300 ease-out" 
        style={{ clipPath: getClipPath() }}
      />

      {/* 2. Borda Decorativa ao redor do alvo */}
      {targetRect && (
        <div 
            className="absolute border-2 border-cyan-400 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-300 ease-out pointer-events-none animate-pulse-slow"
            style={{
                top: targetRect.top - 4,
                left: targetRect.left - 4,
                width: targetRect.width + 8,
                height: targetRect.height + 8,
            }}
        >
             {/* Crosshairs Sci-Fi */}
             <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-white"></div>
             <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-white"></div>
             <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-white"></div>
             <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-white"></div>
        </div>
      )}

      {/* 3. Card de Instrução */}
      <div className="pointer-events-auto">
        {renderCard()}
      </div>
    </div>
  );
};
