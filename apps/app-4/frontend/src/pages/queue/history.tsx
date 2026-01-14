import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { getTodayTickets, getQueueStats, QueueTicket, QueueStats, getPriorityColor, getStatusLabel, QUEUE_STATUS } from '@/api/queue';
import {
    History, Clock, CheckCircle, Users,
    Loader2, Download, Filter, Calendar, TrendingUp,
    Activity
} from 'lucide-react';

export default function QueueHistoryPage() {
    const router = useRouter();
    const { isAuthenticated, role } = useAuthStore();
    const [tickets, setTickets] = useState<QueueTicket[]>([]);
    const [stats, setStats] = useState<QueueStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        if (role !== 'ADMIN' && role !== 'MEDICO') {
            router.push('/dashboard');
            return;
        }
        loadData();
    }, [isAuthenticated, role]);

    const loadData = async () => {
        try {
            const [ticketsData, statsData] = await Promise.all([
                getTodayTickets(),
                getQueueStats()
            ]);
            setTickets(ticketsData || []);
            setStats(statsData);
        } catch (err) {
            console.error('Error loading history:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredTickets = tickets.filter(t => {
        if (filter === 'all') return true;
        return t.status === filter;
    });

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getServiceDuration = (ticket: QueueTicket) => {
        if (!ticket.started_at || !ticket.completed_at) return '--';
        const start = new Date(ticket.started_at).getTime();
        const end = new Date(ticket.completed_at).getTime();
        const minutes = Math.round((end - start) / 60000);
        return `${minutes} min`;
    };

    const exportToCSV = () => {
        const headers = ['Senha', 'Paciente', 'Prioridade', 'Serviço', 'Status', 'Criado', 'Chamado', 'Iniciado', 'Concluído', 'Tempo Espera', 'Tempo Atendimento'];
        const rows = filteredTickets.map(t => [
            t.ticket_number,
            t.patient?.full_name || t.patient_name || 'N/A',
            t.priority,
            t.service_type,
            getStatusLabel(t.status),
            formatTime(t.created_at),
            t.called_at ? formatTime(t.called_at) : '',
            t.started_at ? formatTime(t.started_at) : '',
            t.completed_at ? formatTime(t.completed_at) : '',
            `${t.actual_wait || 0} min`,
            getServiceDuration(t)
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fila-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Histórico de Atendimentos | MediSync</title>
            </Head>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <History className="w-7 h-7 text-cyan-600" />
                            Histórico de Atendimentos
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
                    >
                        <Download className="w-5 h-5" />
                        Exportar CSV
                    </button>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {tickets.length}
                                    </p>
                                    <p className="text-sm text-gray-500">Total</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {stats.total_waiting}
                                    </p>
                                    <p className="text-sm text-gray-500">Aguardando</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                                    <Activity className="w-5 h-5 text-cyan-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {stats.total_in_service}
                                    </p>
                                    <p className="text-sm text-gray-500">Em Atendimento</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {stats.total_completed}
                                    </p>
                                    <p className="text-sm text-gray-500">Concluídos</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {Math.round(stats.avg_wait_time)} min
                                    </p>
                                    <p className="text-sm text-gray-500">Tempo Médio</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter */}
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="all">Todos os status</option>
                        <option value={QUEUE_STATUS.WAITING}>Aguardando</option>
                        <option value={QUEUE_STATUS.CALLED}>Chamados</option>
                        <option value={QUEUE_STATUS.IN_SERVICE}>Em Atendimento</option>
                        <option value={QUEUE_STATUS.COMPLETED}>Concluídos</option>
                        <option value={QUEUE_STATUS.NO_SHOW}>Não Compareceu</option>
                    </select>
                    <span className="text-sm text-gray-500">
                        {filteredTickets.length} registro(s)
                    </span>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Senha</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridade</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serviço</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horários</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Espera</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredTickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                            Nenhum atendimento encontrado
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTickets.map((ticket) => (
                                        <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded font-bold text-sm ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.ticket_number}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-900 dark:text-white">
                                                {ticket.patient?.full_name || ticket.patient_name || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {ticket.priority}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {ticket.service_type}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    ticket.status === QUEUE_STATUS.COMPLETED ? 'bg-emerald-100 text-emerald-700' :
                                                    ticket.status === QUEUE_STATUS.IN_SERVICE ? 'bg-blue-100 text-blue-700' :
                                                    ticket.status === QUEUE_STATUS.CALLED ? 'bg-amber-100 text-amber-700' :
                                                    ticket.status === QUEUE_STATUS.NO_SHOW ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {getStatusLabel(ticket.status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500">
                                                <div>Criado: {formatTime(ticket.created_at)}</div>
                                                {ticket.called_at && <div>Chamado: {formatTime(ticket.called_at)}</div>}
                                                {ticket.completed_at && <div>Concluído: {formatTime(ticket.completed_at)}</div>}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {ticket.actual_wait ? `${ticket.actual_wait} min` : '--'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
