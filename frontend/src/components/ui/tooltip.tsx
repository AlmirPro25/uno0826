"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
    content: string | React.ReactNode;
    children: React.ReactNode;
    side?: "top" | "bottom" | "left" | "right";
    delay?: number;
    className?: string;
}

export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
    const [isVisible, setIsVisible] = React.useState(false);
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    // Posições calculadas para o tooltip
    const positionClasses = {
        top: "-top-2 -translate-y-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "-bottom-2 translate-y-full left-1/2 -translate-x-1/2 mt-2",
        left: "-left-2 -translate-x-full top-1/2 -translate-y-1/2 mr-2",
        right: "-right-2 translate-x-full top-1/2 -translate-y-1/2 ml-2",
    };

    // Posições da "setinha"
    const arrowClasses = {
        top: "-bottom-1 left-1/2 -translate-x-1/2 border-b-0 border-r-0",
        bottom: "-top-1 left-1/2 -translate-x-1/2 border-t-0 border-l-0",
        left: "-right-1 top-1/2 -translate-y-1/2 border-l-0 border-b-0",
        right: "-left-1 top-1/2 -translate-y-1/2 border-r-0 border-t-0",
    };

    if (!isMounted) return <>{children}</>;

    return (
        <div
            className={`relative inline-flex items-center justify-center ${className || ""}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: side === "top" ? 5 : side === "bottom" ? -5 : 0, x: side === "left" ? 5 : side === "right" ? -5 : 0 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`absolute z-50 ${positionClasses[side]} pointer-events-none`}
                    >
                        <div className="relative px-3 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
                                {content}
                            </span>

                            {/* Arrow */}
                            <div className={`absolute w-2 h-2 bg-[#1a1a1a] border border-white/10 rotate-45 ${arrowClasses[side]}`} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
