"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    LayoutGrid, AppWindow, Activity, AlertTriangle, Key, BarChart3,
    Zap, Ghost, Lock, Scale, Database, BookOpen, Brain, Cog, LogOut, Shield,
    Crown, Webhook
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
    monitor: [
        { href: "/dashboard/incidents", label: "Incidentes", icon: AlertTriangle },
        { href: "/dashboard/telemetry", label: "Telemetria", icon: BarChart3 },
        { href: "/dashboard/status", label: "Status", icon: Activity },
    ],
    connect: [
        { href: "/dashboard/webhooks", label: "Webhooks", icon: Webhook },
        { href: "/dashboard/apikeys", label: "API Keys", icon: Key },
    ],
    manage: [
        { href: "/dashboard/rules", label: "Regras", icon: Zap },
        { href: "/dashboard/shadow", label: "Shadow Mode", icon: Ghost },
        { href: "/dashboard/policies", label: "Políticas", icon: Lock },
    ],
    governance: [
        { href: "/dashboard/authority", label: "Autoridade", icon: Crown },
        { href: "/dashboard/decisions", label: "Decisões", icon: Scale },
        { href: "/dashboard/memory", label: "Memória", icon: Database },
    ]
};

export function Sidebar() {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const { canManage } = useApp();
    const [devMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('devMode') === 'true';
    });

    const isSuperAdmin = devMode || user?.role === "super_admin";
    const isGlobalAdmin = devMode || user?.role === "admin" || isSuperAdmin;
    const effectiveCanManage = devMode || canManage;

    const NavItem = ({ item, isActive }: { item: any, isActive: boolean }) => (
        <Link
            href={item.href}
            className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
                isActive
                    ? "bg-white/[0.08] text-white shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset]"
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]"
            )}
        >
            <item.icon className={cn(
                "w-4 h-4 transition-colors",
                isActive ? "text-indigo-400" : "text-slate-600 group-hover:text-slate-400"
            )} />
            {item.label}
        </Link>
    );

    const SectionLabel = ({ label }: { label: string }) => (
        <div className="px-3 pt-5 pb-2">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none">
                {label}
            </p>
        </div>
    );

    return (
        <aside className="w-64 h-screen sticky top-0 flex flex-col bg-[#050505] border-r border-white/[0.08]">
            {/* Header */}
            <div className="h-14 flex items-center px-4 border-b border-white/[0.05]">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-indigo-500/10 rounded-lg border border-indigo-500/20 flex items-center justify-center shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]">
                        <Shield className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <span className="block text-sm font-bold text-white tracking-tight leading-none">
                            ProstQS<span className="text-zinc-500">.KERNEL</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* App Switcher Area */}
            <div className="p-3 border-b border-white/[0.05]">
                <AppSwitcher />
            </div>

            {/* Scrollable Nav */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 custom-scrollbar">

                <SectionLabel label="Plataforma" />
                {SECTIONS.core.map(item => (
                    <NavItem key={item.href} item={item} isActive={pathname === item.href} />
                ))}

                <SectionLabel label="Monitoramento" />
                {SECTIONS.monitor.map(item => (
                    <NavItem key={item.href} item={item} isActive={pathname === item.href} />
                ))}

                {effectiveCanManage && (
                    <>
                        <SectionLabel label="Gerenciamento" />
                        {SECTIONS.manage.map(item => (
                            <NavItem key={item.href} item={item} isActive={pathname === item.href} />
                        ))}
                    </>
                )}

                {isGlobalAdmin && (
                    <>
                        <SectionLabel label="Governança" />
                        {SECTIONS.governance.map(item => (
                            <NavItem key={item.href} item={item} isActive={pathname.startsWith(item.href)} />
                        ))}
                    </>
                )}

                {/* Extra Links */}
                <SectionLabel label="Inteligência" />
                <NavItem
                    item={{ href: "/dashboard/ai", label: "AI Hub", icon: Brain }}
                    isActive={pathname === "/dashboard/ai"}
                />

                <SectionLabel label="Recursos" />
                <NavItem
                    item={{ href: "/docs", label: "Documentação", icon: BookOpen }}
                    isActive={pathname.startsWith("/docs")}
                />
                <NavItem
                    item={{ href: "/dashboard/settings", label: "Configurações", icon: Cog }}
                    isActive={pathname === "/dashboard/settings"}
                />
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-white/[0.05] bg-[#050505]">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors group"
                >
                    <LogOut className="w-3.5 h-3.5 group-hover:stroke-red-400" />
                    Encerrar Sessão
                </button>
            </div>
        </aside>
    );
}
