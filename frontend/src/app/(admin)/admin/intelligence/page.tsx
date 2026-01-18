"use client";

import { useState, useEffect } from "react";
import { Brain, Sparkles, MessageSquare, RefreshCw, AlertTriangle, Zap, Terminal, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NarrativeResponse {
    narrative: string;
    type: string;
    generated_at: string;
    model: string;
}

export default function IntelligencePage() {
    const [narrative, setNarrative] = useState<NarrativeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchNarrative = async (type: string = "summary") => {
        setLoading(true);
        setError(false);
        try {
            // Updated to match backend POST /admin/cognitive/narrate
            const res = await api.post<NarrativeResponse>("/admin/cognitive/narrate", {
                type: type
            });

            if (res.data && res.data.narrative) {
                setNarrative(res.data);
            }
        } catch (err) {
            console.error("Narrator fetch error", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNarrative();
    }, []);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-900/20 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none italic bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-white">
                        Cognitive <span className="text-red-600">Oracle</span>
                    </h1>
                    <p className="text-zinc-500 mt-2 font-mono text-[10px] uppercase tracking-[0.3em]">Neural Narrative Synchronization System</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => fetchNarrative("summary")}
                        variant="outline"
                        size="sm"
                        className="border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-black text-[10px] uppercase tracking-widest"
                        disabled={loading}
                    >
                        <RefreshCw className={cn("w-3 h-3 mr-2", loading && "animate-spin")} />
                        Re-Synthesize
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Controls */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/20 space-y-4">
                        <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest border-b border-white/5 pb-2">Narrative Modes</h3>
                        <div className="space-y-2">
                            {[
                                { id: "summary", label: "Instant Summary", icon: Zap },
                                { id: "daily", label: "Daily Report", icon: Activity },
                                { id: "weekly", label: "Weekly Analysis", icon: Brain }
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => fetchNarrative(mode.id)}
                                    disabled={loading}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                        narrative?.type === mode.id
                                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                                    )}
                                >
                                    <mode.icon className="w-3 h-3" />
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-red-500/10 bg-red-500/5">
                        <div className="flex items-center gap-2 text-red-500 mb-2">
                            <Terminal className="w-3 h-3" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Oracle Health</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-bold uppercase text-zinc-500">
                                <span>Core Synchronization</span>
                                <span className="text-emerald-500">100%</span>
                            </div>
                            <div className="flex justify-between text-[8px] font-bold uppercase text-zinc-500">
                                <span>Model Trust</span>
                                <span className="text-amber-500">0.982</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="group relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-amber-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                        <div className="relative bg-black rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                            <div className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-white/[0.01]">
                                <div className="flex items-center gap-3 text-zinc-500">
                                    <Brain className="w-4 h-4 text-red-500" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">Cognitive Narrator // {narrative?.model || "SYNCING..."}</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-1 w-1 rounded-full bg-red-500 animate-ping" />
                                            <span className="text-[8px] font-black text-red-500/50 uppercase tracking-widest">Reading Pulse...</span>
                                        </div>
                                    ) : (
                                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                            <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                            Real-time Output
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 md:p-12 min-h-[400px]">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-full space-y-6 pt-10">
                                        <Sparkles className="w-12 h-12 text-red-500/20 animate-pulse" />
                                        <div className="space-y-2 text-center">
                                            <p className="text-xs font-mono text-red-500/50 animate-pulse tracking-[0.5em] uppercase">Connecting to Neural Matrix</p>
                                            <p className="text-[9px] font-mono text-zinc-700 uppercase">Consulting Gemini Robotics ER-1.5 Proxy...</p>
                                        </div>
                                    </div>
                                ) : error ? (
                                    <div className="flex flex-col items-center justify-center h-full space-y-6 pt-10 text-center">
                                        <AlertTriangle className="w-12 h-12 text-red-500" />
                                        <div className="space-y-4">
                                            <h3 className="text-white font-black uppercase tracking-widest">Oracle Offline</h3>
                                            <p className="text-xs text-zinc-500 max-w-xs">The cognitive subsystem failed to respond. Verify GEMINI_API_KEY in kernel ENV.</p>
                                            <Button variant="outline" size="sm" onClick={() => fetchNarrative()} className="border-red-500/20">Retry Connection</Button>
                                        </div>
                                    </div>
                                ) : narrative ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="max-w-4xl"
                                    >
                                        <div className="flex gap-8">
                                            <div className="hidden md:flex h-12 w-12 shrink-0 rounded-2xl bg-red-500/5 border border-red-500/10 items-center justify-center">
                                                <MessageSquare className="w-5 h-5 text-red-500" />
                                            </div>
                                            <div className="space-y-8">
                                                <div className="prose prose-invert prose-p:text-zinc-300 prose-p:text-lg prose-p:leading-relaxed max-w-none">
                                                    <p className="whitespace-pre-wrap font-medium text-zinc-200 indent-0 leading-relaxed tracking-tight">
                                                        {narrative.narrative}
                                                    </p>
                                                </div>
                                                <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[8px] uppercase font-black text-zinc-600 tracking-[0.2em]">Synchronization Timestamp:</span>
                                                        <span className="text-[8px] font-mono text-red-500/70">{new Date(narrative.generated_at).toLocaleString()}</span>
                                                    </div>
                                                    <div className="text-[8px] font-black text-zinc-700 uppercase tracking-widest italic">
                                                        Authenticated by Prost-QS Kernel
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full pt-20 text-center opacity-30">
                                        <Brain className="w-16 h-16 text-zinc-500 mb-4" />
                                        <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">No Narrative Buffer Available.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
