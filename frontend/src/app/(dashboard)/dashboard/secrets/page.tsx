"use client";

import { useState, useEffect } from "react";
import { 
    Key, Plus, Search, Eye, EyeOff, Copy, Trash2, Shield, Clock, 
    CheckCircle2, Loader2, RefreshCw, RotateCcw, AlertTriangle,
    Info, X, Calendar
} from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Secret {
    id: string;
    key: string;
    app_id: string;
    app_name: string;
    description: string;
    environment: string;
    created_at: string;
    last_accessed_at: string | null;
    access_count: number;
    version: number;
    expires_at: string | null;
    is_active: boolean;
}

interface SecretStats {
    total: number;
    active: number;
    expiring_soon: number;
    by_environment: Record<string, number>;
}

export default function SecretsPage() {
    const { activeApp, hasApp } = useApp();
    const [secrets, setSecrets] = useState<Secret[]>([]);
    const [stats, setStats] = useState<SecretStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterEnv, setFilterEnv] = useState<string>("all");
    const [showCreate, setShowCreate] = useState(false);
    const [showRotate, setShowRotate] = useState<Secret | null>(null);
    const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

    // Form state
    const [createForm, setCreateForm] = useState({
        key: "",
        value: "",
        description: "",
        environment: "production",
        expires_in_days: ""
    });
    const [creating, setCreating] = useState(false);
    const [rotateValue, setRotateValue] = useState("");
    const [rotating, setRotating] = useState(false);

    const fetchSecrets = async () => {
        setLoading(true);
        try {
            const params = activeApp ? `?app_id=${activeApp.id}` : "";
            const res = await api.get(`/secrets${params}`);
            const data = res.data.secrets || res.data || [];
            setSecrets(data.map((s: Record<string, unknown>) => ({
                id: s.id,
                key: s.key,
                app_id: s.app_id,
                app_name: s.app_name || "Global",
                description: s.description || "",
                environment: s.environment || "production",
                created_at: s.created_at,
                last_accessed_at: s.last_accessed_at,
                access_count: s.access_count || 0,
                version: s.version || 1,
                expires_at: s.expires_at,
                is_active: s.is_active !== false
            })));

            // Calcular stats
            const active = data.filter((s: Record<string, unknown>) => s.is_active !== false).length;
            const byEnv: Record<string, number> = {};
            data.forEach((s: Record<string, unknown>) => {
                const env = (s.environment as string) || "production";
                byEnv[env] = (byEnv[env] || 0) + 1;
            });
            setStats({
                total: data.length,
                active,
                expiring_soon: 0,
                by_environment: byEnv
            });
        } catch (error) {
            console.error("Failed to fetch secrets", error);
            setSecrets([]);
        } finally {
            setLoading(false);
        }
    };

    const createSecret = async () => {
        if (!createForm.key || !createForm.value) {
            toast.error("Key e Value são obrigatórios");
            return;
        }
        setCreating(true);
        try {
            await api.post("/secrets", {
                key: createForm.key,
                value: createForm.value,
                description: createForm.description,
                environment: createForm.environment,
                app_id: activeApp?.id,
                expires_in_days: createForm.expires_in_days ? parseInt(createForm.expires_in_days) : null
            });
            toast.success("Secret criado com sucesso!");
            setShowCreate(false);
            setCreateForm({ key: "", value: "", description: "", environment: "production", expires_in_days: "" });
            fetchSecrets();
        } catch {
            toast.error("Falha ao criar secret");
        } finally {
            setCreating(false);
        }
    };

    const rotateSecret = async () => {
        if (!showRotate || !rotateValue) {
            toast.error("Novo valor é obrigatório");
            return;
        }
        setRotating(true);
        try {
            await api.post(`/secrets/${showRotate.id}/rotate`, { value: rotateValue });
            toast.success("Secret rotacionado! Nova versão criada.");
            setShowRotate(null);
            setRotateValue("");
            fetchSecrets();
        } catch {
            toast.error("Falha ao rotacionar secret");
        } finally {
            setRotating(false);
        }
    };

    const revokeSecret = async (id: string) => {
        if (!confirm("Tem certeza que deseja revogar este secret? Esta ação não pode ser desfeita.")) return;
        try {
            await api.delete(`/secrets/${id}`);
            toast.success("Secret revogado");
            fetchSecrets();
        } catch {
            toast.error("Falha ao revogar secret");
        }
    };

    useEffect(() => {
        fetchSecrets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeApp?.id]);

    const filteredSecrets = secrets.filter(s => {
        const matchesSearch = !search || 
            s.key.toLowerCase().includes(search.toLowerCase()) ||
            s.description.toLowerCase().includes(search.toLowerCase());
        const matchesEnv = filterEnv === "all" || s.environment === filterEnv;
        return matchesSearch && matchesEnv;
    });

    const toggleReveal = (id: string) => {
        setRevealedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copiado!");
    };

    const formatRelativeTime = (timestamp: string | null) => {
        if (!timestamp) return "Nunca";
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        if (diffMin < 60) return `${diffMin}min atrás`;
        if (diffHour < 24) return `${diffHour}h atrás`;
        if (diffDay < 7) return `${diffDay}d atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    const getEnvColor = (env: string) => {
        switch (env) {
            case "production": return "rose";
            case "staging": return "amber";
            case "development": return "emerald";
            default: return "slate";
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
                        <Key className="w-8 h-8 text-indigo-400" />
                        Secrets
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Gerenciamento seguro de credenciais e chaves de API
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchSecrets}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </button>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Secret
                    </button>
                </div>
            </div>

            {/* Warning Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3"
            >
                <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-amber-400">Área de Segurança Crítica</p>
                    <p className="text-xs text-amber-400/70 mt-1">
                        Secrets são criptografados com AES-256. Valores nunca são expostos após criação.
                        Todas as operações são registradas no audit log. Use rotação regular.
                    </p>
                </div>
            </motion.div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total", value: stats.total, icon: Key, color: "indigo" },
                        { label: "Ativos", value: stats.active, icon: CheckCircle2, color: "emerald" },
                        { label: "Production", value: stats.by_environment.production || 0, icon: Shield, color: "rose" },
                        { label: "Staging", value: stats.by_environment.staging || 0, icon: Clock, color: "amber" },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl"
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-xl", `bg-${stat.color}-500/20`)}>
                                    <stat.icon className={cn("w-4 h-4", `text-${stat.color}-400`)} />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">{stat.value}</p>
                                    <p className="text-xs text-slate-500">{stat.label}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar secrets..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
                    />
                </div>
                <select
                    value={filterEnv}
                    onChange={(e) => setFilterEnv(e.target.value)}
                    className="h-12 px-4 rounded-xl bg-white/[0.02] border border-white/10 text-white focus:border-indigo-500/50 outline-none"
                >
                    <option value="all">Todos Ambientes</option>
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                </select>
            </div>

            {/* Secrets List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : filteredSecrets.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <Key className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                        {hasApp && activeApp 
                            ? `${activeApp.name} ainda não tem secrets` 
                            : "Nenhum secret encontrado"}
                    </h3>
                    <p className="text-slate-500 mb-4">Crie secrets para armazenar credenciais de forma segura</p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
                    >
                        <Plus className="w-4 h-4 inline mr-2" />
                        Criar Primeiro Secret
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredSecrets.map((secret, i) => {
                        const envColor = getEnvColor(secret.environment);
                        return (
                            <motion.div
                                key={secret.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className={cn(
                                    "p-5 rounded-2xl border transition-all",
                                    secret.is_active 
                                        ? "bg-white/[0.02] border-white/10" 
                                        : "bg-white/[0.01] border-white/5 opacity-60"
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        `bg-${envColor}-500/20`
                                    )}>
                                        <Key className={cn("w-5 h-5", `text-${envColor}-400`)} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <code className="text-sm font-bold text-white bg-slate-800 px-2 py-1 rounded font-mono">
                                                {secret.key}
                                            </code>
                                            <span className={cn(
                                                "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase",
                                                `bg-${envColor}-500/20 text-${envColor}-400`
                                            )}>
                                                {secret.environment}
                                            </span>
                                            {!secret.is_active && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-500/20 text-slate-400 rounded-full uppercase">
                                                    Revogado
                                                </span>
                                            )}
                                            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 rounded-full">
                                                v{secret.version}
                                            </span>
                                        </div>
                                        
                                        {secret.description && (
                                            <p className="text-sm text-slate-400 mb-3">{secret.description}</p>
                                        )}
                                        
                                        {/* Value (masked) */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="flex-1 font-mono text-xs bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-slate-400">
                                                {revealedIds.has(secret.id) 
                                                    ? "••••••••••••••••••••••••" 
                                                    : "••••••••••••••••••••••••"}
                                            </div>
                                            <button
                                                onClick={() => toggleReveal(secret.id)}
                                                className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                title="Valores nunca são expostos após criação"
                                            >
                                                {revealedIds.has(secret.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => copyToClipboard(secret.key)}
                                                className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                title="Copiar key"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                Criado: {formatRelativeTime(secret.created_at)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Último acesso: {formatRelativeTime(secret.last_accessed_at)}
                                            </span>
                                            <span>{secret.access_count.toLocaleString()} acessos</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        {secret.is_active && (
                                            <button 
                                                onClick={() => setShowRotate(secret)}
                                                className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                                title="Rotacionar secret"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => revokeSecret(secret.id)}
                                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                            title="Revogar secret"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowCreate(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-3xl p-8 space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                        <Key className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">Novo Secret</h2>
                                </div>
                                <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-amber-400">
                                        O valor do secret só será visível agora. Após criar, não será possível visualizá-lo novamente.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Key (identificador)</label>
                                    <input
                                        value={createForm.key}
                                        onChange={(e) => setCreateForm({ ...createForm, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })}
                                        placeholder="Ex: STRIPE_SECRET_KEY"
                                        className="mt-2 w-full h-11 px-4 rounded-xl bg-white/[0.02] border border-white/10 text-white font-mono placeholder:text-slate-600 focus:border-indigo-500/50 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Value (valor secreto)</label>
                                    <input
                                        type="password"
                                        value={createForm.value}
                                        onChange={(e) => setCreateForm({ ...createForm, value: e.target.value })}
                                        placeholder="sk_live_xxxxxxxxxxxxx"
                                        className="mt-2 w-full h-11 px-4 rounded-xl bg-white/[0.02] border border-white/10 text-white font-mono placeholder:text-slate-600 focus:border-indigo-500/50 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Descrição (opcional)</label>
                                    <input
                                        value={createForm.description}
                                        onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                        placeholder="Chave de API do Stripe para produção"
                                        className="mt-2 w-full h-11 px-4 rounded-xl bg-white/[0.02] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500/50 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ambiente</label>
                                        <select
                                            value={createForm.environment}
                                            onChange={(e) => setCreateForm({ ...createForm, environment: e.target.value })}
                                            className="mt-2 w-full h-11 px-3 rounded-xl bg-white/[0.02] border border-white/10 text-white"
                                        >
                                            <option value="production">Production</option>
                                            <option value="staging">Staging</option>
                                            <option value="development">Development</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Expira em (dias)</label>
                                        <input
                                            type="number"
                                            value={createForm.expires_in_days}
                                            onChange={(e) => setCreateForm({ ...createForm, expires_in_days: e.target.value })}
                                            placeholder="90"
                                            className="mt-2 w-full h-11 px-4 rounded-xl bg-white/[0.02] border border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500/50 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowCreate(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={createSecret}
                                    disabled={creating || !createForm.key || !createForm.value}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                                    Criar Secret
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Rotate Modal */}
            <AnimatePresence>
                {showRotate && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowRotate(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-3xl p-8 space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                        <RotateCcw className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Rotacionar Secret</h2>
                                        <code className="text-xs text-slate-400 font-mono">{showRotate.key}</code>
                                    </div>
                                </div>
                                <button onClick={() => setShowRotate(null)} className="text-slate-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                <div className="flex items-start gap-2">
                                    <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-indigo-400">
                                        A rotação cria uma nova versão do secret. A versão anterior será mantida no histórico
                                        mas não será mais usada para novos acessos.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Novo Valor</label>
                                <input
                                    type="password"
                                    value={rotateValue}
                                    onChange={(e) => setRotateValue(e.target.value)}
                                    placeholder="Novo valor do secret"
                                    className="mt-2 w-full h-11 px-4 rounded-xl bg-white/[0.02] border border-white/10 text-white font-mono placeholder:text-slate-600 focus:border-indigo-500/50 outline-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowRotate(null)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={rotateSecret}
                                    disabled={rotating || !rotateValue}
                                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    {rotating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                                    Rotacionar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
