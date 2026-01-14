import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
    Calendar, Clock, User, Video, MapPin,
    Phone, MessageSquare, MoreVertical, X,
    CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

interface Appointment {
    id: number;
    date: string;
    time: string;
    type: 'telemedicine' | 'in_person';
    status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    patient?: {
        id: number;
        full_name: string;
        phone?: string;
    };
    doctor?: {
        id: number;
        full_name: string;
        specialty?: string;
    };
    clinic?: {
        name: string;
        address?: string;
    };
}

interface AppointmentCardProps {
    appointment: Appointment;
    variant?: 'patient' | 'doctor';
    onCancel?: (id: number) => void;
    onConfirm?: (id: number) => void;
    onStart?: (id: number) => void;
}

export function AppointmentCard({ 
    appointment, 
    variant = 'patient',
    onCancel,
    onConfirm,
    onStart
}: AppointmentCardProps) {
    const [showMenu, setShowMenu] = useState(false);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'confirmed':
                return { 
                    label: 'Confirmada', 
                    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                    icon: CheckCircle
                };
            case 'in_progress':
                return { 
                    label: 'Em andamento', 
                    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                    icon: Clock
                };
            case 'completed':
                return { 
                    label: 'Concluída', 
                    color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
                    icon: CheckCircle
                };
            case 'cancelled':
                return { 
                    label: 'Cancelada', 
                    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                    icon: XCircle
                };
            default:
                return { 
                    label: 'Agendada', 
                    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                    icon: AlertCircle
                };
        }
    };

    const statusConfig = getStatusConfig(appointment.status);
    const StatusIcon = statusConfig.icon;

    const isUpcoming = new Date(`${appointment.date}T${appointment.time}`) > new Date();
    const canStart = appointment.status === 'confirmed' && isUpcoming;
    const canCancel = ['scheduled', 'confirmed'].includes(appointment.status) && isUpcoming;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Hoje';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Amanhã';
        }
        return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        appointment.type === 'telemedicine' 
                            ? 'bg-cyan-100 dark:bg-cyan-900/30' 
                            : 'bg-emerald-100 dark:bg-emerald-900/30'
                    }`}>
                        {appointment.type === 'telemedicine' ? (
                            <Video className="w-5 h-5 text-cyan-600" />
                        ) : (
                            <MapPin className="w-5 h-5 text-emerald-600" />
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                            {appointment.type === 'telemedicine' ? 'Teleconsulta' : 'Presencial'}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(appointment.date)}</span>
                            <Clock className="w-3 h-3 ml-1" />
                            <span>{appointment.time}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                    </span>
                    {(canCancel || canStart) && (
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>
                            {showMenu && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowMenu(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 py-1 min-w-[150px]">
                                        {canStart && (
                                            <button
                                                onClick={() => {
                                                    onStart?.(appointment.id);
                                                    setShowMenu(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                            >
                                                Iniciar Consulta
                                            </button>
                                        )}
                                        {canCancel && (
                                            <button
                                                onClick={() => {
                                                    onCancel?.(appointment.id);
                                                    setShowMenu(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {variant === 'patient' && appointment.doctor && (
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                                Dr(a). {appointment.doctor.full_name}
                            </p>
                            {appointment.doctor.specialty && (
                                <p className="text-sm text-gray-500">{appointment.doctor.specialty}</p>
                            )}
                        </div>
                    </div>
                )}

                {variant === 'doctor' && appointment.patient && (
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {appointment.patient.full_name}
                            </p>
                            {appointment.patient.phone && (
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {appointment.patient.phone}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {appointment.clinic && appointment.type === 'in_person' && (
                    <div className="flex items-start gap-2 text-sm text-gray-500 mb-3">
                        <MapPin className="w-4 h-4 mt-0.5" />
                        <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">{appointment.clinic.name}</p>
                            {appointment.clinic.address && (
                                <p className="text-xs">{appointment.clinic.address}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="px-4 pb-4 flex gap-2">
                {appointment.type === 'telemedicine' && canStart && (
                    <Link
                        href={`/video-call/${appointment.id}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        <Video className="w-4 h-4" />
                        Entrar
                    </Link>
                )}
                {variant === 'doctor' && (
                    <Link
                        href={`/medico/consultation/${appointment.id}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors"
                    >
                        Detalhes
                    </Link>
                )}
                {variant === 'patient' && (
                    <Link
                        href={`/paciente/appointments/${appointment.id}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors"
                    >
                        Ver Detalhes
                    </Link>
                )}
                <button className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                </button>
            </div>
        </motion.div>
    );
}

export default AppointmentCard;
