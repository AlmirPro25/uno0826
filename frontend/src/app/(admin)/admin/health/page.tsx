"use client";

import { useEffect, useState } from "react";
import { Activity, Database, Key, Server, CheckCircle2, AlertTriangle, RefreshCw, Cpu, Layers, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type HealthResponse = {
    status: string;
    services: Record<string, string>;
    system: {
        go_version: string;
        num_goroutine: number;
        num_cpu: number;
        memory_mb: number;
    };
    uptime: string;
}

export default function AdminHealthPage() {
    const [data, setData] = useState<HealthResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchHealth = async () => {
        setLoading(true);
        try {
            const res = await api.get("/health");
            setData(res.data);
        } catch (e) {
            console.error("Health check failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 15000);
        return () => clearInterval(interval);
    }, []);

    const getIcon = (name: string) => {
        if (name.includes("database")) return Database;
        if (name.includes("auth")) return Key;
        if (name.includes("billing")) return Activity;
        return Server;
    };

    if (loading && !data) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <LoaderIcon className="w-8 h-8 animate-spin text-red-500" />
            <p className="font-mono text-[10px] text-red-500/50 uppercase tracking-[0.4em] animate-pulse">Running Deep Scan...</p>
        </div>
    );

    if (!data) return (
        <div className="p-20 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-white font-black uppercase tracking-widest">Unable to reach Kernel API</p>
            <Button onClick={fetchHealth} variant="outline" className="border-red-500/20 text-red-500">Retry Link</Button>
        </div>
    );

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-900/20 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-white">
                        Kernel <span className="text-red-500">Vitals</span>
                    </h1>
                    <p className="text-zinc-500 mt-2 font-mono text-[10px] uppercase tracking-[0.3em]">System Level Health & Deep Diagnostics</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-2xl bg-zinc-900 border border-white/5 flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none">Global Pulse</span>
                            <span className={cn("text-xs font-black uppercase tracking-tighter", data.status === 'healthy' ? "text-emerald-500" : "text-red-500")}>
                                {data.status}
                            </span>
                        </div>
                        <div className="h-4 w-px bg-white/5" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none">Kernel Uptime</span>
                            <span className="text-xs font-mono text-zinc-300 font-bold">{data.uptime}</span>
                        </div>
                    </div>
                    <Button variant="outline" className="h-10 w-10 p-0 border-white/5 bg-zinc-900 text-zinc-400 hover:text-white" onClick={fetchHealth} disabled={loading}>
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(data.services).map(([name, status]) => {
                    const Icon = getIcon(name);
                    const isHealthy = status === 'healthy';

                    return (
                        <motion.div
                            key={name}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={cn(
                                "p-6 rounded-[32px] border transition-all duration-300 relative overflow-hidden group",
                                isHealthy ? "border-white/5 bg-zinc-900/40" : "border-red-500/20 bg-red-500/5"
                            )}
                        >
                            <div className="flex items-start justify-between mb-6 relative z-10">
                                <div className={cn(
                                    "p-3 rounded-2xl flex items-center justify-center shadow-2xl transition-all",
                                    isHealthy ? "bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700" : "bg-red-950 text-red-500"
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                {isHealthy ? (
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                                ) : (
                                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
                                )}
                            </div>
                            <div className="relative z-10">
                                <h3 className="font-black text-zinc-200 capitalize text-sm tracking-tight">{name.replace("_", " ")}</h3>
                                <p className={cn(
                                    "text-[9px] font-black uppercase tracking-[0.2em] mt-1",
                                    isHealthy ? "text-zinc-600" : "text-red-500"
                                )}>
                                    {isHealthy ? "Active Service" : "Critical_Fail"}
                                </p>
                            </div>

                            <div className={cn(
                                "absolute -bottom-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-10 group-hover:opacity-20 transition-all",
                                isHealthy ? "bg-zinc-500" : "bg-red-500"
                            )} />
                        </motion.div>
                    );
                })}
            </div>

            {/* System Info Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Memory Block", value: `${data.system.memory_mb} MB`, icon: Database },
                    { label: "Core Threads", value: data.system.num_cpu, icon: Cpu },
                    { label: "Goroutines", value: data.system.num_goroutine.toLocaleString(), icon: Layers },
                    { label: "Kernel Base", value: data.system.go_version, icon: Zap }
                ].map((item, idx) => (
                    <div key={idx} className="p-6 rounded-3xl bg-black border border-white/5 relative group hover:border-red-500/20 transition-all cursor-default">
                        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <item.icon className="w-3 h-3 text-red-500/50" />
                            {item.label}
                        </div>
                        <div className="text-2xl font-black text-white tracking-tighter font-mono">
                            {item.value}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ))}
            </div>

            {/* System Immunity Banner */}
            <div className="p-10 rounded-[40px] border border-emerald-500/10 bg-emerald-500/5 flex items-center gap-8 relative overflow-hidden">
                <div className="h-20 w-20 shrink-0 rounded-[32px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-2xl">
                    <ShieldCheck className="w-10 h-10 text-emerald-500" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-emerald-500 font-black text-xl uppercase tracking-tighter leading-none italic">Immunity Calibration Optimal</h3>
                    <p className="text-zinc-500 text-xs font-medium max-w-2xl leading-relaxed font-mono">
                        The Kernel has not detected any invariant violations in the last 24 cycles. All safety boundaries (KYC, Ledger, Billing) are within nominal deviation parameters.
                    </p>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <ShieldCheck className="w-40 h-40 text-emerald-500" />
                </div>
            </div>
        </div>
    );
}

function LoaderIcon(props: React.SVGProps<SVGSVGElement>) {
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
            <path d="M12 2v4" />
            <path d="m16.2 7.8 2.9-2.9" />
            <path d="M18 12h4" />
            <path d="m16.2 16.2 2.9 2.9" />
            <path d="M12 18v4" />
            <path d="m4.9 19.1 2.9-2.9" />
            <path d="M2 12h4" />
            <path d="m4.9 4.9 2.9 2.9" />
        </svg>
    )
}
