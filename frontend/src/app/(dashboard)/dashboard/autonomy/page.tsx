"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
    Bot, Loader2, RefreshCw, Shield, Zap, AlertTriangle,
    CheckCircle2, XCircle, Settings, Brain, Gauge
} from "lucide-react";
import { api } from "@/lib/api";
import { AppHeader } from "@/components/dashboard/app-header";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface AutonomyProfile {
    id: string;
    name: string;
    description: string;
    level: number;
    max_amount: number;
    requires_approval: boolean;
    allowed_actions: string[];
    created_at: string;
    updated_at: string;
}

interface AutonomyMatrix {
    profiles: AutonomyProfile[];
    default_profile: string;
    global_enabled: boolean;
}

export default function AutonomyPage() {
    const [matrix, setMatrix] = useState<AutonomyMatrix | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    const fetchMatrix = async () => {
        setLoading(true);
        try {
            const res = await api.get("/autonomy/matrix");
            setMatrix(res.data);
        } catch (error) {
            console.error("Failed to fetch autonomy matrix", error);
            // Fallback data structure
            setMatrix({
                profiles: [],
                default_profile: "conservative",
                global_enabled: true
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatrix();
    }, []);

    const getLevelColor = (level: number) => {
        if (level <= 2) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
        if (level <= 4) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    };

    const getLevelLabel = (level: number) => {
        if (level <= 2) return "Conservador";
        if (level <= 4) return "Moderado";
        return "Agressivo";
    };

    const handleSetDefault = async (profileId: string) => {
        setUpdating(profileId);
        try {
            await api.put("/autonomy/matrix/default", { profile_id: profileId });
            toast.success("Perfil padrão atualizado");
            fetchMatrix();
        } catch (error) {
            toast.error("Erro ao atualizar perfil padrão");
        } finally {
            setUpdating(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                        Matriz de Autonomia
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Defina quanto poder os agentes têm para agir sozinhos
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline"
                        onClick={fetchMatrix}
                        disabled={loading}
                        className="h-11 px-4 rounded-xl border-white/10 text-white hover:bg-white/5"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Global Status */}
            <div className={cn(
                "p-6 rounded-2xl border",
                matrix?.global_enabled 
                    ? "bg-emerald-500/10 border-emerald-500/20" 
                    : "bg-rose-500/10 border-rose-500/20"
            )}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            matrix?.global_enabled ? "bg-emerald-500/20" : "bg-rose-500/20"
                        )}>
                            {matrix?.global_enabled ? (
                                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                            ) : (
                                <XCircle className="w-6 h-6 text-rose-400" />
                            )}
                        </div>
                        <div>
                            <h3 className={cn(
                                "font-bold",
                                matrix?.global_enabled ? "text-emerald-400" : "text-rose-400"
                            )}>
                                Autonomia {matrix?.global_enabled ? "Habilitada" : "Desabilitada"}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {matrix?.global_enabled 
                                    ? "Agentes podem executar ações dentro dos limites definidos"
                                    : "Todas as ações requerem aprovação humana"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Perfil Padrão:</span>
                        <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">
                            {matrix?.default_profile || "N/A"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Profiles Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {matrix?.profiles && matrix.profiles.length > 0 ? (
                    matrix.profiles.map((profile, i) => (
                        <motion.div
                            key={profile.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                                "p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all",
                                matrix.default_profile === profile.id && "ring-2 ring-indigo-500/50"
                            )}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        getLevelColor(profile.level)
                                    )}>
                                        <Gauge className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{profile.name}</h3>
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                                            getLevelColor(profile.level)
                                        )}>
                                            {getLevelLabel(profile.level)}
                                        </span>
                                    </div>
                                </div>
                                {matrix.default_profile === profile.id && (
                                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400">
                                        PADRÃO
                                    </span>
                                )}
                            </div>

                            <p className="text-sm text-slate-400 mb-4">{profile.description}</p>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Nível</span>
                                    <span className="font-bold text-white">{profile.level}/5</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Limite por Ação</span>
                                    <span className="font-mono text-white">
                                        {profile.max_amount > 0 
                                            ? `R$ ${(profile.max_amount / 100).toFixed(2)}`
                                            : "Ilimitado"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Aprovação</span>
                                    <span className={cn(
                                        "font-bold",
                                        profile.requires_approval ? "text-amber-400" : "text-emerald-400"
                                    )}>
                                        {profile.requires_approval ? "Requerida" : "Automática"}
                                    </span>
                                </div>
                            </div>

                            {profile.allowed_actions && profile.allowed_actions.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-xs text-slate-500 mb-2">Ações Permitidas:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {profile.allowed_actions.slice(0, 3).map(action => (
                                            <span key={action} className="px-2 py-0.5 rounded bg-white/5 text-xs text-slate-400">
                                                {action}
                                            </span>
                                        ))}
                                        {profile.allowed_actions.length > 3 && (
                                            <span className="px-2 py-0.5 rounded bg-white/5 text-xs text-slate-500">
                                                +{profile.allowed_actions.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {matrix.default_profile !== profile.id && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSetDefault(profile.id)}
                                    disabled={updating === profile.id}
                                    className="w-full border-white/10 text-white hover:bg-white/5"
                                >
                                    {updating === profile.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        "Definir como Padrão"
                                    )}
                                </Button>
                            )}
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                        <Bot className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">
                            Nenhum perfil de autonomia configurado
                        </h3>
                        <p className="text-slate-500">
                            Configure perfis para controlar o nível de autonomia dos agentes
                        </p>
                    </div>
                )}
            </div>

            {/* Info Card */}
            <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <div className="flex items-start gap-4">
                    <Brain className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-bold text-indigo-400 mb-1">Como funciona a Matriz de Autonomia</h3>
                        <p className="text-sm text-slate-400">
                            A matriz define quanto poder os agentes têm para tomar decisões sozinhos. 
                            Perfis conservadores requerem mais aprovações humanas, enquanto perfis agressivos 
                            permitem mais ações automáticas. O nível de autonomia afeta diretamente o 
                            Shadow Mode e o sistema de aprovações.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
