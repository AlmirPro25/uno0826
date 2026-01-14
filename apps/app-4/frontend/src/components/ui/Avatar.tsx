import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface AvatarProps {
    src?: string | null;
    alt?: string;
    name?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    className?: string;
}

const sizeStyles = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-xl",
};

const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
};

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function getColorFromName(name: string): string {
    const colors = [
        "bg-red-500",
        "bg-orange-500",
        "bg-amber-500",
        "bg-yellow-500",
        "bg-lime-500",
        "bg-green-500",
        "bg-emerald-500",
        "bg-teal-500",
        "bg-cyan-500",
        "bg-sky-500",
        "bg-blue-500",
        "bg-indigo-500",
        "bg-violet-500",
        "bg-purple-500",
        "bg-fuchsia-500",
        "bg-pink-500",
        "bg-rose-500",
    ];
    const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
}

export function Avatar({ src, alt, name, size = "md", className }: AvatarProps) {
    if (src) {
        return (
            <img
                src={src}
                alt={alt || name || "Avatar"}
                className={cn(
                    "rounded-full object-cover",
                    sizeStyles[size],
                    className
                )}
            />
        );
    }

    if (name) {
        return (
            <div
                className={cn(
                    "rounded-full flex items-center justify-center text-white font-medium",
                    sizeStyles[size],
                    getColorFromName(name),
                    className
                )}
                title={name}
            >
                {getInitials(name)}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "rounded-full flex items-center justify-center bg-muted text-muted-foreground",
                sizeStyles[size],
                className
            )}
        >
            <User className={iconSizes[size]} />
        </div>
    );
}

// Avatar with online status indicator
interface AvatarWithStatusProps extends AvatarProps {
    isOnline?: boolean;
}

export function AvatarWithStatus({ isOnline, ...props }: AvatarWithStatusProps) {
    return (
        <div className="relative inline-block">
            <Avatar {...props} />
            {isOnline !== undefined && (
                <span
                    className={cn(
                        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background",
                        isOnline ? "bg-green-500" : "bg-gray-400"
                    )}
                />
            )}
        </div>
    );
}
