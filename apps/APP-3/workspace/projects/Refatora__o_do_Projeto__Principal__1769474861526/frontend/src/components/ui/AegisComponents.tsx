
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";
import { ReactNode } from "react";

// UTILS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// COMPONENT: PANEL
export const TacticalPanel = ({ children, className, title, icon: Icon }: { children: ReactNode, className?: string, title?: string, icon?: any }) => (
  <div className={cn("border border-aegis-green bg-aegis-panel flex flex-col relative overflow-hidden", className)}>
    <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
    {title && (
      <div className="bg-aegis-dark-green border-b border-aegis-green p-2 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-aegis-green animate-pulse" />}
        <h2 className="text-sm font-bold tracking-widest text-glow">{title}</h2>
      </div>
    )}
    <div className="p-3 flex-1 overflow-auto relative z-10">
      {children}
    </div>
  </div>
);

// COMPONENT: BUTTON
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'warning' | 'ghost';
}

export const TacButton = ({ className, variant = 'primary', ...props }: ButtonProps) => {
  const baseStyles = "border px-3 py-2 text-xs font-bold transition-all hover:bg-opacity-20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  const variants = {
    primary: "border-aegis-green text-aegis-green hover:bg-aegis-green hover:text-black hover:shadow-[0_0_15px_#33ff33]",
    danger: "border-aegis-alert text-aegis-alert hover:bg-aegis-alert hover:text-white",
    warning: "border-aegis-warn text-aegis-warn hover:bg-aegis-warn hover:text-black",
    ghost: "border-transparent text-aegis-green hover:bg-aegis-green/20"
  };

  return (
    <button className={cn(baseStyles, variants[variant], className)} {...props} />
  );
};

// COMPONENT: PROGRESS
export const ProgressBar = ({ value, max, color = "bg-aegis-green" }: { value: number, max: number, color?: string }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className="w-full h-2 bg-aegis-dark-green border border-aegis-green/30 mt-1 relative overflow-hidden">
      <motion.div 
        className={cn("h-full", color)}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      {/* Glitch effect overlay */}
      <div className="absolute inset-0 bg-white/10 w-full h-full animate-pulse opacity-20" />
    </div>
  );
};

// COMPONENT: BADGE
export const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    IDLE: "text-aegis-green border-aegis-green",
    DEPLOYED: "text-aegis-warn border-aegis-warn animate-pulse",
    KIA: "text-aegis-alert border-aegis-alert line-through",
    REPAIRING: "text-blue-400 border-blue-400",
  };
  
  const style = colors[status] || "text-gray-500 border-gray-500";

  return (
    <span className={cn("text-[10px] border px-1 py-0.5 rounded-sm", style)}>
      {status}
    </span>
  );
};

// COMPONENT: INPUT FIELD
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const TacInput = ({ label, error, className, ...props }: InputProps) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-xs opacity-70">{label}</label>}
    <input
      className={cn(
        "bg-aegis-dark-green border border-aegis-green/50 p-2 text-sm text-aegis-green focus:outline-none focus:border-aegis-warn focus:shadow-[0_0_5px_rgba(255,204,0,0.5)]",
        error ? "border-aegis-alert focus:border-aegis-alert focus:shadow-[0_0_5px_rgba(255,51,51,0.5)]" : "",
        className
      )}
      {...props}
    />
    {error && <p className="text-aegis-alert text-xs mt-1">{error}</p>}
  </div>
);
