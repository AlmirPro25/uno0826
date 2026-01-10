"use client";

import { useState, useEffect } from "react";
import { Shield, Plus, Search, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle, Clock, Trash2 } from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";

interface Policy {
    id: string;
    name: string;
    description: string;
    resource_type: string;
    action: string;
    effect: "allow" | "deny" | "require_approval";
    conditions: Record<string, unknown>;
    is_active: boolean;
    priority: number;
    created_at: string;
}

const mockPolicies: Policy[] = [
    {
        id: "1",
        name: "Limite de Transações",
        description: "Requer aprovação para transações acima de R$ 10.000",
        resource_type: "transaction",
        action: "create",
        effect: "require_approval",
        conditions: { amount_gt: 10000 },
        is_active: true,
        priority: 1,
        created_at: "2026-01-08T10:00:00Z"
    },
    {
        id: "2",
        name: "Bloqueio Horário",
        description: "Bloqueia operações críticas fora do horário comercial",
        resource_type: "agent",
        action: "execute",
        effect: "deny",
        conditions: { outside_hours: "09:00-18:00" },
        is_active: true,
        priority: 2,
        created_at: "2026-01-07T14:30:00Z"
    },
    {
        id: "3",
        name: "Acesso Admin",
        description: "Permite acesso total para super admins",
        resource_type: "*",
        action: "*",
        effect: "allow",
        conditions: { role: "super_admin" },
        is_active: true,
        priority: 0,
        created_at: "2026-01-01T00:00:00Z"
    }
];

export default function PoliciesPage() {
    const { activeApp, hasApp } = useApp();
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setPolicies(mockPolicies);
            setLoading(false);
        }, 500);
    }, []);

    const filteredPolicies = policies.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    );

    const togglePolicy = (id: string) => {
        setPolicies(prev => prev.map(p =>
            p.id === id ? { ...p, is_active: !p.is_active } : p
        ));
    };

    const getEffectBadge = (effect: Policy["effect"]) => {
        switch (effect) {
            case "allow":
                return <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ALLOW</span>;
            case "deny":
                return <span className="px-2 py-1 text-xs font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">DENY</span>;
            case "require_approval":
                return <span className="px-2 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">APPROVAL</span>;
        }
    };

    return (
        <div className="space-y-6">
            <AppHeader />
            
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">
                        Políticas {activeApp ? `de ${activeApp.name}` : ""}
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Regras de governança que controlam o comportamento do sistema</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nova Política
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    placeholder="Buscar políticas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Total", value: policies.length, icon: Shield, color: "indigo" },
                    { label: "Ativas", value: policies.filter(p => p.is_active).length, icon: CheckCircle, color: "emerald" },
                    { label: "Bloqueio", value: policies.filter(p => p.effect === "deny").length, icon: AlertTriangle, color: "rose" },
                    { label: "Aprovação", value: policies.filter(p => p.effect === "require_approval").length, icon: Clock, color: "amber" }
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

            {/* Policies List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredPolicies.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">
                        {hasApp && activeApp 
                            ? `${activeApp.name} ainda não tem políticas` 
                            : "Nenhuma política encontrada"}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredPolicies.map((policy) => (
                        <div
                            key={policy.id}
                            className={`p-5 bg-white/[0.02] border rounded-2xl transition-all ${
                                policy.is_active ? "border-white/10" : "border-white/5 opacity-60"
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-white">{policy.name}</h3>
                                        {getEffectBadge(policy.effect)}
                                        <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded">
                                            P{policy.priority}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-3">{policy.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span>Recurso: <code className="text-indigo-400">{policy.resource_type}</code></span>
                                        <span>Ação: <code className="text-indigo-400">{policy.action}</code></span>
                                        <span>Condições: <code className="text-slate-400">{JSON.stringify(policy.conditions)}</code></span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => togglePolicy(policy.id)}
                                        className={`p-2 rounded-lg transition-colors ${
                                            policy.is_active
                                                ? "text-emerald-400 hover:bg-emerald-500/10"
                                                : "text-slate-500 hover:bg-white/5"
                                        }`}
                                    >
                                        {policy.is_active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                                    </button>
                                    <button className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal Placeholder */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
                    <div className="bg-[#0a0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-white mb-4">Nova Política</h2>
                        <p className="text-slate-400 text-sm mb-6">Funcionalidade em desenvolvimento. Conecte ao backend para criar políticas.</p>
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
