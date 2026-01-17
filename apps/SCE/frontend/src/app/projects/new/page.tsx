'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { API } from '@/lib/api';
import { 
  ArrowLeft, ArrowRight, Globe, GitBranch, 
  Lock, Rocket, Check, AlertCircle, Plus, Trash2,
  Server, Layout, Loader2, FolderTree, Sparkles,
  FileCode, Cpu, Zap
} from 'lucide-react';

type AppType = 'FRONTEND' | 'BACKEND' | 'FULLSTACK' | 'UNKNOWN';

interface EnvVar {
  key: string;
  value: string;
}

interface DetectedProject {
  path: string;
  name: string;
  type: AppType;
  framework: string;
  language: string;
  port: number;
  buildCmd?: string;
  startCmd?: string;
  hasDockerfile: boolean;
  confidence: number;
}

interface RepoAnalysis {
  repoUrl: string;
  branch: string;
  isMonorepo: boolean;
  projects: DetectedProject[];
  totalFiles: number;
}

const STEPS = [
  { id: 1, title: 'Repositório', icon: GitBranch },
  { id: 2, title: 'Análise', icon: FolderTree },
  { id: 3, title: 'Configuração', icon: Globe },
  { id: 4, title: 'Variáveis', icon: Lock },
  { id: 5, title: 'Deploy', icon: Rocket },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  
  // Analysis state
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);
  const [selectedProject, setSelectedProject] = useState<DetectedProject | null>(null);
  
  // Config state (preenchido pela análise)
  const [name, setName] = useState('');
  const [type, setType] = useState<AppType>('FRONTEND');
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

  // Analisar repositório
  const analyzeRepo = async () => {
    if (!repoUrl) return;
    
    setAnalyzing(true);
    setError('');
    
    try {
      const result = await API.request('/repo/analyze', {
        method: 'POST',
        body: JSON.stringify({ repoUrl, branch }),
      });
      
      setAnalysis(result.data);
      
      // Se só tem um projeto, seleciona automaticamente
      if (result.data.projects.length === 1) {
        selectProject(result.data.projects[0]);
      }
      
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao analisar repositório');
    } finally {
      setAnalyzing(false);
    }
  };

  // Selecionar projeto detectado
  const selectProject = (project: DetectedProject) => {
    setSelectedProject(project);
    setName(project.name);
    setType(project.type === 'UNKNOWN' ? 'FRONTEND' : project.type as any);
    setSubdomain(generateSubdomain(project.name));
    setPort(project.port);
    setBuildCmd(project.buildCmd || '');
    setStartCmd(project.startCmd || '');
  };

  const canProceed = () => {
    switch (step) {
      case 1: return repoUrl && branch;
      case 2: return selectedProject !== null;
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

      // Determinar o path do projeto no repo
      const projectPath = selectedProject?.path === '.' ? '' : selectedProject?.path;
      const finalRepoUrl = projectPath 
        ? `${repoUrl}#${projectPath}` // Alguns sistemas suportam isso
        : repoUrl;

      const project = await API.request('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name,
          type: type === 'FULLSTACK' || type === 'UNKNOWN' ? 'BACKEND' : type,
          repoUrl: finalRepoUrl,
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

  const getTypeColor = (t: AppType) => {
    switch (t) {
      case 'FRONTEND': return 'text-cyan-400 bg-cyan-400/10';
      case 'BACKEND': return 'text-purple-400 bg-purple-400/10';
      case 'FULLSTACK': return 'text-amber-400 bg-amber-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-emerald-400';
    if (confidence >= 50) return 'text-amber-400';
    return 'text-red-400';
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
            <p className="text-slate-400">Cole o link do Git e deixe a IA analisar</p>
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
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Repository URL */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold mb-2">Cole o link do repositório</h2>
                  <p className="text-slate-400">A IA vai analisar e detectar automaticamente o tipo de projeto</p>
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
                      placeholder="https://github.com/usuario/projeto"
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

                <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-cyan-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-cyan-400 font-medium">Análise Inteligente</p>
                      <p className="text-sm text-slate-400 mt-1">
                        O sistema vai detectar automaticamente: framework, linguagem, porta, 
                        comandos de build e se é um monorepo.
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">{error}</span>
                  </div>
                )}

                <button
                  onClick={analyzeRepo}
                  disabled={!repoUrl || analyzing}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analisando repositório...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Analisar Repositório
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* Step 2: Analysis Results */}
            {step === 2 && analysis && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold mb-2">
                    {analysis.isMonorepo ? 'Monorepo Detectado!' : 'Projeto Detectado!'}
                  </h2>
                  <p className="text-slate-400">
                    {analysis.projects.length > 1 
                      ? 'Selecione qual projeto você quer hospedar'
                      : 'Confirme as configurações detectadas'}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="glass-card rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-cyan-400">{analysis.totalFiles}</div>
                    <div className="text-xs text-slate-500">Arquivos</div>
                  </div>
                  <div className="glass-card rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400">{analysis.projects.length}</div>
                    <div className="text-xs text-slate-500">Projetos</div>
                  </div>
                  <div className="glass-card rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-400">{analysis.branch}</div>
                    <div className="text-xs text-slate-500">Branch</div>
                  </div>
                </div>

                {/* Projects List */}
                <div className="space-y-3">
                  {analysis.projects.map((project, i) => (
                    <button
                      key={i}
                      onClick={() => selectProject(project)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedProject?.path === project.path
                          ? 'border-cyan-400 bg-cyan-400/5'
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getTypeColor(project.type)}`}>
                            {project.type === 'FRONTEND' ? <Layout className="w-5 h-5" /> : 
                             project.type === 'BACKEND' ? <Server className="w-5 h-5" /> :
                             <Cpu className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="font-bold">{project.name}</h3>
                            <p className="text-sm text-slate-500 font-mono">{project.path}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-medium ${getConfidenceColor(project.confidence)}`}>
                            {project.confidence}% confiança
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="px-2 py-1 rounded-full text-xs bg-slate-800 text-slate-300">
                          {project.framework}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs bg-slate-800 text-slate-300">
                          {project.language}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs bg-slate-800 text-slate-300">
                          :{project.port}
                        </span>
                        {project.hasDockerfile && (
                          <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                            Dockerfile ✓
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
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
                  <h2 className="text-xl font-bold mb-2">Ajuste as configurações</h2>
                  <p className="text-slate-400">Valores pré-preenchidos pela análise</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Nome do Projeto *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setSubdomain(generateSubdomain(e.target.value));
                      }}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Tipo
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as AppType)}
                      className="input-field"
                    >
                      <option value="FRONTEND">Frontend</option>
                      <option value="BACKEND">Backend</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Subdomínio *
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="input-field rounded-r-none"
                      />
                      <span className="bg-slate-800 border border-l-0 border-slate-700 px-3 py-3 rounded-r-xl text-slate-400 text-sm">
                        .sce.prostqs.com.br
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Porta
                    </label>
                    <input
                      type="number"
                      value={port}
                      onChange={(e) => setPort(Number(e.target.value))}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Comando de Build
                    </label>
                    <input
                      type="text"
                      value={buildCmd}
                      onChange={(e) => setBuildCmd(e.target.value)}
                      placeholder="npm run build"
                      className="input-field font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Comando de Start
                    </label>
                    <input
                      type="text"
                      value={startCmd}
                      onChange={(e) => setStartCmd(e.target.value)}
                      placeholder="npm start"
                      className="input-field font-mono text-sm"
                    />
                  </div>
                </div>

                {selectedProject && (
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <FileCode className="w-4 h-4" />
                      <span>Detectado: <strong className="text-white">{selectedProject.framework}</strong> em <strong className="text-white">{selectedProject.language}</strong></span>
                    </div>
                  </div>
                )}
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
                    <span className="text-slate-400">Framework</span>
                    <span className="font-mono text-sm">{selectedProject?.framework || 'N/A'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                    <span className="text-slate-400">Repositório</span>
                    <span className="font-mono text-sm text-slate-300 truncate max-w-xs">{repoUrl}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                    <span className="text-slate-400">URL</span>
                    <span className="font-mono text-cyan-400">https://{subdomain}.sce.prostqs.com.br</span>
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
                    <Loader2 className="w-5 h-5 animate-spin" />
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
