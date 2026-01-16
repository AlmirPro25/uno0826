"use client";

import { Shield, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { TerminalReplay } from "@/components/auth/terminal-replay";
import { TestimonialCarousel } from "@/components/auth/testimonial-carousel";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);
    
    return (
        <div className="min-h-screen flex bg-background text-foreground overflow-hidden">
            {/* Left Side: Marketing/Propaganda */}
            <div className="hidden lg:flex lg:w-1/2 relative border-r border-border bg-black/40 flex-col relative overflow-hidden">
                {/* Dynamic Background */}
                <div className="absolute inset-0 bg-grid-white/[0.02]" />
                <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl" />

                {/* Content Container */}
                <div className="relative z-10 p-12 flex flex-col justify-between h-full max-w-2xl mx-auto w-full">
                    {/* Header */}
                    <div>
                        <Link href="/" className="flex items-center gap-3 mb-16 group w-fit">
                            <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10 group-hover:bg-indigo-500/20 transition-all">
                                <Shield className="text-indigo-400 w-5 h-5" />
                            </div>
                            <span className="font-black text-2xl tracking-tighter text-white">UNO<span className="text-indigo-500">.KERNEL</span></span>
                        </Link>

                        <motion.div
                            initial={mounted ? { opacity: 0, x: -20 } : false}
                            animate={mounted ? { opacity: 1, x: 0 } : false}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="text-5xl font-black mb-8 leading-[0.9] tracking-tighter">
                                DEPLOY <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">INTELLIGENCE.</span>
                            </h2>

                            {/* Terminal Replay Component - replacing video */}
                            <div className="mb-12">
                                <TerminalReplay />
                            </div>

                            <p className="text-lg text-slate-400 mb-10 max-w-lg leading-relaxed font-medium">
                                Identidade, billing e governança em uma única API soberana.
                                Construa o futuro sem reinventar a roda.
                            </p>

                            <div className="space-y-4">
                                {[
                                    "Identidade Federada e Soberana",
                                    "Billing de Eventos com Ledger Imutável",
                                    "Orquestração de Agentes IA",
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={mounted ? { opacity: 0, y: 10 } : false}
                                        animate={mounted ? { opacity: 1, y: 0 } : false}
                                        transition={{ delay: mounted ? 0.5 + (i * 0.1) : 0 }}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span className="font-medium text-slate-300 text-sm tracking-wide">{item}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Social Proof */}
                    <div className="pt-8 w-full">
                        <TestimonialCarousel />
                    </div>
                </div>

                {/* Decorative Blobs */}
                <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute top-40 -right-20 w-80 h-80 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
            </div>

            {/* Right Side: Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative bg-background">
                <div className="relative w-full max-w-[420px] z-10">
                    <div className="lg:hidden flex items-center gap-3 mb-12 justify-center">
                        <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                            <Shield className="text-indigo-400 w-5 h-5" />
                        </div>
                        <span className="font-black text-2xl tracking-tighter">UNO<span className="text-indigo-500">.KERNEL</span></span>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
