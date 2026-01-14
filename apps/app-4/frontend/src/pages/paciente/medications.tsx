import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { MedicationReminder } from '@/components/MedicationReminder';
import { Pill, Loader2, Bell, Calendar, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PatientMedicationsPage() {
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuthStore();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    const enableNotifications = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                setNotificationsEnabled(true);
                new Notification('MediSync', {
                    body: 'Notificações de medicamentos ativadas!',
                    icon: '/icon-192.png'
                });
            }
        }
    };

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router]);

    if (authLoading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Meus Medicamentos | MediSync</title>
            </Head>

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Pill className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Meus Medicamentos</h1>
                                <p className="text-pink-100">Controle suas doses e horários</p>
                            </div>
                        </div>
                        {!notificationsEnabled && (
                            <button
                                onClick={enableNotifications}
                                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                            >
                                <Bell className="w-5 h-5" />
                                <span className="hidden sm:inline">Ativar Lembretes</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Notification Banner */}
                {!notificationsEnabled && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3"
                    >
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium text-amber-800 dark:text-amber-200">
                                Ative as notificações
                            </p>
                            <p className="text-sm text-amber-600 dark:text-amber-300">
                                Receba lembretes para não esquecer de tomar seus medicamentos nos horários corretos.
                            </p>
                        </div>
                        <button
                            onClick={enableNotifications}
                            className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600"
                        >
                            Ativar
                        </button>
                    </motion.div>
                )}

                {/* Medication Reminder Component */}
                <MedicationReminder />

                {/* Tips */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Dica de Horário</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Tome seus medicamentos sempre no mesmo horário para manter níveis estáveis no organismo.
                        </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-5 h-5 text-purple-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Não Interrompa</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Complete todo o tratamento prescrito, mesmo se sentir melhora antes do prazo.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
