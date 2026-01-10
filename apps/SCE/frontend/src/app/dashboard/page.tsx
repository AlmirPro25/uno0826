
'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { AuthGuard } from '@/components/AuthGuard';
import { Project } from '@/types';
import { API } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Server, Cpu, Layers, Plus, Box, Globe, Rocket, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickDeploying, setQuickDeploying] = useState(false);
  const [quickDeployStatus, setQuickDeployStatus] = useState('');
  const [infraStats, setInfraStats] = useState<{
    containers: number;
    totalCpuUsage: string;
    totalMemoryUsage: string;
    uptime: number;
  } | null>(null);

  useEffect(() => {
    // Carregar projetos
    API.request('/projects')
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
    
    // Carregar métricas reais
    API.request('/infra/stats')
      .then(setInfraStats)
      .catch(() => setInfraStats(null));
  }, []);

  // Quick Deploy - 1 clique
  async function handleQuickDeploy() {
    setQuickDeploying(true);
    setQuickDeployStatus('Criando seu app...');
    
    try {
      const result = await API.request('/quick-deploy', { method: 'POST' });
      setQuickDeployStatus('Deploy iniciado! Redirecionando...');
      
      // Redirecionar para página do projeto
      setTimeout(() => {
        router.push(`/projects/${result.project.id}`);
      }, 1500);
      
    } catch (error) {
      setQuickDeployStatus('Erro ao criar app. Tente novamente.');
      setQuickDeploying(false);
    }
  }

  // Formatar uptime
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const stats = [
    { label: 'Apps Ativos', value: projects.length, icon: Server, color: 'text-emerald-400' },
    { label: 'Containers', value: infraStats?.containers ?? 0, icon: Layers, color: 'text-purple-400' },
    { label: 'CPU Total', value: infraStats?.totalCpuUsage ?? '0%', icon: Cpu, color: 'text-blue-400' },
    { label: 'Uptime API', value: infraStats ? formatUptime(infraStats.uptime) : '-', icon: Activity, color: 'text-primary' },
  ];

  return (
    <AuthGuard>
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Centro de Comando</h1>
            <p className="text-slate-400">Gerencie sua infraestrutura soberana em tempo real.</p>
          </div>
          <Link 
            href="/projects/new"
            className="bg-primary text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Plus className="w-5 h-5" /> Novo App
          </Link>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 rounded-xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg bg-slate-950 border border-slate-800 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-slate-400 text-sm font-medium">{stat.label}</h3>
              <p className="text-2xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </section>

        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Aplicações Recentes</h2>
            <Link href="/projects" className="text-primary text-sm hover:underline">Ver todas</Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="h-24 bg-slate-900 animate-pulse rounded-xl border border-slate-800" />)
            ) : projects.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-10 rounded-xl text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Rocket className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Bem-vindo à sua infraestrutura!</h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  Crie seu primeiro app em segundos. Clique no botão abaixo e veja a mágica acontecer.
                </p>
                
                <button
                  onClick={handleQuickDeploy}
                  disabled={quickDeploying}
                  className="inline-flex items-center gap-3 bg-primary text-black px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {quickDeploying ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      {quickDeployStatus}
                    </>
                  ) : (
                    <>
                      <Rocket className="w-6 h-6" />
                      Criar meu primeiro app
                    </>
                  )}
                </button>
                
                <p className="text-xs text-slate-500 mt-4">
                  Um app de exemplo será criado e deployado automaticamente
                </p>
              </motion.div>
            ) : (
              projects.map((project, i) => (
                <motion.div 
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-4 rounded-xl flex items-center justify-between group cursor-pointer"
                  onClick={() => window.location.href = `/projects/${project.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center border",
                      project.type === 'BACKEND' ? "bg-purple-500/10 border-purple-500/50" : "bg-blue-500/10 border-blue-500/50"
                    )}>
                      {project.type === 'BACKEND' ? <Box className="text-purple-400" /> : <Globe className="text-blue-400" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{project.name}</h4>
                      <p className="text-sm text-slate-500 font-mono">{project.subdomain}.sce.local</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-medium text-emerald-400">HEALTHY</span>
                      </div>
                    </div>
                    <div className="h-10 w-px bg-slate-800" />
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Branch</p>
                      <p className="text-sm font-mono">{project.branch}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
    </AuthGuard>
  );
}
