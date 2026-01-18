"use client";

import { useState, useEffect } from "react";
import { Shield, Zap, Lock, Eye, CheckCircle2, AlertTriangle, Plus, RefreshCw, Power, Terminal, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface KillSwitch {
    id: string;
    scope: string;
    active: boolean;
    reason: string;
    activated_at: string;
    expires_at?: string;
}

interface ActionPolicy {
    action_type: string;
    is_paused: boolean;
    reason?: string;
}

export default function GovernancePage() {
    const [killSwitches, setKillSwitches] = useState<KillSwitch[]>([]);
    const [globalStatus, setGlobalStatus] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Updated to use real backend endpoints
            const ksRes = await api.get("/admin/kill-switch");
            if (ksRes.data) {
                setGlobalStatus(ksRes.data.status || {});
                setKillSwitches(ksRes.data.switches || []);
            }
        } catch (err) {
            console.error("Governance fetch error", err);
            toast.error("Falha ao sincronizar governança.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleKillSwitch = async (scope: string, currentActive: boolean) => {
        setActionLoading(scope);
        try {
            if (currentActive) {
                // DELETE /admin/kill-switch/:scope to deactivate
                await api.delete(`/admin/kill-switch/${scope}`);
                toast.success(`Killswitch ${scope} desativado.`);
            } else {
                // POST /admin/kill-switch to activate
                await api.post(`/admin/kill-switch`, {
                    scope: scope,
                    reason: "Manual admin override",
                    expires_in: 60 // 1 hour default
                });
                toast.success(`Killswitch ${scope} ativado.`);
            }
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao alterar estado do Killswitch. Verifique permissões de Super Admin.");
        } finally {
            setActionLoading(null);
        }
    };

    const deactivateAll = async () => {
        if (!confirm("Isso irá retomar TODAS as operações do sistema. Confirmar?")) return;
        setLoading(true);
        try {
            await api.delete("/admin/kill-switch");
            toast.success("Todos os switches foram desativados.");
            fetchData();
        } catch (error) {
            toast.error("Erro ao desativar todos os switches.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-900/20 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-white">
                        Kernel <span className="text-red-500">Governance</span>
                    </h1>
                    <p className="text-zinc-500 mt-2 font-mono text-[10px] uppercase tracking-[0.3em]">Guardian Protocols & Sovereign Oversight</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={deactivateAll}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-500/10 font-bold text-[10px] uppercase tracking-widest border border-red-500/20"
                    >
                        Force Global Resume
                    </Button>
                    <Button
                        onClick={fetchData}
                        variant="outline"
                        size="icon"
                        className="border-white/5 bg-white/5 text-zinc-400 hover:text-white"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Emergency Protocol Status */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ShieldAlert className="w-16 h-16 text-red-500" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase text-red-500 tracking-[0.2em] mb-4">Guard Level Status</h3>

                        <div className="space-y-4">
                            {['all', 'billing', 'payments', 'agents', 'jobs'].map((scope) => (
                                <div key={scope} className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{scope}</span>
                                    <div className={cn(
                                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                                        globalStatus[scope] ? "bg-red-500 text-white animate-pulse" : "bg-emerald-500/10 text-emerald-500"
                                    )}>
                                        {globalStatus[scope] ? "BLOCKED" : "ACTIVE"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/20">
                        <div className="flex items-center gap-2 text-zinc-500 mb-4">
                            <Terminal className="w-3 h-3" />
                            <span className="text-[9px] font-black uppercase tracking-widest italic">Governance Log</span>
                        </div>
                        <div className="space-y-2 font-mono text-[8px] text-zinc-600 uppercase">
                            <p>[09:21] Policy: KYC_ENFORCEMENT verified</p>
                            <p>[08:45] Audit: Ledger integrity stable</p>
                            <p>[04:12] Invariant: Red-Alert silent</p>
                        </div>
                    </div>
                </div>

                {/* Kill Switch Controls */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                            <Zap className="w-4 h-4 text-red-500" />
                            Kill-Switch Registry
                        </h2>
                        <Button variant="outline" size="sm" className="border-red-500/20 bg-red-500/10 text-red-500 font-black text-[9px] uppercase tracking-widest h-7">
                            <Plus className="w-3 h-3 mr-1" /> Deploy Custom Switch
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading && killSwitches.length === 0 ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="h-32 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
                            ))
                        ) : (
                            ['all', 'billing', 'payments', 'agents', 'jobs', 'ads'].map((scope) => {
                                const ks = killSwitches.find(k => k.scope === scope);
                                const isActive = ks ? ks.active : (globalStatus[scope] || false);

                                return (
                                    <motion.div
                                        key={scope}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={cn(
                                            "p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden group",
                                            isActive
                                                ? "bg-red-500/10 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]"
                                                : "bg-zinc-900/20 border-white/5 hover:border-white/10"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                                                isActive ? "bg-red-500/20 text-red-500" : "bg-white/5 text-zinc-500"
                                            )}>
                                                {isActive ? <Lock className="w-6 h-6" /> : <Power className="w-6 h-6" />}
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => toggleKillSwitch(scope, isActive)}
                                                disabled={actionLoading === scope}
                                                className={cn(
                                                    "h-8 rounded-xl font-black text-[9px] uppercase tracking-widest px-4 transition-all shadow-lg",
                                                    isActive
                                                        ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                                                        : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
                                                )}
                                            >
                                                {actionLoading === scope ? "WAIT..." : (isActive ? "RESUME OPERATION" : "KILL SCOPE")}
                                            </Button>
                                        </div>

                                        <div className="relative z-10">
                                            <h4 className="text-white font-black text-sm uppercase tracking-tight">{scope}</h4>
                                            <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase truncate max-w-[200px]">
                                                {isActive ? (ks?.reason || "FORCED SYSTEM SUSPENSION") : "Nominal operational status."}
                                            </p>
                                        </div>

                                        {/* Background Decoration */}
                                        <div className={cn(
                                            "absolute -bottom-4 -right-4 w-24 h-24 blur-3xl rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-700",
                                            isActive ? "bg-red-500" : "bg-zinc-500"
                                        )} />
                                    </motion.div>
                                );
                            })
                        )}
                    </div>

                    {/* Shadow Mode Notification */}
                    <div className="p-8 rounded-[40px] border border-white/5 bg-gradient-to-br from-zinc-900 to-black relative overflow-hidden">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 shrink-0 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 shadow-2xl">
                                <Eye className="w-8 h-8 text-zinc-400" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-white font-black text-lg uppercase tracking-tighter leading-none italic">Neutral Governance</h3>
                                <p className="text-zinc-500 text-xs font-medium max-w-lg leading-relaxed">
                                    The system is currently operating under standard sovereignty protocols. All automated decisions are being executed after passing RED-INVARIANT checks.
                                </p>
                            </div>
                            <div className="ml-auto">
                                <Button variant="outline" className="border-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] h-10 px-8 rounded-2xl hover:bg-white/5">
                                    Audit Policies
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
