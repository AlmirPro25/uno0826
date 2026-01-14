import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/shadcn/Card';
import { Button } from '@/components/ui/shadcn/Button';
import { Alert, AlertDescription } from '@/components/ui/shadcn/Alert';
import { Bell, Check, CheckCheck, Trash2, Calendar, MessageCircle, Star, CreditCard, FileText, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { axiosInstance } from '@/api/axios';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    data?: Record<string, any>;
}

const notificationIcons: Record<string, { icon: React.ReactNode, bg: string }> = {
    appointment: { icon: <Calendar className="w-5 h-5 text-blue-500" />, bg: "bg-blue-500/10" },
    message: { icon: <MessageCircle className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-500/10" },
    review: { icon: <Star className="w-5 h-5 text-amber-500" />, bg: "bg-amber-500/10" },
    payment: { icon: <CreditCard className="w-5 h-5 text-violet-500" />, bg: "bg-violet-500/10" },
    prescription: { icon: <FileText className="w-5 h-5 text-orange-500" />, bg: "bg-orange-500/10" },
    default: { icon: <Bell className="w-5 h-5 text-gray-500" />, bg: "bg-gray-500/10" },
};

// Helper to check auth from localStorage
const checkAuthFromStorage = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
        const storage = localStorage.getItem('auth-storage');
        if (storage) {
            const parsed = JSON.parse(storage);
            const state = parsed.state || parsed;
            return state.isAuthenticated && !!state.token;
        }
    } catch (e) {
        // ignore
    }
    return false;
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [markingAll, setMarkingAll] = useState(false);

    useEffect(() => {
        // Wait a bit for auth to be ready
        const timer = setTimeout(() => {
            if (checkAuthFromStorage()) {
                fetchNotifications();
            } else {
                setLoading(false);
                setError('Você precisa estar logado para ver notificações');
            }
        }, 200);
        
        return () => clearTimeout(timer);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await axiosInstance.get('/notifications');
            setNotifications(response.data?.notifications || response.data || []);
            setError(null);
        } catch (err: any) {
            if (err.response?.status !== 401) {
                setError(err.response?.data?.error || 'Falha ao carregar notificações');
            }
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await axiosInstance.put(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        setMarkingAll(true);
        try {
            await axiosInstance.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Error marking all as read:', err);
        } finally {
            setMarkingAll(false);
        }
    };

    const deleteNotification = async (id: number) => {
        try {
            await axiosInstance.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    if (loading) {
        return (
            <div className="space-y-6 animate-in-fade">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
                    <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
                </div>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-24 w-full bg-card/50 animate-pulse rounded-xl border border-border/50" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in-fade max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">
                        <span className="text-gradient">Notificações</span>
                    </h1>
                    <p className="text-muted-foreground mt-2 flex items-center gap-2">
                        {unreadCount > 0 ? (
                            <>
                                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                                <span className="font-medium text-foreground">{unreadCount}</span> novas notificações
                            </>
                        ) : (
                            <>
                                <CheckCheck className="w-4 h-4 text-emerald-500" />
                                Você está em dia com tudo!
                            </>
                        )}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        onClick={markAllAsRead}
                        disabled={markingAll}
                        variant="outline"
                        className="rounded-full hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
                    >
                        {markingAll ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <CheckCheck className="w-4 h-4 mr-2" />
                        )}
                        Marcar todas como lidas
                    </Button>
                )}
            </div>

            {error && (
                <Alert className="border-destructive/50 bg-destructive/10 backdrop-blur-sm">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive font-medium">{error}</AlertDescription>
                </Alert>
            )}

            {notifications.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center border-dashed border-2 border-border/60">
                    <div className="w-20 h-20 bg-gradient-to-tr from-primary/10 to-blue-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Bell className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Tudo limpo por aqui</h3>
                    <p className="text-muted-foreground">Você não possui notificações pendentes.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {notifications.map((notification, index) => {
                            const iconData = notificationIcons[notification.type] || notificationIcons.default;

                            return (
                                <motion.div
                                    key={notification.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                    layout
                                >
                                    <div className={`
                                        group relative overflow-hidden rounded-xl border transition-all duration-300
                                        ${notification.isRead
                                            ? 'bg-card/30 border-border/40 opacity-70 hover:opacity-100'
                                            : 'glass-card border-primary/20 shadow-md shadow-primary/5 hover:border-primary/40'
                                        }
                                    `}>
                                        {/* Unread Indicator Bar */}
                                        {!notification.isRead && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                        )}

                                        <div className="p-5 pl-6">
                                            <div className="flex items-start gap-4">
                                                <div className={`p-3 rounded-xl ${iconData.bg} shrink-0`}>
                                                    {iconData.icon}
                                                </div>
                                                <div className="flex-1 min-w-0 pt-0.5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="space-y-1">
                                                            <h3 className={`font-semibold text-lg leading-snug ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                                {notification.title}
                                                            </h3>
                                                            <p className="text-muted-foreground/90 leading-relaxed">
                                                                {notification.message}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {!notification.isRead && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => markAsRead(notification.id)}
                                                                    title="Marcar como lida"
                                                                    className="h-8 w-8 rounded-full hover:bg-primary/20 hover:text-primary"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => deleteNotification(notification.id)}
                                                                title="Excluir"
                                                                className="h-8 w-8 rounded-full hover:bg-destructive/20 hover:text-destructive"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs font-medium text-muted-foreground/60 mt-3 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(new Date(notification.createdAt), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
