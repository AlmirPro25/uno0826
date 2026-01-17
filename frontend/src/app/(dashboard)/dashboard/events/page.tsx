"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search, Download, Terminal, PlayCircle, PauseCircle,
    Loader2, Activity, RefreshCw, ChevronDown, Box,
    CheckCircle2, AlertCircle, Clock, X, Info, FileJson, Hash
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "@/components/ui/tooltip"; // Added Premium Tooltip

interface Event {
    id: string;
    type: string;
    created_at: string;
    payload: string; // JSON string
    source?: string;
    app_id?: string;
    user_id?: string;
}

interface App {
    id: string;
    name: string;
    slug: string;
}

export default function EventsPage() {
    const { user } = useAuth();
    const { activeApp, hasApp } = useApp();
    const [events, setEvents] = useState<Event[]>([]);
    const [apps, setApps] = useState<App[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLive, setIsLive] = useState(false);
    const [selectedApp, setSelectedApp] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showAppDropdown, setShowAppDropdown] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    // Sincronizar com app ativo do contexto
    useEffect(() => {
        if (activeApp && selectedApp === "all") {
            setSelectedApp(activeApp.id);
        }
    }, [activeApp, selectedApp]);

    const fetchApps = async () => {
        try {
            const res = await api.get("/apps/mine");
            setApps(res.data.apps || []);
        } catch (error) {
            console.error("Failed to fetch apps", error);
        }
    };

    const fetchEvents = async () => {
        if (!user?.id) return;
        try {
            // Usar novo endpoint do Event System
            const endpoint = selectedApp === "all"
                ? `/events/user/${user.id}?limit=100`
                : `/events/app/${selectedApp}?limit=100`;
            const res = await api.get(endpoint);
            const data = res.data?.events || res.data || [];
            setEvents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch events", error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApps();
    }, []);

    useEffect(() => {
        fetchEvents();
        let interval: NodeJS.Timeout | undefined;
        if (isLive) {
            interval = setInterval(fetchEvents, 5000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isLive, selectedApp]);

    const formatTimestamp = (ts: string) => {
        const date = new Date(ts);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) return "agora";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m atrás`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const parsePayload = (payload: string): Record<string, unknown> => {
        try {
            return JSON.parse(payload);
        } catch {
            return {};
        }
    };

    const getEventIcon = (type: string) => {
        if (type.includes("mfa") || type.includes("session")) return <AlertCircle className="w-4 h-4 text-amber-500" />;
        if (type.includes("failed") || type.includes("error")) return <AlertCircle className="w-4 h-4 text-rose-500" />;
        if (type.includes("user") || type.includes("login") || type.includes("logout")) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
        if (type.includes("payment") || type.includes("subscription") || type.includes("billing")) return <CheckCircle2 className="w-4 h-4 text-indigo-500" />;
        if (type.includes("app") || type.includes("membership")) return <Box className="w-4 h-4 text-blue-500" />;
        if (type.includes("alert") || type.includes("incident")) return <AlertCircle className="w-4 h-4 text-rose-500" />;
        return <Activity className="w-4 h-4 text-slate-500" />;
    };

    const getEventColor = (type: string) => {
        if (type.includes("user") || type.includes("login") || type.includes("logout")) return "text-emerald-400";
        if (type.includes("payment") || type.includes("subscription") || type.includes("billing")) return "text-indigo-400";
        if (type.includes("app") || type.includes("membership")) return "text-blue-400";
        if (type.includes("mfa") || type.includes("session")) return "text-amber-400";
        if (type.includes("alert") || type.includes("incident")) return "text-rose-400";
        return "text-slate-400";
    };

    const filteredEvents = events.filter(evt => {
        if (!searchQuery) return true;
        const payloadStr = typeof evt.payload === 'string' ? evt.payload : JSON.stringify(evt.payload);
        return evt.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            evt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payloadStr.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const selectedAppName = selectedApp === "all"
        ? "Todos os Apps"
        : apps.find(a => a.id === selectedApp)?.name || "App";

    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col pb-6">
            {/* App Context Header */}
            <AppHeader />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
                        <Activity className="w-8 h-8 text-indigo-500" />
                        Live Events
                        <Tooltip content="Fluxo de dados em tempo real do sistema" side="right">
                            <Info className="w-4 h-4 text-slate-600 cursor-help" />
                        </Tooltip>
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium flex items-center gap-2">
                        Telemetria e Audit Log
                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                        <span className="text-white font-bold">{filteredEvents.length}</span> registros
                    </p>
                </div>
                <div className="flex gap-3">
                    <Tooltip content="Recarregar lista de eventos manualmente" side="bottom">
                        <Button
                            variant="outline"
                            onClick={() => fetchEvents()}
                            disabled={loading}
                            className="h-11 px-4 rounded-xl border-white/10 text-white hover:bg-white/5"
                        >
                            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                        </Button>
                    </Tooltip>

                    <Tooltip content={isLive ? "Pausar atualização automática (economiza dados)" : "Ativar modo Live (auto-refresh 5s)"} side="bottom">
                        <Button
                            className={cn(
                                "h-11 px-5 rounded-xl font-bold text-xs transition-all",
                                isLive
                                    ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
                                    : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                            )}
                            onClick={() => setIsLive(!isLive)}
                        >
                            {isLive ? <PauseCircle className="w-4 h-4 mr-2" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                            {isLive ? "LIVE ABERTA" : "PAUSADO"}
                        </Button>
                    </Tooltip>

                    <Tooltip content="Baixar relatório em formato CSV/JSON" side="bottom">
                        <Button
                            variant="outline"
                            className="h-11 px-5 rounded-xl border-white/10 text-white hover:bg-white/5 font-bold text-xs"
                        >
                            <Download className="w-4 h-4 mr-2" /> EXPORTAR
                        </Button>
                    </Tooltip>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 shrink-0">
                {/* App Selector */}
                <div className="relative">
                    <Tooltip content="Filtrar eventos por Aplicação de origem" side="top">
                        <Button
                            variant="outline"
                            onClick={() => setShowAppDropdown(!showAppDropdown)}
                            className="h-11 px-4 rounded-xl border-white/10 text-white hover:bg-white/5 min-w-[180px] justify-between"
                        >
                            <span className="flex items-center gap-2">
                                <Box className="w-4 h-4 text-indigo-400" />
                                {selectedAppName}
                            </span>
                            <ChevronDown className={cn("w-4 h-4 transition-transform", showAppDropdown && "rotate-180")} />
                        </Button>
                    </Tooltip>

                    <AnimatePresence>
                        {showAppDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 mt-2 w-full bg-[#0a0a0f] border border-white/10 rounded-xl overflow-hidden z-50 shadow-xl"
                            >
                                <button
                                    onClick={() => { setSelectedApp("all"); setShowAppDropdown(false); }}
                                    className={cn(
                                        "w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors",
                                        selectedApp === "all" ? "text-indigo-400 bg-indigo-500/10" : "text-slate-300"
                                    )}
                                >
                                    Todos os Apps
                                </button>
                                {apps.map(app => (
                                    <button
                                        key={app.id}
                                        onClick={() => { setSelectedApp(app.id); setShowAppDropdown(false); }}
                                        className={cn(
                                            "w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors",
                                            selectedApp === app.id ? "text-indigo-400 bg-indigo-500/10" : "text-slate-300"
                                        )}
                                    >
                                        {app.name}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <Tooltip content="Busca profunda em Tipo, ID e Conteúdo JSON" side="top">
                        <Input
                            placeholder="Buscar no log de eventos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 pl-11 bg-white/[0.02] border-white/10 focus:border-indigo-500/50 rounded-xl text-white placeholder:text-slate-600 text-sm font-medium"
                        />
                    </Tooltip>
                </div>
            </div>

            {/* Events List */}
            <div className="flex-1 flex gap-6 min-h-0">
                {/* Main List */}
                <div className="flex-1 bg-[#020617]/80 rounded-2xl border border-white/5 overflow-hidden flex flex-col relative group">
                    {/* Console Header */}
                    <div className="flex items-center justify-between px-6 py-3 bg-white/[0.02] border-b border-white/5">
                        <div className="flex items-center gap-3 text-slate-500">
                            <Terminal className="w-4 h-4 text-indigo-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Console Output</span>
                            {isLive && (
                                <div className="flex items-center gap-2 ml-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase">Recebendo Dados</span>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-1.5 opacity-50">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/30" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30" />
                        </div>
                    </div>

                    {/* Events */}
                    <div className="flex-1 overflow-auto p-2 space-y-1 custom-scrollbar">
                        {loading && events.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500/30" />
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest animate-pulse">Sincronizando Feed...</p>
                            </div>
                        ) : filteredEvents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
                                <Activity className="w-12 h-12 text-slate-700" />
                                <p className="text-sm font-bold text-slate-600">
                                    {hasApp && activeApp
                                        ? `${activeApp.name} silencioso...`
                                        : "Nenhum sinal detectado"}
                                </p>
                            </div>
                        ) : (
                            filteredEvents.map((evt, i) => (
                                <motion.div
                                    key={evt.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    onClick={() => setSelectedEvent(evt)}
                                    className={cn(
                                        "flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-all border",
                                        selectedEvent?.id === evt.id
                                            ? "bg-indigo-500/10 border-indigo-500/30"
                                            : "hover:bg-white/[0.04] border-transparent hover:border-white/5 bg-transparent"
                                    )}
                                >
                                    <Tooltip content="Tipo do Evento" side="left">
                                        <div className="flex-shrink-0">
                                            {getEventIcon(evt.type)}
                                        </div>
                                    </Tooltip>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={cn("font-bold text-xs font-mono", getEventColor(evt.type))}>
                                                {evt.type}
                                            </span>
                                            {evt.source && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-500 uppercase">
                                                    {evt.source}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                            {evt.payload.substring(0, 80)}...
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 text-slate-600 flex-shrink-0">
                                        <Clock className="w-3 h-3" />
                                        <span className="text-[10px] font-mono font-medium">{formatTimestamp(evt.created_at)}</span>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Event Detail Panel */}
                <AnimatePresence>
                    {selectedEvent && (
                        <motion.div
                            initial={{ opacity: 0, x: 20, width: 0 }}
                            animate={{ opacity: 1, x: 0, width: 400 }}
                            exit={{ opacity: 0, x: 20, width: 0 }}
                            className="bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden flex flex-col shrink-0 shadow-2xl h-full shadow-black/50"
                        >
                            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div>
                                    <h3 className="font-bold text-white text-sm uppercase tracking-wide">Inspector</h3>
                                    <p className="text-[10px] text-slate-500 font-mono">{selectedEvent.id}</p>
                                </div>
                                <Tooltip content="Fechar painel" side="left">
                                    <button
                                        onClick={() => setSelectedEvent(null)}
                                        className="text-slate-500 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </Tooltip>
                            </div>

                            <div className="flex-1 overflow-auto p-5 space-y-6 custom-scrollbar">
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Hash className="w-3 h-3 text-indigo-500" />
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Metadados</label>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Tipo:</span>
                                                <span className={cn("font-bold font-mono", getEventColor(selectedEvent.type))}>{selectedEvent.type}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Ocorrido:</span>
                                                <span className="text-white font-medium">{new Date(selectedEvent.created_at).toLocaleString('pt-BR')}</span>
                                            </div>
                                            {selectedEvent.source && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-500">Fonte:</span>
                                                    <span className="text-white bg-white/10 px-1.5 rounded">{selectedEvent.source}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-2 px-1">
                                            <FileJson className="w-3 h-3 text-emerald-500" />
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Payload Bruto</label>
                                        </div>
                                        <div className="relative group">
                                            <pre className="p-4 bg-black/50 border border-white/10 rounded-xl text-[10px] font-mono text-emerald-300/90 overflow-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                                                {JSON.stringify(parsePayload(selectedEvent.payload), null, 2)}
                                            </pre>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Tooltip content="Formato JSON validado" side="left">
                                                    <div className="px-2 py-1 bg-emerald-500/20 rounded text-[9px] text-emerald-500 border border-emerald-500/20 font-bold uppercase">
                                                        JSON
                                                    </div>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
