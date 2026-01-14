
"use client";

import React, { useRef, useEffect } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';

interface ScrollAnimationWrapperProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  initial?: string; // e.g., "hidden"
  animate?: string; // e.g., "visible"
  variants?: {
    [key: string]: {
      opacity?: number;
      y?: number;
      x?: number;
      scale?: number;
      transition?: object;
    };
  };
  className?: string;
  amount?: "some" | "all" | number; // IntersectionObserver `threshold`
  once?: boolean; // Only animate once
}

export function ScrollAnimationWrapper({
  children,
  delay = 0,
  duration = 0.8,
  initial = "hidden",
  animate = "visible",
  variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.2, ease: "easeOut" } },
  },
  className,
  amount = 0.5, // Default to 50% visible for trigger
  once = true,
}: ScrollAnimationWrapperProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount, once });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start(animate);
    } else if (!once) { // Reset if not once
      controls.start(initial);
    }
  }, [isInView, controls, animate, initial, once]);

  const defaultVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration, delay, ease: "easeOut" } },
  };

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={controls}
      variants={variants || defaultVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
