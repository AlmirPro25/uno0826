"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Activity, CreditCard, HardDrive, Users, ArrowUpRight, Zap, Shield, Cpu, Box } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        apps: 0,
        events: 0,
        storage: "0 GB"
    });

    useEffect(() => {
        async function loadData() {
            if (!user?.id) return;

            try {
                const appsRes = await api.get("/apps/mine?limit=1");
                let eventsCount = 0;
                try {
                    const eventsRes = await api.get(`/events/${user.id}?limit=1`);
                    eventsCount = eventsRes.data.length || 0;
                } catch (e) {
                    console.log("Events API not ready yet for stats");
                }

                setStats({
                    apps: appsRes.data.total || 0,
                    events: eventsCount,
                    storage: "1.2 GB"
                });

            } catch (e) {
                console.error("Failed to load dashboard stats", e);
            }
        }
        loadData();
    }, [user]);

    const cards = [
        {
            title: "Eventos Processados",
            value: stats.events.toLocaleString(),
            change: "+12.5%",
            trend: "up",
            icon: Activity,
            color: "text-indigo-400",
            bg: "bg-indigo-500/10",
        },
        {
            title: "Aplicações Ativas",
            value: stats.apps.toString(),
            change: "+0%",
            trend: "neutral",
            icon: Box,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
        },
        {
            title: "Consumo de Dados",
            value: stats.storage,
            change: "Otimizado",
            trend: "up",
            icon: Cpu,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
        },
        {
            title: "Token Balance",
            value: "∞",
            change: "Unlimited",
            trend: "neutral",
            icon: Zap,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
        },
    ];

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                        VISTAS DO <span className="text-indigo-500">KERNEL</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">
                        Saudações, <span className="text-white font-bold">{user?.name || "Operador"}</span>. Seus sistemas estão operacionais.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl px-6">
                        Configurar SDK
                    </Button>
                    <Button className="bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl px-6 shadow-lg shadow-indigo-600/20">
                        <Zap className="w-4 h-4 mr-2" />
                        Novo App
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((card, i) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative overflow-hidden p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>
                                <card.icon className="w-6 h-6" />
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${card.trend === "up" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"} uppercase`}>
                                {card.change}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">
                                {card.title}
                            </p>
                            <h3 className="text-3xl font-black text-white">{card.value}</h3>
                        </div>

                        {/* Decorative line */}
                        <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-500 w-0 group-hover:w-full opacity-50" />
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                <div className="col-span-1 md:col-span-4 p-8 rounded-3xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Fluxo de Ingestão</h3>
                            <p className="text-xs text-slate-500">Métrica de eventos em tempo real</p>
                        </div>
                        <div className="flex gap-2">
                            {['1H', '24H', '7D'].map(t => (
                                <button key={t} className={`px-3 py-1 text-[10px] font-bold rounded-lg ${t === '24H' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[240px] flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                        <div className="text-center group cursor-pointer">
                            <Activity className="w-12 h-12 text-indigo-500/20 mb-3 mx-auto group-hover:scale-110 group-hover:text-indigo-500/40 transition-all" />
                            <p className="text-slate-500 text-xs font-medium">Aguardando telemetria ativa do Kernel...</p>
                        </div>
                    </div>

                    {/* Background glow */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/5 blur-[100px] rounded-full" />
                </div>

                <div className="col-span-1 md:col-span-3 p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Logs de Eventos</h3>
                    </div>
                    <div className="space-y-6">
                        {[
                            { name: "identity.auth.success", time: "2s atrás", status: "ok" },
                            { name: "billing.event.ingested", time: "15s atrás", status: "ok" },
                            { name: "kernel.governance.check", time: "1m atrás", status: "warn" },
                            { name: "app.provision.complete", time: "5m atrás", status: "ok" },
                        ].map((log, i) => (
                            <div key={i} className="flex items-center gap-4 group cursor-default">
                                <div className={`w-1 h-8 rounded-full ${log.status === 'ok' ? 'bg-emerald-500/40' : 'bg-amber-500/40'} group-hover:h-10 transition-all`} />
                                <div className="flex-1">
                                    <div className="text-[13px] font-bold text-slate-200 font-mono tracking-tight">{log.name}</div>
                                    <div className="text-[10px] text-slate-500 uppercase font-black">{log.time} • via PROST.ENV</div>
                                </div>
                                <ArrowUpRight className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </div>
                    <Button variant="ghost" className="w-full mt-8 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/5">
                        Ver todos os logs
                    </Button>
                </div>
            </div>
        </div>
    );
}
