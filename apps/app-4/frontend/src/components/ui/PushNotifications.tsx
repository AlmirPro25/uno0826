import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './shadcn/Button';
import { Bell, Download, Wifi, WifiOff, Settings, X, Check, AlertCircle } from 'lucide-react';

// Install PWA Banner
export function InstallPWABanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowBanner(false);
        }
        setDeferredPrompt(null);
    };

    if (!showBanner) return null;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-4 rounded-2xl shadow-xl z-50"
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Download className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold">Instalar MediSync</h3>
                    <p className="text-sm text-cyan-100 mt-1">
                        Instale o app para acesso rápido e notificações
                    </p>
                    <div className="flex gap-2 mt-3">
                        <Button
                            size="sm"
                            onClick={handleInstall}
                            className="bg-white text-cyan-600 hover:bg-cyan-50"
                        >
                            Instalar
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowBanner(false)}
                            className="text-white hover:bg-white/20"
                        >
                            Agora não
                        </Button>
                    </div>
                </div>
                <button
                    onClick={() => setShowBanner(false)}
                    className="p-1 hover:bg-white/20 rounded-lg"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}

// Update Available Banner
export function UpdateAvailableBanner() {
    const [showUpdate, setShowUpdate] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                setShowUpdate(true);
                            }
                        });
                    }
                });
            });
        }
    }, []);

    const handleUpdate = () => {
        window.location.reload();
    };

    if (!showUpdate) return null;

    return (
        <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-96 bg-emerald-600 text-white p-4 rounded-2xl shadow-xl z-50"
        >
            <div className="flex items-center gap-3">
                <Check className="w-5 h-5" />
                <div className="flex-1">
                    <p className="font-medium">Nova versão disponível!</p>
                </div>
                <Button
                    size="sm"
                    onClick={handleUpdate}
                    className="bg-white text-emerald-600 hover:bg-emerald-50"
                >
                    Atualizar
                </Button>
            </div>
        </motion.div>
    );
}

// Offline Indicator
export function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        setIsOnline(navigator.onLine);
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-4 bg-amber-500 text-white px-4 py-3 rounded-xl flex items-center gap-3 z-50 shadow-lg"
                >
                    <WifiOff className="h-5 w-5" />
                    <div>
                        <p className="font-medium">Você está offline</p>
                        <p className="text-xs text-amber-100">Algumas funcionalidades podem estar limitadas</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Notification Permission Request
export function NotificationPermissionRequest() {
    const [showRequest, setShowRequest] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
            if (Notification.permission === 'default') {
                // Show request after 5 seconds
                const timer = setTimeout(() => setShowRequest(true), 5000);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const requestPermission = async () => {
        if ('Notification' in window) {
            const result = await Notification.requestPermission();
            setPermission(result);
            setShowRequest(false);
        }
    };

    if (!showRequest || permission !== 'default') return null;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl shadow-xl z-50"
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-cyan-600" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Ativar notificações?</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Receba alertas de consultas e lembretes de medicamentos
                    </p>
                    <div className="flex gap-2 mt-3">
                        <Button
                            size="sm"
                            onClick={requestPermission}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white"
                        >
                            Permitir
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowRequest(false)}
                        >
                            Depois
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// Notification Button
export function NotificationButton() {
    return (
        <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
        </Button>
    );
}

// Notification Settings
export function NotificationSettings() {
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if ('Notification' in window) {
            const result = await Notification.requestPermission();
            setPermission(result);
        }
    };

    return (
        <div className="p-4 space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Configurações de Notificação</h3>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-gray-500" />
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Notificações Push</p>
                        <p className="text-sm text-gray-500">
                            {permission === 'granted' ? 'Ativadas' : 
                             permission === 'denied' ? 'Bloqueadas' : 'Não configuradas'}
                        </p>
                    </div>
                </div>
                {permission === 'default' && (
                    <Button size="sm" onClick={requestPermission}>
                        Ativar
                    </Button>
                )}
                {permission === 'granted' && (
                    <Check className="w-5 h-5 text-emerald-500" />
                )}
                {permission === 'denied' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                )}
            </div>

            {permission === 'denied' && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                    As notificações foram bloqueadas. Para ativá-las, acesse as configurações do seu navegador.
                </p>
            )}
        </div>
    );
}

// PWA Status
export function PWAStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        setIsOnline(navigator.onLine);
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <div className="flex items-center gap-2 text-sm">
            {isOnline ? (
                <Wifi className="h-4 w-4 text-emerald-500" />
            ) : (
                <WifiOff className="h-4 w-4 text-amber-500" />
            )}
            <span className={isOnline ? 'text-emerald-600' : 'text-amber-600'}>
                {isOnline ? 'Online' : 'Offline'}
            </span>
            {isStandalone && (
                <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 rounded text-xs">
                    App
                </span>
            )}
        </div>
    );
}

// Send Push Notification (utility function)
export function sendPushNotification(title: string, options?: NotificationOptions) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            ...options
        });
    }
}
