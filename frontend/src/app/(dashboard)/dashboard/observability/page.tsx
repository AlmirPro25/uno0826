"use client";

import { useEffect, useState } from "react";
import { Share2, Network, ArrowRight, Clock, Box, Layers, Filter, RefreshCw, ZoomIn, ZoomOut, Database, Cloud, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type TraceSpan = {
    id: string;
    parent_id?: string;
    name: string;
    service: string;
    start_time: string;
    duration_ms: number;
    status: "ok" | "error";
    metadata: Record<string, string>;
};

type Trace = {
    trace_id: string;
    root_span_name: string;
    total_duration_ms: number;
    spans: TraceSpan[];
    started_at: string;
    status: "ok" | "error";
};

type TraceStats = {
    avg_duration_ms: number;
    error_rate: number;
    total_traces: number;
    services_detected: string[];
};

export default function DistributedObservabilityPage() {
    const [traces, setTraces] = useState<Trace[]>([]);
    const [stats, setStats] = useState<TraceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null);

    const fetchTraces = async () => {
        try {
            const res = await api.get("/observability/traces").catch(() => null);
            if (res?.data) {
                setTraces(res.data.traces || []);
                setStats(res.data.stats || null);
            }
        } catch (error) {
            console.error("Failed to fetch traces", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTraces();
        const interval = setInterval(fetchTraces, 10000); // Polling traces every 10s
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => status === "error" ? "text-red-500" : "text-emerald-500";
    const getStatusBg = (status: string) => status === "error" ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20";

    // Helper to calculate span width and offset for waterfall
    const getSpanStyle = (trace: Trace, span: TraceSpan) => {
        const traceStart = new Date(trace.started_at).getTime();
        const spanStart = new Date(span.start_time).getTime();
        const offset = spanStart - traceStart;

        const widthPercent = Math.max((span.duration_ms / trace.total_duration_ms) * 100, 1); // Min 1% width
        const leftPercent = (offset / trace.total_duration_ms) * 100;

        return {
            width: `${widthPercent}%`,
            left: `${leftPercent}%`
        };
    };

    if (loading) {
        return (
            <div className="p-8 text-blue-500/50 text-xs font-mono animate-pulse uppercase tracking-widest flex items-center gap-3">
                <Network className="w-5 h-5 animate-pulse" />
                Tracing Distributed Events...
            </div>
        );
    }

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
            {/* Header */}
            <div className="flex-none flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-blue-600 tracking-tighter uppercase">
                        Distributed Tracing
                    </h1>
                    <p className="text-muted-foreground text-[10px] font-mono mt-1 flex items-center gap-2">
                        <Share2 className="w-3 h-3 text-blue-500" />
                        OPENTELEMETRY_v1.0 // SERVICES_DETECTED: {stats?.services_detected?.length || 0}
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-900/50 border border-white/5">
                        <Clock className="w-4 h-4 text-zinc-500" />
                        <span className="text-xs font-mono text-zinc-300">Avg: {stats?.avg_duration_ms.toFixed(0)}ms</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-900/50 border border-white/5">
                        <AlertTriangle className="w-4 h-4 text-zinc-500" />
                        <span className="text-xs font-mono text-zinc-300">Errors: {(stats?.error_rate || 0).toFixed(2)}%</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area - Split View */}
            <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">

                {/* Trace List (Left) */}
                <div className="w-1/3 flex flex-col gap-3 min-h-0">
                    <div className="flex-none flex items-center justify-between pb-2 border-b border-white/5">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Layers className="w-4 h-4 text-zinc-500" />
                            Trace ID / Root
                        </h3>
                        <button onClick={fetchTraces} className="p-1 hover:text-white text-zinc-500 transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                        {traces.map((trace) => (
                            <motion.div
                                key={trace.trace_id}
                                onClick={() => setSelectedTrace(trace)}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={cn(
                                    "p-3 rounded-xl border cursor-pointer hover:border-blue-500/30 transition-all group relative overflow-hidden",
                                    selectedTrace?.trace_id === trace.trace_id ? "bg-blue-500/10 border-blue-500/30" : "bg-zinc-900/20 border-white/5"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-white truncate max-w-[180px]">{trace.root_span_name}</span>
                                    <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded", getStatusBg(trace.status), getStatusColor(trace.status))}>
                                        {trace.status}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                                    <span>#{trace.trace_id.substring(0, 8)}</span>
                                    <span className="text-zinc-400">{trace.total_duration_ms}ms</span>
                                </div>

                                <div className="mt-2 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                    {/* Mini timeline preview */}
                                    {trace.spans.slice(0, 5).map((span, i) => (
                                        <div
                                            key={i}
                                            className={cn("h-full absolute opacity-50", span.status === 'error' ? "bg-red-500" : "bg-blue-500")}
                                            style={getSpanStyle(trace, span)}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                        {traces.length === 0 && (
                            <div className="p-8 text-center text-zinc-600 text-[10px] uppercase font-bold border border-dashed border-white/10 rounded-xl">
                                No traces collected yet
                            </div>
                        )}
                    </div>
                </div>

                {/* Waterfall View (Right) */}
                <div className="w-2/3 flex flex-col bg-zinc-950/50 rounded-2xl border border-white/5 overflow-hidden">
                    {selectedTrace ? (
                        <>
                            {/* Trace Header */}
                            <div className="flex-none p-4 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                        <Network className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-white uppercase tracking-tight">{selectedTrace.root_span_name}</h2>
                                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                                            <span>TRACE: {selectedTrace.trace_id}</span>
                                            <span>•</span>
                                            <span>{new Date(selectedTrace.started_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xl font-black text-white">{selectedTrace.total_duration_ms}ms</span>
                                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Total Duration</span>
                                </div>
                            </div>

                            {/* Spans Waterfall */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
                                {/* Grid Lines */}
                                <div className="absolute inset-0 flex pointer-events-none p-4">
                                    {[0, 25, 50, 75, 100].map(pct => (
                                        <div key={pct} className="h-full border-l border-white/5 first:border-l-0 absolute top-0 bottom-0" style={{ left: `${pct}%` }}>
                                            <span className="text-[9px] text-zinc-700 font-mono ml-1 mt-1 block">{Math.round(selectedTrace.total_duration_ms * (pct / 100))}ms</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3 relative z-10 pt-6">
                                    {selectedTrace.spans.map((span) => {
                                        const styles = getSpanStyle(selectedTrace, span);
                                        return (
                                            <div key={span.id} className="group relative h-8 hover:bg-white/5 rounded flex items-center">
                                                {/* Label */}
                                                <div className="absolute left-0 -top-3 text-[9px] text-zinc-400 font-mono w-full truncate pl-2 flex items-center gap-2">
                                                    <span className="w-16 truncate text-zinc-600 uppercase font-bold text-[8px]">{span.service}</span>
                                                    <span className="text-zinc-300 font-bold">{span.name}</span>
                                                    <span className="text-zinc-600">({span.duration_ms}ms)</span>
                                                </div>

                                                {/* Bar Container */}
                                                <div className="w-full h-4 relative mx-2">
                                                    {/* Connecting Line (if parent) */}
                                                    {span.parent_id && (
                                                        <div className="absolute top-1/2 w-full border-t border-white/5 border-dashed" style={{ right: '100%' }} />
                                                    )}

                                                    {/* Actual Span Bar */}
                                                    <motion.div
                                                        initial={{ scaleX: 0 }}
                                                        animate={{ scaleX: 1 }}
                                                        className={cn(
                                                            "h-full rounded absolute min-w-[2px] shadow-sm hover:brightness-125 transition-all cursor-crosshair border border-black/20",
                                                            span.status === 'error' ? "bg-red-500" :
                                                                span.service === 'database' ? "bg-amber-500" :
                                                                    span.service === 'external' ? "bg-purple-500" : "bg-blue-500"
                                                        )}
                                                        style={styles}
                                                    >
                                                        {/* Tooltip on Hover */}
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 p-2 rounded bg-black border border-white/10 text-[10px] min-w-[150px]">
                                                            <div className="font-bold text-white mb-1">{span.name}</div>
                                                            <div className="text-zinc-400 font-mono">Duration: {span.duration_ms}ms</div>
                                                            <div className="text-zinc-400 font-mono">Service: {span.service}</div>
                                                            {Object.keys(span.metadata).length > 0 && (
                                                                <div className="mt-1 pt-1 border-t border-white/10 text-zinc-500">
                                                                    {JSON.stringify(span.metadata).slice(0, 50)}...
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-700">
                            <Layers className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-widest">Select a trace to verify causality</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
