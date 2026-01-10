"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Book, Code, Globe, Shield, Zap, ArrowLeft, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const docsNav = [
    {
        title: "Getting Started",
        items: [
            { href: "/docs", label: "Introdução", icon: Book },
            { href: "/docs/quickstart", label: "Quickstart", icon: Zap },
        ]
    },
    {
        title: "Conceitos",
        items: [
            { href: "/docs/concepts/events", label: "Eventos", icon: Zap },
            { href: "/docs/concepts/identity", label: "Identidade", icon: Shield },
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

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsAuthenticated(!!token);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
            {/* Header */}
            <header className="px-6 h-16 flex items-center justify-between border-b border-white/5 sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link href="/" className="font-black flex items-center gap-2 text-white uppercase tracking-tighter">
                        <div className="h-6 w-6 bg-indigo-600 rounded-lg flex items-center justify-center text-[10px] font-black">
                            P
                        </div>
                        PROST-QS
                    </Link>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400 text-sm font-medium">Docs</span>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
                    {isAuthenticated ? (
                        <Link 
                            href="/dashboard" 
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Console
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" className="text-slate-400 hover:text-white transition-colors">
                                Entrar
                            </Link>
                            <Link 
                                href="/register" 
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 transition-colors"
                            >
                                Criar Conta
                            </Link>
                        </>
                    )}
                </nav>

                {/* Mobile Menu Button */}
                <button 
                    className="md:hidden p-2 text-slate-400 hover:text-white"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </header>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 top-16 z-40 bg-[#0a0a0f] p-6">
                    <nav className="space-y-6">
                        {docsNav.map((group) => (
                            <div key={group.title}>
                                <h4 className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    {group.title}
                                </h4>
                                <div className="space-y-1">
                                    {group.items.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                                pathname === item.href
                                                    ? "bg-indigo-600/20 text-indigo-400"
                                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                                            )}
                                        >
                                            <item.icon className="w-4 h-4" />
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div className="pt-4 border-t border-white/5">
                            {isAuthenticated ? (
                                <Link 
                                    href="/dashboard" 
                                    className="flex items-center gap-2 text-indigo-400 font-bold"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Voltar ao Console
                                </Link>
                            ) : (
                                <Link 
                                    href="/login" 
                                    className="block w-full text-center py-3 bg-indigo-600 text-white rounded-lg font-bold"
                                >
                                    Entrar
                                </Link>
                            )}
                        </div>
                    </nav>
                </div>
            )}

            <div className="flex-1 max-w-7xl w-full mx-auto flex items-start">
                {/* Sidebar */}
                <aside className="w-64 py-8 px-4 hidden md:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-white/5">
                    {docsNav.map((group) => (
                        <div key={group.title} className="mb-6">
                            <h4 className="mb-2 px-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                {group.title}
                            </h4>
                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                            pathname === item.href
                                                ? "bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500"
                                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Back to Dashboard */}
                    {isAuthenticated && (
                        <div className="mt-8 pt-6 border-t border-white/5">
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-indigo-400 hover:bg-indigo-600/10 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar ao Console
                            </Link>
                        </div>
                    )}
                </aside>

                {/* Main Content */}
                <main className="flex-1 py-8 px-6 md:px-12 max-w-4xl">
                    {children}
                </main>
            </div>
        </div>
    );
}
