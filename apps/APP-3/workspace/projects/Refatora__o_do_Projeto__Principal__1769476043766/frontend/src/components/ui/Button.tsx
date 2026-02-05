
import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className,
  ...props 
}) => {
  const baseStyles = "px-4 py-2 font-mono text-sm uppercase tracking-widest transition-all duration-200 border relative overflow-hidden group";
  
  const variants = {
    primary: "border-mars-cyan/30 text-mars-cyan hover:bg-mars-cyan/10 hover:border-mars-cyan",
    danger: "border-mars-red/50 text-mars-red hover:bg-mars-red/20 hover:border-mars-red animate-pulse-slow",
    ghost: "border-transparent text-gray-400 hover:text-white"
  };

  return (
    <button 
      className={clsx(baseStyles, variants[variant], className)} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isLoading ? 'SYNCING...' : children}
      </span>
      {/* Decorative corner bits */}
      <div className="absolute top-0 left-0 w-1 h-1 bg-current opacity-50" />
      <div className="absolute bottom-0 right-0 w-1 h-1 bg-current opacity-50" />
    </button>
  );
};
