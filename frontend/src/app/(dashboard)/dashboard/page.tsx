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
    Loader2,
    Clock,
    TrendingUp,
    Ghost,
    Shield,
    UserCheck,
    Info
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { SystemStatus } from "@/components/dashboard/system-status";
import { Tooltip } from "@/components/ui/tooltip"; // New Premium Tooltip
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

// Pulse metrics - prova de vida do sistema
interface PulseMetrics {
    events_24h: number;
    events_5min: number;
    last_event_at: string | null;
    last_event_type: string | null;
    online_now: number;
}

// Shadow Mode status
interface ShadowStatus {
    active: boolean;
    activated_by: string;
    reason: string;
    expires_at: string | null;
}

interface DashboardState {
    loading: boolean;
    apps: App[];
    hasApps: boolean;
    firstApp: App | null;
    recentEvents: { name: string; time: string; status: string }[];
    pulse: PulseMetrics | null;
    shadowStatus: ShadowStatus | null;
    pendingApprovals: number;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const { activeApp, hasApp, loading: appLoading } = useApp();
    const [state, setState] = useState<DashboardState>({
        loading: true,
        apps: [],
        hasApps: false,
        firstApp: null,
        recentEvents: [],
        pulse: null,
        shadowStatus: null,
        pendingApprovals: 0
    });
    const [copied, setCopied] = useState(false);

    // Formatar tempo relativo
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

    // Buscar métricas de pulso do app ativo (silently - no console errors)
    const fetchPulseMetrics = async (appId: string): Promise<PulseMetrics | null> => {
        try {
            const [metricsRes, eventsRes] = await Promise.allSettled([
                api.get(`/admin/telemetry/apps/${appId}/metrics`).catch(() => null),
                api.get(`/events/app/${appId}?limit=1`).catch(() => null)
            ]);

            const data = metricsRes.status === 'fulfilled' && metricsRes.value?.data
                ? metricsRes.value.data
                : {};

            // Calcular eventos nos últimos 5 min (events_per_minute * 5)
            const events5min = Math.round((data.events_per_minute || 0) * 5);

            // Buscar último evento para pegar o tipo
            let lastEventType = null;
            if (eventsRes.status === 'fulfilled') {
                const eventsData = eventsRes.value?.data;
                if (eventsData?.events?.length > 0) {
                    lastEventType = eventsData.events[0].type || eventsData.events[0].event_type;
                }
            }

            return {
                events_24h: data.events_24h || 0,
                events_5min: events5min,
                last_event_at: data.last_event_at || null,
                last_event_type: lastEventType,
                online_now: data.online_now || 0
            };
        } catch {
            return null;
        }
    };

