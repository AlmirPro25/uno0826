import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
    Calendar, Clock, User, Video, MapPin,
    ChevronRight, AlertCircle, CheckCircle,
    Coffee, Loader2
} from 'lucide-react';

interface ScheduleItem {
    id: number;
    time: string;
    endTime: string;
    type: 'appointment' | 'break' | 'blocked';
    status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    appointmentType?: 'telemedicine' | 'in_person';
    patient?: {
        id: number;
        name: string;
    };
    notes?: string;
}

interface TodayScheduleProps {
    compact?: boolean;
    onStartConsultation?: (id: number) => void;
}

export function TodaySchedule({ compact = false, onStartConsultation }: TodayScheduleProps) {
    const [loading] = useState(false);

    // Mock schedule data
    const schedule: ScheduleItem[] = [
        { id: 1, time: '08:00', endTime: '08:30', type: 'appointment', status: 'completed', appointmentType: 'telemedicine', patient: { id: 1, name: 'Maria Silva' } },
        { id: 2, time: '08:30', endTime: '09:00', type: 'appointment', status: 'completed', appointmentType: 'in_person', patient: { id: 2, name: 'João Santos' } },
        { id: 3, time: '09:00', endTime: '09:30', type: 'appointment', status: 'in_progress', appointmentType: 'telemedicine', patient: { id: 3, name: 'Ana Oliveira' } },
        { id: 4, time: '09:30', endTime: '10:00', type: 'break', notes: 'Intervalo' },
        { id: 5, time: '10:00', endTime: '10:30', type: 'appointment', status: 'confirmed', appointmentType: 'telemedicine', patient: { id: 4, name: 'Carlos Lima' } },
        { id: 6, time: '10:30', endTime: '11:00', type: 'appointment', status: 'confirmed', appointmentType: 'in_person', patient: { id: 5, name: 'Paula Costa' } },
        { id: 7, time: '11:00', endTime: '11:30', type: 'appointment', status: 'scheduled', appointmentType: 'telemedicine', patient: { id: 6, name: 'Roberto Alves' } },
        { id: 8, time: '11:30', endTime: '12:00', type: 'blocked', notes: 'Reunião' },
    ];

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    const getStatusConfig = (status?: string) => {
        switch (status) {
            case 'completed':
                return { color: 'bg-gray-100 dark:bg-gray-700', textColor: 'text-gray-500', icon: CheckCircle };
            case 'in_progress':
                return { color: 'bg-cyan-100 dark:bg-cyan-900/30', textColor: 'text-cyan-700 dark:text-cyan-400', icon: Loader2 };
            case 'confirmed':
                return { color: 'bg-emerald-100 dark:bg-emerald-900/30', textColor: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle };
            case 'cancelled':
                return { color: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-700 dark:text-red-400', icon: AlertCircle };
            default:
                return { color: 'bg-amber-100 dark:bg-amber-900/30', textColor: 'text-amber-700 dark:text-amber-400', icon: Clock };
        }
    };

    const isCurrentSlot = (time: string, endTime: string) => {
        return currentTimeStr >= time && currentTimeStr < endTime;
    };

    const isPastSlot = (endTime: string) => {
        return currentTimeStr >= endTime;
    };

    const completedCount = schedule.filter(s => s.status === 'completed').length;
    const totalAppointments = schedule.filter(s => s.type === 'appointment').length;
    const nextAppointment = schedule.find(s => s.type === 'appointment' && !isPastSlot(s.endTime) && s.status !== 'completed');

    if (compact) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-cyan-600" />
                        Agenda de Hoje
                    </h3>
                    <span className="text-sm text-gray-500">
                        {completedCount}/{totalAppointments}
                    </span>
                </div>

                {nextAppointment ? (
                    <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
                        <p className="text-xs text-cyan-600 dark:text-cyan-400 mb-1">Próxima consulta</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                            {nextAppointment.patient?.name}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {nextAppointment.time}
                            {nextAppointment.appointmentType === 'telemedicine' && (
                                <Video className="w-3 h-3 ml-2 text-cyan-500" />
                            )}
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                        Nenhuma consulta pendente
                    </p>
                )}

                <Link
                    href="/medico/waiting-room"
                    className="mt-3 flex items-center justify-center gap-2 text-sm text-cyan-600 hover:underline"
                >
                    Ver agenda completa
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-cyan-600" />
                            Agenda de Hoje
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {completedCount}/{totalAppointments}
                        </p>
                        <p className="text-xs text-gray-500">consultas</p>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="p-4 max-h-96 overflow-y-auto">
                <div className="relative">
                    {/* Current time indicator */}
                    <div 
                        className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                        style={{ top: `${(currentHour - 8) * 80 + (currentMinute / 60) * 80}px` }}
                    >
                        <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                        <span className="absolute -left-1 -top-6 text-xs text-red-500 font-medium">
                            {currentTimeStr}
                        </span>
                    </div>

                    {/* Schedule items */}
                    <div className="space-y-2">
                        {schedule.map((item, index) => {
                            const isCurrent = isCurrentSlot(item.time, item.endTime);
                            const isPast = isPastSlot(item.endTime);
                            const statusConfig = getStatusConfig(item.status);

                            if (item.type === 'break') {
                                return (
                                    <div
                                        key={item.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl ${
                                            isPast ? 'opacity-50' : ''
                                        } bg-amber-50 dark:bg-amber-900/10`}
                                    >
                                        <Coffee className="w-5 h-5 text-amber-500" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                                {item.notes || 'Intervalo'}
                                            </p>
                                            <p className="text-xs text-amber-600">
                                                {item.time} - {item.endTime}
                                            </p>
                                        </div>
                                    </div>
                                );
                            }

                            if (item.type === 'blocked') {
                                return (
                                    <div
                                        key={item.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl ${
                                            isPast ? 'opacity-50' : ''
                                        } bg-gray-100 dark:bg-gray-700/50`}
                                    >
                                        <AlertCircle className="w-5 h-5 text-gray-400" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-500">
                                                {item.notes || 'Bloqueado'}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {item.time} - {item.endTime}
                                            </p>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                                        isCurrent 
                                            ? 'ring-2 ring-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' 
                                            : isPast 
                                            ? 'opacity-60 bg-gray-50 dark:bg-gray-700/30'
                                            : statusConfig.color
                                    }`}
                                >
                                    <div className="text-center min-w-[50px]">
                                        <p className={`text-sm font-medium ${isPast ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                            {item.time}
                                        </p>
                                        <p className="text-xs text-gray-400">{item.endTime}</p>
                                    </div>

                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        item.appointmentType === 'telemedicine'
                                            ? 'bg-cyan-500'
                                            : 'bg-emerald-500'
                                    }`}>
                                        {item.appointmentType === 'telemedicine' ? (
                                            <Video className="w-5 h-5 text-white" />
                                        ) : (
                                            <MapPin className="w-5 h-5 text-white" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium truncate ${isPast ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                            {item.patient?.name}
                                        </p>
                                        <p className={`text-xs ${statusConfig.textColor}`}>
                                            {item.status === 'completed' ? 'Concluída' :
                                             item.status === 'in_progress' ? 'Em andamento' :
                                             item.status === 'confirmed' ? 'Confirmada' :
                                             item.status === 'cancelled' ? 'Cancelada' : 'Agendada'}
                                        </p>
                                    </div>

                                    {item.status === 'confirmed' && !isPast && (
                                        <button
                                            onClick={() => onStartConsultation?.(item.id)}
                                            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-medium rounded-lg transition-colors"
                                        >
                                            Iniciar
                                        </button>
                                    )}

                                    {item.status === 'in_progress' && (
                                        <Link
                                            href={`/medico/consultation/${item.id}`}
                                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors"
                                        >
                                            Continuar
                                        </Link>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <Link
                    href="/medico/waiting-room"
                    className="flex items-center justify-center gap-2 text-sm text-cyan-600 hover:underline"
                >
                    Ver sala de espera
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}

export default TodaySchedule;
