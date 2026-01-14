import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/Card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Activity {
    id: string | number;
    type: string;
    title: string;
    description?: string;
    timestamp: Date | string;
    icon?: React.ReactNode;
    user?: { name: string; avatar?: string };
}

interface ActivityCardProps {
    activities: Activity[];
    title?: string;
    maxItems?: number;
    onViewAll?: () => void;
    className?: string;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
    activities,
    title = 'Atividade Recente',
    maxItems = 5,
    onViewAll,
    className,
}) => {
    const displayedActivities = activities.slice(0, maxItems);

    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{title}</CardTitle>
                {onViewAll && activities.length > maxItems && (
                    <button
                        onClick={onViewAll}
                        className="text-sm text-primary hover:underline"
                    >
                        Ver todas
                    </button>
                )}
            </CardHeader>
            <CardContent>
                {displayedActivities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma atividade recente
                    </p>
                ) : (
                    <div className="space-y-4">
                        {displayedActivities.map((activity, index) => (
                            <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-start gap-3"
                            >
                                {activity.icon && (
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        {activity.icon}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{activity.title}</p>
                                    {activity.description && (
                                        <p className="text-xs text-muted-foreground truncate">
                                            {activity.description}
                                        </p>
                                    )}
                                </div>
                                <time className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDistanceToNow(new Date(activity.timestamp), {
                                        addSuffix: true,
                                        locale: ptBR,
                                    })}
                                </time>
                            </motion.div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// Notification badge
interface NotificationBadgeProps {
    count: number;
    max?: number;
    className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
    count,
    max = 99,
    className,
}) => {
    if (count <= 0) return null;

    const displayCount = count > max ? `${max}+` : count.toString();

    return (
        <span className={cn(
            'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center',
            'text-xs font-medium bg-destructive text-destructive-foreground rounded-full',
            className
        )}>
            {displayCount}
        </span>
    );
};
