import { useState, useEffect } from "react";
import { useGhostStore } from "@/stores/useGhostStore"; // Updated import
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Play,
    Pause,
    Send,
    Crosshair,
    Zap,
    BrainCircuit,
    ScrollText, // NEW: Icon for logs
    Clock, // Icon for logs
    Loader2 // Import Loader2
} from "lucide-react";
import { cn, formatTime } from "@/lib/utils"; // Import formatTime

export function GhostControls() {
    const {
        activeContactId,
        contacts,
        togglePause,
        injectDirective,
        logs, // NEW: Access logs from store
        fetchSystemLogs // NEW: Fetch logs
    } = useGhostStore();
    const [directive, setDirective] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const activeContact = contacts.find(c => c.id === activeContactId);

    useEffect(() => {
        fetchSystemLogs(); // Fetch logs on mount
        const interval = setInterval(fetchSystemLogs, 30000); // Refresh logs every 30 seconds
        return () => clearInterval(interval);
    }, [fetchSystemLogs]);


    if (!activeContact) {
        return (
            <div className="w-96 border-l border-border bg-card flex flex-col h-full">
                <div className="p-4 border-b border-border bg-accent/10">
                    <h2 className="text-sm font-mono font-bold flex items-center gap-2 text-foreground">
                        <Crosshair className="w-4 h-4 text-destructive" />
                        MISSILE GUIDANCE
                    </h2>
                </div>
                <div className="flex-1 flex items-center justify-center text-muted-foreground/60 text-sm font-mono">
                    SELECT TARGET
                </div>
            </div>
        );
    }

    const handleDirectiveSubmit = async () => {
        if (!activeContactId || !directive.trim()) return;
        setIsSubmitting(true);
        await injectDirective(activeContactId, directive);
        setDirective("");
        setIsSubmitting(false);
    };

    return (
        <div className="w-96 border-l border-slate-800 bg-slate-950 flex flex-col h-full font-sans">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                <h2 className="text-sm font-bold flex items-center gap-2 text-slate-100 tracking-wide">
                    <Crosshair className="w-4 h-4 text-emerald-500" />
                    MISSILE GUIDANCE
                </h2>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto">

                {/* Status Section */}
                <section className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Operational Status</label>
                    <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-3 h-3 rounded-full shadow-[0_0_10px]",
                                activeContact.isPaused
                                    ? "bg-amber-500 shadow-amber-500/50"
                                    : "bg-emerald-500 shadow-emerald-500/50 animate-pulse"
                            )} />
                            <span className={cn(
                                "font-bold text-sm",
                                activeContact.isPaused ? "text-amber-400" : "text-emerald-400"
                            )}>
                                {activeContact.isPaused ? "HUMAN CONTROL" : "AUTOPILOT ENGAGED"}
                            </span>
                        </div>
                        <Button
                            size="sm"
                            variant={activeContact.isPaused ? "default" : "destructive"}
                            className={cn(
                                "h-8 font-bold text-xs gap-2 px-3",
                                activeContact.isPaused ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 border border-red-900/50"
                            )}
                            onClick={() => togglePause(activeContact.id, activeContact.isPaused)}
                        >
                            {activeContact.isPaused ? (
                                <><Play className="w-3 h-3" /> RESUME AI</>
                            ) : (
                                <><Pause className="w-3 h-3" /> STOP AI</>
                            )}
                        </Button>
                    </div>
                </section>

                {/* Semantic Profile Analysis */}
                <section className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-widest">
                        <BrainCircuit className="w-3 h-3" />
                        Psycho-Analysis
                    </label>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4 shadow-sm">
                        <div className="space-y-2">
                            <span className="text-[10px] text-slate-500 font-bold block spacing-1">SEMANTIC PROFILE</span>
                            <Badge variant="outline" className="text-xs font-mono bg-slate-800 text-slate-300 border-slate-700 px-3 py-1">
                                {activeContact.semanticProfile || "ANALYZING PATTERNS..."}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 font-bold block">AVG LATENCY</span>
                                <span className="text-sm font-mono text-slate-200">{activeContact.avgResponseTime}s</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 font-bold block">ENGAGEMENT</span>
                                {/* Placeholder for real heat level calculation */}
                                <span className="text-sm font-mono text-emerald-400 font-bold">RISING</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Directive Injection */}
                <section className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-widest">
                        <Zap className="w-3 h-3 text-amber-500" />
                        Inject Mission
                    </label>
                    <div className="space-y-3">
                        {activeContact.activeDirective && (
                            <div className={cn(
                                "border p-3 rounded-lg text-xs mb-2 transition-all",
                                activeContact.directiveStatus === 'EXECUTING'
                                    ? "bg-blue-950/20 border-blue-900/50 text-blue-300"
                                    : "bg-emerald-950/20 border-emerald-900/50 text-emerald-300"
                            )}>
                                <span className="font-bold block mb-1 text-[10px] uppercase tracking-wider opacity-70">
                                    Current Mission ({activeContact.directiveStatus}):
                                </span>
                                <p className="font-medium">"{activeContact.activeDirective}"</p>
                            </div>
                        )}

                        <div className="relative">
                            <Textarea
                                placeholder="Command the AI (e.g., 'Be more aggressive', 'Ask about budget')..."
                                className="bg-slate-900 border-slate-700 text-slate-200 font-sans text-sm min-h-[100px] resize-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 p-4 rounded-xl"
                                value={directive}
                                onChange={(e) => setDirective(e.target.value)}
                                disabled={activeContact.isPaused || isSubmitting}
                            />
                            {isSubmitting && (
                                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
                                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                                </div>
                            )}
                        </div>

                        <Button
                            className="w-full font-bold text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-10 rounded-lg shadow-lg shadow-emerald-900/20"
                            disabled={!directive.trim() || isSubmitting || activeContact.isPaused}
                            onClick={handleDirectiveSubmit}
                        >
                            <Send className="w-3 h-3" />
                            TRANSMIT DIRECTIVE
                        </Button>

                        {activeContact.isPaused && (
                            <p className="text-[10px] text-amber-500 text-center font-medium bg-amber-950/30 py-2 rounded border border-amber-900/30">
                                ⚠ System requires AUTOPILOT for mission injection.
                            </p>
                        )}
                        <p className="text-[10px] text-slate-500 text-center">
                            Calculated for seamless insertion into next response context.
                        </p>
                    </div>
                </section>

                {/* System Logs Section */}
                <section className="space-y-3 flex-1 min-h-[200px]">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-widest">
                        <ScrollText className="w-3 h-3" />
                        Live Neural Logs
                    </label>
                    <div className="bg-slate-950 p-0 rounded-xl border border-slate-800 h-full overflow-hidden flex flex-col">
                        <div className="overflow-y-auto p-3 space-y-1 font-mono text-[10px]">
                            {logs.length === 0 ? (
                                <p className="text-center text-slate-600 py-10 italic">Waiting for neural activity...</p>
                            ) : (
                                logs.map((log) => (
                                    <div key={log.id} className="py-1.5 border-b border-slate-900/50 last:border-0 flex gap-3 hover:bg-slate-900/50 px-2 rounded transition-colors group">
                                        <span className="text-slate-600 flex-shrink-0 w-12">{formatTime(log.createdAt)}</span>
                                        <span className={cn(
                                            "flex-shrink-0 font-bold w-12 text-center text-[9px] px-1 py-0.5 rounded",
                                            log.level === 'INFO' && 'bg-blue-950/30 text-blue-400',
                                            log.level === 'WARN' && 'bg-amber-950/30 text-amber-400',
                                            log.level === 'ERROR' && 'bg-red-950/30 text-red-400',
                                            log.level === 'ACTION' && 'bg-emerald-950/30 text-emerald-400'
                                        )}>
                                            {log.level}
                                        </span>
                                        <span className="text-slate-400 group-hover:text-slate-200 transition-colors break-all">
                                            <span className="text-slate-500 mr-1">{log.event}:</span>
                                            {log.details}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
