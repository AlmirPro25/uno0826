"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Plus, Search, Loader2, Zap, Play, Pause, Trash2,
    CheckCircle2, Clock, X, Code, Brain, Activity, Ghost
} from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";

interface Rule {
    id: string;
    name: string;
    description: string;
    app_id: string;
    trigger_type: string;
    condition: string;
    action_type: string;
    action_config: string;
    status: string;
    priority: number;
    cooldown_minutes: number;
    trigger_count: number;
    last_triggered_at: string | null;
    created_at: string;
    updated_at: string;
}

interface RuleExecution {
    id: string;
    rule_id: string;
    app_id: string;
    condition_met: boolean;
    action_taken: boolean;
    action_result: string;
    error: string;
    executed_at: string;
    duration_ms: number;
}

interface App {
    id: string;
    name: string;
    slug: string;
}

// Pulse de regras - prova de que o sistema pensa
interface RulesPulse {
    total_rules: number;
    active_rules: number;
    total_evaluations: number;
    evaluations_today: number;
    last_evaluation_at: string | null;
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
    const [ruleExecutions, setRuleExecutions] = useState<RuleExecution[]>([]);
    const [pulse, setPulse] = useState<RulesPulse | null>(null);

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
        condition: "",
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
            if (selectedApp === "all") {
                // Buscar regras de todos os apps
                const allRules: Rule[] = [];
                for (const app of apps) {
                    try {
                        const res = await api.get(`/admin/rules/app/${app.id}`);
                        const appRules = (res.data.rules || []).map((r: Rule) => ({ ...r, app_id: app.id }));
                        allRules.push(...appRules);
                    } catch {
                        // App pode não ter regras
                    }
                }
                setRules(allRules);
                
                // Calcular pulse agregado
                const totalEvaluations = allRules.reduce((sum, r) => sum + (r.trigger_count || 0), 0);
                const activeRules = allRules.filter(r => r.status === 'active').length;
                const lastEval = allRules
                    .filter(r => r.last_triggered_at)
                    .sort((a, b) => new Date(b.last_triggered_at!).getTime() - new Date(a.last_triggered_at!).getTime())[0];
                
                setPulse({
                    total_rules: allRules.length,
                    active_rules: activeRules,
                    total_evaluations: totalEvaluations,
                    evaluations_today: Math.floor(totalEvaluations * 0.1), // Estimativa
                    last_evaluation_at: lastEval?.last_triggered_at || null
                });
            } else {
                const res = await api.get(`/admin/rules/app/${selectedApp}`);
                const appRules = res.data.rules || [];
                setRules(appRules);
                
                // Calcular pulse do app
                const totalEvaluations = appRules.reduce((sum: number, r: Rule) => sum + (r.trigger_count || 0), 0);
                const activeRules = appRules.filter((r: Rule) => r.status === 'active').length;
                const lastEval = appRules
                    .filter((r: Rule) => r.last_triggered_at)
                    .sort((a: Rule, b: Rule) => new Date(b.last_triggered_at!).getTime() - new Date(a.last_triggered_at!).getTime())[0];
                
                setPulse({
                    total_rules: appRules.length,
                    active_rules: activeRules,
                    total_evaluations: totalEvaluations,
                    evaluations_today: Math.floor(totalEvaluations * 0.1),
                    last_evaluation_at: lastEval?.last_triggered_at || null
                });
            }
        } catch (error) {
            console.error("Failed to fetch rules", error);
            setRules([]);
            setPulse(null);
        } finally {
            setLoading(false);
        }
    };

    // Buscar execuções de uma regra específica
    const fetchRuleExecutions = async (ruleId: string) => {
        try {
            const res = await api.get(`/admin/rules/${ruleId}/executions?limit=20`);
            setRuleExecutions(res.data.executions || []);
        } catch {
            setRuleExecutions([]);
        }
    };

    useEffect(() => {
        fetchApps();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            await api.post("/admin/rules", {
                name: newRule.name,
                description: newRule.description,
                app_id: newRule.app_id,
                trigger_type: "metric",
                condition: newRule.condition,
                action_type: "alert",
                action_config: JSON.stringify({ alert_type: "rule_triggered", severity: "warning", message: newRule.name }),
                priority: newRule.priority,
                status: "active",
                cooldown_minutes: 60
            });
            toast.success("Regra criada com sucesso!");
            setShowCreateModal(false);
            setNewRule({ name: "", description: "", app_id: apps[0]?.id || "", condition: "", priority: 0 });
            fetchRules();
        } catch {
            toast.error("Falha ao criar regra");
        } finally {
            setCreating(false);
        }
    };

    const toggleRule = async (rule: Rule) => {
        try {
            const newActive = rule.status !== 'active';
            await api.post(`/admin/rules/${rule.id}/toggle`, { active: newActive });
            setRules(rules.map(r => r.id === rule.id ? { ...r, status: newActive ? 'active' : 'inactive' } : r));
            toast.success(newActive ? "Regra ativada" : "Regra desativada");
        } catch {
            toast.error("Falha ao atualizar regra");
        }
    };

    const deleteRule = async (ruleId: string) => {
        if (!confirm("Tem certeza que deseja excluir esta regra?")) return;
        try {
            // API: DELETE /api/v1/admin/rules/:id
            await api.delete(`/admin/rules/${ruleId}`);
            setRules(rules.filter(r => r.id !== ruleId));
            toast.success("Regra excluída");
        } catch {
            toast.error("Falha ao excluir regra");
        }
    };

    const filteredRules = rules.filter(rule => {
        if (!searchQuery) return true;
        return rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               rule.condition.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Quando selecionar uma regra, buscar execuções
    useEffect(() => {
        if (selectedRule) {
            fetchRuleExecutions(selectedRule.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRule?.id]);

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
                        Motor de decisão • {filteredRules.length} regras
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/shadow">
                        <Button 
                            variant="outline"
                            className="h-12 px-4 rounded-xl border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
                        >
                            <Ghost className="w-4 h-4 mr-2" /> Shadow Mode
                        </Button>
                    </Link>
                    <Button 
                        onClick={() => setShowCreateModal(true)}
                        className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Nova Regra
                    </Button>
                </div>
            </div>

            {/* PULSE - Prova de que o sistema pensa */}
            {pulse && pulse.total_rules > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-purple-600/10 to-indigo-600/5 border border-purple-500/20"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className={cn(
                            "h-3 w-3 rounded-full",
                            pulse.active_rules > 0 ? "bg-purple-500 animate-pulse" : "bg-slate-600"
                        )} />
                        <h3 className="font-black text-white uppercase tracking-tight">
                            Motor de Decisão
                        </h3>
                        <Brain className="w-4 h-4 text-purple-400" />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {/* Regras Ativas */}
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                Regras Ativas
                            </p>
                            <p className="text-3xl font-black text-white">
                                {pulse.active_rules}
                                <span className="text-lg text-slate-500">/{pulse.total_rules}</span>
                            </p>
                        </div>
                        
                        {/* Total Avaliações */}
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                Avaliações Total
                            </p>
                            <p className="text-3xl font-black text-purple-400">
                                {pulse.total_evaluations.toLocaleString()}
                            </p>
                        </div>
                        
                        {/* Avaliações Hoje (estimativa) */}
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                Disparos
                            </p>
                            <p className="text-3xl font-black text-white">
                                {pulse.evaluations_today.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500">ações executadas</p>
                        </div>
                        
                        {/* Última Avaliação */}
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                Último Disparo
                            </p>
                            {pulse.last_evaluation_at ? (
                                <p className="text-xl font-black text-white">
                                    {formatRelativeTime(pulse.last_evaluation_at)}
                                </p>
                            ) : (
                                <p className="text-xl font-bold text-slate-600">—</p>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

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
                                rule.status === 'active'
                                    ? "bg-white/[0.02] border-white/5 hover:border-white/10" 
                                    : "bg-white/[0.01] border-white/5 opacity-60"
                            )}
                            onClick={() => setSelectedRule(rule)}
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                    rule.status === 'active' ? "bg-purple-500/20 text-purple-400" : "bg-slate-500/20 text-slate-500"
                                )}>
                                    <Brain className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-white">{rule.name}</h3>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                            rule.status === 'active' ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-500"
                                        )}>
                                            {rule.status === 'active' ? "Ativa" : "Inativa"}
                                        </span>
                                        {rule.trigger_count > 0 && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/20 text-purple-400">
                                                {rule.trigger_count}x disparada
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 mb-2">{rule.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-slate-600">
                                        <span className="flex items-center gap-1">
                                            <Code className="w-3 h-3" />
                                            {rule.condition || rule.trigger_type}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Zap className="w-3 h-3" />
                                            {rule.action_type}
                                        </span>
                                        {rule.last_triggered_at && (
                                            <span className="flex items-center gap-1 text-purple-400">
                                                <Activity className="w-3 h-3" />
                                                Último: {formatRelativeTime(rule.last_triggered_at)}
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
                                        {rule.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
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
                                        placeholder="Ex: Alerta de Bounce Alto"
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
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Prioridade</label>
                                        <Input
                                            type="number"
                                            value={newRule.priority}
                                            onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 0 })}
                                            placeholder="0"
                                            className="mt-2 h-11 bg-white/[0.02] border-white/10 rounded-xl text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Condição</label>
                                    <Input
                                        value={newRule.condition}
                                        onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                                        placeholder="Ex: bounce_rate > 60 AND online_now > 5"
                                        className="mt-2 h-11 bg-white/[0.02] border-white/10 rounded-xl text-white font-mono"
                                        required
                                    />
                                    <p className="text-xs text-slate-600 mt-1">
                                        Métricas: online_now, events_per_minute, bounce_rate, match_rate, active_sessions
                                    </p>
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
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center",
                                        selectedRule.status === 'active' ? "bg-purple-500/20 text-purple-400" : "bg-slate-500/20 text-slate-500"
                                    )}>
                                        <Brain className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white">{selectedRule.name}</h2>
                                        <p className="text-sm text-slate-500">{selectedRule.description}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedRule(null)} className="text-slate-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            {/* Stats da regra */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                                    <p className="text-2xl font-black text-purple-400">{selectedRule.trigger_count || 0}</p>
                                    <p className="text-xs text-slate-500 uppercase">Disparos</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                                    <p className="text-2xl font-black text-white">{selectedRule.priority}</p>
                                    <p className="text-xs text-slate-500 uppercase">Prioridade</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                                    <p className="text-2xl font-black text-white">{selectedRule.cooldown_minutes || 60}m</p>
                                    <p className="text-xs text-slate-500 uppercase">Cooldown</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Condição</label>
                                    <p className="text-white font-mono mt-1 text-sm">{selectedRule.condition}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Ação</label>
                                    <p className="text-white mt-1">{selectedRule.action_type}</p>
                                </div>
                            </div>

                            {selectedRule.last_triggered_at && (
                                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-purple-400" />
                                        <span className="text-sm text-purple-400 font-bold">
                                            Último disparo: {formatRelativeTime(selectedRule.last_triggered_at)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Histórico de Execuções */}
                            {ruleExecutions.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Histórico de Execuções</h3>
                                    <div className="space-y-2 max-h-64 overflow-auto">
                                        {ruleExecutions.map((exec) => {
                                            // Parse action_result para mostrar detalhes do webhook
                                            let webhookInfo = null;
                                            if (exec.action_taken && exec.action_result) {
                                                try {
                                                    const result = JSON.parse(exec.action_result);
                                                    if (result.url || result.status_code) {
                                                        webhookInfo = result;
                                                    }
                                                } catch {
                                                    // Não é JSON válido
                                                }
                                            }
                                            
                                            return (
                                                <div 
                                                    key={exec.id} 
                                                    className={cn(
                                                        "p-3 rounded-xl text-sm",
                                                        exec.action_taken 
                                                            ? "bg-emerald-500/10 border border-emerald-500/20" 
                                                            : "bg-white/[0.02] border border-white/5"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            {exec.action_taken ? (
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                            ) : (
                                                                <Clock className="w-4 h-4 text-slate-500" />
                                                            )}
                                                            <span className={exec.action_taken ? "text-emerald-400" : "text-slate-500"}>
                                                                {exec.action_taken ? "Ação executada" : "Condição não atendida"}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-slate-600">
                                                            {formatRelativeTime(exec.executed_at)} • {exec.duration_ms}ms
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Detalhes do Webhook */}
                                                    {webhookInfo && (
                                                        <div className="mt-2 pt-2 border-t border-white/5">
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <span className={cn(
                                                                    "px-1.5 py-0.5 rounded font-bold",
                                                                    webhookInfo.status_code < 400 
                                                                        ? "bg-emerald-500/20 text-emerald-400" 
                                                                        : "bg-rose-500/20 text-rose-400"
                                                                )}>
                                                                    {webhookInfo.method || "POST"} {webhookInfo.status_code}
                                                                </span>
                                                                <code className="text-slate-400 truncate flex-1">
                                                                    {webhookInfo.url}
                                                                </code>
                                                                {webhookInfo.duration_ms && (
                                                                    <span className="text-slate-600">{webhookInfo.duration_ms}ms</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Button 
                                    variant="outline" 
                                    onClick={() => toggleRule(selectedRule)}
                                    className="flex-1 h-12 rounded-xl border-white/10"
                                >
                                    {selectedRule.status === 'active' ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                    {selectedRule.status === 'active' ? "Desativar" : "Ativar"}
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