    useEffect(() => {
        async function loadDashboard() {
            if (!user?.id) return;

            try {
                // Parallel fetching for better performance (silently catch errors)
                const [appsRes, shadowRes, approvalsRes, eventsRes] = await Promise.allSettled([
                    api.get("/apps/mine?limit=5").catch(() => ({ data: { apps: [] } })),
                    api.get("/admin/rules/shadow").catch(() => null),
                    api.get("/approval/pending").catch(() => ({ data: { pending: [] } })),
                    api.get("/events/user/" + user.id + "?limit=10").catch(() => ({ data: { events: [] } }))
                ]);

                // Helper to extract data or default
                const getVal = <T,>(res: PromiseSettledResult<{ data: T } | null>, def: T): T =>
                    res.status === 'fulfilled' && res.value ? res.value.data : def;

                const appsData = getVal(appsRes, { apps: [] });
                const apps = appsData.apps || [];

                const shadowStatus = getVal(shadowRes, null);

                const pendingData = getVal(approvalsRes, { pending: [] });
                const pendingApprovals = Array.isArray(pendingData.pending) ? pendingData.pending.length :
                    Array.isArray(pendingData) ? pendingData.length : 0;

                // Process Recent Events
                const eventsData = getVal(eventsRes, { events: [] });
                const rawEvents = eventsData.events || eventsData || [];
                interface RawEvent { type: string; created_at: string; }
                const recentEvents = Array.isArray(rawEvents)
                    ? rawEvents.slice(0, 5).map((e: RawEvent) => ({
                        name: e.type,
                        time: new Date(e.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        status: e.type?.includes('fail') || e.type?.includes('error') ? 'error' : 'ok'
                    }))
                    : [];

                setState({
                    loading: false,
                    apps,
                    hasApps: apps.length > 0,
                    firstApp: apps[0] || null,
                    recentEvents,
                    pulse: null,
                    shadowStatus,
                    pendingApprovals
                });
            } catch (e) {
                console.error("Failed to load dashboard", e);
                setState(prev => ({ ...prev, loading: false }));
            }
        }
        loadDashboard();
    }, [user]);

    // Buscar pulse quando activeApp mudar
    useEffect(() => {
        if (activeApp?.id) {
            fetchPulseMetrics(activeApp.id).then(pulse => {
                setState(prev => ({ ...prev, pulse }));
            });
        }
    }, [activeApp?.id]);

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
                        Olá, <span className="text-indigo-500">{user?.profile?.name || user?.username || "Operador"}</span>
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
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600/10 to-purple-600/5 border border-indigo-500/20 text-center space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Rocket className="w-40 h-40" />
                        </div>

                        <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 flex items-center justify-center mx-auto relative z-10">
                            <Rocket className="w-10 h-10 text-indigo-400" />
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-2xl font-black text-white mb-2">
                                Crie seu primeiro App
                            </h2>
                            <p className="text-slate-400 text-sm">
                                Um app é sua porta de entrada para o kernel.
                                Você receberá credenciais de API para integrar seus sistemas.
                            </p>
                        </div>

                        <Link href="/dashboard/apps" className="relative z-10 block">
                            <Tooltip content="Instanciar novo container de aplicação" side="bottom">
                                <Button className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/20">
                                    <Zap className="w-4 h-4 mr-2" />
                                    Criar App Agora
                                </Button>
                            </Tooltip>
                        </Link>
                    </div>
                </motion.div>

                {/* Quick Links */}
                <div className="grid gap-4 md:grid-cols-2 max-w-xl mx-auto pt-4">
                    <Tooltip content="Guia de integração e referências da API" side="left">
                        <Link href="/docs" className="group block">
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
                    </Tooltip>

                    <Tooltip content="Gerenciar assinatura e limites" side="right">
                        <Link href="/dashboard/billing" className="group block">
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
                    </Tooltip>
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
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
                        Visão Geral
                        <Tooltip content="Panorama de performance e saúde" side="right">
                            <Info className="w-4 h-4 text-slate-600" />
                        </Tooltip>
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        {hasApp && activeApp
                            ? `Operando: ${activeApp.name}`
                            : "Selecione um app para começar"}
                    </p>
                </div>
                <Tooltip content="Adicionar nova aplicação ao Kernel" side="left">
                    <Link href="/dashboard/apps">
                        <Button className="bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl px-6 shadow-lg shadow-indigo-600/20 font-bold tracking-wide text-xs h-10">
                            <Zap className="w-3.5 h-3.5 mr-2" />
                            NOVO APP
                        </Button>
                    </Link>
                </Tooltip>
            </div>

            {/* Active App Card - "O que existe?" */}
            {activeApp && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600/10 to-emerald-600/5 border border-emerald-500/20 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                        <Activity className="w-64 h-64 text-emerald-500 rotate-12" />
                    </div>

                    <div className="flex items-start gap-4 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-2 py-0.5 bg-emerald-500/20 rounded-full border border-emerald-500/20">
                                    App Ativo
                                </span>
                            </div>
                            <h2 className="text-xl font-black text-white mb-1">
                                {activeApp.name}
                            </h2>
                            <div className="flex items-center gap-2">
                                <code className="text-sm text-slate-400 font-mono bg-black/20 px-1.5 rounded">{activeApp.slug}</code>
                                <Tooltip content={copied ? "Copiado!" : "Copiar ID do App"} side="right">
                                    <button
                                        onClick={() => handleCopySlug(activeApp.slug || "")}
                                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/5"
                                    >
                                        {copied ? (
                                            <Check className="w-3 h-3 text-emerald-400" />
                                        ) : (
                                            <Copy className="w-3 h-3 text-slate-500" />
                                        )}
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                        <Tooltip content="Configurações e Chaves de API" side="left">
                            <Link href={`/dashboard/apps/${activeApp.id}`}>
                                <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 font-bold uppercase text-[10px] tracking-widest">
                                    Gerenciar <ExternalLink className="w-3 h-3 ml-2" />
                                </Button>
                            </Link>
                        </Tooltip>
                    </div>
                </motion.div>
            )}

