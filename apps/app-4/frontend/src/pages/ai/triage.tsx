import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/shadcn/Card';
import { Button } from '@/components/ui/shadcn/Button';
import { Input } from '@/components/ui/shadcn/Input';
import { useAuthStore } from '@/hooks/useAuthStore';
import { analyzeClinicalCase, hasApiKey, setUserApiKey, clearUserApiKey, isUserApiKey } from '@/api/ai';
import { TriageInput, TriageOutput, RiskLevel } from '@/types/ai';
import {
  BrainCircuit, Mic, MicOff, Upload, AlertTriangle, CheckCircle2,
  AlertCircle, FileText, Stethoscope, TestTube, Activity,
  RefreshCw, Sparkles, Key, Settings, X, ChevronRight, Dna, ShieldCheck,
  Calendar, MapPin
} from 'lucide-react';
import { SmartScheduler } from '@/components/scheduling';

// Componente de Badge de Risco
function RiskBadge({ level }: { level: RiskLevel }) {
  const config = {
    [RiskLevel.LOW]: {
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      icon: <CheckCircle2 className="w-5 h-5" />,
      label: 'BAIXO RISCO',
      animation: 'border-emerald-500/50'
    },
    [RiskLevel.MEDIUM]: {
      bg: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
      icon: <AlertTriangle className="w-5 h-5" />,
      label: 'ATENÇÃO CLÍNICA',
      animation: 'animate-pulse border-amber-500/50'
    },
    [RiskLevel.HIGH]: {
      bg: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
      icon: <AlertCircle className="w-5 h-5" />,
      label: 'EMERGÊNCIA MÉDICA',
      animation: 'animate-pulse border-red-500/50' // Could add more intense animation
    }
  };

  const c = config[level] || config[RiskLevel.LOW];

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border ${c.bg} font-bold shadow-sm ${c.animation}`}
    >
      {c.icon}
      <span className="tracking-wide">{c.label}</span>
    </motion.div>
  );
}

export default function AITriagePage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuthStore();

  const [text, setText] = useState('');
  const [age, setAge] = useState('');
  const [history, setHistory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TriageOutput | null>(null);
  const [error, setError] = useState('');

  // API Key config
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [isUserKey, setIsUserKey] = useState(false);

  // Voice recognition
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Smart Scheduler
  const [showScheduler, setShowScheduler] = useState(false);
  const [patientLocation, setPatientLocation] = useState<{ lat: number; lng: number } | undefined>();

  // Check API key status
  useEffect(() => {
    setHasKey(hasApiKey());
    setIsUserKey(isUserApiKey());
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Navegador não suporta reconhecimento de voz');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript + ' ';
        }
      }
      setText(prev => prev + ' ' + transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setImages(prev => [...prev, reader.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('Descreva os sintomas do paciente');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const input: TriageInput = {
        text,
        images,
        context: { age, history }
      };
      const output = await analyzeClinicalCase(input);
      setResult(output);
    } catch (err) {
      setError('Erro ao processar análise. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setText('');
    setAge('');
    setHistory('');
    setImages([]);
    setResult(null);
    setError('');
    setShowScheduler(false);
  };

  const handleOpenScheduler = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPatientLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setShowScheduler(true);
        },
        () => setShowScheduler(true)
      );
    } else {
      setShowScheduler(true);
    }
  };

  const handleScheduled = (appointmentId: number) => {
    setShowScheduler(false);
    router.push(`/paciente/appointments/${appointmentId}`);
  };

  // Get specialty from hypotheses
  const getRecommendedSpecialty = () => {
    if (!result) return 'Clínico Geral';
    const hypotheses = result.hypotheses.join(' ').toLowerCase();
    if (hypotheses.includes('cardio') || hypotheses.includes('coração')) return 'Cardiologia';
    if (hypotheses.includes('neuro') || hypotheses.includes('cabeça')) return 'Neurologia';
    if (hypotheses.includes('gastro') || hypotheses.includes('abdomen')) return 'Gastroenterologia';
    if (hypotheses.includes('pneumo') || hypotheses.includes('pulmão')) return 'Pneumologia';
    if (hypotheses.includes('ortop') || hypotheses.includes('osso')) return 'Ortopedia';
    if (hypotheses.includes('derma') || hypotheses.includes('pele')) return 'Dermatologia';
    return 'Clínico Geral';
  };

  const getPriorityFromRisk = () => {
    if (!result) return 'Pouco Urgente';
    switch (result.risk_level) {
      case RiskLevel.HIGH: return 'Muito Urgente';
      case RiskLevel.MEDIUM: return 'Urgente';
      default: return 'Pouco Urgente';
    }
  };

  const saveApiKey = () => {
    if (apiKeyInput.trim()) {
      setUserApiKey(apiKeyInput.trim());
      setHasKey(true);
      setIsUserKey(true);
      setShowApiConfig(false);
      setApiKeyInput('');
    }
  };

  const removeApiKey = () => {
    clearUserApiKey();
    setHasKey(hasApiKey()); // Check if system key exists
    setIsUserKey(false);
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 pb-12">
      <Head>
        <title>Triagem Inteligente | MediSync</title>
      </Head>

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-6 px-4 shadow-sm">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                  Triagem Cognitiva
                </h1>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  POWERED BY GEMINI ROBOTICS • MCC-01
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiConfig(!showApiConfig)}
              className={`transition-colors ${hasKey ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 'border-amber-200 text-amber-700 bg-amber-50'}`}
            >
              <Key className="w-4 h-4 mr-2" />
              {hasKey ? (isUserKey ? 'Chave Pessoal Ativa' : 'Sistema Conectado') : 'Configurar Acesso'}
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-5xl px-4 py-8">

        {/* API Config Panel */}
        <AnimatePresence>
          {showApiConfig && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <Card className="border-l-4 border-l-primary shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Settings className="w-5 h-5 text-slate-500" />
                      Configuração do Motor Cognitivo
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowApiConfig(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {isUserKey ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 rounded-lg flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <div>
                          <p className="font-medium">Chave de API Validada</p>
                          <p className="text-xs opacity-80">Seu acesso pessoal está ativo e seguro.</p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={removeApiKey} className="text-red-600 hover:bg-red-50">
                        Revogar Credencial
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          placeholder="Cole sua chave da Google Generative AI..."
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          className="flex-1 font-mono text-sm"
                        />
                        <Button onClick={saveApiKey} disabled={!apiKeyInput.trim()}>
                          Conectar
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">
                        Necessário para processamento de casos reais em alta disponibilidade.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!result ? (
            /* Formulário de Entrada */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-xl bg-white/50 backdrop-blur-sm border-slate-200/60 dark:bg-slate-900/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-primary" />
                    Admissão Clínica
                  </CardTitle>
                  <CardDescription>
                    Insira os dados do paciente para análise preditiva e estratificação de risco.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Contexto do Paciente */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Idade do Paciente</label>
                      <Input
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Ex: 45 anos"
                        className="bg-white dark:bg-slate-950"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Histórico Patológico Prévio</label>
                      <Input
                        value={history}
                        onChange={(e) => setHistory(e.target.value)}
                        placeholder="Ex: Hipertenso, Diabético, Cirurgia recente..."
                        className="bg-white dark:bg-slate-950"
                      />
                    </div>
                  </div>

                  {/* Queixa Principal */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Anamnese / Relato Clínico</label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleVoice}
                        className={`transition-all duration-300 ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-500'}`}
                      >
                        {isListening ? (
                          <><MicOff className="w-4 h-4 mr-2" /> Ouvindo...</>
                        ) : (
                          <><Mic className="w-4 h-4 mr-2" /> Ditar Relato</>
                        )}
                      </Button>
                    </div>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Descreva a sintomatologia, evolução temporal, fatores de melhora/piora e sinais vitais se disponíveis..."
                      className={`w-full h-40 p-4 rounded-xl border bg-white dark:bg-slate-950 resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${isListening ? 'border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.1)]' : 'border-slate-200 dark:border-slate-800'
                        }`}
                    />
                  </div>

                  {/* Upload de Imagens */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Evidências Visuais (Opcional)</label>
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer relative group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500">
                          <span className="text-primary font-medium">Clique para enviar</span> exames, fotos de lesões ou laudos
                        </p>
                      </div>
                    </div>
                    {images.length > 0 && (
                      <div className="flex gap-3 mt-4 overflow-x-auto py-2">
                        {images.map((img, i) => (
                          <div key={i} className="relative w-20 h-20 flex-shrink-0 group">
                            <img src={img} alt="" className="w-full h-full object-cover rounded-lg shadow-sm border border-slate-200" />
                            <button
                              onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Botão de Análise */}
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !text.trim()}
                    className="w-full h-14 text-lg font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-xl"
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processando Análise Cognitiva...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5" />
                        <span>Iniciar Triagem Inteligente</span>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* Resultado da Triagem */
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Header do Resultado */}
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Dna className="w-6 h-6 text-primary" />
                    Análise Concluída
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">Protocolo MCC-01 • Confiança: Alta</p>
                </div>
                <RiskBadge level={result.risk_level} />
              </div>

              {/* Raciocínio */}
              <Card className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900 border-none shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 uppercase tracking-wide opacity-50">Raciocínio Clínico</h4>
                      <p className="text-slate-700 dark:text-slate-300 italic text-lg leading-relaxed">
                        "{result.risk_reasoning}"
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Resumo Clínico */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="h-full border-t-4 border-t-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                        <FileText className="w-5 h-5" />
                        Resumo do Caso
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">{result.summary}</p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Hipóteses */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="h-full border-t-4 border-t-purple-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                        <Stethoscope className="w-5 h-5" />
                        Hipóteses Diagnósticas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {result.hypotheses.map((h, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                            <span className="text-slate-700 dark:text-slate-200 font-medium">{h}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Condutas */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Card className="h-full border-t-4 border-t-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <Activity className="w-5 h-5" />
                        Conduta Sugerida
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.immediate_actions.map((a, i) => (
                          <li key={i} className="text-sm bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-900 dark:text-emerald-100 px-4 py-3 rounded-lg border-l-4 border-emerald-400 flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Exames */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <Card className="h-full border-t-4 border-t-cyan-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
                        <TestTube className="w-5 h-5" />
                        Exames Complementares
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {result.suggested_exams.map((e, i) => (
                          <span key={i} className="bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 px-3 py-1.5 rounded-full text-xs font-semibold border border-cyan-100 dark:border-cyan-800">
                            {e}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Disclaimer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="bg-slate-900 text-slate-300 p-6 rounded-xl text-sm border border-slate-700 shadow-inner"
              >
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-white mb-1">AVISO DE SEGURANÇA (MCC-01):</p>
                    <p className="opacity-80 leading-relaxed text-xs">{result.disclaimer}</p>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800"
              >
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Próximos Passos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    onClick={() => router.push({
                      pathname: '/ai/emergency-room',
                      query: {
                        complaint: text,
                        age: age,
                        history: history,
                        name: 'Paciente Triagem'
                      }
                    })}
                    className="h-14 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg shadow-red-500/20 animate-pulse border border-red-400"
                  >
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-xs uppercase font-bold text-red-100 mb-1">Prioridade Alta</span>
                      <div className="flex items-center gap-2 text-lg">
                        <Stethoscope className="w-5 h-5" />
                        Falar com Dr. Nexus
                      </div>
                    </div>
                  </Button>
                  <Button
                    onClick={handleOpenScheduler}
                    className="h-14 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Agendamento Inteligente
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/clinics?specialty=${encodeURIComponent(getRecommendedSpecialty())}`)}
                    className="h-14"
                  >
                    <MapPin className="w-5 h-5 mr-2" />
                    Encontrar Clínicas
                  </Button>
                  <Button variant="outline" onClick={resetForm} className="h-14">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Nova Triagem
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart Scheduler Modal */}
        {showScheduler && result && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <SmartScheduler
              specialty={getRecommendedSpecialty()}
              priority={getPriorityFromRisk()}
              patientLocation={patientLocation}
              onScheduled={handleScheduled}
              onClose={() => setShowScheduler(false)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
