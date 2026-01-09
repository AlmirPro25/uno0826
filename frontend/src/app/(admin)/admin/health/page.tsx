"use client";

import { useEffect, useState } from "react";
import { Activity, Database, Key, Server, CheckCircle2, AlertTriangle, RefreshCw, Cpu, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

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
    }, []);

    const getIcon = (name: string) => {
        if (name.includes("database")) return Database;
        if (name.includes("auth")) return Key;
        if (name.includes("billing")) return Activity;
        return Server;
    };

    if (loading) return <div className="p-8 text-zinc-500">Scanning system vitals...</div>;
    if (!data) return <div className="p-8 text-red-500">Failed to retrieve system status.</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">System Health</h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        Global Status: <span className={data.status === 'healthy' ? "text-green-500" : "text-red-500"}>{data.status.toUpperCase()}</span>
                        <span className="mx-2">•</span>
                        Uptime: {data.uptime}
                    </p>
                </div>
                <Button variant="outline" className="border-white/10 text-zinc-300 hover:bg-white/5" onClick={fetchHealth}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(data.services).map(([name, status]) => {
                    const Icon = getIcon(name);
                    const isHealthy = status === 'healthy';

                    return (
                        <div key={name} className="p-6 rounded-xl border border-white/10 bg-black/40 hover:bg-black/60 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-lg bg-white/5 text-zinc-300">
                                    <Icon className="w-5 h-5" />
                                </div>
                                {isHealthy ? (
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                                        <CheckCircle2 className="w-3 h-3" /> Operational
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-red-500 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
                                        <AlertTriangle className="w-3 h-3" /> {status}
                                    </div>
                                )}
                            </div>
                            <h3 className="font-semibold text-zinc-200 capitalize">{name.replace("_", " ")}</h3>
                        </div>
                    );
                })}
            </div>

            {/* System Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-zinc-900/50 border border-white/5">
                    <div className="text-zinc-500 text-xs mb-1">CPU Cores</div>
                    <div className="text-xl font-mono text-white flex items-center gap-2">
                        <Cpu className="w-4 h-4" /> {data.system.num_cpu}
                    </div>
                </div>
                <div className="p-4 rounded-lg bg-zinc-900/50 border border-white/5">
                    <div className="text-zinc-500 text-xs mb-1">Goroutines</div>
                    <div className="text-xl font-mono text-white flex items-center gap-2">
                        <Layers className="w-4 h-4" /> {data.system.num_goroutine}
                    </div>
                </div>
                <div className="p-4 rounded-lg bg-zinc-900/50 border border-white/5">
                    <div className="text-zinc-500 text-xs mb-1">Memory (MB)</div>
                    <div className="text-xl font-mono text-white flex items-center gap-2">
                        <Database className="w-4 h-4" /> {data.system.memory_mb}
                    </div>
                </div>
                <div className="p-4 rounded-lg bg-zinc-900/50 border border-white/5">
                    <div className="text-zinc-500 text-xs mb-1">Go Version</div>
                    <div className="text-xl font-mono text-white flex items-center gap-2">
                        <Activity className="w-4 h-4" /> {data.system.go_version}
                    </div>
                </div>
            </div>
        </div>
    );
}
