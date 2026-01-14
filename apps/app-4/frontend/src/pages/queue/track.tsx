import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getTicketByNumber, getQueueDisplay, QueueTicket, QueueDisplay, getPriorityColor, getStatusLabel, QUEUE_STATUS } from '@/api/queue';
import { useQueueWebSocket } from '@/hooks/useQueueWebSocket';
import {
    Ticket, Clock, MapPin, Users, CheckCircle,
    AlertCircle, Loader2, RefreshCw, Volume2,
    ArrowLeft, Bell, Wifi, WifiOff
} from 'lucide-react';

export default function TrackQueuePage() {
    const router = useRouter();
    const { ticket: ticketNumber } = router.query;
    
    const [ticket, setTicket] = useState<QueueTicket | null>(null);
    const [display, setDisplay] = useState<QueueDisplay | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [position, setPosition] = useState<number | null>(null);
    const [isCalled, setIsCalled] = useState(false);

    // WebSocket for real-time updates
    const { isConnected, lastUpdate } = useQueueWebSocket({
        onQueueUpdate: (data) => {
            setDisplay(data);
            updatePosition(data);
            
            // Check if our ticket was called
            if (ticket && data.last_called?.id === ticket.id) {
                setIsCalled(true);
                playNotificationSound();
                speakCall(data.last_called);
            }
        },
        onTicketCalled: (calledTicket) => {
            if (ticket && calledTicket.id === ticket.id) {
                setTicket(calledTicket);
                setIsCalled(true);
            }
        }
    });

    const loadData = useCallback(async () => {
        if (!ticketNumber || typeof ticketNumber !== 'string') return;
        
        try {
            setLoading(true);
            const [ticketData, displayData] = await Promise.all([
                getTicketByNumber(ticketNumber),
                getQueueDisplay()
            ]);
            
            setTicket(ticketData);
            setDisplay(displayData);
            updatePosition(displayData, ticketData);
            
            // Check if already called
            if (ticketData.status === QUEUE_STATUS.CALLED || ticketData.status === QUEUE_STATUS.IN_SERVICE) {
                setIsCalled(true);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Senha não encontrada');
        } finally {
            setLoading(false);
        }
    }, [ticketNumber]);

    const updatePosition = (displayData: QueueDisplay, currentTicket?: QueueTicket) => {
        const t = currentTicket || ticket;
        if (!t || !displayData.next_tickets) return;
        
        const idx = displayData.next_tickets.findIndex(nt => nt.id === t.id);
        setPosition(idx >= 0 ? idx + 1 : null);
    };

    useEffect(() => {
        loadData();
        
        // Fallback polling if WebSocket not connected
        const interval = setInterval(() => {
            if (!isConnected) {
                loadData();
            }
        }, 10000);
        
        return () => clearInterval(interval);
    }, [loadData, isConnected]);

    // Update position when lastUpdate changes
    useEffect(() => {
        if (lastUpdate && ticket) {
            updatePosition(lastUpdate, ticket);
        }
    }, [lastUpdate, ticket]);

    const playNotificationSound = () => {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(() => {
            // Fallback beep
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.connect(ctx.destination);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.5);
        });
    };

    const speakCall = (calledTicket: QueueTicket) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(
                `Atenção! Sua senha ${calledTicket.ticket_number.split('').join(' ')} foi chamada. Dirija-se ao ${calledTicket.counter}`
            );
            utterance.lang = 'pt-BR';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        }
    };

    const getEstimatedWait = () => {
        if (!ticket || !display?.stats.estimated_wait) return null;
        return display.stats.estimated_wait[ticket.priority] || null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Senha não encontrada
                </h1>
                <p className="text-gray-500 mb-6">{error}</p>
                <Link href="/queue/join" className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-medium">
                    Retirar Nova Senha
                </Link>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Acompanhar Senha {ticket.ticket_number} | MediSync</title>
            </Head>

            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="max-w-lg mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <Link href="/queue/join" className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg">
                            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </Link>
                        <div className="flex items-center gap-2">
                            {isConnected ? (
                                <span className="flex items-center gap-1 text-sm text-emerald-600">
                                    <Wifi className="w-4 h-4" />
                                    Ao vivo
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-sm text-gray-500">
                                    <WifiOff className="w-4 h-4" />
                                    Offline
                                </span>
                            )}
                            <button onClick={loadData} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg">
                                <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Called Alert */}
                    {isCalled && (
                        <div className="mb-6 p-6 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl text-white animate-pulse">
                            <div className="flex items-center gap-4">
                                <Volume2 className="w-12 h-12" />
                                <div>
                                    <h2 className="text-2xl font-bold">SUA VEZ!</h2>
                                    <p className="text-emerald-100">
                                        Dirija-se ao {ticket.counter || 'guichê indicado'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Ticket Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden mb-6">
                        <div className={`${getPriorityColor(ticket.priority)} px-6 py-8 text-center`}>
                            <p className="text-white/80 text-sm uppercase tracking-wider mb-2">Sua Senha</p>
                            <p className="text-6xl font-black text-white tracking-wider">
                                {ticket.ticket_number}
                            </p>
                        </div>

                        <div className="p-6">
                            {/* Status */}
                            <div className="flex items-center justify-center gap-2 mb-6">
                                <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                                    ticket.status === QUEUE_STATUS.WAITING ? 'bg-amber-100 text-amber-700' :
                                    ticket.status === QUEUE_STATUS.CALLED ? 'bg-emerald-100 text-emerald-700' :
                                    ticket.status === QUEUE_STATUS.IN_SERVICE ? 'bg-blue-100 text-blue-700' :
                                    ticket.status === QUEUE_STATUS.COMPLETED ? 'bg-gray-100 text-gray-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {getStatusLabel(ticket.status)}
                                </span>
                            </div>

                            {/* Position */}
                            {ticket.status === QUEUE_STATUS.WAITING && position && (
                                <div className="text-center mb-6">
                                    <p className="text-gray-500 text-sm">Posição na fila</p>
                                    <p className="text-5xl font-bold text-gray-900 dark:text-white">
                                        {position}º
                                    </p>
                                    {position === 1 && (
                                        <p className="text-emerald-600 font-medium mt-2">
                                            Você é o próximo!
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <Clock className="w-5 h-5 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">Tempo estimado</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                        {getEstimatedWait() ? `~${getEstimatedWait()} min` : '--'}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <Users className="w-5 h-5 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">Na fila</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                        {display?.stats.total_waiting || 0} pessoas
                                    </p>
                                </div>
                            </div>

                            {/* Counter */}
                            {ticket.counter && (
                                <div className="mt-4 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-5 h-5 text-cyan-600" />
                                        <div>
                                            <p className="text-sm text-cyan-600">Local de atendimento</p>
                                            <p className="font-bold text-cyan-700 dark:text-cyan-400">
                                                {ticket.counter}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Queue Preview */}
                    {display?.next_tickets && display.next_tickets.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <Users className="w-5 h-5 text-gray-400" />
                                Próximos na fila
                            </h3>
                            <div className="space-y-2">
                                {display.next_tickets.slice(0, 5).map((t, idx) => (
                                    <div 
                                        key={t.id} 
                                        className={`flex items-center justify-between p-3 rounded-lg ${
                                            t.id === ticket.id 
                                                ? 'bg-cyan-50 dark:bg-cyan-900/20 border-2 border-cyan-500' 
                                                : 'bg-gray-50 dark:bg-gray-700/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-400 font-mono text-sm w-6">
                                                #{idx + 1}
                                            </span>
                                            <span className={`px-2 py-1 rounded font-bold text-sm ${getPriorityColor(t.priority)}`}>
                                                {t.ticket_number}
                                            </span>
                                        </div>
                                        {t.id === ticket.id && (
                                            <span className="text-xs text-cyan-600 font-medium">Você</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* View Display Link */}
                    <div className="mt-6 text-center">
                        <Link 
                            href="/queue/display" 
                            className="text-cyan-600 hover:underline text-sm"
                        >
                            Ver painel de chamadas completo
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
