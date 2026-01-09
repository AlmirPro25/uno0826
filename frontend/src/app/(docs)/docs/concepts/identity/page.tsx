"use client";

import { motion } from "framer-motion";
import { User, Shield, Globe, Lock, Fingerprint } from "lucide-react";

export default function IdentityPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div className="space-y-4 text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest leading-none">
                        Core Concepts
                    </div>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">
                        Identidade <span className="text-indigo-500">Soberana</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl">
                        A base de tudo no Kernel UNO. Uma identidade unificada que transcende plataformas e centraliza sua presença digital.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { icon: Shield, title: "Sovereign", desc: "Você é dono dos seus dados e chaves, sempre." },
                        { icon: Globe, title: "Federated", desc: "Login único via Google, GitHub ou Apple, orquestrado pelo Kernel." },
                        { icon: Fingerprint, title: "Auditable", desc: "Cada sessão e mudança de perfil é registrada no Audit Log." }
                    ].map((item, i) => (
                        <div key={i} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
                            <item.icon className="text-indigo-500 w-6 h-6" />
                            <h3 className="font-bold text-white uppercase text-xs tracking-widest">{item.title}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="p-8 rounded-3xl bg-indigo-600 border border-indigo-400 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-2xl font-black uppercase mb-4 leading-tight">O Fim das Chaves Espalhadas</h3>
                        <p className="text-indigo-100 mb-6 max-w-lg leading-relaxed">
                            Com o Identity Kernel, sua aplicação não lida com senhas ou OAuth complexos. O UNO resolve a identidade e entrega um ID soberano e verificado.
                        </p>
                        <div className="flex gap-4">
                            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold">Criptografia de Ponta</p>
                                <p className="text-xs text-indigo-200">Segurança de nível bancário em todas as transações de identidade.</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 p-8 opacity-20">
                        <Shield className="w-48 h-48 -rotate-12" />
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
