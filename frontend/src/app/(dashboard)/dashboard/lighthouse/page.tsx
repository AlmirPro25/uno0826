"use client";

import { useEffect, useState } from "react";
import { Gauge, Zap, Search, Eye, Smartphone, Globe, RefreshCw, CheckCircle2, AlertTriangle, ArrowUpRight, History, Activity, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type LighthouseRun = {
    id: string;
    url: string;
    scores: {
        performance: number;
        accessibility: number;
        best_practices: number;
        seo: number;
        pwa?: number;
    };
    metrics: {
        fcp: string; // First Contentful Paint
        lcp: string; // Largest Contentful Paint
        tbt: string; // Total Blocking Time
        cls: string; // Cumulative Layout Shift
        si: string;  // Speed Index
    };
    device: "mobile" | "desktop";
    status: "pending" | "completed" | "failed";
    created_at: string;
};

export default function LighthousePage() {
    const [runs, setRuns] = useState<LighthouseRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<"mobile" | "desktop">("mobile");
    const [targetUrl, setTargetUrl] = useState("https://prostqs.com.br");

    const fetchRuns = async () => {
        try {
            const res = await api.get("/lighthouse/status").catch(() => null);
            if (res?.data?.runs) {
                setRuns(res.data.runs || []);
            } else {
                // Mock data
                /*setRuns([
                    {
                        id: "lh-1",
                        url: "https://prostqs.com.br",
                        scores: { performance: 92, accessibility: 98, best_practices: 100, seo: 100 },
                        metrics: { fcp: "0.8s", lcp: "1.2s", tbt: "40ms", cls: "0.001", si: "1.1s" },
                        device: "mobile",
                        status: "completed",
                        created_at: new Date().toISOString()
                    }
                ]);*/
            }
        } catch (error) {
            console.error("Failed to fetch lighthouse reports", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRuns();
    }, []);

    const handleRunAudit = async () => {
        setRunning(true);
        try {
            await api.post("/lighthouse/run", { url: targetUrl, device: selectedDevice });
            // In a real app, we'd poll or wait for websocket update. For now, we simulate added 'pending' state or fetch
            setTimeout(fetchRuns, 2000);
        } catch (error) {
            console.error("Failed to start audit", error);
        } finally {
            setRunning(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-emerald-500 stroke-emerald-500";
        if (score >= 50) return "text-amber-500 stroke-amber-500";
        return "text-red-500 stroke-red-500";
    };

    const CircleScore = ({ score, label, icon: Icon }: { score: number, label: string, icon: any }) => (
        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-900/20 border border-white/5 backdrop-blur-md">
            <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-zinc-800" />
                    <motion.circle
                        cx="48" cy="48" r="40"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={251}
                        initial={{ strokeDashoffset: 251 }}
                        animate={{ strokeDashoffset: 251 - (251 * score / 100) }}
                        className={cn("transition-all duration-1000 ease-out", getScoreColor(score))}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn("text-2xl font-black", getScoreColor(score).split(' ')[0])}>{score}</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
            </div>
        </div>
    );

    const latestRun = runs[0];

    if (loading) {
        return (
            <div className="p-8 text-emerald-500/50 text-xs font-mono animate-pulse uppercase tracking-widest flex items-center gap-3">
                <Gauge className="w-5 h-5 animate-pulse" />
                Calibrating Optical Sensors...
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-200 to-emerald-600 tracking-tighter uppercase">
                        Performance Radar
                    </h1>
                    <p className="text-muted-foreground text-[10px] font-mono mt-1 flex items-center gap-2">
                        <Gauge className="w-3 h-3 text-emerald-500" />
                        LIGHTHOUSE_AUDIT_v3.0 // ANALYZING: {targetUrl}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-zinc-900/50 rounded-lg p-1 border border-white/5">
                        <button
                            onClick={() => setSelectedDevice("mobile")}
                            className={cn("p-2 rounded-md transition-all", selectedDevice === "mobile" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-white")}
                        >
                            <Smartphone className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setSelectedDevice("desktop")}
                            className={cn("p-2 rounded-md transition-all", selectedDevice === "desktop" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-white")}
                        >
                            <Globe className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={handleRunAudit}
                        disabled={running}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 transition-colors text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                    >
                        {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        Run Audit
                    </button>
                </div>
            </div>

            {/* Latest Scores */}
            {latestRun ? (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <CircleScore score={latestRun.scores.performance} label="Performance" icon={Zap} />
                        <CircleScore score={latestRun.scores.accessibility} label="Accessibility" icon={Eye} />
                        <CircleScore score={latestRun.scores.best_practices} label="Best Practices" icon={CheckCircle2} />
                        <CircleScore score={latestRun.scores.seo} label="SEO" icon={Search} />
                    </div>

                    {/* Web Vitals */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/20 backdrop-blur-md">
                            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-500" />
                                Core Web Vitals
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-400 text-xs font-bold uppercase">LCP (Largest Contentful Paint)</span>
                                    <span className={cn("text-sm font-mono font-bold", parseFloat(latestRun.metrics.lcp) < 2.5 ? "text-emerald-500" : "text-amber-500")}>
                                        {latestRun.metrics.lcp}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-400 text-xs font-bold uppercase">CLS (Cumulative Layout Shift)</span>
                                    <span className={cn("text-sm font-mono font-bold", parseFloat(latestRun.metrics.cls) < 0.1 ? "text-emerald-500" : "text-amber-500")}>
                                        {latestRun.metrics.cls}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-400 text-xs font-bold uppercase">FID (First Input Delay)</span>
                                    <span className="text-sm font-mono font-bold text-zinc-300">
                                        N/A (INP pending)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/20 backdrop-blur-md">
                            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Timer className="w-4 h-4 text-blue-500" />
                                Speed Metrics
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-400 text-xs font-bold uppercase">FCP (First Contentful Paint)</span>
                                    <span className="text-sm font-mono font-bold text-blue-400">
                                        {latestRun.metrics.fcp}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-400 text-xs font-bold uppercase">SI (Speed Index)</span>
                                    <span className="text-sm font-mono font-bold text-blue-400">
                                        {latestRun.metrics.si}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-400 text-xs font-bold uppercase">TBT (Total Blocking Time)</span>
                                    <span className={cn("text-sm font-mono font-bold", parseInt(latestRun.metrics.tbt) < 200 ? "text-emerald-500" : "text-amber-500")}>
                                        {latestRun.metrics.tbt}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/20 backdrop-blur-md flex flex-col justify-center items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h4 className="text-white font-bold text-lg">Passed Audits</h4>
                            <span className="text-4xl font-black text-emerald-500 tracking-tighter mt-1">
                                {Math.round((latestRun.scores.performance + latestRun.scores.accessibility + latestRun.scores.best_practices + latestRun.scores.seo) / 4)}%
                            </span>
                            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-2">Overall Health</p>
                        </div>
                    </div>
                </>
            ) : (
                <div className="p-12 rounded-2xl border border-dashed border-white/10 text-center bg-white/5">
                    <Gauge className="w-12 h-12 mx-auto text-zinc-700 mb-4" />
                    <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">No audits found</p>
                    <p className="text-zinc-600 text-xs mt-2">Run your first Lighthouse audit to analyze performance.</p>
                </div>
            )}

            {/* History Table */}
            <div className="border-t border-white/5 pt-8">
                <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <History className="w-4 h-4 text-zinc-500" />
                    Audit History
                </h3>

                <div className="space-y-2">
                    {runs.map((run) => (
                        <div key={run.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-white/5 hover:border-white/10 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400">
                                    {run.device === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-zinc-300">{new URL(run.url).hostname}</p>
                                    <p className="text-[10px] text-zinc-500 font-mono uppercase">
                                        {new Date(run.created_at).toLocaleDateString()} {new Date(run.created_at).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex gap-4 text-center">
                                    <div><span className={cn("text-sm font-bold block", getScoreColor(run.scores.performance).split(' ')[0])}>{run.scores.performance}</span><span className="text-[9px] text-zinc-600 uppercase">Perf</span></div>
                                    <div><span className={cn("text-sm font-bold block", getScoreColor(run.scores.seo).split(' ')[0])}>{run.scores.seo}</span><span className="text-[9px] text-zinc-600 uppercase">SEO</span></div>
                                </div>
                                <button className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors">
                                    <ArrowUpRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
