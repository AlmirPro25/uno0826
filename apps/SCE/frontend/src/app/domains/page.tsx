'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { API } from '@/lib/api';
import { Project } from '@/types';
import { 
  Globe, Plus, ExternalLink, Shield, CheckCircle2, 
  AlertCircle, RefreshCw, Trash2, Lock
} from 'lucide-react';

interface Domain {
  subdomain: string;
  fullUrl: string;
  projectName: string;
  projectId: string;
  sslStatus: 'active' | 'pending' | 'error';
  isHealthy: boolean;
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const superDomain = 'sce.local';

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      const projects: Project[] = await API.request('/projects');
      const domainList: Domain[] = projects.map(p => ({
        subdomain: p.subdomain,
        fullUrl: `https://${p.subdomain}.${superDomain}`,
        projectName: p.name,
        projectId: p.id,
        sslStatus: 'active' as const,
        isHealthy: p.deployments?.[0]?.status === 'HEALTHY',
      }));
      setDomains(domainList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Globe className="w-8 h-8 text-cyan-400" />
              Domínios
            </h1>
            <p className="text-slate-400 mt-1">Gerencie os domínios das suas aplicações</p>
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Domínio Customizado
          </button>
        </div>

        {/* Super Domain Info */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-cyan-400/10">
                <Shield className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Super Domínio</h3>
                <p className="text-slate-400 font-mono">*.{superDomain}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wider">SSL</p>
                <p className="text-emerald-400 flex items-center gap-1">
                  <Lock className="w-4 h-4" />
                  Wildcard Ativo
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Subdomínios</p>
                <p className="text-2xl font-bold">{domains.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* DNS Instructions */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-8"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <p className="font-medium text-amber-400">Configuração DNS Necessária</p>
              <p className="text-sm text-slate-400 mt-1">
                Para usar domínios customizados, configure um registro A ou CNAME apontando para o IP do seu servidor SCE.
              </p>
              <code className="block mt-2 text-xs bg-black/30 p-2 rounded font-mono text-slate-300">
                *.{superDomain} → A → SEU_IP_SERVIDOR
              </code>
            </div>
          </div>
        </motion.div>

        {/* Domains List */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-lg">Subdomínios Ativos</h3>
            <button 
              onClick={loadDomains}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-slate-900 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : domains.length === 0 ? (
            <div className="p-12 text-center">
              <Globe className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500">Nenhum domínio configurado</p>
              <p className="text-xs text-slate-600 mt-1">Crie uma aplicação para gerar um subdomínio</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {domains.map((domain, i) => (
                <motion.div
                  key={domain.subdomain}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 flex items-center justify-between hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      domain.isHealthy ? 'bg-emerald-400' : 'bg-slate-500'
                    }`} />
                    <div>
                      <p className="font-mono font-medium text-cyan-400">{domain.fullUrl}</p>
                      <p className="text-xs text-slate-500">Projeto: {domain.projectName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      {domain.sslStatus === 'active' ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          SSL Ativo
                        </span>
                      ) : domain.sslStatus === 'pending' ? (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Gerando SSL
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          Erro SSL
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={domain.fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Domain Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 glass-card rounded-2xl p-6"
        >
          <h3 className="font-bold text-lg mb-4">Adicionar Domínio Customizado</h3>
          <p className="text-slate-400 text-sm mb-6">
            Conecte seu próprio domínio a uma aplicação. O SSL será gerado automaticamente via Let's Encrypt.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Domínio</label>
              <input
                type="text"
                placeholder="app.seudominio.com"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Projeto</label>
              <select className="input-field">
                <option value="">Selecione um projeto</option>
                {domains.map(d => (
                  <option key={d.projectId} value={d.projectId}>{d.projectName}</option>
                ))}
              </select>
            </div>
          </div>

          <button className="btn-primary mt-4">
            Adicionar Domínio
          </button>
        </motion.div>
      </main>
    </div>
  );
}
