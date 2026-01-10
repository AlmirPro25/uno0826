"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
    Activity, 
    ArrowRight, 
    Zap, 
    Box, 
    CheckCircle2, 
    Rocket,
    BookOpen,
    Copy,
    Check,
    ExternalLink,
    Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

interface App {
    id: string;
    name: string;
    slug: string;
    status: string;
    created_at: string;
}

interface DashboardState {
    loading: boolean;
    apps: App[];
    hasApps: boolean;
    firstApp: App | null;
    recentEvents: { name: string; time: string; status: string }[];
}

export default function DashboardPage() {
    const { user } = useAuth();
    const { activeApp, hasApp, loading: appLoading } = useApp();
    const [state, setState] = useState<DashboardState>({
        loading: true,
        apps: [],
        hasApps: false,
        firstApp: null,
        recentEvents: []
    });
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function loadDashboard() {
            if (!user?.id) return;

            try {
                const appsRes = await api.get("/apps/mine?limit=5");
                const apps = appsRes.data.apps || [];
                
                setState({
                    loading: false,
                    apps,
                    hasApps: apps.length > 0,
                    firstApp: apps[0] || null,
                    recentEvents: apps.length > 0 ? [
                        { name: "app.created", time: "recente", status: "ok" },
                        { name: "identity.auth.success", time: "agora", status: "ok" },
                    ] : []
                });
            } catch (e) {
                console.error("Failed to load dashboard", e);
                setState(prev => ({ ...prev, loading: false }));
            }
        }
        loadDashboard();
    }, [user]);

    const handleCopySlug = async (slug: string) => {
        await navigator.clipboard.writeText(slug);
        setCopied(true);
        toast.success("Slug copiado!");
        setTimeout(() => setCopied(false), 2000);
    };

    if (state.loading || appLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    // EMPTY STATE - No apps yet
    if (!state.hasApps) {
        return (
            <div className="space-y-8 pb-12">
                <AppHeader />
                
                <div className="text-center pt-8">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
                        Olá, <span className="text-indigo-500">{user?.name || "Operador"}</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">
                        Seu kernel está pronto. Vamos criar seu primeiro app.
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-xl mx-auto"
                >
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600/10 to-purple-600/5 border border-indigo-500/20 text-center space-y-6">
                        <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 flex items-center justify-center mx-auto">
                            <Rocket className="w-10 h-10 text-indigo-400" />
                        </div>
                        
                        <div>
                            <h2 className="text-2xl font-black text-white mb-2">
                                Crie seu primeiro App
                            </h2>
                            <p className="text-slate-400 text-sm">
                                Um app é sua porta de entrada para o kernel. 
                                Você receberá credenciais de API para integrar seus sistemas.
                            </p>
                        </div>

                        <Link href="/dashboard/apps">
                            <Button className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-widest text-xs">
                                <Zap className="w-4 h-4 mr-2" />
                                Criar App Agora
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* Quick Links */}
                <div className="grid gap-4 md:grid-cols-2 max-w-xl mx-auto pt-4">
                    <Link href="/docs" className="group">
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-white text-sm">Documentação</p>
                                    <p className="text-xs text-slate-500">Aprenda a integrar</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    </Link>

                    <Link href="/dashboard/billing" className="group">
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-white text-sm">Planos & Billing</p>
                                    <p className="text-xs text-slate-500">Ver opções</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        );
    }

    // ACTIVE STATE - Has apps
    return (
        <div className="space-y-8 pb-12">
            {/* App Context Header - "Em qual universo você está" */}
            <AppHeader />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                        Visão Geral
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        {hasApp && activeApp 
                            ? `Operando: ${activeApp.name}` 
                            : "Selecione um app para começar"}
                    </p>
                </div>
                <Link href="/dashboard/apps">
                    <Button className="bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl px-6 shadow-lg shadow-indigo-600/20">
                        <Zap className="w-4 h-4 mr-2" />
                        Novo App
                    </Button>
                </Link>
            </div>

            {/* Active App Card - "O que existe?" */}
            {activeApp && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600/10 to-emerald-600/5 border border-emerald-500/20"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-2 py-0.5 bg-emerald-500/20 rounded-full">
                                    App Ativo
                                </span>
                            </div>
                            <h2 className="text-xl font-black text-white mb-1">
                                {activeApp.name}
                            </h2>
                            <div className="flex items-center gap-2">
                                <code className="text-sm text-slate-400 font-mono">{activeApp.slug}</code>
                                <button 
                                    onClick={() => handleCopySlug(activeApp.slug || "")}
                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                >
                                    {copied ? (
                                        <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                        <Copy className="w-3 h-3 text-slate-500" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <Link href={`/dashboard/apps/${activeApp.id}`}>
                            <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                                Ver detalhes <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            )}

            {/* Two Column Layout */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Events - "O que está funcionando?" */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-3xl bg-white/[0.02] border border-white/5"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                                Atividade {activeApp ? `em ${activeApp.name}` : "Recente"}
                            </h3>
                        </div>
                        <Link href="/dashboard/events">
                            <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300 text-xs">
                                Ver todos <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                        </Link>
                    </div>
                    
                    {state.recentEvents.length > 0 ? (
                        <div className="space-y-4">
                            {state.recentEvents.map((event, i) => (
                                <div key={i} className="flex items-center gap-4 group">
                                    <div className={cn(
                                        "w-1 h-8 rounded-full",
                                        event.status === 'ok' ? 'bg-emerald-500/40' : 'bg-amber-500/40'
                                    )} />
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-200 font-mono">{event.name}</div>
                                        <div className="text-[10px] text-slate-500 uppercase font-black">{event.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">
                                {activeApp 
                                    ? `Este app ainda não tem eventos...` 
                                    : "Aguardando eventos..."}
                            </p>
                        </div>
                    )}
                </motion.div>

                {/* Next Step - "O que faço agora?" */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-3xl bg-white/[0.02] border border-white/5"
                >
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-6">Próximo Passo</h3>
                    
                    <div className="space-y-4">
                        <Link href="/docs" className="block group">
                            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/15 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-white text-sm">Integre seu App</p>
                                        <p className="text-xs text-slate-400">Siga o quickstart para conectar</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>

                        <Link href="/dashboard/apps" className="block group">
                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                                        <Box className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-white text-sm">Gerenciar Apps</p>
                                        <p className="text-xs text-slate-500">{state.apps.length} app{state.apps.length !== 1 ? 's' : ''} registrado{state.apps.length !== 1 ? 's' : ''}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Apps Overview - if more than 1 app */}
            {state.apps.length > 1 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-3xl bg-white/[0.02] border border-white/5"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">Seus Apps</h3>
                        <Link href="/dashboard/apps">
                            <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300">
                                Ver todos <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                        </Link>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {state.apps.slice(0, 3).map((app) => (
                            <Link key={app.id} href={`/dashboard/apps/${app.id}`} className="group">
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                            {app.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white text-sm truncate">{app.name}</p>
                                            <p className="text-xs text-slate-500 font-mono truncate">{app.slug}</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
