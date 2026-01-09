"use client";

import { motion } from "framer-motion";
import { Terminal, Lock, Globe, Database, ArrowRight } from "lucide-react";

export default function ApiReferencePage() {
    const endpoints = [
        { method: "POST", path: "/auth/login", desc: "Autenticação soberana e geração de tokens." },
        { method: "POST", path: "/events/track", desc: "Ingestão de eventos no Financial Pipeline." },
        { method: "GET", path: "/apps/mine", desc: "Recupera aplicações orquestradas pelo kernel." },
        { method: "GET", path: "/billing/usage", desc: "Métricas de consumo em tempo real." },
    ];

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 pb-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
            >
                <div className="space-y-4">
                    <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">
                        API <span className="text-indigo-500">Reference</span> <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-md ml-2">v1.0</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl">
                        A interface única para dominar gigantes. Documentação técnica exaustiva do Kernel UNO.
                    </p>
                </div>

                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Globe className="text-indigo-500 w-5 h-5" />
                        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Base URL</h2>
                    </div>
                    <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl font-mono text-indigo-400">
                        https://api.uno-kernel.so/v1
                    </div>
                </section>

                <section className="space-y-8">
                    <div className="flex items-center gap-3">
                        <Terminal className="text-indigo-500 w-5 h-5" />
                        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Endpoints Principais</h2>
                    </div>
                    <div className="grid gap-4">
                        {endpoints.map((ep, i) => (
                            <div key={i} className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${ep.method === 'POST' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                            {ep.method}
                                        </span>
                                        <code className="text-sm font-bold text-slate-200">{ep.path}</code>
                                    </div>
                                    <p className="text-xs text-slate-500">{ep.desc}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                            </div>
                        ))}
                    </div>
                </section>

                <div className="p-8 rounded-3xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <Lock className="text-amber-500 w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white mb-2 uppercase tracking-tight">Autenticação</h4>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Todas as requisições requerem o header <code className="text-amber-500 bg-amber-500/10 px-1 rounded">Authorization: Bearer &lt;TOKEN&gt;</code>.
                                Tokens podem ser obtidos via OAuth ou API Keys geradas no dashboard.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
