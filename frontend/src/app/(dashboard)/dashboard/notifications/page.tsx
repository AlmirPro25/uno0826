"use client";

import { useState, useEffect, useCallback } from "react";
import { 
    Bell, AlertTriangle, Zap, Shield, Ghost, CreditCard, Server,
    CheckCircle2, RefreshCw, Loader2
} from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Notification {
    id: string;
    app_id: string;
    type: string;
    title: string;
    message: string;
    severity: string;
    read: boolean;
    created_at: string;
}

const typeConfig: Record<string, { icon: typeof Bell; color: string; label: string }> = {
    deploy_failed: { icon: Server, color: "text-rose-400", label: "Deploy" },
    container_crash: { icon: AlertTriangle, color: "text-rose-400", label: "Crash" },
    health_check_failed: { icon: AlertTriangle, color: "text-amber-400", label: "Health" },
    rule_triggered: { icon: Zap, color: "text-purple-400", label: "Regra" },
    approval_required: { icon: Shield, color: "text-amber-400", label: "Aprovação" },
    kill_switch_active: { icon: AlertTriangle, color: "text-rose-400", label: "Kill Switch" },
    shadow_mode_changed: { icon: Ghost, color: "text-violet-400", label: "Shadow" },
    billing_alert: { icon: CreditCard, color: "text-amber-400", label: "Billing" },
    resource_limit: { icon: Server, color: "text-amber-400", label: "Recurso" },
};

const severityConfig = {
    critical: { color: "bg-rose-500/10 border-rose-500/20 text-rose-400" },
    error: { color: "bg-rose-500/10 border-rose-500/20 text-rose-400" },
    warning: { color: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
    info: { color: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" },
};

export default function NotificationsPage() {
    const { activeApp } = useApp();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");

    const fetchNotifications = useCallback(async () => {
        if (!activeApp) return;
        setLoading(true);
        try {
            const res = await api.get(`/notifications?app_id=${activeApp.id}`);
            setNotifications(res.data.notifications || []);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
            // Mock data
            setNotifications([
                {
                    id: "1",
                    app_id: activeApp.id,
                    type: "rule_triggered",
                    title: "Regra Disparada",
                    message: "Regra 'Alerta de Bounce Alto' foi disparada e executou ação: alert",
                    severity: "info",
                    read: false,
                    created_at: new Date(Date.now() - 300000).toISOString()
                },
                {
                    id: "2",
                    app_id: activeApp.id,
                    type: "approval_required",
                    title: "Aprovação Necessária",
                    message: "Ação 'delete_user' requer sua aprovação: Exclusão de usuário inativo",
                    severity: "warning",
                    read: false,
                    created_at: new Date(Date.now() - 600000).toISOString()
                },
                {
                    id: "3",
                    app_id: activeApp.id,
                    type: "deploy_failed",
                    title: "Deploy Falhou",
                    message: "Deploy do app falhou na fase de build: npm install failed",
                    severity: "error",
                    read: true,
                    created_at: new Date(Date.now() - 3600000).toISOString()
                },
                {
                    id: "4",
                    app_id: activeApp.id,
                    type: "shadow_mode_changed",
                    title: "Shadow Mode ativado",
                    message: "Shadow mode foi ativado: Teste de novas regras",
                    severity: "info",
                    read: true,
                    created_at: new Date(Date.now() - 7200000).toISOString()
                }
            ]);
        } finally {
            setLoading(false);
        }
    }, [activeApp]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAsRead = async (id: string) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => 
                n.id === id ? { ...n, read: true } : n
            ));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post("/notifications/read-all");
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMin / 60);
        
        if (diffMin < 1) return "agora";
        if (diffMin < 60) return `${diffMin} min atrás`;
        if (diffHour < 24) return `${diffHour}h atrás`;
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === "unread" && n.read) return false;
        if (typeFilter !== "all" && n.type !== typeFilter) return false;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.read).length;
    const uniqueTypes = [...new Set(notifications.map(n => n.type))];

    return (
        <div className="min-h-screen bg-[#030712]">
            <div className="p-6 pb-0">
                <AppHeader />
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-white">Notificações</h1>
                        <p className="text-sm text-slate-500">
                            {unreadCount > 0 ? `${unreadCount} não lidas` : "Todas lidas"}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="px-3 py-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                Marcar todas como lidas
                            </button>
                        )}
                        <button 
                            onClick={fetchNotifications}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Filters */}
                <div className="flex items-center gap-4">
                    <div className="flex rounded-xl border border-white/10 overflow-hidden">
                        <button
                            onClick={() => setFilter("all")}
                            className={cn(
                                "px-4 py-2 text-xs font-bold uppercase transition-colors",
                                filter === "all"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white/[0.02] text-slate-400 hover:text-white"
                            )}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => setFilter("unread")}
                            className={cn(
                                "px-4 py-2 text-xs font-bold uppercase transition-colors",
                                filter === "unread"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white/[0.02] text-slate-400 hover:text-white"
                            )}
                        >
                            Não lidas
                        </button>
                    </div>

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="h-9 px-3 rounded-xl bg-white/[0.02] border border-white/10 text-white text-xs focus:border-indigo-500/50 outline-none"
                    >
                        <option value="all">Todos os tipos</option>
                        {uniqueTypes.map(type => (
                            <option key={type} value={type}>
                                {typeConfig[type]?.label || type}
                            </option>
                        ))}
                    </select>
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-20">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mx-auto mb-4" />
                        <p className="text-slate-500">
                            {filter === "unread" ? "Nenhuma notificação não lida" : "Nenhuma notificação"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNotifications.map((notif, i) => {
                            const config = typeConfig[notif.type] || { icon: Bell, color: "text-slate-400", label: notif.type };
                            const severity = severityConfig[notif.severity as keyof typeof severityConfig] || severityConfig.info;
                            const Icon = config.icon;
                            
                            return (
                                <motion.div
                                    key={notif.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={cn(
                                        "p-4 rounded-2xl border transition-all",
                                        notif.read 
                                            ? "bg-white/[0.01] border-white/5 opacity-60" 
                                            : severity.color
                                    )}
                                    onClick={() => !notif.read && markAsRead(notif.id)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                                            notif.read ? "bg-slate-500/10" : "bg-white/10"
                                        )}>
                                            <Icon className={cn("w-5 h-5", notif.read ? "text-slate-500" : config.color)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className={cn(
                                                    "font-bold",
                                                    notif.read ? "text-slate-400" : "text-white"
                                                )}>
                                                    {notif.title}
                                                </h3>
                                                {!notif.read && (
                                                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                                                )}
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                    notif.read ? "bg-slate-500/10 text-slate-500" : "bg-white/10"
                                                )}>
                                                    {config.label}
                                                </span>
                                            </div>
                                            <p className={cn(
                                                "text-sm",
                                                notif.read ? "text-slate-500" : "text-slate-300"
                                            )}>
                                                {notif.message}
                                            </p>
                                            <p className="text-xs text-slate-600 mt-2">
                                                {formatTime(notif.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
