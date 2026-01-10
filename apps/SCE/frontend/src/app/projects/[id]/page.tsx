'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { API } from '@/lib/api';
import { Project, Deployment, DeploymentStatus } from '@/types';
import { 
  ArrowLeft, ExternalLink, GitBranch, Clock, Cpu, HardDrive,
  Play, Square, RotateCcw, Trash2, Settings, Terminal as TerminalIcon,
  Activity, Globe, Lock, ChevronDown, Copy, Check, Plus, X, Save, Edit2
} from 'lucide-react';

const STATUS_CONFIG: Record<DeploymentStatus, { label: string; class: string; icon: string }> = {
  QUEUED: { label: 'Na Fila', class: 'status-building', icon: '⏳' },
  BUILDING: { label: 'Buildando', class: 'status-building', icon: '🔨' },
  DEPLOYING: { label: 'Deployando', class: 'status-building', icon: '🚀' },
  HEALTHY: { label: 'Online', class: 'status-healthy', icon: '✅' },
  FAILED: { label: 'Falhou', class: 'status-failed', icon: '❌' },
  STOPPED: { label: 'Parado', class: 'status-stopped', icon: '⏹️' },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [metrics, setMetrics] = useState({ cpu: 0, memory: 0 });
  const [activeTab, setActiveTab] = useState<'logs' | 'env' | 'settings'>('logs');
  const [copied, setCopied] = useState(false);
  const [deploying, setDeploying] = useState(false);
  
  // Env vars state
  const [envVars, setEnvVars] = useState<{id: string; key: string; value: string}[]>([]);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');
  const [addingEnv, setAddingEnv] = useState(false);
  
  // Edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ repoUrl: '', branch: '', port: 3000, buildCmd: '', startCmd: '' });
  const [saving, setSaving] = useState(false);
  
  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    loadProject();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [projectId]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const loadProject = async () => {
    try {
      const data = await API.request(`/projects/${projectId}`);
      setProject(data);
      setEditForm({
        repoUrl: data.repoUrl,
        branch: data.branch,
        port: data.port,
        buildCmd: data.buildCmd || '',
        startCmd: data.startCmd || ''
      });
      
      // Carregar env vars
      loadEnvVars();
      
      // Se tem deploy ativo, conectar ao stream
      const latestDeploy = data.deployments?.[0];
      if (latestDeploy && ['QUEUED', 'BUILDING', 'DEPLOYING'].includes(latestDeploy.status)) {
        connectToLogStream(latestDeploy.id);
      }
      
      // Carregar métricas se online
      if (latestDeploy?.status === 'HEALTHY') {
        loadMetrics(data.subdomain);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const loadEnvVars = async () => {
    try {
      const data = await API.request(`/projects/${projectId}/env`);
      setEnvVars(data);
    } catch {
      setEnvVars([]);
    }
  };

  const connectToLogStream = (deploymentId: string) => {
    eventSourceRef.current?.close();
    
    const es = new EventSource(API.getStreamUrl(deploymentId));
    eventSourceRef.current = es;
    
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message) {
          setLogs(prev => [...prev, data.message]);
        }
      } catch {
        setLogs(prev => [...prev, event.data]);
      }
    };
    
    es.onerror = () => {
      es.close();
      loadProject();
    };
  };

  const loadMetrics = async (subdomain: string) => {
    try {
      const data = await API.request(`/projects/${subdomain}/metrics`);
      setMetrics(data);
    } catch {}
  };

  const handleDeploy = async () => {
    setDeploying(true);
    setLogs([]);
    try {
      const deployment = await API.request(`/projects/${projectId}/deploy`, { method: 'POST' });
      connectToLogStream(deployment.id);
    } catch (err) {
      setLogs(prev => [...prev, `❌ Erro: ${err instanceof Error ? err.message : 'Falha ao iniciar deploy'}`]);
    } finally {
      setDeploying(false);
    }
  };

  const handleRestart = async () => {
    try {
      await API.request(`/projects/${projectId}/restart`, { method: 'POST' });
      setLogs(prev => [...prev, '🔄 Container reiniciado']);
      loadProject();
    } catch {
      setLogs(prev => [...prev, `❌ Erro ao reiniciar`]);
    }
  };

  const handleStop = async () => {
    try {
      await API.request(`/projects/${projectId}/stop`, { method: 'POST' });
      setLogs(prev => [...prev, '⏹️ Container parado']);
      loadProject();
    } catch {
      setLogs(prev => [...prev, `❌ Erro ao parar`]);
    }
  };
  
  const handleAddEnvVar = async () => {
    if (!newEnvKey || !newEnvValue) return;
    setAddingEnv(true);
    try {
      await API.request(`/projects/${projectId}/env`, {
        method: 'POST',
        body: JSON.stringify({ key: newEnvKey, value: newEnvValue })
      });
      setNewEnvKey('');
      setNewEnvValue('');
      loadEnvVars();
    } catch (err) {
      alert('Erro ao adicionar variável');
    } finally {
      setAddingEnv(false);
    }
  };
  
  const handleDeleteEnvVar = async (envId: string) => {
    try {
      await API.request(`/projects/${projectId}/env/${envId}`, { method: 'DELETE' });
      loadEnvVars();
    } catch {
      alert('Erro ao remover variável');
    }
  };
  
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await API.request(`/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });
      setEditing(false);
      loadProject();
    } catch {
      alert('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await API.request(`/projects/${projectId}`, { method: 'DELETE' });
      router.push('/projects');
    } catch {
      alert('Erro ao deletar projeto');
      setDeleting(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(`https://${project?.subdomain}.sce.local`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent animate-spin rounded-full" />
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Projeto não encontrado</h2>
            <button onClick={() => router.push('/projects')} className="btn-primary mt-4">
              Voltar para Projetos
            </button>
          </div>
        </main>
      </div>
    );
  }

  const latestDeploy = project.deployments?.[0];
  const status = latestDeploy?.status || 'STOPPED';
  const statusConfig = STATUS_CONFIG[status];
  const isActive = ['QUEUED', 'BUILDING', 'DEPLOYING'].includes(status);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/projects')}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-400/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.class}`}>
                  {statusConfig.icon} {statusConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <GitBranch className="w-4 h-4" />
                  {project.branch}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {project.type}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeploy}
              disabled={deploying || isActive}
              className="btn-primary flex items-center gap-2"
            >
              {deploying || isActive ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full" />
                  {isActive ? 'Em progresso...' : 'Iniciando...'}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Deploy
                </>
              )}
            </button>
            
            <button onClick={handleRestart} className="btn-secondary p-3" title="Reiniciar">
              <RotateCcw className="w-5 h-5" />
            </button>
            
            <button onClick={handleStop} className="btn-danger p-3" title="Parar">
              <Square className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* URL Card */}
        <div className="glass-card rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-400/10">
              <Globe className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">URL Pública</p>
              <p className="font-mono text-cyan-400">https://{project.subdomain}.sce.local</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyUrl} className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
              {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-slate-400" />}
            </button>
            <a 
              href={`https://${project.subdomain}.sce.local`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Metrics */}
        {status === 'HEALTHY' && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Cpu className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">CPU</span>
              </div>
              <p className="text-2xl font-bold">{metrics.cpu.toFixed(1)}%</p>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <HardDrive className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Memória</span>
              </div>
              <p className="text-2xl font-bold">{metrics.memory.toFixed(0)} MB</p>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Status</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">Online</p>
            </motion.div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-slate-900/50 p-1 rounded-xl w-fit">
          {[
            { id: 'logs', label: 'Logs', icon: TerminalIcon },
            { id: 'env', label: 'Variáveis', icon: Lock },
            { id: 'settings', label: 'Config', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id ? 'bg-cyan-400 text-black font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'logs' && (
          <div className="terminal">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500" />
              <div className="terminal-dot bg-yellow-500" />
              <div className="terminal-dot bg-green-500" />
              <span className="ml-3 text-xs text-slate-400">Deploy Logs — {project.name}</span>
              {isActive && (
                <span className="ml-auto flex items-center gap-2 text-xs text-cyan-400">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  Streaming...
                </span>
              )}
            </div>
            <div className="terminal-body">
              {logs.length === 0 ? (
                <p className="text-slate-500">Nenhum log disponível. Inicie um deploy para ver os logs em tempo real.</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="py-0.5">
                    <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                    <span className={log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-emerald-400' : 'text-slate-300'}>
                      {log}
                    </span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
              {isActive && <span className="cursor-blink" />}
            </div>
          </div>
        )}

        {activeTab === 'env' && (
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Variáveis de Ambiente</h3>
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Criptografadas AES-256
              </span>
            </div>
            
            {/* Add new env var */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="CHAVE"
                value={newEnvKey}
                onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 font-mono text-sm focus:border-cyan-400 outline-none"
              />
              <input
                type="password"
                placeholder="valor"
                value={newEnvValue}
                onChange={(e) => setNewEnvValue(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 font-mono text-sm focus:border-cyan-400 outline-none"
              />
              <button
                onClick={handleAddEnvVar}
                disabled={!newEnvKey || !newEnvValue || addingEnv}
                className="btn-primary px-4 flex items-center gap-2"
              >
                {addingEnv ? <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full" /> : <Plus className="w-4 h-4" />}
                Adicionar
              </button>
            </div>
            
            {envVars.length > 0 ? (
              <div className="space-y-2">
                {envVars.map((env) => (
                  <div key={env.id} className="flex items-center gap-4 p-3 bg-slate-950 rounded-lg group">
                    <span className="font-mono text-cyan-400 w-48">{env.key}</span>
                    <span className="font-mono text-slate-500 flex-1">••••••••••••</span>
                    <button
                      onClick={() => handleDeleteEnvVar(env.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">Nenhuma variável configurada</p>
            )}
            
            <p className="text-xs text-slate-500 mt-4">
              ⚠️ Após adicionar/remover variáveis, faça um novo deploy para aplicar as mudanças.
            </p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="glass-card rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Configurações do Projeto</h3>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="btn-secondary">Cancelar</button>
                  <button onClick={handleSaveSettings} disabled={saving} className="btn-primary flex items-center gap-2">
                    {saving ? <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full" /> : <Save className="w-4 h-4" />}
                    Salvar
                  </button>
                </div>
              )}
            </div>
            
            {editing ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Repositório</label>
                  <input
                    type="text"
                    value={editForm.repoUrl}
                    onChange={(e) => setEditForm({...editForm, repoUrl: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 font-mono text-sm focus:border-cyan-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Branch</label>
                  <input
                    type="text"
                    value={editForm.branch}
                    onChange={(e) => setEditForm({...editForm, branch: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 font-mono text-sm focus:border-cyan-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Porta</label>
                  <input
                    type="number"
                    value={editForm.port}
                    onChange={(e) => setEditForm({...editForm, port: parseInt(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 font-mono text-sm focus:border-cyan-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Build Command</label>
                  <input
                    type="text"
                    value={editForm.buildCmd}
                    onChange={(e) => setEditForm({...editForm, buildCmd: e.target.value})}
                    placeholder="npm run build"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 font-mono text-sm focus:border-cyan-400 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Start Command</label>
                  <input
                    type="text"
                    value={editForm.startCmd}
                    onChange={(e) => setEditForm({...editForm, startCmd: e.target.value})}
                    placeholder="npm start"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 font-mono text-sm focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 rounded-lg">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Repositório</p>
                  <p className="font-mono text-sm truncate">{project.repoUrl}</p>
                </div>
                <div className="p-4 bg-slate-950 rounded-lg">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Porta</p>
                  <p className="font-mono text-sm">{project.port}</p>
                </div>
                <div className="p-4 bg-slate-950 rounded-lg">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Build Command</p>
                  <p className="font-mono text-sm">{project.buildCmd || 'Auto-detect'}</p>
                </div>
                <div className="p-4 bg-slate-950 rounded-lg">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Start Command</p>
                  <p className="font-mono text-sm">{project.startCmd || 'Auto-detect'}</p>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-800">
              <h4 className="font-bold text-red-400 mb-4">Zona de Perigo</h4>
              {!showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Deletar Projeto
                </button>
              ) : (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-400 mb-4">Tem certeza? Esta ação não pode ser desfeita. O container será parado e todos os dados serão removidos.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">Cancelar</button>
                    <button onClick={handleDelete} disabled={deleting} className="btn-danger flex items-center gap-2">
                      {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <Trash2 className="w-4 h-4" />}
                      Confirmar Exclusão
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