            {/* PULSE METRICS - Prova de vida do sistema */}
            {activeApp && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    {/* Eventos 24h */}
                    <Tooltip content="Volume total de requisições hoje" side="top">
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all cursor-default group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                                </div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Diário</span>
                            </div>
                            <p className="text-3xl font-black text-white group-hover:text-indigo-300 transition-colors">
                                {state.pulse?.events_24h?.toLocaleString() || "0"}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">eventos em 24h</p>
                        </div>
                    </Tooltip>

                    {/* Eventos 5min */}
                    <Tooltip content="Tráfego em tempo real (Janela 5min)" side="top">
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all cursor-default group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Activity className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className={cn(
                                    "h-2 w-2 rounded-full ring-2 ring-transparent group-hover:ring-emerald-500/30 transition-all",
                                    state.pulse?.events_5min && state.pulse.events_5min > 0
                                        ? "bg-emerald-500 animate-pulse"
                                        : "bg-slate-600"
                                )} />
                            </div>
                            <p className="text-3xl font-black text-white group-hover:text-emerald-300 transition-colors">
                                {state.pulse?.events_5min?.toLocaleString() || "0"}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">eventos recentes</p>
                        </div>
                    </Tooltip>

                    {/* Último Evento */}
                    <Tooltip content="Última interação recebida pelo Kernel" side="top">
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 transition-all cursor-default group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Clock className="w-5 h-5 text-amber-400" />
                                </div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Último</span>
                            </div>
                            {state.pulse?.last_event_at ? (
                                <>
                                    <p className="text-lg font-black text-white truncate group-hover:text-amber-300 transition-colors">
                                        {formatRelativeTime(state.pulse.last_event_at)}
                                    </p>
                                    {state.pulse.last_event_type && (
                                        <p className="text-xs text-slate-400 font-mono truncate mt-1 bg-white/5 px-1.5 py-0.5 rounded w-fit">
                                            {state.pulse.last_event_type}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <p className="text-lg font-bold text-slate-600">—</p>
                                    <p className="text-xs text-slate-500 mt-1">aguardando...</p>
                                </>
                            )}
                        </div>
                    </Tooltip>
                </motion.div>
            )}

            {/* CONFIANÇA - Shadow Mode Status (LOOP 4) */}
            {state.shadowStatus && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                >
                    <Tooltip content={state.shadowStatus.active ? "Desativar Modo de Simulação" : "Ativar Modo de Simulação (Seguro)"} side="top">
                        <Link href="/dashboard/shadow">
                            <div className={cn(
                                "p-5 rounded-2xl border transition-all cursor-pointer group",
                                state.shadowStatus.active
                                    ? "bg-gradient-to-r from-violet-600/20 to-purple-600/10 border-violet-500/30 hover:border-violet-500/50"
                                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                            )}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300",
                                            state.shadowStatus.active ? "bg-violet-500/20" : "bg-slate-500/10"
                                        )}>
                                            {state.shadowStatus.active ? (
                                                <Ghost className="w-6 h-6 text-violet-400" />
                                            ) : (
                                                <Shield className="w-6 h-6 text-slate-500" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className={cn(
                                                    "font-bold",
                                                    state.shadowStatus.active ? "text-violet-400" : "text-slate-400"
                                                )}>
                                                    {state.shadowStatus.active ? "Shadow Mode Ativo" : "Modo Normal"}
                                                </h3>
                                                {state.shadowStatus.active && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-400 uppercase tracking-wider">
                                                        Simulando
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {state.shadowStatus.active
                                                    ? `Ações simuladas • ${state.shadowStatus.reason || "Sem motivo"}`
                                                    : "Ações executadas normalmente • Clique para simular"}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className={cn(
                                        "w-5 h-5 transition-transform group-hover:translate-x-1",
                                        state.shadowStatus.active ? "text-violet-400" : "text-slate-600"
                                    )} />
                                </div>
                            </div>
                        </Link>
                    </Tooltip>
                </motion.div>
            )}

            {/* DELEGAÇÃO - Aprovações Pendentes (LOOP 6) */}
            {state.pendingApprovals > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.09 }}
                >
                    <Tooltip content="Resolver pendências de autorização humana" side="bottom">
                        <Link href="/dashboard/approvals">
                            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-600/20 to-orange-600/10 border border-amber-500/30 hover:border-amber-500/50 transition-all cursor-pointer group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center animate-pulse group-hover:animate-none group-hover:scale-110 transition-transform">
                                            <UserCheck className="w-6 h-6 text-amber-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-amber-400">
                                                    {state.pendingApprovals} Aprovação{state.pendingApprovals > 1 ? "ões" : ""} Pendente{state.pendingApprovals > 1 ? "s" : ""}
                                                </h3>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 uppercase tracking-wider">
                                                    Ação Requerida
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Decisões aguardando sua confirmação direta
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    </Tooltip>
                </motion.div>
            )}

            {/* SYSTEM STATUS - Visão geral dos loops */}
            {activeApp && (
                <SystemStatus appId={activeApp.id} />
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
                        <Tooltip content="Ver histórico completo de eventos" side="left">
                            <Link href="/dashboard/events">
                                <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-wider">
                                    Ver todos <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                            </Link>
                        </Tooltip>
                    </div>

                    {state.recentEvents.length > 0 ? (
                        <div className="space-y-4">
                            {state.recentEvents.map((event, i) => (
                                <Tooltip key={i} content={`Status: ${event.status.toUpperCase()}`} side="right">
                                    <div className="flex items-center gap-4 group cursor-help">
                                        <div className={cn(
                                            "w-1 h-8 rounded-full transition-all group-hover:h-10",
                                            event.status === 'ok' ? 'bg-emerald-500/40 group-hover:bg-emerald-500' : 'bg-amber-500/40 group-hover:bg-amber-500'
                                        )} />
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-slate-200 font-mono group-hover:text-white transition-colors">{event.name}</div>
                                            <div className="text-[10px] text-slate-500 uppercase font-black">{event.time}</div>
                                        </div>
                                    </div>
                                </Tooltip>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                            <p className="text-sm text-slate-500 font-medium">
                                {activeApp
                                    ? `Este app ainda não reportou eventos.`
                                    : "Aguardando fluxo de dados..."}
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
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-6">Ações Recomendadas</h3>

                    <div className="space-y-3">
                        <Tooltip content="Definir lógica de negócio automatizada" side="left">
                            <Link href="/dashboard/rules" className="block group">
                                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/15 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-white text-sm">Criar Regras</p>
                                            <p className="text-xs text-slate-400">Automatize decisões</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        </Tooltip>

                        <Tooltip content="Aprender a usar o SDK do Kernel" side="left">
                            <Link href="/docs" className="block group">
                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                                            {(user?.profile?.name || user?.username || "?")[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">
                                                {user?.profile?.name || user?.username || "Usuário"} (Você)
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Agora
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </Tooltip>

                        <Tooltip content="Gerenciar configurações de Apps" side="left">
                            <Link href="/dashboard/apps" className="block group">
                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                                            <Box className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-white text-sm">Gerenciar Apps</p>
                                            <p className="text-xs text-slate-500">{state.apps.length} app{state.apps.length !== 1 ? 's' : ''}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            </Link>
                        </Tooltip>
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
                        <Tooltip content="Ver lista completa de aplicações" side="left">
                            <Link href="/dashboard/apps">
                                <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300 font-bold uppercase text-xs tracking-wider">
                                    Ver todos <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                            </Link>
                        </Tooltip>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {state.apps.slice(0, 3).map((app) => (
                            <Tooltip key={app.id} content={`ID: ${app.id}`} side="top">
                                <Link href={`/dashboard/apps/${app.id}`} className="group">
                                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs group-hover:scale-110 transition-transform">
                                                {app.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-white text-sm truncate">{app.name}</p>
                                                <p className="text-xs text-slate-500 font-mono truncate">{app.slug}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </Tooltip>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
