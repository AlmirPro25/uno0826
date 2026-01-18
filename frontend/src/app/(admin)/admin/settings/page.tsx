"use client";

import { useState } from "react";
import { Settings, Shield, Key, Bell, Globe, Save, Sliders, Cpu, Zap, Lock, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(false);

    const handleSave = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.success("Kernel configurations synchronized.");
        }, 1500);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-900/20 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-white">
                        Kernel <span className="text-red-500">Settings</span>
                    </h1>
                    <p className="text-zinc-500 mt-2 font-mono text-[10px] uppercase tracking-[0.3em]">Platform Configuration & Sovereign Parameters</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest px-8 rounded-xl shadow-lg shadow-red-600/20 h-10"
                >
                    {loading ? <Zap className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Commit Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-2">
                    {[
                        { id: 'general', label: 'General Infrastructure', icon: Globe },
                        { id: 'security', label: 'Security & Auth', icon: Shield },
                        { id: 'ai', label: 'Cognitive Engine', icon: Cpu },
                        { id: 'api', label: 'API & Integrations', icon: Key },
                        { id: 'notifications', label: 'Global Alerts', icon: Bell }
                    ].map((tab, idx) => (
                        <button
                            key={tab.id}
                            className={idx === 0
                                ? "w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 font-black text-[10px] uppercase tracking-widest transition-all"
                                : "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-white/5 font-black text-[10px] uppercase tracking-widest transition-all"
                            }
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="lg:col-span-3 space-y-6">
                    <section className="p-8 rounded-[40px] border border-white/5 bg-zinc-900/20 space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <Sliders className="w-5 h-5 text-red-500" />
                            <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Platform Core Parameters</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Kernel Identification Name</label>
                                <Input
                                    defaultValue="PROST-QS KERNEL (ORACLE_NODE_01)"
                                    className="bg-black/40 border-white/10 text-white font-bold h-12 rounded-2xl focus:border-red-500/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">System Base URL</label>
                                <Input
                                    defaultValue="https://api.prostqs.com.br/api/v1"
                                    className="bg-black/40 border-white/10 text-white font-bold h-12 rounded-2xl focus:border-red-500/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 group hover:border-red-500/20 transition-all">
                                <div className="space-y-1">
                                    <h4 className="text-white font-bold text-sm uppercase tracking-tight">Maintenance Mode</h4>
                                    <p className="text-[10px] text-zinc-500 font-medium">Bypass all requests to a static status page.</p>
                                </div>
                                <div className="h-6 w-12 rounded-full bg-zinc-800 p-1 cursor-pointer">
                                    <div className="h-4 w-4 rounded-full bg-zinc-600" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 group hover:border-red-500/20 transition-all">
                                <div className="space-y-1">
                                    <h4 className="text-white font-bold text-sm uppercase tracking-tight">Strict Invariant Enforcement</h4>
                                    <p className="text-[10px] text-zinc-500 font-medium">Auto-kill sessions on invariant violation detection.</p>
                                </div>
                                <div className="h-6 w-12 rounded-full bg-emerald-500/20 p-1 cursor-pointer border border-emerald-500/30">
                                    <div className="h-4 w-4 rounded-full bg-emerald-500 ml-auto shadow-[0_0_8px_#10b981]" />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="p-8 rounded-[40px] border border-red-500/20 bg-red-500/5 space-y-6 relative overflow-hidden">
                        <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5 text-red-500" />
                            <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Danger Cluster</h2>
                        </div>
                        <p className="text-zinc-500 text-[10px] font-mono leading-relaxed max-w-xl uppercase tracking-tighter">
                            Actions within this block are high-impact. Any change will trigger a system-wide audit event and notify all Kernel Administrators via emergency channels.
                        </p>

                        <div className="pt-4 flex gap-4 text-white">
                            <Button variant="ghost" className="text-red-500 hover:bg-red-500/10 font-black text-[9px] uppercase tracking-widest border border-red-500/20 rounded-xl px-6">
                                Flush System Cache
                            </Button>
                            <Button variant="ghost" className="text-zinc-400 hover:bg-white/5 font-black text-[9px] uppercase tracking-widest border border-white/10 rounded-xl px-6">
                                Regenerate Root Keys
                            </Button>
                        </div>

                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Terminal className="w-32 h-32 text-red-500" />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
