"use client";

import { Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#020617] text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-600/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-grid-white/[0.02]" />
            </div>

            {/* Header */}
            <header className="relative z-10 px-6 h-20 flex items-center justify-center border-b border-white/5 bg-[#020617]/50 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Shield className="text-white w-6 h-6" />
                    </div>
                    <span className="font-black text-2xl tracking-tighter text-white">
                        UNO<span className="text-indigo-500">.KERNEL</span>
                    </span>
                </div>
            </header>

            {/* Content */}
            <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-5rem)] p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-2xl"
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
}
