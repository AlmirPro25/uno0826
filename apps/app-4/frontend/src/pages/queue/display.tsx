import React, { useEffect, useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import { getQueueDisplay, QueueDisplay, QueueTicket, getPriorityColor } from '@/api/queue';
import { Volume2, Clock, Users, Activity, Wifi, WifiOff } from 'lucide-react';
import { useQueueWebSocket } from '@/hooks/useQueueWebSocket';

export default function QueueDisplayPage() {
    const [display, setDisplay] = useState<QueueDisplay | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [lastCalled, setLastCalled] = useState<QueueTicket | null>(null);
    const [showCallAnimation, setShowCallAnimation] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastCalledIdRef = useRef<number | null>(null);

    // WebSocket for real-time updates
    const { isConnected, lastUpdate } = useQueueWebSocket({
        onQueueUpdate: (data) => {
            setDisplay(data);
            
            // Check if there's a new call
            if (data.last_called && data.last_called.id !== lastCalledIdRef.current) {
                lastCalledIdRef.current = data.last_called.id;
                setLastCalled(data.last_called);
                triggerCallAnimation(data.last_called);
            }
        },
        autoReconnect: true
    });

    const loadDisplay = useCallback(async () => {
        try {
            const data = await getQueueDisplay();
            
            // Check if there's a new call
            if (data.last_called && data.last_called.id !== lastCalledIdRef.current) {
                lastCalledIdRef.current = data.last_called.id;
                setLastCalled(data.last_called);
                triggerCallAnimation(data.last_called);
            }
            
            setDisplay(data);
        } catch (err) {
            console.error('Error loading display:', err);
        }
    }, []);

    useEffect(() => {
        loadDisplay();
        
        // Fallback polling only if WebSocket not connected (every 10s instead of 5s)
        const dataInterval = setInterval(() => {
            if (!isConnected) {
                loadDisplay();
            }
        }, 10000);
        
        // Update clock every second
        const clockInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            clearInterval(dataInterval);
            clearInterval(clockInterval);
        };
    }, [loadDisplay, isConnected]);

    const triggerCallAnimation = (ticket: QueueTicket) => {
        setShowCallAnimation(true);
        
        // Play sound
        if (audioRef.current) {
            audioRef.current.play().catch(() => {});
        }

        // Speak the ticket
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(
                `Senha ${ticket.ticket_number.split('').join(' ')}. Dirija-se ao ${ticket.counter}`
            );
            utterance.lang = 'pt-BR';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        }

        // Hide animation after 10 seconds
        setTimeout(() => {
            setShowCallAnimation(false);
        }, 10000);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
            <Head>
                <title>Painel de Chamadas | MediSync</title>
            </Head>

            {/* Audio element for notification sound */}
            <audio ref={audioRef} preload="auto">
                <source src="/sounds/notification.mp3" type="audio/mpeg" />
            </audio>

            {/* Header */}
            <header className="bg-gradient-to-r from-cyan-600 to-blue-600 px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Activity className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">MediSync</h1>
                            <p className="text-cyan-100 text-sm">Sistema de Atendimento</p>
                        </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            {isConnected ? (
                                <span className="flex items-center gap-1 text-sm text-emerald-300">
                                    <Wifi className="w-4 h-4" />
                                    Ao vivo
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-sm text-amber-300">
                                    <WifiOff className="w-4 h-4" />
                                    Reconectando...
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-4xl font-mono font-bold">{formatTime(currentTime)}</p>
                            <p className="text-cyan-100 capitalize">{formatDate(currentTime)}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Call Animation Overlay */}
            {showCallAnimation && lastCalled && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-pulse">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <Volume2 className="w-16 h-16 text-cyan-400 animate-bounce" />
                        </div>
                        <p className="text-3xl text-gray-400 mb-4">CHAMANDO</p>
                        <p className={`text-8xl font-bold mb-6 px-12 py-6 rounded-2xl ${getPriorityColor(lastCalled.priority)}`}>
                            {lastCalled.ticket_number}
                        </p>
                        <p className="text-4xl text-white font-semibold">
                            {lastCalled.counter}
                        </p>
                        <p className="text-2xl text-gray-400 mt-4">
                            {lastCalled.patient?.full_name || lastCalled.patient_name || 'Paciente'}
                        </p>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="p-8">
                <div className="grid grid-cols-3 gap-8 h-[calc(100vh-180px)]">
                    {/* Current Calls - Large Section */}
                    <div className="col-span-2 bg-gray-800/50 rounded-3xl border border-gray-700 overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 px-6 py-4">
                            <h2 className="text-xl font-bold flex items-center gap-3">
                                <Volume2 className="w-6 h-6" />
                                EM ATENDIMENTO
                            </h2>
                        </div>
                        <div className="p-6">
                            {display?.current_tickets && display.current_tickets.length > 0 ? (
                                <div className="grid grid-cols-2 gap-6">
                                    {display.current_tickets.map((ticket) => (
                                        <div
                                            key={ticket.id}
                                            className="bg-gray-700/50 rounded-2xl p-6 border border-gray-600"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <span className={`text-4xl font-bold px-6 py-3 rounded-xl ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.ticket_number}
                                                </span>
                                            </div>
                                            <p className="text-2xl font-semibold text-white mb-2">
                                                {ticket.counter}
                                            </p>
                                            <p className="text-gray-400">
                                                {ticket.service_type}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-64 text-gray-500">
                                    <p className="text-xl">Nenhum atendimento em andamento</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-400 mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                FILA DE ESPERA
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-amber-500/20 rounded-xl p-4 text-center">
                                    <p className="text-4xl font-bold text-amber-400">
                                        {display?.stats.total_waiting || 0}
                                    </p>
                                    <p className="text-sm text-amber-200">Aguardando</p>
                                </div>
                                <div className="bg-cyan-500/20 rounded-xl p-4 text-center">
                                    <p className="text-4xl font-bold text-cyan-400">
                                        {Math.round(display?.stats.avg_wait_time || 0)}min
                                    </p>
                                    <p className="text-sm text-cyan-200">Tempo Médio</p>
                                </div>
                            </div>
                        </div>

                        {/* Next in Queue */}
                        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden flex-1">
                            <div className="bg-amber-600/20 px-6 py-3 border-b border-gray-700">
                                <h3 className="font-semibold text-amber-400 flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    PRÓXIMOS
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-700">
                                {display?.next_tickets && display.next_tickets.length > 0 ? (
                                    display.next_tickets.slice(0, 5).map((ticket, index) => (
                                        <div key={ticket.id} className="px-6 py-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <span className="text-gray-500 font-mono">#{index + 1}</span>
                                                <span className={`px-3 py-1 rounded-lg font-bold ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.ticket_number}
                                                </span>
                                            </div>
                                            <span className="text-gray-400 text-sm">
                                                {ticket.service_type}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-6 py-8 text-center text-gray-500">
                                        Fila vazia
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Priority Legend */}
                        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-4">
                            <h3 className="text-sm font-semibold text-gray-400 mb-3">PRIORIDADES</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded bg-red-500"></span>
                                    <span>Emergência</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded bg-orange-500"></span>
                                    <span>Muito Urgente</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded bg-yellow-500"></span>
                                    <span>Urgente</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded bg-green-500"></span>
                                    <span>Pouco Urgente</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded bg-blue-500"></span>
                                    <span>Não Urgente</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
