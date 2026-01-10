"use client";

import { useState, useEffect } from "react";
import { Webhook, Search, CheckCircle, XCircle, Clock, RefreshCw, Eye } from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";

interface WebhookLog {
    id: string;
    app_id: string;
    app_name: string;
    event_type: string;
    source: string;
    status: "success" | "failed" | "pending" | "retrying";
    status_code: number | null;
    attempts: number;
    payload_preview: string;
    created_at: string;
    processed_at: string | null;
}

const mockWebhooks: WebhookLog[] = [
    {
        id: "1",
        app_id: "app-1",
        app_name: "VOX-BRIDGE",
        event_type: "payment_intent.succeeded",
        source: "stripe",
        status: "success",
        status_code: 200,
        attempts: 1,
        payload_preview: '{"id": "pi_xxx", "amount": 9900}',
        created_at: "2026-01-10T09:45:00Z",
        processed_at: "2026-01-10T09:45:01Z"
    },
    {
        id: "2",
        app_id: "app-1",
        app_name: "VOX-BRIDGE",
        event_type: "customer.subscription.created",
        source: "stripe",
        status: "success",
        status_code: 200,
        attempts: 1,
        payload_preview: '{"id": "sub_xxx", "plan": "pro"}',
        created_at: "2026-01-10T09:30:00Z",
        processed_at: "2026-01-10T09:30:02Z"
    },
    {
        id: "3",
        app_id: "app-2",
        app_name: "SCE",
        event_type: "charge.failed",
        source: "stripe",
        status: "failed",
        status_code: 500,
        attempts: 3,
        payload_preview: '{"id": "ch_xxx", "failure_code": "card_declined"}',
        created_at: "2026-01-10T08:15:00Z",
        processed_at: "2026-01-10T08:15:45Z"
    }
];

export default function WebhooksPage() {
    const { activeApp, hasApp } = useApp();
    const [webhooks, setWebhooks] = useState<WebhookLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selected, setSelected] = useState<WebhookLog | null>(null);

    useEffect(() => {
        setTimeout(() => {
            setWebhooks(mockWebhooks);
            setLoading(false);
        }, 500);
    }, []);

    const filteredWebhooks = webhooks.filter(w => {
        const matchesSearch = w.event_type.toLowerCase().includes(search.toLowerCase()) ||
            w.app_name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || w.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: WebhookLog["status"]) => {
        switch (status) {
            case "success":
                return <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><CheckCircle className="w-3 h-3" /> SUCCESS</span>;
            case "failed":
                return <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30"><XCircle className="w-3 h-3" /> FAILED</span>;
            case "pending":
                return <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30"><Clock className="w-3 h-3" /> PENDING</span>;
            case "retrying":
                return <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30"><RefreshCw className="w-3 h-3" /> RETRYING</span>;
        }
    };

    const formatTime = (date: string) => {
        return new Date(date).toLocaleString("pt-BR", {
            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit"
        });
    };

    return (
        <div className="space-y-6">
            {/* App Context Header */}
            <AppHeader />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">
                        Webhooks {activeApp ? `de ${activeApp.name}` : ""}
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Histórico de webhooks recebidos pelo kernel</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por evento ou app..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
                    />
                </div>
                <div className="flex gap-2">
                    {["all", "success", "failed", "pending"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
                                statusFilter === status
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white/5 text-slate-400 hover:text-white"
                            }`}
                        >
                            {status === "all" ? "Todos" : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Webhooks List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredWebhooks.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <Webhook className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">
                        {hasApp && activeApp 
                            ? `${activeApp.name} ainda não recebeu webhooks` 
                            : "Nenhum webhook encontrado"}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredWebhooks.map((webhook) => (
                        <div
                            key={webhook.id}
                            className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl hover:border-indigo-500/30 transition-all cursor-pointer"
                            onClick={() => setSelected(webhook)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                        <Webhook className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <code className="text-sm font-bold text-white">{webhook.event_type}</code>
                                            {getStatusBadge(webhook.status)}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span>{webhook.app_name}</span>
                                            <span>Source: {webhook.source}</span>
                                            <span>{formatTime(webhook.created_at)}</span>
                                            {webhook.attempts > 1 && <span className="text-amber-400">{webhook.attempts} tentativas</span>}
                                        </div>
                                    </div>
                                </div>
                                <button className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                    <Eye className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selected && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
                    <div className="bg-[#0a0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white">{selected.event_type}</h2>
                                <p className="text-sm text-slate-500">{selected.app_name} • {selected.source}</p>
                            </div>
                            {getStatusBadge(selected.status)}
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-500">Status Code</span>
                                    <p className="text-white font-mono">{selected.status_code || "N/A"}</p>
                                </div>
                                <div>
                                    <span className="text-slate-500">Tentativas</span>
                                    <p className="text-white">{selected.attempts}</p>
                                </div>
                                <div>
                                    <span className="text-slate-500">Recebido</span>
                                    <p className="text-white">{formatTime(selected.created_at)}</p>
                                </div>
                                <div>
                                    <span className="text-slate-500">Processado</span>
                                    <p className="text-white">{selected.processed_at ? formatTime(selected.processed_at) : "Pendente"}</p>
                                </div>
                            </div>
                            <div>
                                <span className="text-slate-500 text-sm">Payload Preview</span>
                                <pre className="mt-2 p-4 bg-black/30 border border-white/5 rounded-xl text-xs font-mono text-slate-300 overflow-auto">
                                    {JSON.stringify(JSON.parse(selected.payload_preview), null, 2)}
                                </pre>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelected(null)}
                            className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
