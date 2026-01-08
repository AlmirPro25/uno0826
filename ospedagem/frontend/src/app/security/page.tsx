'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { 
  Shield, Key, Lock, Fingerprint, Link2, CheckCircle2,
  AlertTriangle, ExternalLink, Zap, Database, Server
} from 'lucide-react';

export default function SecurityPage() {
  const [prostQsConnected, setProstQsConnected] = useState(false);
  const [prostQsUrl, setProstQsUrl] = useState('http://localhost:8080');

  const handleConnect = () => {
    // Simula conexão com Prost-QS
    setProstQsConnected(true);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-400" />
            Segurança & Integração
          </h1>
          <p className="text-slate-400 mt-1">Configure autenticação e conecte ao Prost-QS</p>
        </div>

        {/* Integration Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* SCE Status */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-cyan-400/10">
                <Server className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Sovereign Cloud Engine</h3>
                <p className="text-sm text-slate-400">Sistema de Hospedagem</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm text-emerald-400">Online</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                <span className="text-slate-400">Autenticação</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  JWT Local
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                <span className="text-slate-400">Criptografia</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  AES-256-GCM
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                <span className="text-slate-400">SSL/TLS</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Let's Encrypt
                </span>
              </div>
            </div>
          </motion.div>

          {/* Prost-QS Integration */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`glass-card rounded-2xl p-6 ${
              prostQsConnected ? 'border-emerald-500/50' : 'border-amber-500/50'
            }`}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-xl ${prostQsConnected ? 'bg-emerald-400/10' : 'bg-amber-400/10'}`}>
                <Database className={`w-8 h-8 ${prostQsConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Prost-QS Kernel</h3>
                <p className="text-sm text-slate-400">Identity & Payments</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {prostQsConnected ? (
                  <>
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-sm text-emerald-400">Conectado</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="text-sm text-amber-400">Desconectado</span>
                  </>
                )}
              </div>
            </div>

            {!prostQsConnected ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    URL do Prost-QS
                  </label>
                  <input
                    type="url"
                    value={prostQsUrl}
                    onChange={(e) => setProstQsUrl(e.target.value)}
                    placeholder="http://localhost:8080"
                    className="input-field"
                  />
                </div>
                <button onClick={handleConnect} className="btn-primary w-full flex items-center justify-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Conectar ao Prost-QS
                </button>
                <p className="text-xs text-slate-500 text-center">
                  Conecte para usar SSO e billing integrado
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                  <span className="text-slate-400">SSO</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Ativo
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                  <span className="text-slate-400">Billing</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Sincronizado
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                  <span className="text-slate-400">Event Ledger</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Conectado
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Architecture Diagram */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-8 mb-8"
        >
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            Arquitetura de Integração
          </h3>

          <div className="relative">
            {/* Visual Diagram */}
            <div className="flex items-center justify-center gap-8 py-8">
              {/* User */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mx-auto mb-2">
                  <Fingerprint className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-sm font-medium">Usuário</p>
              </div>

              {/* Arrow */}
              <div className="flex-1 max-w-24 h-0.5 bg-gradient-to-r from-slate-700 via-cyan-400 to-slate-700 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs text-cyan-400">Login</div>
              </div>

              {/* Prost-QS */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border-2 border-purple-500/50 flex items-center justify-center mx-auto mb-2">
                  <Database className="w-10 h-10 text-purple-400" />
                </div>
                <p className="text-sm font-medium">Prost-QS</p>
                <p className="text-xs text-slate-500">Identity Kernel</p>
              </div>

              {/* Arrow */}
              <div className="flex-1 max-w-24 h-0.5 bg-gradient-to-r from-slate-700 via-emerald-400 to-slate-700 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs text-emerald-400">JWT</div>
              </div>

              {/* SCE */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border-2 border-cyan-500/50 flex items-center justify-center mx-auto mb-2">
                  <Server className="w-10 h-10 text-cyan-400" />
                </div>
                <p className="text-sm font-medium">SCE</p>
                <p className="text-xs text-slate-500">Cloud Engine</p>
              </div>

              {/* Arrow */}
              <div className="flex-1 max-w-24 h-0.5 bg-gradient-to-r from-slate-700 via-blue-400 to-slate-700 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs text-blue-400">Deploy</div>
              </div>

              {/* Apps */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl bg-blue-500/10 border-2 border-blue-500/50 flex items-center justify-center mx-auto mb-2">
                  <Zap className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-sm font-medium">Apps</p>
              </div>
            </div>

            {/* Flow Description */}
            <div className="grid grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
              <div className="text-center p-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-2 text-sm font-bold">1</div>
                <p className="text-xs text-slate-400">Usuário autentica no Prost-QS</p>
              </div>
              <div className="text-center p-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 text-sm font-bold">2</div>
                <p className="text-xs text-slate-400">Recebe JWT soberano</p>
              </div>
              <div className="text-center p-4">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-2 text-sm font-bold">3</div>
                <p className="text-xs text-slate-400">SCE valida e autoriza</p>
              </div>
              <div className="text-center p-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-2 text-sm font-bold">4</div>
                <p className="text-xs text-slate-400">Deploy e acesso aos apps</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-xl p-6"
          >
            <Key className="w-8 h-8 text-amber-400 mb-4" />
            <h4 className="font-bold mb-2">Criptografia End-to-End</h4>
            <p className="text-sm text-slate-400">
              Todas as variáveis de ambiente são criptografadas com AES-256-GCM antes de serem armazenadas.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-xl p-6"
          >
            <Lock className="w-8 h-8 text-emerald-400 mb-4" />
            <h4 className="font-bold mb-2">Isolamento de Containers</h4>
            <p className="text-sm text-slate-400">
              Cada aplicação roda em container isolado com limites de CPU e memória definidos.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card rounded-xl p-6"
          >
            <Shield className="w-8 h-8 text-cyan-400 mb-4" />
            <h4 className="font-bold mb-2">Zero Trust Network</h4>
            <p className="text-sm text-slate-400">
              Comunicação entre serviços apenas via rede interna SCE com validação de tokens.
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
