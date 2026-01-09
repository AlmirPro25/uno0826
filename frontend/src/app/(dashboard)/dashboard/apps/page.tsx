"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

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

    const fetchApps = async () => {
        try {
            const res = await api.get("/apps/mine");
            // Backend returns { apps: [...], total: N }
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

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
                    <p className="text-muted-foreground mt-1">Manage all your registered applications and API keys.</p>
                </div>
                <Button className="shrink-0">
                    <Plus className="w-4 h-4 mr-2" /> Create New App
                </Button>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-4 bg-card p-2 rounded-lg border border-border">
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
                    <Button>Create App</Button>
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
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                                            Active
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
        </div>
    );
}
