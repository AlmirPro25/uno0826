import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import { PatientVitals } from '@/components/PatientVitals';
import { ConsultationNotes } from '@/components/ConsultationNotes';
import { QuickDiagnosis } from '@/components/QuickDiagnosis';
import { PrescriptionBuilder } from '@/components/PrescriptionBuilder';
import {
    ArrowLeft, User, Calendar, Clock, Video,
    FileText, Pill, Stethoscope, Save, Loader2,
    CheckCircle, AlertTriangle, Phone, MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Patient {
    id: number;
    full_name: string;
    email: string;
    phone?: string;
    birth_date?: string;
    allergies?: string;
    chronic_conditions?: string;
}

interface Appointment {
    id: number;
    date: string;
    time: string;
    type: string;
    status: string;
    patient: Patient;
    notes?: string;
}

interface Diagnosis {
    code: string;
    name: string;
    category: string;
    severity: 'low' | 'medium' | 'high';
}

export default function ConsultationPage() {
    const router = useRouter();
    const { id } = router.query;
    const { user, isAuthenticated } = useAuthStore();
    
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'vitals' | 'notes' | 'diagnosis' | 'prescription'>('notes');
    const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        if (id) {
            loadAppointment();
        }
    }, [id, isAuthenticated]);

    const loadAppointment = async () => {
        try {
            const response = await axiosInstance.get(`/appointments/${id}`);
            setAppointment(response.data);
        } catch (err) {
            // Mock data
            setAppointment({
                id: Number(id),
                date: new Date().toISOString(),
                time: '14:00',
                type: 'telemedicine',
                status: 'in_progress',
                patient: {
                    id: 1,
                    full_name: 'Maria Silva Santos',
                    email: 'maria@email.com',
                    phone: '(11) 99999-9999',
                    birth_date: '1985-05-15',
                    allergies: 'Dipirona, Penicilina',
                    chronic_conditions: 'Hipertensão'
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddDiagnosis = (diagnosis: Diagnosis) => {
        setDiagnoses(prev => [...prev, diagnosis]);
    };

    const handleRemoveDiagnosis = (code: string) => {
        setDiagnoses(prev => prev.filter(d => d.code !== code));
    };

    const handleSaveConsultation = async () => {
        setIsSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    const calculateAge = (birthDate?: string) => {
        if (!birthDate) return '-';
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return `${age} anos`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="max-w-4xl mx-auto p-6 text-center">
                <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Consulta não encontrada
                </h1>
                <Link href="/medico/dashboard" className="text-cyan-600 hover:underline">
                    Voltar ao dashboard
                </Link>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Consulta - {appointment.patient.full_name} | MediSync</title>
            </Head>

            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Consulta em Andamento
                            </h1>
                            <p className="text-gray-500">
                                {new Date(appointment.date).toLocaleDateString('pt-BR')} às {appointment.time}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {appointment.type === 'telemedicine' && (
                            <Link
                                href={`/video-call/${appointment.id}`}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
                            >
                                <Video className="w-4 h-4" />
                                Entrar na Chamada
                            </Link>
                        )}
                        <button
                            onClick={handleSaveConsultation}
                            disabled={isSaving}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                                saved
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                            }`}
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : saved ? (
                                <CheckCircle className="w-4 h-4" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {saved ? 'Salvo!' : 'Salvar Tudo'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Patient Info Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Patient Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-cyan-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {appointment.patient.full_name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {calculateAge(appointment.patient.birth_date)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Phone className="w-4 h-4" />
                                    <span>{appointment.patient.phone || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <MessageSquare className="w-4 h-4" />
                                    <span className="truncate">{appointment.patient.email}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Link
                                    href={`/medico/patients/${appointment.patient.id}`}
                                    className="text-sm text-cyan-600 hover:underline"
                                >
                                    Ver perfil completo →
                                </Link>
                            </div>
                        </div>

                        {/* Alerts */}
                        {(appointment.patient.allergies || appointment.patient.chronic_conditions) && (
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-4">
                                <h4 className="font-medium text-red-700 dark:text-red-400 flex items-center gap-2 mb-3">
                                    <AlertTriangle className="w-4 h-4" />
                                    Alertas
                                </h4>
                                {appointment.patient.allergies && (
                                    <div className="mb-2">
                                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">Alergias:</p>
                                        <p className="text-sm text-red-700 dark:text-red-300">
                                            {appointment.patient.allergies}
                                        </p>
                                    </div>
                                )}
                                {appointment.patient.chronic_conditions && (
                                    <div>
                                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">Condições Crônicas:</p>
                                        <p className="text-sm text-red-700 dark:text-red-300">
                                            {appointment.patient.chronic_conditions}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                                Ações Rápidas
                            </h4>
                            <div className="space-y-2">
                                <Link
                                    href={`/medico/patients/${appointment.patient.id}`}
                                    className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                                >
                                    <FileText className="w-4 h-4" />
                                    Ver Histórico
                                </Link>
                                <Link
                                    href={`/medico/prescriptions/new?patient=${appointment.patient.id}`}
                                    className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                                >
                                    <Pill className="w-4 h-4" />
                                    Nova Receita
                                </Link>
                                <Link
                                    href={`/medico/certificates/new?patient=${appointment.patient.id}`}
                                    className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                                >
                                    <FileText className="w-4 h-4" />
                                    Novo Atestado
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Tabs */}
                        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                            {[
                                { id: 'notes', label: 'Anotações', icon: FileText },
                                { id: 'vitals', label: 'Sinais Vitais', icon: Stethoscope },
                                { id: 'diagnosis', label: 'Diagnóstico', icon: Stethoscope },
                                { id: 'prescription', label: 'Receita', icon: Pill },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-white dark:bg-gray-700 text-cyan-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'notes' && (
                                <ConsultationNotes 
                                    patientName={appointment.patient.full_name}
                                    aiAssisted={true}
                                />
                            )}
                            {activeTab === 'vitals' && (
                                <PatientVitals 
                                    patientName={appointment.patient.full_name}
                                    editable={true}
                                />
                            )}
                            {activeTab === 'diagnosis' && (
                                <QuickDiagnosis 
                                    selectedDiagnoses={diagnoses}
                                    onSelect={handleAddDiagnosis}
                                    onRemove={handleRemoveDiagnosis}
                                />
                            )}
                            {activeTab === 'prescription' && (
                                <PrescriptionBuilder 
                                    patientName={appointment.patient.full_name}
                                />
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
}
