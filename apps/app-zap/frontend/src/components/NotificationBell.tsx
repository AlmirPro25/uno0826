'use client';

import { useEffect, useState } from 'react';
import { useWebSocket, WS_EVENTS } from '@/hooks/useWebSocket';
import {
    Bell, X, MessageSquare, AlertTriangle, TrendingUp,
    User, Zap, CheckCircle, Info
} from 'lucide-react';

interface Notification {
    id: string;
    type: 'message' | 'alert' | 'success' | 'info' | 'conversion';
    title: string;
    body: string;
    timestamp: Date;
    read: boolean;
    data?: any;
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { on, off, isConnected } = useWebSocket();

    useEffect(() => {
        if (!isConnected) return;

        // Listen to message events
        const handleMessage = (event: any) => {
            addNotification({
                type: 'message',
                title: 'Nova mensagem',
                body: `${event.data.contactId}: ${event.data.message.body.substring(0, 50)}...`,
                data: event.data
            });
        };

        // Listen to risk events
        const handleRisk = (event: any) => {
            addNotification({
                type: 'alert',
                title: `⚠️ Risco ${event.data.alert.level}`,
                body: `${event.data.alert.contactName}: ${event.data.alert.message}`,
                data: event.data
            });
        };

        // Listen to conversion events
        const handleConversion = (event: any) => {
            addNotification({
                type: 'conversion',
                title: '🎉 Conversão!',
                body: `${event.data.conversion.contactName} converteu!`,
                data: event.data
            });
        };

        // Listen to lead score updates
        const handleLeadScore = (event: any) => {
            if (event.data.lead.newScore >= 85) {
                addNotification({
                    type: 'success',
                    title: '💎 Lead Diamond!',
                    body: `${event.data.lead.contactName} agora é Diamond (${event.data.lead.newScore}%)`,
                    data: event.data
                });
            }
        };

        on(WS_EVENTS.MESSAGE_RECEIVED, handleMessage);
        on(WS_EVENTS.RISK_DETECTED, handleRisk);
        on(WS_EVENTS.CONVERSION, handleConversion);
        on(WS_EVENTS.LEAD_SCORE_UPDATED, handleLeadScore);

        return () => {
            off(WS_EVENTS.MESSAGE_RECEIVED, handleMessage);
            off(WS_EVENTS.RISK_DETECTED, handleRisk);
            off(WS_EVENTS.CONVERSION, handleConversion);
            off(WS_EVENTS.LEAD_SCORE_UPDATED, handleLeadScore);
        };
    }, [isConnected, on, off]);

    const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotif: Notification = {
            ...notif,
            id: Date.now().toString(),
            timestamp: new Date(),
            read: false
        };

        setNotifications(prev => [newNotif, ...prev].slice(0, 50));
        setUnreadCount(prev => prev + 1);

        // Play sound for alerts
        if (notif.type === 'alert' || notif.type === 'conversion') {
            playNotificationSound();
        }
    };

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const clearAll = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    const playNotificationSound = () => {
        // Browser notification sound
        try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => { });
        } catch (e) { }
    };

    return {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        isConnected
    };
}

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, isConnected } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'message': return MessageSquare;
            case 'alert': return AlertTriangle;
            case 'success': return CheckCircle;
            case 'conversion': return TrendingUp;
            default: return Info;
        }
    };

    const getColor = (type: Notification['type']) => {
        switch (type) {
            case 'message': return 'text-blue-400';
            case 'alert': return 'text-red-400';
            case 'success': return 'text-green-400';
            case 'conversion': return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
                <Bell className={`w-6 h-6 ${isConnected ? 'text-white' : 'text-gray-500'}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
                {/* Connection indicator */}
                <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-12 w-80 max-h-96 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h3 className="text-white font-semibold">Notifications</h3>
                            <div className="flex gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-purple-400 text-sm hover:underline"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        className="text-gray-500 text-sm hover:text-red-400"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-72 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map(notif => {
                                    const Icon = getIcon(notif.type);
                                    return (
                                        <div
                                            key={notif.id}
                                            onClick={() => markAsRead(notif.id)}
                                            className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-white/5 transition-colors ${!notif.read ? 'bg-purple-500/10' : ''
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Icon className={`w-5 h-5 mt-0.5 ${getColor(notif.type)}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-white font-medium text-sm truncate">
                                                            {notif.title}
                                                        </span>
                                                        {!notif.read && (
                                                            <span className="w-2 h-2 bg-purple-500 rounded-full" />
                                                        )}
                                                    </div>
                                                    <p className="text-gray-400 text-sm truncate">{notif.body}</p>
                                                    <p className="text-gray-600 text-xs mt-1">
                                                        {formatTime(notif.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-gray-700 bg-black/50">
                            <div className="flex items-center justify-center gap-2 text-sm">
                                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'
                                    }`} />
                                <span className={isConnected ? 'text-green-400' : 'text-gray-500'}>
                                    {isConnected ? 'Real-time connected' : 'Disconnected'}
                                </span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
}

export default NotificationBell;
