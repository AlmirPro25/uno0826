import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import {
    Users, Clock, Video, Loader2, ArrowLeft, CheckCircle,
    XCircle, Calendar, Phone, MessageSquare,
    AlertCircle, RefreshCw
} from 'lucide-react';
import { format, isToday, isTomorrow, parseISO, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
    id: number;
    startTime: string;
    endTime: string;
    status: string;
    type: string;
    notes?: string;
    patient: {
        id: number;
        fullName: string;
        email: string;
        phone?: string;
    };
}

export default function WaitingRoomPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'today' | 'upcoming' | 'all'>('today');
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        loadAppointments();
        
        // Refresh every minute
        const interval = setInterval(loadAppointments, 60000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const loadAppointments = async () => {
        try {
            const response = await axiosInstance.get('/appointments/my-appointments');
            setAppointments(response.data || []);
        } catch (err: any) {
            setError('Erro ao carregar consultas');
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (id: number) => {
        setActionLoading(id);
        try {
            await axiosInstance.put(`/appointments/${id}/complete`);
            setAppointments(prev => prev.map(a => 
                a.id === id ? { ...a, status: 'completed' } : a
            ));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao finalizar consulta');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async (id: number) => {
        if (!confirm('Tem certeza que deseja cancelar esta consulta?')) return;
        
        setActionLoading(id);
        try {
            await axiosInstance.put(`/appointments/${id}/cancel`);
            setAppointments(prev => prev.map(a => 
                a.id === id ? { ...a, status: 'cancelled' } : a
            ));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao cancelar consulta');
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'booked':
            case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
            case 'confirmed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
            case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'booked': return 'Agendada';
            case 'pending': return 'Pendente';
            case 'confirmed': return 'Confirmada';
            case 'completed': return 'Concluída';
            case 'cancelled': return 'Cancelada';
            default: return status;
        }
    };

    const getTimeUntil = (dateStr: string) => {
        const date = parseISO(dateStr);
        const now = new Date();
        const diff = differenceInMinutes(date, now);
        
        if (diff < 0) return 'Atrasado';
        if (diff === 0) return 'Agora';
        if (diff < 60) return `Em ${diff} min`;
        if (diff < 1440) return `Em ${Math.floor(diff / 60)}h`;
        return format(date, "dd/MM", { locale: ptBR });
    };

    const filteredAppointments = appointments.filter(apt => {
        const date = parseISO(apt.startTime);
        const isPending = apt.status === 'booked' || apt.status === 'pending' || apt.status === 'confirmed';
        
        if (filter === 'today') {
            return isToday(date) && isPending;
        }
        if (filter === 'upcoming') {
            return isPending;
        }
        return true;
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const todayCount = appointments.filter(a => {
        const date = parseISO(a.startTime);
        return isToday(date) && (a.status === 'booked' || a.status === 'pending' || a.status === 'confirmed');
    }).length;

    const nextAppointment = filteredAppointments.find(a => 
        (a.status === 'booked' || a.status === 'pending' || a.status === 'confirmed') &&
        new Date(a.startTime) >= new Date()
    );

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
                <title>Sala de Espera | MediSync</title>
            </Head>

            <div className="max-w-5xl mx-auto p-6 space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/medico/dashboard')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-cyan-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao Dashboard
                </button>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Users className="w-7 h-7 text-cyan-600" />
                            Sala de Espera
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {todayCount} consulta(s) para hoje
                        </p>
                    </div>
                    <button
                        onClick={loadAppointments}
                        className="flex items-center gap-2 px-4 py-2 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-xl font-medium"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Atualizar
                    </button>
                </div>

                {/* Next Appointment Highlight */}
                {nextAppointment && (
                    <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-6 text-white">
                        <p className="text-cyan-100 text-sm mb-2">Próxima Consulta</p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                                    <Users className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{nextAppointment.patient.fullName}</h3>
                                    <p className="text-cyan-100 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {format(parseISO(nextAppointment.startTime), "HH:mm", { locale: ptBR })}
                                        <span className="px-2 py-0.5 bg-white/20 rounded text-xs">
                                            {getTimeUntil(nextAppointment.startTime)}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push(`/video-call/${nextAppointment.id}`)}
                                className="flex items-center gap-2 px-6 py-3 bg-white text-cyan-600 rounded-xl font-bold hover:bg-cyan-50"
                            >
                                <Video className="w-5 h-5" />
                                Iniciar Consulta
                            </button>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-2">
                    {(['today', 'upcoming', 'all'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                filter === f
                                    ? 'bg-cyan-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            {f === 'today' ? 'Hoje' : f === 'upcoming' ? 'Próximas' : 'Todas'}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700 dark:text-red-200">{error}</span>
                    </div>
                )}

                {/* Appointments List */}
                {filteredAppointments.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Nenhuma consulta encontrada
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {filter === 'today' 
                                ? 'Você não tem consultas agendadas para hoje.'
                                : 'Não há consultas para exibir.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredAppointments.map((appointment) => {
                            const date = parseISO(appointment.startTime);
                            const isPast = new Date(appointment.startTime) < new Date();
                            const isActive = appointment.status === 'booked' || appointment.status === 'pending' || appointment.status === 'confirmed';
                            
                            return (
                                <div
                                    key={appointment.id}
                                    className={`bg-white dark:bg-gray-800 rounded-2xl border p-6 transition-all ${
                                        isActive && !isPast
                                            ? 'border-cyan-200 dark:border-cyan-800 hover:shadow-lg'
                                            : 'border-gray-200 dark:border-gray-700 opacity-75'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                                isActive ? 'bg-cyan-100 dark:bg-cyan-900/30' : 'bg-gray-100 dark:bg-gray-700'
                                            }`}>
                                                <Users className={`w-6 h-6 ${isActive ? 'text-cyan-600' : 'text-gray-400'}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {appointment.patient.fullName}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {appointment.patient.email}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {isToday(date) ? 'Hoje' : isTomorrow(date) ? 'Amanhã' : format(date, "dd/MM", { locale: ptBR })}
                                                    </span>
                                                    <span className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {format(date, "HH:mm")}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                                        {getStatusLabel(appointment.status)}
                                                    </span>
                                                    {appointment.type === 'telemedicine' && (
                                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-xs font-medium">
                                                            Teleconsulta
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {isActive && (
                                            <div className="flex items-center gap-2">
                                                {appointment.patient.phone && (
                                                    <a
                                                        href={`tel:${appointment.patient.phone}`}
                                                        className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                                        title="Ligar"
                                                    >
                                                        <Phone className="w-5 h-5" />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => router.push(`/chat?userId=${appointment.patient.id}`)}
                                                    className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                                    title="Chat"
                                                >
                                                    <MessageSquare className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/video-call/${appointment.id}`)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium"
                                                >
                                                    <Video className="w-4 h-4" />
                                                    Iniciar
                                                </button>
                                                <button
                                                    onClick={() => handleComplete(appointment.id)}
                                                    disabled={actionLoading === appointment.id}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg disabled:opacity-50"
                                                    title="Finalizar"
                                                >
                                                    {actionLoading === appointment.id ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="w-5 h-5" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleCancel(appointment.id)}
                                                    disabled={actionLoading === appointment.id}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
                                                    title="Cancelar"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {appointment.notes && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                <strong>Observações:</strong> {appointment.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
