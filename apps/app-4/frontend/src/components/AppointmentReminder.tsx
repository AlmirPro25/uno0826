import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { axiosInstance } from '@/api/axios';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Calendar, Clock, X, Video, MapPin, Bell } from 'lucide-react';

interface UpcomingAppointment {
    id: number;
    date: string;
    time: string;
    doctor?: {
        full_name: string;
        specialty: string;
    };
    clinic?: {
        name: string;
    };
    is_teleconsultation?: boolean;
}

export function AppointmentReminder() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [appointment, setAppointment] = useState<UpcomingAppointment | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [minutesUntil, setMinutesUntil] = useState<number | null>(null);

    useEffect(() => {
        if (isAuthenticated && user?.role === 'PACIENTE') {
            checkUpcomingAppointments();
            
            // Check every minute
            const interval = setInterval(checkUpcomingAppointments, 60000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, user]);

    const checkUpcomingAppointments = async () => {
        try {
            const response = await axiosInstance.get('/appointments/upcoming?limit=1');
            const appointments = response.data || [];
            
            if (appointments.length > 0) {
                const apt = appointments[0];
                const aptDateTime = new Date(`${apt.date}T${apt.time}`);
                const now = new Date();
                const diffMinutes = Math.floor((aptDateTime.getTime() - now.getTime()) / (1000 * 60));
                
                // Show reminder if appointment is within 30 minutes
                if (diffMinutes > 0 && diffMinutes <= 30) {
                    setAppointment(apt);
                    setMinutesUntil(diffMinutes);
                    setDismissed(false);
                } else if (diffMinutes <= 0 && diffMinutes >= -60) {
                    // Appointment is happening now or started recently
                    setAppointment(apt);
                    setMinutesUntil(diffMinutes);
                    setDismissed(false);
                } else {
                    setAppointment(null);
                }
            }
        } catch (err) {
            console.error('Error checking appointments:', err);
        }
    };

    const handleJoin = () => {
        if (appointment?.is_teleconsultation) {
            router.push(`/video-call/${appointment.id}`);
        } else {
            router.push(`/paciente/appointments/${appointment?.id}`);
        }
    };

    if (!appointment || dismissed) return null;

    const isNow = minutesUntil !== null && minutesUntil <= 0;
    const isUrgent = minutesUntil !== null && minutesUntil <= 5;

    return (
        <div className={`fixed bottom-4 right-4 z-50 max-w-sm w-full animate-slide-up ${
            isNow ? 'animate-pulse' : ''
        }`}>
            <div className={`rounded-2xl shadow-2xl border overflow-hidden ${
                isNow 
                    ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 border-emerald-500' 
                    : isUrgent 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
                {/* Header */}
                <div className={`px-4 py-3 flex items-center justify-between ${
                    isNow || isUrgent ? 'text-white' : 'border-b border-gray-200 dark:border-gray-700'
                }`}>
                    <div className="flex items-center gap-2">
                        <Bell className={`w-5 h-5 ${isNow || isUrgent ? 'animate-bounce' : 'text-cyan-600'}`} />
                        <span className={`font-semibold ${isNow || isUrgent ? '' : 'text-gray-900 dark:text-white'}`}>
                            {isNow ? 'Consulta Agora!' : 'Lembrete de Consulta'}
                        </span>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        className={`p-1 rounded-full hover:bg-white/20 transition-colors ${
                            isNow || isUrgent ? '' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className={`p-4 ${isNow || isUrgent ? 'text-white' : ''}`}>
                    <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isNow || isUrgent 
                                ? 'bg-white/20' 
                                : 'bg-cyan-100 dark:bg-cyan-900/30'
                        }`}>
                            {appointment.is_teleconsultation ? (
                                <Video className={`w-6 h-6 ${isNow || isUrgent ? '' : 'text-cyan-600'}`} />
                            ) : (
                                <MapPin className={`w-6 h-6 ${isNow || isUrgent ? '' : 'text-cyan-600'}`} />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className={`font-medium ${isNow || isUrgent ? '' : 'text-gray-900 dark:text-white'}`}>
                                {appointment.doctor?.full_name || 'Consulta'}
                            </p>
                            <p className={`text-sm ${isNow || isUrgent ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                                {appointment.doctor?.specialty}
                            </p>
                            <div className={`flex items-center gap-2 mt-2 text-sm ${
                                isNow || isUrgent ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'
                            }`}>
                                <Clock className="w-4 h-4" />
                                {isNow ? (
                                    <span className="font-bold">Começando agora!</span>
                                ) : (
                                    <span>Em {minutesUntil} minutos</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleJoin}
                        className={`w-full mt-4 py-3 rounded-xl font-semibold transition-colors ${
                            isNow || isUrgent
                                ? 'bg-white text-gray-900 hover:bg-gray-100'
                                : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700'
                        }`}
                    >
                        {appointment.is_teleconsultation ? 'Entrar na Teleconsulta' : 'Ver Detalhes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
