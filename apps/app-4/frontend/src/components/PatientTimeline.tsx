import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, FileText, Pill, Syringe, Activity,
    ChevronDown, ChevronUp, Clock, User, AlertCircle,
    Stethoscope, Heart, Filter
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type EventType = 'consultation' | 'triage' | 'prescription' | 'vaccine' | 'exam' | 'record';

interface TimelineEvent {
    id: number;
    type: EventType;
    title: string;
    description?: string;
    date: Date;
    doctor?: string;
    specialty?: string;
    priority?: string;
    status?: string;
    details?: Record<string, any>;
}

interface PatientTimelineProps {
    events: TimelineEvent[];
    patientName?: string;
    compact?: boolean;
    maxItems?: number;
    onEventClick?: (event: TimelineEvent) => void;
}

const eventConfig: Record<EventType, { icon: any; color: string; bgColor: string; label: string }> = {
    consultation: {
        icon: Stethoscope,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
        label: 'Consulta'
    },
    triage: {
        icon: Activity,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        label: 'Triagem IA'
    },
    prescription: {
        icon: Pill,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        label: 'Receita'
    },
    vaccine: {
        icon: Syringe,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        label: 'Vacina'
    },
    exam: {
        icon: FileText,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        label: 'Exame'
    },
    record: {
        icon: Heart,
        color: 'text-rose-600',
        bgColor: 'bg-rose-100 dark:bg-rose-900/30',
        label: 'Prontuário'
    }
};

export function PatientTimeline({ 
    events, 
    patientName,
    compact = false,
    maxItems = 10,
    onEventClick 
}: PatientTimelineProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [filter, setFilter] = useState<EventType | 'all'>('all');
    const [showAll, setShowAll] = useState(false);

    const filteredEvents = events
        .filter(e => filter === 'all' || e.type === filter)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const displayedEvents = showAll ? filteredEvents : filteredEvents.slice(0, maxItems);

    const getPriorityColor = (priority?: string) => {
        if (!priority) return '';
        if (priority.includes('Vermelho') || priority.includes('Emergência')) return 'border-l-red-500';
        if (priority.includes('Laranja') || priority.includes('Muito Urgente')) return 'border-l-orange-500';
        if (priority.includes('Amarelo') || priority.includes('Urgente')) return 'border-l-yellow-500';
        if (priority.includes('Verde') || priority.includes('Pouco Urgente')) return 'border-l-green-500';
        return 'border-l-blue-500';
    };

    if (compact) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-cyan-600" />
                        Histórico Recente
                    </h3>
                    <span className="text-xs text-gray-500">{events.length} eventos</span>
                </div>
                <div className="space-y-2">
                    {events.slice(0, 5).map(event => {
                        const config = eventConfig[event.type];
                        const Icon = config.icon;
                        return (
                            <div 
                                key={event.id}
                                onClick={() => onEventClick?.(event)}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                            >
                                <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
                                    <Icon className={`w-4 h-4 ${config.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {event.title}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatDistanceToNow(new Date(event.date), { addSuffix: true, locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-cyan-600" />
                            Linha do Tempo
                        </h3>
                        {patientName && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <User className="w-4 h-4" />
                                {patientName}
                            </p>
                        )}
                    </div>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-400">
                        {filteredEvents.length} eventos
                    </span>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            filter === 'all'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        <Filter className="w-3 h-3 inline mr-1" />
                        Todos
                    </button>
                    {Object.entries(eventConfig).map(([type, config]) => {
                        const Icon = config.icon;
                        const count = events.filter(e => e.type === type).length;
                        if (count === 0) return null;
                        return (
                            <button
                                key={type}
                                onClick={() => setFilter(type as EventType)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                                    filter === type
                                        ? 'bg-cyan-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                <Icon className="w-3 h-3" />
                                {config.label}
                                <span className="ml-1 opacity-70">({count})</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Timeline */}
            <div className="p-4">
                {displayedEvents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum evento encontrado</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                        <div className="space-y-4">
                            <AnimatePresence>
                                {displayedEvents.map((event, index) => {
                                    const config = eventConfig[event.type];
                                    const Icon = config.icon;
                                    const isExpanded = expandedId === event.id;

                                    return (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="relative pl-12"
                                        >
                                            {/* Timeline dot */}
                                            <div className={`absolute left-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center z-10 border-4 border-white dark:border-gray-800`}>
                                                <Icon className={`w-5 h-5 ${config.color}`} />
                                            </div>

                                            {/* Event card */}
                                            <div 
                                                className={`bg-gray-50 dark:bg-gray-700/50 rounded-xl border-l-4 ${
                                                    event.priority ? getPriorityColor(event.priority) : 'border-l-gray-300 dark:border-l-gray-600'
                                                } cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                                                onClick={() => {
                                                    setExpandedId(isExpanded ? null : event.id);
                                                    onEventClick?.(event);
                                                }}
                                            >
                                                <div className="p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                                                                    {config.label}
                                                                </span>
                                                                {event.status && (
                                                                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                                                                        {event.status}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                                {event.title}
                                                            </h4>
                                                            {event.description && (
                                                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                                    {event.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-right">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {format(new Date(event.date), "dd/MM/yyyy")}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {format(new Date(event.date), "HH:mm")}
                                                                </p>
                                                            </div>
                                                            {isExpanded ? (
                                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                                            ) : (
                                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Expanded details */}
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-2">
                                                                    {event.doctor && (
                                                                        <div className="flex items-center gap-2 text-sm">
                                                                            <User className="w-4 h-4 text-gray-400" />
                                                                            <span className="text-gray-500">Médico:</span>
                                                                            <span className="text-gray-900 dark:text-white">{event.doctor}</span>
                                                                        </div>
                                                                    )}
                                                                    {event.specialty && (
                                                                        <div className="flex items-center gap-2 text-sm">
                                                                            <Stethoscope className="w-4 h-4 text-gray-400" />
                                                                            <span className="text-gray-500">Especialidade:</span>
                                                                            <span className="text-gray-900 dark:text-white">{event.specialty}</span>
                                                                        </div>
                                                                    )}
                                                                    {event.priority && (
                                                                        <div className="flex items-center gap-2 text-sm">
                                                                            <AlertCircle className="w-4 h-4 text-gray-400" />
                                                                            <span className="text-gray-500">Prioridade:</span>
                                                                            <span className="text-gray-900 dark:text-white">{event.priority}</span>
                                                                        </div>
                                                                    )}
                                                                    {event.details && Object.entries(event.details).map(([key, value]) => (
                                                                        <div key={key} className="flex items-center gap-2 text-sm">
                                                                            <span className="text-gray-500 capitalize">{key}:</span>
                                                                            <span className="text-gray-900 dark:text-white">{String(value)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                {/* Show more button */}
                {filteredEvents.length > maxItems && (
                    <div className="mt-4 text-center">
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="px-4 py-2 text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                        >
                            {showAll ? 'Mostrar menos' : `Ver mais ${filteredEvents.length - maxItems} eventos`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PatientTimeline;
