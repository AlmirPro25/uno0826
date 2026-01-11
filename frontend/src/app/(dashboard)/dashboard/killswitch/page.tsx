"use client";

import { useState, useEffect } from "react";
import { Power, AlertTriangle, Shield, CheckCircle, Clock, Ghost, RefreshCw, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/dashboard/app-header";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";

interface KillSwitchStatus {
    active: boolean;
    activated_at: string | null;
    activated_by: string;
    reason: string;
    auto_resume_at: string | null;
}

export default function KillSwitchPage() {
    const [status, setStatus] = useState<KillSwitchStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [showActivate, setShowActivate] = useState(false);
    const [activateForm, setActivateForm] = useState({
        reason: "",
        autoResume: "1h"
    });

    const formatRelativeTime = (timestamp: string | null) => {
        if (!timestamp) return null;
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        
        if (diffSec < 60) return `${diffSec}s atrás`;
        if (diffMin < 60) return `${diffMin}min atrás`;
        if (diffHour < 24) return `${diffHour}h atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    const fetchStatus = async () => {
        setLoading(true);
        try {
            // Usar endpoint do rules handler
            const res = await api.get("/admin/rules/killswitch");
            setStatus(res.data);
        } catch (error) {
            console.error("Failed to fetch kill switch status", error);
            setStatus(null);
        } finally {
            setLoading(false);
        }
    };

    const activateKillSwitch = async () => {
        if (!activateForm.reason) {
            toast.error("Motivo é obrigatório");
            return;
        }
        
        setActivating(true);
        try {
            await api.post("/admin/rules/killswitch/activate", {
                reason: activateForm.reason,
                auto_resume_after: activateForm.autoResume
            });
            toast.success("Kill Switch ativado - todas as ações automáticas pausadas");
            setShowActivate(false);
            setActivateForm({ reason: "", autoResume: "1h" });
            fetchStatus();
        } catch {
            toast.error("Falha ao ativar Kill Switch");
        } finally {
            setActivating(false);
        }
    };

    const deactivateKillSwitch = async () => {
        try {
            await api.post("/admin/rules/killswitch/deactivate", {});
            toast.success("Kill Switch desativado - ações automáticas retomadas");
            fetchStatus();
        } catch {
            toast.error("Falha ao desativar Kill Switch");
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />
            
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
                        <Power className="w-8 h-8 text-rose-400" />
                        Kill Switch
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Controle humano absoluto • Parar todas as ações automáticas
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchStatus}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </button>
                    {status?.active ? (
                        <button
                            onClick={deactivateKillSwitch}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-colors"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Retomar Operações
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowActivate(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-xl transition-colors"
                        >
                            <Power className="w-4 h-4" />
                            Ativar Kill Switch
                        </button>
                    )}
                </div>
            </div>

            {/* Status Banner */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "p-8 rounded-3xl border",
                        status?.active 
                            ? "bg-gradient-to-br from-rose-600/20 to-rose-600/5 border-rose-500/30" 
                            : "bg-gradient-to-br from-emerald-600/10 to-emerald-600/5 border-emerald-500/20"
                    )}
                >
                    <div className="flex items-start gap-6">
                        <div className={cn(
                            "w-20 h-20 rounded-2xl flex items-center justify-center",
                            status?.active ? "bg-rose-500/20" : "bg-emerald-500/20"
                        )}>
                            {status?.active ? (
                                <Power className="w-10 h-10 text-rose-400" />
                            ) : (
                                <Shield className="w-10 h-10 text-emerald-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className={cn(
                                "text-2xl font-black uppercase tracking-tight",
                                status?.active ? "text-rose-400" : "text-emerald-400"
                            )}>
                                {status?.active ? "Kill Switch Ativo" : "Sistema Operacional"}
                            </h2>
                            <p className="text-slate-400 mt-2">
                                {status?.active 
                                    ? "Todas as ações automáticas estão pausadas. Regras continuam sendo avaliadas mas não executam ações."
                                    : "O sistema está operando normalmente. Todas as regras e ações automáticas estão ativas."}
                            </p>
                            
                            {status?.active && (
                                <div className="mt-4 p-4 rounded-xl bg-black/20 border border-rose-500/20">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-widest">Ativado por</p>
                                            <p className="text-white font-bold mt-1">{status.activated_by}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-widest">Quando</p>
                                            <p className="text-white font-bold mt-1">{formatRelativeTime(status.activated_at)}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-slate-500 uppercase tracking-widest">Motivo</p>
                                            <p className="text-rose-300 mt-1">&ldquo;{status.reason}&rdquo;</p>
                                        </div>
                                        {status.auto_resume_at && (
                                            <div className="col-span-2">
                                                <p className="text-xs text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> Auto-resume
                                                </p>
                                                <p className="text-amber-400 mt-1">{formatRelativeTime(status.auto_resume_at)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Contrato de Controle Humano */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/5"
            >
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
                    Contrato de Controle Humano
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                        <Power className="w-5 h-5 text-rose-400 mb-2" />
                        <p className="text-sm text-slate-300 font-medium">Kill Switch</p>
                        <p className="text-xs text-slate-500 mt-1">
                            Para tudo imediatamente. Nenhuma ação automática executa.
                        </p>
                    </div>
                    <Link href="/dashboard/shadow" className="block">
                        <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20 hover:border-violet-500/40 transition-colors h-full">
                            <Ghost className="w-5 h-5 text-violet-400 mb-2" />
                            <p className="text-sm text-slate-300 font-medium">Shadow Mode</p>
                            <p className="text-xs text-slate-500 mt-1">
                                Simula sem executar. Veja o que aconteceria.
                            </p>
                        </div>
                    </Link>
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <Shield className="w-5 h-5 text-emerald-400 mb-2" />
                        <p className="text-sm text-slate-300 font-medium">Modo Normal</p>
                        <p className="text-xs text-slate-500 mt-1">
                            Sistema opera normalmente. Regras executam ações.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Warning */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-amber-400">Área de Controle Crítico</p>
                    <p className="text-xs text-amber-400/70 mt-1">
                        O Kill Switch é o último recurso de controle humano. Quando ativo, nenhuma regra executa ações reais,
                        mas o sistema continua observando e registrando. Use quando precisar de tempo para investigar
                        ou quando algo inesperado acontecer.
                    </p>
                </div>
            </div>

            {/* Activate Modal */}
            {showActivate && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowActivate(false)}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#0a0a0f] border border-rose-500/30 rounded-3xl p-8 w-full max-w-lg space-y-6" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
                                <Power className="w-6 h-6 text-rose-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Ativar Kill Switch</h2>
                                <p className="text-sm text-slate-500">Parar todas as ações automáticas</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                            <p className="text-sm text-rose-300">
                                <strong>Atenção:</strong> Ao ativar o Kill Switch, todas as regras continuarão sendo avaliadas,
                                mas nenhuma ação será executada. Webhooks, alertas e outras ações automáticas serão pausadas.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    Motivo (obrigatório)
                                </label>
                                <input
                                    type="text"
                                    value={activateForm.reason}
                                    onChange={(e) => setActivateForm({ ...activateForm, reason: e.target.value })}
                                    placeholder="Ex: Investigando comportamento anômalo"
                                    className="mt-2 w-full h-11 px-4 rounded-xl bg-white/[0.02] border border-white/10 text-white placeholder:text-slate-600 focus:border-rose-500/50 outline-none"
                                />
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    Auto-resume (opcional)
                                </label>
                                <select
                                    value={activateForm.autoResume}
                                    onChange={(e) => setActivateForm({ ...activateForm, autoResume: e.target.value })}
                                    className="mt-2 w-full h-11 px-3 rounded-xl bg-white/[0.02] border border-white/10 text-white"
                                >
                                    <option value="">Sem auto-resume</option>
                                    <option value="15m">15 minutos</option>
                                    <option value="30m">30 minutos</option>
                                    <option value="1h">1 hora</option>
                                    <option value="2h">2 horas</option>
                                    <option value="6h">6 horas</option>
                                    <option value="24h">24 horas</option>
                                </select>
                                <p className="text-xs text-slate-600 mt-1">
                                    O sistema voltará automaticamente ao normal após este período
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setShowActivate(false)}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={activateKillSwitch}
                                disabled={!activateForm.reason || activating}
                                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {activating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Power className="w-4 h-4" />
                                        Ativar Kill Switch
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
