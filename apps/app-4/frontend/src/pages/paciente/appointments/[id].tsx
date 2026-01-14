import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import {
    Calendar, Clock, MapPin, User, Phone, Mail,
    CheckCircle, AlertCircle, Loader2, ArrowLeft,
    Video, MessageSquare, FileText, Star
} from 'lucide-react';

interface Appointment {
    id: number;
    date: string;
    time: string;
    status: string;
    notes?: string;
    doctor?: {
        id: number;
        full_name: string;
        specialty: string;
        phone?: string;
        email?: string;
    };
    clinic?: {
        id: number;
        name: string;
        address: string;
        city: string;
        phone?: string;
    };
    triage_report_id?: number;
}

export default function AppointmentDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const { isAuthenticated, loading: authLoading } = useAuthStore();
    
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (id && isAuthenticated) {
            loadAppointment();
        }
    }, [id, isAuthenticated]);

    const loadAppointment = async () => {
        try {
            const response = await axiosInstance.get(`/appointments/${id}`);
            setAppointment(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao carregar agendamento');
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'confirmed':
                return { label: 'Confirmado', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle };
            case 'pending':
                return { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock };
            case 'cancelled':
                return { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: AlertCircle };
            case 'completed':
                return { label: 'Concluído', color: 'bg-blue-100 text-blue-700', icon: CheckCircle };
            default:
                return { label: status, color: 'bg-gray-100 text-gray-700', icon: Clock };
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const canJoinVideoCall = () => {
        if (!appointment) return false;
        if (appointment.status !== 'confirmed') return false;
        
        const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
        const now = new Date();
        const diffMinutes = (appointmentDate.getTime() - now.getTime()) / (1000 * 60);
        
        return diffMinutes <= 15 && diffMinutes >= -60;
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
            </div>
        );
    }

    if (error || !appointment) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-700 dark:text-red-200">
                        {error || 'Agendamento não encontrado'}
                    </h2>
                    <button
                        onClick={() => router.push('/paciente/my-appointments')}
                        className="mt-4 text-cyan-600 hover:underline"
                    >
                        Voltar para meus agendamentos
                    </button>
                </div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(appointment.status);
    const StatusIcon = statusConfig.icon;

    return (
        <>
            <Head>
                <title>Detalhes do Agendamento | MediSync</title>
            </Head>

            <div className="max-w-3xl mx-auto p-6 space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-cyan-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </button>

                {/* Success Banner */}
                {router.query.success && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                        <div>
                            <p className="font-semibold text-emerald-700 dark:text-emerald-200">
                                Agendamento realizado com sucesso!
                            </p>
                            <p className="text-sm text-emerald-600 dark:text-emerald-300">
                                Você receberá uma confirmação por email e notificação.
                            </p>
                        </div>
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4 text-white">
                        <div className="flex items-center justify-between">
                            <h1 className="text-xl font-bold">Detalhes do Agendamento</h1>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                                <StatusIcon className="w-4 h-4 inline mr-1" />
                                {statusConfig.label}
                            </span>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Date & Time */}
                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center">
                                <Calendar className="w-8 h-8 text-cyan-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Data e Horário</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                                    {formatDate(appointment.date)}
                                </p>
                                <p className="text-2xl font-bold text-cyan-600">{appointment.time}</p>
                            </div>
                        </div>

                        {/* Doctor Info */}
                        {appointment.doctor && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <User className="w-5 h-5 text-cyan-600" />
                                    Médico
                                </h3>
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {appointment.doctor.full_name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {appointment.doctor.specialty}
                                    </p>
                                    {appointment.doctor.phone && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-2">
                                            <Phone className="w-3 h-3" />
                                            {appointment.doctor.phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Clinic Info */}
                        {appointment.clinic && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-cyan-600" />
                                    Local
                                </h3>
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {appointment.clinic.name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {appointment.clinic.address}, {appointment.clinic.city}
                                    </p>
                                    {appointment.clinic.phone && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-2">
                                            <Phone className="w-3 h-3" />
                                            {appointment.clinic.phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {appointment.notes && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-cyan-600" />
                                    Observações
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    {appointment.notes}
                                </p>
                            </div>
                        )}

                        {/* Triage Link */}
                        {appointment.triage_report_id && (
                            <button
                                onClick={() => router.push(`/paciente/triagens/${appointment.triage_report_id}`)}
                                className="w-full p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-left hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                            >
                                <p className="font-medium text-amber-700 dark:text-amber-200">
                                    📋 Ver Triagem Vinculada
                                </p>
                                <p className="text-sm text-amber-600 dark:text-amber-300">
                                    Este agendamento foi gerado a partir de uma triagem IA
                                </p>
                            </button>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="px-6 pb-6 space-y-3">
                        {canJoinVideoCall() && (
                            <button
                                onClick={() => router.push(`/video-call/${appointment.id}`)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-xl font-semibold transition-colors"
                            >
                                <Video className="w-5 h-5" />
                                Entrar na Teleconsulta
                            </button>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => router.push(`/chat?doctor=${appointment.doctor?.id}`)}
                                className="flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Chat
                            </button>
                            <button
                                onClick={() => router.push(`/paciente/reviews?appointment=${appointment.id}`)}
                                className="flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
                                disabled={appointment.status !== 'completed'}
                            >
                                <Star className="w-4 h-4" />
                                Avaliar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
