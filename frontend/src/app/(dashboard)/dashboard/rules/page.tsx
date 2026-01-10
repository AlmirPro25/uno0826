"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Plus, Search, Loader2, Zap, Play, Pause, Trash2,
    CheckCircle2, Clock, X, Code
} from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Rule {
    id: string;
    name: string;
    description: string;
    app_id: string;
    event_type: string;
    conditions: Record<string, unknown>;
    actions: Record<string, unknown>[];
    enabled: boolean;
    priority: number;
    created_at: string;
    updated_at: string;
    executions_count?: number;
    last_triggered_at?: string;
}

interface App {
    id: string;
    name: string;
    slug: string;
}

export default function RulesPage() {
    const { activeApp, hasApp } = useApp();
    const [rules, setRules] = useState<Rule[]>([]);
    const [apps, setApps] = useState<App[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

    // Sincronizar com app ativo do contexto
    useEffect(() => {
        if (activeApp && selectedApp === "all") {
            setSelectedApp(activeApp.id);
        }
    }, [activeApp, selectedApp]);

    // Form state
    const [newRule, setNewRule] = useState({
        name: "",
        description: "",
        app_id: "",
        event_type: "",
        conditions: "{}",
        actions: "[]",
        priority: 0
    });
    const [creating, setCreating] = useState(false);

    const fetchApps = async () => {
        try {
            const res = await api.get("/apps/mine");
            setApps(res.data.apps || []);
            if (res.data.apps?.length > 0 && !newRule.app_id) {
                setNewRule(prev => ({ ...prev, app_id: res.data.apps[0].id }));
            }
        } catch (error) {
            console.error("Failed to fetch apps", error);
        }
    };

    const fetchRules = async () => {
        try {
            const endpoint = selectedApp === "all" 
                ? "/rules"
                : `/rules?app_id=${selectedApp}`;
            const res = await api.get(endpoint);
            setRules(res.data.rules || res.data || []);
        } catch (error) {
            console.error("Failed to fetch rules", error);
            // Mock data for demo
            setRules([
                {
                    id: "rule_001",
                    name: "Rate Limit Alert",
                    description: "Alerta quando taxa de requests excede limite",
                    app_id: apps[0]?.id || "",
                    event_type: "api.request",
                    conditions: { "requests_per_minute": { "$gt": 100 } },
                    actions: [{ type: "alert", severity: "warning" }],
                    enabled: true,
                    priority: 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    executions_count: 15,
                    last_triggered_at: new Date(Date.now() - 3600000).toISOString()
                },
                {
                    id: "rule_002",
                    name: "High Value Transaction",
                    description: "Notifica transações acima de R$1000",
                    app_id: apps[0]?.id || "",
                    event_type: "billing.payment",
                    conditions: { "amount": { "$gt": 100000 } },
                    actions: [{ type: "notify", channel: "email" }],
                    enabled: true,
                    priority: 2,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    executions_count: 3
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApps();
    }, []);

    useEffect(() => {
        if (apps.length > 0) {
            fetchRules();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedApp, apps]);

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post("/rules", {
                ...newRule,
                conditions: JSON.parse(newRule.conditions),
                actions: JSON.parse(newRule.actions),
                enabled: true
            });
            toast.success("Regra criada com sucesso!");
            setShowCreateModal(false);
            setNewRule({ name: "", description: "", app_id: apps[0]?.id || "", event_type: "", conditions: "{}", actions: "[]", priority: 0 });
            fetchRules();
        } catch (error) {
            toast.error("Falha ao criar regra");
        } finally {
            setCreating(false);
        }
    };

    const toggleRule = async (rule: Rule) => {
        try {
            await api.put(`/rules/${rule.id}`, { enabled: !rule.enabled });
            setRules(rules.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r));
            toast.success(rule.enabled ? "Regra desativada" : "Regra ativada");
        } catch (error) {
            toast.error("Falha ao atualizar regra");
        }
    };

    const deleteRule = async (ruleId: string) => {
        if (!confirm("Tem certeza que deseja excluir esta regra?")) return;
        try {
            await api.delete(`/rules/${ruleId}`);
            setRules(rules.filter(r => r.id !== ruleId));
            toast.success("Regra excluída");
        } catch (error) {
            toast.error("Falha ao excluir regra");
        }
    };

    const filteredRules = rules.filter(rule => {
        if (!searchQuery) return true;
        return rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               rule.event_type.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="space-y-6 pb-12">
            {/* App Context Header */}
            <AppHeader />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                        Regras {activeApp ? `de ${activeApp.name}` : "do Kernel"}
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Automações baseadas em eventos • {filteredRules.length} regras
                    </p>
                </div>
                <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                    <Plus className="w-4 h-4 mr-2" /> Nova Regra
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <select
                    value={selectedApp}
                    onChange={(e) => setSelectedApp(e.target.value)}
                    className="h-11 px-4 rounded-xl bg-white/[0.02] border border-white/10 text-white focus:border-indigo-500/50 outline-none"
                >
                    <option value="all">Todos os Apps</option>
                    {apps.map(app => (
                        <option key={app.id} value={app.id}>{app.name}</option>
                    ))}
                </select>
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <Input
                        placeholder="Buscar regras..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11 pl-11 bg-white/[0.02] border-white/10 focus:border-indigo-500/50 rounded-xl text-white"
                    />
                </div>
            </div>

            {/* Rules List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : filteredRules.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <Zap className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                        {hasApp && activeApp 
                            ? `${activeApp.name} ainda não tem regras` 
                            : "Nenhuma regra criada"}
                    </h3>
                    <p className="text-slate-500 mb-6">Crie regras para automatizar ações baseadas em eventos</p>
                    <Button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 hover:bg-indigo-500">
                        <Plus className="w-4 h-4 mr-2" /> Criar Primeira Regra
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredRules.map((rule, i) => (
                        <motion.div
                            key={rule.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                                "p-5 rounded-2xl border transition-all cursor-pointer",
                                rule.enabled 
                                    ? "bg-white/[0.02] border-white/5 hover:border-white/10" 
                                    : "bg-white/[0.01] border-white/5 opacity-60"
                            )}
                            onClick={() => setSelectedRule(rule)}
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                    rule.enabled ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-500/20 text-slate-500"
                                )}>
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-white">{rule.name}</h3>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                            rule.enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-500"
                                        )}>
                                            {rule.enabled ? "Ativa" : "Inativa"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-2">{rule.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-slate-600">
                                        <span className="flex items-center gap-1">
                                            <Code className="w-3 h-3" />
                                            {rule.event_type}
                                        </span>
                                        {rule.executions_count !== undefined && (
                                            <span className="flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" />
                                                {rule.executions_count} execuções
                                            </span>
                                        )}
                                        {rule.last_triggered_at && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Último: {new Date(rule.last_triggered_at).toLocaleDateString('pt-BR')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => { e.stopPropagation(); toggleRule(rule); }}
                                        className="h-9 w-9 rounded-lg"
                                    >
                                        {rule.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => { e.stopPropagation(); deleteRule(rule.id); }}
                                        className="h-9 w-9 rounded-lg text-rose-500 hover:bg-rose-500/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowCreateModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-3xl p-8 space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Nova Regra</h2>
                                <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateRule} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome</label>
                                    <Input
                                        value={newRule.name}
                                        onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                        placeholder="Ex: Rate Limit Alert"
                                        className="mt-2 h-11 bg-white/[0.02] border-white/10 rounded-xl text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Descrição</label>
                                    <Input
                                        value={newRule.description}
                                        onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                                        placeholder="O que esta regra faz?"
                                        className="mt-2 h-11 bg-white/[0.02] border-white/10 rounded-xl text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">App</label>
                                        <select
                                            value={newRule.app_id}
                                            onChange={(e) => setNewRule({ ...newRule, app_id: e.target.value })}
                                            className="mt-2 w-full h-11 px-3 rounded-xl bg-white/[0.02] border border-white/10 text-white"
                                            required
                                        >
                                            {apps.map(app => (
                                                <option key={app.id} value={app.id}>{app.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tipo de Evento</label>
                                        <Input
                                            value={newRule.event_type}
                                            onChange={(e) => setNewRule({ ...newRule, event_type: e.target.value })}
                                            placeholder="api.request"
                                            className="mt-2 h-11 bg-white/[0.02] border-white/10 rounded-xl text-white"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Condições (JSON)</label>
                                    <textarea
                                        value={newRule.conditions}
                                        onChange={(e) => setNewRule({ ...newRule, conditions: e.target.value })}
                                        placeholder='{"field": {"$gt": 100}}'
                                        className="mt-2 w-full h-24 p-3 rounded-xl bg-white/[0.02] border border-white/10 text-white font-mono text-sm resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ações (JSON Array)</label>
                                    <textarea
                                        value={newRule.actions}
                                        onChange={(e) => setNewRule({ ...newRule, actions: e.target.value })}
                                        placeholder='[{"type": "alert", "severity": "warning"}]'
                                        className="mt-2 w-full h-24 p-3 rounded-xl bg-white/[0.02] border border-white/10 text-white font-mono text-sm resize-none"
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)} className="flex-1 h-12 rounded-xl">
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={creating} className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500">
                                        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Regra"}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Rule Detail Modal */}
            <AnimatePresence>
                {selectedRule && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setSelectedRule(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-2xl bg-[#0a0a0f] border border-white/10 rounded-3xl p-8 space-y-6 max-h-[80vh] overflow-auto"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-white">{selectedRule.name}</h2>
                                <button onClick={() => setSelectedRule(null)} className="text-slate-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-slate-400">{selectedRule.description}</p>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Evento</label>
                                    <p className="text-white font-mono mt-1">{selectedRule.event_type}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Prioridade</label>
                                    <p className="text-white mt-1">{selectedRule.priority}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Condições</label>
                                <pre className="mt-2 p-4 rounded-xl bg-black/30 text-sm font-mono text-slate-300 overflow-auto">
                                    {JSON.stringify(selectedRule.conditions, null, 2)}
                                </pre>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Ações</label>
                                <pre className="mt-2 p-4 rounded-xl bg-black/30 text-sm font-mono text-slate-300 overflow-auto">
                                    {JSON.stringify(selectedRule.actions, null, 2)}
                                </pre>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button 
                                    variant="outline" 
                                    onClick={() => toggleRule(selectedRule)}
                                    className="flex-1 h-12 rounded-xl border-white/10"
                                >
                                    {selectedRule.enabled ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                    {selectedRule.enabled ? "Desativar" : "Ativar"}
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={() => { deleteRule(selectedRule.id); setSelectedRule(null); }}
                                    className="h-12 px-6 rounded-xl border-rose-500/20 text-rose-400 hover:bg-rose-500/10"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
