/**
 * LOADING STATE - Indicadores de carregamento consistentes
 * 
 * Latência perceptiva: mesmo quando rápido, mostrar que algo acontece.
 */

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "indigo" | "emerald" | "violet" | "rose" | "white";
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

const colorClasses = {
  indigo: "text-indigo-500",
  emerald: "text-emerald-500",
  violet: "text-violet-500",
  rose: "text-rose-500",
  white: "text-white",
};

export function LoadingSpinner({ 
  size = "md", 
  color = "indigo",
  className 
}: LoadingSpinnerProps) {
  return (
    <Loader2 className={cn(
      "animate-spin",
      sizeClasses[size],
      colorClasses[color],
      className
    )} />
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = "Carregando..." }: LoadingOverlayProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-slate-500 font-medium">{message}</p>
    </div>
  );
}

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <span className={cn("inline-flex gap-1", className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
    </span>
  );
}

interface PulseIndicatorProps {
  active?: boolean;
  color?: "emerald" | "indigo" | "violet" | "rose" | "amber";
  size?: "sm" | "md" | "lg";
}

const pulseColors = {
  emerald: "bg-emerald-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
  amber: "bg-amber-500",
};

const pulseSizes = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
  lg: "h-3 w-3",
};

export function PulseIndicator({ 
  active = true, 
  color = "emerald",
  size = "md"
}: PulseIndicatorProps) {
  return (
    <div className={cn(
      "rounded-full",
      pulseSizes[size],
      active ? pulseColors[color] : "bg-slate-600",
      active && "animate-pulse"
    )} />
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn(
      "animate-pulse bg-white/5 rounded",
      className
    )} />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}
