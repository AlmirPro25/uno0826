"use client";

import { Activity, ArrowRight } from "lucide-react";

export default function EventsConceptPage() {
    return (
        <div className="space-y-12 max-w-4xl">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-500 font-bold text-sm tracking-widest uppercase">
                    <Activity className="w-4 h-4" />
                    Conceitos
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                    Sistema de <span className="text-blue-500">Eventos</span>
                </h1>
                <p className="text-lg text-slate-400">
                    Eventos são a unidade fundamental de comunicação no PROST-QS. 
                    Toda ação significativa gera um evento imutável.
                </p>
            </div>

            {/* Core Concept */}
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Princípio Central</h2>
                <p className="text-slate-400 mb-4">
                    <strong className="text-white">Apps não calculam. Apps emitem. O kernel observa.</strong>
                </p>
                <p className="text-slate-500 text-sm">
                    Seu aplicativo emite eventos descrevendo o que aconteceu. O PROST-QS processa, 
                    aplica regras, calcula billing e mantém audit trail automaticamente.
                </p>
            </div>

            {/* Event Structure */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Estrutura de um Evento</h2>
                <div className="bg-black/30 border border-white/10 rounded-xl p-4 font-mono text-sm">
                    <pre className="text-slate-300">{`{
  "type": "user.subscription.created",
  "app_id": "app_xxxxx",
  "user_id": "usr_xxxxx",
  "data": {
    "plan": "pro",
    "amount": 9900,
    "currency": "BRL"
  },
  "metadata": {
    "source": "checkout",
    "ip": "192.168.1.1"
  },
  "timestamp": "2026-01-10T10:00:00Z"
}`}</pre>
                </div>
            </div>

            {/* Event Types */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Tipos de Eventos</h2>
                <div className="grid gap-3">
                    {[
                        { type: "user.*", desc: "Eventos de usuário (login, registro, update)" },
                        { type: "payment.*", desc: "Eventos financeiros (charge, refund, dispute)" },
                        { type: "agent.*", desc: "Ações de agentes autônomos" },
                        { type: "system.*", desc: "Eventos internos do kernel" },
                    ].map((item) => (
                        <div key={item.type} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                            <code className="text-blue-400 font-mono text-sm bg-blue-500/10 px-2 py-1 rounded">{item.type}</code>
                            <span className="text-slate-400 text-sm">{item.desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Flow */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Fluxo de Processamento</h2>
                <div className="flex items-center gap-4 flex-wrap">
                    {["App emite evento", "Kernel valida", "Rules Engine avalia", "Billing calcula", "Audit registra"].map((step, i) => (
                        <div key={step} className="flex items-center gap-2">
                            <div className="px-4 py-2 bg-white/[0.02] border border-white/10 rounded-xl text-sm text-white font-medium">
                                {step}
                            </div>
                            {i < 4 && <ArrowRight className="w-4 h-4 text-slate-600" />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Code Example */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Exemplo de Uso</h2>
                <div className="bg-black/30 border border-white/10 rounded-xl p-4 font-mono text-sm">
                    <pre className="text-slate-300">{`// Emitir evento via SDK
await prostqs.events.emit({
  type: "user.action.completed",
  data: {
    action: "purchase",
    item_id: "prod_123",
    amount: 4990
  }
});`}</pre>
                </div>
            </div>
        </div>
    );
}
