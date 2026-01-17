"use client";

import { useState } from "react";
import { useApp } from "@/contexts/app-context";
import { ChevronDown, Check, Plus, AppWindow } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function AppSwitcher() {
    const { apps, activeApp, setActiveApp, hasApp, loading } = useApp();
    const [open, setOpen] = useState(false);

    if (loading) {
        return (
            <div className="h-10 w-48 bg-white/5 rounded-xl animate-pulse" />
        );
    }

    if (!hasApp) {
        return (
            <Link href="/onboarding">
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors">
                    <Plus className="w-4 h-4" />
                    Criar App
                </button>
            </Link>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-3 px-4 py-2 bg-accent/5 hover:bg-accent/10 border border-border rounded-xl transition-all"
            >
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <AppWindow className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                    <p className="text-sm font-bold text-foreground truncate max-w-[120px]">
                        {activeApp?.name || "Selecionar App"}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        {activeApp?.role || ""}
                    </p>
                </div>
                <ChevronDown className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    open && "rotate-180"
                )} />
            </button>

            {/* Dropdown */}
            {open && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-64 bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-2 border-b border-border">
                            <p className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                Seus Apps
                            </p>
                        </div>
                        <div className="max-h-64 overflow-y-auto p-2">
                            {apps.map((app) => (
                                <button
                                    key={app.app_id}
                                    onClick={() => {
                                        setActiveApp(app.app_id);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                                        activeApp?.id === app.app_id
                                            ? "bg-primary/20 text-foreground"
                                            : "hover:bg-accent/5 text-muted-foreground"
                                    )}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                        {app.app_name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-bold truncate text-foreground">{app.app_name}</p>
                                        <p className="text-[10px] text-muted-foreground">{app.role}</p>
                                    </div>
                                    {activeApp?.id === app.app_id && (
                                        <Check className="w-4 h-4 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="p-2 border-t border-border">
                            <Link href="/dashboard/apps">
                                <button
                                    onClick={() => setOpen(false)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/5 rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Criar novo app
                                </button>
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
