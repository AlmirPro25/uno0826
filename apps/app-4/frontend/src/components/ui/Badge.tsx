import { cn } from "@/lib/utils";

interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "success" | "warning" | "error" | "info" | "outline";
    size?: "sm" | "md" | "lg";
    className?: string;
}

const variantStyles = {
    default: "bg-primary/10 text-primary border-primary/20",
    success: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
    error: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    info: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    outline: "bg-transparent border-border text-foreground",
};

const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
};

export function Badge({ children, variant = "default", size = "md", className }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center font-medium rounded-full border",
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
        >
            {children}
        </span>
    );
}

// Status badge with dot indicator
interface StatusBadgeProps {
    status: "pending" | "confirmed" | "completed" | "cancelled" | "active" | "inactive";
    label?: string;
}

const statusConfig = {
    pending: { variant: "warning" as const, label: "Pendente", dot: "bg-yellow-500" },
    confirmed: { variant: "info" as const, label: "Confirmado", dot: "bg-blue-500" },
    completed: { variant: "success" as const, label: "Concluído", dot: "bg-green-500" },
    cancelled: { variant: "error" as const, label: "Cancelado", dot: "bg-red-500" },
    active: { variant: "success" as const, label: "Ativo", dot: "bg-green-500" },
    inactive: { variant: "error" as const, label: "Inativo", dot: "bg-gray-500" },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
    const config = statusConfig[status];
    return (
        <Badge variant={config.variant} size="sm">
            <span className={cn("w-2 h-2 rounded-full mr-1.5", config.dot)} />
            {label || config.label}
        </Badge>
    );
}
