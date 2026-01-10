"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
    ArrowLeft, Key, Copy, Eye, EyeOff, RefreshCw, Trash2, 
    Shield, Activity, Settings, Loader2, CheckCircle2, AlertTriangle 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppDetails {
    id: string;
    name: string;
    slug: string;
    description: string;
    status: string;
    created_at: string;
    updated_at: string;
}

interface Credential {
    id: string;
    public_key: string;
    secret_key?: string;
    created_at: string;
    last_used_at?: string;
    status: string;
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

export default function AppDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const appId = params.id as string;

    const [app, setApp] = useState<AppDetails | null>(null);
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [metrics, setMetrics] = useState<AppMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
    const [creatingKey, setCreatingKey] = useState(false);
    const [newSecret, setNewSecret] = useState<string | null>(null);

    const fetchApp = async () => {
        try {
            const [appRes, credsRes, metricsRes] = await Promise.all([
                api.get(`/apps/${appId}`),
                api.get(`/apps/${appId}/credentials`).catch(() => ({ data: { credentials: [] } })),
                api.get(`/apps/${appId}/metrics`).catch(() => ({ data: null }))
            ]);
            setApp(appRes.data);
            setCredentials(credsRes.data.credentials || []);
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
    }, [appId]);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copiado!`);
    };

    const createCredential = async () => {
        setCreatingKey(true);
        try {
            const res = await api.post(`/apps/${appId}/credentials`);
            setNewSecret(res.data.secret_key);
            toast.success("Credencial criada! Salve a secret key agora.");
            fetchApp();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Falha ao criar credencial");
        } finally {
            setCreatingKey(false);
        }
    };

    const revokeCredential = async (credId: string) => {
        if (!confirm("Tem certeza que deseja revogar esta credencial?")) return;
        try {
            await api.delete(`/apps/${appId}/credentials/${credId}`);
            toast.success("Credencial revogada");
            fetchApp();
        } catch (error) {
            toast.error("Falha ao revogar credencial");
        }
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
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => router.push("/dashboard/apps")}
                    className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">{app.name}</h1>
                    <p className="text-slate-500 text-sm font-mono">{app.id}</p>
                </div>
                <span className={cn(
                    "px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest",
                    app.status === 'active' 
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                )}>
                    {app.status}
                </span>
            </div>

            {/* New Secret Alert */}
            {newSecret && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20"
                >
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                        <div className="flex-1">
                            <h3 className="text-amber-500 font-bold mb-2">Salve sua Secret Key agora!</h3>
                            <p className="text-amber-400/70 text-sm mb-4">
                                Esta é a única vez que você verá esta chave. Copie e guarde em local seguro.
                            </p>
                            <div className="flex items-center gap-2 p-3 bg-black/30 rounded-xl font-mono text-sm">
                                <code className="flex-1 text-amber-300 break-all">{newSecret}</code>
                                <Button 
                                    size="icon" 
                                    variant="ghost"
                                    onClick={() => copyToClipboard(newSecret, "Secret Key")}
                                    className="shrink-0"
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                            <Button 
                                className="mt-4" 
                                variant="outline"
                                onClick={() => setNewSecret(null)}
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Já salvei
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* App Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <Settings className="w-5 h-5 text-indigo-500" /> Informações
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome</label>
                            <Input value={app.name} disabled className="mt-2 bg-white/5 border-white/10" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Slug</label>
                            <Input value={app.slug} disabled className="mt-2 bg-white/5 border-white/10 font-mono" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Descrição</label>
                            <Input value={app.description || "Sem descrição"} disabled className="mt-2 bg-white/5 border-white/10" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Criado em</label>
                                <p className="text-white mt-1">{new Date(app.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Atualizado em</label>
                                <p className="text-white mt-1">{new Date(app.updated_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <Activity className="w-5 h-5 text-emerald-500" /> Métricas
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Usuários</p>
                            <p className="text-3xl font-black text-white">{metrics?.total_users || 0}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ativos (24h)</p>
                            <p className="text-3xl font-black text-white">{metrics?.active_users_24h || 0}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sessões Total</p>
                            <p className="text-3xl font-black text-white">{metrics?.total_sessions || 0}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sessões Ativas</p>
                            <p className="text-3xl font-black text-white">{metrics?.active_sessions || 0}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Eventos</p>
                            <p className="text-3xl font-black text-white">{metrics?.total_decisions || 0}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Credenciais Ativas</p>
                            <p className="text-3xl font-black text-white">{credentials.filter(c => c.status === 'active').length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Credentials */}
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <Key className="w-5 h-5 text-amber-500" /> Credenciais de API
                    </h2>
                    <Button 
                        onClick={createCredential}
                        disabled={creatingKey}
                        className="bg-indigo-600 hover:bg-indigo-500"
                    >
                        {creatingKey ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                        Nova Credencial
                    </Button>
                </div>

                {credentials.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
                        <Key className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                            Nenhuma credencial criada
                        </p>
                        <p className="text-slate-600 text-sm mt-2">
                            Crie uma credencial para integrar sua aplicação
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {credentials.map((cred) => (
                            <div 
                                key={cred.id}
                                className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Public Key</label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <code className="text-sm text-indigo-400 font-mono bg-indigo-500/10 px-3 py-1 rounded-lg">
                                                    {cred.public_key}
                                                </code>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-8 w-8"
                                                    onClick={() => copyToClipboard(cred.public_key, "Public Key")}
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span>Criada: {new Date(cred.created_at).toLocaleDateString()}</span>
                                            {cred.last_used_at && (
                                                <span>Último uso: {new Date(cred.last_used_at).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                                            cred.status === 'active' 
                                                ? "bg-emerald-500/10 text-emerald-500"
                                                : "bg-slate-500/10 text-slate-500"
                                        )}>
                                            {cred.status}
                                        </span>
                                        <Button 
                                            size="icon" 
                                            variant="ghost"
                                            className="h-8 w-8 text-rose-500 hover:bg-rose-500/10"
                                            onClick={() => revokeCredential(cred.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
