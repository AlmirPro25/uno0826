"use client";

import { useState, useEffect } from "react";
import { 
    Clock, CheckCircle, XCircle, ThumbsUp, ThumbsDown,
    Shield, AlertTriangle, Loader2, RefreshCw, Brain,
    Zap, Info
} from "lucide-react";
import { AppHeader } from "@/components/dashboard/app-header";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Approval {
    id: string;
    action_type: string;
    resource_type: string;
    resource_id: string;
    requester: string;
    requester_type: string;
    status: "pending" | "approved" | "rejected" | "expired";
    risk_score: number;
    required_authority: string;
    created_at: string;
    expires_at: string;
    details: Record<string, unknown>;
    reason: string;
}

export default function ApprovalsPage() {
    const [approvals, setApprovals] = useState<Approval[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "pending" | "resolved">("pending");
    const [selected, setSelected] = useState<Approval | null>(null);

    const fetchApprovals = async () => {
        setLoading(true);
        try {
            // API: GET /api/v1/approval/pending
            const res = await api.get("/approval/pending");
            const data = res.data.pending || res.data || [];
            setApprovals(data.map((a: Record<string, unknown>) => ({
                id: a.id || a.ID,
                action_type: a.action || a.domain || a.action_type,
                resource_type: a.target_type || "resource",
                resource_id: a.target_id || "",
                requester: a.requested_by || a.requester || "sistema",
                requester_type: a.requested_by_type || "rule",
                status: a.status || "pending",
                risk_score: a.impact === "critical" ? 90 : a.impact === "high" ? 70 : a.impact === "medium" ? 50 : 30,
                required_authority: a.required_authority || "manager",
                created_at: a.created_at,
                expires_at: a.expires_at,
                details: a.context || {},
                reason: a.reason || "Ação requer confirmação humana"
            })));
        } catch {
            console.error("Failed to fetch approvals");
            setApprovals([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovals();
    }, []);

    const filteredApprovals = approvals.filter(a => {
        if (filter === "pending") return a.status === "pending";
        if (filter === "resolved") return a.status !== "pending";
        return true;
    });

    const handleApprove = async (id: string) => {
        try {
            // API: POST /api/v1/approval/decide
            await api.post("/approval/decide", {
                request_id: id,
                authority_id: id, // Simplified - in real app would use actual authority
                decision: "approved",
                justification: "Aprovado via dashboard"
            });
            setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: "approved" as const } : a));
            setSelected(null);
            toast.success("Aprovação concedida");
        } catch {
            toast.error("Falha ao aprovar");
        }
    };

    const handleReject = async (id: string) => {
        try {
            // API: POST /api/v1/approval/decide
            await api.post("/approval/decide", {
                request_id: id,
                authority_id: id,
                decision: "rejected",
                justification: "Rejeitado via dashboard"
            });
            setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: "rejected" as const } : a));
            setSelected(null);
            toast.success("Aprovação rejeitada");
        } catch {
            toast.error("Falha ao rejeitar");
        }
    };

    const pendingCount = approvals.filter(a => a.status === "pending").length;

    const formatRelativeTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMin / 60);
        
        if (diffMin < 60) return `${diffMin}min atrás`;
        if (diffHour < 24) return `${diffHour}h atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
                        <Shield className="w-8 h-8 text-amber-400" />
                        Aprovações
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Human-in-the-loop • Decisões que precisam de você
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchApprovals}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </button>
                    {pendingCount > 0 && (
                        <div className="px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-xl animate-pulse">
                            <span className="text-sm font-bold text-amber-400">{pendingCount} pendente{pendingCount > 1 ? "s" : ""}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Explicação */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
            >
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-amber-300 font-medium">Por que algumas ações precisam de aprovação?</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Ações de alto impacto ou que afetam recursos críticos requerem confirmação humana.
                            Isso garante que o sistema nunca tome decisões irreversíveis sem supervisão.
                            <Link href="/dashboard/authority" className="text-amber-400 hover:underline ml-1">
                                Ver políticas de autoridade →
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Filter */}
            <div className="flex gap-2">
                {(["pending", "all", "resolved"] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${
                            filter === f ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:text-white"
                        }`}
                    >
                        {f === "pending" ? "Pendentes" : f === "all" ? "Todas" : "Resolvidas"}
                    </button>
                ))}
            </div>

            {/* Approvals List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
            ) : filteredApprovals.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Tudo em dia</h3>
                    <p className="text-slate-500">
                        {filter === "pending" 
                            ? "Nenhuma aprovação pendente" 
                            : "Nenhuma aprovação encontrada"}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredApprovals.map((approval, i) => (
                        <motion.div
                            key={approval.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className={cn(
                                "p-5 rounded-2xl border cursor-pointer transition-all",
                                approval.status === "pending" 
                                    ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40" 
                                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                            )}
                            onClick={() => setSelected(approval)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center",
                                        approval.status === "pending" ? "bg-amber-500/20" : 
                                        approval.status === "approved" ? "bg-emerald-500/20" : "bg-rose-500/20"
                                    )}>
                                        {approval.status === "pending" ? (
                                            <Clock className="w-6 h-6 text-amber-400" />
                                        ) : approval.status === "approved" ? (
                                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                                        ) : (
                                            <XCircle className="w-6 h-6 text-rose-400" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <code className="text-sm font-bold text-white font-mono">{approval.action_type}</code>
                                            <span className={cn(
                                                "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                                                approval.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                                                approval.status === "approved" ? "bg-emerald-500/20 text-emerald-400" :
                                                "bg-rose-500/20 text-rose-400"
                                            )}>
                                                {approval.status === "pending" ? "Pendente" :
                                                 approval.status === "approved" ? "Aprovado" : "Rejeitado"}
                                            </span>
                                            {approval.risk_score >= 70 && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-400 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" /> Alto Risco
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500">{approval.reason}</p>
                                        <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                                            <span className="flex items-center gap-1">
                                                {approval.requester_type === "rule" ? (
                                                    <Brain className="w-3 h-3" />
                                                ) : (
                                                    <Zap className="w-3 h-3" />
                                                )}
                                                {approval.requester}
                                            </span>
                                            <span>{formatRelativeTime(approval.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                                {approval.status === "pending" && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleApprove(approval.id); }}
                                            className="p-3 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors"
                                            title="Aprovar"
                                        >
                                            <ThumbsUp className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleReject(approval.id); }}
                                            className="p-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                                            title="Rejeitar"
                                        >
                                            <ThumbsDown className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selected && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setSelected(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-3xl p-8 space-y-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center",
                                    selected.status === "pending" ? "bg-amber-500/20" :
                                    selected.status === "approved" ? "bg-emerald-500/20" : "bg-rose-500/20"
                                )}>
                                    {selected.status === "pending" ? (
                                        <Clock className="w-6 h-6 text-amber-400" />
                                    ) : selected.status === "approved" ? (
                                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                                    ) : (
                                        <XCircle className="w-6 h-6 text-rose-400" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white">{selected.action_type}</h2>
                                    <p className="text-sm text-slate-500">{selected.reason}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                    <p className="text-xs text-slate-500 uppercase">Solicitante</p>
                                    <p className="text-white font-medium mt-1">{selected.requester}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                    <p className="text-xs text-slate-500 uppercase">Autoridade Requerida</p>
                                    <p className="text-white font-medium mt-1">{selected.required_authority}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                    <p className="text-xs text-slate-500 uppercase">Recurso</p>
                                    <p className="text-white font-medium mt-1">{selected.resource_type}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                    <p className="text-xs text-slate-500 uppercase">Risk Score</p>
                                    <p className={cn(
                                        "font-bold mt-1",
                                        selected.risk_score >= 70 ? "text-rose-400" :
                                        selected.risk_score >= 40 ? "text-amber-400" : "text-emerald-400"
                                    )}>{selected.risk_score}</p>
                                </div>
                            </div>

                            {Object.keys(selected.details).length > 0 && (
                                <div>
                                    <p className="text-xs text-slate-500 uppercase mb-2">Detalhes</p>
                                    <pre className="p-3 rounded-xl bg-black/30 text-xs font-mono text-slate-400 overflow-auto max-h-32">
                                        {JSON.stringify(selected.details, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selected.status === "pending" ? (
                                <div className="flex gap-3 pt-4">
                                    <button 
                                        onClick={() => handleReject(selected.id)} 
                                        className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ThumbsDown className="w-4 h-4" /> Rejeitar
                                    </button>
                                    <button 
                                        onClick={() => handleApprove(selected.id)} 
                                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ThumbsUp className="w-4 h-4" /> Aprovar
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setSelected(null)} 
                                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                                >
                                    Fechar
                                </button>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
