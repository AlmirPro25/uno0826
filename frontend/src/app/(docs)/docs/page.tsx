"use client";

import Link from "next/link";
import { ArrowRight, Zap, Shield, Box, Activity, BookOpen, Layers, Terminal } from "lucide-react";
import { motion } from "framer-motion";
import { ArchitectureDiagram } from "@/components/docs/architecture-diagram";

const features = [
    {
        icon: Shield,
        title: "Identidade Soberana",
        description: "Cada app e agente tem uma identidade criptográfica única.",
        color: "emerald"
    },
    {
        icon: Activity,
        title: "Audit Trail",
        description: "Logs imutáveis de cada decisão e evento do sistema.",
        color: "blue"
    },
    {
        icon: Zap,
        title: "Billing Integrado",
        description: "Cobrança automática baseada em eventos e uso.",
        color: "amber"
    }
];

const quickLinks = [
    {
        href: "/docs/quickstart",
        title: "Quickstart",
        description: "Integre o PROST-QS em 5 minutos.",
        icon: Zap,
        color: "indigo"
    },
    {
        href: "/docs/api/v1",
        title: "API Reference",
        description: "Endpoints REST e modelos de dados.",
        icon: Box,
        color: "emerald"
    },
    {
        href: "/docs/concepts/events",
        title: "Arquitetura de Eventos",
        description: "Como funciona o barramento de eventos.",
        icon: Activity,
        color: "blue"
    },
    {
        href: "/docs/concepts/identity",
        title: "Modelagem de Identidade",
        description: "Autenticação e autorização soberana.",
        icon: Shield,
        color: "amber"
    }
];

export default function DocsPage() {
    return (
        <div className="space-y-16 pb-20">
            {/* Hero */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-2 w-fit">
                        <Terminal className="w-3 h-3 text-indigo-400" />
                        <span className="text-indigo-400 font-bold text-xs tracking-widest uppercase">Developer Hub</span>
                    </div>
                </div>

                <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter uppercase leading-[0.9]">
                    PROST-QS <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">KERNEL</span>
                </h1>

                <p className="text-xl md:text-2xl text-slate-400 max-w-3xl leading-relaxed">
                    O sistema operacional para a próxima geração de aplicações inteligentes.
                    Governança, identidade e billing em uma única API.
                </p>

                <div className="flex gap-4 pt-4">
                    <Link href="/docs/quickstart">
                        <button className="bg-white text-black hover:bg-slate-200 font-bold py-3 px-8 rounded-xl transition-all flex items-center gap-2 text-sm uppercase tracking-widest">
                            Quickstart <ArrowRight className="w-4 h-4" />
                        </button>
                    </Link>
                    <Link href="/docs/api/v1">
                        <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold py-3 px-8 rounded-xl transition-all flex items-center gap-2 text-sm uppercase tracking-widest">
                            API Reference
                        </button>
                    </Link>
                </div>
            </motion.div>

            {/* Architecture Section - The "Giant Taming" Visual */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Layers className="w-5 h-5 text-slate-500" />
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Arquitetura Soberana</h2>
                </div>

                <ArchitectureDiagram />

                <div className="grid md:grid-cols-2 gap-8 mt-8">
                    <div className="prose prose-invert prose-sm text-slate-400">
                        <p>
                            O UNO Kernel atua como um <strong>Interceptador Inteligente</strong>. Nenhuma requisição
                            externa toca sua infraestrutura sem passar pela validação de identidade e governança.
                        </p>
                    </div>
                    <div className="prose prose-invert prose-sm text-slate-400">
                        <p>
                            Isso permite que você troque provedores (Stripe, OpenAI) sem quebrar seus clientes,
                            e aplique regras de negócio globais (Rate Limiting, Billing) em um único ponto.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            >
                {quickLinks.map((link, i) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="group"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                            className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-indigo-500/5 hover:border-indigo-500/20 transition-all h-full"
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${link.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400' :
                                    link.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
                                        link.color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                                            'bg-amber-500/10 text-amber-400'
                                }`}>
                                <link.icon className="w-5 h-5" />
                            </div>

                            <h3 className="font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                                {link.title}
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">{link.description}</p>
                        </motion.div>
                    </Link>
                ))}
            </motion.div>

            {/* Core Concepts */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-6 pt-8 border-t border-white/5"
            >
                <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-slate-500" />
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Core Concepts</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.05 }}
                            className="p-6 rounded-2xl bg-white/[0.02] border border-white/5"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <feature.icon className={`w-5 h-5 ${feature.color === 'emerald' ? 'text-emerald-400' :
                                        feature.color === 'blue' ? 'text-blue-400' :
                                            'text-amber-400'
                                    }`} />
                                <h3 className="font-bold text-white text-sm uppercase tracking-wider">{feature.title}</h3>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
