"use client";

import { useState, useEffect } from "react";
import { Brain, Zap, Terminal, Activity, ChevronRight, MessageSquare, History, Search, Cpu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Narrative {
    text: string;
    timestamp: string;
}

export default function IntelligencePage() {
    const [narrative, setNarrative] = useState<Narrative | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNarrative = async () => {
            try {
                const res = await api.get("/admin/narrator/interpret");
                setNarrative(res.data);
            } catch (err) {
                console.error("Narrator fetch error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchNarrative();
    }, []);

    return (
        <div className="max-w-7xl space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                        CENTRO DE <span className="text-indigo-500">INTELIGÊNCIA</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Narrativa cognitiva em tempo real e análise de decisões autônomas.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                        <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">IA Narrator Online</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

                {/* Cognitive Narrator - Main Window */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="group relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[40px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                        <div className="relative bg-[#020617] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
                            <div className="flex items-center justify-between px-10 py-6 border-b border-white/5 bg-white/[0.01]">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <Brain className="w-5 h-5 text-indigo-500" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">Cognitive Narrator v1.0</span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Analisando telemetria...</span>
                                </div>
                            </div>

                            <div className="p-10 min-h-[400px] flex flex-col justify-between">
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="h-10 w-10 shrink-0 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                            <MessageSquare className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-xl font-medium text-slate-300 leading-relaxed italic">
                                                {loading ? "Sintonizando fluxos neurais para interpretação..." :
                                                    narrative?.text || "O sistema apresenta estabilidade nominal. Todas as políticas de governança estão sendo aplicadas sem fricção. Detecto uma otimização no fluxo financeiro de saída nos últimos 5 minutos."}
                                            </p>
                                            <div className="h-px w-20 bg-indigo-500/30" />
                                            <div className="flex gap-6">
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Tensão no Cluster</div>
                                                    <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full w-[12%] bg-indigo-500" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Confiança Preditiva</div>
                                                    <div className="text-sm font-black text-white">99.2%</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 flex items-center justify-between pt-10 border-t border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-6 w-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                                    <Cpu className="w-3 h-3 text-slate-500" />
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Fontes: Ledger, Auth, Financial Pipeline</span>
                                    </div>
                                    <Button variant="ghost" className="h-8 group/btn text-indigo-500 text-[10px] font-black uppercase tracking-widest hover:bg-transparent">
                                        Deep Dive <ChevronRight className="w-3 h-3 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Explainability Timeline - Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <History className="w-4 h-4 text-indigo-500" /> Timeline de Decisões
                    </h3>

                    <div className="space-y-4">
                        {[
                            { time: '2m atrás', event: 'POL-821 Triggered', desc: 'Auto-throttle: App #43' },
                            { time: '15m atrás', event: 'Audit Pass', desc: 'Sync: Stripe Ledger' },
                            { time: '1h atrás', event: 'Anomaly Detect', desc: 'Refused: Admin ID override' },
                        ].map((item, i) => (
                            <div key={i} className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all cursor-pointer group">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{item.time}</span>
                                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform" />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-widest group-hover:text-indigo-400 transition-colors">{item.event}</h4>
                                <p className="text-[10px] text-slate-500 mt-1 font-medium">{item.desc}</p>
                            </div>
                        ))}

                        <Button variant="outline" className="w-full h-12 rounded-2xl border-white/5 bg-white/[0.01] text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-white/5">
                            Ver Histórico Completo
                        </Button>
                    </div>
                </div>

            </div>

            {/* Matrix of Autonomy Status */}
            <div className="p-10 rounded-[40px] bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Matriz de Autonomia Global</h3>
                    </div>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sistema Auto-Gerenciado</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                    {[
                        { label: 'Percepção', val: 94 },
                        { label: 'Raciocínio', val: 88 },
                        { label: 'Decisão', val: 92 },
                        { label: 'Hardenining', val: 99 },
                        { label: 'Ética/Regras', val: 100 },
                    ].map(stat => (
                        <div key={stat.label} className="space-y-3">
                            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{stat.label}</div>
                            <div className="h-1 w-full bg-white/5 rounded-full">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${stat.val}%` }} />
                            </div>
                            <div className="text-lg font-black text-white">{stat.val}%</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
