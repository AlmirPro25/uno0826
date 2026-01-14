import React, { useState, useEffect } from 'react';
import { Power, Square, Activity, AlertCircle, CheckCircle } from 'lucide-react';

interface ExecutorStatus {
  connected: boolean;
  screen?: { width: number; height: number };
  mouse?: { x: number; y: number };
}

export const ExecutorControl: React.FC = () => {
  const [status, setStatus] = useState<ExecutorStatus>({ connected: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [command, setCommand] = useState('');
  const [executing, setExecuting] = useState(false);

  const checkStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/executor/status');
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('Erro ao verificar status');
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/executor/connect', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        await checkStatus();
      } else {
        setError(data.error || 'Erro ao conectar');
      }
    } catch (err) {
      setError('Erro ao conectar ao Executor. Certifique-se de que o módulo Python está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await fetch('http://localhost:3001/api/executor/disconnect', {
        method: 'POST',
      });
      await checkStatus();
    } catch (err) {
      setError('Erro ao desconectar');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyStop = async () => {
    try {
      await fetch('http://localhost:3001/api/executor/stop', {
        method: 'POST',
      });
      setError(null);
    } catch (err) {
      setError('Erro ao parar Executor');
    }
  };

  const handleExecuteCommand = async () => {
    if (!command.trim()) return;

    setExecuting(true);
    setError(null);
    try {
      // Aqui você pode adicionar lógica para interpretar o comando
      // Por enquanto, vamos apenas mostrar que está executando
      console.log('Executando comando:', command);
      
      // Exemplo: se o comando for "mover mouse para 500, 300"
      if (command.toLowerCase().includes('mover mouse')) {
        const coords = command.match(/\d+/g);
        if (coords && coords.length >= 2) {
          await fetch('http://localhost:3001/api/executor/mouse/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ x: parseInt(coords[0]), y: parseInt(coords[1]) }),
          });
        }
      }
      
      setCommand('');
    } catch (err) {
      setError('Erro ao executar comando');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="w-6 h-6" />
          🎮 Gemini Executor
        </h2>
        
        <div className="flex items-center gap-2">
          {status.connected ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Conectado</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Desconectado</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {status.connected && status.screen && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Tela:</strong> {status.screen.width} x {status.screen.height}
          </div>
          {status.mouse && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Mouse:</strong> ({status.mouse.x}, {status.mouse.y})
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {!status.connected ? (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <Power className="w-4 h-4" />
            {loading ? 'Conectando...' : 'Conectar'}
          </button>
        ) : (
          <>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              <Power className="w-4 h-4" />
              Desconectar
            </button>
            <button
              onClick={handleEmergencyStop}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              title="Parada de Emergência"
            >
              <Square className="w-4 h-4" />
              PARAR
            </button>
          </>
        )}
      </div>

      {status.connected && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Comando em linguagem natural:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleExecuteCommand()}
              placeholder="Ex: mover mouse para 500, 300"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              disabled={executing}
            />
            <button
              onClick={handleExecuteCommand}
              disabled={executing || !command.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {executing ? 'Executando...' : 'Executar'}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Dica: Você pode dar comandos como "mover mouse para X, Y", "clicar", "digitar texto", etc.
          </p>
        </div>
      )}

      {!status.connected && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📋 Como iniciar o Executor:
          </h3>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Abra um terminal na pasta <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">executor/</code></li>
            <li>Instale as dependências: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">pip install -r requirements.txt</code></li>
            <li>Configure o <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">.env</code> com o token</li>
            <li>Execute: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">python executor.py</code></li>
            <li>Clique em "Conectar" acima</li>
          </ol>
        </div>
      )}
    </div>
  );
};
