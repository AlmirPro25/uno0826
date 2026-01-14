import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import { getMyTriageReports, TriageReport } from '@/api/triage';
import {
    Calendar, FileText, Activity, Stethoscope,
    Pill, MessageSquare, ChevronRight, Loader2,
    CheckCircle, BrainCircuit, MapPin, Ticket
} from 'lucide-react';
import { HealthDashboard } from '@/components/HealthDashboard';
import { SymptomChecker } from '@/components/SymptomChecker';
import { EmergencyButton } from '@/components/EmergencyButton';
import { MedicationReminder } from '@/components/MedicationReminder';
import { ExamTracker } from '@/components/ExamTracker';
import { VaccineCard } from '@/components/VaccineCard';
import { QuickConsultation } from '@/components/QuickConsultation';
import { HealthTips } from '@/components/HealthTips';
import { RecentActivity } from '@/components/RecentActivity';
import { HealthGoals } from '@/components/HealthGoals';
import { WeeklyProgress } from '@/components/WeeklyProgress';
import { Achievements } from '@/components/Achievements';
import { HealthCalendar } from '@/components/HealthCalendar';
import { WaterTracker } from '@/components/WaterTracker';
import { SleepTracker } from '@/components/SleepTracker';
import { StepsTracker } from '@/components/StepsTracker';
import { NutritionTracker } from '@/components/NutritionTracker';
import { QuickActions } from '@/components/QuickActions';

interface DashboardData {
    upcomingAppointments: any[];
    recentTriages: TriageReport[];
    pendingPrescriptions: number;
    unreadMessages: number;
}

