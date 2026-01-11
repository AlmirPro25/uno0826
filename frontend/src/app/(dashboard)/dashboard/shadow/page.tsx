"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Eye, EyeOff, Loader2, Clock, Shield,
    AlertTriangle, CheckCircle2, XCircle, Ghost,
    RefreshCw, Brain, Activity
} from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface ShadowStatus {
    active: boolean;
    activated_at: string | null;
    activated_by: string;
    reason: string;
    expires_at: string | null;
    app_ids: string[];
    action_types: string[];
    domains: string[];
}

interface ShadowExecution {
    id: string;
    app_id: string;
    rule_id: string;
    rule_name: string;
    action_type: string;
    action_domain: string;
    action_config: string;
    trigger_data: string;
    condition_met: boolean;
    would_be_allowed: boolean;
    would_block_reason: string;
    simulated_result: string;
    executed_at: string;
    duration_ms: number;
}

interface ShadowStats {
    total: number;
    would_execute: number;
    would_block: number;
    by_domain: Record<string, number>;
    since: string;
}

// Traduzir erros técnicos para explicações humanas
const humanizeError = (error: string): string => {
    const errorMap: Record<string, string> = {
        "connection refused": "O servidor de destino não está respondendo. Pode estar offline ou bloqueando conexões.",
        "timeout": "A requisição demorou demais. O servidor pode estar sobrecarregado.",
        "404": "O endpoint não existe. Verifique se a URL está correta.",
        "401": "Credenciais inválidas. O token de autenticação pode ter expirado.",
        "403": "Acesso negado. Você não tem permissão para esta ação.",
        "500": "Erro interno no servidor de destino. O problema não é no PROST-QS.",
        "rate_limit": "Muitas requisições. O servidor de destino está limitando chamadas.",
        "invalid_json": "A resposta não é um JSON válido. O servidor pode estar retornando HTML de erro.",
        "certificate": "Problema com certificado SSL. O servidor pode ter certificado expirado.",
    };

    const lowerError = error.toLowerCase();
    for (const [key, explanation] of Object.entries(errorMap)) {
        if (lowerError.includes(key)) {
            return explanation;
        }
    }
    return error;
};

// Traduzir domínios para português
const domainLabels: Record<string, string> = {
    "operational": "Operacional",
    "financial": "Financeiro",
    "security": "Segurança",
    "governance": "Governança",
    "communication": "Comunicação",
};

