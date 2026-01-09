"use client";

import { useState, useEffect } from "react";
import { Shield, Zap, AlertTriangle, Lock, Eye, CheckCircle2, XCircle, Terminal, Activity, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Policy {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'inactive';
    type: string;
}

interface KillSwitch {
    id: string;
    component: string;
    active: boolean;
    reason: string;
    expires_at?: string;
}

export default function GovernancePage() {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [killSwitches, setKillSwitches] = useState<KillSwitch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [policiesRes, ksRes] = await Promise.all([
                    api.get("/policies"),
                    api.get("/killswitch/status").catch(() => ({ data: [] }))
                ]);
                setPolicies(policiesRes.data || []);
                setKillSwitches(ksRes.data || []);
            } catch (err) {
                console.error("Governance fetch error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="max-w-7xl space-y-12 pb-20">
            <div>
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                    GOVERNANÇA DO <span className="text-indigo-500">KERNEL</span>
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Protocolos de segurança, políticas de infraestrutura e chaves de emergência.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* Emergency Protocols - Kill Switches */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Zap className="w-4 h-4 text-rose-500" /> Protocolos de Emergência
                        </h3>
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>

                    <div className="grid gap-4">
                        <div className="p-6 rounded-[24px] bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/20 transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                                    <Lock className="w-5 h-5 text-rose-500" />
                                </div>
                                <Button size="sm" variant="outline" className="h-8 rounded-lg border-rose-500/20 text-rose-500 text-[10px] font-black uppercase hover:bg-rose-500 hover:text-white">
                                    Ativar KS
                                </Button>
                            </div>
                            <h4 className="text-sm font-bold text-white uppercase tracking-tight">Financial Pipeline</h4>
                            <p className="text-[10px] text-slate-500 mt-1 font-medium italic">Suspende instantaneamente qualquer fluxo financeiro de saída em todo o cluster.</p>
                        </div>

                        <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                </div>
                                <Button size="sm" variant="outline" className="h-8 rounded-lg border-white/10 text-slate-500 text-[10px] font-black uppercase hover:bg-white/5">
                                    Ativar KS
                                </Button>
                            </div>
                            <h4 className="text-sm font-bold text-white uppercase tracking-tight">Agent Execution</h4>
                            <p className="text-[10px] text-slate-500 mt-1 font-medium italic">Interrompe a execução de comandos por agentes autônomos.</p>
                        </div>
                    </div>
                </div>

                {/* Policies Registry */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Shield className="w-4 h-4 text-indigo-500" /> Registro de Políticas Ativas
                        </h3>
                        <Button variant="ghost" className="h-8 px-4 text-indigo-500 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/10">
                            + Nova Política
                        </Button>
                    </div>

                    <div className="bg-[#020617]/80 rounded-[32px] border border-white/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Política / ID</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Escopo</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-center text-slate-500 uppercase tracking-widest">Audit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { id: 'POL-821', name: 'Max Individual Spend', scope: 'Financial', status: 'Active' },
                                        { id: 'POL-904', name: 'Identity Rate Limiting', scope: 'Auth/API', status: 'Active' },
                                        { id: 'POL-332', name: 'Sovereign Data Pinning', scope: 'Kernel/DB', status: 'Shadow' },
                                    ].map((policy) => (
                                        <tr key={policy.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-bold text-white tracking-tight">{policy.name}</div>
                                                <div className="text-[10px] font-mono text-slate-600 mt-1 uppercase tracking-widest">{policy.id}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-[10px] font-black px-3 py-1 bg-white/5 text-slate-400 rounded-full uppercase tracking-widest">
                                                    {policy.scope}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "h-1.5 w-1.5 rounded-full",
                                                        policy.status === 'Active' ? "bg-indigo-500" : "bg-slate-700"
                                                    )} />
                                                    <span className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest",
                                                        policy.status === 'Active' ? "text-indigo-500" : "text-slate-500"
                                                    )}>
                                                        {policy.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center">
                                                    <Eye className="w-4 h-4 text-slate-700 group-hover:text-indigo-400 transition-colors cursor-pointer" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-8 bg-white/[0.01] flex items-center justify-between border-t border-white/5">
                            <div className="flex items-center gap-4">
                                <Activity className="w-4 h-4 text-emerald-500" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Taxa de Aplicação de Políticas: 100% (Real-time)</span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="h-8 px-4 border-white/10 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-white/5">Anterior</Button>
                                <Button variant="outline" className="h-8 px-4 border-white/10 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-white/5">Próximo</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Hardening Telemetry */}
            <div className="p-10 rounded-[40px] bg-gradient-to-br from-[#020617] to-indigo-950/20 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.05] pointer-events-none">
                    <Terminal className="w-64 h-64 text-indigo-500" />
                </div>

                <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                    <Activity className="w-5 h-5 text-emerald-500" /> Telemetria de Resiliência Financeira
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                    <div className="space-y-1">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Taxa de Idempotência</div>
                        <div className="text-3xl font-black text-white">100.0%</div>
                        <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-2 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Zero duplicated events
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rate Limit Score</div>
                        <div className="text-3xl font-black text-white">98.4%</div>
                        <div className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-2 flex items-center gap-1">
                            <Activity className="w-3 h-3" /> Optimal Throughput
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alertas de Fraude</div>
                        <div className="text-3xl font-black text-rose-500">00</div>
                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-2">Last 24 hours</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reconciliation Drift</div>
                        <div className="text-3xl font-black text-white">$0.00</div>
                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-2">Ledger in perfect sync</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
