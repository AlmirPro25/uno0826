// src/components/SelfHealingMonitor.tsx
// 📊 Monitor de Autocorreção: Exibe histórico e estatísticas

import React, { useState, useEffect } from 'react';
import { selfHealingEngine, type HealingAttempt } from '../services/SelfHealingEngine';

export const SelfHealingMonitor: React.FC = () => {
  const [history, setHistory] = useState<HealingAttempt[]>([]);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, pending: 0, successRate: 0 });
  const [notifications, setNotifications] = useState<Array<{ message: string; timestamp: Date }>>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Atualiza histórico a cada 2 segundos
    const interval = setInterval(() => {
      setHistory(selfHealingEngine.getHealingHistory());
      setStats(selfHealingEngine.getStats());
    }, 2000);

    // Escuta notificações de healing
    const handleNotification = ((event: CustomEvent) => {
      const { message, timestamp } = event.detail;
      setNotifications(prev => [...prev, { message, timestamp }].slice(-5)); // Mantém últimas 5
    }) as EventListener;

    window.addEventListener('healing_notification', handleNotification);

    return () => {
      clearInterval(interval);
      window.removeEventListener('healing_notification', handleNotification);
    };
  }, []);

  if (history.length === 0 && notifications.length === 0) {
    return null; // Não exibe nada se não houver atividade
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {/* Notificações Flutuantes */}
      <div className="space-y-2 mb-2">
        {notifications.map((notif, idx) => (
          <div
            key={idx}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in-right"
          >
            <p className="text-sm font-medium">{notif.message}</p>
            <p className="text-xs opacity-75">{notif.timestamp.toLocaleTimeString()}</p>
          </div>
        ))}
      </div>

      {/* Painel de Estatísticas */}
      <div className="bg-white rounded-lg shadow-xl border border-gray-200">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <h3 className="font-semibold text-gray-900">Self-Healing Engine</h3>
              <p className="text-xs text-gray-500">
                {stats.total} tentativas • {stats.successRate.toFixed(0)}% sucesso
              </p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Estatísticas Expandidas */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="bg-green-50 rounded p-2 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.success}</p>
                <p className="text-xs text-green-700">Sucesso</p>
              </div>
              <div className="bg-red-50 rounded p-2 text-center">
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                <p className="text-xs text-red-700">Falhas</p>
              </div>
              <div className="bg-yellow-50 rounded p-2 text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-xs text-yellow-700">Pendente</p>
              </div>
            </div>

            {/* Histórico */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <h4 className="text-sm font-semibold text-gray-700">Histórico Recente</h4>
              {history.slice(-5).reverse().map((attempt) => (
                <div
                  key={attempt.id}
                  className={`p-3 rounded border ${
                    attempt.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : attempt.status === 'failed'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-mono text-gray-600">
                      {attempt.timestamp.toLocaleTimeString()}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        attempt.status === 'success'
                          ? 'text-green-600'
                          : attempt.status === 'failed'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {attempt.status === 'success' ? '✅' : attempt.status === 'failed' ? '❌' : '⏳'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{attempt.solution}</p>
                  {attempt.newCommand && (
                    <code className="text-xs bg-gray-800 text-green-400 px-2 py-1 rounded block mt-1">
                      {attempt.newCommand}
                    </code>
                  )}
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                      Ver erro original
                    </summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                      {attempt.errorContext.error}
                    </pre>
                  </details>
                </div>
              ))}
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  selfHealingEngine.clearHistory();
                  setHistory([]);
                  setNotifications([]);
                }}
                className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
              >
                Limpar Histórico
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
