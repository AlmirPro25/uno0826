import React, { useState } from 'react';
import { Eye, Brain, Play, CheckCircle, XCircle, AlertTriangle, Loader } from 'lucide-react';

interface TaskPlan {
  task: string;
  steps: Array<{
    type: string;
    params: any;
    description: string;
  }>;
  estimatedTime: number;
  requiresConfirmation: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

interface ExecutionResult {
  success: boolean;
  completedSteps: number;
  totalSteps: number;
  errors: string[];
  duration: number;
}

export const SmartTaskExecutor: React.FC = () => {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [plan, setPlan] = useState<TaskPlan | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [screenAnalysis, setScreenAnalysis] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const analyzeScreen = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch('http://localhost:3001/api/tasks/analyze-screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: command }),
      });
      const data = await response.json();
      if (data.success) {
        setScreenAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Erro ao analisar tela:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const createPlan = async () => {
    if (!command.trim()) return;

    setLoading(true);
    setPlan(null);
    setResult(null);
    try {
      const response = await fetch('http://localhost:3001/api/tasks/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const data = await response.json();
      if (data.success) {
        setPlan(data.plan);
        setScreenAnalysis(data.screenContext);
      }
    } catch (error) {
      console.error('Erro ao criar plano:', error);
    } finally {
      setLoading(false);
    }
  };

  const executePlan = async () => {
    if (!plan) return;

    setExecuting(true);
    setResult(null);
    setCurrentStep(0);

    try {
      const response = await fetch('http://localhost:3001/api/tasks/execute-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();
      if (data.success) {
        setResult(data.execution);
      }
    } catch (error) {
      console.error('Erro ao executar plano:', error);
    } finally {
      setExecuting(false);
    }
  };

  const executeDirectly = async () => {
    if (!command.trim()) return;

    setLoading(true);
    setPlan(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/tasks/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const data = await response.json();
      
      setPlan(data.plan);
      setResult(data.execution);
    } catch (error) {
      console.error('Erro ao executar tarefa:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Brain className="w-7 h-7 text-purple-600" />
          🤖 Smart Task Executor
        </h2>
        <button
          onClick={analyzeScreen}
          disabled={analyzing}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          {analyzing ? 'Analisando...' : 'Ver Tela'}
        </button>
      </div>

      {/* Screen Analysis */}
      {screenAnalysis && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Análise da Tela
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
            {screenAnalysis.description}
          </p>
          {screenAnalysis.appName && (
            <p className="text-xs text-blue-700 dark:text-blue-300">
              📱 App: {screenAnalysis.appName} | 🪟 Janela: {screenAnalysis.windowTitle || 'N/A'}
            </p>
          )}
          {screenAnalysis.elements && screenAnalysis.elements.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                Elementos encontrados: {screenAnalysis.elements.length}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Command Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Comando em linguagem natural:
        </label>
        <textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Ex: Abra o Chrome e pesquise por 'Python tutorial'&#10;Ex: Preencha o formulário com meus dados&#10;Ex: Exporte o relatório em PDF"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
          rows={3}
          disabled={loading || executing}
        />
        <div className="flex gap-2">
          <button
            onClick={createPlan}
            disabled={loading || executing || !command.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <Brain className="w-4 h-4" />
            {loading ? 'Planejando...' : 'Criar Plano'}
          </button>
          <button
            onClick={executeDirectly}
            disabled={loading || executing || !command.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            {loading ? 'Executando...' : 'Executar Direto'}
          </button>
        </div>
      </div>

      {/* Plan Display */}
      {plan && (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              📋 Plano de Execução
            </h3>
            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getRiskColor(plan.riskLevel)}`}>
              Risco: {plan.riskLevel.toUpperCase()}
            </span>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Tarefa:</strong> {plan.task}
          </p>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Passos ({plan.steps.length}):
            </p>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {plan.steps.map((step, index) => (
                <div
                  key={index}
                  className={`text-sm p-2 rounded ${
                    result && index < result.completedSteps
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="font-medium">{index + 1}.</span> {step.description}
                  {result && index < result.completedSteps && (
                    <CheckCircle className="inline w-4 h-4 ml-2 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>⏱️ Tempo estimado: {plan.estimatedTime}s</span>
            {plan.requiresConfirmation && (
              <span className="flex items-center gap-1 text-yellow-600">
                <AlertTriangle className="w-4 h-4" />
                Requer confirmação
              </span>
            )}
          </div>

          {!result && !executing && (
            <button
              onClick={executePlan}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              Executar Este Plano
            </button>
          )}
        </div>
      )}

      {/* Execution Status */}
      {executing && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Executando tarefa...
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Aguarde enquanto o sistema executa as ações
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Execution Result */}
      {result && (
        <div className={`border rounded-lg p-4 ${
          result.success
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <h3 className={`text-lg font-semibold ${
              result.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
            }`}>
              {result.success ? '✅ Tarefa Concluída!' : '❌ Tarefa Falhou'}
            </h3>
          </div>

          <div className={`text-sm space-y-1 ${
            result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
          }`}>
            <p>
              <strong>Passos completados:</strong> {result.completedSteps}/{result.totalSteps}
            </p>
            <p>
              <strong>Duração:</strong> {(result.duration / 1000).toFixed(1)}s
            </p>
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Erros:</p>
                <ul className="list-disc list-inside space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index} className="text-xs">{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
          💡 Exemplos de comandos:
        </h3>
        <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
          <li>• "Abra o Chrome e pesquise por 'Python tutorial'"</li>
          <li>• "Preencha o formulário com nome 'João' e email 'joao@email.com'"</li>
          <li>• "Copie o texto selecionado e cole no bloco de notas"</li>
          <li>• "Exporte o relatório de vendas em PDF"</li>
          <li>• "Tire um screenshot e salve como 'resultado.png'"</li>
        </ul>
      </div>
    </div>
  );
};
