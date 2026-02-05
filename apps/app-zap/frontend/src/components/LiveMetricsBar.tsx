'use client';

import { useEffect, useState } from 'react';
import { useWebSocket, WS_EVENTS } from '@/hooks/useWebSocket';
import { Activity, Users, MessageSquare, Bot, TrendingUp } from 'lucide-react';

interface LiveMetrics {
    messagesReceived: number;
    messagesSent: number;
    activeContacts: number;
    aiResponseRate: number;
    conversions: number;
}

export function LiveMetricsBar() {
    const [metrics, setMetrics] = useState<LiveMetrics>({
        messagesReceived: 0,
        messagesSent: 0,
        activeContacts: 0,
        aiResponseRate: 0,
        conversions: 0
    });
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const { on, off, isConnected } = useWebSocket();

    useEffect(() => {
        if (!isConnected) return;

        const handleMetricsUpdate = (event: any) => {
            setMetrics(event.data.metrics);
            setLastUpdate(new Date());
        };

        const handleMessage = () => {
            setMetrics(prev => ({
                ...prev,
                messagesReceived: prev.messagesReceived + 1
            }));
        };

        const handleMessageSent = () => {
            setMetrics(prev => ({
                ...prev,
                messagesSent: prev.messagesSent + 1
            }));
        };

        const handleConversion = () => {
            setMetrics(prev => ({
                ...prev,
                conversions: prev.conversions + 1
            }));
        };

        on(WS_EVENTS.METRICS_UPDATE, handleMetricsUpdate);
        on(WS_EVENTS.MESSAGE_RECEIVED, handleMessage);
        on(WS_EVENTS.MESSAGE_SENT, handleMessageSent);
        on(WS_EVENTS.CONVERSION, handleConversion);

        return () => {
            off(WS_EVENTS.METRICS_UPDATE);
            off(WS_EVENTS.MESSAGE_RECEIVED, handleMessage);
            off(WS_EVENTS.MESSAGE_SENT, handleMessageSent);
            off(WS_EVENTS.CONVERSION);
        };
    }, [isConnected, on, off]);

    return (
        <div className="bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Activity className={`w-5 h-5 ${isConnected ? 'text-green-400 animate-pulse' : 'text-gray-500'}`} />
                    <span className="text-white font-medium">Live Metrics</span>
                </div>
                {lastUpdate && (
                    <span className="text-gray-500 text-sm">
                        Updated {formatTime(lastUpdate)}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-5 gap-4">
                <MetricItem
                    icon={MessageSquare}
                    label="Received"
                    value={metrics.messagesReceived}
                    color="blue"
                />
                <MetricItem
                    icon={MessageSquare}
                    label="Sent"
                    value={metrics.messagesSent}
                    color="green"
                />
                <MetricItem
                    icon={Users}
                    label="Active"
                    value={metrics.activeContacts}
                    color="purple"
                />
                <MetricItem
                    icon={Bot}
                    label="AI Rate"
                    value={`${metrics.aiResponseRate}%`}
                    color="cyan"
                />
                <MetricItem
                    icon={TrendingUp}
                    label="Conversions"
                    value={metrics.conversions}
                    color="yellow"
                />
            </div>

            {/* Connection status */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                    }`} />
                <span className={isConnected ? 'text-green-400' : 'text-gray-500'}>
                    {isConnected ? 'Real-time updates active' : 'Connecting...'}
                </span>
            </div>
        </div>
    );
}

function MetricItem({ icon: Icon, label, value, color }: {
    icon: any;
    label: string;
    value: number | string;
    color: string;
}) {
    return (
        <div className="text-center">
            <div className={`w-10 h-10 mx-auto rounded-lg bg-${color}-500/20 flex items-center justify-center mb-2`}>
                <Icon className={`w-5 h-5 text-${color}-400`} />
            </div>
            <div className="text-white font-bold text-xl">{value}</div>
            <div className="text-gray-500 text-xs">{label}</div>
        </div>
    );
}

function formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return date.toLocaleTimeString();
}

export default LiveMetricsBar;
