import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Clock, AlertCircle } from 'lucide-react';

interface CountdownProps {
    targetDate: Date | string;
    onComplete?: () => void;
    showDays?: boolean;
    className?: string;
    variant?: 'default' | 'compact' | 'large';
}

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
}

const calculateTimeLeft = (targetDate: Date | string): TimeLeft => {
    const difference = new Date(targetDate).getTime() - new Date().getTime();
    
    if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        total: difference,
    };
};

export const Countdown: React.FC<CountdownProps> = ({
    targetDate,
    onComplete,
    showDays = true,
    className,
    variant = 'default',
}) => {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(targetDate));

    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft(targetDate);
            setTimeLeft(newTimeLeft);
            
            if (newTimeLeft.total <= 0) {
                clearInterval(timer);
                onComplete?.();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate, onComplete]);

    const isUrgent = timeLeft.total > 0 && timeLeft.total < 1000 * 60 * 60; // Less than 1 hour

    if (timeLeft.total <= 0) {
        return (
            <div className={cn('flex items-center gap-2 text-destructive', className)}>
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Tempo esgotado</span>
            </div>
        );
    }

    const TimeUnit = ({ value, label }: { value: number; label: string }) => (
        <div className="text-center">
            <motion.div
                key={value}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={cn(
                    'font-mono font-bold',
                    variant === 'large' ? 'text-3xl' : variant === 'compact' ? 'text-lg' : 'text-2xl'
                )}
            >
                {value.toString().padStart(2, '0')}
            </motion.div>
            <div className={cn(
                'text-muted-foreground',
                variant === 'large' ? 'text-sm' : 'text-xs'
            )}>
                {label}
            </div>
        </div>
    );

    const Separator = () => (
        <span className={cn(
            'font-bold text-muted-foreground',
            variant === 'large' ? 'text-2xl' : 'text-lg'
        )}>:</span>
    );

    return (
        <div className={cn(
            'flex items-center gap-2',
            isUrgent && 'text-destructive',
            className
        )}>
            <Clock className={cn('shrink-0', variant === 'large' ? 'w-6 h-6' : 'w-4 h-4')} />
            <div className="flex items-center gap-1">
                {showDays && timeLeft.days > 0 && (
                    <>
                        <TimeUnit value={timeLeft.days} label="dias" />
                        <Separator />
                    </>
                )}
                <TimeUnit value={timeLeft.hours} label="horas" />
                <Separator />
                <TimeUnit value={timeLeft.minutes} label="min" />
                <Separator />
                <TimeUnit value={timeLeft.seconds} label="seg" />
            </div>
        </div>
    );
};

// Simple time display
interface TimeDisplayProps {
    date: Date | string;
    format?: 'relative' | 'absolute' | 'countdown';
    className?: string;
}

export const TimeDisplay: React.FC<TimeDisplayProps> = ({
    date,
    format = 'relative',
    className,
}) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        if (format === 'relative') {
            const timer = setInterval(() => setNow(new Date()), 60000);
            return () => clearInterval(timer);
        }
    }, [format]);

    const targetDate = new Date(date);
    const diff = targetDate.getTime() - now.getTime();
    const isPast = diff < 0;
    const absDiff = Math.abs(diff);

    const getRelativeTime = () => {
        const minutes = Math.floor(absDiff / (1000 * 60));
        const hours = Math.floor(absDiff / (1000 * 60 * 60));
        const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));

        if (days > 0) return `${days} dia${days > 1 ? 's' : ''}`;
        if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `${minutes} min`;
        return 'agora';
    };

    return (
        <span className={cn('text-muted-foreground', className)}>
            {isPast ? `há ${getRelativeTime()}` : `em ${getRelativeTime()}`}
        </span>
    );
};
