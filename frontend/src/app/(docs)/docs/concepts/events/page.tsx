"use client";

import { motion } from "framer-motion";
import { Activity, Database, Shield, Zap } from "lucide-react";

export default function EventsPage() {
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
                        Economia de <span className="text-indigo-500">Eventos</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl">
                        No Kernel UNO, cada ação é um evento. Cada evento é uma transição de estado na economia do seu sistema.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                            <Database className="text-indigo-500 w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Ledger Imutável</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Todos os eventos são gravados em um ledger append-only. Isso garante auditoria total e a impossibilidade de divergências financeiras.
                        </p>
                    </div>

                    <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                            <Zap className="text-emerald-500 w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Financial Pipeline</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Eventos de uso fluem automaticamente para o pipeline financeiro, orquestrando cobranças via Stripe ou Mercado Pago sem código extra.
                        </p>
                    </div>
                </div>

                <section className="space-y-6 pt-8">
                    <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Estrutura de um Evento</h3>
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 font-mono text-sm leading-relaxed">
                        <pre className="text-slate-300">
                            {`{
  "type": "api.vision.process",
  "identityId": "uid_019283",
  "timestamp": "2024-12-30T10:00:00Z",
  "payload": {
    "tokens": 150,
    "model": "gpt-4o"
  },
  "governance": {
    "allowed": true,
    "policyId": "pol_premium_only"
  }
}`}
                        </pre>
                    </div>
                </section>
            </motion.div>
        </div>
    );
}
