"use client";

import { useState, useEffect } from "react";
import { Key, Plus, Search, Eye, EyeOff, Copy, Trash2, Shield, Clock, CheckCircle } from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";

interface Secret {
    id: string;
    key: string;
    app_id: string;
    app_name: string;
    description: string;
    created_at: string;
    last_accessed: string | null;
    access_count: number;
}

const mockSecrets: Secret[] = [
    {
        id: "1",
        key: "STRIPE_SECRET_KEY",
        app_id: "app-1",
        app_name: "VOX-BRIDGE",
        description: "Chave secreta da Stripe para processamento de pagamentos",
        created_at: "2026-01-05T10:00:00Z",
        last_accessed: "2026-01-10T08:30:00Z",
        access_count: 1247
    },
    {
        id: "2",
        key: "OPENAI_API_KEY",
        app_id: "app-1",
        app_name: "VOX-BRIDGE",
        description: "API Key do OpenAI para funcionalidades de IA",
        created_at: "2026-01-03T14:00:00Z",
        last_accessed: "2026-01-10T09:15:00Z",
        access_count: 8934
    },
    {
        id: "3",
        key: "DATABASE_URL",
        app_id: "app-2",
        app_name: "SCE",
        description: "Connection string do banco de dados",
        created_at: "2026-01-01T00:00:00Z",
        last_accessed: "2026-01-10T09:45:00Z",
        access_count: 45621
    }
];

export default function SecretsPage() {
    const { activeApp, hasApp } = useApp();
    const [secrets, setSecrets] = useState<Secret[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        setTimeout(() => {
            setSecrets(mockSecrets);
            setLoading(false);
        }, 500);
    }, []);

    const filteredSecrets = secrets.filter(s =>
        s.key.toLowerCase().includes(search.toLowerCase()) ||
        s.app_name.toLowerCase().includes(search.toLowerCase())
    );

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
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="space-y-6">
            <AppHeader />
            
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">
                        Secrets {activeApp ? `de ${activeApp.name}` : ""}
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Gerenciamento seguro de credenciais e chaves de API</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Novo Secret
                </button>
            </div>

            {/* Warning Banner */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-amber-400">Área Restrita</p>
                    <p className="text-xs text-amber-400/70 mt-1">
                        Secrets são criptografados com AES-256. Apenas admins podem visualizar valores.
                        Todas as operações são registradas no audit log.
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    placeholder="Buscar secrets..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: "Total Secrets", value: secrets.length, icon: Key, color: "indigo" },
                    { label: "Apps Usando", value: new Set(secrets.map(s => s.app_id)).size, icon: CheckCircle, color: "emerald" },
                    { label: "Acessos Hoje", value: "12.4K", icon: Clock, color: "amber" }
                ].map((stat) => (
                    <div key={stat.label} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl bg-${stat.color}-500/20`}>
                                <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{stat.value}</p>
                                <p className="text-xs text-slate-500">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Secrets List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredSecrets.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <Key className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">
                        {hasApp && activeApp 
                            ? `${activeApp.name} ainda não tem secrets` 
                            : "Nenhum secret encontrado"}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredSecrets.map((secret) => (
                        <div
                            key={secret.id}
                            className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <code className="text-sm font-bold text-white bg-slate-800 px-2 py-1 rounded">
                                            {secret.key}
                                        </code>
                                        <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30">
                                            {secret.app_name}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-3">{secret.description}</p>
                                    
                                    {/* Value (masked or revealed) */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex-1 font-mono text-xs bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-slate-400">
                                            {revealedIds.has(secret.id) ? "sk_live_xxxxxxxxxxxxxxxxxxxxx" : "••••••••••••••••••••••••"}
                                        </div>
                                        <button
                                            onClick={() => toggleReveal(secret.id)}
                                            className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            {revealedIds.has(secret.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => copyToClipboard(secret.key)}
                                            className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span>Criado: {formatDate(secret.created_at)}</span>
                                        <span>Último acesso: {secret.last_accessed ? formatDate(secret.last_accessed) : "Nunca"}</span>
                                        <span>{secret.access_count.toLocaleString()} acessos</span>
                                    </div>
                                </div>
                                <button className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
                    <div className="bg-[#0a0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-white mb-4">Novo Secret</h2>
                        <p className="text-slate-400 text-sm mb-6">Funcionalidade em desenvolvimento. Conecte ao backend para criar secrets.</p>
                        <button
                            onClick={() => setShowCreate(false)}
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
