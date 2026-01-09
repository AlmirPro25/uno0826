"use client";

import { motion } from "framer-motion";
import { ChevronRight, Terminal, Copy, Check, Zap, Shield, Cpu } from "lucide-react";
import { useState } from "react";

export default function QuickstartPage() {
    const [copied, setCopied] = useState(false);
    const code = "npm install @uno/sdk";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm tracking-widest uppercase">
                        <Zap className="w-4 h-4" />
                        Guia Exclusivo
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
                        Início <span className="text-indigo-500">Rápido</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl">
                        Aprenda a orquestrar gigantes e dominar sua infraestrutura em menos de 5 minutos com o Kernel UNO.
                    </p>
                </div>

                <div className="grid gap-8 mt-12">
                    {/* Step 1 */}
                    <section className="space-y-4 relative pl-8 border-l-2 border-indigo-500/20">
                        <div className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">1</div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">Instalar o SDK Soberano</h3>
                        <p className="text-slate-400">
                            Integre a inteligência do kernel diretamente no seu projeto.
                        </p>
                        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4 flex items-center justify-between group">
                            <code className="text-indigo-400 font-mono text-sm">{code}</code>
                            <button
                                onClick={copyToClipboard}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-white"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </section>

                    {/* Step 2 */}
                    <section className="space-y-4 relative pl-8 border-l-2 border-indigo-500/20">
                        <div className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">2</div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">Inicializar o Kernel</h3>
                        <p className="text-slate-400">
                            Configure sua chave única para acessar todas as capacidades (Auth, Billing, Governance).
                        </p>
                        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-6 font-mono text-sm overflow-hidden">
                            <div className="flex gap-2 mb-4">
                                <div className="w-3 h-3 rounded-full bg-rose-500/20" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/20" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
                            </div>
                            <pre className="text-slate-300">
                                {`import { Uno } from '@uno/sdk';

const uno = new Uno({
  apiKey: process.env.UNO_KEY,
  environment: 'production'
});

// O UNO agora orquestra seus gigantes.`}
                            </pre>
                        </div>
                    </section>

                    {/* Step 3 */}
                    <section className="space-y-4 relative pl-8 border-l-2 border-indigo-500/20">
                        <div className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">3</div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">Emitir Primeiro Evento</h3>
                        <p className="text-slate-400">
                            Rastreie ações e processe cobranças automaticamente via ledger imutável.
                        </p>
                        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-6 font-mono text-sm">
                            <pre className="text-slate-300">
                                {`await uno.events.track({
  identityId: 'user_123',
  type: 'action.premium_feature',
  metadata: { project: 'alpha-x' }
});`}
                            </pre>
                        </div>
                    </section>
                </div>

                <div className="mt-12 p-8 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h4 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Pronto para a Soberania?</h4>
                            <p className="text-sm text-indigo-300">Explore a documentação completa da API e comece a escalar.</p>
                        </div>
                        <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-indigo-600/20">
                            Documentação Completa
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
