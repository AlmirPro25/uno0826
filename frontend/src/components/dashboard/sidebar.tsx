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
    Layers
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutGrid },
    { href: "/dashboard/apps", label: "Applications", icon: AppWindow },
    { href: "/dashboard/events", label: "Events", icon: Layers },
    { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { logout, user } = useAuth();

    return (
        <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xl h-screen sticky top-0 flex flex-col">
            <div className="h-16 flex items-center px-6 border-b border-border/50">
                <div className="font-bold tracking-tighter flex items-center gap-2">
                    <div className="h-5 w-5 bg-primary rounded-full" />
                    PROST-QS
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border/50">
                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                        {user?.name?.[0] || "U"}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
