"use client";

import { useState, useEffect } from "react";
import { DollarSign, AlertTriangle, TrendingUp, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface FinancialAlert {
    id: string;
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    app_id: string;
    app_name: string;
    amount?: number;
    created_at: string;
    resolved: boolean;
}

interface FinancialStats {
    total_volume_24h: number;
    total_transactions_24h: number;
    failed_webhooks: number;
    duplicate_attempts: number;
    avg_processing_time_ms: number;
}

const mockStats: FinancialStats = {
    total_volume_24h: 45678.90,
    total_transactions_24h: 234,
    failed_webhooks: 2,
    duplicate_attempts: 5,
    avg_processing_time_ms: 145
};

const mockAlerts: FinancialAlert[] = [
    {
        id: "1",
        type: "high_volume",
        severity: "high",
        message: "Volume de transações 150% acima da média",
        app_id: "app-1",
        app_name: "VOX-BRIDGE",
        amount: 15000,
        created_at: "2026-01-10T09:30:00Z",
        resolved: false
    },
    {
        id: "2",
        type: "duplicate_webhook",
        severity: "medium",
        message: "5 webhooks duplicados detectados",
        app_id: "app-1",
        app_name: "VOX-BRIDGE",
        created_at: "2026-01-10T08:15:00Z",
        resolved: true
    },
    {
        id: "3",
        type: "failed_payment",
        severity: "critical",
        message: "Falha em pagamento de alto valor",
        app_id: "app-2",
        app_name: "SCE",
        amount: 5000,
        created_at: "2026-01-10T07:45:00Z",
        resolved: false
    }
];

export default function AdminFinancialPage() {
    const [stats, setStats] = useState<FinancialStats | null>(null);
    const [alerts, setAlerts] = useState<FinancialAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");

    useEffect(() => {
        setTimeout(() => {
            setStats(mockStats);
            setAlerts(mockAlerts);
            setLoading(false);
        }, 500);
    }, []);

    const filteredAlerts = alerts.filter(a => {
        if (filter === "active") return !a.resolved;
        if (filter === "resolved") return a.resolved;
        return true;
    });

    const getSeverityColor = (severity: FinancialAlert["severity"]) => {
        switch (severity) {
            case "low": return "text-slate-400 bg-slate-500/20 border-slate-500/30";
            case "medium": return "text-amber-400 bg-amber-500/20 border-amber-500/30";
            case "high": return "text-orange-400 bg-orange-500/20 border-orange-500/30";
            case "critical": return "text-rose-400 bg-rose-500/20 border-rose-500/30";
        }
    };

    const resolveAlert = (id: string) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Financial Admin</h1>
                    <p className="text-sm text-slate-400 mt-1">Monitoramento financeiro e alertas do sistema</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/20">
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-lg font-black text-white">{formatCurrency(stats?.total_volume_24h || 0)}</p>
                            <p className="text-xs text-slate-500">Volume 24h</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-500/20">
                            <TrendingUp className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-lg font-black text-white">{stats?.total_transactions_24h}</p>
                            <p className="text-xs text-slate-500">Transações 24h</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-rose-500/20">
                            <XCircle className="w-4 h-4 text-rose-400" />
                        </div>
                        <div>
                            <p className="text-lg font-black text-white">{stats?.failed_webhooks}</p>
                            <p className="text-xs text-slate-500">Webhooks Falhos</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/20">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-lg font-black text-white">{stats?.duplicate_attempts}</p>
                            <p className="text-xs text-slate-500">Duplicados</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-cyan-500/20">
                            <Clock className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-lg font-black text-white">{stats?.avg_processing_time_ms}ms</p>
                            <p className="text-xs text-slate-500">Tempo Médio</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts Section */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h2 className="font-bold text-white">Alertas Financeiros</h2>
                    <div className="flex gap-2">
                        {(["all", "active", "resolved"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                                    filter === f
                                        ? "bg-indigo-600 text-white"
                                        : "bg-white/5 text-slate-400 hover:text-white"
                                }`}
                            >
                                {f === "all" ? "Todos" : f === "active" ? "Ativos" : "Resolvidos"}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="divide-y divide-white/5">
                    {filteredAlerts.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                            <p>Nenhum alerta encontrado</p>
                        </div>
                    ) : (
                        filteredAlerts.map((alert) => (
                            <div key={alert.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${getSeverityColor(alert.severity)}`}>
                                        {alert.severity}
                                    </span>
                                    <div>
                                        <p className="text-sm font-medium text-white">{alert.message}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                            <span>{alert.app_name}</span>
                                            {alert.amount && <span>{formatCurrency(alert.amount)}</span>}
                                            <span>{formatDate(alert.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                                {!alert.resolved && (
                                    <button
                                        onClick={() => resolveAlert(alert.id)}
                                        className="px-3 py-1.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors"
                                    >
                                        Resolver
                                    </button>
                                )}
                                {alert.resolved && (
                                    <span className="px-3 py-1.5 text-xs font-bold text-slate-500">Resolvido</span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
