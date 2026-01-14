
import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, ...props }) => {
  return (
    <motion.div
      className={cn(
        "relative p-6 rounded-xl border border-white/[0.15] shadow-lg " +
        "bg-white/[0.05] backdrop-blur-md overflow-hidden " +
        "transition-all duration-300 ease-in-out " +
        "hover:border-primary/50 hover:shadow-xl",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
