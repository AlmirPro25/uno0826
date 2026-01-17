"use client";

import { useState, useEffect } from "react";
import { Shield, Zap, Lock, Eye, CheckCircle2, AlertTriangle, Plus, RefreshCw, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface Policy {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'inactive' | 'shadow';
    scope: string;
    created_at?: string;
}

interface KillSwitch {
    id: string;
    component: string;
    status: 'active' | 'inactive';
    reason?: string;
    updated_at?: string;
}

export default function GovernancePage() {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [killSwitches, setKillSwitches] = useState<KillSwitch[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [policiesRes, ksRes] = await Promise.all([
                api.get("/policies").catch(() => ({ data: [] })),
                api.get("/killswitch/status").catch(() => ({ data: [] }))
            ]);
            setPolicies(policiesRes.data || []);
            setKillSwitches(ksRes.data || []);
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

    const toggleKillSwitch = async (component: string, currentStatus: string) => {
        setActionLoading(component);
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try {
            // Tentativa de alternar o status - ajustado para padrao RESTful comum se não houver doc específica
            await api.post(`/killswitch/${component}/${newStatus}`);
            toast.success(`Killswitch ${component} atualizado para ${newStatus.toUpperCase()}`);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao alterar estado do Killswitch. Verifique permissões.");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="max-w-7xl space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                        GOVERNANÇA DO <span className="text-indigo-500">KERNEL</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Protocolos de segurança e políticas ativas.</p>
                </div>
                <Button
                    onClick={fetchData}
                    variant="outline"
                    size="icon"
                    className="border-white/10 text-slate-400 hover:text-white"
                >
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* Emergency Protocols - Kill Switches */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Zap className="w-4 h-4 text-rose-500" /> Protocolos de Emergência
                        </h3>
                        {killSwitches.some(k => k.status === 'active') && (
                            <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                        )}
                    </div>

                    <div className="grid gap-4">
                        {loading && killSwitches.length === 0 ? (
                            <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 text-center animate-pulse">
                                <p className="text-[10px] uppercase font-bold text-slate-600">Verificando protocolos...</p>
                            </div>
                        ) : killSwitches.length === 0 ? (
                            <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 text-center">
                                <p className="text-[10px] uppercase font-bold text-slate-600">Nenhum protocolo configurado</p>
                            </div>
                        ) : (
                            killSwitches.map((ks) => (
                                <div key={ks.id || ks.component} className={cn(
                                    "p-6 rounded-[24px] border transition-all",
                                    ks.status === 'active'
                                        ? "bg-rose-500/5 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
                                        : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                )}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center",
                                            ks.status === 'active' ? "bg-rose-500/10" : "bg-white/5"
                                        )}>
                                            {ks.status === 'active' ? <Lock className="w-5 h-5 text-rose-500" /> : <Power className="w-5 h-5 text-slate-500" />}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={ks.status === 'active' ? "default" : "outline"}
                                            onClick={() => toggleKillSwitch(ks.component, ks.status)}
                                            disabled={actionLoading === ks.component}
                                            className={cn(
                                                "h-8 rounded-lg text-[10px] font-black uppercase",
                                                ks.status === 'active' ? "bg-rose-500 hover:bg-rose-600 text-white" : "border-white/10 text-slate-500 hover:bg-white/5"
                                            )}
                                        >
                                            {actionLoading === ks.component ? "..." : (ks.status === 'active' ? "DESATIVAR KS" : "ATIVAR KS")}
                                        </Button>
                                    </div>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-tight">{ks.component}</h4>
                                    <p className="text-[10px] text-slate-500 mt-1 font-medium italic">
                                        {ks.status === 'active' ? "PROTOCOLO ATIVO - SISTEMA BLOQUEADO" : "Operação normal."}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Policies Registry */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Shield className="w-4 h-4 text-indigo-500" /> Registro de Políticas Ativas
                        </h3>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" className="h-8 px-4 text-indigo-500 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/10">
                                    <Plus className="w-3 h-3 mr-2" /> Nova Política
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950 border-white/10 text-white">
                                <DialogHeader>
                                    <DialogTitle>Nova Política de Governança</DialogTitle>
                                    <DialogDescription>
                                        Defina uma nova regra para o Kernel. Esta ação será auditada.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <p className="text-sm text-slate-500">Funcionalidade de criação via interface em desenvolvimento no backend.</p>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="bg-[#020617]/80 rounded-[32px] border border-white/5 overflow-hidden min-h-[300px]">
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
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center text-slate-600 text-[10px] uppercase font-bold tracking-widest">
                                                Auditando sistema...
                                            </td>
                                        </tr>
                                    ) : policies.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center text-slate-600 text-[10px] uppercase font-bold tracking-widest">
                                                Nenhuma política ativa encontrada.
                                            </td>
                                        </tr>
                                    ) : (
                                        policies.map((policy) => (
                                            <tr key={policy.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="text-sm font-bold text-white tracking-tight">{policy.name}</div>
                                                    <div className="text-[10px] font-mono text-slate-600 mt-1 uppercase tracking-widest">{policy.id}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-[10px] font-black px-3 py-1 bg-white/5 text-slate-400 rounded-full uppercase tracking-widest">
                                                        {policy.scope || "Global"}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "h-1.5 w-1.5 rounded-full",
                                                            policy.status === 'active' ? "bg-indigo-500" : "bg-slate-700"
                                                        )} />
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest",
                                                            policy.status === 'active' ? "text-indigo-500" : "text-slate-500"
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
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
