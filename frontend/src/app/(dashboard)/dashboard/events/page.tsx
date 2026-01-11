"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Search, Download, Terminal, PlayCircle, PauseCircle, 
    Loader2, Activity, RefreshCw, ChevronDown, Box,
    CheckCircle2, AlertCircle, Clock
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Event {
    id: string;
    type: string;
    timestamp: number;
    payload: Record<string, unknown>;
    source?: string;
    app_id?: string;
    status?: string;
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
            // API: GET /api/v1/events/:user_id
            const endpoint = selectedApp === "all" 
                ? `/events/${user.id}?limit=100`
                : `/events/${user.id}?app_id=${selectedApp}&limit=100`;
            const res = await api.get(endpoint);
            const data = res.data || [];
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

    const formatTimestamp = (ts: number) => {
        const date = new Date(ts);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        
        if (diff < 60000) return "agora";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m atrás`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    const getEventIcon = (type: string, status?: string) => {
        if (status === "warning") return <AlertCircle className="w-4 h-4 text-amber-500" />;
        if (status === "error") return <AlertCircle className="w-4 h-4 text-rose-500" />;
        if (type.includes("auth") || type.includes("identity")) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
        if (type.includes("billing")) return <CheckCircle2 className="w-4 h-4 text-indigo-500" />;
        if (type.includes("app")) return <Box className="w-4 h-4 text-blue-500" />;
        return <Activity className="w-4 h-4 text-slate-500" />;
    };

    const getEventColor = (type: string) => {
        if (type.includes("auth") || type.includes("identity")) return "text-emerald-400";
        if (type.includes("billing")) return "text-indigo-400";
        if (type.includes("app")) return "text-blue-400";
        if (type.includes("governance")) return "text-amber-400";
        if (type.includes("api")) return "text-purple-400";
        return "text-slate-400";
    };

    const filteredEvents = events.filter(evt => {
        if (!searchQuery) return true;
        return evt.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
               evt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
               JSON.stringify(evt.payload).toLowerCase().includes(searchQuery.toLowerCase());
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
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                        Eventos {activeApp ? `de ${activeApp.name}` : "do Kernel"}
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Telemetria em tempo real • {filteredEvents.length} eventos
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => fetchEvents()}
                        disabled={loading}
                        className="h-11 px-4 rounded-xl border-white/10 text-white hover:bg-white/5"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
                    <Button
                        className={cn(
                            "h-11 px-5 rounded-xl font-bold text-xs transition-all",
                            isLive 
                                ? "bg-emerald-600 text-white hover:bg-emerald-500" 
                                : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                        )}
                        onClick={() => setIsLive(!isLive)}
                    >
                        {isLive ? <PauseCircle className="w-4 h-4 mr-2" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                        {isLive ? "Live" : "Pausado"}
                    </Button>
                    <Button 
                        variant="outline" 
                        className="h-11 px-5 rounded-xl border-white/10 text-white hover:bg-white/5"
                    >
                        <Download className="w-4 h-4 mr-2" /> Exportar
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 shrink-0">
                {/* App Selector */}
                <div className="relative">
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
                    <Input
                        placeholder="Buscar por tipo, ID ou payload..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11 pl-11 bg-white/[0.02] border-white/10 focus:border-indigo-500/50 rounded-xl text-white placeholder:text-slate-600"
                    />
                </div>
            </div>

            {/* Events List */}
            <div className="flex-1 flex gap-6 min-h-0">
                {/* Main List */}
                <div className="flex-1 bg-[#020617]/80 rounded-2xl border border-white/5 overflow-hidden flex flex-col">
                    {/* Console Header */}
                    <div className="flex items-center justify-between px-6 py-3 bg-white/[0.02] border-b border-white/5">
                        <div className="flex items-center gap-3 text-slate-500">
                            <Terminal className="w-4 h-4 text-indigo-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Event Stream</span>
                            {isLive && (
                                <div className="flex items-center gap-2 ml-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase">Live</span>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/30" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30" />
                        </div>
                    </div>

                    {/* Events */}
                    <div className="flex-1 overflow-auto p-4 space-y-1">
                        {loading && events.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500/30" />
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Carregando eventos...</p>
                            </div>
                        ) : filteredEvents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                <Activity className="w-12 h-12 text-slate-700" />
                                <p className="text-sm font-bold text-slate-600">
                                    {hasApp && activeApp 
                                        ? `${activeApp.name} ainda não tem eventos` 
                                        : "Nenhum evento encontrado"}
                                </p>
                                <p className="text-xs text-slate-700">
                                    Eventos aparecerão aqui quando seu app começar a enviar dados
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
                                        "flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all border",
                                        selectedEvent?.id === evt.id 
                                            ? "bg-indigo-500/10 border-indigo-500/30" 
                                            : "hover:bg-white/[0.02] border-transparent hover:border-white/5"
                                    )}
                                >
                                    {getEventIcon(evt.type, evt.status)}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={cn("font-bold text-sm", getEventColor(evt.type))}>
                                                {evt.type}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 truncate font-mono">
                                            {JSON.stringify(evt.payload).substring(0, 60)}...
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Clock className="w-3 h-3" />
                                        <span className="text-xs">{formatTimestamp(evt.timestamp)}</span>
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
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="w-[400px] bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden flex flex-col shrink-0"
                        >
                            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                                <h3 className="font-bold text-white">Detalhes do Evento</h3>
                                <button 
                                    onClick={() => setSelectedEvent(null)}
                                    className="text-slate-500 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto p-6 space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo</label>
                                    <p className={cn("font-bold mt-1", getEventColor(selectedEvent.type))}>
                                        {selectedEvent.type}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID</label>
                                    <p className="text-slate-300 font-mono text-sm mt-1">{selectedEvent.id}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timestamp</label>
                                    <p className="text-slate-300 text-sm mt-1">
                                        {new Date(selectedEvent.timestamp).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payload</label>
                                    <pre className="mt-2 p-4 bg-black/30 rounded-xl text-xs font-mono text-slate-300 overflow-auto">
                                        {JSON.stringify(selectedEvent.payload, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
