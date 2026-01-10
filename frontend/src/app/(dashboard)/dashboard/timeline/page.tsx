"use client";

import { useState, useEffect } from "react";
import { GitBranch, Search, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";

interface TimelineEvent {
    id: string;
    decision_id: string;
    event_type: string;
    actor: string;
    action: string;
    result: "success" | "failure" | "blocked" | "pending";
    timestamp: string;
    context: Record<string, unknown>;
}

const mockTimeline: TimelineEvent[] = [
    {
        id: "1",
        decision_id: "dec_001",
        event_type: "policy_check",
        actor: "policy-engine",
        action: "evaluate_transaction",
        result: "success",
        timestamp: "2026-01-10T09:45:30Z",
        context: { policy: "high_value_limit", threshold: 10000 }
    },
    {
        id: "2",
        decision_id: "dec_001",
        event_type: "risk_assessment",
        actor: "risk-engine",
        action: "calculate_score",
        result: "success",
        timestamp: "2026-01-10T09:45:31Z",
        context: { score: 45, factors: ["new_customer", "high_amount"] }
    },
    {
        id: "3",
        decision_id: "dec_001",
        event_type: "approval_request",
        actor: "approval-service",
        action: "request_human_approval",
        result: "pending",
        timestamp: "2026-01-10T09:45:32Z",
        context: { approver_role: "admin", expires_in: "1h" }
    }
];

export default function TimelinePage() {
    const { activeApp, hasApp } = useApp();
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        setTimeout(() => {
            setEvents(mockTimeline);
            setLoading(false);
        }, 500);
    }, []);

    const getResultIcon = (result: TimelineEvent["result"]) => {
        switch (result) {
            case "success":
                return <CheckCircle className="w-4 h-4 text-emerald-400" />;
            case "failure":
                return <XCircle className="w-4 h-4 text-rose-400" />;
            case "blocked":
                return <AlertTriangle className="w-4 h-4 text-amber-400" />;
            case "pending":
                return <Clock className="w-4 h-4 text-indigo-400" />;
        }
    };

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    };

    return (
        <div className="space-y-6">
            <AppHeader />
            
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">
                        Decision Timeline {activeApp ? `de ${activeApp.name}` : ""}
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Rastreie cada passo de uma decisão do sistema</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    placeholder="Buscar por decision_id..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
                />
            </div>

            {/* Timeline */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <GitBranch className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">
                        {hasApp && activeApp 
                            ? `${activeApp.name} ainda não tem eventos na timeline` 
                            : "Nenhum evento encontrado"}
                    </p>
                </div>
            ) : (
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10" />
                    
                    <div className="space-y-4">
                        {events.map((event) => (
                            <div key={event.id} className="relative pl-14">
                                {/* Timeline dot */}
                                <div className="absolute left-4 top-4 w-4 h-4 rounded-full bg-[#0a0f1a] border-2 border-indigo-500 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                </div>
                                
                                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            {getResultIcon(event.result)}
                                            <span className="font-bold text-white">{event.event_type}</span>
                                            <code className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">{event.decision_id}</code>
                                        </div>
                                        <span className="text-xs text-slate-500">{formatTime(event.timestamp)}</span>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-2">
                                        <span className="text-indigo-400">{event.actor}</span> → {event.action}
                                    </p>
                                    <div className="text-xs text-slate-500 font-mono bg-black/20 p-2 rounded">
                                        {JSON.stringify(event.context)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
