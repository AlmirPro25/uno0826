import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({ 
    className = '', 
    variant = 'text',
    width,
    height,
    animation = 'pulse'
}: SkeletonProps) {
    const baseClasses = 'bg-gray-200 dark:bg-gray-700';
    
    const variantClasses = {
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: '',
        rounded: 'rounded-xl'
    };

    const animationClasses = {
        pulse: 'animate-pulse',
        wave: '',
        none: ''
    };

    const style: React.CSSProperties = {
        width: width || (variant === 'circular' ? height : '100%'),
        height: height || (variant === 'text' ? '1rem' : '100%')
    };

    if (animation === 'wave') {
        return (
            <div 
                className={`${baseClasses} ${variantClasses[variant]} ${className} overflow-hidden relative`}
                style={style}
            >
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                />
            </div>
        );
    }

    return (
        <div 
            className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
            style={style}
        />
    );
}

// Pre-built skeleton components for common use cases
export function CardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="flex items-center gap-4">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1 space-y-2">
                    <Skeleton width="60%" height={20} />
                    <Skeleton width="40%" height={16} />
                </div>
            </div>
            <Skeleton height={100} variant="rounded" />
            <div className="flex gap-2">
                <Skeleton width={80} height={32} variant="rounded" />
                <Skeleton width={80} height={32} variant="rounded" />
            </div>
        </div>
    );
}

export function ListItemSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 space-y-2">
                <Skeleton width="70%" height={16} />
                <Skeleton width="50%" height={14} />
            </div>
            <Skeleton width={60} height={24} variant="rounded" />
        </div>
    );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: items }).map((_, i) => (
                <ListItemSkeleton key={i} />
            ))}
        </div>
    );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <tr className="border-b border-gray-200 dark:border-gray-700">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <Skeleton width={i === 0 ? '80%' : '60%'} height={16} />
                </td>
            ))}
        </tr>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-3">
                <Skeleton variant="rounded" width={40} height={40} />
                <Skeleton width={50} height={20} />
            </div>
            <Skeleton width="60%" height={32} className="mb-2" />
            <Skeleton width="40%" height={14} />
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6 animate-pulse">
                <Skeleton width={200} height={28} className="mb-2" />
                <Skeleton width={150} height={20} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CardSkeleton />
                <CardSkeleton />
            </div>
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-6">
                <Skeleton variant="circular" width={100} height={100} />
                <div className="space-y-3">
                    <Skeleton width={200} height={28} />
                    <Skeleton width={150} height={20} />
                    <Skeleton width={180} height={16} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton width={80} height={14} />
                        <Skeleton height={40} variant="rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ChatSkeleton() {
    return (
        <div className="space-y-4">
            {/* Received message */}
            <div className="flex gap-3">
                <Skeleton variant="circular" width={32} height={32} />
                <div className="space-y-2">
                    <Skeleton width={200} height={60} variant="rounded" />
                    <Skeleton width={60} height={12} />
                </div>
            </div>
            {/* Sent message */}
            <div className="flex gap-3 justify-end">
                <div className="space-y-2 text-right">
                    <Skeleton width={180} height={40} variant="rounded" />
                    <Skeleton width={60} height={12} className="ml-auto" />
                </div>
            </div>
            {/* Received message */}
            <div className="flex gap-3">
                <Skeleton variant="circular" width={32} height={32} />
                <div className="space-y-2">
                    <Skeleton width={250} height={80} variant="rounded" />
                    <Skeleton width={60} height={12} />
                </div>
            </div>
        </div>
    );
}

export default Skeleton;
