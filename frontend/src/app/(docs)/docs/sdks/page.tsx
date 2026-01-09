"use client";

import { motion } from "framer-motion";
import { Download, Terminal, CheckCircle2, Package, Gift } from "lucide-react";

export default function SdksPage() {
    const sdks = [
        { lang: "TypeScript/JS", version: "v2.8.4", cmd: "npm install @uno/sdk", icon: "📦" },
        { lang: "Python", version: "v1.4.2", cmd: "pip install uno-kernel", icon: "🐍" },
        { lang: "Go", version: "v0.9.1", cmd: "go get github.com/uno/uno-go", icon: "🐹" },
        { lang: "Rust", version: "v0.2.0 (Alpha)", cmd: "cargo add uno-kernel", icon: "🦀" },
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
                        Bibliotecas & <span className="text-indigo-500">SDKs</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl">
                        Acelere seu desenvolvimento com ferramentas oficiais projetadas para máxima eficiência e soberania.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {sdks.map((sdk, i) => (
                        <div key={i} className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="text-3xl">{sdk.icon}</span>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{sdk.lang}</h3>
                                        <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{sdk.version}</p>
                                    </div>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center cursor-pointer hover:bg-indigo-600 transition-colors">
                                    <Download className="w-5 h-5 text-slate-400 hover:text-white" />
                                </div>
                            </div>

                            <div className="bg-slate-900/50 p-4 rounded-xl font-mono text-xs text-slate-300 flex items-center justify-between group">
                                <code>{sdk.cmd}</code>
                                <Terminal className="w-4 h-4 text-slate-600 group-hover:text-indigo-500 transition-colors" />
                            </div>

                            <ul className="space-y-2">
                                {["Tipagem Completa", "Autoretentativa", "Ledger Offline"].map(feat => (
                                    <li key={feat} className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="p-12 rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white relative overflow-hidden shadow-2xl shadow-indigo-600/20">
                    <div className="relative z-10 text-center space-y-6">
                        <Gift className="w-12 h-12 mx-auto text-indigo-200" />
                        <h2 className="text-3xl font-black uppercase tracking-tight">Precisa de outra linguagem?</h2>
                        <p className="max-w-lg mx-auto text-indigo-100 leading-relaxed">
                            Nossa API é agnóstica. Se seu sistema fala HTTP/JSON, ele fala UNO.
                            Mas estamos sempre criando novos SDKs. Solicite um agora.
                        </p>
                        <button className="bg-white text-indigo-600 font-black py-4 px-12 rounded-2xl hover:scale-105 transition-transform uppercase tracking-widest text-sm">
                            Solicitar SDK
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
