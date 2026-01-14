import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, ChevronLeft, ChevronRight, Clock, User, Video,
    MapPin, Phone, X, Check, AlertCircle, Plus
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
    id: number;
    patientName: string;
    patientEmail?: string;
    patientPhone?: string;
    date: string;
    time: string;
    duration: number;
    type: 'presencial' | 'teleconsulta';
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    reason?: string;
}

interface DoctorCalendarProps {
    appointments?: Appointment[];
    onSelectDate?: (date: Date) => void;
    onSelectAppointment?: (appointment: Appointment) => void;
    onAddAppointment?: (date: Date) => void;
}

export function DoctorCalendar({ 
    appointments = [], 
    onSelectDate, 
    onSelectAppointment,
    onAddAppointment 
}: DoctorCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

    // Mock appointments if none provided
    const mockAppointments: Appointment[] = appointments.length > 0 ? appointments : [
        {
            id: 1,
            patientName: 'Maria Silva',
            patientEmail: 'maria@email.com',
            patientPhone: '(11) 99999-1234',
            date: format(new Date(), 'yyyy-MM-dd'),
            time: '09:00',
            duration: 30,
            type: 'teleconsulta',
            status: 'confirmed',
            reason: 'Retorno - Hipertensão'
        },
        {
            id: 2,
            patientName: 'João Santos',
            patientEmail: 'joao@email.com',
            date: format(new Date(), 'yyyy-MM-dd'),
            time: '10:00',
            duration: 30,
            type: 'presencial',
            status: 'confirmed',
            reason: 'Consulta de rotina'
        },
        {
            id: 3,
            patientName: 'Ana Oliveira',
            date: format(new Date(), 'yyyy-MM-dd'),
            time: '11:00',
            duration: 45,
            type: 'teleconsulta',
            status: 'pending',
            reason: 'Primeira consulta'
        },
        {
            id: 4,
            patientName: 'Pedro Costa',
            date: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'),
            time: '14:00',
            duration: 30,
            type: 'presencial',
            status: 'confirmed'
        }
    ];

    const allAppointments = appointments.length > 0 ? appointments : mockAppointments;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Pad days to start on Sunday
    const startDay = monthStart.getDay();
    const paddedDays = Array(startDay).fill(null).concat(days);

    const getAppointmentsForDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return allAppointments.filter(apt => apt.date === dateStr);
    };

    const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-emerald-500';
            case 'pending': return 'bg-amber-500';
            case 'completed': return 'bg-blue-500';
            case 'cancelled': return 'bg-gray-400';
            default: return 'bg-gray-400';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'confirmed': return 'Confirmado';
            case 'pending': return 'Pendente';
            case 'completed': return 'Concluído';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3">
                {/* Calendar */}
                <div className="lg:col-span-2 p-6 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                                onClick={() => setCurrentMonth(new Date())}
                                className="px-3 py-1 text-sm text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg"
                            >
                                Hoje
                            </button>
                            <button
                                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {paddedDays.map((day, index) => {
                            if (!day) {
                                return <div key={`empty-${index}`} className="aspect-square" />;
                            }

                            const dayAppointments = getAppointmentsForDate(day);
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, currentMonth);

                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => {
                                        setSelectedDate(day);
                                        onSelectDate?.(day);
                                    }}
                                    className={`aspect-square p-1 rounded-xl transition-colors relative ${
                                        isSelected
                                            ? 'bg-cyan-500 text-white'
                                            : isToday(day)
                                                ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
                                                : isCurrentMonth
                                                    ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                                                    : 'text-gray-400 dark:text-gray-600'
                                    }`}
                                >
                                    <span className="text-sm font-medium">{format(day, 'd')}</span>
                                    {dayAppointments.length > 0 && (
                                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                            {dayAppointments.slice(0, 3).map((apt, i) => (
                                                <span
                                                    key={i}
                                                    className={`w-1.5 h-1.5 rounded-full ${
                                                        isSelected ? 'bg-white' : getStatusColor(apt.status)
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>


                {/* Day Details */}
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
                        </h3>
                        {selectedDate && onAddAppointment && (
                            <button
                                onClick={() => onAddAppointment(selectedDate)}
                                className="p-2 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {selectedDateAppointments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Nenhuma consulta agendada</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {selectedDateAppointments
                                .sort((a, b) => a.time.localeCompare(b.time))
                                .map(apt => (
                                    <motion.button
                                        key={apt.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => {
                                            setSelectedAppointment(apt);
                                            onSelectAppointment?.(apt);
                                        }}
                                        className={`w-full p-3 rounded-xl text-left transition-colors border-l-4 ${
                                            apt.status === 'confirmed' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' :
                                            apt.status === 'pending' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' :
                                            'border-gray-300 bg-gray-50 dark:bg-gray-700/50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                {apt.time}
                                            </span>
                                            {apt.type === 'teleconsulta' ? (
                                                <Video className="w-4 h-4 text-cyan-500" />
                                            ) : (
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                        <p className="font-medium text-gray-900 dark:text-white">{apt.patientName}</p>
                                        {apt.reason && (
                                            <p className="text-sm text-gray-500 truncate">{apt.reason}</p>
                                        )}
                                        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                                            apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                            apt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {getStatusText(apt.status)}
                                        </span>
                                    </motion.button>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Appointment Detail Modal */}
            <AnimatePresence>
                {selectedAppointment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setSelectedAppointment(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Detalhes da Consulta
                                </h3>
                                <button
                                    onClick={() => setSelectedAppointment(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Patient Info */}
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-cyan-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {selectedAppointment.patientName}
                                        </p>
                                        {selectedAppointment.patientEmail && (
                                            <p className="text-sm text-gray-500">{selectedAppointment.patientEmail}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Data</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {format(new Date(selectedAppointment.date), "dd/MM/yyyy")}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Horário</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {selectedAppointment.time}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Tipo</p>
                                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                                            {selectedAppointment.type === 'teleconsulta' ? (
                                                <><Video className="w-4 h-4 text-cyan-500" /> Teleconsulta</>
                                            ) : (
                                                <><MapPin className="w-4 h-4 text-gray-400" /> Presencial</>
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <span className={`inline-block text-sm px-2 py-0.5 rounded-full ${
                                            selectedAppointment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                            selectedAppointment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {getStatusText(selectedAppointment.status)}
                                        </span>
                                    </div>
                                </div>

                                {selectedAppointment.reason && (
                                    <div>
                                        <p className="text-sm text-gray-500">Motivo</p>
                                        <p className="text-gray-900 dark:text-white">{selectedAppointment.reason}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-4">
                                    {selectedAppointment.patientPhone && (
                                        <a
                                            href={`tel:${selectedAppointment.patientPhone}`}
                                            className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                                        >
                                            <Phone className="w-4 h-4" />
                                            Ligar
                                        </a>
                                    )}
                                    {selectedAppointment.type === 'teleconsulta' && (
                                        <button className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:opacity-90 flex items-center justify-center gap-2">
                                            <Video className="w-4 h-4" />
                                            Iniciar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default DoctorCalendar;
