"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, Terminal, PlayCircle, PauseCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

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
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Events</h1>
                    <p className="text-muted-foreground mt-1">Real-time audit trail and event ingestion log.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setIsLive(!isLive)} disabled={loading}>
                        {isLive ? <PauseCircle className="w-4 h-4 mr-2" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                        {isLive ? "Pause Stream" : "Resume Stream"}
                    </Button>
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" /> Export
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-4 bg-card p-2 rounded-lg border border-border shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by event ID, type or source..."
                        className="pl-9 bg-background border-none focus-visible:ring-0"
                    />
                </div>
                <div className="h-6 w-px bg-border" />
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                    <Filter className="w-4 h-4" /> Filter
                </Button>
            </div>

            {/* Console Viewer */}
            <div className="flex-1 bg-black/90 rounded-xl border border-white/10 overflow-hidden font-mono text-xs md:text-sm flex flex-col shadow-2xl">
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Terminal className="w-4 h-4" />
                        <span>Console Output</span>
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-1">
                    {loading && events.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                        </div>
                    ) : (
                        events.map((evt) => (
                            <div key={evt.id} className="flex gap-4 hover:bg-white/5 p-1 rounded cursor-pointer group">
                                <span className="text-gray-500 whitespace-nowrap w-[180px]">{formatTimestamp(evt.timestamp)}</span>
                                <span className={`w-[120px] font-bold ${evt.type.includes('created') ? 'text-blue-400' :
                                    evt.type.includes('paid') ? 'text-green-400' :
                                        evt.type.includes('api') ? 'text-purple-400' : 'text-gray-300'
                                    }`}>
                                    {evt.type}
                                </span>
                                <span className="text-gray-400 truncate flex-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                    {JSON.stringify(evt.payload)}
                                </span>
                            </div>
                        ))
                    )}                    {isLive && (
                        <div className="animate-pulse flex gap-2 p-1">
                            <span className="text-gray-600">_</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
