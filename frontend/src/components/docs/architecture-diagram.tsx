"use client";

import { motion } from "framer-motion";
import { Shield, CreditCard, Cloud, Server, Users, ArrowRight, Lock } from "lucide-react";

export function ArchitectureDiagram() {
    return (
        <div className="w-full py-12 px-6 bg-white/[0.02] border border-white/5 rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.02]" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 max-w-4xl mx-auto">

                {/* Client Side */}
                <div className="flex flex-col gap-4 items-center">
                    <div className="w-32 h-20 rounded-xl bg-slate-800/50 border border-slate-700/50 flex flex-col items-center justify-center gap-2">
                        <Users className="w-6 h-6 text-slate-400" />
                        <span className="text-xs font-mono text-slate-500">CLIENTS</span>
                    </div>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex flex-col items-center gap-2">
                    <motion.div
                        animate={{ x: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <ArrowRight className="w-5 h-5 text-slate-600" />
                    </motion.div>
                    <span className="text-[10px] font-mono text-slate-600">HTTPS / GRPC</span>
                </div>

                {/* THE KERNEL */}
                <div className="relative group">
                    <div className="absolute -inset-4 bg-indigo-500/20 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="w-48 h-48 rounded-2xl bg-[#050505] border border-indigo-500/30 flex flex-col relative overflow-hidden shadow-2xl shadow-indigo-900/20">
                        {/* Header */}
                        <div className="bg-indigo-950/30 p-3 border-b border-indigo-500/10 flex items-center justify-between">
                            <span className="text-xs font-black text-indigo-400">UNO.KERNEL</span>
                            <Shield className="w-3 h-3 text-indigo-400" />
                        </div>

                        {/* Layers */}
                        <div className="flex-1 p-3 flex flex-col gap-2 justify-center">
                            <div className="h-8 rounded bg-indigo-500/10 border border-indigo-500/10 flex items-center px-3 gap-2">
                                <Lock className="w-3 h-3 text-indigo-300" />
                                <span className="text-[10px] font-bold text-indigo-200">IDENTITY_LAYER</span>
                            </div>
                            <div className="h-8 rounded bg-purple-500/10 border border-purple-500/10 flex items-center px-3 gap-2">
                                <CreditCard className="w-3 h-3 text-purple-300" />
                                <span className="text-[10px] font-bold text-purple-200">BILLING_ENGINE</span>
                            </div>
                            <div className="h-8 rounded bg-emerald-500/10 border border-emerald-500/10 flex items-center px-3 gap-2">
                                <Server className="w-3 h-3 text-emerald-300" />
                                <span className="text-[10px] font-bold text-emerald-200">GOVERNANCE</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex flex-col items-center gap-2">
                    <motion.div
                        animate={{ x: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                    >
                        <ArrowRight className="w-5 h-5 text-slate-600" />
                    </motion.div>
                    <span className="text-[10px] font-mono text-slate-600">MANAGED I/O</span>
                </div>

                {/* Providers */}
                <div className="flex flex-col gap-3">
                    <div className="w-32 py-2 px-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-300">Stripe</span>
                    </div>
                    <div className="w-32 py-2 px-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                        <Cloud className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-300">AWS</span>
                    </div>
                    <div className="w-32 py-2 px-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                        <Server className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-300">OpenAI</span>
                    </div>
                </div>

            </div>

            <div className="text-center mt-8">
                <p className="text-xs text-slate-500 font-mono">
                    Fig 1.0 — Architecture of Sovereignty
                </p>
            </div>
        </div>
    );
}
