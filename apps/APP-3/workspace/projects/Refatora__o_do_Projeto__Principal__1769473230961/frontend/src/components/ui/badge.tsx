
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const styles = {
    default: "bg-tactical-panel border-tactical-border text-white",
    success: "bg-tactical-green/10 border-tactical-green/30 text-tactical-green",
    warning: "bg-yellow-500/10 border-yellow-500/30 text-yellow-500",
    danger: "bg-tactical-orange/10 border-tactical-orange/30 text-tactical-orange",
    neutral: "bg-gray-800 border-gray-700 text-gray-400"
  };

  return (
    <span className={cn("px-2 py-0.5 text-[10px] font-mono border rounded-sm uppercase tracking-widest", styles[variant], className)}>
      {children}
    </span>
  );
}
