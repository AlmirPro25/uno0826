"use client";

import { useApp } from "@/contexts/app-context";
import { Shield, AlertTriangle } from "lucide-react";

export function AppHeader() {
    const { activeApp, hasApp } = useApp();

    if (!hasApp) {
        return (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <div className="flex-1">
                    <p className="text-sm font-bold text-amber-400">Nenhum app selecionado</p>
                    <p className="text-xs text-amber-400/70">Crie ou selecione um app para começar a operar.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-6 flex items-center justify-between">
            {/* App Context Indicator */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">{activeApp?.name}</p>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-mono">{activeApp?.slug}</span>
                            <span className="px-1.5 py-0.5 text-[8px] font-bold bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30 uppercase">
                                prod
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Role Badge */}
                <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest ${
                    activeApp?.role === "owner" 
                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                        : activeApp?.role === "admin"
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                }`}>
                    {activeApp?.role}
                </span>
            </div>
        </div>
    );
}
