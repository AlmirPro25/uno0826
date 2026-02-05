
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'tactical' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'tactical', size = 'md', ...props }, ref) => {
    const variants = {
      tactical: "bg-tactical-green/10 text-tactical-green border border-tactical-green/30 hover:bg-tactical-green/20 hover:border-tactical-green",
      danger: "bg-tactical-orange/10 text-tactical-orange border border-tactical-orange/30 hover:bg-tactical-orange/20 hover:border-tactical-orange animate-pulse-fast",
      ghost: "bg-transparent text-tactical-muted hover:text-white"
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 py-2",
      lg: "h-12 px-6 text-lg"
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-mono font-medium uppercase tracking-wider transition-all disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
