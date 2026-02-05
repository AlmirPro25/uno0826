"use client";

import { useEffect, useState } from "react";
import { Server, Activity, ArrowUp, ArrowDown, Cpu, Zap, Layers, RefreshCw, BarChart2, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type ScaleMetrics = {
    current_replicas: number;
    desired_replicas: number;
    min_replicas: number;
    max_replicas: number;
    cpu_usage_percent: number;
    memory_usage_percent: number;
    request_rate: number; // req/sec
    last_scale_event_time: string;
    status: "healthy" | "scaling_up" | "scaling_down" | "pressure_high";
};

type ScaleEvent = {
    id: string;
    type: "scale_up" | "scale_down";
    reason: string;
    replicas_from: number;
    replicas_to: number;
    timestamp: string;
};

export default function AutoScalerPage() {
    const [metrics, setMetrics] = useState<ScaleMetrics | null>(null);
    const [events, setEvents] = useState<ScaleEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [scaling, setScaling] = useState(false);

    // Simulated data fetching for visual demo if backend not fully wired
    const fetchScalerData = async () => {
        try {
            const res = await api.get("/autoscaler/status").catch(() => null);
            if (res?.data) {
                setMetrics(res.data.metrics);
                setEvents(res.data.events);
            } else {
                // Fallback Mock
                /*setMetrics({
                    current_replicas: 3,
                    desired_replicas: 3,
                    min_replicas: 1,
                    max_replicas: 10,
                    cpu_usage_percent: 45,
                    memory_usage_percent: 60,
                    request_rate: 150,
                    last_scale_event_time: new Date().toISOString(),
                    status: "healthy"
                });
                setEvents([
                    { id: "evt-1", type: "scale_up", reason: "CPU > 70%", replicas_from: 2, replicas_to: 3, timestamp: new Date(Date.now() - 300000).toISOString() }
                ]);*/
            }
        } catch (error) {
            console.error("Failed to fetch scaler data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScalerData();
        const interval = setInterval(fetchScalerData, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleForceScale = async (direction: "up" | "down") => {
        setScaling(true);
        try {
            await api.post("/autoscaler/scale", { direction });
            // Simulate instant feedback
            if (metrics) {
                setMetrics({
                    ...metrics,
                    status: direction === "up" ? "scaling_up" : "scaling_down",
                    desired_replicas: direction === "up" ? metrics.current_replicas + 1 : Math.max(1, metrics.current_replicas - 1)
                });
            }
            setTimeout(fetchScalerData, 2000);
        } catch (error) {
            console.error("Scale failed", error);
        } finally {
            setScaling(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-cyan-500/50 text-xs font-mono animate-pulse uppercase tracking-widest flex items-center gap-3">
                <Layers className="w-5 h-5 animate-pulse" />
                Synchronizing Elastic Infrastructure...
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-cyan-600 tracking-tighter uppercase">
                        Elastic Auto-Scaler
                    </h1>
                    <p className="text-muted-foreground text-[10px] font-mono mt-1 flex items-center gap-2">
                        <Layers className="w-3 h-3 text-cyan-500" />
                        INFRASTRUCTURE_ELASTICITY // REPLICAS: {metrics?.current_replicas || 0}/{metrics?.max_replicas || 10}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleForceScale("down")}
                        disabled={scaling || (metrics?.current_replicas || 0) <= (metrics?.min_replicas || 1)}
                        className="p-2 rounded-xl border border-white/10 text-cyan-500 bg-cyan-500/5 hover:bg-cyan-500/10 disabled:opacity-50 transition-colors"
                        title="Scale Down"
                    >
                        <ArrowDown className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleForceScale("up")}
                        disabled={scaling || (metrics?.current_replicas || 0) >= (metrics?.max_replicas || 10)}
                        className="p-2 rounded-xl border border-white/10 text-cyan-500 bg-cyan-500/5 hover:bg-cyan-500/10 disabled:opacity-50 transition-colors"
                        title="Scale Up"
                    >
                        <ArrowUp className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Replicas Card */}
                <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                            <Server className="w-5 h-5" />
                        </div>
                        <span className={cn(
                            "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                            metrics?.status === 'scaling_up' ? "bg-amber-500/10 text-amber-500" :
                                metrics?.status === 'scaling_down' ? "bg-blue-500/10 text-blue-500" :
                                    "bg-emerald-500/10 text-emerald-500"
                        )}>
                            {metrics?.status || "IDLE"}
                        </span>
                    </div>
                    <div className="relative z-10">
                        <span className="text-4xl font-black text-white tracking-tighter">{metrics?.current_replicas}</span>
                        <span className="text-zinc-500 text-sm ml-1">/ {metrics?.desired_replicas} target</span>
                        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-2">Active Worker Nodes</p>
                    </div>
                </div>

                {/* CPU Load */}
                <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <span className="text-zinc-500 text-[10px] font-mono">{metrics?.cpu_usage_percent}% LOAD</span>
                    </div>
                    <div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
                            <motion.div
                                className={cn("h-full", metrics?.cpu_usage_percent && metrics.cpu_usage_percent > 80 ? "bg-red-500" : "bg-purple-500")}
                                initial={{ width: 0 }}
                                animate={{ width: `${metrics?.cpu_usage_percent || 0}%` }}
                            />
                        </div>
                        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Aggregate CPU Usage</p>
                    </div>
                </div>

                {/* Request Rate */}
                <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                            <Zap className="w-5 h-5" />
                        </div>
                        <span className="text-zinc-500 text-[10px] font-mono">{metrics?.request_rate} RPS</span>
                    </div>
                    <div>
                        <div className="flex items-end gap-1 h-8 mb-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex-1 bg-amber-500/20 rounded-t-sm h-full relative overflow-hidden">
                                    <motion.div
                                        className="absolute bottom-0 w-full bg-amber-500"
                                        initial={{ height: "10%" }}
                                        animate={{ height: `${Math.random() * 80 + 20}%` }}
                                        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: i * 0.1 }}
                                    />
                                </div>
                            ))}
                        </div>
                        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Incoming Traffic Volume</p>
                    </div>
                </div>

                {/* Health/Pressure */}
                <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 relative overflow-hidden flex flex-col justify-center items-center text-center">
                    <div className={cn("w-12 h-12 rounded-full mb-3 flex items-center justify-center border-2",
                        metrics?.status === 'pressure_high' ? "border-red-500 text-red-500 bg-red-500/10 animate-pulse" : "border-emerald-500 text-emerald-500 bg-emerald-500/10"
                    )}>
                        <Shield className="w-6 h-6" />
                    </div>
                    <h4 className="text-white font-bold uppercase text-xs tracking-widest">System Stability</h4>
                    <p className={cn("text-xs font-mono mt-1", metrics?.status === 'pressure_high' ? "text-red-400" : "text-emerald-400")}>
                        {metrics?.status === 'pressure_high' ? "CRITICAL PRESSURE DETECTED" : "NOMINAL OPERATION"}
                    </p>
                </div>
            </div>

            {/* Scaling Events History */}
            <div className="pt-8 border-t border-white/5 space-y-4">
                <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-500" />
                    Scaling Events Log
                </h3>

                <div className="space-y-2">
                    {events.length > 0 ? events.map((evt) => (
                        <motion.div
                            key={evt.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/20 border border-white/5 hover:border-cyan-500/20 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn("p-2 rounded-full", evt.type === 'scale_up' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>
                                    {evt.type === 'scale_up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white uppercase tracking-wider">{evt.reason}</p>
                                    <p className="text-[10px] text-zinc-500 font-mono">
                                        {new Date(evt.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-zinc-500 text-xs font-mono">{evt.replicas_from}</span>
                                <ArrowRightIcon className="w-3 h-3 text-zinc-600" />
                                <span className="text-white font-bold text-sm font-mono">{evt.replicas_to} nodes</span>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="text-center py-8 text-zinc-600 text-[10px] uppercase tracking-widest italic">
                            No recent scaling events. Infrastructure is stable.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ArrowRightIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
    )
}
