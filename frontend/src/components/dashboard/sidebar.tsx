"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutGrid,
    AppWindow,
    CreditCard,
    Settings,
    LogOut,
    Shield,
    BookOpen,
    Activity,
    Zap,
    BarChart3,
    Package,
    FileText,
    AlertTriangle,
    Key,
    Brain,
    DollarSign,
    Lock,
    Bot,
    UserCheck,
    Power,
    GitBranch,
    Webhook
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useApp } from "@/contexts/app-context";
import { AppSwitcher } from "./app-switcher";

// Items visíveis para todos os operadores de app
const coreItems = [
    { href: "/dashboard", label: "Visão Geral", icon: LayoutGrid },
    { href: "/dashboard/apps", label: "Aplicações", icon: AppWindow },
    { href: "/dashboard/events", label: "Eventos", icon: Activity },
    { href: "/dashboard/webhooks", label: "Webhooks", icon: Webhook },
    { href: "/dashboard/telemetry", label: "Telemetria", icon: BarChart3 },
];

// Items para quem pode gerenciar (owner/admin do app)
const manageItems = [
    { href: "/dashboard/rules", label: "Regras", icon: Zap },
    { href: "/dashboard/policies", label: "Políticas", icon: Lock },
    { href: "/dashboard/risk", label: "Risk Score", icon: AlertTriangle },
    { href: "/dashboard/capabilities", label: "Capacidades", icon: Package },
    { href: "/dashboard/audit", label: "Audit Log", icon: FileText },
];

// Items de billing (owner do app)
const billingItems = [
    { href: "/dashboard/billing", label: "Economia", icon: CreditCard },
];

// Items de governança (admin/super_admin global)
const governanceItems = [
    { href: "/dashboard/agents", label: "Agentes", icon: Bot },
    { href: "/dashboard/approvals", label: "Aprovações", icon: UserCheck },
    { href: "/dashboard/timeline", label: "Timeline", icon: GitBranch },
    { href: "/dashboard/secrets", label: "Secrets", icon: Key },
    { href: "/dashboard/killswitch", label: "Kill Switch", icon: Power },
];

// Items de super admin global
const superAdminItems = [
    { href: "/dashboard/admin/financial", label: "Financial", icon: DollarSign },
    { href: "/dashboard/admin/cognitive", label: "Cognitive", icon: Brain },
];

export function Sidebar() {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const { canManage, isOwner } = useApp();

    const isSuperAdmin = user?.role === "super_admin";
    const isGlobalAdmin = user?.role === "admin" || isSuperAdmin;

    const renderNavItem = (item: typeof coreItems[0], activeColor = "indigo") => {
        const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
        
        const colorClasses = {
            indigo: "bg-indigo-600 shadow-indigo-600/20",
            purple: "bg-purple-600 shadow-purple-600/20",
            rose: "bg-rose-600 shadow-rose-600/20",
            amber: "bg-amber-600 shadow-amber-600/20",
        };

        return (
            <Link
                key={item.href}
                href={item.href}
                className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all",
                    isActive
                        ? `${colorClasses[activeColor as keyof typeof colorClasses]} text-white shadow-lg`
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
            >
                <item.icon className="w-4 h-4" />
                {item.label}
            </Link>
        );
    };

    return (
        <aside className="w-64 border-r border-white/5 bg-[#020617] h-screen sticky top-0 flex flex-col">
            {/* Header com Logo */}
            <div className="h-16 flex items-center px-6 border-b border-white/5">
                <Link href="/" className="font-bold tracking-tighter flex items-center gap-2">
                    <div className="h-6 w-6 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <Shield className="text-white w-3.5 h-3.5" />
                    </div>
                    <span className="text-lg font-black text-white uppercase tracking-tighter">
                        UNO<span className="text-indigo-500">.KERNEL</span>
                    </span>
                </Link>
            </div>

            {/* App Switcher */}
            <div className="p-4 border-b border-white/5">
                <AppSwitcher />
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {/* Core - Todos veem */}
                {coreItems.map(item => renderNavItem(item, "indigo"))}

                {/* Manage - Owner/Admin do app */}
                {canManage && (
                    <>
                        <div className="pt-4 pb-2">
                            <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                Gerenciar
                            </p>
                        </div>
                        {manageItems.map(item => renderNavItem(item, "amber"))}
                    </>
                )}

                {/* Billing - Owner do app */}
                {isOwner && (
                    <>
                        {billingItems.map(item => renderNavItem(item, "indigo"))}
                    </>
                )}

                {/* Docs - Todos */}
                <Link
                    href="/docs/quickstart"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all",
                        pathname.startsWith("/docs")
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                >
                    <BookOpen className="w-4 h-4" />
                    Documentação
                </Link>

                {/* Settings - Todos */}
                <Link
                    href="/dashboard/settings"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all",
                        pathname === "/dashboard/settings"
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                >
                    <Settings className="w-4 h-4" />
                    Configurações
                </Link>

                {/* Governance - Admin global */}
                {isGlobalAdmin && (
                    <>
                        <div className="pt-4 pb-2">
                            <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                Governança
                            </p>
                        </div>
                        {governanceItems.map(item => renderNavItem(item, "purple"))}
                    </>
                )}

                {/* Super Admin - Apenas super_admin */}
                {isSuperAdmin && (
                    <>
                        <div className="pt-4 pb-2">
                            <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                Admin Global
                            </p>
                        </div>
                        {superAdminItems.map(item => renderNavItem(item, "rose"))}
                    </>
                )}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[10px] font-black text-indigo-400">
                        {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="overflow-hidden flex-1">
                        <p className="text-xs font-bold text-white truncate">{user?.name || "User"}</p>
                        <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                    </div>
                    {isSuperAdmin && (
                        <span className="px-1.5 py-0.5 text-[8px] font-bold bg-rose-500/20 text-rose-400 rounded border border-rose-500/30">
                            ROOT
                        </span>
                    )}
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors uppercase tracking-widest"
                >
                    <LogOut className="w-4 h-4" />
                    Sair
                </button>
            </div>
        </aside>
    );
}
