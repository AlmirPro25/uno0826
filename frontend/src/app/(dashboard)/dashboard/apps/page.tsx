"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal, Loader2, X, Globe, Lock, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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

    // Create App Form State
    const [newName, setNewName] = useState("");
    const [newSlug, setNewSlug] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [creating, setCreating] = useState(false);

    const fetchApps = async () => {
        try {
            const res = await api.get("/apps/mine");
            setApps(res.data.apps || []);
        } catch (err) {
            setError("Failed to load applications.");
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
            toast.success("Application created successfully!");
            setIsModalOpen(false);
            setNewName("");
            setNewSlug("");
            setNewDesc("");
            fetchApps();
        } catch (err: any) {
            const msg = err.response?.data?.error || "Failed to create application.";
            if (err.response?.status === 403) {
                toast.error("Pro subscription required to create apps.", {
                    description: "Please check your billing settings."
                });
            } else {
                toast.error(msg);
            }
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
                    <p className="text-muted-foreground mt-1">Manage all your registered applications and API keys.</p>
                </div>
                <Button className="shrink-0" onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Create New App
                </Button>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-4 bg-card p-2 rounded-lg border border-border shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search applications..."
                        className="pl-9 bg-background border-none focus-visible:ring-0"
                    />
                </div>
            </div>

            {/* App Grid/Table */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : error ? (
                <div className="text-center py-20 text-destructive">{error}</div>
            ) : apps.length === 0 ? (
                <div className="text-center py-20 border border-dashed rounded-xl">
                    <h3 className="text-lg font-medium">No applications found</h3>
                    <p className="text-muted-foreground mb-4">Get started by creating your first app.</p>
                    <Button onClick={() => setIsModalOpen(true)}>Create App</Button>
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground font-medium border-b border-border">
                            <tr>
                                <th className="px-6 py-3">Application Name</th>
                                <th className="px-6 py-3">App ID</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Created At</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {apps.map((app) => (
                                <motion.tr
                                    key={app.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-muted/30 transition-colors group"
                                >
                                    <td className="px-6 py-4 font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {app.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                {app.name}
                                                <div className="text-xs text-muted-foreground font-normal">{app.description || "No description"}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{app.id}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${app.status === 'suspended' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                            {app.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {new Date(app.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
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
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-800/50">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-primary" /> Create New Application
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateApp} className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Application Name</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                                        <Input
                                            placeholder="My Awesome App"
                                            className="pl-10 bg-black/50 border-white/10 focus:border-primary"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Slug (Optional)</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                                        <Input
                                            placeholder="my-awesome-app"
                                            className="pl-10 bg-black/50 border-white/10 focus:border-primary font-mono text-sm"
                                            value={newSlug}
                                            onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                        />
                                    </div>
                                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Unique identifier for API access</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Description</label>
                                    <textarea
                                        className="w-full h-24 bg-black/50 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-primary transition-colors text-white"
                                        placeholder="What does this app do?"
                                        value={newDesc}
                                        onChange={(e) => setNewDesc(e.target.value)}
                                    />
                                </div>

                                <div className="pt-4 flex items-center gap-3">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="flex-1"
                                        onClick={() => setIsModalOpen(false)}
                                        disabled={creating}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                                        disabled={creating || !newName}
                                    >
                                        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Application"}
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
