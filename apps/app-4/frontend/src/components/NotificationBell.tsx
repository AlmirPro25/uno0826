import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useAuthStore } from "@/hooks/useAuthStore";

export const NotificationBell: React.FC = () => {
    const router = useRouter();
    const { isAuthenticated, _hasHydrated } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Only enable fetching when fully hydrated and authenticated
    const canFetch = _hasHydrated && isAuthenticated;

    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        getNotificationIcon,
        getPriorityColor,
        formatRelativeTime,
    } = useNotifications({ autoFetch: canFetch, pollInterval: canFetch ? 30000 : 0 });

    // Close dropdown when clicking outside - MUST be before any conditional returns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Don't render if not hydrated or not authenticated
    if (!_hasHydrated || !isAuthenticated) {
        return null;
    }

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            router.push(notification.link);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Notificações"
            >
                <svg
                    className="w-6 h-6 text-gray-600 dark:text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Notificações
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        markAllAsRead();
                                    }}
                                    className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                >
                                    Marcar todas como lidas
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <p>Nenhuma notificação</p>
                                </div>
                            ) : (
                                notifications.slice(0, 10).map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 cursor-pointer transition-colors ${notification.read
                                                ? "hover:bg-gray-50 dark:hover:bg-gray-700"
                                                : "bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <span className="text-xl flex-shrink-0">
                                                {getNotificationIcon(notification.type)}
                                            </span>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h4 className={`font-medium truncate ${notification.read
                                                            ? "text-gray-700 dark:text-gray-300"
                                                            : "text-gray-900 dark:text-white"
                                                        }`}>
                                                        {notification.title}
                                                    </h4>
                                                    <span className="text-xs text-gray-400 flex-shrink-0">
                                                        {formatRelativeTime(notification.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                    {notification.message}
                                                </p>

                                                {/* Priority indicator */}
                                                {notification.priority !== "normal" && (
                                                    <span className={`text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                                                        {notification.priority === "urgent" ? "🔴 Urgente" :
                                                            notification.priority === "high" ? "🟠 Alta prioridade" : ""}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Delete button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification.id);
                                                }}
                                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-red-500"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Unread indicator */}
                                        {!notification.read && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 10 && (
                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => {
                                        router.push("/notifications");
                                        setIsOpen(false);
                                    }}
                                    className="w-full text-center text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                >
                                    Ver todas as notificações
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Toast notification component for real-time notifications
interface NotificationToastProps {
    notification: Notification;
    onClose: () => void;
    onClick?: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
    notification,
    onClose,
    onClick,
}) => {
    const { getNotificationIcon, getPriorityColor } = useNotifications({ autoFetch: false });

    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            onClick={onClick}
            className={`max-w-sm w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer ${notification.priority === "urgent" ? "border-l-4 border-l-red-500" : ""
                }`}
        >
            <div className="flex items-start gap-3">
                <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {notification.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {notification.message}
                    </p>
                    {notification.priority !== "normal" && (
                        <span className={`text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                            {notification.priority === "urgent" ? "Urgente" : "Alta prioridade"}
                        </span>
                    )}
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </motion.div>
    );
};

export default NotificationBell;
