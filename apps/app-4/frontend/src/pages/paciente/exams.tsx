import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { ExamTracker } from '@/components/ExamTracker';
import { Beaker, Loader2, FileText, Calendar, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PatientExamsPage() {
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuthStore();

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
                <title>Meus Exames | MediSync</title>
            </Head>

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Beaker className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Meus Exames</h1>
                            <p className="text-blue-100">Acompanhe seus exames e resultados</p>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3"
                >
                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-blue-800 dark:text-blue-200">
                            Dica importante
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-300">
                            Lembre-se de verificar as instruções de preparo antes de realizar seus exames. 
                            Alguns exames requerem jejum ou outras preparações específicas.
                        </p>
                    </div>
                </motion.div>

                {/* Exam Tracker Component */}
                <ExamTracker />

                {/* Tips */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-emerald-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Resultados</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Seus resultados ficam disponíveis aqui assim que o laboratório liberar. 
                            Você também pode compartilhar diretamente com seu médico.
                        </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-5 h-5 text-purple-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Agendamento</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Exames solicitados podem ser agendados diretamente pelo sistema. 
                            Escolha o laboratório e horário mais conveniente para você.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
