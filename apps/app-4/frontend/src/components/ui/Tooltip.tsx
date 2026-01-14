import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
    children: ReactNode;
    content: string;
    position?: "top" | "bottom" | "left" | "right";
    delay?: number;
}

export function Tooltip({ children, content, position = "top", delay = 300 }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const showTooltip = () => {
        const id = setTimeout(() => setIsVisible(true), delay);
        setTimeoutId(id);
    };

    const hideTooltip = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        setIsVisible(false);
    };

    const positionClasses = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2",
    };

    const arrowClasses = {
        top: "top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-100 border-x-transparent border-b-transparent",
        bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-100 border-x-transparent border-t-transparent",
        left: "left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-100 border-y-transparent border-r-transparent",
        right: "right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-100 border-y-transparent border-l-transparent",
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className={`absolute z-50 ${positionClasses[position]}`}
                    >
                        <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm px-3 py-1.5 rounded-md whitespace-nowrap shadow-lg">
                            {content}
                        </div>
                        <div
                            className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Info icon with tooltip
interface InfoTooltipProps {
    content: string;
    position?: "top" | "bottom" | "left" | "right";
}

export function InfoTooltip({ content, position = "top" }: InfoTooltipProps) {
    return (
        <Tooltip content={content} position={position}>
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground text-xs cursor-help">
                ?
            </span>
        </Tooltip>
    );
}
