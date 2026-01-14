import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useQueueWebSocket } from '@/hooks/useQueueWebSocket';
import {
    getWaitingQueue,
    getCurrentlyServing,
    callNextTicket,
    callSpecificTicket,
    startService,
    completeService,
    markNoShow,
    getQueueStats,
    QueueTicket,
    QueueStats,
    getPriorityColor,
    getStatusLabel,
    QUEUE_STATUS
} from '@/api/queue';
import {
    Users,
    Phone,
    Play,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    Loader2,
    Volume2,
    Activity,
    Wifi,
    WifiOff,
    Bell
} from 'lucide-react';

export default function QueuePanelPage() {
    const router = useRouter();
    const { isAuthenticated, role } = useAuthStore();
    const [waitingQueue, setWaitingQueue] = useState<QueueTicket[]>([]);
    const [serving, setServing] = useState<QueueTicket[]>([]);
    const [stats, setStats] = useState<QueueStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [calling, setCalling] = useState(false);
    const [selectedService, setSelectedService] = useState<string>('');
    const [counter, setCounter] = useState<string>('Guichê 1');
    const [newTicketAlert, setNewTicketAlert] = useState(false);

    // WebSocket for real-time updates
    const { isConnected, lastUpdate } = useQueueWebSocket({
        onQueueUpdate: (data) => {
            // Check if there's a new ticket in queue
            if (data.stats.total_waiting > (stats?.total_waiting || 0)) {
                setNewTicketAlert(true);
                playNewTicketSound();
                setTimeout(() => setNewTicketAlert(false), 3000);
            }
            // Update stats from WebSocket
            setStats(data.stats);
        },
        autoReconnect: true
    });

    // Reload data when WebSocket updates
    useEffect(() => {
        if (lastUpdate) {
            loadData();
        }
    }, [lastUpdate]);

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
        
        // Auto-refresh every 10 seconds
        const interval = setInterval(loadData, 10000);
        return () => clearInterval(interval);
    }, [isAuthenticated, role]);

    const loadData = useCallback(async () => {
        try {
            const [queueData, servingData, statsData] = await Promise.all([
                getWaitingQueue(selectedService || undefined),
                getCurrentlyServing(),
                getQueueStats()
            ]);
            setWaitingQueue(queueData || []);
            setServing(servingData || []);
            setStats(statsData);
        } catch (err) {
            console.error('Error loading queue data:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedService]);

    const handleCallNext = async () => {
        if (!counter) {
            alert('Selecione um guichê');
            return;
        }
        setCalling(true);
        try {
            await callNextTicket(counter, selectedService || undefined);
            // Play sound
            playCallSound();
            loadData();
        } catch (err) {
            alert('Nenhum paciente na fila');
        } finally {
            setCalling(false);
        }
    };

    const handleCallSpecific = async (ticket: QueueTicket) => {
        if (!counter) {
            alert('Selecione um guichê');
            return;
        }
        try {
            await callSpecificTicket(ticket.id, counter);
            playCallSound();
            loadData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleStartService = async (ticket: QueueTicket) => {
        try {
            await startService(ticket.id);
            loadData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleComplete = async (ticket: QueueTicket) => {
        try {
            await completeService(ticket.id);
            loadData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleNoShow = async (ticket: QueueTicket) => {
        if (!confirm('Marcar como não compareceu?')) return;
        try {
            await markNoShow(ticket.id);
            loadData();
        } catch (err) {
            console.error(err);
        }
    };

    const playCallSound = () => {
        // Simple beep sound
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQAA');
        audio.play().catch(() => {});
    };

    const playNewTicketSound = () => {
        // Double beep for new ticket
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) {}
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getWaitTime = (createdAt: string) => {
        const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
        if (minutes < 60) return `${minutes}min`;
        return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
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
                <title>Painel de Atendimento | MediSync</title>
            </Head>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Users className="w-7 h-7 text-cyan-600" />
                            Painel de Atendimento
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Gerenciamento de fila de espera
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Connection Status */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                            {isConnected ? (
                                <>
                                    <Wifi className="w-4 h-4 text-emerald-500" />
                                    <span className="text-sm text-emerald-600 dark:text-emerald-400">Ao vivo</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-500">Offline</span>
                                </>
                            )}
                        </div>
                        <select
                            value={counter}
                            onChange={(e) => setCounter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="Guichê 1">Guichê 1</option>
                            <option value="Guichê 2">Guichê 2</option>
                            <option value="Guichê 3">Guichê 3</option>
                            <option value="Consultório 1">Consultório 1</option>
                            <option value="Consultório 2">Consultório 2</option>
                            <option value="Consultório 3">Consultório 3</option>
                            <option value="Sala de Triagem">Sala de Triagem</option>
                        </select>
                        <button
                            onClick={loadData}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Activity className="w-5 h-5 text-blue-600" />
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
                                    <Clock className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {Math.round(stats.avg_wait_time)}min
                                    </p>
                                    <p className="text-sm text-gray-500">Tempo Médio</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* New Ticket Alert */}
                {newTicketAlert && (
                    <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl flex items-center gap-3 animate-pulse">
                        <Bell className="w-6 h-6 text-amber-600" />
                        <span className="font-medium text-amber-800 dark:text-amber-200">
                            Novo paciente entrou na fila!
                        </span>
                    </div>
                )}

                {/* Call Next Button */}
                <div className="mb-6">
                    <button
                        onClick={handleCallNext}
                        disabled={calling || waitingQueue.length === 0}
                        className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold text-lg shadow-lg transition-all"
                    >
                        {calling ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <Volume2 className="w-6 h-6" />
                        )}
                        CHAMAR PRÓXIMO
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Currently Serving */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-600" />
                                Em Atendimento ({serving.length})
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
                            {serving.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    Nenhum atendimento em andamento
                                </div>
                            ) : (
                                serving.map((ticket) => (
                                    <div key={ticket.id} className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-lg font-bold text-lg ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.ticket_number}
                                                </span>
                                                <span className="text-sm text-gray-500">{ticket.counter}</span>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                ticket.status === QUEUE_STATUS.CALLED 
                                                    ? 'bg-amber-100 text-amber-700' 
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {getStatusLabel(ticket.status)}
                                            </span>
                                        </div>
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            {ticket.patient?.full_name || ticket.patient_name || 'Paciente'}
                                        </p>
                                        <p className="text-sm text-gray-500">{ticket.service_type}</p>
                                        <div className="flex items-center gap-2 mt-3">
                                            {ticket.status === QUEUE_STATUS.CALLED && (
                                                <>
                                                    <button
                                                        onClick={() => handleStartService(ticket)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
                                                    >
                                                        <Play className="w-4 h-4" />
                                                        Iniciar
                                                    </button>
                                                    <button
                                                        onClick={() => handleNoShow(ticket)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        Não Compareceu
                                                    </button>
                                                </>
                                            )}
                                            {ticket.status === QUEUE_STATUS.IN_SERVICE && (
                                                <button
                                                    onClick={() => handleComplete(ticket)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Finalizar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Waiting Queue */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/20">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                    Fila de Espera ({waitingQueue.length})
                                </h2>
                                <select
                                    value={selectedService}
                                    onChange={(e) => setSelectedService(e.target.value)}
                                    className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                                >
                                    <option value="">Todos os serviços</option>
                                    <option value="Clínica Geral">Clínica Geral</option>
                                    <option value="Cardiologia">Cardiologia</option>
                                    <option value="Ortopedia">Ortopedia</option>
                                    <option value="Pediatria">Pediatria</option>
                                </select>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
                            {waitingQueue.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    Nenhum paciente na fila
                                </div>
                            ) : (
                                waitingQueue.map((ticket, index) => (
                                    <div key={ticket.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-400 font-mono text-sm w-6">
                                                    #{index + 1}
                                                </span>
                                                <span className={`px-3 py-1 rounded-lg font-bold ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.ticket_number}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleCallSpecific(ticket)}
                                                className="p-2 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded-lg text-cyan-600"
                                                title="Chamar"
                                            >
                                                <Phone className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="ml-9 mt-1">
                                            <p className="text-gray-900 dark:text-white font-medium">
                                                {ticket.patient?.full_name || ticket.patient_name || 'Paciente'}
                                            </p>
                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                <span>{ticket.service_type}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {getWaitTime(ticket.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
