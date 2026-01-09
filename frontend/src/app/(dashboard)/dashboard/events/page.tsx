"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, Terminal, PlayCircle, PauseCircle, Loader2, Activity, Database, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

interface Event {
    id: string;
    type: string;
    timestamp: number;
    payload: any;
    source?: string;
}

export default function EventsPage() {
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLive, setIsLive] = useState(true);

    const fetchEvents = async () => {
        if (!user?.id) return;
        try {
            const res = await api.get(`/events/${user.id}?limit=50`);
            setEvents(res.data || []);
        } catch (error) {
            console.error("Failed to fetch events", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        let interval: any;
        if (isLive) {
            interval = setInterval(fetchEvents, 5000);
        }
        return () => clearInterval(interval);
    }, [user, isLive]);

    const formatTimestamp = (ts: number) => {
        return new Date(ts).toLocaleString();
    };

    return (
        <div className="space-y-8 h-[calc(100vh-8rem)] flex flex-col pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                        TELEMETRIA DO <span className="text-indigo-500">KERNEL</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Fluxo em tempo real do Ledger imutável e auditoria.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        className={cn(
                            "h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all",
                            isLive ? "bg-indigo-600 text-white hover:bg-indigo-500" : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                        )}
                        onClick={() => setIsLive(!isLive)}
                        disabled={loading}
                    >
                        {isLive ? <PauseCircle className="w-4 h-4 mr-2" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                        {isLive ? "Pausar Fluxo" : "Resumir Fluxo"}
                    </Button>
                    <Button variant="outline" className="h-12 px-6 rounded-xl border-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/5">
                        <Download className="w-4 h-4 mr-2" /> Exportar Ledger
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-2 rounded-2xl shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <Input
                        placeholder="Filtrar por ID do evento, tipo ou origem no cluster..."
                        className="pl-10 bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-slate-700 font-medium"
                    />
                </div>
                <div className="h-8 w-px bg-white/5" />
                <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-white font-black uppercase tracking-widest text-[10px]">
                    <Activity className="w-4 h-4 text-indigo-500" /> Filtros Ativos
                </Button>
            </div>

            {/* Console Viewer */}
            <div className="flex-1 bg-[#020617]/80 rounded-[32px] border border-white/5 overflow-hidden font-mono flex flex-col shadow-2xl relative">
                <div className="absolute inset-0 bg-grid-white/[0.01] pointer-events-none" />

                <div className="flex items-center justify-between px-8 py-4 bg-white/[0.02] border-b border-white/5 relative z-10">
                    <div className="flex items-center gap-3 text-slate-500">
                        <Terminal className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Kernel Console v1.0.4</span>
                        {isLive && (
                            <div className="flex items-center gap-2 ml-4">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live Stream</span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6 space-y-2 relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {loading && events.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500/30" />
                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Sintonizando com o cluster...</p>
                        </div>
                    ) : (
                        events.map((evt) => (
                            <div key={evt.id} className="flex gap-6 hover:bg-white/[0.02] px-4 py-2 rounded-xl cursor-pointer group transition-all border border-transparent hover:border-white/5">
                                <span className="text-slate-600 whitespace-nowrap w-[160px] text-[10px] font-medium">{formatTimestamp(evt.timestamp)}</span>
                                <span className={cn(
                                    "w-[120px] font-black uppercase tracking-widest text-[10px]",
                                    evt.type.includes('created') ? 'text-indigo-400' :
                                        evt.type.includes('paid') ? 'text-emerald-400' :
                                            evt.type.includes('api') ? 'text-purple-400' : 'text-slate-400'
                                )}>
                                    [{evt.type}]
                                </span>
                                <span className="text-slate-400 truncate flex-1 opacity-70 group-hover:opacity-100 transition-opacity text-[11px]">
                                    {JSON.stringify(evt.payload)}
                                </span>
                                <span className="text-slate-700 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                    ID:{evt.id.substring(0, 8)}
                                </span>
                            </div>
                        ))
                    )}
                    {isLive && (
                        <div className="flex items-center gap-3 px-4 py-2 opacity-50">
                            <span className="text-indigo-500 font-black animate-pulse">_</span>
                            <span className="text-[10px] text-slate-700 font-black uppercase tracking-widest">Aguardando novo payload...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
