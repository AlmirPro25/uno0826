/**
 * 🔄 Process Manager Component
 * Gerencia múltiplos processos/terminais em abas
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal as TerminalIcon, 
  Plus, 
  X, 
  Play, 
  Square, 
  RefreshCw, 
  Trash2,
  Circle,
  Server,
  Globe,
  ChevronDown
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface ManagedProcess {
  id: string;
  name: string;
  command: string;
  status: 'running' | 'stopped' | 'error';
  port?: number;
  startedAt: number;
  outputLines: number;
}

interface ProcessManagerProps {
  className?: string;
  onProcessOutput?: (processId: string, data: string) => void;
}

const API_URL = 'http://localhost:3001';

export const ProcessManager: React.FC<ProcessManagerProps> = ({ 
  className = "",
  onProcessOutput 
}) => {
  const [processes, setProcesses] = useState<ManagedProcess[]>([]);
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null);
  const [processOutputs, setProcessOutputs] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showNewProcess, setShowNewProcess] = useState(false);
  const [newCommand, setNewCommand] = useState('');
  const [newName, setNewName] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const outputRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Conectar ao WebSocket
  useEffect(() => {
    socketRef.current = io(API_URL, { transports: ['websocket'] });
    
    socketRef.current.on('process:output', ({ id, data }: { id: string; data: string }) => {
      setProcessOutputs(prev => ({
        ...prev,
        [id]: [...(prev[id] || []), data].slice(-500) // Manter últimas 500 linhas
      }));
      onProcessOutput?.(id, data);
      
      // Auto-scroll
      setTimeout(() => {
        const ref = outputRefs.current[id];
        if (ref) {
          ref.scrollTop = ref.scrollHeight;
        }
      }, 10);
    });
    
    socketRef.current.on('process:exit', ({ id, code }: { id: string; code: number }) => {
      setProcesses(prev => prev.map(p => 
        p.id === id ? { ...p, status: code === 0 ? 'stopped' : 'error' } : p
      ));
    });
    
    socketRef.current.on('process:port', ({ id, port }: { id: string; port: number }) => {
      setProcesses(prev => prev.map(p => 
        p.id === id ? { ...p, port } : p
      ));
    });
    
    socketRef.current.on('process:stopped', ({ id }: { id: string }) => {
      setProcesses(prev => prev.map(p => 
        p.id === id ? { ...p, status: 'stopped' } : p
      ));
    });
    
    socketRef.current.on('process:removed', ({ id }: { id: string }) => {
      setProcesses(prev => prev.filter(p => p.id !== id));
      setProcessOutputs(prev => {
        const newOutputs = { ...prev };
        delete newOutputs[id];
        return newOutputs;
      });
    });
    
    // Carregar processos existentes
    loadProcesses();
    
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const loadProcesses = async () => {
    try {
      const res = await fetch(`${API_URL}/api/processes`);
      const data = await res.json();
      if (data.success) {
        setProcesses(data.processes);
        // Carregar output do primeiro processo ativo
        if (data.processes.length > 0 && !activeProcessId) {
          setActiveProcessId(data.processes[0].id);
          loadProcessOutput(data.processes[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load processes:', e);
    }
  };

  const loadProcessOutput = async (processId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/processes/${processId}/output?lines=200`);
      const data = await res.json();
      if (data.success) {
        setProcessOutputs(prev => ({
          ...prev,
          [processId]: data.output.split('\n')
        }));
      }
    } catch (e) {
      console.error('Failed to load process output:', e);
    }
  };

  const startProcess = async () => {
    if (!newCommand.trim()) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/processes/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          command: newCommand,
          name: newName || undefined
        })
      });
      const data = await res.json();
      
      if (data.success) {
        if (!data.reused) {
          setProcesses(prev => [...prev, data.process]);
          setProcessOutputs(prev => ({ ...prev, [data.process.id]: [] }));
        }
        setActiveProcessId(data.process.id);
        setNewCommand('');
        setNewName('');
        setShowNewProcess(false);
      }
    } catch (e) {
      console.error('Failed to start process:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const stopProcess = async (processId: string) => {
    try {
      await fetch(`${API_URL}/api/processes/${processId}/stop`, { method: 'POST' });
    } catch (e) {
      console.error('Failed to stop process:', e);
    }
  };

  const removeProcess = async (processId: string) => {
    try {
      await fetch(`${API_URL}/api/processes/${processId}`, { method: 'DELETE' });
      if (activeProcessId === processId) {
        const remaining = processes.filter(p => p.id !== processId);
        setActiveProcessId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (e) {
      console.error('Failed to remove process:', e);
    }
  };

  const stopAllProcesses = async () => {
    try {
      await fetch(`${API_URL}/api/processes/stop-all`, { method: 'POST' });
    } catch (e) {
      console.error('Failed to stop all processes:', e);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-emerald-400';
      case 'stopped': return 'text-slate-400';
      case 'error': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />;
      case 'stopped': return <Circle className="w-2 h-2 fill-slate-400 text-slate-400" />;
      case 'error': return <Circle className="w-2 h-2 fill-red-400 text-red-400" />;
      default: return <Circle className="w-2 h-2" />;
    }
  };

  const activeProcess = processes.find(p => p.id === activeProcessId);
  const activeOutput = activeProcessId ? processOutputs[activeProcessId] || [] : [];

  return (
    <div className={`flex flex-col h-full bg-[#0c0c0e] ${className}`}>
      {/* Header com abas */}
      <div className="flex items-center bg-[#18181b] border-b border-slate-800 overflow-x-auto">
        {/* Abas dos processos */}
        <div className="flex items-center flex-1 overflow-x-auto">
          {processes.map(proc => (
            <button
              key={proc.id}
              onClick={() => {
                setActiveProcessId(proc.id);
                if (!processOutputs[proc.id]) {
                  loadProcessOutput(proc.id);
                }
              }}
              className={`flex items-center gap-2 px-3 py-2 text-xs border-r border-slate-800 hover:bg-white/5 transition-colors whitespace-nowrap ${
                activeProcessId === proc.id ? 'bg-[#0c0c0e] text-white' : 'text-slate-400'
              }`}
            >
              {getStatusIcon(proc.status)}
              <span className="max-w-[120px] truncate">{proc.name}</span>
              {proc.port && (
                <span className="text-[10px] px-1 py-0.5 bg-indigo-500/20 text-indigo-300 rounded">
                  :{proc.port}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeProcess(proc.id);
                }}
                className="p-0.5 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </button>
          ))}
        </div>
        
        {/* Botões de ação */}
        <div className="flex items-center gap-1 px-2 shrink-0">
          <button
            onClick={() => setShowNewProcess(!showNewProcess)}
            className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
            title="New Process"
          >
            <Plus className="w-4 h-4" />
          </button>
          {processes.some(p => p.status === 'running') && (
            <button
              onClick={stopAllProcesses}
              className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-colors"
              title="Stop All"
            >
              <Square className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={loadProcesses}
            className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Formulário para novo processo */}
      {showNewProcess && (
        <div className="flex items-center gap-2 p-2 bg-[#18181b] border-b border-slate-800">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name (optional)"
            className="w-24 px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            value={newCommand}
            onChange={(e) => setNewCommand(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && startProcess()}
            placeholder="Command (e.g., npm run dev)"
            className="flex-1 px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          <button
            onClick={startProcess}
            disabled={isLoading || !newCommand.trim()}
            className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded text-white transition-colors"
          >
            {isLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Start'}
          </button>
          <button
            onClick={() => setShowNewProcess(false)}
            className="p-1 hover:bg-white/10 rounded text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Info do processo ativo */}
      {activeProcess && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1a1d] border-b border-slate-800/50 text-xs">
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 ${getStatusColor(activeProcess.status)}`}>
              {getStatusIcon(activeProcess.status)}
              {activeProcess.status}
            </span>
            <span className="text-slate-500 font-mono">{activeProcess.command}</span>
          </div>
          <div className="flex items-center gap-2">
            {activeProcess.port && (
              <a 
                href={`http://localhost:${activeProcess.port}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
              >
                <Globe className="w-3 h-3" />
                localhost:{activeProcess.port}
              </a>
            )}
            {activeProcess.status === 'running' ? (
              <button
                onClick={() => stopProcess(activeProcess.id)}
                className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
              >
                <Square className="w-3 h-3" />
                Stop
              </button>
            ) : (
              <button
                onClick={() => {
                  // Reiniciar processo
                  setNewCommand(activeProcess.command);
                  startProcess();
                }}
                className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded transition-colors"
              >
                <Play className="w-3 h-3" />
                Restart
              </button>
            )}
          </div>
        </div>
      )}

      {/* Output do processo */}
      <div 
        ref={(el) => { if (activeProcessId) outputRefs.current[activeProcessId] = el; }}
        className="flex-1 overflow-auto p-2 font-mono text-xs text-slate-300 bg-[#0c0c0e]"
      >
        {activeOutput.length > 0 ? (
          activeOutput.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap break-all">{line}</div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Server className="w-8 h-8 mb-2 opacity-50" />
            <p>No output yet</p>
            {!activeProcess && (
              <button
                onClick={() => setShowNewProcess(true)}
                className="mt-2 px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 rounded text-white"
              >
                Start a process
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessManager;
