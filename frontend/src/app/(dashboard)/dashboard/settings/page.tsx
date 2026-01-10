"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Lock, Bell, Shield, Fingerprint, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function SettingsPage() {
    const { user } = useAuth();
    const [name, setName] = useState(user?.name || "");
    const [saving, setSaving] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await api.put("/identity/me", { name });
            toast.success("Perfil atualizado com sucesso!");
        } catch {
            toast.error("Falha ao atualizar perfil");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            toast.error("Preencha todos os campos");
            return;
        }
        setChangingPassword(true);
        try {
            await api.post("/auth/change-password", {
                current_password: currentPassword,
                new_password: newPassword
            });
            toast.success("Senha alterada com sucesso!");
            setCurrentPassword("");
            setNewPassword("");
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            toast.error(err.response?.data?.error || "Falha ao alterar senha");
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <div className="max-w-4xl space-y-12 pb-20">
            <AppHeader />
            
            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                    Configurações
                </h1>
                <p className="text-slate-500 mt-1 font-medium">Configure sua identidade soberana e protocolos de segurança.</p>
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
                                value={name}
                                onChange={(e) => setName(e.target.value)}
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
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Role</label>
                            <Input
                                defaultValue={user?.role || "user"}
                                disabled
                                className="h-12 bg-white/[0.01] border-white/5 text-slate-600 font-mono text-sm rounded-xl cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="mt-10 flex justify-end relative z-10">
                        <Button 
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="h-12 px-8 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 transition-all"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Salvar Alterações
                        </Button>
                    </div>
                </div>

                {/* Security Section */}
                <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5">
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                        <Shield className="w-5 h-5 text-rose-500" /> Alterar Senha
                    </h3>

                    <div className="grid gap-6 max-w-md">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha Atual</label>
                            <Input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                className="h-12 bg-white/[0.02] border-white/5 focus:border-indigo-500/50 rounded-xl text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nova Senha</label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="h-12 bg-white/[0.02] border-white/5 focus:border-indigo-500/50 rounded-xl text-white"
                            />
                        </div>
                        <Button 
                            onClick={handleChangePassword}
                            disabled={changingPassword}
                            variant="outline"
                            className="h-12 rounded-xl border-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/5"
                        >
                            {changingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                            Alterar Senha
                        </Button>
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
