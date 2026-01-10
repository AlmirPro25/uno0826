'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { API } from '@/lib/api';
import { Project, DeploymentStatus } from '@/types';
import { 
  Plus, Box, Globe, Server, Layout, GitBranch, 
  ExternalLink, MoreVertical, Search, Filter
} from 'lucide-react';

const STATUS_COLORS: Record<DeploymentStatus, string> = {
  QUEUED: 'bg-amber-400',
  BUILDING: 'bg-amber-400 animate-pulse',
  DEPLOYING: 'bg-blue-400 animate-pulse',
  HEALTHY: 'bg-emerald-400',
  FAILED: 'bg-red-400',
  STOPPED: 'bg-slate-500',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'FRONTEND' | 'BACKEND'>('ALL');

  useEffect(() => {
    API.request('/projects')
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.subdomain.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || p.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Aplicações</h1>
            <p className="text-slate-400 mt-1">Gerencie suas aplicações deployadas</p>
          </div>
          <Link href="/projects/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nova Aplicação
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou subdomínio..."
              className="input-field pl-12"
            />
          </div>
          
          <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl">
            {(['ALL', 'FRONTEND', 'BACKEND'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f 
                    ? 'bg-cyan-400 text-black' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f === 'ALL' ? 'Todos' : f === 'FRONTEND' ? 'Frontend' : 'Backend'}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-slate-900 animate-pulse rounded-2xl border border-slate-800" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <Box className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">
              {search || filter !== 'ALL' ? 'Nenhum resultado' : 'Nenhuma aplicação ainda'}
            </h3>
            <p className="text-slate-500 mb-6">
              {search || filter !== 'ALL' 
                ? 'Tente ajustar os filtros de busca' 
                : 'Crie sua primeira aplicação soberana'}
            </p>
            {!search && filter === 'ALL' && (
              <Link href="/projects/new" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Criar Aplicação
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project, i) => {
              const latestDeploy = project.deployments?.[0];
              const status = latestDeploy?.status || 'STOPPED';
              
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/projects/${project.id}`}>
                    <div className="glass-card rounded-2xl p-6 h-full hover:border-cyan-400/50 transition-all group cursor-pointer">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl ${
                          project.type === 'FRONTEND' 
                            ? 'bg-cyan-400/10 text-cyan-400' 
                            : 'bg-purple-400/10 text-purple-400'
                        }`}>
                          {project.type === 'FRONTEND' ? <Layout className="w-6 h-6" /> : <Server className="w-6 h-6" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status]}`} />
                        </div>
                      </div>

                      {/* Info */}
                      <h3 className="font-bold text-lg mb-1 group-hover:text-cyan-400 transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-slate-500 font-mono mb-4">
                        {project.subdomain}.sce.local
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <GitBranch className="w-3.5 h-3.5" />
                          {project.branch}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Globe className="w-3.5 h-3.5" />
                          :{project.port}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Stats Footer */}
        {projects.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between text-sm text-slate-500">
            <span>{filteredProjects.length} de {projects.length} aplicações</span>
            <span>
              {projects.filter(p => p.deployments?.[0]?.status === 'HEALTHY').length} online
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
