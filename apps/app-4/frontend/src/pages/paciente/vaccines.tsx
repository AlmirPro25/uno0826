import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import { VaccineCard } from '@/components/VaccineCard';
import { Syringe, Loader2, Shield, Calendar, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PatientVaccinesPage() {
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
                <title>Carteira de Vacinação | MediSync</title>
            </Head>

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Syringe className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Carteira de Vacinação</h1>
                            <p className="text-emerald-100">Seu histórico de imunização</p>
                        </div>
                    </div>
                </div>

                {/* Vaccine Card Component */}
                <VaccineCard />

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-5 h-5 text-blue-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Calendário Nacional</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            Confira as vacinas recomendadas para sua faixa etária.
                        </p>
                        <a 
                            href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/c/calendario-nacional-de-vacinacao"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Ver calendário →
                        </a>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <MapPin className="w-5 h-5 text-emerald-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">UBS Próximas</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            Encontre uma Unidade Básica de Saúde perto de você.
                        </p>
                        <Link href="/clinics" className="text-sm text-emerald-600 hover:underline">
                            Buscar UBS →
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="w-5 h-5 text-purple-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">ConecteSUS</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            Acesse sua carteira digital de vacinação oficial.
                        </p>
                        <a 
                            href="https://conectesus.saude.gov.br/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-purple-600 hover:underline"
                        >
                            Acessar ConecteSUS →
                        </a>
                    </motion.div>
                </div>
            </div>
        </>
    );
}
