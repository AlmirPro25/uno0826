import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useNeuroSession } from '@/hooks/useNeuroSession';
import BrainHUD from '@/components/neuro/BrainHUD';
import { Button } from '@/components/ui/shadcn/Button';
import { ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';

export default function EmergencyRoomPage() {
    const router = useRouter();
    // Get API Key from global state or env (In production, use secure backend proxy, here simulating client-side for sandbox)
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

    // In a real app, we would fetch patient data from the ID
    const {
        viewState,
        agentState,
        logs,
        transcripts,
        audioLevel,
        mediaStream,
        videoUplinkActive,
        patientProfile,
        manifesto,
        startSession,
        instantiateAgent,
        endSession,
        finalReport
    } = useNeuroSession(apiKey);

    // Auto-start flow based on URL params (Simulation)
    useEffect(() => {
        // If we are just landing, simulate patient intake or grab from router query
        if (viewState === 'INTAKE' && router.isReady) {
            // Simulated Patient Data - In real version, fetch from `triageId`
            const fakeProfile = {
                name: "Paciente Exemplo",
                age: "34",
                gender: "M",
                chiefComplaint: "Dor aguda no peito irradiando para o braço esquerdo, sudorese e falta de ar iniciada há 20 minutos.",
                history: "Hipertensão"
            };

            instantiateAgent(fakeProfile);
        }
    }, [router.isReady]);

    return (
        <div className="w-full h-screen bg-black text-white overflow-hidden flex flex-col">
            <Head>
                <title>Emergency Room - NeuroClinic AI</title>
            </Head>

            {/* HEADER */}
            <header className="h-14 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between px-4 z-50 backdrop-blur">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                        <span className="font-bold tracking-widest text-red-100">EMERGENCY<span className="text-red-600">ROOM</span></span>
                    </div>
                </div>

                {viewState === 'SESSION' && (
                    <Button
                        onClick={endSession}
                        variant="destructive"
                        className="bg-red-900/50 hover:bg-red-900 text-red-100 border border-red-700 animate-pulse"
                    >
                        FINALIZAR ATENDIMENTO
                    </Button>
                )}
            </header>

            {/* MAIN CONTENT Area */}
            <main className="flex-1 relative">
                {viewState === 'INTAKE' && (
                    <div className="flex items-center justify-center h-full flex-col gap-4 text-cyan-500">
                        <div className="w-16 h-16 border-4 border-t-cyan-500 border-r-transparent border-b-cyan-800 border-l-transparent rounded-full animate-spin"></div>
                        <p className="tracking-widest font-mono">NEURAL HANDSHAKE...</p>
                    </div>
                )}

                {viewState === 'STANDBY' && manifesto && patientProfile && (
                    <div className="flex items-center justify-center h-full p-4">
                        <div className="max-w-xl w-full bg-slate-900 border border-cyan-500 p-8 rounded-lg shadow-[0_0_60px_rgba(6,182,212,0.15)] animate-[slideUp_0.3s_ease-out]">
                            <h2 className="text-sm font-bold text-cyan-600 tracking-widest mb-4">MÉDICO VIRTUAL ALOCADO</h2>
                            <div className="space-y-4 border-l-2 border-cyan-800 pl-4 mb-8">
                                <div>
                                    <div className="text-xs text-slate-500 uppercase">Designação</div>
                                    <div className="text-2xl text-white font-bold">{manifesto.agentName}</div>
                                    <div className="text-cyan-400 font-mono">{manifesto.role}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase">Especialidade</div>
                                    <div className="text-slate-300">{manifesto.specialty}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase">Contexto Clínico</div>
                                    <div className="text-slate-300 font-mono text-xs">{patientProfile.chiefComplaint}</div>
                                </div>
                            </div>

                            <Button
                                onClick={() => startSession()}
                                className="w-full h-16 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg rounded-sm tracking-[0.2em] transition-all shadow-lg hover:shadow-cyan-500/50"
                            >
                                INICIAR ATENDIMENTO
                            </Button>
                        </div>
                    </div>
                )}

                {viewState === 'SESSION' && (
                    <BrainHUD
                        agentState={agentState}
                        logs={logs}
                        transcripts={transcripts}
                        audioLevel={audioLevel}
                        videoStream={mediaStream}
                        videoUplinkActive={videoUplinkActive}
                    />
                )}

                {viewState === 'REPORT' && finalReport && (
                    <div className="flex items-center justify-center h-full p-6 overflow-y-auto">
                        <div className="max-w-3xl w-full bg-slate-50 text-slate-900 p-8 rounded shadow-2xl font-serif">
                            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-end">
                                <div>
                                    <h1 className="text-3xl font-bold">RELATÓRIO MÉDICO</h1>
                                    <p className="text-sm text-slate-500">Gerado por NeuroClinic AI System</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold uppercase">Risco Avaliado</div>
                                    <div className={`text-xl font-bold ${finalReport.riskAssessment.level === 'CRITICAL' ? 'text-red-600' : 'text-slate-900'}`}>{finalReport.riskAssessment.level}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-sm">
                                <div>
                                    <h3 className="font-bold border-b border-slate-300 mb-2">SUBJETIVO</h3>
                                    <p>{finalReport.subjective}</p>
                                </div>
                                <div>
                                    <h3 className="font-bold border-b border-slate-300 mb-2">OBJETIVO</h3>
                                    <p>{finalReport.objective}</p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="font-bold border-b border-slate-300 mb-2">AVALIAÇÃO / DIAGNÓSTICO</h3>
                                <p className="text-lg bg-slate-100 p-4 rounded">{finalReport.assessment}</p>
                            </div>

                            <div className="mb-8">
                                <h3 className="font-bold border-b border-slate-300 mb-2">PLANO DE CONDUTA</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    {finalReport.plan.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex justify-end gap-4 mt-8 print:hidden">
                                <Button variant="outline" onClick={() => window.print()}>IMPRIMIR</Button>
                                <Button onClick={() => router.push('/dashboard')}>VOLTAR AO DASHBOARD</Button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
