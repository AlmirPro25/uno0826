import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Clock, CheckCircle, AlertCircle, Download,
    Calendar, ChevronRight, X, Loader2, Eye, Upload,
    Beaker, Heart, Brain, Droplets
} from 'lucide-react';
import Link from 'next/link';
import { getExams, createExam, Exam as APIExam } from '@/api/health-profile';

interface Exam {
    id: string;
    name: string;
    type: string;
    category: 'blood' | 'imaging' | 'cardio' | 'neuro' | 'other';
    requestedAt: string;
    scheduledAt?: string;
    completedAt?: string;
    status: 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    doctor: string;
    clinic?: string;
    resultUrl?: string;
    notes?: string;
}

interface ExamTrackerProps {
    onClose?: () => void;
    compact?: boolean;
}

const categoryIcons: Record<string, React.ElementType> = {
    blood: Droplets,
    imaging: Eye,
    cardio: Heart,
    neuro: Brain,
    other: Beaker,
};

const categoryColors: Record<string, string> = {
    blood: 'bg-red-500',
    imaging: 'bg-blue-500',
    cardio: 'bg-pink-500',
    neuro: 'bg-purple-500',
    other: 'bg-gray-500',
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    requested: { label: 'Solicitado', color: 'bg-amber-100 text-amber-700', icon: Clock },
    scheduled: { label: 'Agendado', color: 'bg-blue-100 text-blue-700', icon: Calendar },
    in_progress: { label: 'Em Análise', color: 'bg-purple-100 text-purple-700', icon: Loader2 },
    completed: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-700', icon: X },
};

