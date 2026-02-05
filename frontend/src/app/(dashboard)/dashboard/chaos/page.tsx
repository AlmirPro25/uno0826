"use client";

import { useEffect, useState } from "react";
import { Zap, AlertTriangle, ShieldAlert, Play, Square, Activity, Timer, Skull, RefreshCw, ServerCrash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type ChaosExperiment = {
    id: string;
    name: string;
    type: "latency" | "error" | "cpu_stress" | "memory_stress" | "network_partition";
    target_service: string;
    status: "running" | "stopped" | "completed" | "failed";
    config: {
        duration_sec: number;
        intensity: number; // 0-1
        latency_ms?: number;
        error_rate?: number;
    };
    started_at?: string;
    ended_at?: string;
};

type CreateExperimentForm = {
    name: string;
    type: string;
    target_service: string;
    duration_sec: number;
    intensity: number;
};

export default function ChaosDashboardPage() {
    const [experiments, setExperiments] = useState<ChaosExperiment[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Default form state
    const [form, setForm] = useState<CreateExperimentForm>({
        name: "",
        type: "latency",
        target_service: "all",
        duration_sec: 60,
        intensity: 0.5
    });

    const fetchExperiments = async () => {
        try {
            // Mock data for now if backend endpoint is not ready or empty
            const res = await api.get("/chaos/experiments").catch(() => null);
            if (res?.data) {
                setExperiments(res.data || []);
            } else {
                // Fallback/Demo data if backend returns 404/empty (since it's a new feature)
                /*
               setExperiments([
                   {
                       id: "exp-1",
                       name: "Network Latency Spike",
                       type: "latency",
                       target_service: "payment-service",
                       status: "completed",
                       config: { duration_sec: 300, intensity: 0.8, latency_ms: 500 },
                       started_at: new Date(Date.now() - 3600000).toISOString(),
                       ended_at: new Date(Date.now() - 3300000).toISOString()
                   }
               ]);
               */
            }
        } catch (error) {
            console.error("Failed to fetch chaos experiments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExperiments();
        const interval = setInterval(fetchExperiments, 5000); // Poll status
        return () => clearInterval(interval);
    }, []);

    const handleCreate = async () => {
        setCreating(true);
        try {
            await api.post("/chaos/experiments", form);
            setShowForm(false);
            setForm({ name: "", type: "latency", target_service: "all", duration_sec: 60, intensity: 0.5 });
            fetchExperiments();
        } catch (error) {
            console.error("Failed to start experiment", error);
        } finally {
            setCreating(false);
        }
    };

    const handleStop = async (id: string) => {
        try {
            await api.post(`/chaos/experiments/${id}/stop`);
            fetchExperiments();
        } catch (error) {
            console.error("Failed to stop experiment", error);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "latency": return Timer;
            case "error": return AlertTriangle;
            case "cpu_stress": return Activity;
            case "memory_stress": return ServerCrash;
            default: return Zap;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "latency": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
            case "error": return "text-red-500 bg-red-500/10 border-red-500/20";
            case "cpu_stress": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
            default: return "text-zinc-500 bg-zinc-500/10 border-zinc-500/20";
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-red-500/50 text-xs font-mono animate-pulse uppercase tracking-widest flex items-center gap-3">
                <Skull className="w-5 h-5 animate-pulse" />
                Initializing Chaos Protocol...
            </div>
        );
    }

    const activeExperiments = experiments.filter(e => e.status === 'running');
    const pastExperiments = experiments.filter(e => e.status !== 'running');

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-red-200 to-red-600 tracking-tighter uppercase">
                        Chaos Engineering
                    </h1>
                    <p className="text-muted-foreground text-[10px] font-mono mt-1 flex items-center gap-2">
                        <Skull className="w-3 h-3 text-red-500" />
                        RESILIENCE_TESTING_v3.0 // ACTIVE_EXPERIMENTS: {activeExperiments.length}
                    </p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-colors text-xs font-bold uppercase tracking-widest"
                    >
                        <Zap className="w-4 h-4" />
                        Inject Failure
                    </button>
                )}
            </div>

            {/* Warning Banner */}
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 flex items-start gap-4">
                <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                    <h3 className="text-red-500 font-bold uppercase text-xs tracking-wider">Warning: Production Environment</h3>
                    <p className="text-zinc-400 text-xs mt-1">
                        Injecting faults here will affect real users. Ensure the "Blast Radius" is contained. Current safety measures (Circuit Breakers) are active.
                    </p>
                </div>
            </div>

            {/* Create Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-4 mb-8">
                            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                                <Zap className="w-4 h-4 text-red-500" />
                                Configure Fault Injection
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Experiment Name</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g., Latency Spike Payment"
                                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:border-red-500/50 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Fault Type</label>
                                    <select
                                        value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:border-red-500/50 focus:outline-none transition-colors"
                                    >
                                        <option value="latency">Network Latency (Lag)</option>
                                        <option value="error">Error Injection (5xx)</option>
                                        <option value="cpu_stress">CPU Stress</option>
                                        <option value="memory_stress">Memory Leak</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Target Service</label>
                                    <select
                                        value={form.target_service}
                                        onChange={(e) => setForm({ ...form, target_service: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:border-red-500/50 focus:outline-none transition-colors"
                                    >
                                        <option value="all">Global (All Services)</option>
                                        <option value="api-gateway">API Gateway</option>
                                        <option value="billing">Billing Service</option>
                                        <option value="auth">Auth Service</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Duration (sec)</label>
                                    <input
                                        type="number"
                                        value={form.duration_sec}
                                        onChange={(e) => setForm({ ...form, duration_sec: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:border-red-500/50 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Intensity (0.0 - 1.0)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="1"
                                        value={form.intensity}
                                        onChange={(e) => setForm({ ...form, intensity: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:border-red-500/50 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-colors text-xs font-bold uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={creating || !form.name}
                                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                                >
                                    {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                    Start Experiment
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active Experiments */}
            <div className="space-y-4">
                <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-red-500 animate-pulse" />
                    Active Experiments
                </h3>

                {activeExperiments.length > 0 ? activeExperiments.map((exp) => (
                    <motion.div
                        key={exp.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 rounded-2xl border border-red-500/30 bg-red-950/20 backdrop-blur-md relative overflow-hidden"
                    >
                        {/* Scanline effect */}
                        <div className="absolute inset-0 bg-repeat-y opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to bottom, transparent 50%, rgba(255, 0, 0, 0.2) 50%)', backgroundSize: '100% 4px' }} />

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-red-500/20 text-red-500 animate-pulse">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-white uppercase tracking-tight">{exp.name}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs font-mono text-zinc-400 uppercase">Target: <span className="text-white font-bold">{exp.target_service}</span></span>
                                        <span className="text-xs font-mono text-zinc-400 uppercase">Type: <span className="text-red-400 font-bold">{exp.type}</span></span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Time Remaining</span>
                                    <span className="block text-xl font-black text-white font-mono">
                                        00:45 {/* Placeholder countdown */}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleStop(exp.id)}
                                    className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-500 transition-colors"
                                    title="Abort Experiment"
                                >
                                    <Square className="w-5 h-5 fill-current" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )) : (
                    <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center bg-white/5">
                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">No Active Faults</p>
                        <p className="text-zinc-600 text-xs mt-1">System operating within normal parameters.</p>
                    </div>
                )}
            </div>

            {/* History */}
            <div className="space-y-4 pt-4">
                <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                    <HistoryIcon className="w-4 h-4 text-zinc-500" />
                    Experiment History
                </h3>

                <div className="grid grid-cols-1 gap-3">
                    {pastExperiments.length > 0 ? pastExperiments.map((exp) => (
                        <div key={exp.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg", getTypeColor(exp.type))}>
                                    {/* Icon based on type */}
                                    <Zap className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-zinc-300">{exp.name}</p>
                                    <p className="text-[10px] text-zinc-500 font-mono uppercase">
                                        {new Date(exp.started_at || "").toLocaleDateString()} • {exp.target_service}
                                    </p>
                                </div>
                            </div>
                            <span className={cn(
                                "text-[10px] font-black uppercase px-2 py-0.5 rounded",
                                exp.status === 'completed' ? "text-emerald-500 bg-emerald-500/10" : "text-zinc-500 bg-zinc-500/10"
                            )}>
                                {exp.status}
                            </span>
                        </div>
                    )) : (
                        <p className="text-center py-6 text-[10px] text-zinc-600 uppercase tracking-widest italic">No historical data available.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Icon helper
function HistoryIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
        </svg>
    )
}
