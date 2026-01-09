"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Lock, Bell, Moon, Shield, Fingerprint, Eye, Zap } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { user } = useAuth();

    return (
        <div className="max-w-4xl space-y-12 pb-20">
            <div>
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                    PREFERÊNCIAS DO <span className="text-indigo-500">KERNEL</span>
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Configure sua identidade soberana e protocolos de segurança.</p>
            </div>

            <div className="grid gap-8">

                {/* Profile Section */}
                <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                        <User className="w-32 h-32 text-indigo-500" />
                    </div>

                    <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                        <Fingerprint className="w-5 h-5 text-indigo-500" /> Identidade Soberana
                    </h3>

                    <div className="grid gap-6 max-w-md relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome de Exibição</label>
                            <Input
                                defaultValue={user?.name || "Anonymous User"}
                                className="h-12 bg-white/[0.02] border-white/5 focus:border-indigo-500/50 rounded-xl text-white font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ID Único (Email)</label>
                            <Input
                                defaultValue={user?.email}
                                disabled
                                className="h-12 bg-white/[0.01] border-white/5 text-slate-600 font-mono text-sm rounded-xl cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="mt-10 flex justify-end relative z-10">
                        <Button className="h-12 px-8 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 transition-all">
                            Salvar Alterações
                        </Button>
                    </div>
                </div>

                {/* Security Section */}
                <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5">
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                        <Shield className="w-5 h-5 text-rose-500" /> Protocolos de Segurança
                    </h3>

                    <div className="space-y-4">
                        <div className="group flex items-center justify-between p-6 rounded-[24px] bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                            <div>
                                <div className="text-white font-bold tracking-tight">Autenticação de Dois Fatores</div>
                                <div className="text-xs text-slate-500 font-medium mt-1">Camada adicional de defesa para sua identidade.</div>
                            </div>
                            <Button variant="outline" className="h-10 px-6 rounded-xl border-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/5">
                                Ativar
                            </Button>
                        </div>

                        <div className="group flex items-center justify-between p-6 rounded-[24px] bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                            <div>
                                <div className="text-white font-bold tracking-tight">Chaves de API (Master Key)</div>
                                <div className="text-xs text-slate-500 font-medium mt-1">Gerencie tokens de acesso de alto nível.</div>
                            </div>
                            <Button variant="outline" className="h-10 px-6 rounded-xl border-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/5">
                                Gerenciar
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                        <Bell className="w-32 h-32 text-indigo-500" />
                    </div>

                    <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                        <Bell className="w-5 h-5 text-amber-500" /> Alertas de Telemetria
                    </h3>

                    <div className="space-y-6 relative z-10">
                        <label className="flex items-center gap-4 cursor-pointer group/item">
                            <div className="relative flex items-center">
                                <input type="checkbox" className="peer sr-only" defaultChecked />
                                <div className="h-6 w-11 rounded-full bg-white/5 border border-white/10 peer-checked:bg-indigo-600 transition-colors" />
                                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-slate-400 peer-checked:translate-x-5 peer-checked:bg-white transition-all shadow-sm" />
                            </div>
                            <div>
                                <span className="text-sm font-bold text-white tracking-tight">Alertas de Faturamento</span>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Notificar quando atingir 80% da quota.</p>
                            </div>
                        </label>

                        <label className="flex items-center gap-4 cursor-pointer group/item">
                            <div className="relative flex items-center">
                                <input type="checkbox" className="peer sr-only" />
                                <div className="h-6 w-11 rounded-full bg-white/5 border border-white/10 peer-checked:bg-indigo-600 transition-colors" />
                                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-slate-400 peer-checked:translate-x-5 peer-checked:bg-white transition-all shadow-sm" />
                            </div>
                            <div>
                                <span className="text-sm font-bold text-white tracking-tight">Status do Kernel</span>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Relatórios semanais de performance e uptime.</p>
                            </div>
                        </label>
                    </div>
                </div>

            </div>
        </div>
    );
}
