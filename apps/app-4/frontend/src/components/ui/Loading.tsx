import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    text?: string;
}

const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    className,
    text
}) => {
    return (
        <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
            <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
            {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
        </div>
    );
};

interface LoadingOverlayProps {
    isLoading: boolean;
    text?: string;
    children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    isLoading,
    text = 'Carregando...',
    children
}) => {
    return (
        <div className="relative">
            {children}
            {isLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
                    <LoadingSpinner size="lg" text={text} />
                </div>
            )}
        </div>
    );
};

interface LoadingPageProps {
    text?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ text = 'Carregando...' }) => {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="xl" text={text} />
        </div>
    );
};

interface LoadingButtonProps {
    isLoading: boolean;
    loadingText?: string;
    children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
    isLoading,
    loadingText,
    children,
    className,
    disabled,
    ...props
}) => {
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:pointer-events-none disabled:opacity-50',
                'bg-primary text-primary-foreground hover:bg-primary/90',
                'h-10 px-4 py-2',
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {loadingText || 'Carregando...'}
                </>
            ) : (
                children
            )}
        </button>
    );
};

// Skeleton components for loading states
interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-muted',
                className
            )}
        />
    );
};

export const SkeletonCard: React.FC = () => {
    return (
        <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
            </div>
        </div>
    );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex gap-4 p-4 border-b">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
            ))}
        </div>
    );
};
