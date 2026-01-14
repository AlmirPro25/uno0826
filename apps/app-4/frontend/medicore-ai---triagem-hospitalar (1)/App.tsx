import React, { useState } from 'react';
import DoctorInterface from './components/DoctorInterface';
import TriageReportCard from './components/TriageReportCard';
import { generateMedicalReport } from './services/aiService';
import { TriageReport } from './types';
import { Loader2, ShieldCheck, Stethoscope } from 'lucide-react';

function App() {
  const [report, setReport] = useState<TriageReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSessionEnd = async (transcript: string) => {
    if (!transcript.trim()) {
        setError("Nenhuma conversa detectada para gerar relatório.");
        return;
    }

    setIsProcessing(true);
    setError(null);
    
    try {
        // Delegate to the "Big Brain" (Gemini 1.5 Pro)
        const result = await generateMedicalReport(transcript);
        setReport(result);
    } catch (e) {
        setError("Erro ao gerar relatório médico. Tente novamente.");
        console.error(e);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setReport(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      
      {/* Navigation / Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2 text-cyan-700">
                <div className="bg-cyan-600 p-2 rounded-lg text-white">
                    <Stethoscope size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-bold leading-none">MediCore AI</h1>
                    <span className="text-xs text-slate-500 font-medium">Sistema de Triagem Inteligente</span>
                </div>
            </div>
            <div className="hidden md:flex items-center space-x-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                <span className="flex items-center space-x-1">
                    <ShieldCheck size={14} className="text-green-500" />
                    <span>Ambiente Seguro</span>
                </span>
                <span>v2.5.0-beta</span>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6">
        
        {isProcessing ? (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 animate-fade-in">
                <Loader2 className="w-12 h-12 text-cyan-600 animate-spin" />
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-slate-800">Processando Triagem...</h3>
                    <p className="text-slate-500 text-sm max-w-md mt-2">
                        O Modelo Especialista está analisando a transcrição, consultando bases de dados externas e gerando o protocolo de Manchester.
                    </p>
                </div>
            </div>
        ) : report ? (
            <TriageReportCard report={report} onReset={handleReset} />
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[80vh] min-h-[600px]">
                {/* Left Panel: Instructions/Context */}
                <div className="hidden lg:block lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4">Protocolo de Uso</h3>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li className="flex items-start">
                                <span className="mr-2 text-cyan-600 font-bold">1.</span>
                                Clique em "Iniciar Turno" para ativar o médico virtual.
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2 text-cyan-600 font-bold">2.</span>
                                Descreva sintomas e histórico como se estivesse com um paciente.
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2 text-cyan-600 font-bold">3.</span>
                                O médico usará o "Dokingo" para verificar termos técnicos.
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2 text-cyan-600 font-bold">4.</span>
                                Clique em "Gerar Relatório" para finalizar e receber a classificação de risco.
                            </li>
                        </ul>
                    </div>
                    
                    <div className="bg-indigo-900 p-6 rounded-2xl shadow-lg text-white bg-opacity-90 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold mb-2">Modo Simulação</h3>
                            <p className="text-xs text-indigo-200 mb-4">
                                Esta aplicação utiliza Gemini 2.5 Flash para conversação em tempo real e delega para Gemini 3 Pro para análise clínica profunda.
                            </p>
                            <div className="inline-block px-2 py-1 bg-indigo-800 rounded text-xs font-mono">
                                API: Live + Search Grounding
                            </div>
                        </div>
                        {/* Decorative Circle */}
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500 rounded-full opacity-20 blur-xl"></div>
                    </div>
                </div>

                {/* Center/Right Panel: The Live Interface */}
                <div className="col-span-1 lg:col-span-2 h-full">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
                            <span>{error}</span>
                            <button onClick={() => setError(null)} className="font-bold hover:underline">Fechar</button>
                        </div>
                    )}
                    <DoctorInterface onSessionEnd={handleSessionEnd} />
                </div>
            </div>
        )}

      </main>
    </div>
  );
}

export default App;