import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { axiosInstance } from '@/api/axios';
import {
    CalendarOff, Plus, Loader2, ArrowLeft, Trash2,
    AlertCircle, Calendar, Clock, Edit2, X
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ScheduleBlock {
    id: number;
    startTime: string;
    endTime: string;
    reason: string;
    isRecurring: boolean;
    recurringDays?: string[];
    createdAt: string;
}

export default function ScheduleBlocksPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    
    const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
    const [saving, setSaving] = useState(false);
    
    // Form fields
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('08:00');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('18:00');
    const [reason, setReason] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringDays, setRecurringDays] = useState<string[]>([]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        loadBlocks();
    }, [isAuthenticated]);

    const loadBlocks = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/schedule-blocks/my-blocks');
            setBlocks(response.data || []);
        } catch (err: any) {
            // Mock data for demo
            setBlocks([
                {
                    id: 1,
                    startTime: '2024-12-20T08:00:00Z',
                    endTime: '2024-12-20T18:00:00Z',
                    reason: 'Férias',
                    isRecurring: false,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    startTime: '2024-12-25T08:00:00Z',
                    endTime: '2024-12-25T18:00:00Z',
                    reason: 'Feriado - Natal',
                    isRecurring: false,
                    createdAt: new Date().toISOString()
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStartDate('');
        setStartTime('08:00');
        setEndDate('');
        setEndTime('18:00');
        setReason('');
        setIsRecurring(false);
        setRecurringDays([]);
        setEditingBlock(null);
    };

    const openModal = (block?: ScheduleBlock) => {
        if (block) {
            setEditingBlock(block);
            const start = parseISO(block.startTime);
            const end = parseISO(block.endTime);
            setStartDate(format(start, 'yyyy-MM-dd'));
            setStartTime(format(start, 'HH:mm'));
            setEndDate(format(end, 'yyyy-MM-dd'));
            setEndTime(format(end, 'HH:mm'));
            setReason(block.reason);
            setIsRecurring(block.isRecurring);
            setRecurringDays(block.recurringDays || []);
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!startDate || !endDate) {
            setError('Preencha as datas');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const data = {
                startTime: `${startDate}T${startTime}:00Z`,
                endTime: `${endDate}T${endTime}:00Z`,
                reason,
                isRecurring,
                recurringDays: isRecurring ? recurringDays : []
            };

            if (editingBlock) {
                await axiosInstance.put(`/schedule-blocks/${editingBlock.id}`, data);
                setBlocks(prev => prev.map(b => 
                    b.id === editingBlock.id ? { ...b, ...data } : b
                ));
            } else {
                const response = await axiosInstance.post('/schedule-blocks', data);
                setBlocks(prev => [...prev, response.data]);
            }

            setShowModal(false);
            resetForm();
            loadBlocks();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao salvar bloqueio');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este bloqueio?')) return;

        try {
            await axiosInstance.delete(`/schedule-blocks/${id}`);
            setBlocks(prev => prev.filter(b => b.id !== id));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao excluir bloqueio');
        }
    };

    const toggleRecurringDay = (day: string) => {
        setRecurringDays(prev => 
            prev.includes(day) 
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    const weekDays = [
        { value: 'monday', label: 'Seg' },
        { value: 'tuesday', label: 'Ter' },
        { value: 'wednesday', label: 'Qua' },
        { value: 'thursday', label: 'Qui' },
        { value: 'friday', label: 'Sex' },
        { value: 'saturday', label: 'Sáb' },
        { value: 'sunday', label: 'Dom' },
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
                <title>Bloqueios de Agenda | MediSync</title>
            </Head>

            <div className="max-w-4xl mx-auto p-6 space-y-6">
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
                            <CalendarOff className="w-7 h-7 text-cyan-600" />
                            Bloqueios de Agenda
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Gerencie seus horários indisponíveis
                        </p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Bloqueio
                    </button>
                </div>

                {/* Blocks List */}
                {blocks.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <CalendarOff className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Nenhum bloqueio cadastrado
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Adicione bloqueios para indicar quando você não estará disponível.
                        </p>
                        <button
                            onClick={() => openModal()}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Criar Bloqueio
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {blocks.map((block) => (
                            <div
                                key={block.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                            <CalendarOff className="w-6 h-6 text-red-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {block.reason || 'Indisponível'}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {format(parseISO(block.startTime), "dd/MM/yyyy", { locale: ptBR })}
                                                    {block.startTime !== block.endTime && (
                                                        <> - {format(parseISO(block.endTime), "dd/MM/yyyy", { locale: ptBR })}</>
                                                    )}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {format(parseISO(block.startTime), "HH:mm")} - {format(parseISO(block.endTime), "HH:mm")}
                                                </span>
                                            </div>
                                            {block.isRecurring && block.recurringDays && (
                                                <div className="flex gap-1 mt-2">
                                                    {block.recurringDays.map(day => (
                                                        <span key={day} className="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded text-xs">
                                                            {weekDays.find(d => d.value === day)?.label}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openModal(block)}
                                            className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(block.id)}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {editingBlock ? 'Editar Bloqueio' : 'Novo Bloqueio'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 mb-4 flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <span className="text-red-700 dark:text-red-200">{error}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Data Início
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Hora Início
                                        </label>
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Data Fim
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Hora Fim
                                        </label>
                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Motivo
                                    </label>
                                    <input
                                        type="text"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Ex: Férias, Congresso, Feriado..."
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <input
                                        type="checkbox"
                                        id="recurring"
                                        checked={isRecurring}
                                        onChange={(e) => setIsRecurring(e.target.checked)}
                                        className="w-4 h-4 text-cyan-600 rounded"
                                    />
                                    <label htmlFor="recurring" className="text-sm text-gray-700 dark:text-gray-300">
                                        Bloqueio recorrente (repetir semanalmente)
                                    </label>
                                </div>

                                {isRecurring && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Dias da Semana
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {weekDays.map((day) => (
                                                <button
                                                    key={day.value}
                                                    type="button"
                                                    onClick={() => toggleRecurringDay(day.value)}
                                                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                                                        recurringDays.includes(day.value)
                                                            ? 'bg-cyan-600 text-white'
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                    }`}
                                                >
                                                    {day.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            resetForm();
                                        }}
                                        className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white rounded-xl font-medium"
                                    >
                                        {saving ? 'Salvando...' : 'Salvar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
