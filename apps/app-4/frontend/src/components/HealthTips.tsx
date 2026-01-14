import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Lightbulb, ChevronLeft, ChevronRight, Heart, 
    Droplets, Moon, Apple, Dumbbell, Brain, X
} from 'lucide-react';

interface HealthTip {
    id: number;
    category: 'nutrition' | 'exercise' | 'sleep' | 'mental' | 'hydration' | 'general';
    title: string;
    description: string;
    icon: React.ElementType;
}

const tips: HealthTip[] = [
    {
        id: 1,
        category: 'hydration',
        title: 'Mantenha-se hidratado',
        description: 'Beba pelo menos 2 litros de água por dia. A hidratação adequada melhora a concentração e a disposição.',
        icon: Droplets
    },
    {
        id: 2,
        category: 'sleep',
        title: 'Durma bem',
        description: 'Adultos precisam de 7-9 horas de sono por noite. Mantenha horários regulares para dormir e acordar.',
        icon: Moon
    },
    {
        id: 3,
        category: 'nutrition',
        title: 'Alimentação balanceada',
        description: 'Inclua frutas, verduras e proteínas em todas as refeições. Evite alimentos ultraprocessados.',
        icon: Apple
    },
    {
        id: 4,
        category: 'exercise',
        title: 'Movimente-se',
        description: 'Pratique pelo menos 30 minutos de atividade física moderada, 5 vezes por semana.',
        icon: Dumbbell
    },
    {
        id: 5,
        category: 'mental',
        title: 'Cuide da mente',
        description: 'Reserve tempo para relaxar. Meditação e respiração profunda ajudam a reduzir o estresse.',
        icon: Brain
    },
    {
        id: 6,
        category: 'general',
        title: 'Check-ups regulares',
        description: 'Faça exames preventivos anualmente. A prevenção é o melhor remédio.',
        icon: Heart
    }
];

interface HealthTipsProps {
    autoRotate?: boolean;
    rotateInterval?: number;
    dismissible?: boolean;
}

export function HealthTips({ 
    autoRotate = true, 
    rotateInterval = 10000,
    dismissible = true 
}: HealthTipsProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dismissed, setDismissed] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (!autoRotate || isPaused) return;

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % tips.length);
        }, rotateInterval);

        return () => clearInterval(interval);
    }, [autoRotate, rotateInterval, isPaused]);

    const goToPrev = () => {
        setCurrentIndex(prev => (prev - 1 + tips.length) % tips.length);
    };

    const goToNext = () => {
        setCurrentIndex(prev => (prev + 1) % tips.length);
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'hydration': return 'from-blue-500 to-cyan-500';
            case 'sleep': return 'from-indigo-500 to-purple-500';
            case 'nutrition': return 'from-green-500 to-emerald-500';
            case 'exercise': return 'from-orange-500 to-red-500';
            case 'mental': return 'from-pink-500 to-rose-500';
            default: return 'from-cyan-500 to-blue-500';
        }
    };

    if (dismissed) return null;

    const currentTip = tips[currentIndex];
    const Icon = currentTip.icon;

    return (
        <div 
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className={`bg-gradient-to-r ${getCategoryColor(currentTip.category)} p-4`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <Lightbulb className="w-5 h-5" />
                        <span className="font-medium text-sm">Dica de Saúde</span>
                    </div>
                    {dismissible && (
                        <button
                            onClick={() => setDismissed(true)}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentTip.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-start gap-4"
                    >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getCategoryColor(currentTip.category)} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                {currentTip.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {currentTip.description}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={goToPrev}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </button>

                    <div className="flex gap-1">
                        {tips.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                    index === currentIndex
                                        ? 'w-6 bg-cyan-500'
                                        : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                                }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={goToNext}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default HealthTips;
