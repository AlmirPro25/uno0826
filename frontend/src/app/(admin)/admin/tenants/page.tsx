"use client";

import { useEffect, useState } from "react";
import { Building2, Key, Users, Activity, Plus, Copy, Check, Trash2, RefreshCw, Shield, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Tenant = {
    id: string;
    name: string;
    slug: string;
    owner_email: string;
    tier: string;
    status: string;
    api_key_preview: string;
    config: {
        max_users: number;
        max_api_calls_per_day: number;
        features: string[];
    };
    usage: {
        current_users: number;
        api_calls_today: number;
    };
    created_at: string;
};

type CreateTenantForm = {
    name: string;
    slug: string;
    owner_email: string;
    tier: string;
};

export default function AdminTenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [form, setForm] = useState<CreateTenantForm>({
        name: "",
        slug: "",
        owner_email: "",
        tier: "starter"
    });

    const fetchTenants = async () => {
        try {
            const res = await api.get("/admin/tenants");
            setTenants(res.data || []);
        } catch (error) {
            console.error("Failed to fetch tenants", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const handleCreate = async () => {
        if (!form.name || !form.slug || !form.owner_email) return;
        setCreating(true);
        try {
            await api.post("/admin/tenants", form);
            setShowForm(false);
            setForm({ name: "", slug: "", owner_email: "", tier: "starter" });
            fetchTenants();
        } catch (error) {
            console.error("Failed to create tenant", error);
        } finally {
            setCreating(false);
        }
    };

    const copyApiKey = (tenantId: string, key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(tenantId);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const getTierColor = (tier: string) => {
        switch (tier) {
            case "enterprise": return "text-purple-500 bg-purple-500/10 border-purple-500/20";
            case "professional": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
            case "starter": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
            default: return "text-zinc-500 bg-zinc-500/10 border-zinc-500/20";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "text-emerald-500 bg-emerald-500/10";
            case "suspended": return "text-red-500 bg-red-500/10";
            case "pending": return "text-amber-500 bg-amber-500/10";
            default: return "text-zinc-500 bg-zinc-500/10";
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-red-500/50 text-xs font-mono animate-pulse uppercase tracking-widest">
                Loading Enterprise Tenants...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-purple-500 tracking-tighter uppercase">
                        Enterprise Tenants
                    </h1>
                    <p className="text-muted-foreground text-[10px] font-mono mt-1 flex items-center gap-2">
                        <Building2 className="w-3 h-3 text-purple-500" />
                        MULTI_TENANCY_v3.0 // TOTAL: {tenants.length} ORGANIZATIONS
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 hover:bg-purple-500/20 transition-colors text-xs font-bold uppercase tracking-widest"
                >
                    <Plus className="w-4 h-4" />
                    New Tenant
                </button>
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
                        <div className="p-6 rounded-2xl border border-purple-500/20 bg-purple-500/5 space-y-4">
                            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                                <Shield className="w-4 h-4 text-purple-500" />
                                Create New Tenant Organization
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                        Organization Name
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Acme Corporation"
                                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:border-purple-500/50 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                        Slug (URL)
                                    </label>
                                    <input
                                        type="text"
                                        value={form.slug}
                                        onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                                        placeholder="acme-corp"
                                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:border-purple-500/50 focus:outline-none transition-colors font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                        Owner Email
                                    </label>
                                    <input
                                        type="email"
                                        value={form.owner_email}
                                        onChange={(e) => setForm({ ...form, owner_email: e.target.value })}
                                        placeholder="admin@acme.com"
                                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:border-purple-500/50 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                        Tier
                                    </label>
                                    <select
                                        value={form.tier}
                                        onChange={(e) => setForm({ ...form, tier: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:border-purple-500/50 focus:outline-none transition-colors"
                                    >
                                        <option value="starter">Starter</option>
                                        <option value="professional">Professional</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-colors text-xs font-bold uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={creating || !form.name || !form.slug || !form.owner_email}
                                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-purple-500 text-white hover:bg-purple-600 transition-colors text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Create Tenant
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { title: "Total Tenants", value: tenants.length, icon: Building2, color: "text-purple-500", bg: "bg-purple-500/10" },
                    { title: "Active", value: tenants.filter(t => t.status === "active").length, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { title: "Enterprise", value: tenants.filter(t => t.tier === "enterprise").length, icon: Shield, color: "text-amber-500", bg: "bg-amber-500/10" },
                    { title: "Suspended", value: tenants.filter(t => t.status === "suspended").length, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
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

            {/* Tenants List */}
            <div className="space-y-4">
                {tenants.length > 0 ? tenants.map((tenant, idx) => (
                    <motion.div
                        key={tenant.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-6 rounded-2xl border border-white/5 bg-zinc-900/20 backdrop-blur-md hover:border-purple-500/20 transition-all group"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-black text-white">{tenant.name}</h3>
                                        <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border", getTierColor(tenant.tier))}>
                                            {tenant.tier}
                                        </span>
                                        <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest", getStatusColor(tenant.status))}>
                                            {tenant.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-mono">
                                        <span>SLUG: {tenant.slug}</span>
                                        <span>OWNER: {tenant.owner_email}</span>
                                        <span>CREATED: {new Date(tenant.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => copyApiKey(tenant.id, tenant.api_key_preview)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-colors text-[10px] font-mono"
                                >
                                    <Key className="w-3 h-3" />
                                    {tenant.api_key_preview}
                                    {copiedKey === tenant.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                </button>
                            </div>
                        </div>

                        {/* Usage Stats */}
                        <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Users</span>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-zinc-600" />
                                    <span className="text-lg font-black text-white">
                                        {tenant.usage?.current_users || 0}
                                        <span className="text-zinc-600 text-xs font-normal"> / {tenant.config?.max_users || "∞"}</span>
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">API Calls Today</span>
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-zinc-600" />
                                    <span className="text-lg font-black text-white">
                                        {tenant.usage?.api_calls_today?.toLocaleString() || 0}
                                        <span className="text-zinc-600 text-xs font-normal"> / {tenant.config?.max_api_calls_per_day?.toLocaleString() || "∞"}</span>
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Features</span>
                                <div className="flex flex-wrap gap-1">
                                    {(tenant.config?.features || ["core"]).slice(0, 3).map((feat, i) => (
                                        <span key={i} className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-bold text-zinc-400 uppercase">
                                            {feat}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-end justify-end">
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100">
                                    <Trash2 className="w-3 h-3" />
                                    Suspend
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )) : (
                    <div className="p-12 rounded-2xl border border-dashed border-white/10 text-center">
                        <Building2 className="w-12 h-12 mx-auto text-zinc-700 mb-4" />
                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">No tenants configured</p>
                        <p className="text-zinc-600 text-xs mt-2">Create your first enterprise tenant to enable multi-tenancy</p>
                    </div>
                )}
            </div>
        </div>
    );
}
