'use client';

import { useEffect, useState } from 'react';
import { useWebSocket, WS_EVENTS } from '@/hooks/useWebSocket';
import { AlertTriangle, X, Shield, Clock, User, MessageSquare } from 'lucide-react';

interface RiskAlert {
    id: string;
    contactId: string;
    contactName: string;
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    category: string;
    message: string;
    timestamp: Date;
    acknowledged: boolean;
}

export function RiskAlertPanel() {
    const [alerts, setAlerts] = useState<RiskAlert[]>([]);
    const [isMinimized, setIsMinimized] = useState(false);
    const { on, off, isConnected } = useWebSocket();

    useEffect(() => {
        if (!isConnected) return;

        const handleRisk = (event: any) => {
            const alert: RiskAlert = {
                id: Date.now().toString(),
                contactId: event.data.alert.contactId,
                contactName: event.data.alert.contactName,
                level: event.data.alert.level,
                category: event.data.alert.category,
                message: event.data.alert.message,
                timestamp: new Date(),
                acknowledged: false
            };

            setAlerts(prev => [alert, ...prev].slice(0, 10));

            // Play alert sound for HIGH and CRITICAL
            if (alert.level === 'HIGH' || alert.level === 'CRITICAL') {
                playAlertSound();
            }
        };

        const handleResolved = (event: any) => {
            setAlerts(prev => prev.filter(a => a.contactId !== event.data.contactId));
        };

        on(WS_EVENTS.RISK_DETECTED, handleRisk);
        on(WS_EVENTS.RISK_RESOLVED, handleResolved);

        return () => {
            off(WS_EVENTS.RISK_DETECTED);
            off(WS_EVENTS.RISK_RESOLVED);
        };
    }, [isConnected, on, off]);

    const acknowledgeAlert = (id: string) => {
        setAlerts(prev =>
            prev.map(a => a.id === id ? { ...a, acknowledged: true } : a)
        );
    };

    const dismissAlert = (id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    const playAlertSound = () => {
        try {
            const audio = new Audio('/alert.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => { });
        } catch (e) { }
    };

    const activeAlerts = alerts.filter(a => !a.acknowledged);
    const criticalCount = activeAlerts.filter(a => a.level === 'CRITICAL').length;
    const highCount = activeAlerts.filter(a => a.level === 'HIGH').length;

    if (activeAlerts.length === 0) return null;

    const getLevelColor = (level: RiskAlert['level']) => {
        switch (level) {
            case 'CRITICAL': return 'border-red-500 bg-red-500/20';
            case 'HIGH': return 'border-orange-500 bg-orange-500/20';
            case 'MEDIUM': return 'border-yellow-500 bg-yellow-500/20';
            case 'LOW': return 'border-blue-500 bg-blue-500/20';
        }
    };

    const getLevelIcon = (level: RiskAlert['level']) => {
        switch (level) {
            case 'CRITICAL': return '🚨';
            case 'HIGH': return '⚠️';
            case 'MEDIUM': return '⚡';
            case 'LOW': return 'ℹ️';
        }
    };

    return (
        <div className={`fixed bottom-4 right-4 z-50 ${isMinimized ? 'w-auto' : 'w-96'}`}>
            {isMinimized ? (
                /* Minimized View */
                <button
                    onClick={() => setIsMinimized(false)}
                    className="flex items-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 rounded-xl shadow-lg animate-pulse"
                >
                    <AlertTriangle className="w-5 h-5 text-white" />
                    <span className="text-white font-bold">{activeAlerts.length} Alerts</span>
                    {criticalCount > 0 && (
                        <span className="px-2 py-0.5 bg-white/20 rounded text-white text-sm">
                            {criticalCount} Critical
                        </span>
                    )}
                </button>
            ) : (
                /* Full Panel */
                <div className="bg-gray-900 border border-red-500/50 rounded-xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-red-500/20 border-b border-red-500/30">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-red-400 animate-pulse" />
                            <span className="text-white font-bold">Risk Alerts</span>
                            <span className="px-2 py-0.5 bg-red-500 rounded-full text-white text-xs">
                                {activeAlerts.length}
                            </span>
                        </div>
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Alerts List */}
                    <div className="max-h-80 overflow-y-auto">
                        {activeAlerts.map(alert => (
                            <div
                                key={alert.id}
                                className={`p-4 border-b border-gray-800 ${getLevelColor(alert.level)}`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{getLevelIcon(alert.level)}</span>
                                        <div>
                                            <span className={`font-bold ${alert.level === 'CRITICAL' ? 'text-red-400' :
                                                    alert.level === 'HIGH' ? 'text-orange-400' :
                                                        alert.level === 'MEDIUM' ? 'text-yellow-400' :
                                                            'text-blue-400'
                                                }`}>
                                                {alert.level}
                                            </span>
                                            <span className="text-gray-500 text-sm ml-2">{alert.category}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => dismissAlert(alert.id)}
                                        className="text-gray-500 hover:text-white"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span className="text-white">{alert.contactName}</span>
                                </div>

                                <p className="text-gray-400 text-sm mb-3">{alert.message}</p>

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 text-xs flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatTime(alert.timestamp)}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => acknowledgeAlert(alert.id)}
                                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
                                        >
                                            Acknowledge
                                        </button>
                                        <button
                                            className="px-3 py-1 bg-purple-500 hover:bg-purple-600 rounded text-white text-sm"
                                        >
                                            Take Over
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

export default RiskAlertPanel;
