import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ChevronRight, ChevronLeft, Brain, Calendar, 
    Video, Bell, MapPin, Heart, Check
} from 'lucide-react';
import { useAuthStore } from '@/hooks/useAuthStore';

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
}

const patientSteps: OnboardingStep[] = [
    {
        id: 'welcome',
        title: 'Bem-vindo ao MediSync!',
        description: 'Sua plataforma completa de saúde digital. Vamos te mostrar como aproveitar ao máximo.',
        icon: Heart,
        color: 'from-pink-500 to-rose-600'
    },
    {
        id: 'triage',
        title: 'Triagem Inteligente',
        description: 'Use nossa IA para avaliar seus sintomas e receber orientações personalizadas antes de agendar uma consulta.',
        icon: Brain,
        color: 'from-purple-500 to-indigo-600'
    },
    {
        id: 'clinics',
        title: 'Encontre Clínicas',
        description: 'Localize clínicas e médicos próximos a você, com avaliações e especialidades.',
        icon: MapPin,
        color: 'from-emerald-500 to-teal-600'
    },
    {
        id: 'appointments',
        title: 'Agende Consultas',
        description: 'Marque consultas presenciais ou por teleconsulta com facilidade.',
        icon: Calendar,
        color: 'from-cyan-500 to-blue-600'
    },
    {
        id: 'telemedicine',
        title: 'Teleconsulta',
        description: 'Consulte-se com médicos por videochamada, de qualquer lugar.',
        icon: Video,
        color: 'from-blue-500 to-indigo-600'
    },
    {
        id: 'notifications',
        title: 'Fique Informado',
        description: 'Receba lembretes de consultas, medicamentos e resultados de exames.',
        icon: Bell,
        color: 'from-amber-500 to-orange-600'
    }
];

const doctorSteps: OnboardingStep[] = [
    {
        id: 'welcome',
        title: 'Bem-vindo, Doutor(a)!',
        description: 'O MediSync vai otimizar seu atendimento. Veja como.',
        icon: Heart,
        color: 'from-cyan-500 to-blue-600'
    },
    {
        id: 'triage',
        title: 'Triagens IA',
        description: 'Receba pacientes pré-triados pela nossa IA, com classificação de prioridade Manchester.',
        icon: Brain,
        color: 'from-purple-500 to-indigo-600'
    },
    {
        id: 'telemedicine',
        title: 'Teleconsulta com IA',
        description: 'Durante a consulta, nossa IA transcreve e sugere diagnósticos em tempo real.',
        icon: Video,
        color: 'from-emerald-500 to-teal-600'
    },
    {
        id: 'records',
        title: 'Prontuário Automático',
        description: 'Gere prontuários automaticamente ao final de cada consulta.',
        icon: Calendar,
        color: 'from-blue-500 to-indigo-600'
    }
];

export function Onboarding() {
    const { user, role } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [completed, setCompleted] = useState(false);

    const steps = role === 'MEDICO' ? doctorSteps : patientSteps;

    useEffect(() => {
        // Check if user has seen onboarding
        const hasSeenOnboarding = localStorage.getItem(`onboarding_${user?.id}`);
        if (!hasSeenOnboarding && user?.id) {
            // Show onboarding after a short delay
            const timer = setTimeout(() => setIsOpen(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [user?.id]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleComplete = () => {
        setCompleted(true);
        localStorage.setItem(`onboarding_${user?.id}`, 'true');
        setTimeout(() => setIsOpen(false), 1500);
    };

    const handleSkip = () => {
        localStorage.setItem(`onboarding_${user?.id}`, 'true');
        setIsOpen(false);
    };

    if (!isOpen) return null;

    const step = steps[currentStep];
    const Icon = step.icon;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
                >
                    {completed ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-12 text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                                className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                <Check className="w-10 h-10 text-emerald-600" />
                            </motion.div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Tudo pronto!
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400">
                                Aproveite o MediSync ao máximo
                            </p>
                        </motion.div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className={`bg-gradient-to-r ${step.color} p-8 text-white relative`}>
                                <button
                                    onClick={handleSkip}
                                    className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                
                                <motion.div
                                    key={step.id}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-6"
                                >
                                    <Icon className="w-10 h-10" />
                                </motion.div>
                                
                                <motion.h2
                                    key={`title-${step.id}`}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="text-2xl font-bold mb-2"
                                >
                                    {step.title}
                                </motion.h2>
                                
                                <motion.p
                                    key={`desc-${step.id}`}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-white/90"
                                >
                                    {step.description}
                                </motion.p>
                            </div>

                            {/* Progress & Navigation */}
                            <div className="p-6">
                                {/* Progress dots */}
                                <div className="flex justify-center gap-2 mb-6">
                                    {steps.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentStep(index)}
                                            className={`w-2 h-2 rounded-full transition-all ${
                                                index === currentStep
                                                    ? 'w-8 bg-cyan-600'
                                                    : index < currentStep
                                                        ? 'bg-cyan-400'
                                                        : 'bg-gray-300 dark:bg-gray-600'
                                            }`}
                                        />
                                    ))}
                                </div>

                                {/* Navigation buttons */}
                                <div className="flex gap-3">
                                    {currentStep > 0 && (
                                        <button
                                            onClick={handlePrev}
                                            className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                            Anterior
                                        </button>
                                    )}
                                    <button
                                        onClick={handleNext}
                                        className={`flex-1 py-3 bg-gradient-to-r ${step.color} text-white rounded-xl hover:opacity-90 flex items-center justify-center gap-2 font-medium`}
                                    >
                                        {currentStep === steps.length - 1 ? 'Começar' : 'Próximo'}
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>

                                <button
                                    onClick={handleSkip}
                                    className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
                                >
                                    Pular introdução
                                </button>
                            </div>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default Onboarding;