export default function ShadowModePage() {
    const { activeApp } = useApp();
    const [status, setStatus] = useState<ShadowStatus | null>(null);
    const [executions, setExecutions] = useState<ShadowExecution[]>([]);
    const [stats, setStats] = useState<ShadowStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [showActivateModal, setShowActivateModal] = useState(false);

    // Form para ativar shadow mode
    const [activateForm, setActivateForm] = useState({
        reason: "",
        duration: "1h",
        filterByApp: false,
    });

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

    const fetchShadowStatus = async () => {
        try {
            const res = await api.get("/admin/rules/shadow");
            setStatus(res.data);
        } catch (error) {
            console.error("Failed to fetch shadow status", error);
        }
    };

    const fetchShadowExecutions = async () => {
        try {
            const params = activeApp?.id ? `?app_id=${activeApp.id}&limit=50` : "?limit=50";
            const res = await api.get(`/admin/rules/shadow/executions${params}`);
            setExecutions(res.data.executions || []);
        } catch (error) {
            console.error("Failed to fetch shadow executions", error);
            setExecutions([]);
        }
    };

    const fetchShadowStats = async () => {
        try {
            const params = activeApp?.id ? `?app_id=${activeApp.id}&since=24h` : "?since=24h";
            const res = await api.get(`/admin/rules/shadow/stats${params}`);
            setStats(res.data);
        } catch (error) {
            console.error("Failed to fetch shadow stats", error);
        }
    };

    const fetchAll = async () => {
        setLoading(true);
        await Promise.all([fetchShadowStatus(), fetchShadowExecutions(), fetchShadowStats()]);
        setLoading(false);
    };

    useEffect(() => {
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeApp?.id]);

    const activateShadowMode = async () => {
        setActivating(true);
        try {
            const payload: Record<string, unknown> = {
                reason: activateForm.reason,
                duration: activateForm.duration,
            };
            if (activateForm.filterByApp && activeApp?.id) {
                payload.app_ids = [activeApp.id];
            }
            await api.post("/admin/rules/shadow/activate", payload);
            toast.success("Shadow Mode ativado - ações serão simuladas");
            setShowActivateModal(false);
            fetchAll();
        } catch {
            toast.error("Falha ao ativar Shadow Mode");
        } finally {
            setActivating(false);
        }
    };

    const deactivateShadowMode = async () => {
        try {
            await api.post("/admin/rules/shadow/deactivate", {});
            toast.success("Shadow Mode desativado - ações voltam ao normal");
            fetchAll();
        } catch {
            toast.error("Falha ao desativar Shadow Mode");
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
                        <Ghost className="w-8 h-8 text-violet-400" />
                        Shadow Mode
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Simular sem agir • Ver o que teria acontecido
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={fetchAll}
                        disabled={loading}
                        className="h-10 px-4 rounded-xl border-white/10 text-white hover:bg-white/5"
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                        Atualizar
                    </Button>
                    {status?.active ? (
                        <Button
                            onClick={deactivateShadowMode}
                            className="h-10 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold"
                        >
                            <EyeOff className="w-4 h-4 mr-2" />
                            Desativar Shadow
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setShowActivateModal(true)}
                            className="h-10 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold"
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            Ativar Shadow Mode
                        </Button>
                    )}
                </div>
            </div>

            {/* Status Banner */}
            {status && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "p-6 rounded-2xl border",
                        status.active 
                            ? "bg-gradient-to-br from-violet-600/20 to-purple-600/10 border-violet-500/30" 
                            : "bg-white/[0.02] border-white/5"
                    )}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center",
                                status.active ? "bg-violet-500/20" : "bg-slate-500/20"
                            )}>
                                {status.active ? (
                                    <Eye className="w-7 h-7 text-violet-400" />
                                ) : (
                                    <EyeOff className="w-7 h-7 text-slate-500" />
                                )}
                            </div>
                            <div>
                                <h2 className={cn(
                                    "text-xl font-black uppercase tracking-tight",
                                    status.active ? "text-violet-400" : "text-slate-500"
                                )}>
                                    {status.active ? "Shadow Mode Ativo" : "Shadow Mode Inativo"}
                                </h2>
                                {status.active ? (
                                    <p className="text-sm text-slate-400 mt-1">
                                        Ações estão sendo simuladas, não executadas
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-500 mt-1">
                                        Ações estão sendo executadas normalmente
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        {status.active && (
                            <div className="text-right">
                                <p className="text-xs text-slate-500 uppercase tracking-widest">Ativado por</p>
                                <p className="text-white font-bold">{status.activated_by}</p>
                                {status.reason && (
                                    <p className="text-sm text-slate-400 mt-1">&ldquo;{status.reason}&rdquo;</p>
                                )}
                                {status.expires_at && (
                                    <p className="text-xs text-violet-400 mt-2 flex items-center gap-1 justify-end">
                                        <Clock className="w-3 h-3" />
                                        Expira: {formatRelativeTime(status.expires_at)}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Contrato Moral */}
                    <div className="mt-6 p-4 rounded-xl bg-black/20 border border-white/5">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                            Contrato de Confiança
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-start gap-2">
                                <Shield className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-400">
                                    Nenhuma ação real sem possibilidade de ensaio
                                </span>
                            </div>
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-400">
                                    Nenhuma falha sem explicação humana
                                </span>
                            </div>
                            <div className="flex items-start gap-2">
                                <RefreshCw className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-400">
                                    Nenhuma repetição sem intenção explícita
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Stats */}
            {stats && stats.total > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Simulações (24h)
                        </p>
                        <p className="text-3xl font-black text-white">{stats.total}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Teriam Executado
                        </p>
                        <p className="text-3xl font-black text-emerald-400">{stats.would_execute}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Teriam Bloqueado
                        </p>
                        <p className="text-3xl font-black text-rose-400">{stats.would_block}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Por Domínio
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {Object.entries(stats.by_domain || {}).map(([domain, count]) => (
                                <span key={domain} className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-400">
                                    {domainLabels[domain] || domain}: {count}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Shadow Executions List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                </div>
            ) : executions.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <Ghost className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Nenhuma simulação registrada</h3>
                    <p className="text-slate-500 mb-4">
                        Ative o Shadow Mode para ver o que teria acontecido
                    </p>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                        No Shadow Mode, todas as ações são simuladas mas não executadas.
                        Você vê exatamente o que aconteceria, sem risco.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                        O que teria acontecido
                    </h3>
                    {executions.map((exec, i) => {
                        let triggerData: Record<string, number> = {};
                        try {
                            triggerData = JSON.parse(exec.trigger_data || "{}");
                        } catch {
                            // Ignore parse errors
                        }
                        
                        return (
                            <motion.div
                                key={exec.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className={cn(
                                    "p-5 rounded-2xl border",
                                    exec.would_be_allowed && exec.condition_met
                                        ? "bg-emerald-500/5 border-emerald-500/20"
                                        : exec.condition_met && !exec.would_be_allowed
                                        ? "bg-rose-500/5 border-rose-500/20"
                                        : "bg-white/[0.02] border-white/5"
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                                        exec.would_be_allowed && exec.condition_met
                                            ? "bg-emerald-500/20 text-emerald-400"
                                            : exec.condition_met && !exec.would_be_allowed
                                            ? "bg-rose-500/20 text-rose-400"
                                            : "bg-slate-500/20 text-slate-500"
                                    )}>
                                        {exec.would_be_allowed && exec.condition_met ? (
                                            <CheckCircle2 className="w-5 h-5" />
                                        ) : exec.condition_met && !exec.would_be_allowed ? (
                                            <XCircle className="w-5 h-5" />
                                        ) : (
                                            <Clock className="w-5 h-5" />
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-bold text-white">{exec.rule_name}</span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                exec.would_be_allowed && exec.condition_met
                                                    ? "bg-emerald-500/20 text-emerald-400"
                                                    : exec.condition_met && !exec.would_be_allowed
                                                    ? "bg-rose-500/20 text-rose-400"
                                                    : "bg-slate-500/20 text-slate-500"
                                            )}>
                                                {exec.would_be_allowed && exec.condition_met
                                                    ? "Teria executado"
                                                    : exec.condition_met && !exec.would_be_allowed
                                                    ? "Teria bloqueado"
                                                    : "Condição não atendida"}
                                            </span>
                                        </div>
                                        
                                        {/* Explicação humana do que teria acontecido */}
                                        <div className="text-sm text-slate-400 mb-3">
                                            {exec.would_be_allowed && exec.condition_met ? (
                                                <span>
                                                    A ação <strong className="text-white">{exec.action_type}</strong> teria sido executada
                                                    no domínio <strong className="text-violet-400">{domainLabels[exec.action_domain] || exec.action_domain}</strong>.
                                                </span>
                                            ) : exec.condition_met && !exec.would_be_allowed ? (
                                                <span>
                                                    A ação foi bloqueada: <strong className="text-rose-400">{humanizeError(exec.would_block_reason)}</strong>
                                                </span>
                                            ) : (
                                                <span>
                                                    A condição da regra não foi atendida. Nenhuma ação seria tomada.
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Métricas que triggaram */}
                                        {Object.keys(triggerData).length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {Object.entries(triggerData).map(([key, value]) => (
                                                    <span key={key} className="px-2 py-1 rounded bg-black/30 text-xs font-mono text-slate-400">
                                                        {key}: <span className="text-white">{value}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center gap-4 text-xs text-slate-600">
                                            <span className="flex items-center gap-1">
                                                <Brain className="w-3 h-3" />
                                                {exec.action_type}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Activity className="w-3 h-3" />
                                                {exec.duration_ms}ms
                                            </span>
                                            <span>{formatRelativeTime(exec.executed_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Activate Modal */}
            <AnimatePresence>
                {showActivateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowActivateModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-3xl p-8 space-y-6"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                                    <Ghost className="w-6 h-6 text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                                        Ativar Shadow Mode
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Simular ações sem executar
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                                <p className="text-sm text-violet-300">
                                    <strong>O que acontece:</strong> Todas as regras continuam sendo avaliadas,
                                    mas as ações são apenas simuladas. Você vê exatamente o que teria acontecido,
                                    sem nenhum efeito real.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        Motivo (obrigatório)
                                    </label>
                                    <Input
                                        value={activateForm.reason}
                                        onChange={(e) => setActivateForm({ ...activateForm, reason: e.target.value })}
                                        placeholder="Ex: Testando nova regra de alerta"
                                        className="mt-2 h-11 bg-white/[0.02] border-white/10 rounded-xl text-white"
                                    />
                                </div>
                                
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        Duração
                                    </label>
                                    <select
                                        value={activateForm.duration}
                                        onChange={(e) => setActivateForm({ ...activateForm, duration: e.target.value })}
                                        className="mt-2 w-full h-11 px-3 rounded-xl bg-white/[0.02] border border-white/10 text-white"
                                    >
                                        <option value="15m">15 minutos</option>
                                        <option value="30m">30 minutos</option>
                                        <option value="1h">1 hora</option>
                                        <option value="2h">2 horas</option>
                                        <option value="6h">6 horas</option>
                                        <option value="24h">24 horas</option>
                                    </select>
                                </div>
                                
                                {activeApp && (
                                    <label className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:border-white/10">
                                        <input
                                            type="checkbox"
                                            checked={activateForm.filterByApp}
                                            onChange={(e) => setActivateForm({ ...activateForm, filterByApp: e.target.checked })}
                                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-violet-500"
                                        />
                                        <div>
                                            <p className="text-white font-medium">Apenas para {activeApp.name}</p>
                                            <p className="text-xs text-slate-500">Outros apps continuam executando normalmente</p>
                                        </div>
                                    </label>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowActivateModal(false)}
                                    className="flex-1 h-12 rounded-xl"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={activateShadowMode}
                                    disabled={!activateForm.reason || activating}
                                    className="flex-1 h-12 rounded-xl bg-violet-600 hover:bg-violet-500"
                                >
                                    {activating ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Eye className="w-4 h-4 mr-2" />
                                            Ativar Shadow
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
