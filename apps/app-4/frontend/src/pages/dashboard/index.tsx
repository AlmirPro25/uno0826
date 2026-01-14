import { useEffect, useState } from "react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/shadcn/Card";
import { Button } from "@/components/ui/shadcn/Button";
import { motion } from "framer-motion";
import { Calendar, FileText, Users, PlusCircle, ArrowRight, Activity, Clock, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import Head from "next/head";

export default function DashboardPage() {
    const { user, role } = useAuthStore();
    const roleString = typeof role === 'object' && role !== null ? (role as any).name : role;

    // Greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Bom dia";
        if (hour < 18) return "Boa tarde";
        return "Boa noite";
    };

    const dashboardItems = [
        {
            title: "Meus Agendamentos",
            description: "Visualize seus próximos compromissos",
            icon: Calendar,
            href: "/paciente/my-appointments",
            roles: ["PACIENTE"],
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            title: "Agendar Consulta",
            description: "Marque um novo atendimento",
            icon: PlusCircle,
            href: "/paciente/book-appointment",
            roles: ["PACIENTE"],
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
        },
        {
            title: "Histórico Médico",
            description: "Seus registros e diagnósticos passados",
            icon: FileText,
            href: "/paciente/medical-history",
            roles: ["PACIENTE"],
            color: "text-violet-500",
            bg: "bg-violet-500/10",
        },
        // Medico items
        {
            title: "Sala de Espera",
            description: "Gerenciar fila de pacientes",
            icon: Users,
            href: "/medico/waiting-room",
            roles: ["MEDICO"],
            color: "text-amber-500",
            bg: "bg-amber-500/10",
        },
        {
            title: "Minha Agenda",
            description: "Controle seus horários de atendimento",
            icon: Calendar,
            href: "/medico/dashboard",
            roles: ["MEDICO"],
            color: "text-rose-500",
            bg: "bg-rose-500/10",
        },
        // Admin items
        {
            title: "Gerenciar Usuários",
            description: "Administração do sistema",
            icon: ShieldCheck,
            href: "/admin/dashboard",
            roles: ["ADMIN"],
            color: "text-slate-500",
            bg: "bg-slate-500/10",
        },
    ];

    const filteredItems = dashboardItems.filter(item => item.roles.includes(roleString || "PACIENTE"));

    return (
        <div className="space-y-8 animate-in-fade pb-10">
            <Head>
                <title>Dashboard - MediSync</title>
            </Head>

            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 via-primary to-blue-600 shadow-2xl shadow-primary/20">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-2xl -ml-20 -mb-20 pointer-events-none" />

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-sm font-medium backdrop-blur-md border border-white/10 mb-2"
                        >
                            <Sparkles size={14} className="text-yellow-300" />
                            <span>MediSync Pro</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl md:text-5xl font-bold text-white tracking-tight"
                        >
                            {getGreeting()}, {user?.fullName?.split(' ')[0] || "Visitante"}!
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-blue-100 text-lg max-w-xl leading-relaxed"
                        >
                            Acompanhe sua saúde e gerencie seus agendamentos com facilidade e segurança. Estamos aqui para cuidar de você.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="hidden md:block"
                    >
                        <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl rotate-3 transform hover:rotate-6 transition-transform hover:scale-105 cursor-pointer group">
                            <Activity size={48} className="text-white group-hover:scale-110 transition-transform" />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Quick Stats / Info Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card p-4 rounded-xl flex items-center gap-4 hover:border-primary/30 transition-colors"
                >
                    <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
                        <Clock size={20} />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Próxima Consulta</p>
                        <p className="font-semibold text-foreground">Nenhuma agendada</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card p-4 rounded-xl flex items-center gap-4 hover:border-primary/30 transition-colors"
                >
                    <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                        <Activity size={20} />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Status do Sistema</p>
                        <p className="font-semibold text-foreground flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Operacional
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass-card p-4 rounded-xl flex items-center gap-4 hover:border-primary/30 transition-colors"
                >
                    <div className="p-3 rounded-full bg-violet-500/10 text-violet-500">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Segurança</p>
                        <p className="font-semibold text-foreground">Criptografia Ativa</p>
                    </div>
                </motion.div>
            </div>

            {/* Navigation Grid */}
            <div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="bg-primary/20 p-1.5 rounded-lg text-primary"><Activity size={18} /></span>
                    Acesso Rápido
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <motion.div
                                    key={item.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + (index * 0.1) }}
                                >
                                    <Link href={item.href} legacyBehavior>
                                        <a className="block group h-full">
                                            <div className="glass-card h-full p-6 rounded-2xl border-white/5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden">
                                                <div className={`absolute top-0 right-0 p-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity ${item.bg.replace('/10', '/30')}`} />

                                                <div className="relative z-10 flex flex-col h-full">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${item.bg} ${item.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                                        <Icon size={24} strokeWidth={2.5} />
                                                    </div>

                                                    <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                                                        {item.title}
                                                    </h3>

                                                    <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                                                        {item.description}
                                                    </p>

                                                    <div className="flex items-center text-sm font-medium text-primary opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                        Acessar <ArrowRight size={16} className="ml-1" />
                                                    </div>
                                                </div>
                                            </div>
                                        </a>
                                    </Link>
                                </motion.div>
                            );
                        })
                    ) : (
                        // Fallback items if role filtering hides everything (e.g. not logged in)
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full py-12 text-center text-muted-foreground glass-card rounded-2xl"
                        >
                            <p>Faça login para ver suas opções personalizadas.</p>
                            <Link href="/auth/login" className="text-primary hover:underline mt-2 inline-block">
                                Ir para Login
                            </Link>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
