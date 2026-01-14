import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimelineItem {
    id: string | number;
    title: string;
    description?: string;
    date: Date | string;
    icon?: React.ReactNode;
    status?: 'completed' | 'current' | 'upcoming';
    metadata?: Record<string, string>;
}

interface TimelineProps {
    items: TimelineItem[];
    className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ items, className }) => {
    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500';
            case 'current': return 'bg-primary';
            case 'upcoming': return 'bg-muted';
            default: return 'bg-primary';
        }
    };

    return (
        <div className={cn('relative', className)}>
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-6">
                {items.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative pl-10"
                    >
                        {/* Dot */}
                        <div className={cn(
                            'absolute left-2 w-4 h-4 rounded-full border-2 border-background',
                            getStatusColor(item.status)
                        )} />

                        {/* Content */}
                        <div className="bg-card border rounded-lg p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    {item.icon && (
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                            {item.icon}
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-medium">{item.title}</h4>
                                        {item.description && (
                                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                        )}
                                        {item.metadata && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {Object.entries(item.metadata).map(([key, value]) => (
                                                    <span key={key} className="text-xs px-2 py-1 bg-muted rounded">
                                                        {key}: {value}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <time className="text-xs text-muted-foreground whitespace-nowrap">
                                    {format(new Date(item.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </time>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

// Compact timeline for smaller spaces
interface CompactTimelineProps {
    items: { label: string; date: Date | string; completed?: boolean }[];
    className?: string;
}

export const CompactTimeline: React.FC<CompactTimelineProps> = ({ items, className }) => {
    return (
        <div className={cn('flex items-center gap-2', className)}>
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    <div className="flex flex-col items-center">
                        <div className={cn(
                            'w-3 h-3 rounded-full',
                            item.completed ? 'bg-green-500' : 'bg-muted'
                        )} />
                        <span className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                            {item.label}
                        </span>
                    </div>
                    {index < items.length - 1 && (
                        <div className={cn(
                            'flex-1 h-0.5 min-w-[20px]',
                            item.completed ? 'bg-green-500' : 'bg-muted'
                        )} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
