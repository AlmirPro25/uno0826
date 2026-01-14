import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from './shadcn/Button';

interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  storageKey?: string;
}

export function GuidedTour({ 
  steps, 
  isOpen, 
  onClose, 
  onComplete,
  storageKey = 'tour-completed'
}: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Find and highlight target element
  useEffect(() => {
    if (!isOpen || !step) return;

    const target = document.querySelector(step.target);
    if (target) {
      const rect = target.getBoundingClientRect();
      setTargetRect(rect);
      
      // Scroll element into view
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add highlight class
      target.classList.add('tour-highlight');
      
      return () => {
        target.classList.remove('tour-highlight');
      };
    }
  }, [isOpen, step, currentStep]);

  const handleNext = useCallback(() => {
    if (step?.action) {
      step.action();
    }
    
    if (isLastStep) {
      localStorage.setItem(storageKey, 'true');
      onComplete?.();
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLastStep, onClose, onComplete, step, storageKey]);

  const handlePrev = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  }, [isFirstStep]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(storageKey, 'true');
    onClose();
  }, [onClose, storageKey]);

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!targetRect) return {};

    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const position = step?.position || 'bottom';

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
        left = targetRect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
        left = targetRect.right + padding;
        break;
    }

    // Keep within viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

    return { top, left, width: tooltipWidth };
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay with spotlight */}
      <div className="fixed inset-0 z-50">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70" />
        
        {/* Spotlight on target */}
        {targetRect && (
          <div
            className="absolute bg-transparent"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
              borderRadius: '8px',
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed z-50 bg-white dark:bg-gray-900 rounded-lg shadow-xl p-4"
          style={getTooltipStyle()}
        >
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Progress */}
          <div className="flex items-center space-x-1 mb-3">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {step?.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {step?.content}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Pular tour
            </button>
            
            <div className="flex items-center space-x-2">
              {!isFirstStep && (
                <Button variant="outline" size="sm" onClick={handlePrev}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {isLastStep ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Concluir
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Step counter */}
          <p className="text-xs text-gray-400 text-center mt-3">
            {currentStep + 1} de {steps.length}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* CSS for highlight effect */}
      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 51;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          border-radius: 8px;
        }
      `}</style>
    </>
  );
}

// Hook to manage tour state
export function useTour(storageKey: string = 'tour-completed') {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(true);

  useEffect(() => {
    const completed = localStorage.getItem(storageKey) === 'true';
    setHasCompleted(completed);
    if (!completed) {
      // Auto-start tour for new users after a delay
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const startTour = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setIsOpen(false);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasCompleted(false);
  }, [storageKey]);

  return {
    isOpen,
    hasCompleted,
    startTour,
    closeTour,
    resetTour,
  };
}

// Pre-defined tour for the dashboard
export const dashboardTourSteps: TourStep[] = [
  {
    target: '[data-tour="sidebar"]',
    title: 'Menu de Navegação',
    content: 'Use o menu lateral para acessar todas as funcionalidades do sistema.',
    position: 'right',
  },
  {
    target: '[data-tour="search"]',
    title: 'Busca Global',
    content: 'Pressione Ctrl+K para buscar rapidamente em todo o sistema.',
    position: 'bottom',
  },
  {
    target: '[data-tour="notifications"]',
    title: 'Notificações',
    content: 'Aqui você verá alertas sobre consultas, mensagens e atualizações.',
    position: 'bottom',
  },
  {
    target: '[data-tour="profile"]',
    title: 'Seu Perfil',
    content: 'Acesse suas configurações, altere sua senha e gerencie sua conta.',
    position: 'left',
  },
];
