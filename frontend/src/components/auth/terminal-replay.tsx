"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const BOOT_SEQUENCE = [
    { text: "INITIALIZING_KERNEL_V2.8.4...", delay: 200 },
    { text: "LOADING_MODULES [AUTH, GOVERNANCE, BILLING]...", delay: 600 },
    { text: "ESTABLISHING_SECURE_UPLINK...", delay: 400 },
    { text: "CHECKING_INTEGRITY... [OK]", delay: 500 },
    { text: "MOUNTING_FILESYSTEM [ENCRYPTED]...", delay: 800 },
    { text: "STARTING_SERVICES...", delay: 300 },
    { text: "> SERVICE_REGISTRY... [ACTIVE]", delay: 400 },
    { text: "> IDENTITY_PROVIDER... [ACTIVE]", delay: 400 },
    { text: "> EVENT_BUS... [ACTIVE]", delay: 400 },
    { text: "KERNEL_READY. WAITING_FOR_INPUT.", delay: 1000 },
];

export function TerminalReplay() {
    const [lines, setLines] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex >= BOOT_SEQUENCE.length) {
            // Reset after a pause to loop
            const timeout = setTimeout(() => {
                setLines([]);
                setCurrentIndex(0);
            }, 5000);
            return () => clearTimeout(timeout);
        }

        const currentStep = BOOT_SEQUENCE[currentIndex];
        const timeout = setTimeout(() => {
            setLines((prev) => [...prev, currentStep.text]);
            setCurrentIndex((prev) => prev + 1);
        }, currentStep.delay);

        return () => clearTimeout(timeout);
    }, [currentIndex]);

    return (
        <div className="font-mono text-[10px] md:text-xs leading-relaxed text-slate-400 p-6 rounded-xl bg-black/50 border border-white/5 backdrop-blur-md w-full max-w-lg shadow-2xl h-64 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-6 bg-white/5 border-b border-white/5 flex items-center px-3 gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                <span className="ml-2 opacity-50">boot_sequence.sh</span>
            </div>
            <div className="mt-6 flex flex-col font-mono">
                {lines.map((line, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-emerald-500/80"
                    >
                        <span className="text-slate-600 mr-2">$</span>
                        {line}
                    </motion.div>
                ))}
                <motion.div
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-2 h-4 bg-emerald-500/50 mt-1"
                />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>
    );
}
