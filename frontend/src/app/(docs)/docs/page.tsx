"use client";

import Link from "next/link";
import { ArrowRight, Zap, Shield, Box, Activity, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

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
        title: "Eventos",
        description: "Como funciona o sistema de eventos.",
        icon: Activity,
        color: "blue"
    },
    {
        href: "/docs/concepts/identity",
        title: "Identidade",
        description: "Autenticação e autorização soberana.",
        icon: Shield,
        color: "amber"
    }
];

export default function DocsPage() {
    return (
        <div className="space-y-12">
            {/* Hero */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
            >
                <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm tracking-widest uppercase">
                    <BookOpen className="w-4 h-4" />
                    Documentação
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
                    PROST-QS <span className="text-indigo-500">Docs</span>
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl">
                    Aprenda a governar o fluxo de inteligência nos seus sistemas. 
                    Auth, Events, Billing — tudo em um kernel soberano.
                </p>
            </motion.div>

            {/* Quick Links */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid gap-4 md:grid-cols-2"
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
                            className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all h-full"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                                    link.color === 'indigo' ? 'bg-indigo-500/20 text-indigo-400' :
                                    link.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                                    link.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-amber-500/20 text-amber-400'
                                }`}>
                                    <link.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">
                                        {link.title}
                                    </h3>
                                    <p className="text-sm text-slate-500">{link.description}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </motion.div>

            {/* What is PROST-QS */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
            >
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                    O que é o PROST-QS?
                </h2>
                <div className="prose prose-invert max-w-none">
                    <p className="text-slate-400 leading-relaxed">
                        PROST-QS é uma <strong className="text-white">Plataforma de Governança Cognitiva</strong>. 
                        Diferente de API gateways tradicionais que apenas fazem proxy de requests, 
                        o PROST-QS atua como um kernel soberano para a lógica da sua aplicação — 
                        aplicando regras, auditando decisões e gerenciando billing antes de qualquer código executar.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.05 }}
                            className="p-5 rounded-xl bg-white/[0.02] border border-white/5"
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                                feature.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                                feature.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-amber-500/20 text-amber-400'
                            }`}>
                                <feature.icon className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                            <p className="text-sm text-slate-500">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* CTA */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600/10 to-purple-600/5 border border-indigo-500/20"
            >
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                            Pronto para começar?
                        </h3>
                        <p className="text-slate-400">
                            Siga o quickstart e integre em 5 minutos.
                        </p>
                    </div>
                    <Link href="/docs/quickstart">
                        <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2">
                            Começar Agora <ArrowRight className="w-4 h-4" />
                        </button>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
