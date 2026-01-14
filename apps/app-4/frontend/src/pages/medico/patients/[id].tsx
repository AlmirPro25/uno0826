import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import { TriageReport } from '@/api/triage';
import { MedicalAlerts } from '@/components/MedicalAlerts';
import { PatientTimeline } from '@/components/PatientTimeline';
import {
    User, Mail, Phone, Calendar, MapPin, FileText,
    Activity, Pill, Clock, ChevronRight, Loader2,
    AlertCircle, ArrowLeft, Heart, Stethoscope, History
} from 'lucide-react';

interface Patient {
    id: number;
    full_name: string;
    email: string;
    phone?: string;
    cpf?: string;
    birth_date?: string;
    gender?: string;
    address?: string;
    city?: string;
    state?: string;
    blood_type?: string;
    allergies?: string;
    chronic_conditions?: string;
    created_at: string;
}

interface PatientHistory {
    triages: TriageReport[];
    appointments: any[];
    prescriptions: any[];
    medicalRecords: any[];
}

export default function PatientProfilePage() {
    const router = useRouter();
    const { id } = router.query;
    const { isAuthenticated } = useAuthStore();
    
    const [patient, setPatient] = useState<Patient | null>(null);
    const [history, setHistory] = useState<PatientHistory>({
        triages: [],
        appointments: [],
        prescriptions: [],
        medicalRecords: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'timeline' | 'triages' | 'appointments' | 'prescriptions' | 'records'>('timeline');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        if (id) {
            loadPatientData();
        }
    }, [isAuthenticated, id]);

    const loadPatientData = async () => {
        try {
            const [patientRes, triagesRes, appointmentsRes] = await Promise.all([
                axiosInstance.get(`/users/${id}`),
                axiosInstance.get(`/patients/${id}/triage-reports`).catch(() => ({ data: [] })),
                axiosInstance.get(`/appointments/patient/${id}`).catch(() => ({ data: [] }))
            ]);

            setPatient(patientRes.data);
            setHistory({
                triages: triagesRes.data || [],
                appointments: appointmentsRes.data || [],
                prescriptions: [],
                medicalRecords: []
            });
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao carregar paciente');
        } finally {
            setLoading(false);
        }
    };

    const calculateAge = (birthDate: string) => {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const getPriorityColor = (priority: string) => {
        if (priority.includes('Vermelho')) return 'bg-red-500';
        if (priority.includes('Laranja')) return 'bg-orange-500';
        if (priority.includes('Amarelo')) return 'bg-yellow-500';
        if (priority.includes('Verde')) return 'bg-green-500';
        return 'bg-blue-500';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
            </div>
        );
    }

    if (error || !patient) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-700 dark:text-red-200">
                        {error || 'Paciente não encontrado'}
                    </h2>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 text-cyan-600 hover:underline"
                    >
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>{patient.full_name} | MediSync</title>
            </Head>

            <div className="max-w-6xl mx-auto p-6 space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-cyan-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </button>

                {/* Patient Header */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-start gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                            {patient.full_name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {patient.full_name}
                            </h1>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                {patient.birth_date && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {calculateAge(patient.birth_date)} anos
                                    </span>
                                )}
                                {patient.gender && (
                                    <span className="flex items-center gap-1">
                                        <User className="w-4 h-4" />
                                        {patient.gender}
                                    </span>
                                )}
                                {patient.blood_type && (
                                    <span className="flex items-center gap-1">
                                        <Heart className="w-4 h-4 text-red-500" />
                                        {patient.blood_type}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-4 mt-3 text-sm">
                                <a href={`mailto:${patient.email}`} className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-cyan-600">
                                    <Mail className="w-4 h-4" />
                                    {patient.email}
                                </a>
                                {patient.phone && (
                                    <a href={`tel:${patient.phone}`} className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-cyan-600">
                                        <Phone className="w-4 h-4" />
                                        {patient.phone}
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => router.push(`/medico/prescriptions/new?patient_id=${patient.id}`)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center gap-2"
                            >
                                <Pill className="w-4 h-4" />
                                Nova Receita
                            </button>
                            <button
                                onClick={() => router.push(`/medico/medical-records/new?patient_id=${patient.id}`)}
                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium flex items-center gap-2"
                            >
                                <FileText className="w-4 h-4" />
                                Novo Prontuário
                            </button>
                        </div>
                    </div>

                </div>

                {/* Medical Alerts */}
                <MedicalAlerts 
                    alerts={[
                        ...(patient.allergies ? patient.allergies.split(',').map((a, i) => ({
                            id: i + 1,
                            category: 'allergy' as const,
                            severity: 'critical' as const,
                            title: a.trim(),
                            description: 'Alergia registrada no cadastro do paciente'
                        })) : []),
                        ...(patient.chronic_conditions ? patient.chronic_conditions.split(',').map((c, i) => ({
                            id: 100 + i,
                            category: 'condition' as const,
                            severity: 'warning' as const,
                            title: c.trim(),
                            description: 'Condição crônica registrada no cadastro do paciente'
                        })) : [])
                    ]}
                    editable={false}
                />

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                    {[
                        { key: 'timeline', label: 'Linha do Tempo', icon: History, count: history.triages.length + history.appointments.length },
                        { key: 'triages', label: 'Triagens', icon: Activity, count: history.triages.length },
                        { key: 'appointments', label: 'Consultas', icon: Calendar, count: history.appointments.length },
                        { key: 'prescriptions', label: 'Receitas', icon: Pill, count: history.prescriptions.length },
                        { key: 'records', label: 'Prontuários', icon: FileText, count: history.medicalRecords.length },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
                                activeTab === tab.key
                                    ? 'border-cyan-600 text-cyan-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    {activeTab === 'timeline' && (
                        <PatientTimeline
                            patientName={patient.full_name}
                            events={[
                                ...history.triages.map(t => ({
                                    id: t.id,
                                    type: 'triage' as const,
                                    title: t.patient_complaint?.substring(0, 50) + '...' || 'Triagem IA',
                                    description: (t as any).ai_analysis?.substring(0, 100) || t.recommended_specialty,
                                    date: new Date(t.created_at),
                                    specialty: t.recommended_specialty,
                                    priority: t.priority,
                                    status: t.status
                                })),
                                ...history.appointments.map(a => ({
                                    id: a.id + 10000,
                                    type: 'consultation' as const,
                                    title: 'Consulta Médica',
                                    description: a.notes || undefined,
                                    date: new Date(a.startTime || a.date),
                                    doctor: a.doctor?.full_name,
                                    status: a.status
                                }))
                            ]}
                            onEventClick={(event) => {
                                if (event.type === 'triage') {
                                    router.push(`/medico/triagens/${event.id}`);
                                }
                            }}
                        />
                    )}

                    {activeTab === 'triages' && (
                        <div className="space-y-4">
                            {history.triages.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Nenhuma triagem registrada</p>
                                </div>
                            ) : (
                                history.triages.map((triage) => (
                                    <Link
                                        key={triage.id}
                                        href={`/medico/triagens/${triage.id}`}
                                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors"
                                    >
                                        <div className={`w-2 h-12 rounded-full ${getPriorityColor(triage.priority)}`} />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {triage.patient_complaint?.substring(0, 60)}...
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {triage.recommended_specialty} • {new Date(triage.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            triage.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                            triage.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {triage.status}
                                        </span>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </Link>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'appointments' && (
                        <div className="space-y-4">
                            {history.appointments.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Nenhuma consulta registrada</p>
                                </div>
                            ) : (
                                history.appointments.map((apt: any) => (
                                    <div
                                        key={apt.id}
                                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                                    >
                                        <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center">
                                            <Stethoscope className="w-6 h-6 text-cyan-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                Consulta
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(apt.startTime || apt.date).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            apt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                            apt.status === 'booked' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {apt.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'prescriptions' && (
                        <div className="text-center py-12 text-gray-500">
                            <Pill className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Nenhuma receita registrada</p>
                        </div>
                    )}

                    {activeTab === 'records' && (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Nenhum prontuário registrado</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
