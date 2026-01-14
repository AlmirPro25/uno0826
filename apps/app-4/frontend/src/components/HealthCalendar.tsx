import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    ChevronLeft, ChevronRight, Calendar,
    Stethoscope, Pill, Syringe, FileText,
    Activity, Clock
} from 'lucide-react';
import { getVaccines, getExams, getMedications } from '@/api/health-profile';
import { getMyTriageReports } from '@/api/triage';
import { axiosInstance } from '@/api/axios';

interface HealthEvent {
    id: string;
    date: Date;
    type: 'appointment' | 'medication' | 'vaccine' | 'exam' | 'triage';
    title: string;
    time?: string;
    status?: 'scheduled' | 'completed' | 'cancelled';
}

interface HealthCalendarProps {
    compact?: boolean;
    onDateSelect?: (date: Date) => void;
}

export function HealthCalendar({ compact = false, onDateSelect }: HealthCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [events, setEvents] = useState<HealthEvent[]>([]);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const allEvents: HealthEvent[] = [];

            // Load appointments
            try {
                const appointmentsRes = await axiosInstance.get('/appointments/my-appointments');
                const appointments = appointmentsRes.data || [];
                appointments.forEach((apt: any) => {
                    allEvents.push({
                        id: `apt-${apt.id}`,
                        date: new Date(apt.date),
                        type: 'appointment',
                        title: `Consulta ${apt.doctor?.full_name || 'Médico'}`,
                        time: apt.time,
                        status: apt.status === 'completed' ? 'completed' : apt.status === 'cancelled' ? 'cancelled' : 'scheduled'
                    });
                });
            } catch { /* ignore */ }

            // Load vaccines
            try {
                const vaccines = await getVaccines();
                vaccines.forEach(v => {
                    allEvents.push({
                        id: `vac-${v.id}`,
                        date: new Date(v.applied_at),
                        type: 'vaccine',
                        title: v.name,
                        status: 'completed'
                    });
                    if (v.next_dose_at) {
                        allEvents.push({
                            id: `vac-next-${v.id}`,
                            date: new Date(v.next_dose_at),
                            type: 'vaccine',
                            title: `${v.name} (próxima dose)`,
                            status: 'scheduled'
                        });
                    }
                });
            } catch { /* ignore */ }

            // Load exams
            try {
                const exams = await getExams();
                exams.forEach(e => {
                    const date = e.scheduled_at || e.completed_at || e.requested_at || e.created_at;
                    allEvents.push({
                        id: `exam-${e.id}`,
                        date: new Date(date),
                        type: 'exam',
                        title: e.name,
                        status: e.status === 'completed' ? 'completed' : 'scheduled'
                    });
                });
            } catch { /* ignore */ }

            // Load triages
            try {
                const triages = await getMyTriageReports();
                triages.forEach(t => {
                    allEvents.push({
                        id: `triage-${t.id}`,
                        date: new Date(t.created_at),
                        type: 'triage',
                        title: 'Triagem IA',
                        status: 'completed'
                    });
                });
            } catch { /* ignore */ }

            setEvents(allEvents);
        } catch (error) {
            console.error('Error loading calendar events:', error);
        }
    };

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'appointment': return Stethoscope;
            case 'medication': return Pill;
            case 'vaccine': return Syringe;
            case 'exam': return FileText;
            case 'triage': return Activity;
            default: return Calendar;
        }
    };

    const getEventColor = (type: string) => {
        switch (type) {
            case 'appointment': return 'bg-cyan-500';
            case 'medication': return 'bg-pink-500';
            case 'vaccine': return 'bg-emerald-500';
            case 'exam': return 'bg-purple-500';
            case 'triage': return 'bg-amber-500';
            default: return 'bg-gray-500';
        }
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();
        return { daysInMonth, startingDay };
    };

    const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const getEventsForDate = (day: number) => {
        return events.filter(e => {
            const eventDate = new Date(e.date);
            return eventDate.getDate() === day && 
                   eventDate.getMonth() === currentDate.getMonth() &&
                   eventDate.getFullYear() === currentDate.getFullYear();
        });
    };

    const handleDateClick = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(date);
        onDateSelect?.(date);
    };

    const navigateMonth = (direction: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
    };

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() && 
               currentDate.getMonth() === today.getMonth() &&
               currentDate.getFullYear() === today.getFullYear();
    };

    const selectedDateEvents = selectedDate ? events.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate.toDateString() === selectedDate.toDateString();
    }) : [];

    if (compact) {
        const upcomingEvents = events
            .filter(e => e.date >= new Date() && e.status === 'scheduled')
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 3);

        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-cyan-600" />
                        Próximos Eventos
                    </h3>
                </div>
                
                <div className="space-y-2">
                    {upcomingEvents.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-2">
                            Nenhum evento agendado
                        </p>
                    ) : (
                        upcomingEvents.map(event => {
                            const Icon = getEventIcon(event.type);
                            return (
                                <div key={event.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getEventColor(event.type)}`}>
                                        <Icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {event.title}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {event.date.toLocaleDateString('pt-BR')} {event.time && `às ${event.time}`}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-cyan-600" />
                        Calendário de Saúde
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigateMonth(-1)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[140px] text-center">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </span>
                        <button
                            onClick={() => navigateMonth(1)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex">
                {/* Calendar Grid */}
                <div className="flex-1 p-4">
                    {/* Day Names */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {dayNames.map(day => (
                            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: startingDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square" />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dayEvents = getEventsForDate(day);
                            const isSelected = selectedDate?.getDate() === day && 
                                             selectedDate?.getMonth() === currentDate.getMonth();

                            return (
                                <motion.button
                                    key={day}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDateClick(day)}
                                    className={`aspect-square rounded-lg flex flex-col items-center justify-center relative ${
                                        isToday(day) ? 'bg-cyan-100 dark:bg-cyan-900/30 ring-2 ring-cyan-500' :
                                        isSelected ? 'bg-cyan-50 dark:bg-cyan-900/20' :
                                        'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <span className={`text-sm ${
                                        isToday(day) ? 'font-bold text-cyan-700 dark:text-cyan-400' :
                                        'text-gray-700 dark:text-gray-300'
                                    }`}>
                                        {day}
                                    </span>
                                    {dayEvents.length > 0 && (
                                        <div className="flex gap-0.5 mt-1">
                                            {dayEvents.slice(0, 3).map((event, idx) => (
                                                <div 
                                                    key={idx}
                                                    className={`w-1.5 h-1.5 rounded-full ${getEventColor(event.type)}`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Events Panel */}
                {selectedDate && (
                    <div className="w-64 border-l border-gray-200 dark:border-gray-700 p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                            {selectedDate.toLocaleDateString('pt-BR', { 
                                weekday: 'long', 
                                day: 'numeric', 
                                month: 'long' 
                            })}
                        </h4>
                        
                        {selectedDateEvents.length === 0 ? (
                            <p className="text-sm text-gray-500">Nenhum evento neste dia</p>
                        ) : (
                            <div className="space-y-3">
                                {selectedDateEvents.map(event => {
                                    const Icon = getEventIcon(event.type);
                                    return (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getEventColor(event.type)}`}>
                                                    <Icon className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                        {event.title}
                                                    </p>
                                                    {event.time && (
                                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                            <Clock className="w-3 h-3" />
                                                            {event.time}
                                                        </p>
                                                    )}
                                                    <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs ${
                                                        event.status === 'completed' 
                                                            ? 'bg-emerald-100 text-emerald-700' 
                                                            : event.status === 'cancelled'
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-cyan-100 text-cyan-700'
                                                    }`}>
                                                        {event.status === 'completed' ? 'Concluído' :
                                                         event.status === 'cancelled' ? 'Cancelado' : 'Agendado'}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-cyan-500" />
                        <span>Consulta</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-pink-500" />
                        <span>Medicamento</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span>Vacina</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <span>Exame</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span>Triagem</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HealthCalendar;
