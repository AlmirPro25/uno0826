import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/shadcn/Card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: React.ElementType;
    trend?: {
        value: number;
        label?: string;
    };
    className?: string;
}

export function StatsCard({ title, value, description, icon: Icon, trend, className }: StatsCardProps) {
    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend.value > 0) return <TrendingUp className="w-4 h-4" />;
        if (trend.value < 0) return <TrendingDown className="w-4 h-4" />;
        return <Minus className="w-4 h-4" />;
    };

    const getTrendColor = () => {
        if (!trend) return "";
        if (trend.value > 0) return "text-green-600 dark:text-green-400";
        if (trend.value < 0) return "text-red-600 dark:text-red-400";
        return "text-muted-foreground";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
        >
            <Card className={cn("overflow-hidden", className)}>
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">{title}</p>
                            <p className="text-3xl font-bold">{value}</p>
                            {description && (
                                <p className="text-sm text-muted-foreground">{description}</p>
                            )}
                            {trend && (
                                <div className={cn("flex items-center gap-1 text-sm", getTrendColor())}>
                                    {getTrendIcon()}
                                    <span>{Math.abs(trend.value)}%</span>
                                    {trend.label && <span className="text-muted-foreground">{trend.label}</span>}
                                </div>
                            )}
                        </div>
                        {Icon && (
                            <div className="p-3 rounded-lg bg-primary/10">
                                <Icon className="w-6 h-6 text-primary" />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// Grid of stats cards
interface StatsGridProps {
    children: React.ReactNode;
    columns?: 2 | 3 | 4;
}

export function StatsGrid({ children, columns = 4 }: StatsGridProps) {
    const gridCols = {
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    };

    return (
        <div className={cn("grid gap-4", gridCols[columns])}>
            {children}
        </div>
    );
}
