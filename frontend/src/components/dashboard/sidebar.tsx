"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutGrid,
    AppWindow,
    Activity,
    CreditCard,
    Settings,
    LogOut,
    Layers,
    Shield,
    Brain,
    Lock
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const navItems = [
    { href: "/dashboard", label: "Visão Geral", icon: LayoutGrid },
    { href: "/dashboard/apps", label: "Aplicações", icon: AppWindow },
    { href: "/dashboard/events", label: "Eventos", icon: Layers },
    { href: "/dashboard/billing", label: "Economia", icon: CreditCard },
    { href: "/admin/governance", label: "Governança", icon: Shield, adminOnly: true },
    { href: "/admin/intelligence", label: "Inteligência", icon: Brain, adminOnly: true },
    { href: "/dashboard/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { logout, user } = useAuth();

    return (
        <aside className="w-64 border-r border-white/5 bg-[#020617] h-screen sticky top-0 flex flex-col">
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

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    if (item.adminOnly && user?.role !== 'admin') return null;

                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all",
                                isActive
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[10px] font-black text-indigo-400">
                        {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">{user?.name || "User"}</p>
                        <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors uppercase tracking-widest"
                >
                    <LogOut className="w-4 h-4" />
                    Log out from Kernel
                </button>
            </div>
        </aside>
    );
}
