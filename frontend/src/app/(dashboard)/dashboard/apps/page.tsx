"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal, Loader2, X, Globe, Lock, ShieldAlert, Cpu, Rocket } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface App {
    id: string;
    name: string;
    slug: string;
    description: string;
    created_at: string;
    status?: string;
}

export default function AppsPage() {
    const [apps, setApps] = useState<App[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [newName, setNewName] = useState("");
    const [newSlug, setNewSlug] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [creating, setCreating] = useState(false);

    const fetchApps = async () => {
        try {
            const res = await api.get("/apps/mine");
            setApps(res.data.apps || []);
        } catch (err) {
            setError("Falha ao carregar aplicações do Kernel.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApps();
    }, []);

    const handleCreateApp = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post("/apps", {
                name: newName,
                slug: newSlug || newName.toLowerCase().replace(/ /g, "-"),
                description: newDesc
            });
            toast.success("Aplicação orquestrada com sucesso!");
            setIsModalOpen(false);
            setNewName("");
            setNewSlug("");
            setNewDesc("");
            fetchApps();
        } catch (err: any) {
            const msg = err.response?.data?.error || "Falha ao criar aplicação.";
            if (err.response?.status === 403) {
                toast.error("Assinatura PRO necessária.", {
                    description: "Verifique suas configurações de billing."
                });
            } else {
                toast.error(msg);
            }
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                        ORQUESTRADOR DE <span className="text-indigo-500">APPS</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Gerencie suas instâncias e chaves de acesso ao Kernel.</p>
                </div>
                <Button className="h-14 px-8 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 transition-all" onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Criar Novo App
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-2 rounded-2xl focus-within:border-indigo-500/50 transition-all">
                    <Search className="w-5 h-5 text-slate-600" />
                    <Input
                        placeholder="Buscar aplicações..."
                        className="bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-slate-600 font-medium h-10"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500/20" />
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sincronizando Módulos...</p>
                </div>
            ) : error ? (
                <div className="text-center py-32 text-rose-500 font-bold uppercase tracking-widest text-[10px] border border-rose-500/10 rounded-3xl bg-rose-500/5">{error}</div>
            ) : apps.length === 0 ? (
                <div className="text-center py-32 border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
                    <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8">
                        <Cpu className="w-10 h-10 text-slate-700" />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Vazio Absoluto</h3>
                    <p className="text-slate-500 font-medium mb-10 max-w-xs mx-auto">Nenhuma aplicação está sob a governança deste kernel no momento.</p>
                    <Button className="h-12 px-8 rounded-xl bg-white text-black hover:bg-slate-200 font-black uppercase tracking-widest text-[10px]" onClick={() => setIsModalOpen(true)}>Implantar Primeiro App</Button>
                </div>
            ) : (
                <div className="rounded-[32px] border border-white/5 bg-white/[0.01] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Aplicação</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Kernel ID</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Deploy</th>
                                    <th className="px-8 py-6 w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {apps.map((app, idx) => (
                                    <motion.tr
                                        key={app.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="hover:bg-white/[0.02] transition-colors group"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-lg group-hover:scale-110 transition-transform">
                                                    {app.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-white font-bold tracking-tight">{app.name}</div>
                                                    <div className="text-xs text-slate-500 font-medium">{app.description || "Sem descrição"}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 font-mono text-[10px] text-indigo-400/70">{app.id}</td>
                                        <td className="px-8 py-6">
                                            <span className={cn(
                                                "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                app.status === 'suspended' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            )}>
                                                <div className={cn("h-1.5 w-1.5 rounded-full mr-2", app.status === 'suspended' ? 'bg-rose-500 text-rose-500/50' : 'bg-emerald-500 text-emerald-500/50')} />
                                                {app.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-xs text-slate-500 font-medium">
                                            {new Date(app.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-600 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create App Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 40 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-lg bg-[#020617] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden p-8 space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Novo Componente</h2>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Registrar aplicação no Kernel</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-slate-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateApp} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Aplicação</label>
                                    <div className="relative group">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                                        <Input
                                            placeholder="Ex: Vision Engine v2"
                                            className="h-14 pl-12 bg-white/[0.02] border-white/5 focus:border-indigo-500/50 rounded-2xl text-white font-medium"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Slug do Identificador</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                                        <Input
                                            placeholder="vision-engine"
                                            className="h-14 pl-12 bg-white/[0.02] border-white/5 focus:border-emerald-500/50 rounded-2xl text-emerald-400 font-mono text-sm"
                                            value={newSlug}
                                            onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição Técnica</label>
                                    <textarea
                                        className="w-full h-32 bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors text-white font-medium resize-none placeholder:text-slate-700"
                                        placeholder="Breve descrição dos privilégios e escopo deste app..."
                                        value={newDesc}
                                        onChange={(e) => setNewDesc(e.target.value)}
                                    />
                                </div>

                                <div className="pt-6 grid grid-cols-2 gap-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                                        onClick={() => setIsModalOpen(false)}
                                        disabled={creating}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="h-14 rounded-2xl bg-white text-black hover:bg-slate-200 font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all active:scale-95"
                                        disabled={creating || !newName}
                                    >
                                        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Orquestrar App"}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
