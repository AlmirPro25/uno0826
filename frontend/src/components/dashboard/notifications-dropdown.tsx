"use client";

import { useState, useEffect } from "react";
import { 
    Bell, AlertTriangle, Zap, Shield, Ghost, 
    CreditCard, Server, CheckCircle2, X, Loader2
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    severity: string;
    read: boolean;
    created_at: string;
}

const typeConfig: Record<string, { icon: typeof Bell; color: string }> = {
    deploy_failed: { icon: Server, color: "text-rose-400" },
    container_crash: { icon: AlertTriangle, color: "text-rose-400" },
    health_check_failed: { icon: AlertTriangle, color: "text-amber-400" },
    rule_triggered: { icon: Zap, color: "text-purple-400" },
    approval_required: { icon: Shield, color: "text-amber-400" },
    kill_switch_active: { icon: AlertTriangle, color: "text-rose-400" },
    shadow_mode_changed: { icon: Ghost, color: "text-violet-400" },
    billing_alert: { icon: CreditCard, color: "text-amber-400" },
    resource_limit: { icon: Server, color: "text-amber-400" },
};

export function NotificationsDropdown() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const [notifRes, countRes] = await Promise.all([
                api.get("/notifications/unread"),
                api.get("/notifications/count")
            ]);
            setNotifications(notifRes.data.notifications || []);
            setUnreadCount(countRes.data.count || 0);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
            // Mock data for dev
            setNotifications([
                {
                    id: "1",
                    type: "rule_triggered",
                    title: "Regra Disparada",
                    message: "Regra 'Alerta de Bounce Alto' foi disparada",
                    severity: "info",
                    read: false,
                    created_at: new Date(Date.now() - 300000).toISOString()
                },
                {
                    id: "2",
                    type: "approval_required",
                    title: "Aprovação Necessária",
                    message: "Ação 'delete_user' requer sua aprovação",
                    severity: "warning",
                    read: false,
                    created_at: new Date(Date.now() - 600000).toISOString()
                }
            ]);
            setUnreadCount(2);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post("/notifications/read-all");
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMin / 60);
        
        if (diffMin < 1) return "agora";
        if (diffMin < 60) return `${diffMin}min`;
        if (diffHour < 24) return `${diffHour}h`;
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={cn(
                    "relative p-2 rounded-xl transition-colors",
                    open ? "bg-white/10" : "hover:bg-white/5"
                )}
            >
                <Bell className="w-5 h-5 text-slate-400" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <div 
                            className="fixed inset-0 z-40"
                            onClick={() => setOpen(false)}
                        />
                        
                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-80 bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                <h3 className="font-bold text-white text-sm">Notificações</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-indigo-400 hover:text-indigo-300"
                                    >
                                        Marcar todas como lidas
                                    </button>
                                )}
                            </div>

                            {/* Content */}
                            <div className="max-h-80 overflow-y-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="text-center py-8">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500">Tudo em dia!</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {notifications.map((notif) => {
                                            const config = typeConfig[notif.type] || { icon: Bell, color: "text-slate-400" };
                                            const Icon = config.icon;
                                            
                                            return (
                                                <div
                                                    key={notif.id}
                                                    className="px-4 py-3 hover:bg-white/[0.02] transition-colors group"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                                            notif.severity === "critical" && "bg-rose-500/20",
                                                            notif.severity === "error" && "bg-rose-500/20",
                                                            notif.severity === "warning" && "bg-amber-500/20",
                                                            notif.severity === "info" && "bg-indigo-500/20"
                                                        )}>
                                                            <Icon className={cn("w-4 h-4", config.color)} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-white truncate">
                                                                {notif.title}
                                                            </p>
                                                            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                                                                {notif.message}
                                                            </p>
                                                            <p className="text-[10px] text-slate-600 mt-1">
                                                                {formatTime(notif.created_at)}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => markAsRead(notif.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                                                        >
                                                            <X className="w-3 h-3 text-slate-500" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="px-4 py-2 border-t border-white/5">
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 py-1"
                                    >
                                        Ver todas
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
