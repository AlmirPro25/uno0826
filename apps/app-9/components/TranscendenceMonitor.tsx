import React, { useState, useEffect } from 'react';
import { getTranscendenceEngine, getTranscendenceMetrics, startTranscendentalMonitoring, testGeminiConnection } from '../services/geminiService';

interface TranscendenceMetrics {
  total_suggestions: number;
  applied_rate: number;
  success_rate: number;
  learning_patterns: number;
  architecture_insights: number;
  transcendence_level: string;
}

interface TranscendenceSuggestion {
  action: string;
  reason: string;
  confidence: number;
  transcendence_level?: string;
  expected_improvement?: string;
}

interface GeminiConnectionStatus {
  connected: boolean;
  model: string;
  error?: string;
}

interface TranscendenceMonitorProps {
  onClose: () => void;
  modelSummary?: string;
}

export const TranscendenceMonitor: React.FC<TranscendenceMonitorProps> = ({ 
  onClose, 
  modelSummary = "" 
}) => {
  const [metrics, setMetrics] = useState<TranscendenceMetrics | null>(null);
  const [suggestions, setSuggestions] = useState<TranscendenceSuggestion[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [geminiStatus, setGeminiStatus] = useState<GeminiConnectionStatus | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    // Carregar métricas iniciais
    loadMetrics();
    
    // Testar conexão Gemini
    testConnection();
    
    // Iniciar monitoramento se solicitado
    if (isMonitoring) {
      startTranscendentalMonitoring(modelSummary, handleNewSuggestion);
    }
  }, [isMonitoring, modelSummary]);

  const loadMetrics = () => {
    try {
      const currentMetrics = getTranscendenceMetrics();
      setMetrics(currentMetrics);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Erro ao carregar métricas transcendentais:", error);
    }
  };

  const handleNewSuggestion = (suggestion: TranscendenceSuggestion) => {
    setSuggestions(prev => [suggestion, ...prev.slice(0, 9)]); // Manter apenas 10 sugestões
    loadMetrics(); // Atualizar métricas
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const status = await testGeminiConnection();
      setGeminiStatus(status);
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      setGeminiStatus({
        connected: false,
        model: 'error',
        error: 'Erro ao testar conexão'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  const getTranscendenceLevelColor = (level: string): string => {
    if (level.includes('MASTER')) return 'text-purple-400';
    if (level.includes('ADVANCED')) return 'text-blue-400';
    if (level.includes('LEARNING')) return 'text-green-400';
    return 'text-gray-400';
  };

  const getTranscendenceLevelIcon = (level: string): string => {
    if (level.includes('MASTER')) return '🌟';
    if (level.includes('ADVANCED')) return '🚀';
    if (level.includes('LEARNING')) return '🧠';
    return '🌱';
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl border border-purple-500/30 p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
            <h2 className="text-2xl font-bold text-white">
              🧠 Monitor Transcendental AGI
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleMonitoring}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isMonitoring 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isMonitoring ? '⏸️ Pausar' : '▶️ Monitorar'}
            </button>
            <button
              onClick={testConnection}
              disabled={isTestingConnection}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
            >
              {isTestingConnection ? '⏳ Testando...' : '🔍 Testar API'}
            </button>
            <button
              onClick={loadMetrics}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
            >
              🔄 Atualizar
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status do Monitoramento */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Monitoramento:</span>
              <span className={`text-sm font-medium ${isMonitoring ? 'text-green-400' : 'text-gray-400'}`}>
                {isMonitoring ? '🟢 Ativo' : '🔴 Inativo'}
              </span>
            </div>
            
            {/* Status da API Gemini */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">API Gemini:</span>
              {geminiStatus ? (
                <span className={`text-sm font-medium ${
                  geminiStatus.connected ? 'text-green-400' : 'text-red-400'
                }`}>
                  {geminiStatus.connected ? '🟢 Conectada' : '🔴 Offline'}
                  {geminiStatus.connected && (
                    <span className="text-xs text-gray-500 ml-1">({geminiStatus.model})</span>
                  )}
                </span>
              ) : (
                <span className="text-sm text-yellow-400">⏳ Testando...</span>
              )}
            </div>
            
            {/* Última Atualização */}
            <div className="text-sm text-gray-400 md:col-span-2">
              Última atualização: {lastUpdate}
            </div>
            
            {/* Erro da API se houver */}
            {geminiStatus && !geminiStatus.connected && geminiStatus.error && (
              <div className="md:col-span-2 text-xs text-red-400 bg-red-900/20 p-2 rounded">
                ⚠️ {geminiStatus.error}
              </div>
            )}
          </div>
        </div>

        {/* Métricas Principais */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Nível de Transcendência */}
            <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 p-4 rounded-lg border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getTranscendenceLevelIcon(metrics.transcendence_level)}</span>
                <h3 className="font-semibold text-white">Nível de Transcendência</h3>
              </div>
              <p className={`text-lg font-bold ${getTranscendenceLevelColor(metrics.transcendence_level)}`}>
                {metrics.transcendence_level}
              </p>
            </div>

            {/* Taxa de Sucesso */}
            <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 p-4 rounded-lg border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎯</span>
                <h3 className="font-semibold text-white">Taxa de Sucesso</h3>
              </div>
              <p className="text-lg font-bold text-green-400">
                {(metrics.success_rate * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400">
                {metrics.total_suggestions} sugestões totais
              </p>
            </div>

            {/* Insights Arquiteturais */}
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 p-4 rounded-lg border border-blue-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🏗️</span>
                <h3 className="font-semibold text-white">Insights Arquiteturais</h3>
              </div>
              <p className="text-lg font-bold text-blue-400">
                {metrics.architecture_insights}
              </p>
              <p className="text-xs text-gray-400">
                {metrics.learning_patterns} padrões aprendidos
              </p>
            </div>
          </div>
        )}

        {/* Sugestões Recentes */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">💡</span>
            Sugestões Transcendentais Recentes
          </h3>
          
          {suggestions.length === 0 ? (
            <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 text-center">
              <p className="text-gray-400">
                {isMonitoring 
                  ? "🧠 Aguardando sugestões transcendentais..." 
                  : "Inicie o monitoramento para ver sugestões em tempo real"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-purple-400">
                        {suggestion.action.replace('_', ' ').toUpperCase()}
                      </span>
                      {suggestion.transcendence_level && (
                        <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded">
                          {suggestion.transcendence_level}
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                      {(suggestion.confidence * 100).toFixed(0)}% confiança
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-2">
                    {suggestion.reason}
                  </p>
                  
                  {suggestion.expected_improvement && (
                    <p className="text-xs text-green-400">
                      💫 {suggestion.expected_improvement}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informações do Sistema */}
        <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700">
          <h4 className="font-medium text-white mb-2">ℹ️ Sobre o Sistema Transcendental</h4>
          <div className="text-sm text-gray-400 space-y-1">
            <p>• <strong>Meta-Cognição:</strong> O sistema aprende com suas próprias sugestões</p>
            <p>• <strong>Adaptação:</strong> Melhora continuamente baseado no histórico</p>
            <p>• <strong>Transcendência:</strong> Supera limitações através de insights AGI</p>
            <p>• <strong>Monitoramento:</strong> Análise em tempo real de performance</p>
          </div>
          
          {/* Modo de Operação */}
          <div className="mt-4 pt-3 border-t border-gray-700">
            <h5 className="font-medium text-white mb-2">🔧 Modo de Operação</h5>
            <div className="text-sm text-gray-400">
              {geminiStatus?.connected ? (
                <div className="text-green-400">
                  <p>🌟 <strong>Modo Transcendental Completo:</strong></p>
                  <p className="text-xs mt-1">• Consultas reais à API Gemini</p>
                  <p className="text-xs">• Sugestões baseadas em IA avançada</p>
                  <p className="text-xs">• Capacidades meta-cognitivas completas</p>
                </div>
              ) : (
                <div className="text-yellow-400">
                  <p>🤖 <strong>Modo Offline Inteligente:</strong></p>
                  <p className="text-xs mt-1">• Fallbacks baseados no histórico</p>
                  <p className="text-xs">• Sugestões de boas práticas de ML</p>
                  <p className="text-xs">• Configure API key para modo completo</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};