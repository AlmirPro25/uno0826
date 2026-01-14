import React, { useState, useEffect } from 'react';
import { useQualityAutopilot, AutopilotConfig } from '@/services/QualityAutopilot';
import { useAppStore } from '@/store/useAppStore';

interface QualityAutopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
}

export const QualityAutopilotPanel: React.FC<QualityAutopilotPanelProps> = ({
  isOpen,
  onClose,
  currentCode
}) => {
  const {
    startAutopilot,
    stopAutopilot,
    updateConfig,
    getConfig,
    isRunning,
    getCurrentIteration
  } = useQualityAutopilot();

  const [config, setConfig] = useState<AutopilotConfig>(getConfig());
  const [isAutopilotActive, setIsAutopilotActive] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAutopilotActive(isRunning());
      setCurrentIteration(getCurrentIteration());
    }, 500);

    return () => clearInterval(interval);
  }, [isRunning, getCurrentIteration]);

  const handleConfigChange = (key: keyof AutopilotConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    updateConfig(newConfig);
  };

  const handleStartAutopilot = async () => {
    if (!currentCode || currentCode.trim().length < 100) {
      alert('Código muito pequeno para análise automática');
      return;
    }

    await startAutopilot(currentCode);
  };

  const handleStopAutopilot = () => {
    stopAutopilot();
    setIsAutopilotActive(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-600 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-robot text-white text-lg"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Piloto Automático de Qualidade</h2>
              <p className="text-sm text-slate-400">Sistema Prometheus de Auto-Refinamento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        {/* Status */}
        {isAutopilotActive && (
          <div className="p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-slate-600">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">
                Piloto Automático Ativo - Iteração {currentIteration}/{config.maxIterations}
              </span>
            </div>
            <div className="mt-2 bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentIteration / config.maxIterations) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Configuration */}
        <div className="p-6 space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Ativar Piloto Automático</h3>
              <p className="text-sm text-slate-400">Refinamento automático até atingir qualidade desejada</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => handleConfigChange('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Quality Threshold */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Limiar de Qualidade: {config.qualityThreshold}/100
            </label>
            <input
              type="range"
              min="70"
              max="100"
              value={config.qualityThreshold}
              onChange={(e) => handleConfigChange('qualityThreshold', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>70 (Básico)</span>
              <span>85 (Bom)</span>
              <span>100 (Perfeito)</span>
            </div>
          </div>

          {/* Max Iterations */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Máximo de Iterações: {config.maxIterations}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={config.maxIterations}
              onChange={(e) => handleConfigChange('maxIterations', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>1</span>
              <span>3</span>
              <span>5</span>
            </div>
          </div>

          {/* Auto Apply */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-slate-300">Aplicar Melhorias Automaticamente</h4>
              <p className="text-xs text-slate-400">Se desabilitado, apenas mostra sugestões</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoApplyImprovements}
                onChange={(e) => handleConfigChange('autoApplyImprovements', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Pause Between Iterations */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Pausa Entre Iterações: {config.pauseBetweenIterations / 1000}s
            </label>
            <input
              type="range"
              min="1000"
              max="10000"
              step="1000"
              value={config.pauseBetweenIterations}
              onChange={(e) => handleConfigChange('pauseBetweenIterations', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>1s</span>
              <span>5s</span>
              <span>10s</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-600 flex gap-3">
          {!isAutopilotActive ? (
            <button
              onClick={handleStartAutopilot}
              disabled={!config.enabled || !currentCode}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-play"></i>
              Iniciar Piloto Automático
            </button>
          ) : (
            <button
              onClick={handleStopAutopilot}
              className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-stop"></i>
              Parar Piloto Automático
            </button>
          )}
          
          <button
            onClick={onClose}
            className="px-6 py-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};
