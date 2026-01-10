"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
    ArrowLeft, Key, Copy, RefreshCw, Trash2, Check,
    Shield, Activity, Settings, Loader2, AlertTriangle,
    BookOpen, ExternalLink, Eye, EyeOff, Zap, Clock,
    CheckCircle2, XCircle, TrendingUp, Users, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useApp } from "@/contexts/app-context";

interface AppDetails {
    id: string;
    name: string;
    slug: string;
    description: string;
    status: string;
    created_at: string;
    updated_at: string;
}

interface AppCredentials {
    api_key: string;
    api_secret?: string;
}

interface AppMetrics {
    app_id: string;
    total_users: number;
    active_users_24h: number;
    total_sessions: number;
    active_sessions: number;
    total_decisions: number;
    total_approvals: number;
    total_revenue: number;
    risk_score: number;
    last_activity_at: string;
}

type HealthStatus = "healthy" | "warning" | "critical" | "unknown";

interface RecentEvent {
    id: string;
    type: string;
    timestamp: number;
    status: "success" | "warning" | "error";
}

interface RecentRule {
    id: string;
    name: string;
    enabled: boolean;
    last_triggered?: string;
}

export default function AppOverviewPage() {
    const params = useParams();
    const router = useRouter();
    const appId = params.id as string;

    const [app, setApp] = useState<AppDetails | null>(null);
    const [credentials, setCredentials] = useState<AppCredentials | null>(null);
    const [metrics, setMetrics] = useState<AppMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState<string | null>(null);
    const [showSecret, setShowSecret] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    // Mock data for demo (will be replaced by real API calls)
    const [recentEvents] = useState<RecentEvent[]>([
        { id: "1", type: "identity.auth.success", timestamp: Date.now() - 60000, status: "success" },
        { id: "2", type: "billing.payment.processed", timestamp: Date.now() - 180000, status: "success" },
        { id: "3", type: "governance.rule.triggered", timestamp: Date.now() - 300000, status: "warning" },
        { id: "4", type: "api.request", timestamp: Date.now() - 420000, status: "success" },
    ]);

    const [recentRules] = useState<RecentRule[]>([
        { id: "1", name: "Rate Limit Alert", enabled: true, last_triggered: "2h atrás" },
        { id: "2", name: "High Value Transaction", enabled: true },
        { id: "3", name: "Suspicious Login", enabled: false },
    ]);

    const fetchApp = async () => {
        try {
            const [appRes, credsRes, metricsRes] = await Promise.all([
                api.get(`/apps/${appId}`),
                api.get(`/apps/${appId}/credentials`).catch(() => ({ data: null })),
                api.get(`/apps/${appId}/metrics`).catch(() => ({ data: null }))
            ]);
            setApp(appRes.data);
            setCredentials(credsRes.data);
            setMetrics(metricsRes.data);
        } catch (error) {
            console.error("Failed to fetch app", error);
            toast.error("Falha ao carregar aplicação");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApp();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appId]);

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        toast.success("Copiado!");
        setTimeout(() => setCopied(null), 2000);
    };

    const handleRegenerateCredentials = async () => {
        if (!confirm("Tem certeza? Isso invalidará as credenciais atuais.")) return;
        
        setRegenerating(true);
        try {
            const res = await api.post(`/apps/${appId}/credentials/regenerate`);
            setCredentials(res.data);
            setShowSecret(true);
            toast.success("Credenciais regeneradas! Salve o novo secret.");
        } catch {
            toast.error("Falha ao regenerar credenciais");
        } finally {
            setRegenerating(false);
        }
    };

    // Compute health status based on metrics
    const getHealthStatus = (): HealthStatus => {
        if (!metrics) return "unknown";
        if (metrics.risk_score > 70) return "critical";
        if (metrics.risk_score > 40) return "warning";
        return "healthy";
    };

    const healthStatus = getHealthStatus();

    const healthConfig = {
        healthy: { 
            label: "Operacional", 
            color: "emerald", 
            icon: CheckCircle2,
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            text: "text-emerald-400"
        },
        warning: { 
            label: "Atenção", 
            color: "amber", 
            icon: AlertTriangle,
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
            text: "text-amber-400"
        },
        critical: { 
            label: "Crítico", 
            color: "rose", 
            icon: XCircle,
            bg: "bg-rose-500/10",
            border: "border-rose-500/20",
            text: "text-rose-400"
        },
        unknown: { 
            label: "Desconhecido", 
            color: "slate", 
            icon: Clock,
            bg: "bg-slate-500/10",
            border: "border-slate-500/20",
            text: "text-slate-400"
        }
    };

    const health = healthConfig[healthStatus];
    const HealthIcon = health.icon;

    const formatTimestamp = (ts: number) => {
        const diff = Date.now() - ts;
        if (diff < 60000) return "agora";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        return `${Math.floor(diff / 3600000)}h`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!app) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500">Aplicação não encontrada</p>
                <Button onClick={() => router.push("/dashboard/apps")} className="mt-4">
                    Voltar
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header with Health Status */}
            <div className="flex items-start gap-4">
                <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => router.push("/dashboard/apps")}
                    className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10 shrink-0"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">{app.name}</h1>
                        {/* Health Badge */}
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest",
                            health.bg, health.border, health.text, "border"
                        )}>
                            <HealthIcon className="w-3.5 h-3.5" />
                            {health.label}
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm font-mono mt-1">{app.slug}</p>
                </div>
                <Link href="/docs/quickstart">
                    <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 rounded-xl shrink-0">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Quickstart
                    </Button>
                </Link>
            </div>

            {/* Key Metrics Row - "O que está acontecendo?" */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { 
                        label: "Usuários Ativos", 
                        value: metrics?.active_users_24h || 0, 
                        icon: Users, 
                        color: "emerald",
                        trend: "+12%"
                    },
                    { 
                        label: "Eventos (24h)", 
                        value: metrics?.total_decisions || 0, 
                        icon: Activity, 
                        color: "indigo",
                        trend: "+8%"
                    },
                    { 
                        label: "Sessões Ativas", 
                        value: metrics?.active_sessions || 0, 
                        icon: BarChart3, 
                        color: "blue",
                        trend: "+5%"
                    },
                    { 
                        label: "Risk Score", 
                        value: metrics?.risk_score || 0, 
                        icon: Shield, 
                        color: (metrics?.risk_score || 0) > 40 ? "amber" : "emerald",
                        suffix: "/100"
                    },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <stat.icon className={cn(
                                "w-4 h-4",
                                stat.color === "emerald" && "text-emerald-400",
                                stat.color === "indigo" && "text-indigo-400",
                                stat.color === "blue" && "text-blue-400",
                                stat.color === "amber" && "text-amber-400"
                            )} />
                            {stat.trend && (
                                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                                    <TrendingUp className="w-3 h-3" />
                                    {stat.trend}
                                </span>
                            )}
                        </div>
                        <p className="text-2xl font-black text-white">
                            {stat.value.toLocaleString()}{stat.suffix || ""}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                            {stat.label}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Events & Rules */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Recent Events */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-6 rounded-2xl bg-white/[0.02] border border-white/5"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                Eventos Recentes
                            </h3>
                            <Link href="/dashboard/events">
                                <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300 text-xs">
                                    Ver todos
                                </Button>
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {recentEvents.map((evt) => (
                                <div key={evt.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                                    <div className={cn(
                                        "w-1.5 h-8 rounded-full",
                                        evt.status === "success" && "bg-emerald-500/50",
                                        evt.status === "warning" && "bg-amber-500/50",
                                        evt.status === "error" && "bg-rose-500/50"
                                    )} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-mono text-slate-300 truncate">{evt.type}</p>
                                    </div>
                                    <span className="text-xs text-slate-600">{formatTimestamp(evt.timestamp)}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Active Rules */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="p-6 rounded-2xl bg-white/[0.02] border border-white/5"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-400" />
                                Regras Ativas
                            </h3>
                            <Link href="/dashboard/rules">
                                <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300 text-xs">
                                    Gerenciar
                                </Button>
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {recentRules.map((rule) => (
                                <div key={rule.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center",
                                        rule.enabled ? "bg-amber-500/20 text-amber-400" : "bg-slate-500/20 text-slate-500"
                                    )}>
                                        <Zap className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{rule.name}</p>
                                        {rule.last_triggered && (
                                            <p className="text-[10px] text-slate-500">Último trigger: {rule.last_triggered}</p>
                                        )}
                                    </div>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                        rule.enabled 
                                            ? "bg-emerald-500/20 text-emerald-400" 
                                            : "bg-slate-500/20 text-slate-500"
                                    )}>
                                        {rule.enabled ? "On" : "Off"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Right Column - Credentials */}
                <div className="space-y-6">
                    {/* Credentials Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600/10 to-purple-600/5 border border-indigo-500/20"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Key className="w-4 h-4 text-indigo-400" />
                                API Credentials
                            </h3>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={handleRegenerateCredentials}
                                disabled={regenerating}
                                className="text-slate-400 hover:text-white h-8 px-2"
                            >
                                {regenerating ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-3 h-3" />
                                )}
                            </Button>
                        </div>

                        {credentials ? (
                            <div className="space-y-4">
                                {/* API Key */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">API Key</label>
                                    <div className="flex gap-2 mt-1">
                                        <div className="flex-1 h-10 px-3 bg-black/30 border border-white/10 rounded-lg flex items-center font-mono text-xs text-indigo-400 overflow-hidden">
                                            <span className="truncate">{credentials.api_key}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => copyToClipboard(credentials.api_key, "key")}
                                            className={cn(
                                                "h-10 w-10 rounded-lg shrink-0",
                                                copied === "key" && "text-emerald-400"
                                            )}
                                        >
                                            {copied === "key" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {/* API Secret */}
                                {credentials.api_secret && (
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">API Secret</label>
                                        <div className="flex gap-2 mt-1">
                                            <div className="flex-1 h-10 px-3 bg-rose-500/5 border border-rose-500/20 rounded-lg flex items-center font-mono text-xs text-rose-400 overflow-hidden">
                                                <span className="truncate">
                                                    {showSecret ? credentials.api_secret : "••••••••••••"}
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setShowSecret(!showSecret)}
                                                className="h-10 w-10 rounded-lg shrink-0"
                                            >
                                                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => copyToClipboard(credentials.api_secret!, "secret")}
                                                className={cn(
                                                    "h-10 w-10 rounded-lg shrink-0",
                                                    copied === "secret" && "text-emerald-400"
                                                )}
                                            >
                                                {copied === "secret" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-rose-400/60 mt-1">
                                            ⚠️ Nunca exponha no frontend
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <Key className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                                <p className="text-xs text-slate-500">Credenciais não disponíveis</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="p-6 rounded-2xl bg-white/[0.02] border border-white/5"
                    >
                        <h3 className="font-bold text-white mb-4">Ações Rápidas</h3>
                        <div className="space-y-2">
                            <Link href={`/dashboard/apps/${appId}/users`} className="block">
                                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors group">
                                    <Users className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm text-slate-300 group-hover:text-white">Ver Usuários</span>
                                    <ExternalLink className="w-3 h-3 text-slate-600 ml-auto opacity-0 group-hover:opacity-100" />
                                </div>
                            </Link>
                            <Link href="/dashboard/rules" className="block">
                                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors group">
                                    <Zap className="w-4 h-4 text-amber-400" />
                                    <span className="text-sm text-slate-300 group-hover:text-white">Criar Regra</span>
                                    <ExternalLink className="w-3 h-3 text-slate-600 ml-auto opacity-0 group-hover:opacity-100" />
                                </div>
                            </Link>
                            <Link href="/dashboard/telemetry" className="block">
                                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors group">
                                    <BarChart3 className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm text-slate-300 group-hover:text-white">Ver Métricas</span>
                                    <ExternalLink className="w-3 h-3 text-slate-600 ml-auto opacity-0 group-hover:opacity-100" />
                                </div>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* App Info - Collapsible */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/5"
            >
                <div className="flex items-center gap-3 mb-4">
                    <Settings className="w-4 h-4 text-slate-400" />
                    <h3 className="font-bold text-white">Informações do App</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID</p>
                        <p className="text-slate-400 font-mono text-xs mt-1 truncate">{app.id}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Slug</p>
                        <p className="text-indigo-400 font-mono text-xs mt-1">{app.slug}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Criado</p>
                        <p className="text-slate-300 text-xs mt-1">{new Date(app.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Atualizado</p>
                        <p className="text-slate-300 text-xs mt-1">{new Date(app.updated_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
            </motion.div>

            {/* Danger Zone */}
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span className="text-sm font-bold text-rose-400">Zona de Perigo</span>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-rose-400 hover:bg-rose-500/10 text-xs"
                        onClick={() => toast.error("Funcionalidade em desenvolvimento")}
                    >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Deletar App
                    </Button>
                </div>
            </div>
        </div>
    );
}
