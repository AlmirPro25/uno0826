import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Stethoscope } from 'lucide-react';

interface LoadingPageProps {
    message?: string;
    showLogo?: boolean;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({
    message = 'Carregando...',
    showLogo = true,
}) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
            >
                {showLogo && (
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center"
                    >
                        <Stethoscope className="w-8 h-8 text-primary" />
                    </motion.div>
                )}
                
                <div className="space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">{message}</p>
                </div>
            </motion.div>
        </div>
    );
};

// Inline loading spinner
interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const spinnerSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    className = '',
}) => {
    return (
        <Loader2 className={`animate-spin text-primary ${spinnerSizes[size]} ${className}`} />
    );
};

// Loading overlay for sections
interface LoadingOverlayProps {
    isLoading: boolean;
    children: React.ReactNode;
    message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    isLoading,
    children,
    message = 'Carregando...',
}) => {
    return (
        <div className="relative">
            {children}
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10"
                >
                    <div className="text-center space-y-2">
                        <LoadingSpinner size="lg" />
                        <p className="text-sm text-muted-foreground">{message}</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

// Progress bar loading
interface ProgressLoadingProps {
    progress: number; // 0-100
    message?: string;
}

export const ProgressLoading: React.FC<ProgressLoadingProps> = ({
    progress,
    message,
}) => {
    return (
        <div className="space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
            {message && (
                <p className="text-sm text-muted-foreground text-center">{message}</p>
            )}
        </div>
    );
};
