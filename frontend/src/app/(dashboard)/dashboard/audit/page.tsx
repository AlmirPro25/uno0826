"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Search, Download, Loader2, Shield, Clock, User,
    AlertTriangle, CheckCircle2, Info, X, Brain,
    RefreshCw
} from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface AuditLog {
    id: string;
    action: string;
    action_type?: string;
    actor_id: string;
    actor_type: string;
    actor_name?: string;
    resource_type: string;
    resource_id: string;
    details: Record<string, unknown>;
    ip_address?: string;
    user_agent?: string;
    status: "success" | "failure" | "warning";
    was_allowed?: boolean;
    block_reason?: string;
    created_at: string;
    executed_at?: string;
    duration_ms?: number;
}

export default function AuditPage() {
    const { activeApp, hasApp } = useApp();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [source, setSource] = useState<"audit" | "rules">("rules");

    const fetchLogs = async () => {
        setLoading(true);
        try {
            if (source === "rules") {
                // Buscar logs de auditoria do rules engine
                const params = activeApp?.id ? `?app_id=${activeApp.id}&limit=100` : "?limit=100";
                const res = await api.get(`/admin/rules/audit${params}`);
                const data = res.data.logs || [];
                setLogs(data.map((log: Record<string, unknown>) => ({
                    id: log.id,
                    action: log.action_type || "rule_execution",
                    action_type: log.action_type,
                    actor_id: log.rule_id || log.actor_id,
                    actor_type: "rule",
                    actor_name: log.rule_name,
                    resource_type: log.action_domain || "action",
                    resource_id: log.app_id || "",
                    details: {
                        trigger_data: log.trigger_data,
                        action_config: log.action_config,
                        result: log.result
                    },
                    status: log.was_allowed ? "success" : "failure",
                    was_allowed: log.was_allowed,
                    block_reason: log.block_reason,
                    created_at: log.executed_at || log.created_at,
                    executed_at: log.executed_at,
                    duration_ms: log.duration_ms
                })));
            } else {
                // Buscar logs de auditoria gerais
                const res = await api.get("/audit/events?limit=100");
                const data = res.data.data || res.data || [];
                setLogs(data.map((log: Record<string, unknown>) => ({
                    id: log.id,
                    action: log.action,
                    actor_id: log.actor_id,
                    actor_type: log.actor_type,
                    actor_name: log.actor_name,
                    resource_type: log.target_type || log.resource_type,
                    resource_id: log.target_id || log.resource_id,
                    details: log.metadata || log.details || {},
                    ip_address: log.ip_address,
                    user_agent: log.user_agent,
                    status: log.status || "success",
                    created_at: log.created_at || log.timestamp
                })));
            }
        } catch (error) {
            console.error("Failed to fetch audit logs", error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source, activeApp?.id]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "success": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case "failure": return <AlertTriangle className="w-4 h-4 text-rose-500" />;
            case "warning": return <Info className="w-4 h-4 text-amber-500" />;
            default: return <Info className="w-4 h-4 text-slate-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "success": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "failure": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
            case "warning": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('pt-BR');
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = !searchQuery || 
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.actor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.resource_type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "all" || log.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 pb-12">
            {/* App Context Header */}
            <AppHeader />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                        Audit Log {activeApp ? `de ${activeApp.name}` : ""}
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Registro imutável de todas as ações • {filteredLogs.length} registros
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline"
                        onClick={fetchLogs}
                        disabled={loading}
                        className="h-11 px-4 rounded-xl border-white/10 text-white hover:bg-white/5"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
                    <Button 
                        variant="outline" 
                        className="h-11 px-5 rounded-xl border-white/10 text-white hover:bg-white/5"
                    >
                        <Download className="w-4 h-4 mr-2" /> Exportar
                    </Button>
                </div>
            </div>

            {/* Source Toggle */}
            <div className="flex items-center gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-xl w-fit">
                <button
                    onClick={() => setSource("rules")}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                        source === "rules" 
                            ? "bg-indigo-600 text-white" 
                            : "text-slate-400 hover:text-white"
                    )}
                >
                    <Brain className="w-4 h-4" />
                    Ações de Regras
                </button>
                <button
                    onClick={() => setSource("audit")}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                        source === "audit" 
                            ? "bg-indigo-600 text-white" 
                            : "text-slate-400 hover:text-white"
                    )}
                >
                    <Shield className="w-4 h-4" />
                    Eventos Gerais
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <Input
                        placeholder="Buscar por ação, ator ou recurso..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11 pl-11 bg-white/[0.02] border-white/10 focus:border-indigo-500/50 rounded-xl text-white"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="h-11 px-4 rounded-xl bg-white/[0.02] border border-white/10 text-white focus:border-indigo-500/50 outline-none"
                >
                    <option value="all">Todos os Status</option>
                    <option value="success">Sucesso</option>
                    <option value="failure">Falha</option>
                    <option value="warning">Aviso</option>
                </select>
            </div>

            {/* Logs List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <Shield className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                        {hasApp && activeApp 
                            ? `${activeApp.name} ainda não tem registros de auditoria` 
                            : "Nenhum registro encontrado"}
                    </h3>
                    <p className="text-slate-500">Os logs de auditoria aparecerão aqui</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredLogs.map((log, i) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                            onClick={() => setSelectedLog(log)}
                            className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 cursor-pointer transition-all"
                        >
                            <div className="flex items-center gap-4">
                                {getStatusIcon(log.status)}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-white">{log.action}</span>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                                            getStatusColor(log.status)
                                        )}>
                                            {log.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {log.actor_name || log.actor_id}
                                        </span>
                                        <span>{log.resource_type}/{log.resource_id.substring(0, 8)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(log.created_at)}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedLog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setSelectedLog(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-2xl bg-[#0a0a0f] border border-white/10 rounded-3xl p-8 space-y-6 max-h-[80vh] overflow-auto"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(selectedLog.status)}
                                    <h2 className="text-2xl font-black text-white">{selectedLog.action}</h2>
                                </div>
                                <button onClick={() => setSelectedLog(null)} className="text-slate-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Ator</label>
                                    <p className="text-white mt-1">{selectedLog.actor_name || selectedLog.actor_id}</p>
                                    <p className="text-xs text-slate-500">{selectedLog.actor_type}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Recurso</label>
                                    <p className="text-white mt-1">{selectedLog.resource_type}</p>
                                    <p className="text-xs text-slate-500 font-mono">{selectedLog.resource_id}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Data/Hora</label>
                                    <p className="text-white mt-1">{formatDate(selectedLog.created_at)}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">IP</label>
                                    <p className="text-white mt-1 font-mono">{selectedLog.ip_address || "N/A"}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Detalhes</label>
                                <pre className="mt-2 p-4 rounded-xl bg-black/30 text-sm font-mono text-slate-300 overflow-auto">
                                    {JSON.stringify(selectedLog.details, null, 2)}
                                </pre>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
