import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import {
    FileText, Loader2, ArrowLeft, User,
    Pill, Activity, Heart, ChevronRight,
    Stethoscope
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MedicalRecord {
    id: number;
    diagnosis: string;
    symptoms: string;
    treatment: string;
    notes?: string;
    createdAt: string;
    doctor?: {
        fullName: string;
        specialty?: string;
    };
}

interface Prescription {
    id: number;
    medications: string;
    instructions: string;
    validUntil: string;
    createdAt: string;
    doctor?: {
        fullName: string;
    };
}

interface TriageReport {
    id: number;
    patient_complaint: string;
    priority: string;
    recommended_specialty: string;
    created_at: string;
    status: string;
}

interface Appointment {
    id: number;
    startTime: string;
    status: string;
    type: string;
    doctor?: {
        fullName: string;
        specialty?: string;
    };
}

export default function MedicalHistoryPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    
    const [activeTab, setActiveTab] = useState<'records' | 'prescriptions' | 'triages' | 'appointments'>('records');
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [triages, setTriages] = useState<TriageReport[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        loadAllData();
    }, [isAuthenticated]);

    const loadAllData = async () => {
        try {
            setLoading(true);
            const [recordsRes, prescriptionsRes, triagesRes, appointmentsRes] = await Promise.all([
                axiosInstance.get(`/patients/${user?.id}/records`).catch(() => ({ data: [] })),
                axiosInstance.get('/prescriptions/my-prescriptions').catch(() => ({ data: [] })),
                axiosInstance.get('/triage-reports/my-reports').catch(() => ({ data: [] })),
                axiosInstance.get('/appointments/my-appointments').catch(() => ({ data: [] }))
            ]);

            setRecords(recordsRes.data || []);
            setPrescriptions(prescriptionsRes.data || []);
            setTriages(triagesRes.data || []);
            setAppointments((appointmentsRes.data || []).filter((a: Appointment) => a.status === 'completed'));
        } catch (err: any) {
            setError('Erro ao carregar histórico médico');
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        if (priority.includes('Vermelho')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
        if (priority.includes('Laranja')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
        if (priority.includes('Amarelo')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
        if (priority.includes('Verde')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    };

    const tabs = [
        { id: 'records', label: 'Prontuários', icon: FileText, count: records.length },
        { id: 'prescriptions', label: 'Receitas', icon: Pill, count: prescriptions.length },
        { id: 'triages', label: 'Triagens', icon: Activity, count: triages.length },
        { id: 'appointments', label: 'Consultas', icon: Stethoscope, count: appointments.length },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Histórico Médico | MediSync</title>
            </Head>

            <div className="max-w-5xl mx-auto p-6 space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/paciente/dashboard')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-cyan-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao Dashboard
                </button>

                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <Heart className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Histórico Médico</h1>
                            <p className="text-cyan-100 mt-1">
                                Seu histórico completo de saúde em um só lugar
                            </p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`p-4 rounded-xl border-2 transition-all ${
                                activeTab === tab.id
                                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-cyan-300'
                            }`}
                        >
                            <tab.icon className={`w-6 h-6 mb-2 ${activeTab === tab.id ? 'text-cyan-600' : 'text-gray-400'}`} />
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{tab.count}</p>
                            <p className="text-sm text-gray-500">{tab.label}</p>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                    {/* Tab Header */}
                    <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {tabs.find(t => t.id === activeTab)?.icon && 
                                React.createElement(tabs.find(t => t.id === activeTab)!.icon, { className: 'w-5 h-5 text-cyan-600' })}
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h2>
                    </div>

                    {/* Tab Content */}
                    <div className="p-4">
                        {activeTab === 'records' && (
                            <div className="space-y-4">
                                {records.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>Nenhum prontuário encontrado</p>
                                    </div>
                                ) : (
                                    records.map((record) => (
                                        <div key={record.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                                        {record.diagnosis}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                        <User className="w-4 h-4" />
                                                        Dr(a). {record.doctor?.fullName}
                                                        {record.doctor?.specialty && ` - ${record.doctor.specialty}`}
                                                    </p>
                                                </div>
                                                <span className="text-sm text-gray-500">
                                                    {format(new Date(record.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                                </span>
                                            </div>
                                            {record.symptoms && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                                    <strong>Sintomas:</strong> {record.symptoms}
                                                </p>
                                            )}
                                            {record.treatment && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                                    <strong>Tratamento:</strong> {record.treatment}
                                                </p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'prescriptions' && (
                            <div className="space-y-4">
                                {prescriptions.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <Pill className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>Nenhuma receita encontrada</p>
                                    </div>
                                ) : (
                                    prescriptions.map((prescription) => (
                                        <div key={prescription.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                                        <User className="w-4 h-4" />
                                                        Dr(a). {prescription.doctor?.fullName}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm text-gray-500">
                                                        {format(new Date(prescription.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                                    </span>
                                                    <p className="text-xs text-amber-600 mt-1">
                                                        Válida até: {format(new Date(prescription.validUntil), "dd/MM/yyyy", { locale: ptBR })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                                                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-line">
                                                    {prescription.medications}
                                                </p>
                                            </div>
                                            {prescription.instructions && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                                    <strong>Instruções:</strong> {prescription.instructions}
                                                </p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'triages' && (
                            <div className="space-y-4">
                                {triages.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>Nenhuma triagem encontrada</p>
                                    </div>
                                ) : (
                                    triages.map((triage) => (
                                        <div 
                                            key={triage.id} 
                                            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors"
                                            onClick={() => router.push(`/paciente/triagens/${triage.id}`)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(triage.priority)}`}>
                                                            {triage.priority}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            {triage.recommended_specialty}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-900 dark:text-white">
                                                        {triage.patient_complaint?.substring(0, 100)}...
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-2">
                                                        {format(new Date(triage.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-400" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'appointments' && (
                            <div className="space-y-4">
                                {appointments.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>Nenhuma consulta concluída</p>
                                    </div>
                                ) : (
                                    appointments.map((appointment) => (
                                        <div key={appointment.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                                                        <Stethoscope className="w-6 h-6 text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            Dr(a). {appointment.doctor?.fullName}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {appointment.doctor?.specialty}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-900 dark:text-white">
                                                        {format(new Date(appointment.startTime), "dd/MM/yyyy", { locale: ptBR })}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {format(new Date(appointment.startTime), "HH:mm", { locale: ptBR })}
                                                    </p>
                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded text-xs">
                                                        {appointment.type === 'telemedicine' ? 'Teleconsulta' : 'Presencial'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
