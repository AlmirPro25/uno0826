"use client";

import { useEffect, useState } from "react";
import { Brain, Search, Sparkles, Clock, Trash2, Plus, Database, Lightbulb, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Memory = {
    id: string;
    content: string;
    summary?: string;
    importance: number;
    memory_type: string;
    context?: Record<string, any>;
    created_at: string;
    similarity?: number;
};

type MemoryStats = {
    total_memories: number;
    memories_today: number;
    avg_importance: number;
    storage_mb: number;
};

export default function VectorMemoryPage() {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [stats, setStats] = useState<MemoryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [storing, setStoring] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Memory[]>([]);
    const [showRecall, setShowRecall] = useState(false);

    const [newMemory, setNewMemory] = useState({
        content: "",
        importance: 0.5,
        memory_type: "observation"
    });
    const [showStore, setShowStore] = useState(false);

    const fetchMemories = async () => {
        try {
            const res = await api.get("/v3/memory/list").catch(() => null);
            if (res?.data) {
                setMemories(res.data.memories || []);
                setStats(res.data.stats || null);
            }
        } catch (error) {
            console.error("Failed to fetch memories", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMemories();
    }, []);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        setShowRecall(true);
        try {
            const res = await api.post("/v3/memory/recall", {
                query: searchQuery,
                limit: 10,
                min_similarity: 0.5
            });
            setSearchResults(res.data.memories || []);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setSearching(false);
        }
    };

    const handleStore = async () => {
        if (!newMemory.content.trim()) return;
        setStoring(true);
        try {
            await api.post("/v3/memory/store", newMemory);
            setNewMemory({ content: "", importance: 0.5, memory_type: "observation" });
            setShowStore(false);
            fetchMemories();
        } catch (error) {
            console.error("Store failed", error);
        } finally {
            setStoring(false);
        }
    };

    const getImportanceColor = (importance: number) => {
        if (importance >= 0.8) return "text-red-500 bg-red-500/10 border-red-500/20";
        if (importance >= 0.5) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "decision": return "text-purple-500 bg-purple-500/10";
            case "insight": return "text-blue-500 bg-blue-500/10";
            case "observation": return "text-zinc-400 bg-zinc-500/10";
            case "preference": return "text-pink-500 bg-pink-500/10";
            default: return "text-zinc-500 bg-zinc-500/10";
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-purple-500/50 text-xs font-mono animate-pulse uppercase tracking-widest flex items-center gap-3">
                <Brain className="w-5 h-5 animate-pulse" />
                Synchronizing with Vector Memory Layer...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-purple-500 tracking-tighter uppercase">
                        Vector Memory
                    </h1>
                    <p className="text-muted-foreground text-[10px] font-mono mt-1 flex items-center gap-2">
                        <Brain className="w-3 h-3 text-purple-500" />
                        SEMANTIC_SEARCH_v3.0 // EMBEDDINGS: ACTIVE // MEMORIES: {memories.length}
                    </p>
                </div>
                <button
                    onClick={() => setShowStore(!showStore)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 hover:bg-purple-500/20 transition-colors text-xs font-bold uppercase tracking-widest"
                >
                    <Plus className="w-4 h-4" />
                    Store Memory
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { title: "Total Memories", value: stats?.total_memories || memories.length, icon: Database, color: "text-purple-500", bg: "bg-purple-500/10" },
                    { title: "Today", value: stats?.memories_today || 0, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { title: "Avg Importance", value: `${((stats?.avg_importance || 0) * 100).toFixed(0)}%`, icon: Sparkles, color: "text-amber-500", bg: "bg-amber-500/10" },
                    { title: "Storage", value: `${(stats?.storage_mb || 0).toFixed(1)} MB`, icon: Brain, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                ].map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 rounded-2xl border border-white/5 bg-zinc-900/20 backdrop-blur-md"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{stat.title}</span>
                                <div className="text-2xl font-black text-white">{stat.value}</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Store Form */}
            <AnimatePresence>
                {showStore && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 rounded-2xl border border-purple-500/20 bg-purple-500/5 space-y-4">
                            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-purple-500" />
                                Store New Memory (with Embeddings)
                            </h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                        Memory Content
                                    </label>
                                    <textarea
                                        value={newMemory.content}
                                        onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                                        placeholder="O cliente preferiu negociações em Bitcoin. Importante lembrar para propostas futuras..."
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:border-purple-500/50 focus:outline-none transition-colors resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                            Importance ({(newMemory.importance * 100).toFixed(0)}%)
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={newMemory.importance}
                                            onChange={(e) => setNewMemory({ ...newMemory, importance: parseFloat(e.target.value) })}
                                            className="w-full accent-purple-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                            Type
                                        </label>
                                        <select
                                            value={newMemory.memory_type}
                                            onChange={(e) => setNewMemory({ ...newMemory, memory_type: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:border-purple-500/50 focus:outline-none transition-colors"
                                        >
                                            <option value="observation">Observation</option>
                                            <option value="decision">Decision</option>
                                            <option value="insight">Insight</option>
                                            <option value="preference">Preference</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowStore(false)}
                                    className="px-4 py-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-colors text-xs font-bold uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleStore}
                                    disabled={storing || !newMemory.content}
                                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-purple-500 text-white hover:bg-purple-600 transition-colors text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {storing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                                    Store with Embedding
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Semantic Search */}
            <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/20 backdrop-blur-md">
                <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                    <Search className="w-4 h-4 text-purple-500" />
                    Semantic Recall (Vector Search)
                </h3>

                <div className="flex gap-3">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="Buscar memórias semanticamente... ex: 'preferências de pagamento do cliente'"
                        className="flex-1 px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:border-purple-500/50 focus:outline-none transition-colors"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={searching || !searchQuery}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 hover:bg-purple-500/20 transition-colors text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                    >
                        {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Recall
                    </button>
                </div>

                {/* Search Results */}
                <AnimatePresence>
                    {showRecall && searchResults.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-6 space-y-3"
                        >
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                {searchResults.length} memories found (sorted by similarity)
                            </div>
                            {searchResults.map((mem, idx) => (
                                <div
                                    key={mem.id}
                                    className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/20 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <p className="text-white text-sm">{mem.content}</p>
                                            {mem.summary && (
                                                <p className="text-zinc-500 text-xs mt-1 italic">{mem.summary}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {mem.similarity && (
                                                <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-500 text-[10px] font-bold">
                                                    {(mem.similarity * 100).toFixed(0)}% match
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Recent Memories */}
            <div className="space-y-4">
                <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    Recent Memories
                </h3>

                {memories.length > 0 ? memories.slice(0, 10).map((mem, idx) => (
                    <motion.div
                        key={mem.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="p-4 rounded-2xl border border-white/5 bg-zinc-900/20 backdrop-blur-md hover:border-purple-500/20 transition-all group"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase", getTypeColor(mem.memory_type))}>
                                        {mem.memory_type}
                                    </span>
                                    <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold border", getImportanceColor(mem.importance))}>
                                        {(mem.importance * 100).toFixed(0)}% importance
                                    </span>
                                </div>
                                <p className="text-white text-sm">{mem.content}</p>
                                {mem.summary && (
                                    <p className="text-zinc-500 text-xs mt-2 italic">📝 {mem.summary}</p>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="text-[10px] text-zinc-600 font-mono">
                                    {new Date(mem.created_at).toLocaleDateString()}
                                </span>
                                <button className="p-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )) : (
                    <div className="p-12 rounded-2xl border border-dashed border-white/10 text-center">
                        <Brain className="w-12 h-12 mx-auto text-zinc-700 mb-4" />
                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">No memories stored</p>
                        <p className="text-zinc-600 text-xs mt-2">Store your first memory to enable semantic recall</p>
                    </div>
                )}
            </div>
        </div>
    );
}
