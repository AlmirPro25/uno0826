import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/shadcn/Button';
import { X, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface OnboardingStep {
    title: string;
    description: string;
    icon: React.ReactNode;
    image?: string;
}

interface OnboardingProps {
    steps: OnboardingStep[];
    onComplete: () => void;
    storageKey?: string;
}

export const Onboarding: React.FC<OnboardingProps> = ({
    steps,
    onComplete,
    storageKey = 'onboarding-completed',
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [completed, setCompleted] = useLocalStorage(storageKey, false);

    useEffect(() => {
        if (completed) {
            setIsVisible(false);
        }
    }, [completed]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        setCompleted(true);
        setIsVisible(false);
        onComplete();
    };

    const handleSkip = () => {
        setCompleted(true);
        setIsVisible(false);
        onComplete();
    };

    if (!isVisible || completed) return null;

    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Skip button */}
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Content */}
                    <div className="p-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="text-center"
                            >
                                {/* Icon */}
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                                    {step.icon}
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl font-bold mb-3">{step.title}</h2>

                                {/* Description */}
                                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                                    {step.description}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        {/* Progress dots */}
                        <div className="flex justify-center gap-2 mb-6">
                            {steps.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentStep(index)}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                        index === currentStep
                                            ? 'w-8 bg-primary'
                                            : index < currentStep
                                            ? 'bg-primary/50'
                                            : 'bg-muted'
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between">
                            <Button
                                variant="ghost"
                                onClick={handlePrev}
                                disabled={currentStep === 0}
                                className="gap-2"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Anterior
                            </Button>

                            <Button onClick={handleNext} className="gap-2">
                                {isLastStep ? (
                                    <>
                                        Começar
                                        <Check className="w-4 h-4" />
                                    </>
                                ) : (
                                    <>
                                        Próximo
                                        <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// Feature highlight tooltip
interface FeatureHighlightProps {
    targetId: string;
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    storageKey: string;
    onDismiss?: () => void;
}

export const FeatureHighlight: React.FC<FeatureHighlightProps> = ({
    targetId,
    title,
    description,
    position = 'bottom',
    storageKey,
    onDismiss,
}) => {
    const [dismissed, setDismissed] = useLocalStorage(storageKey, false);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        const target = document.getElementById(targetId);
        if (target && !dismissed) {
            setTargetRect(target.getBoundingClientRect());
        }
    }, [targetId, dismissed]);

    const handleDismiss = () => {
        setDismissed(true);
        onDismiss?.();
    };

    if (dismissed || !targetRect) return null;

    const positionStyles = {
        top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' },
        bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' },
        left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' },
        right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' },
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 w-64 p-4 bg-primary text-primary-foreground rounded-lg shadow-lg"
            style={{
                top: targetRect.bottom + 8,
                left: targetRect.left + targetRect.width / 2,
                transform: 'translateX(-50%)',
            }}
        >
            <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h4 className="font-semibold mb-1">{title}</h4>
                    <p className="text-sm opacity-90">{description}</p>
                </div>
                <button onClick={handleDismiss} className="shrink-0 opacity-70 hover:opacity-100">
                    <X className="w-4 h-4" />
                </button>
            </div>
            {/* Arrow */}
            <div
                className="absolute w-3 h-3 bg-primary rotate-45"
                style={{ top: '-6px', left: '50%', transform: 'translateX(-50%)' }}
            />
        </motion.div>
    );
};

// Welcome modal for first-time users
interface WelcomeModalProps {
    userName: string;
    userRole: string;
    onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
    userName,
    userRole,
    onClose,
}) => {
    const [shown, setShown] = useLocalStorage('welcome-shown', false);

    useEffect(() => {
        if (shown) {
            onClose();
        }
    }, [shown, onClose]);

    const handleClose = () => {
        setShown(true);
        onClose();
    };

    if (shown) return null;

    const roleMessages = {
        PACIENTE: 'Agende consultas, acompanhe seu histórico médico e converse com seus médicos.',
        MEDICO: 'Gerencie sua agenda, atenda pacientes por vídeo e emita receitas digitais.',
        ADMIN: 'Gerencie usuários, visualize relatórios e monitore o sistema.',
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="relative bg-background rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
            >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                    Bem-vindo(a), {userName}! 🎉
                </h2>
                <p className="text-muted-foreground mb-6">
                    {roleMessages[userRole as keyof typeof roleMessages] || roleMessages.PACIENTE}
                </p>
                <Button onClick={handleClose} className="w-full">
                    Começar a usar
                </Button>
            </motion.div>
        </motion.div>
    );
};
