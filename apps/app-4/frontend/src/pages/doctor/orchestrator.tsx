import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Loader2 } from 'lucide-react';
import { Paciente, Medico, RiscoClinico, Especialidade } from '@/components/orchestrator/types';

// Dynamic import to avoid SSR issues with the Orchestrator (it uses window/localStorage)
const ClinicalOrchestrator = dynamic(
    () => import('@/components/orchestrator/ClinicalOrchestrator'),
    { ssr: false, loading: () => <div className="h-screen flex items-center justify-center bg-slate-900 text-cyan-500"><Loader2 className="animate-spin w-10 h-10" /></div> }
);

export default function DoctorOrchestratorPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuthStore();
    const [integrationProps, setIntegrationProps] = useState<any>(null);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/auth/login');
            return;
        }

        if (user) {
            // ADAPTER: Convert MediSync User -> SNDT Medico
            const activeDoctor: Medico = {
                id: user.id.toString(),
                nome: `Dr. ${user.fullName}`,
                crm: user.crm || "CRM/SP 123456",
                especialidade: Especialidade.CARDIOLOGIA, // Mock ou do perfil
                disponivel: true,
                scoreMatch: 100,
                tags: ["Cardiologia Intervencionista", "Plantão", "Senior"],
                fotoUrl: "https://i.pravatar.cc/150?u=doctor_nexus"
            };

            // ADAPTER: Fetch Real Patients (Simulation for now based on Triage system)
            // In a real scenario, this fetches GET /api/queue/active
            const realPatients: Paciente[] = [
                {
                    id: "evt-infarto-001",
                    nome: "João da Silva (Paciente Via Triagem)",
                    idade: 58,
                    genero: "Masculino",
                    fotoUrl: "https://i.pravatar.cc/150?u=joao",
                    risco: RiscoClinico.CRITICO,
                    queixaPrincipal: "Dor precordial opressiva irradiando para MSE, iniciada há 45min. Sudorese fria associada.",
                    historico: ["HAS", "Dislipidemia", "Ex-tabagista"],
                    alergias: ["Dipirona"],
                    medicamentos: ["Losartana 50mg", "AAS 100mg"],
                    ultimaTelemetria: {
                        fc: 112,
                        spo2: 94,
                        pa: "160/100",
                        temp: 36.5,
                        timestamp: new Date().toISOString(),
                        analiseIA: "Padrão compatível com Síndrome Coronariana Aguda. Prioridade máxima."
                    },
                    resumoIA: "Paciente de alto risco cardiovascular com quadro clássico de IAM. Telemetria mostra taquicardia e hipertensão reativa. Necessita de ECG imediato e estabilização."
                },
                {
                    id: "evt-triage-002",
                    nome: "Maria Oliveira",
                    idade: 34,
                    genero: "Feminino",
                    fotoUrl: "https://i.pravatar.cc/150?u=maria",
                    risco: RiscoClinico.MODERADO,
                    queixaPrincipal: "Cefaleia intensa pulsátil frontal, fotofobia.",
                    historico: ["Enxaqueca crônica"],
                    alergias: [],
                    medicamentos: ["Sumatriptano"],
                    ultimaTelemetria: {
                        fc: 88,
                        spo2: 98,
                        pa: "130/85",
                        temp: 36.8,
                        timestamp: new Date().toISOString()
                    },
                    resumoIA: "Quadro sugestivo de crise de enxaqueca (Migrânea). Sinais vitais estáveis. Avaliar analgesia."
                }
            ];

            setIntegrationProps({
                doctorContext: activeDoctor,
                externalPatientList: realPatients,
                onExit: () => router.push('/dashboard'),
                onSessionComplete: (registro: any) => {
                    // Aqui chamaria o POST /api/medical-records
                    alert("Atendimento finalizado com sucesso! Prontuário salvo.");
                }
            });
        }
    }, [user, isAuthenticated, loading, router]);

    if (loading || !integrationProps) {
        return <div className="h-screen bg-slate-50 dark:bg-slate-900" />;
    }

    return (
        <>
            <Head>
                <title>Orquestrador Clínico | MediSync</title>
            </Head>
            <ClinicalOrchestrator {...integrationProps} />
        </>
    );
}
