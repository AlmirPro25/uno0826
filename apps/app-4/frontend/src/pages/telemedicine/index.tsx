import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuthStore } from '@/hooks/useAuthStore';
import { QuickConsultation } from '@/components/QuickConsultation';
import { 
    Video, Phone, MessageSquare, Clock, Star, Shield, 
    Loader2, CheckCircle, Calendar, Stethoscope, Heart,
    Brain, Bone, Eye, Baby, Smile
} from 'lucide-react';
import { motion } from 'framer-motion';

const specialties = [
    { id: 'general', name: 'Clínica Geral', icon: Stethoscope, color: 'bg-blue-500', available: 5 },
    { id: 'cardio', name: 'Cardiologia', icon: Heart, color: 'bg-red-500', available: 2 },
    { id: 'neuro', name: 'Neurologia', icon: Brain, color: 'bg-purple-500', available: 1 },
    { id: 'ortho', name: 'Ortopedia', icon: Bone, color: 'bg-amber-500', available: 3 },
    { id: 'ophth', name: 'Oftalmologia', icon: Eye, color: 'bg-cyan-500', available: 2 },
    { id: 'pedia', name: 'Pediatria', icon: Baby, color: 'bg-pink-500', available: 4 },
    { id: 'derma', name: 'Dermatologia', icon: Smile, color: 'bg-orange-500', available: 2 },
];

const benefits = [
    { icon: Clock, title: 'Atendimento Rápido', desc: 'Consulte em minutos, sem filas' },
    { icon: Shield, title: '100% Seguro', desc: 'Criptografia de ponta a ponta' },
    { icon: Star, title: 'Médicos Qualificados', desc: 'Profissionais verificados' },
    { icon: Calendar, title: 'Disponível 24/7', desc: 'Atendimento a qualquer hora' },
];

export default function TelemedicinePage() {
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuthStore();
    const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Telemedicina | MediSync</title>
            </Head>

            <div className="max-w-6xl mx-auto p-6 space-y-8">
                {/* Hero */}
                <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 rounded-3xl p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="relative z-10 max-w-2xl">
                        <div className="flex items-center gap-2 mb-4">
                            <Video className="w-8 h-8" />
                            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                                Telemedicina
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">
                            Consulte um médico agora, de onde você estiver
                        </h1>
                        <p className="text-blue-100 text-lg mb-6">
                            Atendimento médico online 24 horas por dia, 7 dias por semana. 
                            Rápido, seguro e sem sair de casa.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link href="#quick-consultation">
                                <button className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2">
                                    <Video className="w-5 h-5" />
                                    Consulta Rápida
                                </button>
                            </Link>
                            <Link href="/paciente/book-appointment">
                                <button className="px-6 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    Agendar Consulta
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {benefits.map((benefit, i) => (
                        <motion.div
                            key={benefit.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                        >
                            <benefit.icon className="w-8 h-8 text-cyan-500 mb-3" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">{benefit.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{benefit.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Specialties */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Especialidades Disponíveis
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {specialties.map(spec => (
                            <button
                                key={spec.id}
                                onClick={() => setSelectedSpecialty(spec.id)}
                                className={`p-4 rounded-xl text-center transition-all ${
                                    selectedSpecialty === spec.id
                                        ? 'bg-cyan-50 dark:bg-cyan-900/30 border-2 border-cyan-500'
                                        : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-cyan-300'
                                }`}
                            >
                                <div className={`w-10 h-10 ${spec.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                                    <spec.icon className="w-5 h-5 text-white" />
                                </div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">{spec.name}</p>
                                <p className="text-xs text-emerald-600 mt-1">{spec.available} online</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Consultation */}
                <div id="quick-consultation">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Iniciar Consulta Rápida
                    </h2>
                    <QuickConsultation />
                </div>

                {/* How it Works */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                        Como Funciona
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { step: 1, title: 'Escolha o Médico', desc: 'Selecione a especialidade e o profissional disponível' },
                            { step: 2, title: 'Inicie a Consulta', desc: 'Conecte-se por vídeo, áudio ou chat' },
                            { step: 3, title: 'Receba o Atendimento', desc: 'Diagnóstico, receitas e atestados digitais' },
                        ].map(item => (
                            <div key={item.step} className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                                    {item.step}
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
