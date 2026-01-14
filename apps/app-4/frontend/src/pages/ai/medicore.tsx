import React, { useState } from 'react';
import Head from 'next/head';
import DoctorInterface from '../../components/medicore/components/DoctorInterface';
import TriageReportCard from '../../components/medicore/components/TriageReportCard';
import { generateMedicalReport } from '../../components/medicore/services/aiService';
import { TriageReport } from '../../components/medicore/types';
import { createTriageReport, CreateTriageReportInput } from '../../api/triage';
import { createTicketFromTriage } from '../../api/queue';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useRouter } from 'next/router';
import { Loader2, ShieldCheck, Stethoscope, CheckCircle, AlertCircle, Ticket, Users } from 'lucide-react';

export default function MediCorePage() {
    const [report, setReport] = useState<TriageReport | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedToBackend, setSavedToBackend] = useState(false);
    const [triageReportId, setTriageReportId] = useState<number | undefined>();
    const [sessionTranscript, setSessionTranscript] = useState<string>('');
    const [queueTicket, setQueueTicket] = useState<{ ticket_number: string; priority: string } | null>(null);
    const [joiningQueue, setJoiningQueue] = useState(false);

    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();

    const handleSessionEnd = async (transcript: string) => {
        if (!transcript.trim()) {
            setError("Nenhuma conversa detectada para gerar relatório.");
            return;
        }

        setIsProcessing(true);
        setError(null);
        setSavedToBackend(false);
        setSessionTranscript(transcript);

        try {
            // Generate report with AI
            const result = await generateMedicalReport(transcript);
            setReport(result);

            // If user is authenticated, save to backend
            if (isAuthenticated && user) {
                try {
                    const backendData: CreateTriageReportInput = {
                        patient_complaint: result.patientComplaint,
                        history_of_present_illness: result.historyOfPresentIllness,
                        vital_signs_note: result.vitalSignsNote,
                        suspected_diagnosis: result.suspectedDiagnosis,
                        recommended_specialty: result.recommendedSpecialty,
                        priority: result.priority,
                        reasoning: result.reasoning,
                        transcript: transcript,
                        session_type: 'voice',
                        ai_model: 'gemini-robotics-er-1.5-preview',
                    };

                    // Try to get user location
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                backendData.latitude = position.coords.latitude;
                                backendData.longitude = position.coords.longitude;
                            },
                            () => { } // Ignore errors
                        );
                    }

                    const savedReport = await createTriageReport(backendData);
                    setSavedToBackend(true);
                    setTriageReportId(savedReport.id);
                } catch (backendError) {
                    console.warn('Failed to save to backend (user may not be logged in):', backendError);
                }
            }
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
        setSavedToBackend(false);
        setTriageReportId(undefined);
        setQueueTicket(null);
    };

    const handleJoinQueue = async () => {
        if (!triageReportId || !report) return;
        
        setJoiningQueue(true);
        try {
            const ticket = await createTicketFromTriage(
                triageReportId,
                report.priority,
                report.recommendedSpecialty
            );
            setQueueTicket({
                ticket_number: ticket.ticket_number,
                priority: ticket.priority
            });
        } catch (err) {
            console.error('Error joining queue:', err);
            // Fallback: redirect to manual queue join
            router.push(`/queue/join?priority=${encodeURIComponent(report.priority)}&specialty=${encodeURIComponent(report.recommendedSpecialty)}&triage_id=${triageReportId}`);
        } finally {
            setJoiningQueue(false);
        }
    };

    return (
        <>
            <Head>
                <title>MediCore Live | MediSync</title>
            </Head>

            <div className="h-full flex flex-col">
                {/* Compact Header */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-cyan-600 p-1.5 rounded-lg text-white">
                            <Stethoscope size={18} />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-gray-900 dark:text-white leading-none">MediCore AI</h1>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Sistema de Triagem Inteligente</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            <span className="hidden sm:inline">Ambiente Seguro</span>
                        </span>
                        <span>v3.0.0-Live</span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
                    {isProcessing ? (
                        <div className="h-[50vh] flex flex-col items-center justify-center space-y-4 text-center">
                            <Loader2 className="w-12 h-12 text-cyan-600 animate-spin" />
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Processando Triagem Clínica...</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mt-2 mx-auto">
                                    O Modelo Especialista está analisando a transcrição e gerando o protocolo de Manchester.
                                </p>
                            </div>
                        </div>
                    ) : report ? (
                        <div className="space-y-4 max-w-4xl mx-auto">
                            {/* Save Status Banner */}
                            {isAuthenticated && (
                                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${savedToBackend
                                        ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                                        : 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200'
                                    }`}>
                                    {savedToBackend ? (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                                            <div>
                                                <p className="font-medium">Relatório salvo no seu prontuário</p>
                                                <p className="text-sm opacity-80">Médicos da especialidade recomendada foram notificados</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="w-5 h-5 text-amber-600" />
                                            <div>
                                                <p className="font-medium">Relatório gerado (não salvo)</p>
                                                <p className="text-sm opacity-80">Faça login para salvar no seu histórico médico</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {!isAuthenticated && (
                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200">
                                    <AlertCircle className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="font-medium">Triagem gratuita concluída!</p>
                                        <p className="text-sm opacity-80">
                                            <a href="/auth/register" className="underline font-semibold">Crie uma conta</a> para salvar no histórico e ser atendido por um médico
                                        </p>
                                    </div>
                                </div>
                            )}

                            <TriageReportCard report={report} triageReportId={triageReportId} onReset={handleReset} />

                            {/* Queue Integration */}
                            {savedToBackend && triageReportId && !queueTicket && (
                                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-700 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-cyan-100 dark:bg-cyan-800 rounded-xl">
                                            <Users className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                                                Entrar na Fila de Atendimento?
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                                Sua triagem foi classificada como <strong className="text-cyan-600">{report.priority}</strong>. 
                                                Você pode entrar na fila digital agora e acompanhar sua posição pelo celular.
                                            </p>
                                            <button
                                                onClick={handleJoinQueue}
                                                disabled={joiningQueue}
                                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                                            >
                                                {joiningQueue ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Ticket className="w-5 h-5" />
                                                )}
                                                {joiningQueue ? 'Gerando senha...' : 'Retirar Senha da Fila'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Queue Ticket Generated */}
                            {queueTicket && (
                                <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl p-6 text-white text-center">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                                    <h3 className="text-xl font-bold mb-2">Senha Gerada com Sucesso!</h3>
                                    <p className="text-6xl font-black tracking-wider my-4">
                                        {queueTicket.ticket_number}
                                    </p>
                                    <p className="text-emerald-100 mb-4">
                                        Prioridade: {queueTicket.priority}
                                    </p>
                                    <button
                                        onClick={() => router.push(`/queue/track?ticket=${queueTicket.ticket_number}`)}
                                        className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold transition-all"
                                    >
                                        Acompanhar Minha Posição na Fila
                                    </button>
                                </div>
                            )}

                            {/* TRANSFER TO DR NEXUS */}
                            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 flex flex-col items-center text-center">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Necessita de Avaliação Médica Imediata?</h3>
                                <p className="text-gray-500 mb-6 max-w-lg">
                                    Baseado na triagem preliminar, você pode ser encaminhado agora para o Dr. Nexus, nosso especialista IA de Plantão, para uma investigação mais profunda.
                                </p>
                                <button
                                    onClick={() => {
                                        // Construct query from report
                                        // Using encodeURIComponent usually handled by router/browser but Next router does it.
                                        const query = {
                                            name: 'Paciente Vioce',
                                            complaint: report.patientComplaint,
                                            history: report.historyOfPresentIllness,
                                            gender: 'Não informado',
                                            age: 'Não informado'
                                        };

                                        // Navigate
                                        window.location.href = `/ai/emergency-room?name=${encodeURIComponent(query.name)}&complaint=${encodeURIComponent(query.complaint)}&history=${encodeURIComponent(query.history)}`;
                                    }}
                                    className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-gradient-to-r from-cyan-600 to-blue-600 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-600 hover:from-cyan-500 hover:to-blue-500 shadow-xl shadow-cyan-500/30"
                                >
                                    <div className="absolute -inset-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-400 opacity-20 blur-lg group-hover:opacity-40 transition-opacity duration-200" />
                                    <Stethoscope className="w-6 h-6 mr-3" />
                                    <span className="text-lg">Conectar com Dr. Nexus (Plantão)</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                            {/* Left Panel: Instructions */}
                            <div className="hidden lg:flex lg:col-span-1 flex-col gap-4">
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <h3 className="font-bold text-gray-800 dark:text-white mb-3">Protocolo de Operação</h3>
                                    <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-300">
                                        <li className="flex items-start">
                                            <span className="mr-2 text-cyan-600 font-bold">1.</span>
                                            <div><strong className="text-gray-900 dark:text-white">Iniciar Turno:</strong> Ative a conexão segura com a IA de Triagem (Sarah).</div>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="mr-2 text-cyan-600 font-bold">2.</span>
                                            <div><strong className="text-gray-900 dark:text-white">Anamnese:</strong> Descreva os sintomas e histórico. A IA pode ver e ouvir.</div>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="mr-2 text-cyan-600 font-bold">3.</span>
                                            <div><strong className="text-gray-900 dark:text-white">Suporte à Decisão:</strong> A IA usará ferramentas externas para validar hipóteses em tempo real.</div>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="mr-2 text-cyan-600 font-bold">4.</span>
                                            <div><strong className="text-gray-900 dark:text-white">Relatório:</strong> Finalize para obter classificação de risco Manchester e laudo técnico.</div>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-indigo-900 p-5 rounded-xl text-white relative overflow-hidden">
                                    <div className="relative z-10">
                                        <h3 className="font-bold mb-2 flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                            Modo Simulação Avançada
                                        </h3>
                                        <p className="text-xs text-indigo-200 mb-3 leading-relaxed">
                                            Esta aplicação utiliza o novo <strong>Multimodal Live API</strong> (Gemini 2.0 Flash) para conversação audiovisual de latência ultrabaixa.
                                        </p>
                                        <div className="inline-block px-2 py-1 bg-indigo-800 rounded text-xs font-mono border border-indigo-700">
                                            WebSocket • PCM 24kHz • Vision
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Center/Right Panel: The Live Interface */}
                            <div className="col-span-1 lg:col-span-2 h-full min-h-[500px]">
                                {error && (
                                    <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
                                        <span>{error}</span>
                                        <button onClick={() => setError(null)} className="font-bold hover:underline">Fechar</button>
                                    </div>
                                )}
                                <DoctorInterface onSessionEnd={handleSessionEnd} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
