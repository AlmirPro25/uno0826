'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { API } from '@/lib/api';
import { 
  ArrowLeft, ArrowRight, Box, Globe, GitBranch, 
  Lock, Rocket, Check, AlertCircle, Plus, Trash2,
  Server, Layout
} from 'lucide-react';

type AppType = 'FRONTEND' | 'BACKEND';

interface EnvVar {
  key: string;
  value: string;
}

const STEPS = [
  { id: 1, title: 'Tipo', icon: Box },
  { id: 2, title: 'Repositório', icon: GitBranch },
  { id: 3, title: 'Configuração', icon: Globe },
  { id: 4, title: 'Variáveis', icon: Lock },
  { id: 5, title: 'Deploy', icon: Rocket },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [type, setType] = useState<AppType>('FRONTEND');
  const [name, setName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [subdomain, setSubdomain] = useState('');
  const [port, setPort] = useState(3000);
  const [buildCmd, setBuildCmd] = useState('');
  const [startCmd, setStartCmd] = useState('');
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);

  const addEnvVar = () => setEnvVars([...envVars, { key: '', value: '' }]);
  
  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };
  
  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...envVars];
    updated[index][field] = value;
    setEnvVars(updated);
  };

  const generateSubdomain = (projectName: string) => {
    return projectName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!subdomain || subdomain === generateSubdomain(name)) {
      setSubdomain(generateSubdomain(value));
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return type;
      case 2: return repoUrl && branch;
      case 3: return name && subdomain && port;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const envVarsObj = envVars.reduce((acc, { key, value }) => {
        if (key) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      const project = await API.request('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name,
          type,
          repoUrl,
          branch,
          subdomain,
          port,
          buildCmd: buildCmd || undefined,
          startCmd: startCmd || undefined,
          envVars: Object.keys(envVarsObj).length > 0 ? envVarsObj : undefined,
        }),
      });

      // Trigger deploy automatically
      await API.request(`/projects/${project.id}/deploy`, { method: 'POST' });
      
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar projeto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-400/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Novo Projeto</h1>
            <p className="text-slate-400">Configure e faça deploy da sua aplicação</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <motion.div
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                  step === s.id 
                    ? 'bg-cyan-400/10 border-cyan-400 text-cyan-400' 
                    : step > s.id 
                      ? 'bg-emerald-400/10 border-emerald-400 text-emerald-400'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
                animate={{ scale: step === s.id ? 1.05 : 1 }}
              >
                {step > s.id ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                <span className="text-sm font-medium hidden md:inline">{s.title}</span>
              </motion.div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px mx-2 ${step > s.id ? 'bg-emerald-400' : 'bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Type */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold mb-2">Qual tipo de aplicação?</h2>
                  <p className="text-slate-400">Selecione o tipo para otimizarmos o deploy</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setType('FRONTEND')}
                    className={`p-6 rounded-2xl border-2 transition-all text-left ${
                      type === 'FRONTEND' 
                        ? 'border-cyan-400 bg-cyan-400/5 glow-cyan' 
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <Layout className={`w-10 h-10 mb-4 ${type === 'FRONTEND' ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <h3 className="font-bold text-lg mb-1">Frontend</h3>
                    <p className="text-sm text-slate-400">React, Next.js, Vue, Angular, Static Sites</p>
                  </button>

                  <button
                    onClick={() => setType('BACKEND')}
                    className={`p-6 rounded-2xl border-2 transition-all text-left ${
                      type === 'BACKEND' 
                        ? 'border-purple-400 bg-purple-400/5' 
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                    style={type === 'BACKEND' ? { boxShadow: '0 0 40px rgba(168, 85, 247, 0.15)' } : {}}
                  >
                    <Server className={`w-10 h-10 mb-4 ${type === 'BACKEND' ? 'text-purple-400' : 'text-slate-500'}`} />
                    <h3 className="font-bold text-lg mb-1">Backend</h3>
                    <p className="text-sm text-slate-400">Node.js, Go, Python, Java, APIs</p>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Repository */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold mb-2">Conecte seu repositório</h2>
                  <p className="text-slate-400">Informe a URL do Git para clonarmos o código</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      URL do Repositório *
                    </label>
                    <input
                      type="url"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/usuario/projeto.git"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Branch
                    </label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="main"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                  <p className="text-sm text-slate-400">
                    💡 <strong>Dica:</strong> Para repositórios privados, use tokens de acesso pessoal na URL:
                    <code className="block mt-2 text-xs bg-black/50 p-2 rounded">
                      https://TOKEN@github.com/usuario/repo.git
                    </code>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Configuration */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold mb-2">Configure seu projeto</h2>
                  <p className="text-slate-400">Defina nome, domínio e comandos de build</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Nome do Projeto *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="meu-app"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Subdomínio *
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="meu-app"
                        className="input-field rounded-r-none"
                      />
                      <span className="bg-slate-800 border border-l-0 border-slate-700 px-3 py-3 rounded-r-xl text-slate-400 text-sm">
                        .sce.local
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Porta da Aplicação
                  </label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="input-field w-32"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Comando de Build (opcional)
                    </label>
                    <input
                      type="text"
                      value={buildCmd}
                      onChange={(e) => setBuildCmd(e.target.value)}
                      placeholder="npm run build"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Comando de Start (opcional)
                    </label>
                    <input
                      type="text"
                      value={startCmd}
                      onChange={(e) => setStartCmd(e.target.value)}
                      placeholder="npm start"
                      className="input-field"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Environment Variables */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold mb-2">Variáveis de Ambiente</h2>
                  <p className="text-slate-400">Adicione secrets e configurações (criptografadas em AES-256)</p>
                </div>

                <div className="space-y-3">
                  {envVars.map((env, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={env.key}
                        onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                        placeholder="CHAVE"
                        className="input-field flex-1 font-mono text-sm"
                      />
                      <input
                        type="password"
                        value={env.value}
                        onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                        placeholder="valor"
                        className="input-field flex-[2] font-mono text-sm"
                      />
                      <button
                        onClick={() => removeEnvVar(index)}
                        className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addEnvVar}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 hover:border-cyan-400/50 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar Variável
                </button>

                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-sm text-emerald-400">
                    🔒 Todas as variáveis são criptografadas com AES-256-GCM antes de serem armazenadas.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 5: Review & Deploy */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold mb-2">Revisar e Deployar</h2>
                  <p className="text-slate-400">Confira as configurações antes de iniciar</p>
                </div>

                <div className="glass-card rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                    <span className="text-slate-400">Tipo</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      type === 'FRONTEND' ? 'bg-cyan-400/10 text-cyan-400' : 'bg-purple-400/10 text-purple-400'
                    }`}>
                      {type}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                    <span className="text-slate-400">Nome</span>
                    <span className="font-medium">{name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                    <span className="text-slate-400">Repositório</span>
                    <span className="font-mono text-sm text-slate-300 truncate max-w-xs">{repoUrl}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                    <span className="text-slate-400">Branch</span>
                    <span className="font-mono">{branch}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                    <span className="text-slate-400">URL</span>
                    <span className="font-mono text-cyan-400">https://{subdomain}.sce.local</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Variáveis</span>
                    <span>{envVars.filter(e => e.key).length} configuradas</span>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">{error}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-10">
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className="btn-secondary flex items-center gap-2 disabled:opacity-30"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </button>

            {step < 5 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="btn-primary flex items-center gap-2"
              >
                Próximo
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent animate-spin rounded-full" />
                    Deployando...
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    Iniciar Deploy
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