export default function PatientDashboard() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuthStore();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            loadDashboardData();
        }
    }, [isAuthenticated]);

    const loadDashboardData = async () => {
        try {
            const [appointmentsRes, triagesRes] = await Promise.all([
                axiosInstance.get('/appointments/my-appointments?status=confirmed&limit=3').catch(() => ({ data: [] })),
                getMyTriageReports().catch(() => [])
            ]);

            setData({
                upcomingAppointments: appointmentsRes.data || [],
                recentTriages: (triagesRes || []).slice(0, 3),
                pendingPrescriptions: 0,
                unreadMessages: 0
            });
        } catch (err) {
            console.error('Error loading dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        if (priority.includes('Vermelho') || priority.includes('emergency')) return 'bg-red-500';
        if (priority.includes('Laranja') || priority.includes('very_urgent')) return 'bg-orange-500';
        if (priority.includes('Amarelo') || priority.includes('urgent')) return 'bg-yellow-500';
        if (priority.includes('Verde') || priority.includes('less_urgent')) return 'bg-green-500';
        return 'bg-blue-500';
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Meu Painel | MediSync</title>
            </Head>

            <div className="max-w-6xl mx-auto p-6 space-y-6">
                {/* Welcome Header with Triage CTA */}
                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-6 text-white">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">
                                Olá, {user?.fullName?.split(' ')[0] || 'Paciente'}! 👋
                            </h1>
                            <p className="text-cyan-100 mt-1">
                                Bem-vindo ao seu painel de saúde
                            </p>
                        </div>
                        <Link 
                            href="/ai/neuroclinic" 
                            className="flex items-center gap-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-xl transition-all group"
                        >
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                <BrainCircuit className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold">Precisa de ajuda?</p>
                                <p className="text-sm text-cyan-100">Fale com nosso médico virtual</p>
                            </div>
                            <ChevronRight className="w-5 h-5 ml-2" />
                        </Link>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/ai/medicore" className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-cyan-500 dark:hover:border-cyan-500 transition-colors group">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <BrainCircuit className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Triagem IA</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Avaliação por voz</p>
                    </Link>

                    <Link href="/ai/triage" className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-cyan-500 dark:hover:border-cyan-500 transition-colors group">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Triagem Texto</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Descreva sintomas</p>
                    </Link>

                    <Link href="/clinics" className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-cyan-500 dark:hover:border-cyan-500 transition-colors group">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Clínicas</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Encontrar próximas</p>
                    </Link>

                    <Link href="/queue/join" className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-cyan-500 dark:hover:border-cyan-500 transition-colors group">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Ticket className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Fila</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Retirar senha</p>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upcoming Appointments */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-cyan-600" />
                                Próximas Consultas
                            </h2>
                            <Link href="/paciente/my-appointments" className="text-sm text-cyan-600 hover:underline flex items-center gap-1">
                                Ver todas <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="p-4">
                            {data?.upcomingAppointments.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Nenhuma consulta agendada</p>
                                    <Link href="/paciente/book-appointment" className="text-cyan-600 hover:underline text-sm mt-2 inline-block">
                                        Agendar consulta
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {data?.upcomingAppointments.map((apt: any) => (
                                        <div key={apt.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                            <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center">
                                                <Stethoscope className="w-6 h-6 text-cyan-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {apt.doctor?.full_name || 'Médico'}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(apt.date).toLocaleDateString('pt-BR')} às {apt.time}
                                                </p>
                                            </div>
                                            <Link href={`/paciente/appointments/${apt.id}`} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">
                                                <ChevronRight className="w-5 h-5 text-gray-400" />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Triages */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-cyan-600" />
                                Triagens Recentes
                            </h2>
                            <Link href="/paciente/triagens" className="text-sm text-cyan-600 hover:underline flex items-center gap-1">
                                Ver todas <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="p-4">
                            {data?.recentTriages.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Nenhuma triagem realizada</p>
                                    <Link href="/ai/medicore" className="text-cyan-600 hover:underline text-sm mt-2 inline-block">
                                        Fazer triagem IA
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {data?.recentTriages.map((triage) => (
                                        <div key={triage.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                            <div className={`w-3 h-12 rounded-full ${getPriorityColor(triage.priority)}`} />
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {triage.patient_complaint?.substring(0, 50)}...
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {triage.recommended_specialty} • {new Date(triage.created_at).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                triage.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                                                triage.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {triage.status === 'accepted' ? 'Aceito' : 
                                                 triage.status === 'pending' ? 'Pendente' : triage.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Health Dashboard & Symptom Checker */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <HealthDashboard compact />
                    <SymptomChecker compact />
                </div>

                {/* More Health Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MedicationReminder compact />
                    <ExamTracker compact />
                    <VaccineCard compact />
                    <QuickConsultation compact />
                </div>

                {/* Trackers */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StepsTracker compact />
                    <WaterTracker compact />
                    <SleepTracker compact />
                    <NutritionTracker compact />
                </div>

                {/* Health Goals & Weekly Progress */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <HealthGoals compact />
                    <WeeklyProgress compact />
                    <Achievements compact />
                </div>

                {/* Health Calendar & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <HealthCalendar compact />
                    <RecentActivity limit={5} />
                </div>

                {/* Health Tips */}
                <HealthTips />

                {/* Quick Links */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/paciente/prescriptions" className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-cyan-500 transition-colors">
                        <Pill className="w-5 h-5 text-pink-500" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">Receitas</span>
                    </Link>
                    <Link href="/paciente/medical-history" className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-cyan-500 transition-colors">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">Histórico</span>
                    </Link>
                    <Link href="/chat" className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-cyan-500 transition-colors">
                        <MessageSquare className="w-5 h-5 text-green-500" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">Mensagens</span>
                    </Link>
                    <Link href="/paciente/certificates" className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-cyan-500 transition-colors">
                        <CheckCircle className="w-5 h-5 text-purple-500" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">Atestados</span>
                    </Link>
                </div>
            </div>

            {/* Emergency Button - Fixed Position */}
            <EmergencyButton />

            {/* Quick Actions FAB */}
            <QuickActions userRole="patient" />
        </>
    );
}
