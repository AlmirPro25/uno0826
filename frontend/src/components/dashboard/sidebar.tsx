"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    LayoutGrid, AppWindow, Activity, AlertTriangle, Key, BarChart3,
    Zap, Ghost, Lock, Scale, Database, BookOpen, Brain, Cog, LogOut, Shield,
    Crown, Webhook, Bot, Workflow, ShieldCheck, History, FileText,
    DollarSign, CreditCard, PieChart, Users, Terminal
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useApp } from "@/contexts/app-context";
import { AppSwitcher } from "./app-switcher";

// --- Configuration ---
const SECTIONS = {
    core: [
        { href: "/dashboard", label: "Visão Geral", icon: LayoutGrid },
        { href: "/dashboard/apps", label: "Aplicações", icon: AppWindow },
        { href: "/dashboard/events", label: "Eventos", icon: Activity },
    ],
    intelligence: [
        { href: "/dashboard/ai", label: "Aurora Hub", icon: Sparkles },
        { href: "/dashboard/agents", label: "Agentes Autônomos", icon: Bot },
        { href: "/dashboard/autonomy", label: "Autonomia", icon: Workflow },
        { href: "/dashboard/admin/cognitive", label: "Nervos Cognitivos", icon: Brain },
    ],
    monitor: [
        { href: "/dashboard/incidents", label: "Incidentes", icon: AlertTriangle },
        { href: "/dashboard/telemetry", label: "Telemetria", icon: BarChart3 },
        { href: "/dashboard/status", label: "Saúde do Sistema", icon: ShieldCheck },
        { href: "/dashboard/audit", label: "Logs de Auditoria", icon: History },
    ],
    operations: [
        { href: "/dashboard/rules", label: "Regras de Execução", icon: Zap },
        { href: "/dashboard/webhooks", label: "Webhooks", icon: Webhook },
        { href: "/dashboard/apikeys", label: "API Keys", icon: Key },
        { href: "/dashboard/jobs", label: "Tarefas Agendadas", icon: Terminal },
    ],
    governance: [
        { href: "/dashboard/authority", label: "Autoridade Digital", icon: Crown },
        { href: "/dashboard/decisions", label: "Matriz de Decisão", icon: Scale },
        { href: "/dashboard/policies", label: "Políticas & Compliance", icon: Lock },
        { href: "/dashboard/killswitch", label: "Kill Switch", icon: Power },
        { href: "/dashboard/memory", label: "Memória do Núcleo", icon: Database },
    ],
    financial: [
        { href: "/dashboard/billing", label: "Faturamento", icon: DollarSign },
        { href: "/dashboard/payments", label: "Pagamentos", icon: CreditCard },
        { href: "/dashboard/admin/financial", label: "Gestão Financeira", icon: PieChart },
    ],
    admin: [
        { href: "/dashboard/admin", label: "Usuários & Acesso", icon: Users },
        { href: "/dashboard/settings", label: "Configurações", icon: Cog },
    ]
};

import { ModeToggle } from "@/components/mode-toggle";

import { ChevronLeft, ChevronRight, Power, Sparkles } from "lucide-react";

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const { canManage } = useApp();

    const [isCollapsed, setIsCollapsed] = useState(false);

    const [devMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('devMode') === 'true';
    });

    const isSuperAdmin = devMode || user?.role === "super_admin";
    const isGlobalAdmin = devMode || user?.role === "admin" || isSuperAdmin;
    const effectiveCanManage = devMode || canManage;

    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    const NavItem = ({ item, isActive }: { item: any, isActive: boolean }) => (
        <Link
            href={item.href}
            title={isCollapsed ? item.label : undefined}
            className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                isCollapsed && "justify-center px-2"
            )}
        >
            <item.icon className={cn(
                "flex-shrink-0 transition-colors",
                isCollapsed ? "w-5 h-5" : "w-4 h-4",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )} />

            {!isCollapsed && (
                <span className="truncate opacity-100 transition-opacity duration-200">
                    {item.label}
                </span>
            )}
        </Link>
    );

    const SectionLabel = ({ label }: { label: string }) => {
        if (isCollapsed) return <div className="h-4" />;
        return (
            <div className="px-3 pt-5 pb-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none truncate">
                    {label}
                </p>
            </div>
        );
    };

    return (
        <aside
            className={cn(
                "h-full flex-col bg-card border-r border-border transition-all duration-300 ease-in-out relative",
                isCollapsed ? "w-20" : "w-64",
                className
            )}
        >
            <button
                onClick={toggleCollapse}
                className="absolute -right-3 top-6 z-20 h-6 w-6 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm hidden md:flex"
            >
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>

            <div className={cn("h-14 flex items-center px-4 border-b border-border transition-all", isCollapsed ? "justify-center" : "justify-between")}>
                <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 flex-shrink-0 bg-primary/10 rounded-lg border border-primary/20 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-primary" />
                    </div>
                    {!isCollapsed && (
                        <div className="whitespace-nowrap transition-all duration-300">
                            <span className="block text-sm font-bold text-foreground tracking-tight leading-none">
                                ProstQS<span className="text-muted-foreground">.KERNEL</span>
                            </span>
                        </div>
                    )}
                </div>
                {!isCollapsed && <ModeToggle />}
            </div>

            {!isCollapsed && (
                <div className="p-3 border-b border-border">
                    <AppSwitcher />
                </div>
            )}

            <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-1 custom-scrollbar">

                <SectionLabel label="Plataforma" />
                {SECTIONS.core.map(item => (
                    <NavItem key={item.href} item={item} isActive={pathname === item.href} />
                ))}

                <SectionLabel label="Inteligência" />
                {SECTIONS.intelligence.map(item => (
                    <NavItem key={item.href} item={item} isActive={pathname === item.href} />
                ))}

                <SectionLabel label="Monitoramento" />
                {SECTIONS.monitor.map(item => (
                    <NavItem key={item.href} item={item} isActive={pathname === item.href} />
                ))}

                {effectiveCanManage && (
                    <>
                        <SectionLabel label="Operações" />
                        {SECTIONS.operations.map(item => (
                            <NavItem key={item.href} item={item} isActive={pathname === item.href} />
                        ))}
                    </>
                )}

                {isGlobalAdmin && (
                    <>
                        <SectionLabel label="Governança" />
                        {SECTIONS.governance.map(item => (
                            <NavItem key={item.href} item={item} isActive={pathname.startsWith(item.href) || pathname === item.href} />
                        ))}

                        <SectionLabel label="Financeiro" />
                        {SECTIONS.financial.map(item => (
                            <NavItem key={item.href} item={item} isActive={pathname.startsWith(item.href) || pathname === item.href} />
                        ))}

                        <SectionLabel label="Administração" />
                        {SECTIONS.admin.map(item => (
                            <NavItem key={item.href} item={item} isActive={pathname === item.href} />
                        ))}
                    </>
                )}

                <div className="h-8" />
            </nav>

            <div className="p-3 border-t border-border bg-card">
                <button
                    onClick={logout}
                    title={isCollapsed ? "Sair" : undefined}
                    className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors group",
                        isCollapsed && "justify-center"
                    )}
                >
                    <LogOut className="w-3.5 h-3.5 group-hover:stroke-destructive flex-shrink-0" />
                    {!isCollapsed && <span>Encerrar Sessão</span>}
                </button>
            </div>
        </aside>
    );
}

