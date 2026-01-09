"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    ShieldAlert,
    Activity,
    LogOut,
    BrainCircuit,
    Settings,
    DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";

const adminNav = [
    { name: "Cognitive View", href: "/admin", icon: BrainCircuit },
    { name: "User Management", href: "/admin/users", icon: Users },
    { name: "Financial Ledger", href: "/admin/payments", icon: DollarSign },
    { name: "System Health", href: "/admin/health", icon: Activity },
    { name: "Security & Risk", href: "/admin/security", icon: ShieldAlert },
    { name: "Platform Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, logout, loading, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        } else if (!loading && user && user.role !== "admin" && user.role !== "super_admin") {
            router.push("/dashboard"); // Kick regular users out
        }
    }, [user, loading, isAuthenticated, router]);

    if (loading) return null;

    return (
        <div className="min-h-screen bg-black text-foreground flex">
            {/* Admin Sidebar - Darker/Red accent */}
            <aside className="w-64 border-r border-red-900/20 bg-black/50 flex flex-col fixed h-full z-50 backdrop-blur-xl">
                <div className="h-16 flex items-center px-6 border-b border-red-900/20">
                    <BrainCircuit className="w-6 h-6 text-red-500 mr-2" />
                    <span className="font-bold tracking-wider text-red-500/90">GOD MODE</span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {adminNav.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                pathname === item.href
                                    ? "bg-red-950/30 text-red-500 border border-red-900/30 shadow-[0_0_15px_-3px_rgba(220,38,38,0.2)]"
                                    : "text-zinc-400 hover:text-red-400 hover:bg-red-950/10"
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-red-900/20">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded bg-red-900/20 flex items-center justify-center text-red-500 font-bold border border-red-900/30">
                            {user?.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate text-red-200">{user?.name}</p>
                            <p className="text-xs text-red-500/60 truncate uppercase">{user?.role}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/20"
                        onClick={logout}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Return to Mortal Plane
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 min-w-0">
                <div className="h-16 border-b border-white/5 bg-black/50 backdrop-blur sticky top-0 z-40 px-8 flex items-center justify-between">
                    <h2 className="font-mono text-xs text-red-500/50 uppercase tracking-[0.2em]">
                        System Level Access • Authorized Personnel Only
                    </h2>
                </div>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
