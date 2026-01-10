"use client";

import { useState, useEffect } from "react";
import { Power, AlertTriangle, Shield, CheckCircle } from "lucide-react";
import { AppHeader } from "@/components/dashboard/app-header";

interface KillSwitch {
    id: string;
    name: string;
    target_type: string;
    target_id: string;
    reason: string;
    activated_by: string;
    status: "active" | "expired" | "revoked";
    created_at: string;
    expires_at: string | null;
}

const mockKillSwitches: KillSwitch[] = [];

export default function KillSwitchPage() {
    const [switches, setSwitches] = useState<KillSwitch[]>([]);
    const [loading, setLoading] = useState(true);
    const [showActivate, setShowActivate] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setSwitches(mockKillSwitches);
            setLoading(false);
        }, 500);
    }, []);

    return (
        <div className="space-y-6">
            <AppHeader />
            
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Kill Switch</h1>
                    <p className="text-sm text-slate-400 mt-1">Controle de emergência para parar operações críticas</p>
                </div>
                <button
                    onClick={() => setShowActivate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-xl transition-colors"
                >
                    <Power className="w-4 h-4" />
                    Ativar Kill Switch
                </button>
            </div>

            {/* Warning Banner */}
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-rose-400">Área Crítica</p>
                    <p className="text-xs text-rose-400/70 mt-1">
                        Kill Switches param operações imediatamente. Use apenas em emergências.
                        Todas as ativações são registradas e notificadas.
                    </p>
                </div>
            </div>

            {/* Status */}
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-500/20">
                        <Shield className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Sistema Operacional</h2>
                        <p className="text-sm text-slate-400">Nenhum kill switch ativo. Todas as operações funcionando normalmente.</p>
                    </div>
                </div>
            </div>

            {/* Active Kill Switches */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : switches.length === 0 ? (
                <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <p className="text-slate-400">Nenhum kill switch ativo</p>
                    <p className="text-xs text-slate-500 mt-1">O sistema está operando normalmente</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {switches.map((sw) => (
                        <div key={sw.id} className="p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-white">{sw.name}</h3>
                                    <p className="text-sm text-slate-400">{sw.reason}</p>
                                </div>
                                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl">
                                    Revogar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Activate Modal */}
            {showActivate && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowActivate(false)}>
                    <div className="bg-[#0a0f1a] border border-rose-500/30 rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <Power className="w-6 h-6 text-rose-400" />
                            <h2 className="text-xl font-bold text-white">Ativar Kill Switch</h2>
                        </div>
                        <p className="text-slate-400 text-sm mb-6">
                            Esta ação irá parar imediatamente as operações selecionadas.
                            Funcionalidade disponível apenas para Super Admins via API.
                        </p>
                        <button
                            onClick={() => setShowActivate(false)}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
