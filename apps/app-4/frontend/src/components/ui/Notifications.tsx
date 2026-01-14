import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    duration?: number;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = Math.random().toString(36).substring(7);
        setNotifications(prev => [...prev, { ...notification, id }]);

        // Auto remove after duration
        const duration = notification.duration || 5000;
        setTimeout(() => {
            removeNotification(id);
        }, duration);
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const success = useCallback((title: string, message?: string) => {
        addNotification({ type: 'success', title, message });
    }, [addNotification]);

    const error = useCallback((title: string, message?: string) => {
        addNotification({ type: 'error', title, message, duration: 8000 });
    }, [addNotification]);

    const warning = useCallback((title: string, message?: string) => {
        addNotification({ type: 'warning', title, message });
    }, [addNotification]);

    const info = useCallback((title: string, message?: string) => {
        addNotification({ type: 'info', title, message });
    }, [addNotification]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            addNotification,
            removeNotification,
            success,
            error,
            warning,
            info
        }}>
            {children}
            <NotificationContainer notifications={notifications} onRemove={removeNotification} />
        </NotificationContext.Provider>
    );
}

function NotificationContainer({ 
    notifications, 
    onRemove 
}: { 
    notifications: Notification[]; 
    onRemove: (id: string) => void;
}) {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
            <AnimatePresence>
                {notifications.map((notification) => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRemove={() => onRemove(notification.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}

function NotificationItem({ 
    notification, 
    onRemove 
}: { 
    notification: Notification; 
    onRemove: () => void;
}) {
    const config = {
        success: {
            icon: CheckCircle,
            bg: 'bg-emerald-50 dark:bg-emerald-900/30',
            border: 'border-emerald-200 dark:border-emerald-800',
            iconColor: 'text-emerald-600',
            titleColor: 'text-emerald-800 dark:text-emerald-200'
        },
        error: {
            icon: AlertCircle,
            bg: 'bg-red-50 dark:bg-red-900/30',
            border: 'border-red-200 dark:border-red-800',
            iconColor: 'text-red-600',
            titleColor: 'text-red-800 dark:text-red-200'
        },
        warning: {
            icon: AlertTriangle,
            bg: 'bg-amber-50 dark:bg-amber-900/30',
            border: 'border-amber-200 dark:border-amber-800',
            iconColor: 'text-amber-600',
            titleColor: 'text-amber-800 dark:text-amber-200'
        },
        info: {
            icon: Info,
            bg: 'bg-blue-50 dark:bg-blue-900/30',
            border: 'border-blue-200 dark:border-blue-800',
            iconColor: 'text-blue-600',
            titleColor: 'text-blue-800 dark:text-blue-200'
        }
    };

    const { icon: Icon, bg, border, iconColor, titleColor } = config[notification.type];

    return (
        <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className={`pointer-events-auto ${bg} ${border} border rounded-xl shadow-lg overflow-hidden`}
        >
            <div className="p-4 flex items-start gap-3">
                <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${titleColor}`}>
                        {notification.title}
                    </p>
                    {notification.message && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                        </p>
                    )}
                </div>
                <button
                    onClick={onRemove}
                    className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4 text-gray-400" />
                </button>
            </div>
        </motion.div>
    );
}

// Simple toast function for quick notifications
let toastHandler: NotificationContextType | null = null;

export function setToastHandler(handler: NotificationContextType) {
    toastHandler = handler;
}

export const toast = {
    success: (title: string, message?: string) => toastHandler?.success(title, message),
    error: (title: string, message?: string) => toastHandler?.error(title, message),
    warning: (title: string, message?: string) => toastHandler?.warning(title, message),
    info: (title: string, message?: string) => toastHandler?.info(title, message),
};
