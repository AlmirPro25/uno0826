"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";

interface Approval {
    id: string;
    action_type: string;
    resource_type: string;
    resource_id: string;
    requester: string;
    status: "pending" | "approved" | "rejected" | "expired";
    risk_score: number;
    created_at: string;
    expires_at: string;
    details: Record<string, unknown>;
}

const mockApprovals: Approval[] = [
    {
        id: "1",
        action_type: "high_value_transaction",
        resource_type: "payment",
        resource_id: "pay_123",
        requester: "billing-agent",
        status: "pending",
        risk_score: 75,
        created_at: "2026-01-10T09:30:00Z",
        expires_at: "2026-01-10T10:30:00Z",
        details: { amount: 15000, currency: "BRL", customer: "user_456" }
    },
    {
        id: "2",
        action_type: "bulk_notification",
        resource_type: "notification",
        resource_id: "notif_789",
        requester: "notification-agent",
        status: "pending",
        risk_score: 45,
        created_at: "2026-01-10T09:00:00Z",
        expires_at: "2026-01-10T11:00:00Z",
        details: { recipients: 5000, template: "promo_jan" }
    }
];

export default function ApprovalsPage() {
    const { activeApp, hasApp } = useApp();
    const [approvals, setApprovals] = useState<Approval[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "pending" | "resolved">("pending");
    const [selected, setSelected] = useState<Approval | null>(null);

    useEffect(() => {
        setTimeout(() => {
            setApprovals(mockApprovals);
            setLoading(false);
        }, 500);
    }, []);

    const filteredApprovals = approvals.filter(a => {
        if (filter === "pending") return a.status === "pending";
        if (filter === "resolved") return a.status !== "pending";
        return true;
    });

    const handleApprove = (id: string) => {
        setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: "approved" as const } : a));
        setSelected(null);
    };

    const handleReject = (id: string) => {
        setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: "rejected" as const } : a));
        setSelected(null);
    };

    const getRiskColor = (score: number) => {
        if (score >= 70) return "text-rose-400 bg-rose-500/20 border-rose-500/30";
        if (score >= 40) return "text-amber-400 bg-amber-500/20 border-amber-500/30";
        return "text-emerald-400 bg-emerald-500/20 border-emerald-500/30";
    };

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    };

    const pendingCount = approvals.filter(a => a.status === "pending").length;

    return (
        <div className="space-y-6">
            <AppHeader />
            
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">
                        Aprovações {activeApp ? `de ${activeApp.name}` : ""}
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Human-in-the-loop: decisões que precisam de você</p>
                </div>
                {pendingCount > 0 && (
                    <div className="px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-xl">
                        <span className="text-sm font-bold text-amber-400">{pendingCount} pendente{pendingCount > 1 ? "s" : ""}</span>
                    </div>
                )}
            </div>

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
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredApprovals.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <p className="text-slate-400">
                        {hasApp && activeApp 
                            ? `${activeApp.name} não tem aprovações pendentes` 
                            : "Nenhuma aprovação pendente"}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredApprovals.map((approval) => (
                        <div
                            key={approval.id}
                            className={`p-5 bg-white/[0.02] border rounded-2xl cursor-pointer transition-all hover:border-indigo-500/30 ${
                                approval.status === "pending" ? "border-amber-500/30" : "border-white/10"
                            }`}
                            onClick={() => setSelected(approval)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                        approval.status === "pending" ? "bg-amber-500/20" : "bg-slate-500/20"
                                    }`}>
                                        {approval.status === "pending" ? (
                                            <Clock className="w-6 h-6 text-amber-400" />
                                        ) : approval.status === "approved" ? (
                                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                                        ) : (
                                            <XCircle className="w-6 h-6 text-rose-400" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-white">{approval.action_type}</h3>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getRiskColor(approval.risk_score)}`}>
                                                Risk: {approval.risk_score}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span>Por: {approval.requester}</span>
                                            <span>Recurso: {approval.resource_type}</span>
                                            <span>Criado: {formatTime(approval.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                                {approval.status === "pending" && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleApprove(approval.id); }}
                                            className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                        >
                                            <ThumbsUp className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleReject(approval.id); }}
                                            className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                        >
                                            <ThumbsDown className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selected && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
                    <div className="bg-[#0a0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-white mb-4">{selected.action_type}</h2>
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Requester</span>
                                <span className="text-white">{selected.requester}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Risk Score</span>
                                <span className={getRiskColor(selected.risk_score).split(" ")[0]}>{selected.risk_score}</span>
                            </div>
                            <div className="text-sm">
                                <span className="text-slate-500 block mb-2">Details</span>
                                <pre className="text-xs bg-black/30 p-3 rounded-lg text-slate-400 overflow-auto">
                                    {JSON.stringify(selected.details, null, 2)}
                                </pre>
                            </div>
                        </div>
                        {selected.status === "pending" ? (
                            <div className="flex gap-3">
                                <button onClick={() => handleReject(selected.id)} className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl">Rejeitar</button>
                                <button onClick={() => handleApprove(selected.id)} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl">Aprovar</button>
                            </div>
                        ) : (
                            <button onClick={() => setSelected(null)} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl">Fechar</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
