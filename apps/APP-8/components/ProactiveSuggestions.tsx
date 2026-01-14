import React, { useState, useEffect } from 'react';
import { proactiveService, ProactiveSuggestion } from '../services/proactiveService';
import { CloseIcon } from './Icons';

const ProactiveSuggestions: React.FC = () => {
  const [currentSuggestion, setCurrentSuggestion] = useState<ProactiveSuggestion | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkForSuggestions = () => {
      const next = proactiveService.getNextSuggestion();
      if (next && !currentSuggestion) {
        setCurrentSuggestion(next);
        setIsVisible(true);
      }
    };

    const interval = setInterval(checkForSuggestions, 5000);
    return () => clearInterval(interval);
  }, [currentSuggestion]);

  const handleDismiss = () => {
    if (currentSuggestion) {
      proactiveService.dismissSuggestion(currentSuggestion.id);
      setIsVisible(false);
      setTimeout(() => setCurrentSuggestion(null), 300);
    }
  };

  const handleAction = () => {
    if (currentSuggestion?.action) {
      // Dispara evento customizado para a ação
      window.dispatchEvent(new CustomEvent('proactiveSuggestionAction', {
        detail: currentSuggestion
      }));
      handleDismiss();
    }
  };

  if (!currentSuggestion || !isVisible) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-900/20';
      case 'high': return 'border-orange-500 bg-orange-900/20';
      case 'medium': return 'border-yellow-500 bg-yellow-900/20';
      default: return 'border-blue-500 bg-blue-900/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'optimization': return '⚡';
      case 'tip': return '💡';
      case 'improvement': return '✨';
      default: return '💬';
    }
  };

  return (
    <div
      className={`fixed bottom-32 right-4 z-40 max-w-md transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`border-2 rounded-lg p-4 shadow-2xl backdrop-blur-sm ${getPriorityColor(currentSuggestion.priority)}`}>
        <div className="flex items-start gap-3">
          <div className="text-3xl flex-shrink-0">
            {getTypeIcon(currentSuggestion.type)}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-white text-sm">
                {currentSuggestion.title}
              </h3>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white transition-colors ml-2"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-300 mb-3">
              {currentSuggestion.description}
            </p>
            {currentSuggestion.action && (
              <button
                onClick={handleAction}
                className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {currentSuggestion.action}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProactiveSuggestions;