export function ExamTracker({ onClose, compact = false }: ExamTrackerProps) {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newExam, setNewExam] = useState({
        name: '',
        type: 'Sangue',
        notes: ''
    });

    useEffect(() => {
        loadExams();
    }, []);

    const mapExamType = (type: string): 'blood' | 'imaging' | 'cardio' | 'neuro' | 'other' => {
        const typeMap: Record<string, 'blood' | 'imaging' | 'cardio' | 'neuro' | 'other'> = {
            'Sangue': 'blood',
            'Imagem': 'imaging',
            'Cardiológico': 'cardio',
            'Neurológico': 'neuro',
        };
        return typeMap[type] || 'other';
    };

    const loadExams = async () => {
        try {
            const apiExams = await getExams();
            const mapped = apiExams.map((e: APIExam) => ({
                id: e.id.toString(),
                name: e.name,
                type: e.type || 'Outro',
                category: mapExamType(e.type || ''),
                requestedAt: e.requested_at?.split('T')[0] || e.created_at.split('T')[0],
                scheduledAt: e.scheduled_at?.split('T')[0],
                completedAt: e.completed_at?.split('T')[0],
                status: e.status as Exam['status'],
                doctor: 'Médico',
                clinic: '',
                resultUrl: e.result_url,
                notes: e.notes
            }));
            setExams(mapped);
        } catch (error) {
            console.error('Error loading exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExam = async () => {
        if (!newExam.name) return;
        try {
            const created = await createExam({
                name: newExam.name,
                type: newExam.type,
                notes: newExam.notes,
                status: 'requested',
                requested_at: new Date().toISOString()
            });
            const mapped: Exam = {
                id: created.id.toString(),
                name: created.name,
                type: created.type || 'Outro',
                category: mapExamType(created.type || ''),
                requestedAt: new Date().toISOString().split('T')[0],
                status: 'requested',
                doctor: 'Você',
                notes: created.notes
            };
            setExams(prev => [...prev, mapped]);
            setNewExam({ name: '', type: 'Sangue', notes: '' });
            setShowAddModal(false);
        } catch (error) {
            console.error('Error creating exam:', error);
        }
    };

    const filteredExams = exams.filter(exam => {
        if (filter === 'pending') return exam.status !== 'completed' && exam.status !== 'cancelled';
        if (filter === 'completed') return exam.status === 'completed';
        return true;
    });

    const pendingCount = exams.filter(e => e.status !== 'completed' && e.status !== 'cancelled').length;
    const completedCount = exams.filter(e => e.status === 'completed').length;

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };


    if (compact) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Beaker className="w-5 h-5 text-blue-500" />
                        Exames
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            {pendingCount} pendentes
                        </span>
                    </div>
                </div>
                
                <div className="space-y-2">
                    {filteredExams.slice(0, 2).map(exam => {
                        const StatusIcon = statusConfig[exam.status].icon;
                        const CategoryIcon = categoryIcons[exam.category];
                        return (
                            <div key={exam.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className={`w-8 h-8 ${categoryColors[exam.category]} rounded-lg flex items-center justify-center`}>
                                    <CategoryIcon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {exam.name}
                                    </p>
                                    <p className="text-xs text-gray-500">{exam.clinic || 'Aguardando'}</p>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[exam.status].color}`}>
                                    {statusConfig[exam.status].label}
                                </span>
                            </div>
                        );
                    })}
                </div>
                
                {exams.length > 2 && (
                    <Link href="/paciente/exams" className="block mt-3 text-center text-sm text-cyan-600 hover:underline">
                        Ver todos ({exams.length})
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Beaker className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900 dark:text-white">Meus Exames</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Acompanhe seus exames</p>
                        </div>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                        <p className="text-sm text-gray-500">Pendentes</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
                        <p className="text-sm text-gray-500">Concluídos</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">{exams.length}</p>
                        <p className="text-sm text-gray-500">Total</p>
                    </div>
                </div>

                {/* Filter */}
                <div className="flex gap-2">
                    {(['all', 'pending', 'completed'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === f
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : 'Concluídos'}
                        </button>
                    ))}
                </div>

                {/* Exams List */}
                <div className="space-y-3">
                    {filteredExams.map(exam => {
                        const StatusIcon = statusConfig[exam.status].icon;
                        const CategoryIcon = categoryIcons[exam.category];
                        
                        return (
                            <motion.div
                                key={exam.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                            >
                                <div 
                                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    onClick={() => setSelectedExam(selectedExam?.id === exam.id ? null : exam)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 ${categoryColors[exam.category]} rounded-xl flex items-center justify-center`}>
                                            <CategoryIcon className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900 dark:text-white">{exam.name}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[exam.status].color}`}>
                                                    {statusConfig[exam.status].label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">{exam.type} • {exam.doctor}</p>
                                        </div>
                                        <div className="text-right">
                                            {exam.scheduledAt && (
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {formatDate(exam.scheduledAt)}
                                                </p>
                                            )}
                                            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                                                selectedExam?.id === exam.id ? 'rotate-90' : ''
                                            }`} />
                                        </div>
                                    </div>
                                </div>


                                {/* Expanded Details */}
                                <AnimatePresence>
                                    {selectedExam?.id === exam.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30"
                                        >
                                            <div className="p-4 space-y-4">
                                                {/* Timeline */}
                                                <div className="flex items-center gap-2 text-sm">
                                                    <div className="flex items-center gap-1 text-gray-500">
                                                        <FileText className="w-4 h-4" />
                                                        Solicitado: {formatDate(exam.requestedAt)}
                                                    </div>
                                                    {exam.scheduledAt && (
                                                        <>
                                                            <span className="text-gray-300">→</span>
                                                            <div className="flex items-center gap-1 text-blue-600">
                                                                <Calendar className="w-4 h-4" />
                                                                Agendado: {formatDate(exam.scheduledAt)}
                                                            </div>
                                                        </>
                                                    )}
                                                    {exam.completedAt && (
                                                        <>
                                                            <span className="text-gray-300">→</span>
                                                            <div className="flex items-center gap-1 text-emerald-600">
                                                                <CheckCircle className="w-4 h-4" />
                                                                Concluído: {formatDate(exam.completedAt)}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Clinic */}
                                                {exam.clinic && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                        <span className="font-medium">Local:</span>
                                                        {exam.clinic}
                                                    </div>
                                                )}

                                                {/* Notes */}
                                                {exam.notes && (
                                                    <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                                        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                                                        <p className="text-sm text-amber-700 dark:text-amber-300">{exam.notes}</p>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex gap-2">
                                                    {exam.status === 'completed' && exam.resultUrl && (
                                                        <a
                                                            href={exam.resultUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 flex items-center justify-center gap-2"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                            Baixar Resultado
                                                        </a>
                                                    )}
                                                    {exam.status === 'requested' && (
                                                        <button className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center justify-center gap-2">
                                                            <Calendar className="w-4 h-4" />
                                                            Agendar
                                                        </button>
                                                    )}
                                                    {exam.status === 'completed' && (
                                                        <button className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center gap-2">
                                                            <Upload className="w-4 h-4" />
                                                            Enviar para Médico
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

                {filteredExams.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-500">
                        <Beaker className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum exame encontrado</p>
                    </div>
                )}

                {loading && (
                    <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                        <p className="text-sm text-gray-500 mt-2">Carregando exames...</p>
                    </div>
                )}

                {/* Add Button */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                >
                    <FileText className="w-5 h-5" />
                    Adicionar Exame
                </button>
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowAddModal(false)}
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
                                    Novo Exame
                                </h3>
                                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nome do Exame
                                    </label>
                                    <input
                                        type="text"
                                        value={newExam.name}
                                        onChange={e => setNewExam({ ...newExam, name: e.target.value })}
                                        placeholder="Ex: Hemograma Completo"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Tipo
                                    </label>
                                    <select
                                        value={newExam.type}
                                        onChange={e => setNewExam({ ...newExam, type: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Sangue">Sangue</option>
                                        <option value="Imagem">Imagem</option>
                                        <option value="Cardiológico">Cardiológico</option>
                                        <option value="Neurológico">Neurológico</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Observações (opcional)
                                    </label>
                                    <textarea
                                        value={newExam.notes}
                                        onChange={e => setNewExam({ ...newExam, notes: e.target.value })}
                                        placeholder="Ex: Jejum de 8 horas"
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleAddExam}
                                        disabled={!newExam.name}
                                        className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Adicionar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ExamTracker;
