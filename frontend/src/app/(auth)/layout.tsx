"use client";

import { Shield, Zap, Lock, Globe, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex bg-[#020617] text-white">
            {/* Left Side: Marketing/Propaganda */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-white/5 bg-[#020617]">
                <div className="absolute inset-0 bg-grid-white/[0.02]" />
                <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-indigo-500/10 to-transparent" />

                <div className="relative z-10 p-12 flex flex-col justify-between h-full">
                    <div>
                        <div className="flex items-center gap-3 mb-12">
                            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                                <Shield className="text-white w-6 h-6" />
                            </div>
                            <span className="font-bold text-2xl tracking-tighter">UNO.KERNEL</span>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="text-5xl font-black mb-6 leading-tight">
                                O Sistema Operacional <br />
                                para <span className="text-indigo-500">Sistemas Inteligentes.</span>
                            </h2>
                            <p className="text-xl text-slate-400 mb-12 max-w-lg">
                                Una identidade, economia e governança em uma única API soberana.
                                Domine a complexidade dos gigantes.
                            </p>

                            <div className="space-y-6">
                                {[
                                    "Identidade Federada e Soberana",
                                    "Billing de Eventos com Ledger Imutável",
                                    "Governança de Agentes IA em Tempo Real",
                                    "Observabilidade Total do Kernel"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        <span className="font-medium text-slate-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <p className="text-slate-400 text-sm italic mb-4">
                            "O UNO transformou nossa infraestrutura de billing e auth em algo invisível.
                            Ganhamos meses de produtividade focando no que importa."
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10" />
                            <div>
                                <p className="font-bold text-sm">Almir Miranda</p>
                                <p className="text-xs text-slate-500">Lead Developer, Intelligent Systems Inc.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full" />
            </div>

            {/* Right Side: Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-950/20 relative">
                <div className="absolute inset-0 bg-grid-white/[0.01] lg:hidden" />
                <div className="w-full max-w-md relative z-10">
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <Shield className="text-white w-5 h-5" />
                        </div>
                        <span className="font-bold text-xl tracking-tighter">UNO.KERNEL</span>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
