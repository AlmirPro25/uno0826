import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface QuickAction {
    icon: React.ReactNode;
    label: string;
    description?: string;
    href?: string;
    onClick?: () => void;
    color?: string;
}

interface QuickActionsProps {
    actions: QuickAction[];
    title?: string;
    columns?: 2 | 3 | 4;
    className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
    actions,
    title,
    columns = 4,
    className,
}) => {
    const gridCols = {
        2: 'grid-cols-2',
        3: 'grid-cols-2 sm:grid-cols-3',
        4: 'grid-cols-2 sm:grid-cols-4',
    };

    return (
        <div className={className}>
            {title && <h3 className="font-semibold mb-4">{title}</h3>}
            <div className={cn('grid gap-4', gridCols[columns])}>
                {actions.map((action, index) => {
                    const content = (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={action.onClick}
                        >
                            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', action.color || 'bg-primary/10 text-primary')}>
                                {action.icon}
                            </div>
                            <p className="font-medium text-sm">{action.label}</p>
                            {action.description && (
                                <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                            )}
                        </motion.div>
                    );

                    if (action.href) {
                        return <Link key={index} href={action.href}>{content}</Link>;
                    }
                    return <React.Fragment key={index}>{content}</React.Fragment>;
                })}
            </div>
        </div>
    );
};

// Floating action button
interface FABProps {
    icon: React.ReactNode;
    onClick: () => void;
    label?: string;
    position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
    className?: string;
}

export const FAB: React.FC<FABProps> = ({
    icon,
    onClick,
    label,
    position = 'bottom-right',
    className,
}) => {
    const positionClasses = {
        'bottom-right': 'bottom-6 right-6',
        'bottom-left': 'bottom-6 left-6',
        'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
    };

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
                'fixed z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-lg',
                positionClasses[position],
                className
            )}
        >
            {icon}
            {label && <span className="font-medium">{label}</span>}
        </motion.button>
    );
};
