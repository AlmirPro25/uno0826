"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Cog, Loader2, RefreshCw, Search, RotateCcw,
    CheckCircle2, XCircle, Clock, AlertTriangle
} from "lucide-react";
import { api } from "@/lib/api";
import { AppHeader } from "@/components/dashboard/app-header";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Job {
    id: string;
    type: string;
    status: "pending" | "processing" | "completed" | "failed" | "cancelled";
    payload: Record<string, unknown>;
    result?: Record<string, unknown>;
    error?: string;
    attempts: number;
    max_attempts: number;
    scheduled_at?: string;
    started_at?: string;
    completed_at?: string;
    created_at: string;
}

interface JobStats {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
}

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [stats, setStats] = useState<JobStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [retrying, setRetrying] = useState<string | null>(null);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const [jobsRes, statsRes] = await Promise.all([
                api.get("/admin/jobs?limit=100"),
                api.get("/admin/jobs/stats").catch(() => ({ data: null }))
            ]);
            setJobs(jobsRes.data.jobs || jobsRes.data || []);
            setStats(statsRes.data);
        } catch (error) {
            console.error("Failed to fetch jobs", error);
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
        // Auto-refresh every 10 seconds
        const interval = setInterval(fetchJobs, 10000);
        return () => clearInterval(interval);
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case "failed": return <XCircle className="w-4 h-4 text-rose-500" />;
            case "processing": return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
            case "pending": return <Clock className="w-4 h-4 text-amber-500" />;
            case "cancelled": return <AlertTriangle className="w-4 h-4 text-slate-500" />;
            default: return <Clock className="w-4 h-4 text-slate-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "failed": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
            case "processing": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            case "pending": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            case "cancelled": return "bg-slate-500/10 text-slate-400 border-slate-500/20";
            default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleString('pt-BR');
    };

    const handleRetry = async (jobId: string) => {
        setRetrying(jobId);
        try {
            await api.post(`/admin/jobs/${jobId}/retry`);
            toast.success("Job reenfileirado");
            fetchJobs();
        } catch {
            toast.error("Erro ao reenfileirar job");
        } finally {
            setRetrying(null);
        }
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = !searchQuery || 
            job.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "all" || job.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                        Background Jobs
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Fila de tarefas assíncronas do sistema
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline"
                        onClick={fetchJobs}
                        disabled={loading}
                        className="h-11 px-4 rounded-xl border-white/10 text-white hover:bg-white/5"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-5 gap-4">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                        <p className="text-2xl font-black text-white">{stats.total}</p>
                        <p className="text-xs text-slate-500">Total</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                        <p className="text-2xl font-black text-amber-400">{stats.pending}</p>
                        <p className="text-xs text-amber-400/60">Pendentes</p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                        <p className="text-2xl font-black text-blue-400">{stats.processing}</p>
                        <p className="text-xs text-blue-400/60">Processando</p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                        <p className="text-2xl font-black text-emerald-400">{stats.completed}</p>
                        <p className="text-xs text-emerald-400/60">Completos</p>
                    </div>
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                        <p className="text-2xl font-black text-rose-400">{stats.failed}</p>
                        <p className="text-xs text-rose-400/60">Falhos</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <Input
                        placeholder="Buscar por tipo ou ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11 pl-11 bg-white/[0.02] border-white/10 focus:border-indigo-500/50 rounded-xl text-white"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="h-11 px-4 rounded-xl bg-white/[0.02] border border-white/10 text-white focus:border-indigo-500/50 outline-none"
                >
                    <option value="all">Todos</option>
                    <option value="pending">Pendentes</option>
                    <option value="processing">Processando</option>
                    <option value="completed">Completos</option>
                    <option value="failed">Falhos</option>
                </select>
            </div>

            {/* Jobs List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : filteredJobs.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <Cog className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                        Nenhum job encontrado
                    </h3>
                    <p className="text-slate-500">Jobs aparecerão aqui quando forem criados</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredJobs.map((job, i) => (
                        <motion.div
                            key={job.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                {getStatusIcon(job.status)}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-white">{job.type}</span>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                                            getStatusColor(job.status)
                                        )}>
                                            {job.status}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            Tentativa {job.attempts}/{job.max_attempts}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span className="font-mono">{job.id.substring(0, 8)}...</span>
                                        <span>Criado: {formatDate(job.created_at)}</span>
                                        {job.completed_at && (
                                            <span>Completo: {formatDate(job.completed_at)}</span>
                                        )}
                                    </div>
                                    {job.error && (
                                        <p className="text-xs text-rose-400 mt-1 truncate">
                                            Erro: {job.error}
                                        </p>
                                    )}
                                </div>
                                {job.status === "failed" && job.attempts < job.max_attempts && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRetry(job.id)}
                                        disabled={retrying === job.id}
                                        className="border-white/10 text-white hover:bg-white/5"
                                    >
                                        {retrying === job.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <RotateCcw className="w-4 h-4 mr-1" />
                                                Retry
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
