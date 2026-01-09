"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Book, Code, Globe, Shield } from "lucide-react";

const docsNav = [
    {
        title: "Getting Started",
        items: [
            { href: "/docs", label: "Introduction", icon: Book },
            { href: "/docs/quickstart", label: "Quickstart", icon: Zap },
        ]
    },
    {
        title: "Core Concepts",
        items: [
            { href: "/docs/concepts/events", label: "Events", icon: Zap },
            { href: "/docs/concepts/identity", label: "Identity", icon: Shield },
        ]
    },
    {
        title: "API Reference",
        items: [
            { href: "/docs/api/v1", label: "API v1", icon: Globe },
            { href: "/docs/sdks", label: "SDKs", icon: Code },
        ]
    },
];

import { Zap } from "lucide-react";

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="px-6 h-16 flex items-center justify-between border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-md">
                <Link href="/" className="font-bold flex items-center gap-2">
                    <div className="h-5 w-5 bg-primary rounded-full" />
                    PROST-QS <span className="text-muted-foreground font-normal">Docs</span>
                </Link>
                <nav className="flex items-center gap-6 text-sm font-medium">
                    <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">Console</Link>
                    <Link href="/login" className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-xs hover:opacity-90">
                        Sign In
                    </Link>
                </nav>
            </header>

            <div className="flex-1 max-w-7xl w-full mx-auto flex items-start">
                <aside className="w-64 py-8 px-4 hidden md:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
                    {docsNav.map((group) => (
                        <div key={group.title} className="mb-6">
                            <h4 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {group.title}
                            </h4>
                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors",
                                            pathname === item.href
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </aside>

                <main className="flex-1 py-8 px-6 md:px-12 max-w-4xl">
                    {children}
                </main>
            </div>
        </div>
    );
}
